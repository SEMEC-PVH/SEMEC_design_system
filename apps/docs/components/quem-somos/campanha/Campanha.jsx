"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ESTRELAS_PARA_VENCER, PASSOS, RODADAS, engajamento, estrelas } from "./dados.js";
import s from "./Campanha.module.css";

// Mini game "Campanha da SEMEC" (quest da Emily): 3 rodadas; em cada uma a
// Emily traz um briefing e o jogador monta o post em 5 escolhas, vendo a
// prévia se montar ao lado. No fim de cada rodada o post é "publicado"
// (contadores sobem até engajamento()) e cada escolha ganha ✓/~/✗ e o porquê.
//
// Props:
// - onFim({ venceu, estrelas, pontos }): chamado no "Comemorar" da vitória
//   (venceu: true). estrelas = soma das 3 rodadas (máx. 9); pontos = soma dos
//   pontos (máx. 30). Na derrota o jogador escolhe "Tentar de novo"
//   (recomeça aqui dentro) ou "Sair".
// - onSair(): botão "Sair" (sempre visível) e Esc.
//
// Modal que cobre o pai posicionado inteiro (position: absolute; inset: 0),
// como a batalha: na Vila, renderizar dentro da <section> do jogo (assim
// continua visível em tela cheia). Sem portal; os irmãos do overlay ficam
// `inert` enquanto ele está aberto, e o foco volta a quem o tinha ao fechar.
//
// Acessibilidade (WCAG 2.1 AA): role="dialog" + aria-modal nomeado pelo h2;
// a cada tela o foco vai para o título dela (tabIndex -1); Tab circular dentro
// do modal; região aria-live curta anuncia a etapa; opções são rádios nativos
// (setas trocam a escolha, Enter confirma); contadores animados são
// aria-hidden, com o valor final em texto só para leitor de tela.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const urlFoto = (imagem) => `${BASE}/quem-somos/campanha/${imagem}.webp`;
const URL_EMILY = `${BASE}/quem-somos/fichas/emily.webp`;
const URL_MICROFONE = `${BASE}/quem-somos/fichas/microfone.webp`;

const ROTULOS = {
  publico: "Público",
  canal: "Canal",
  titulo: "Título",
  arte: "Arte",
  alt: "Descrição da imagem",
};
// Ícone decorativo do placeholder de cada foto (enquanto ela não existe).
const ICONES = { matricula: "🎒", vacina: "💉", robotica: "🤖" };

const NOTAS = [
  { marca: "✗", texto: "Não funcionou", nivel: "ruim" },
  { marca: "~", texto: "Pode melhorar", nivel: "medio" },
  { marca: "✓", texto: "Ótima escolha", nivel: "bom" },
];

const MAX_ESTRELAS = RODADAS.length * 3;
const DURACAO_CONTAGEM = 1500;

const FOCAVEIS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

// Alcançáveis pelo Tab: visíveis, fora de -1 e, nos rádios, só o do grupo que
// recebe o Tab (o marcado; sem marcado, o primeiro).
function focaveis(painel) {
  return [...painel.querySelectorAll(FOCAVEIS)].filter((el) => {
    if (el.tabIndex < 0 || el.getClientRects().length === 0) return false;
    if (el.type !== "radio") return true;
    const grupo = [...painel.querySelectorAll(`input[type='radio'][name='${CSS.escape(el.name)}']`)];
    const marcado = grupo.find((r) => r.checked);
    return marcado ? el === marcado : el === grupo[0];
  });
}

function inertizarIrmaos(fundo) {
  const pai = fundo?.parentElement;
  if (!pai) return () => {};
  const marcados = [...pai.children].filter((el) => el !== fundo && !el.inert);
  for (const el of marcados) el.inert = true;
  return () => {
    for (const el of marcados) el.inert = false;
  };
}

const pontosDaRodada = (rodada, escolhas) =>
  rodada.passos.reduce((soma, passo, i) => soma + (escolhas[i] == null ? 0 : passo.opcoes[escolhas[i]].pontos), 0);

const formatar = (n) => n.toLocaleString("pt-BR");

// ---- Imagens ----------------------------------------------------------------

// Estado de carregamento por URL (o componente é remontado com key={src}).
// A ref cobre o caso de a imagem já ter falhado antes da hidratação.
function useCarregamento() {
  const [estado, setEstado] = useState("carregando");
  const ref = useCallback((img) => {
    if (img && img.complete) setEstado(img.naturalWidth > 0 ? "ok" : "erro");
  }, []);
  return {
    estado,
    ref,
    aoCarregar: () => setEstado("ok"),
    aoFalhar: () => setEstado("erro"),
  };
}

// Foto do post. O placeholder desenhado em CSS fica por baixo até a foto
// carregar; se ela não existir, o placeholder assume o papel de imagem
// (role="img" com o mesmo texto alternativo).
function FotoPost({ rodada, alt }) {
  const src = urlFoto(rodada.imagem);
  const { estado, ref, aoCarregar, aoFalhar } = useCarregamento();
  return (
    <div className={s.foto} data-rodada={rodada.id} data-estado={estado}>
      {estado === "erro" ? (
        <div className={s.fotoFalsa} role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
          <span className={s.fotoIcone} aria-hidden="true">
            {ICONES[rodada.id] ?? "📣"}
          </span>
        </div>
      ) : (
        <>
          <div className={s.fotoFalsa} aria-hidden="true">
            <span className={s.fotoIcone}>{ICONES[rodada.id] ?? "📣"}</span>
          </div>
          {/* <img> simples: export estático sem otimização; alt é a descrição escolhida. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={ref}
            className={s.fotoImg}
            src={src}
            alt={alt}
            draggable={false}
            onLoad={aoCarregar}
            onError={aoFalhar}
          />
        </>
      )}
    </div>
  );
}

// Retrato pequeno (Emily ou o microfone), decorativo; some se faltar.
function Avatar({ src, className }) {
  const { estado, ref, aoCarregar, aoFalhar } = useCarregamento();
  if (estado === "erro") return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      className={className}
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      onLoad={aoCarregar}
      onError={aoFalhar}
    />
  );
}

// ---- Contadores -------------------------------------------------------------

// Fração 0→1 em DURACAO_CONTAGEM ms (ease-out); 1 direto com movimento reduzido.
function useProgresso() {
  const [t, setT] = useState(() =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 1 : 0
  );
  const inicial = useRef(t);
  useEffect(() => {
    if (inicial.current >= 1) return undefined;
    let quadro;
    const inicio = performance.now();
    const passo = (agora) => {
      const x = Math.min(1, (agora - inicio) / DURACAO_CONTAGEM);
      setT(1 - (1 - x) ** 3);
      if (x < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, []);
  return t;
}

function Estrelas({ n, max = 3, grande = false }) {
  return (
    <p className={s.estrelas} data-grande={grande || undefined}>
      <span aria-hidden="true">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={s.estrela} data-acesa={i < n}>
            ★
          </span>
        ))}
      </span>
      <span className={s.srOnly}>
        {n} de {max} estrelas
      </span>
    </p>
  );
}

// ---- Prévia do post ---------------------------------------------------------

// Post montado com as escolhas até agora (índices em `escolhas`, null =
// ainda não escolhido). `contadores` = { curtidas, comentarios,
// compartilhamentos } já no valor a exibir; sem ele, rodapé zerado.
function Post({ rodada, escolhas, publicado = false, contadores, contadoresFinais }) {
  const opcao = (id) => {
    const i = PASSOS.indexOf(id);
    const j = escolhas[i];
    return j == null ? null : rodada.passos[i].opcoes[j];
  };
  const canal = opcao("canal");
  const titulo = opcao("titulo");
  const arte = opcao("arte");
  const alt = opcao("alt");
  const layout = arte?.layout ?? "pendente";
  const textoTitulo = titulo?.texto;

  return (
    <article className={s.post} aria-label={publicado ? "Post publicado" : "Prévia do post"} data-publicado={publicado || undefined}>
      <header className={s.postTopo}>
        <span className={s.postAvatar} aria-hidden="true">
          S
        </span>
        <span className={s.postPerfil}>
          <span className={s.postNome}>SEMEC Porto Velho</span>
          <span className={s.postSub}>{publicado ? "Publicado agora" : "Rascunho"}</span>
        </span>
        <span className={s.selo} data-vazio={!canal || undefined}>
          {canal ? canal.texto : "Canal?"}
        </span>
      </header>

      {layout === "texto" ? (
        <div className={s.postTexto}>
          <p className={s.postTextoTitulo}>{textoTitulo ?? rodada.titulo}</p>
          <p className={s.postTextoCorpo}>{rodada.briefing}</p>
        </div>
      ) : (
        <div className={s.postMidia} data-layout={layout}>
          <FotoPost key={rodada.imagem} rodada={rodada} alt={alt?.texto ?? ""} />
          {layout === "destaque" && (
            <p className={s.faixaDestaque}>{textoTitulo ?? rodada.titulo}</p>
          )}
          {layout === "apagado" && (
            // Erro proposital (é o que a escolha ensina): título claro e
            // pequeno sobre a foto. Só nesta ilustração; o texto segue
            // disponível ao leitor de tela.
            <p className={s.tituloApagado}>{textoTitulo ?? rodada.titulo}</p>
          )}
        </div>
      )}

      <div className={s.postCorpo}>
        {textoTitulo ? (
          <p className={s.postLegenda}>
            <strong>semecpvh</strong> {textoTitulo}
          </p>
        ) : (
          <p className={s.postLegenda} data-vazio="">
            Título do post…
          </p>
        )}
        {layout !== "texto" && (
          <p className={s.postAlt} aria-hidden="true">
            <span className={s.postAltRotulo}>ALT</span>
            <span>{alt ? alt.texto : "sem descrição"}</span>
          </p>
        )}
      </div>

      <footer className={s.postRodape}>
        <span aria-hidden="true" className={s.contadores}>
          <span className={s.contador}>
            <span className={s.contadorIcone}>♥</span> {formatar(contadores?.curtidas ?? 0)}
          </span>
          <span className={s.contador}>
            <span className={s.contadorIcone}>💬</span> {formatar(contadores?.comentarios ?? 0)}
          </span>
          <span className={s.contador}>
            <span className={s.contadorIcone}>↗</span> {formatar(contadores?.compartilhamentos ?? 0)}
          </span>
        </span>
        {contadoresFinais && (
          <span className={s.srOnly}>
            {formatar(contadoresFinais.curtidas)} curtidas, {formatar(contadoresFinais.comentarios)} comentários e{" "}
            {formatar(contadoresFinais.compartilhamentos)} compartilhamentos.
          </span>
        )}
      </footer>
    </article>
  );
}

// ---- Telas ------------------------------------------------------------------

function Briefing({ rodada, indice, tituloRef, onComecar }) {
  return (
    <div className={s.briefing}>
      <div className={s.briefingPersonagens} aria-hidden="true">
        <Avatar src={URL_EMILY} className={s.briefingEmily} />
        <Avatar src={URL_MICROFONE} className={s.briefingMic} />
      </div>
      <div className={s.balao}>
        <p className={s.sobretitulo}>
          Campanha {indice + 1} de {RODADAS.length} · Pauta da Emily
        </p>
        <h3 ref={tituloRef} tabIndex={-1} className={s.telaTitulo}>
          {rodada.titulo}
        </h3>
        <p className={s.briefingTexto}>{rodada.briefing}</p>
        <p className={s.briefingDica}>Monte o post em 5 escolhas: público, canal, título, arte e descrição da imagem.</p>
        <div className={s.acoes}>
          <button type="button" className={s.botaoPrimario} onClick={onComecar}>
            Montar o post
          </button>
        </div>
      </div>
    </div>
  );
}

function Passo({ rodada, passoIdx, escolhas, selecao, onSelecionar, onConfirmar, onVoltar, tituloRef }) {
  const passo = rodada.passos[passoIdx];
  const perguntaId = useId();
  const dicaId = useId();
  const ultimo = passoIdx === PASSOS.length - 1;
  // A prévia já mostra a opção marcada (antes de confirmar).
  const previa = escolhas.map((e, i) => (i === passoIdx ? selecao : e));

  return (
    <div className={s.montagem}>
      {/* Pauta da Emily: a campanha, o briefing e os 5 passos com o que já
          foi escolhido (decorativa: o leitor de tela ouve o passo no h3). */}
      <aside className={s.pauta} aria-hidden="true">
        <div className={s.pautaTopo}>
          <span className={s.pautaRetratos}>
            <Avatar src={URL_EMILY} className={s.pautaEmily} />
            <Avatar src={URL_MICROFONE} className={s.pautaMic} />
          </span>
          <span className={s.pautaTitulos}>
            <span className={s.sobretitulo}>Pauta da Emily</span>
            <span className={s.pautaCampanha}>{rodada.titulo}</span>
          </span>
        </div>
        <p className={s.pautaBriefing}>{rodada.briefing}</p>
        <ol className={s.passos}>
          {PASSOS.map((id, i) => {
            const estado = i < passoIdx ? "feito" : i === passoIdx ? "atual" : "falta";
            const feito = estado === "feito" ? rodada.passos[i].opcoes[escolhas[i]]?.texto : null;
            return (
              <li key={id} className={s.passoItem} data-estado={estado}>
                <span className={s.passoNumero}>{estado === "feito" ? "✓" : i + 1}</span>
                <span className={s.passoTexto}>
                  <span className={s.passoNome}>{ROTULOS[id]}</span>
                  {feito && <span className={s.passoEscolha}>{feito}</span>}
                </span>
              </li>
            );
          })}
        </ol>
      </aside>

      <form
        className={s.formulario}
        onSubmit={(e) => {
          e.preventDefault();
          if (selecao != null) onConfirmar();
        }}
      >
        <p className={s.progressoTexto}>
          {rodada.titulo} · Passo {passoIdx + 1} de {PASSOS.length}
        </p>

        <fieldset className={s.grupo} aria-labelledby={perguntaId} aria-describedby={selecao == null ? dicaId : undefined}>
          <h3 id={perguntaId} ref={tituloRef} tabIndex={-1} className={s.telaTitulo}>
            {passo.pergunta}
          </h3>
          <div className={s.opcoes}>
            {passo.opcoes.map((op, i) => (
              <label key={op.texto} className={s.opcao} data-marcada={selecao === i || undefined}>
                <input
                  type="radio"
                  className={s.radio}
                  name={`campanha-${rodada.id}-${passo.id}`}
                  value={i}
                  checked={selecao === i}
                  onChange={() => onSelecionar(i)}
                  onKeyDown={(e) => {
                    // Enter num rádio confirma (como o botão Próximo).
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (selecao != null) onConfirmar();
                    }
                  }}
                />
                <span className={s.opcaoLetra} aria-hidden="true">
                  {"ABC"[i]}
                </span>
                <span className={s.opcaoTexto}>{op.texto}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <p id={dicaId} className={s.dica} data-oculta={selecao != null || undefined}>
          Escolha uma opção para continuar (use as setas para trocar).
        </p>

        <div className={s.acoes}>
          <button type="button" className={s.botaoSecundario} onClick={onVoltar}>
            Voltar
          </button>
          <button type="submit" className={s.botaoPrimario} disabled={selecao == null}>
            {ultimo ? "Publicar post" : "Próximo"}
          </button>
        </div>
      </form>

      <div className={s.previa}>
        <p className={s.previaRotulo} aria-hidden="true">
          Prévia do post
        </p>
        <div className={s.celular}>
          <Post rodada={rodada} escolhas={previa} />
        </div>
      </div>
    </div>
  );
}

function Resultado({ rodada, indice, escolhas, tituloRef, onProxima }) {
  const pontos = pontosDaRodada(rodada, escolhas);
  const n = estrelas(pontos);
  const finais = engajamento(rodada, pontos);
  const t = useProgresso();
  const atuais = {
    curtidas: Math.round(finais.curtidas * t),
    comentarios: Math.round(finais.comentarios * t),
    compartilhamentos: Math.round(finais.compartilhamentos * t),
  };
  const ultima = indice === RODADAS.length - 1;
  const recado =
    n === 3 ? "Post perfeito! A mensagem chegou em quem precisava, e o público agiu." : n === 2 ? "Post bom! Dá para caprichar mais." : "O post passou batido. Bora ajustar!";

  return (
    <div className={s.resultado}>
      <div className={s.resultadoPost}>
        <Post rodada={rodada} escolhas={escolhas} publicado contadores={atuais} contadoresFinais={finais} />
      </div>
      <div className={s.resultadoPainel}>
        <p className={s.sobretitulo}>
          Campanha {indice + 1} de {RODADAS.length}
        </p>
        <h3 ref={tituloRef} tabIndex={-1} className={s.telaTitulo}>
          Post publicado: {rodada.titulo}
        </h3>
        <div className={s.nota}>
          <Estrelas n={n} grande />
          <p className={s.recado}>
            {recado} <span className={s.pontos}>({pontos} de 10 pontos)</span>
          </p>
        </div>
        <ul className={s.analise}>
          {rodada.passos.map((passo, i) => {
            const op = passo.opcoes[escolhas[i]];
            const nota = NOTAS[op.pontos];
            return (
              <li key={passo.id} className={s.analiseItem} data-nivel={nota.nivel}>
                <span className={s.analiseMarca} aria-hidden="true">
                  {nota.marca}
                </span>
                <span className={s.analiseTexto}>
                  <span className={s.analiseCabeca}>
                    <strong>{ROTULOS[passo.id]}:</strong> {op.texto}{" "}
                    <span className={s.srOnly}>— {nota.texto}.</span>
                  </span>
                  <span className={s.analisePorque}>{op.porque}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <div className={s.acoes}>
          <button type="button" className={s.botaoPrimario} onClick={onProxima}>
            {ultima ? "Ver resultado final" : "Próxima campanha"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Final({ resultados, tituloRef, onComemorar, onDeNovo, onSair }) {
  const totalEstrelas = resultados.reduce((a, r) => a + r.estrelas, 0);
  const venceu = totalEstrelas >= ESTRELAS_PARA_VENCER;
  return (
    <div className={s.final} data-venceu={venceu}>
      <div className={s.finalPersonagens} aria-hidden="true">
        <Avatar src={URL_EMILY} className={s.finalEmily} />
        <Avatar src={URL_MICROFONE} className={s.finalMic} />
      </div>
      <div className={s.finalCartao}>
        <h3 ref={tituloRef} tabIndex={-1} className={s.finalTitulo}>
          {venceu ? "Campanha no ar!" : "Quase lá!"}
        </h3>
        <Estrelas n={totalEstrelas} max={MAX_ESTRELAS} grande />
        <p className={s.finalTexto}>
          {venceu
            ? "O microfone criou coragem e saiu do cantinho: as três campanhas chegaram em quem precisava. Obrigada pela ajuda!"
            : `Você somou ${totalEstrelas} de ${MAX_ESTRELAS} estrelas; precisa de ${ESTRELAS_PARA_VENCER}. Tudo bem, comunicação se aprende testando: o microfone ainda está tímido, mas topa mais uma rodada com você.`}
        </p>
        <ul className={s.finalLista}>
          {resultados.map((r, i) => (
            <li key={RODADAS[i].id}>
              <span>{RODADAS[i].titulo}</span>
              <Estrelas n={r.estrelas} />
            </li>
          ))}
        </ul>
        <div className={s.acoes}>
          {venceu ? (
            <button type="button" className={s.botaoPrimario} onClick={onComemorar}>
              Comemorar
            </button>
          ) : (
            <>
              <button type="button" className={s.botaoSecundario} onClick={onSair}>
                Sair
              </button>
              <button type="button" className={s.botaoPrimario} onClick={onDeNovo}>
                Tentar de novo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Componente -------------------------------------------------------------

const vazias = () => PASSOS.map(() => null);

export default function Campanha({ onFim, onSair }) {
  const tituloId = useId();
  const fundoRef = useRef(null);
  const painelRef = useRef(null);
  const telaTituloRef = useRef(null);
  const [anterior] = useState(() => (typeof document === "undefined" ? null : document.activeElement));

  // tela: "briefing" | "passo" | "resultado" | "final"
  const [tela, setTela] = useState("briefing");
  const [rodadaIdx, setRodadaIdx] = useState(0);
  const [passoIdx, setPassoIdx] = useState(0);
  const [escolhas, setEscolhas] = useState(vazias);
  const [selecao, setSelecao] = useState(null);
  const [resultados, setResultados] = useState([]); // [{ pontos, estrelas }]

  const rodada = RODADAS[rodadaIdx];

  const onSairRef = useRef(onSair);
  useEffect(() => {
    onSairRef.current = onSair;
  }, [onSair]);

  // Abertura: fundo inerte, Tab circular, Esc sai, foco devolvido ao fechar.
  useEffect(() => {
    const painel = painelRef.current;
    const desfazerInert = inertizarIrmaos(fundoRef.current);
    let voltando = false;

    function aoTeclar(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onSairRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      voltando = e.shiftKey;
      const lista = focaveis(painel);
      const ativo = document.activeElement;
      if (lista.length === 0) {
        e.preventDefault();
        return;
      }
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
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
      const lista = focaveis(painel);
      (voltando ? lista[lista.length - 1] : lista[0])?.focus();
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

  // Cada tela nova leva o foco ao seu título (também na abertura).
  const chaveTela = `${tela}-${rodadaIdx}-${passoIdx}`;
  useEffect(() => {
    telaTituloRef.current?.focus({ preventScroll: false });
  }, [chaveTela]);

  const comecarRodada = () => {
    setSelecao(escolhas[0]);
    setPassoIdx(0);
    setTela("passo");
  };

  const confirmar = () => {
    const novas = escolhas.map((e, i) => (i === passoIdx ? selecao : e));
    setEscolhas(novas);
    if (passoIdx < PASSOS.length - 1) {
      setPassoIdx(passoIdx + 1);
      setSelecao(novas[passoIdx + 1]);
    } else {
      const pontos = pontosDaRodada(rodada, novas);
      setResultados((r) => [...r.slice(0, rodadaIdx), { pontos, estrelas: estrelas(pontos) }]);
      setTela("resultado");
    }
  };

  const voltar = () => {
    const novas = escolhas.map((e, i) => (i === passoIdx ? selecao : e));
    setEscolhas(novas);
    if (passoIdx === 0) {
      setTela("briefing");
    } else {
      setPassoIdx(passoIdx - 1);
      setSelecao(novas[passoIdx - 1]);
    }
  };

  const proxima = () => {
    setPassoIdx(0);
    setSelecao(null);
    setEscolhas(vazias());
    if (rodadaIdx < RODADAS.length - 1) {
      setRodadaIdx(rodadaIdx + 1);
      setTela("briefing");
    } else {
      setTela("final");
    }
  };

  const deNovo = () => {
    setRodadaIdx(0);
    setPassoIdx(0);
    setSelecao(null);
    setEscolhas(vazias());
    setResultados([]);
    setTela("briefing");
  };

  const comemorar = () => {
    onFim?.({
      venceu: true,
      estrelas: resultados.reduce((a, r) => a + r.estrelas, 0),
      pontos: resultados.reduce((a, r) => a + r.pontos, 0),
    });
  };

  // Anúncio curto da etapa (o título focado completa a informação).
  let anuncio;
  if (tela === "briefing") anuncio = `Campanha ${rodadaIdx + 1} de ${RODADAS.length}.`;
  else if (tela === "passo") anuncio = `Passo ${passoIdx + 1} de ${PASSOS.length}.`;
  else if (tela === "resultado") anuncio = `Post publicado: ${resultados[rodadaIdx]?.estrelas ?? 0} de 3 estrelas.`;
  else anuncio = `Resultado final: ${resultados.reduce((a, r) => a + r.estrelas, 0)} de ${MAX_ESTRELAS} estrelas.`;

  return (
    <div ref={fundoRef} className={s.fundo}>
      <div
        ref={painelRef}
        className={s.campanha}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
      >
        <header className={s.topo}>
          <span className={s.topoMic} aria-hidden="true">
            <Avatar src={URL_MICROFONE} className={s.topoMicImg} />
          </span>
          <h2 id={tituloId} className={s.marca}>
            Campanha da SEMEC
          </h2>
          {tela !== "final" && (
            <ol className={s.placar} aria-label="Campanhas">
              {RODADAS.map((r, i) => (
                <li key={r.id} data-estado={i < rodadaIdx || (i === rodadaIdx && tela === "resultado") ? "feita" : i === rodadaIdx ? "atual" : "falta"}>
                  <span className={s.srOnly}>
                    {r.titulo}
                    {resultados[i] && (i < rodadaIdx || tela === "resultado") ? `: ${resultados[i].estrelas} de 3 estrelas` : i === rodadaIdx ? " (atual)" : ""}
                  </span>
                  <span aria-hidden="true">{i + 1}</span>
                </li>
              ))}
            </ol>
          )}
          <button type="button" className={s.sair} onClick={() => onSair?.()}>
            Sair <span aria-hidden="true">✕</span>
          </button>
        </header>

        <p className={s.srOnly} aria-live="polite" aria-atomic="true">
          {anuncio}
        </p>

        <div className={s.palco} data-tela={tela}>
          {tela === "briefing" && <Briefing rodada={rodada} indice={rodadaIdx} tituloRef={telaTituloRef} onComecar={comecarRodada} />}
          {tela === "passo" && (
            <Passo
              rodada={rodada}
              passoIdx={passoIdx}
              escolhas={escolhas}
              selecao={selecao}
              onSelecionar={setSelecao}
              onConfirmar={confirmar}
              onVoltar={voltar}
              tituloRef={telaTituloRef}
            />
          )}
          {tela === "resultado" && (
            <Resultado key={rodadaIdx} rodada={rodada} indice={rodadaIdx} escolhas={escolhas} tituloRef={telaTituloRef} onProxima={proxima} />
          )}
          {tela === "final" && (
            <Final resultados={resultados} tituloRef={telaTituloRef} onComemorar={comemorar} onDeNovo={deNovo} onSair={() => onSair?.()} />
          )}
        </div>
      </div>
    </div>
  );
}
