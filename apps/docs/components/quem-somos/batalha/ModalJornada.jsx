"use client";

import { useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { Cenario } from "./Sprite";
import s from "./batalha.module.css";

// Diálogo modal da jornada (escolha da linguagem, batalha e resultado) sobre a
// página inteira. Renderiza no lugar onde é montado (sem portal): a Vila o
// monta dentro da própria <section>, para ele continuar visível quando a
// section está em tela cheia (requestFullscreen). O overlay é position: fixed;
// em tela cheia, o fixed se resolve dentro do elemento em fullscreen. Atenção:
// um ancestral com transform, filter ou contain prende o fixed nele.
//
// Acessibilidade (WCAG 2.1 AA):
// - role="dialog" + aria-modal, nomeado pelo h2 visível (aria-labelledby);
// - ao abrir, o foco vai para o h2 (tabIndex -1), a menos que um filho já o
//   tenha posto dentro do modal (a Batalha foca a própria caixa de texto);
// - quando o título muda (batalha → resultado), o foco volta para o h2, pois o
//   conteúdo anterior saiu da tela (WCAG 2.4.3);
// - Tab e Shift+Tab ficam presos dentro do painel;
// - Esc fecha só se houver onFechar (no meio da batalha não há: sai-se pelo
//   "Desistir"); com onFechar, também aparece um botão "Fechar" visível;
// - ao desmontar, o foco volta ao elemento que estava focado antes de abrir;
// - a rolagem da página fica travada enquanto o modal está aberto;
// - sem portal, o fundo fica inerte assim: enquanto aberto, os IRMÃOS do
//   overlay dentro do pai imediato recebem o atributo `inert` (fora do alcance
//   do teclado e do leitor de tela), restaurado ao fechar. O que está fora do
//   pai (cabeçalho do site etc.) fica coberto pelo overlay e protegido pelo
//   aria-modal e pela trava de foco; em tela cheia, só a section aparece.
//
// Variantes:
// - "caixa" (padrão): painel centralizado sobre a página escurecida
//   (position: fixed);
// - "tela": cobre o pai posicionado inteiro (position: absolute; inset: 0) —
//   na Vila, a <section class="vila">, também em tela cheia. Entra com a
//   transição clássica de batalha (flash branco + cortina de faixas, ~600 ms)
//   e sai com a inversa (cortina fecha + fade); com prefers-reduced-motion,
//   só um fade curto. Com tituloVisivel={false} (a batalha), o h2 do diálogo
//   fica só para leitor de tela e o conteúdo ocupa a área toda; com título
//   visível (resultado), o conteúdo fica num cartão claro centralizado sobre
//   o cenário do ginásio (prop ginasio = id do chefe).
//
// Para a saída também animar quando o fechamento vem de um botão do
// conteúdo (ex.: "Voltar à vila"), o pai chama ref.current.fechar() em vez
// de onFechar direto: o modal toca a transição e só então chama onFechar.

// Duração da saída (ms): cortina + fade; com movimento reduzido, só o fade.
// Igual às animações do CSS (.telaFundo[data-saindo]).
const SAIDA_MS = 520;
const SAIDA_REDUZIDA_MS = 180;

const FOCAVEIS = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

// Elementos do painel alcançáveis pelo Tab (visíveis e não removidos da ordem).
function focaveis(painel) {
  return [...painel.querySelectorAll(FOCAVEIS)].filter(
    (el) => el.tabIndex >= 0 && el.getClientRects().length > 0
  );
}

// Trava da rolagem com contador: se dois modais se sobrepuserem, a página só
// volta a rolar quando o último fechar.
let travas = 0;
function travarRolagem() {
  travas += 1;
  if (travas === 1) {
    document.documentElement.classList.add(s.rolagemTravada);
    document.body.classList.add(s.rolagemTravada);
  }
}
function liberarRolagem() {
  travas = Math.max(0, travas - 1);
  if (travas === 0) {
    document.documentElement.classList.remove(s.rolagemTravada);
    document.body.classList.remove(s.rolagemTravada);
  }
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

export default function ModalJornada({
  titulo,
  onFechar,
  children,
  variante = "caixa",
  tituloVisivel = true,
  ginasio,
  ref,
}) {
  const tela = variante === "tela";
  const tituloId = useId();
  const fundoRef = useRef(null);
  const painelRef = useRef(null);
  const tituloRef = useRef(null);
  // Quem tinha o foco antes de abrir (lido na primeira renderização, antes de
  // qualquer efeito mover o foco).
  const [anterior] = useState(() => (typeof document === "undefined" ? null : document.activeElement));
  // onFechar pode mudar de identidade (ou passar a existir) sem reinstalar os ouvintes.
  const onFecharRef = useRef(onFechar);
  useEffect(() => {
    onFecharRef.current = onFechar;
  }, [onFechar]);

  // Fecha com a transição de saída (variante "tela"); só depois chama onFechar.
  const [saindo, setSaindo] = useState(false);
  const saindoRef = useRef(false);
  const saidaTimer = useRef(null);
  const fechar = useCallback(() => {
    const cb = onFecharRef.current;
    if (!cb || saindoRef.current) return;
    if (!tela) {
      cb();
      return;
    }
    saindoRef.current = true;
    setSaindo(true);
    const reduzido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    saidaTimer.current = setTimeout(() => onFecharRef.current?.(), reduzido ? SAIDA_REDUZIDA_MS : SAIDA_MS);
  }, [tela]);
  useImperativeHandle(ref, () => ({ fechar }), [fechar]);
  useEffect(() => () => clearTimeout(saidaTimer.current), []);
  const fecharRef = useRef(fechar);
  useEffect(() => {
    fecharRef.current = fechar;
  }, [fechar]);

  // Abertura: trava a rolagem, põe o foco no modal e prende Tab/Esc.
  useEffect(() => {
    const painel = painelRef.current;
    travarRolagem();
    const desfazerInert = inertizarIrmaos(fundoRef.current);
    if (!painel.contains(document.activeElement)) tituloRef.current?.focus();

    let voltando = false; // último Tab foi com Shift?

    function aoTeclar(e) {
      if (e.key === "Escape") {
        if (!onFecharRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        fecharRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      voltando = e.shiftKey;
      const lista = focaveis(painel);
      const ativo = document.activeElement;
      if (lista.length === 0) {
        e.preventDefault();
        tituloRef.current?.focus();
        return;
      }
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      if (!painel.contains(ativo)) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primeiro).focus();
      } else if (e.shiftKey && (ativo === primeiro || ativo === tituloRef.current)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && ativo === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }

    // Rede de segurança: se o foco escapar por outro caminho (por exemplo, Tab
    // a partir de um elemento com tabIndex -1), ele volta para dentro.
    function aoFocar(e) {
      if (painel.contains(e.target)) return;
      const lista = focaveis(painel);
      const alvo = lista.length ? (voltando ? lista[lista.length - 1] : lista[0]) : tituloRef.current;
      alvo?.focus();
    }

    document.addEventListener("keydown", aoTeclar, true);
    document.addEventListener("focusin", aoFocar, true);
    return () => {
      document.removeEventListener("keydown", aoTeclar, true);
      document.removeEventListener("focusin", aoFocar, true);
      liberarRolagem();
      desfazerInert();
      if (anterior && anterior.isConnected && typeof anterior.focus === "function") anterior.focus();
    };
  }, [anterior]);

  // Troca de conteúdo (novo título): o foco vai para o novo h2. Compara com o
  // título anterior, e não com "já montou", por causa do modo estrito.
  const tituloAnterior = useRef(titulo);
  useEffect(() => {
    if (tituloAnterior.current === titulo) return;
    tituloAnterior.current = titulo;
    tituloRef.current?.focus();
  }, [titulo]);

  const tituloEl = (
    <h2
      ref={tituloRef}
      id={tituloId}
      tabIndex={-1}
      className={tituloVisivel ? s.titulo : `${s.titulo} sr-only`}
    >
      {titulo}
    </h2>
  );
  const botaoFechar = onFechar && (
    <button type="button" className={s.botaoSecundario} onClick={fechar}>
      Fechar
    </button>
  );

  if (tela) {
    return (
      <div ref={fundoRef} className={s.telaFundo} data-saindo={saindo || undefined}>
        <div
          ref={painelRef}
          className={tituloVisivel ? `${s.telaPainel} ${s.cenario}` : s.telaPainel}
          data-cheio={!tituloVisivel || undefined}
          data-ginasio={ginasio}
          role="dialog"
          aria-modal="true"
          aria-labelledby={tituloId}
        >
          {tituloVisivel ? (
            <>
              {ginasio && <Cenario chefeId={ginasio} />}
              <div className={s.telaCartao}>
                <div className={s.jornada}>
                  <div className={s.modalTopo}>
                    {tituloEl}
                    {botaoFechar}
                  </div>
                  {children}
                </div>
              </div>
            </>
          ) : (
            <>
              {tituloEl}
              {children}
            </>
          )}
        </div>
        {/* Transição de batalha: faixas da cortina e flash (decorativos). */}
        <div className={s.cortina} aria-hidden="true" />
        <div className={s.flash} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div ref={fundoRef} className={s.modalFundo}>
      <div ref={painelRef} className={s.modalPainel} role="dialog" aria-modal="true" aria-labelledby={tituloId}>
        <div className={s.jornada}>
          <div className={s.modalTopo}>
            {tituloEl}
            {botaoFechar}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
