"use client";

import { useEffect, useRef, useState } from "react";
import { GOLPES, ITENS, LINGUAGENS, MOTIVO_VANTAGEM, VANTAGEM, multiplicadorTipo } from "./dados";
import { criarLutador, iniciarBatalha, jogarTurno, nomeTipo, xpParaProximo } from "./motor";
import { Cenario, Sprite } from "./Sprite";
import Evolucao from "./Evolucao";
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

// Criatura sobre a sua plataforma oval. Adversário de frente (em cima, à
// direita); a linguagem do jogador de costas, maior (embaixo, à esquerda).
function Posto({ lutador, lado, anim }) {
  const classes = [s.criatura];
  if (anim?.lado === lado) classes.push(s[`anim_${anim.tipo}`]);
  return (
    <div className={s.posto} data-lado={lado} data-especie={lutador.especieId} aria-hidden="true">
      <span className={s.plataforma} />
      <div className={classes.join(" ")}>
        <Sprite
          especieId={lutador.especieId}
          vista={lado === "jogador" ? "costas" : "frente"}
          sigla={lutador.sigla}
          tipo={lutador.tipo}
          className={s.retrato}
        />
      </div>
    </div>
  );
}

// Setas dentro de um menu (grade 2×2 de ações, golpes ou itens): o foco vai
// para o botão mais próximo na direção da seta, pela posição na tela (vale
// para a grade larga, para a coluna única do celular e para o "Voltar" que
// ocupa a linha inteira). Home/End vão ao primeiro/último. Tab continua
// passando por todos os botões.
const SETAS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
const centro = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};
function moverComSetas(e) {
  const dir = SETAS[e.key];
  if (!dir && e.key !== "Home" && e.key !== "End") return;
  const grade = e.currentTarget.closest("[data-grade]");
  if (!grade) return;
  const lista = [...grade.querySelectorAll("button:not(:disabled)")];
  if (lista.length === 0) return;
  e.preventDefault();
  if (e.key === "Home") return lista[0].focus();
  if (e.key === "End") return lista[lista.length - 1].focus();
  const atual = centro(e.currentTarget);
  let melhor = null;
  let menor = Infinity;
  for (const el of lista) {
    if (el === e.currentTarget) continue;
    const c = centro(el);
    const dx = c.x - atual.x;
    const dy = c.y - atual.y;
    const frente = dx * dir[0] + dy * dir[1];
    if (frente <= 4) continue;
    const pontos = frente + 2 * Math.abs(dir[0] ? dy : dx);
    if (pontos < menor) {
      menor = pontos;
      melhor = el;
    }
  }
  melhor?.focus();
}

// Menu principal (grade 2×2).
const ACOES = [
  { id: "golpes", rotulo: "Golpes" },
  { id: "itens", rotulo: "Itens" },
  { id: "tipos", rotulo: "Tipos" },
  { id: "desistir", rotulo: "Desistir" },
];

// Cursor ▶ dos menus clássicos: aparece no botão focado (CSS), sem entrar no
// nome acessível.
const Cursor = () => (
  <span className={s.cursor} aria-hidden="true">
    ▶
  </span>
);

// Caixa de status clássica (com o "rabinho" de seta em CSS): adversário em
// cima à esquerda; jogador embaixo à direita, com números e experiência.
function Painel({ lutador, hp, mostrarXp, rotulo, lado }) {
  return (
    <div className={s.painel} data-lado={lado}>
      <p className={s.painelNome}>
        <span className="sr-only">{rotulo}: </span>
        <span className={s.painelNomeTexto}>{lutador.nome}</span>
        <span className={s.painelNivel}>Nv {lutador.nivel}</span>
      </p>
      <div className={s.vida}>
        <span className={s.chip} data-tipo={lutador.tipo}>
          {nomeTipo(lutador.tipo)}
        </span>
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
      {mostrarXp && (
        <>
          <p className={s.vidaNumero} aria-hidden="true">
            {hp}/{lutador.maxHp}
          </p>
          <div className={s.xpLinha} aria-hidden="true">
            <span className={s.vidaRotulo}>EXP</span>
            <div className={s.xp}>
              <Barra valor={lutador.xp / xpParaProximo(lutador.nivel)} className={s.xpFill} />
            </div>
          </div>
        </>
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
  // Ao voltar de um submenu, o foco (e o cursor ▶) volta para a ação que o
  // abriu, como nos jogos clássicos; depois de um turno, para "Golpes".
  const [focoPrincipal, setFocoPrincipal] = useState("golpes");
  const [anim, setAnim] = useState(null);
  // Evento de evolução em cena: a fila fica parada até a cena terminar.
  const [evolucao, setEvolucao] = useState(null);
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
        if (ev.tipo === "evolucao") {
          // A cena (Evolucao.jsx) troca o sprite no clarão e devolve a fila
          // no fim; aqui só começa, sem consumir o evento.
          setAnim(null);
          setMensagem(`O quê? ${ev.de} está evoluindo!`);
          setEvolucao(ev);
          return;
        }
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
    setFocoPrincipal("golpes");
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

  const abrir = (submenu) => {
    setFocoPrincipal(submenu);
    setMenu(submenu);
  };
  const voltarMenu = () => setMenu("principal");
  // Teclado nos submenus: setas movem o foco; Esc volta ao menu principal
  // (o mesmo que o botão "Voltar").
  const teclaSubmenu = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      voltarMenu();
      return;
    }
    moverComSetas(e);
  };

  return (
    <section className={s.batalha} data-menu={ocupado ? "fila" : menu} aria-labelledby="batalha-titulo">
      <h2 id="batalha-titulo" className="sr-only">
        Batalha contra {chefe.titulo}
      </h2>
      <div className={`${s.arena} ${s.cenario}`} data-ginasio={chefe.id}>
        <Cenario chefeId={chefe.id} />
        <Posto lutador={op} lado="oponente" anim={anim} />
        <Posto lutador={j} lado="jogador" anim={anim} />
        <Painel lutador={op} hp={opHp} rotulo="Adversário" lado="oponente" />
        <Painel lutador={j} hp={vis.jHp} mostrarXp rotulo="Sua linguagem" lado="jogador" />
        {evolucao && (
          <Evolucao
            deId={evolucao.deId}
            paraId={evolucao.paraId}
            onRevelar={() => {
              setVis(aplicarEvolucao);
              setMensagem(`Parabéns! Seu ${evolucao.de} evoluiu para ${evolucao.para}!`);
            }}
            onFim={() => {
              setEvolucao(null);
              setFila((f) => f.slice(1));
            }}
          />
        )}
      </div>

      <div className={s.faixa}>
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

        <div className={s.caixaMenu}>
          {!ocupado && menu === "principal" && (
            <div className={s.menu} role="group" aria-label="Ações" data-grade="">
              {ACOES.map((a) => (
                <button
                  key={a.id}
                  ref={a.id === focoPrincipal ? primeiroBotao : undefined}
                  type="button"
                  className={s.acao}
                  onClick={() => (a.id === "desistir" ? agir({ tipo: "desistir" }) : abrir(a.id))}
                  onKeyDown={moverComSetas}
                >
                  <Cursor />
                  {a.rotulo}
                </button>
              ))}
            </div>
          )}

          {!ocupado && menu === "golpes" && (
            <div className={s.menuGolpes} role="group" aria-label="Golpes" data-grade="">
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
                    onKeyDown={teclaSubmenu}
                    onFocus={() => setGolpeFoco(id)}
                    onMouseEnter={() => setGolpeFoco(id)}
                  >
                    <Cursor />
                    <span className={s.golpeNome}>{g.nome}</span>
                    <span className={s.golpeTipo}>
                      {nomeTipo(g.tipo)}
                      {mult > 1 ? " · forte contra ele" : mult < 1 ? " · fraco contra ele" : ""}
                    </span>
                  </button>
                );
              })}
              <button type="button" className={s.voltar} onClick={voltarMenu} onKeyDown={teclaSubmenu}>
                Voltar
              </button>
            </div>
          )}

          {!ocupado && menu === "itens" && (
            <div className={s.menuGolpes} role="group" aria-label="Itens" data-grade="">
              {Object.entries(ITENS).map(([id, item]) => (
                <button
                  key={id}
                  ref={id === primeiroItem ? primeiroBotao : undefined}
                  type="button"
                  className={s.golpe}
                  data-tipo="basico"
                  disabled={!itemUsavel(id)}
                  onClick={() => agir({ tipo: "item", id })}
                  onKeyDown={teclaSubmenu}
                >
                  <Cursor />
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
                onClick={voltarMenu}
                onKeyDown={teclaSubmenu}
              >
                Voltar
              </button>
            </div>
          )}

          {!ocupado && menu === "tipos" && (
            <div className={s.menuTipos} data-grade="">
              <ul>
                {Object.keys(VANTAGEM).map((t) => (
                  <li key={t}>{MOTIVO_VANTAGEM[t]}</li>
                ))}
                <li>Golpes “Básico” não têm vantagem nem desvantagem.</li>
              </ul>
              <button ref={primeiroBotao} type="button" className={s.voltar} onClick={voltarMenu} onKeyDown={teclaSubmenu}>
                Voltar
              </button>
            </div>
          )}
        </div>

        <p className={s.avisoMarcas}>
          Marcas e logos pertencem aos seus respectivos donos; uso ilustrativo e educativo, sem afiliação.
        </p>
      </div>
    </section>
  );
}
