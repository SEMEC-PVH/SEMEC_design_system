"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Batalha from "./Batalha";
import EscolhaInicial from "./EscolhaInicial";
import { CHEFES, LINGUAGENS, MOTIVO_VANTAGEM, VANTAGEM } from "./dados";
import { nomeTipo, xpParaProximo } from "./motor";
import { curado, useProgresso } from "./progresso.js";
import { Sprite } from "./Sprite";
import { TITULO_FULL_STACK, TelaFullStack, TelaResultado, tituloResultado } from "./TelaResultado";
import s from "./batalha.module.css";

const INTRO = [
  "Olá! Bem-vindo(a) à SEMEC. Aqui, tecnologia e educação andam juntas.",
  "Para fazer parte do time, você vai precisar de uma companheira de jornada: uma LINGUAGEM DE PROGRAMAÇÃO.",
  "Vença os três ginásios da vila — Front-End, Back-End e Dados — e conquiste uma STACK em cada um. Com as três, você vira FULL STACK e enfrenta a Diretoria!",
];

function Titulo({ children, foco }) {
  return (
    <h2 ref={foco} tabIndex={-1} className={s.titulo}>
      {children}
    </h2>
  );
}

export default function Jornada() {
  const { progresso, vencidos, liberado, escolherInicial, registrarResultado, recomecar } = useProgresso();
  const [tela, setTela] = useState(() => (progresso ? "mapa" : "intro"));
  const [pagina, setPagina] = useState(0);
  const [chefeId, setChefeId] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [rodada, setRodada] = useState(0); // remonta a batalha a cada desafio
  const tituloRef = useRef(null);

  // A cada troca de tela, o foco vai para o título (leitor de tela e teclado).
  // Na primeira renderização não rouba o foco (o leitor de tela começa pelo
  // topo da página, com o link de pular conteúdo); só nas trocas de tela.
  // Compara com a tela anterior (e não com "já montou"): o modo estrito do
  // React roda o efeito duas vezes na montagem e roubaria o foco na segunda.
  const telaAnterior = useRef(`${tela}:${pagina}`);
  useEffect(() => {
    const chave = `${tela}:${pagina}`;
    if (telaAnterior.current === chave) return;
    telaAnterior.current = chave;
    tituloRef.current?.focus();
  }, [tela, pagina]);

  const chefe = CHEFES.find((c) => c.id === chefeId);

  const onFimBatalha = useCallback(
    (res, jogadorFinal) => {
      const { zerou } = registrarResultado(chefeId, res, jogadorFinal);
      setResultado(res);
      setTela(zerou ? "zerou" : "resultado");
    },
    [chefeId, registrarResultado]
  );

  if (tela === "intro") {
    const ultima = pagina === INTRO.length - 1;
    return (
      <div className={s.jornada}>
        <Titulo foco={tituloRef}>Diretoria da SEMEC</Titulo>
        <div className={s.fala}>
          <p>{INTRO[pagina]}</p>
        </div>
        <button
          type="button"
          className={s.botaoPrimario}
          onClick={() => {
            if (ultima) setTela("inicial");
            else setPagina(pagina + 1);
          }}
        >
          {ultima ? "Escolher minha linguagem" : "Continuar"}
        </button>
      </div>
    );
  }

  if (tela === "inicial") {
    return (
      <div className={s.jornada}>
        <Titulo foco={tituloRef}>Escolha a sua linguagem inicial</Titulo>
        <EscolhaInicial
          onEscolher={(id) => {
            escolherInicial(id);
            setTela("mapa");
          }}
        />
      </div>
    );
  }

  if (tela === "batalha" && chefe && progresso) {
    // Na rota de protótipo, a batalha fica inline num quadro de jogo (16:10
    // no desktop; mais alto no celular), com o mesmo visual da Vila.
    return (
      <div className={s.quadro}>
        <Batalha key={`${chefeId}-${rodada}`} jogador={curado(progresso.jogador)} chefe={chefe} onFim={onFimBatalha} />
      </div>
    );
  }

  if (tela === "preBatalha" && chefe) {
    return (
      <div className={s.jornada}>
        <Titulo foco={tituloRef}>{chefe.ginasio}</Titulo>
        <div className={s.fala}>
          <p className={s.falaQuem}>{chefe.titulo}</p>
          <p>{chefe.falaInicio}</p>
        </div>
        <p className={s.dica}>
          <strong>Dica:</strong> {chefe.dica}
        </p>
        <p className={s.subtitulo}>
          Time do adversário: {chefe.time.map(([id, nv]) => `${LINGUAGENS[id].nome} (nv ${nv})`).join(", ")}
        </p>
        <div className={s.linhaBotoes}>
          <button
            type="button"
            className={s.botaoPrimario}
            onClick={() => {
              setRodada((r) => r + 1);
              setTela("batalha");
            }}
          >
            Começar batalha
          </button>
          <button type="button" className={s.botaoSecundario} onClick={() => setTela("mapa")}>
            Voltar ao mapa
          </button>
        </div>
      </div>
    );
  }

  if (tela === "resultado" && chefe) {
    return (
      <div className={s.jornada}>
        <Titulo foco={tituloRef}>{tituloResultado(chefe, resultado)}</Titulo>
        <TelaResultado chefe={chefe} resultado={resultado} onVoltar={() => setTela("mapa")} />
      </div>
    );
  }

  if (tela === "zerou") {
    return (
      <div className={s.jornada}>
        <Titulo foco={tituloRef}>{TITULO_FULL_STACK}</Titulo>
        <TelaFullStack onVoltar={() => setTela("mapa")} />
      </div>
    );
  }

  // ---- Mapa da jornada ------------------------------------------------------------
  const j = progresso?.jogador;
  if (!j) {
    return (
      <div className={s.jornada}>
        <Titulo foco={tituloRef}>Jornada</Titulo>
        <button type="button" className={s.botaoPrimario} onClick={() => setTela("intro")}>
          Começar
        </button>
      </div>
    );
  }
  return (
    <div className={s.jornada}>
      <Titulo foco={tituloRef}>Sua jornada</Titulo>

      <div className={s.ficha} data-tipo={j.tipo}>
        <Sprite especieId={j.especieId} vista="frente" sigla={j.sigla} tipo={j.tipo} className={s.cartaoRetrato} />
        <div>
          <p className={s.cartaoNome}>
            {j.nome} <span className={s.painelNivel}>Nv {j.nivel}</span>
          </p>
          <span className={s.chip} data-tipo={j.tipo}>
            {nomeTipo(j.tipo)}
          </span>
          <p className={s.subtitulo}>
            Experiência: {j.xp}/{xpParaProximo(j.nivel)} · Vida: {j.maxHp}
          </p>
        </div>
      </div>

      <h3 className={s.secao}>Stacks</h3>
      <ul className={s.stacks}>
        {CHEFES.map((c) => (
          <li key={c.id} className={s.stackGanha} data-stack={c.stack.id} data-vazia={!vencidos.includes(c.id)}>
            {c.stack.nome}
            <span className="sr-only">{vencidos.includes(c.id) ? " (conquistada)" : " (ainda não)"}</span>
          </li>
        ))}
      </ul>

      <h3 className={s.secao}>Ginásios</h3>
      <ol className={s.ginasios}>
        {CHEFES.map((c) => {
          const venceu = vencidos.includes(c.id);
          const aberto = liberado(c.id);
          return (
            <li key={c.id} className={s.ginasio} data-estado={venceu ? "vencido" : aberto ? "liberado" : "bloqueado"}>
              <div>
                <p className={s.cartaoNome}>{c.ginasio}</p>
                <p className={s.subtitulo}>
                  {venceu
                    ? `Vencido · ${c.stack.nome} conquistada`
                    : aberto
                      ? `Time: ${c.time.map(([id, nv]) => `${LINGUAGENS[id].nome} nv ${nv}`).join(", ")}`
                      : "Bloqueado: vença o ginásio anterior"}
                </p>
              </div>
              <button
                type="button"
                className={venceu ? s.botaoSecundario : s.botaoPrimario}
                disabled={!aberto}
                onClick={() => {
                  setChefeId(c.id);
                  setTela("preBatalha");
                }}
              >
                {venceu ? "Revanche" : "Desafiar"}
                <span className="sr-only"> {c.ginasio}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <h3 className={s.secao}>Tabela de tipos</h3>
      <ul className={s.listaTipos}>
        {Object.keys(VANTAGEM).map((t) => (
          <li key={t}>{MOTIVO_VANTAGEM[t]}</li>
        ))}
      </ul>

      <button
        type="button"
        className={s.botaoTexto}
        onClick={() => {
          recomecar();
          setChefeId(null);
          setResultado(null);
          setPagina(0);
          setTela("intro");
        }}
      >
        Recomeçar a jornada do zero
      </button>
    </div>
  );
}
