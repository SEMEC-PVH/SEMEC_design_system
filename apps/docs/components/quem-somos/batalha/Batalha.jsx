"use client";

import { useEffect, useRef, useState } from "react";
import { GOLPES, ITENS, LINGUAGENS, MOTIVO_VANTAGEM, VANTAGEM, multiplicadorTipo } from "./dados";
import { criarLutador, iniciarBatalha, jogarTurno, nomeTipo, xpParaProximo } from "./motor";
import s from "./batalha.module.css";

// Quanto tempo cada evento fica na tela antes do próximo (ms).
const DURACAO = { dano: 650, cura: 650, fim: 0 };
const DURACAO_TEXTO = 1100;

// Os eventos "nivel" e "evolucao" chegam juntos no fim do turno, mas o motor só
// devolve o estado FINAL. Para a ficha não "pular" antes da mensagem, a tela
// reconstrói cada passo a partir do que já está visível.
function aplicarNivel(v, nivel) {
  const atual = v.jogador;
  const novo = criarLutador(atual.especieId, nivel);
  const jogador = {
    ...atual,
    nivel,
    xp: Math.max(0, atual.xp - xpParaProximo(nivel - 1)),
    maxHp: novo.maxHp,
    atk: novo.atk,
    def: novo.def,
    spd: novo.spd,
  };
  return { ...v, jogador, jHp: Math.max(1, Math.round((novo.maxHp * v.jHp) / atual.maxHp)) };
}

function aplicarEvolucao(v) {
  const atual = v.jogador;
  const para = LINGUAGENS[atual.especieId]?.evolui?.para;
  if (!para) return v;
  const nova = criarLutador(para, atual.nivel, atual.xp);
  const jHp = Math.max(1, Math.round((nova.maxHp * v.jHp) / atual.maxHp));
  return { ...v, jogador: { ...nova, hp: jHp, estagios: atual.estagios }, jHp };
}

const faixaVida = (hp, max) => (hp / max > 0.5 ? "alta" : hp / max > 0.2 ? "media" : "baixa");

// Barra de progresso em SVG: a largura é atributo (sem style inline) e o
// CSS anima a transição de width.
function Barra({ valor, className, faixa }) {
  const largura = Math.max(0, Math.min(1, valor)) * 100;
  return (
    <svg className={s.barraSvg} viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
      <rect className={className} data-faixa={faixa} x="0" y="0" height="10" width={largura} />
    </svg>
  );
}

function Retrato({ lutador, lado, anim }) {
  const classes = [s.retrato, s[`retrato_${lado}`]];
  if (anim?.lado === lado) classes.push(s[`anim_${anim.tipo}`]);
  return (
    <div className={classes.join(" ")} data-tipo={lutador.tipo} aria-hidden="true">
      <span className={s.sigla}>{lutador.sigla}</span>
    </div>
  );
}

function Painel({ lutador, hp, mostrarXp, rotulo }) {
  return (
    <div className={s.painel}>
      <p className={s.painelNome}>
        <span className="sr-only">{rotulo}: </span>
        {lutador.nome}
        <span className={s.painelNivel}>Nv {lutador.nivel}</span>
      </p>
      <span className={s.chip} data-tipo={lutador.tipo}>
        {nomeTipo(lutador.tipo)}
      </span>
      <div className={s.vida}>
        <span className={s.vidaRotulo} aria-hidden="true">
          VIDA
        </span>
        <div
          className={s.barra}
          role="meter"
          aria-label={`Vida de ${lutador.nome}`}
          aria-valuemin={0}
          aria-valuemax={lutador.maxHp}
          aria-valuenow={hp}
          aria-valuetext={`${hp} de ${lutador.maxHp}`}
        >
          <Barra valor={hp / lutador.maxHp} className={s.barraFill} faixa={faixaVida(hp, lutador.maxHp)} />
        </div>
      </div>
      <p className={s.vidaNumero} aria-hidden="true">
        {hp}/{lutador.maxHp}
      </p>
      {mostrarXp && (
        <div className={s.xp} aria-hidden="true">
          <Barra valor={lutador.xp / xpParaProximo(lutador.nivel)} className={s.xpFill} />
        </div>
      )}
    </div>
  );
}

export default function Batalha({ jogador, chefe, onFim }) {
  const [estado, setEstado] = useState(() => iniciarBatalha(jogador, chefe.id));
  // O que está na tela: a vida "visível" só muda quando o evento de dano toca.
  const [vis, setVis] = useState(() => ({ jHp: jogador.hp, oIdx: 0, oHp: null, jogador }));
  const [fila, setFila] = useState(() => {
    const primeiro = LINGUAGENS[chefe.time[0][0]];
    return [
      { tipo: "texto", texto: `${chefe.titulo} quer batalhar!` },
      { tipo: "texto", texto: `${chefe.titulo} chamou ${primeiro.nome} (nível ${chefe.time[0][1]})!` },
      { tipo: "texto", texto: `Vai, ${jogador.nome}!` },
    ];
  });
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(true);
  const [menu, setMenu] = useState("principal");
  const [anim, setAnim] = useState(null);
  const [golpeFoco, setGolpeFoco] = useState(null);
  // Anúncio extra só para leitor de tela (o dano é mostrado só pela barra).
  const [aviso, setAviso] = useState("");
  const estadoRef = useRef(estado);
  const primeiroBotao = useRef(null);
  // Trava síncrona: dois cliques no mesmo quadro não podem jogar dois turnos.
  const ocupadoRef = useRef(true);
  // onFim pode mudar de identidade no pai; a fila não deve reiniciar por isso.
  const onFimRef = useRef(onFim);
  // Enquanto a fila roda, os botões somem: o foco fica na caixa de texto em
  // vez de cair no <body> (WCAG 2.4.3).
  const caixaRef = useRef(null);

  useEffect(() => {
    caixaRef.current?.focus();
  }, []);

  useEffect(() => {
    onFimRef.current = onFim;
  }, [onFim]);

  // Reprodução da fila de eventos, um por vez.
  useEffect(() => {
    if (fila.length === 0) {
      if (!ocupado) return undefined;
      const t = setTimeout(() => {
        const final = estadoRef.current;
        setVis((v) => ({ ...v, jHp: final.jogador.hp, jogador: final.jogador, oIdx: final.atual, oHp: final.time[final.atual].hp }));
        setAnim(null);
        if (final.resultado) {
          onFimRef.current(final.resultado, final.jogador);
          return;
        }
        setMensagem(`O que ${final.jogador.nome} vai fazer?`);
        ocupadoRef.current = false;
        setOcupado(false);
      }, DURACAO_TEXTO);
      return () => clearTimeout(t);
    }
    const [ev, ...resto] = fila;
    const t = setTimeout(
      () => {
        if (ev.texto) setMensagem(ev.texto);
        if (ev.tipo === "dano") {
          setAnim({ lado: ev.lado, tipo: "hit" });
          setAviso(`${ev.lado === "jogador" ? "Você" : "O adversário"} perdeu ${ev.valor} de vida: ${ev.hp} de ${ev.maxHp}.`);
          setVis((v) => (ev.lado === "jogador" ? { ...v, jHp: ev.hp } : { ...v, oHp: ev.hp }));
        } else if (ev.tipo === "cura") {
          setVis((v) => ({ ...v, jHp: ev.hp }));
        } else if (ev.tipo === "desmaio") {
          setAnim({ lado: ev.lado, tipo: "desmaio" });
        } else if (ev.tipo === "entra") {
          setAnim(null);
          setVis((v) => ({ ...v, oIdx: v.oIdx + 1, oHp: null }));
        } else if (ev.tipo === "xp") {
          setVis((v) => ({ ...v, jogador: { ...v.jogador, xp: v.jogador.xp + ev.valor } }));
        } else if (ev.tipo === "nivel") {
          setVis((v) => aplicarNivel(v, ev.nivel));
        } else if (ev.tipo === "evolucao") {
          setAnim({ lado: "jogador", tipo: "evolucao" });
          setVis(aplicarEvolucao);
        }
        setFila(resto);
      },
      DURACAO[ev.tipo] ?? DURACAO_TEXTO
    );
    return () => clearTimeout(t);
  }, [fila, ocupado]);

  // Volta o foco para o menu quando é a vez do jogador.
  useEffect(() => {
    if (!ocupado) primeiroBotao.current?.focus();
  }, [ocupado, menu]);

  function agir(acao) {
    if (ocupadoRef.current) return;
    ocupadoRef.current = true;
    const { estado: novo, eventos } = jogarTurno(estadoRef.current, acao);
    estadoRef.current = novo;
    setEstado(novo);
    setMenu("principal");
    setGolpeFoco(null);
    setOcupado(true);
    setFila(eventos);
    caixaRef.current?.focus();
  }

  const op = estado.time[vis.oIdx] ?? estado.time[estado.atual];
  const opHp = vis.oHp ?? op.maxHp;
  const j = vis.jogador;
  const golpeDesc = golpeFoco && menu === "golpes" ? GOLPES[golpeFoco] : null;
  // Foco inicial do menu de itens: o primeiro item usável (ou o "Voltar").
  const itemUsavel = (id) => Boolean(estado.itens[id]) && vis.jHp < j.maxHp;
  const primeiroItem = Object.keys(ITENS).find(itemUsavel);
  // Motivo de um item indisponível, visível e lido pelo leitor de tela.
  const motivoItem = (id) => (!estado.itens[id] ? "acabou" : vis.jHp >= j.maxHp ? "sua vida já está cheia" : null);

  return (
    <section className={s.batalha} aria-labelledby="batalha-titulo">
      <h2 id="batalha-titulo" className="sr-only">
        Batalha contra {chefe.titulo}
      </h2>
      <div className={s.arena}>
        <div className={s.ladoOponente}>
          <Painel lutador={op} hp={opHp} rotulo="Adversário" />
          <Retrato lutador={op} lado="oponente" anim={anim} />
        </div>
        <div className={s.ladoJogador}>
          <Retrato lutador={j} lado="jogador" anim={anim} />
          <Painel lutador={j} hp={vis.jHp} mostrarXp rotulo="Sua linguagem" />
        </div>
      </div>

      <div className={s.base}>
        <div ref={caixaRef} tabIndex={-1} className={s.caixaTexto}>
          <p aria-live="polite" aria-atomic="true">
            {mensagem}
          </p>
          <p className="sr-only" aria-live="polite">
            {aviso}
          </p>
          {golpeDesc && !ocupado && (
            <p className={s.descricao}>
              <strong>{golpeDesc.nome}</strong> · {nomeTipo(golpeDesc.tipo)}
              {golpeDesc.poder > 0 ? ` · poder ${golpeDesc.poder}` : ""}
              {golpeDesc.precisao < 100 ? ` · ${golpeDesc.precisao}% de acerto` : ""}
              <br />
              {golpeDesc.descricao}
            </p>
          )}
        </div>

        {!ocupado && menu === "principal" && (
          <div className={s.menu} role="group" aria-label="Ações">
            <button ref={primeiroBotao} type="button" className={s.acao} onClick={() => setMenu("golpes")}>
              Golpes
            </button>
            <button type="button" className={s.acao} onClick={() => setMenu("itens")}>
              Itens
            </button>
            <button type="button" className={s.acao} onClick={() => setMenu("tipos")}>
              Tipos
            </button>
            <button type="button" className={s.acao} onClick={() => agir({ tipo: "desistir" })}>
              Desistir
            </button>
          </div>
        )}

        {!ocupado && menu === "golpes" && (
          <div className={s.menuGolpes} role="group" aria-label="Golpes">
            {j.golpes.map((id, i) => {
              const g = GOLPES[id];
              const mult = g.poder > 0 ? multiplicadorTipo(g.tipo, op.tipo) : 1;
              return (
                <button
                  key={id}
                  ref={i === 0 ? primeiroBotao : undefined}
                  type="button"
                  className={s.golpe}
                  data-tipo={g.tipo}
                  onClick={() => agir({ tipo: "golpe", id })}
                  onFocus={() => setGolpeFoco(id)}
                  onMouseEnter={() => setGolpeFoco(id)}
                >
                  <span className={s.golpeNome}>{g.nome}</span>
                  <span className={s.golpeTipo}>
                    {nomeTipo(g.tipo)}
                    {mult > 1 ? " · forte contra ele" : mult < 1 ? " · fraco contra ele" : ""}
                  </span>
                </button>
              );
            })}
            <button type="button" className={s.voltar} onClick={() => setMenu("principal")}>
              Voltar
            </button>
          </div>
        )}

        {!ocupado && menu === "itens" && (
          <div className={s.menuGolpes} role="group" aria-label="Itens">
            {Object.entries(ITENS).map(([id, item]) => (
              <button
                key={id}
                ref={id === primeiroItem ? primeiroBotao : undefined}
                type="button"
                className={s.golpe}
                data-tipo="basico"
                disabled={!itemUsavel(id)}
                onClick={() => agir({ tipo: "item", id })}
              >
                <span className={s.golpeNome}>
                  {item.nome} ×{estado.itens[id] ?? 0}
                </span>
                <span className={s.golpeTipo}>
                  {item.descricao}
                  {motivoItem(id) && (
                    <>
                      {" · "}
                      <strong>Indisponível: {motivoItem(id)}</strong>
                    </>
                  )}
                </span>
              </button>
            ))}
            <button
              ref={primeiroItem ? undefined : primeiroBotao}
              type="button"
              className={s.voltar}
              onClick={() => setMenu("principal")}
            >
              Voltar
            </button>
          </div>
        )}

        {!ocupado && menu === "tipos" && (
          <div className={s.menuTipos}>
            <ul>
              {Object.keys(VANTAGEM).map((t) => (
                <li key={t}>{MOTIVO_VANTAGEM[t]}</li>
              ))}
              <li>Golpes “Básico” não têm vantagem nem desvantagem.</li>
            </ul>
            <button ref={primeiroBotao} type="button" className={s.voltar} onClick={() => setMenu("principal")}>
              Voltar
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
