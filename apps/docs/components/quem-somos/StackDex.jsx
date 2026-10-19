"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FICHAS_INSIGNIAS, INSIGNIAS, urlInsignia } from "./insignias";
import s from "./StackDex.module.css";

// StackDex: a coleção das 8 insígnias (Stacks) em tela cheia, num aparelho
// próprio da Vila SEMEC (enciclopédia portátil de RPG). Aberta por um botão
// do HUD; cobre o pai posicionado inteiro (na Vila, a <section class="vila">,
// também em tela cheia): position: absolute; inset: 0.
//
// Props:
// - itens: [{ id, ok }] — id de insignias.js; ok = conquistada. Ids sem ficha
//   são ignorados; a ordem exibida é a do número da ficha.
// - onFechar(): chamado pelo botão Fechar e pelo Esc. O pai desmonta o
//   componente; ao desmontar, o foco volta ao elemento focado antes de abrir
//   (o botão do HUD), se ele ainda existir.
//
// Acessibilidade (WCAG 2.1 AA):
// - role="dialog" + aria-modal, nomeado pelo h2 visível "StackDex";
// - sem portal: os IRMÃOS do overlay no pai recebem `inert` enquanto aberto
//   (como Campanha e ModalJornada); Tab e Shift+Tab ficam presos no diálogo;
// - a coleção é um listbox de seleção única com dois grupos (Ginásios,
//   Especiais) e roving tabindex: o foco real fica na opção ativa (padrão
//   mais robusto com leitores de tela que o aria-activedescendant). Setas
//   andam pela grade (cima/baixo pela posição na tela, então funciona com 4
//   colunas ou qualquer outra), Home/End vão às pontas; a seleção acompanha
//   o foco e Enter/Espaço/clique também selecionam (no celular, levam ao
//   painel de detalhe, que fica embaixo);
// - ao abrir, o foco vai para a insígnia selecionada (a 1ª conquistada).
// - não conquistada: silhueta + "???"; a dica de como conquistar aparece,
//   mas "O que representa" fica bloqueado (o texto nem vai para o DOM).

const FOCAVEIS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function focaveis(painel) {
  return [...painel.querySelectorAll(FOCAVEIS)].filter((el) => el.tabIndex >= 0 && el.getClientRects().length > 0);
}

// Marca como inertes os irmãos do overlay; devolve a função que desfaz (só
// nos que não eram inertes antes).
function inertizarIrmaos(fundo) {
  const pai = fundo?.parentElement;
  if (!pai) return () => {};
  const marcados = [...pai.children].filter((el) => el !== fundo && !el.inert);
  for (const el of marcados) el.inert = true;
  return () => {
    for (const el of marcados) el.inert = false;
  };
}

const GRUPOS = [
  { id: "ginasio", titulo: "Ginásios", singular: "Ginásio" },
  { id: "especial", titulo: "Especiais", singular: "Especial" },
];

const numero3 = (n) => String(n).padStart(3, "0");

// Próxima opção pela posição na tela: a mais próxima na linha de cima/baixo
// (menor distância vertical; empate pela horizontal).
function vizinhaVertical(botoes, atual, direcao) {
  const ref = botoes[atual]?.getBoundingClientRect();
  if (!ref) return atual;
  const cx = ref.left + ref.width / 2;
  let melhor = atual;
  let melhorDy = Infinity;
  let melhorDx = Infinity;
  botoes.forEach((el, i) => {
    if (!el || i === atual) return;
    const r = el.getBoundingClientRect();
    const dy = direcao > 0 ? r.top - ref.bottom : ref.top - r.bottom;
    if (dy < -2) return; // mesma linha ou na direção contrária
    const dx = Math.abs(r.left + r.width / 2 - cx);
    if (dy < melhorDy - 2 || (Math.abs(dy - melhorDy) <= 2 && dx < melhorDx)) {
      melhor = i;
      melhorDy = dy;
      melhorDx = dx;
    }
  });
  return melhor;
}

function movimentoReduzido() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export default function StackDex({ itens = [], onFechar }) {
  const uid = useId();
  const tituloId = `${uid}-titulo`;
  const detalheId = `${uid}-detalhe`;
  const fundoRef = useRef(null);
  const painelRef = useRef(null);
  const detalheRef = useRef(null);
  const botoesRef = useRef([]);

  // Ordem do número da ficha; só ids conhecidos.
  const lista = itens
    .filter((it) => FICHAS_INSIGNIAS[it.id] && INSIGNIAS.includes(it.id))
    .map((it) => ({ id: it.id, ok: Boolean(it.ok), ficha: FICHAS_INSIGNIAS[it.id] }))
    .sort((a, b) => a.ficha.numero - b.ficha.numero);
  const total = lista.length;
  const conquistadas = lista.filter((it) => it.ok).length;

  const [selId, setSelId] = useState(() => (lista.find((it) => it.ok) ?? lista[0])?.id ?? null);
  const selIdx = Math.max(0, lista.findIndex((it) => it.id === selId));
  const sel = lista[selIdx] ?? null;

  // Quem tinha o foco antes de abrir (o botão do HUD): recebe-o de volta.
  const [anterior] = useState(() => (typeof document === "undefined" ? null : document.activeElement));

  const onFecharRef = useRef(onFechar);
  useEffect(() => {
    onFecharRef.current = onFechar;
  }, [onFechar]);

  // Abertura: fundo inerte, foco na insígnia selecionada, Tab circular, Esc
  // fecha; ao desmontar, o foco volta.
  useEffect(() => {
    const painel = painelRef.current;
    const desfazerInert = inertizarIrmaos(fundoRef.current);
    const inicial = painel.querySelector("[role='option'][tabindex='0']") ?? painel.querySelector("h2");
    inicial?.focus({ preventScroll: true });
    let voltando = false;

    function aoTeclar(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onFecharRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      voltando = e.shiftKey;
      const alvos = focaveis(painel);
      const ativo = document.activeElement;
      if (alvos.length === 0) {
        e.preventDefault();
        return;
      }
      const primeiro = alvos[0];
      const ultimo = alvos[alvos.length - 1];
      if (!painel.contains(ativo)) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primeiro).focus();
      } else if (e.shiftKey && ativo === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && ativo === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
    function aoFocar(e) {
      if (painel.contains(e.target)) return;
      const alvos = focaveis(painel);
      (voltando ? alvos[alvos.length - 1] : alvos[0])?.focus();
    }

    document.addEventListener("keydown", aoTeclar, true);
    document.addEventListener("focusin", aoFocar, true);
    return () => {
      document.removeEventListener("keydown", aoTeclar, true);
      document.removeEventListener("focusin", aoFocar, true);
      desfazerInert();
      if (anterior && anterior.isConnected && typeof anterior.focus === "function") anterior.focus();
    };
  }, [anterior]);

  const irPara = (i) => {
    const alvo = lista[i];
    if (!alvo) return;
    setSelId(alvo.id);
    botoesRef.current[i]?.focus();
  };

  // No celular o detalhe fica embaixo da lista (o corpo rola): confirmar a
  // escolha leva até ele.
  const mostrarDetalhe = () => {
    const det = detalheRef.current;
    const corpo = det?.parentElement;
    if (!det || !corpo || corpo.scrollHeight <= corpo.clientHeight + 1) return;
    const dy = det.getBoundingClientRect().top - corpo.getBoundingClientRect().top;
    if (dy < 16) return;
    // scrollTo no próprio corpo (scrollIntoView rolaria a página também).
    corpo.scrollTo({ top: corpo.scrollTop + dy - 4, behavior: movimentoReduzido() ? "auto" : "smooth" });
  };

  const aoTeclarLista = (e) => {
    const botoes = botoesRef.current;
    let prox = null;
    switch (e.key) {
      case "ArrowRight":
        prox = Math.min(total - 1, selIdx + 1);
        break;
      case "ArrowLeft":
        prox = Math.max(0, selIdx - 1);
        break;
      case "ArrowDown":
        prox = vizinhaVertical(botoes, selIdx, 1);
        break;
      case "ArrowUp":
        prox = vizinhaVertical(botoes, selIdx, -1);
        break;
      case "Home":
        prox = 0;
        break;
      case "End":
        prox = total - 1;
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        mostrarDetalhe();
        return;
      default:
        return;
    }
    e.preventDefault();
    irPara(prox);
  };

  const urlSel = sel ? urlInsignia(sel.id) : null;

  return (
    <div ref={fundoRef} className={s.fundo}>
      <div ref={painelRef} className={s.dex} role="dialog" aria-modal="true" aria-labelledby={tituloId}>
        <div className={s.aparelho}>
          {/* Tampa que se abre ao entrar (decorativa). */}
          <div className={s.tampa} aria-hidden="true">
            <span className={s.tampaSelo}>StackDex</span>
          </div>

          <header className={s.topo}>
            <span className={s.lente} aria-hidden="true" />
            <span className={s.luzes} aria-hidden="true">
              <span className={s.luz} data-luz="vermelha" />
              <span className={s.luz} data-luz="amarela" />
              <span className={s.luz} data-luz="verde" />
            </span>
            <div className={s.marca}>
              <h2 id={tituloId} className={s.titulo} tabIndex={-1}>
                StackDex
              </h2>
              <p className={s.subtitulo}>Coleção de insígnias da Vila SEMEC</p>
            </div>
            <p className={s.contador}>
              <strong>{conquistadas}</strong> de {total} insígnias
            </p>
            <button type="button" className={s.fechar} onClick={() => onFecharRef.current?.()}>
              Fechar
            </button>
          </header>

          <div className={s.corpo}>
            <section className={`${s.tela} ${s.telaLista}`} aria-label="Insígnias">
              {total === 0 ? (
                <p className={s.vazio}>Nenhuma insígnia por aqui ainda.</p>
              ) : (
                <div
                  role="listbox"
                  aria-label={`Insígnias: ${conquistadas} de ${total} conquistadas`}
                  aria-orientation="horizontal"
                  className={s.listbox}
                >
                  {GRUPOS.map((g) => {
                    const doGrupo = lista.filter((it) => it.ficha.grupo === g.id);
                    if (doGrupo.length === 0) return null;
                    const ok = doGrupo.filter((it) => it.ok).length;
                    return (
                      <div key={g.id} role="group" aria-label={`${g.titulo}, ${ok} de ${doGrupo.length}`} className={s.grupo}>
                        <div className={s.grupoTitulo} aria-hidden="true">
                          <span>{g.titulo}</span>
                          <span className={s.grupoConta}>
                            {ok}/{doGrupo.length}
                          </span>
                        </div>
                        <div className={s.grade}>
                          {doGrupo.map((it) => {
                            const i = lista.indexOf(it);
                            const ativo = i === selIdx;
                            return (
                              <div
                                key={it.id}
                                id={`${uid}-op-${it.id}`}
                                ref={(el) => {
                                  botoesRef.current[i] = el;
                                }}
                                role="option"
                                aria-selected={ativo}
                                aria-controls={detalheId}
                                aria-label={`Número ${it.ficha.numero}, ${it.ok ? `${it.ficha.nome}, conquistada` : "não conquistada"}`}
                                tabIndex={ativo ? 0 : -1}
                                className={s.opcao}
                                data-ok={it.ok || undefined}
                                data-cor={it.ficha.cor}
                                onKeyDown={aoTeclarLista}
                                onClick={() => {
                                  irPara(i);
                                  mostrarDetalhe();
                                }}
                              >
                                <span className={s.opcaoNum} aria-hidden="true">
                                  #{numero3(it.ficha.numero)}
                                </span>
                                <span className={s.opcaoArte} aria-hidden="true">
                                  {/* eslint-disable-next-line @next/next/no-img-element -- export estático, imagem pequena já otimizada */}
                                  <img
                                    className={s.opcaoImg}
                                    src={urlInsignia(it.id)}
                                    alt=""
                                    width={160}
                                    height={160}
                                    decoding="async"
                                    draggable={false}
                                  />
                                </span>
                                <span className={s.opcaoNome} aria-hidden="true">
                                  {it.ok ? it.ficha.nome : "???"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <span className={s.dobradica} aria-hidden="true" />

            <section
              ref={detalheRef}
              id={detalheId}
              className={`${s.tela} ${s.telaDetalhe}`}
              aria-labelledby={sel ? `${detalheId}-nome` : undefined}
              aria-label={sel ? undefined : "Detalhe"}
              data-ok={sel?.ok || undefined}
              data-cor={sel?.ficha.cor}
            >
              {sel && (
                <>
                  <div className={s.detalheTopo}>
                    <span className={s.detalheNum}>
                      <span className={s.srOnly}>Número {sel.ficha.numero}</span>
                      <span aria-hidden="true">#{numero3(sel.ficha.numero)}</span>
                    </span>
                    <span className={s.selo}>{GRUPOS.find((g) => g.id === sel.ficha.grupo)?.singular}</span>
                    <span className={s.estado}>{sel.ok ? "Conquistada" : "Não conquistada"}</span>
                  </div>

                  <div className={s.palco}>
                    <div className={s.pedestal}>
                      <div key={sel.id} className={s.figura}>
                        {urlSel && (
                          // eslint-disable-next-line @next/next/no-img-element -- export estático, imagem pequena já otimizada
                          <img
                            className={s.figuraImg}
                            src={urlSel}
                            alt={sel.ok ? sel.ficha.nome : "Insígnia não conquistada"}
                            width={160}
                            height={160}
                            decoding="async"
                            draggable={false}
                          />
                        )}
                      </div>
                    </div>
                    <span className={s.base} aria-hidden="true" />
                  </div>

                  <div className={s.ficha}>
                    <h3 id={`${detalheId}-nome`} className={s.nome}>
                      {sel.ok ? (
                        sel.ficha.nome
                      ) : (
                        <>
                          <span aria-hidden="true">???</span>
                          <span className={s.srOnly}>Insígnia não conquistada</span>
                        </>
                      )}
                    </h3>
                    {sel.ok && <p className={s.forma}>{sel.ficha.forma}</p>}
                    <div className={s.bloco}>
                      <h4 className={s.blocoTitulo}>Como conquistar</h4>
                      <p>{sel.ficha.comoGanhar}</p>
                    </div>
                    <div className={s.bloco}>
                      <h4 className={s.blocoTitulo}>O que representa</h4>
                      {sel.ok ? (
                        <p>{sel.ficha.oQueE}</p>
                      ) : (
                        <div className={s.bloqueado}>
                          <span className={s.borrao} aria-hidden="true" />
                          <p className={s.bloqueadoTexto}>
                            <span className={s.cadeado} aria-hidden="true" />
                            Conquiste para desbloquear
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          <span className={s.altoFalante} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
