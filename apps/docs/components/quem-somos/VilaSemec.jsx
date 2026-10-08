"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import TitleScreen from "./TitleScreen";
import FullscreenButton from "./FullscreenButton";
import { areaOf, CHEFE_POR_AREA, mapaDeLideres } from "./areas";
import { CHEFES, LINGUAGENS } from "./batalha/dados";
import { nomeTipo } from "./batalha/motor";
import { useProgresso } from "./batalha/progresso";
import ModalJornada from "./batalha/ModalJornada";
import EscolhaInicial from "./batalha/EscolhaInicial";
import BatalhaOverlay from "./batalha/BatalhaOverlay";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// "Líder do Ginásio Front-End" → "líder do Ginásio Front-End" (no meio da frase,
// sem perder as maiúsculas dos nomes próprios).
const minusculaInicial = (t) => t.charAt(0).toLowerCase() + t.slice(1);

const KEY_DIRS = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};
const ACTION_KEYS = new Set(["Space", "Enter", "NumpadEnter", "KeyZ"]);

const INTRO = [
  {
    title: "Bem-vindo(a) à Vila SEMEC!",
    text: "Somos o time de tecnologia e design por trás do Design System da SEMEC Porto Velho. Construímos estas ferramentas para garantir experiências digitais consistentes e acessíveis para a população.",
  },
  {
    title: "A jornada",
    text: "Toda jornada começa com uma linguagem de programação. Depois, vença os ginásios Front-End, Back-End e de Dados e conquiste uma Stack em cada um. Com as três, você vira Full Stack! Os líderes têm uma estrela no balão. Para começar, fale com a Diretoria, na sede da SEMEC.",
  },
  {
    title: "Como jogar",
    text: "Ande com as setas ou WASD (segure Shift para correr), ou clique no mapa. Fique de frente para alguém e aperte Espaço para conversar.",
  },
];

const SIGN_TEXT = {
  "boas-vindas": {
    title: "Vila SEMEC",
    text: "Onde mora o Design System da SEMEC Porto Velho. Converse com todo o time!",
  },
  diretoria: {
    title: "SEMEC · Diretoria",
    text: "Aqui se decide o rumo do Design System — e quem aprova cada componente novo.",
  },
  rio: {
    title: "Rio Madeira",
    text: "Bonito de ver, perigoso de nadar. Admire da margem.",
  },
  "back-end": {
    title: "Back-End",
    text: "Onde rodam as APIs e os serviços que conectam escolas, secretaria e população — rápidos, estáveis e documentados.",
  },
  "banco-de-dados": {
    title: "Banco de Dados",
    text: "Os dados da rede municipal de ensino, guardados com segurança e tratados conforme a LGPD.",
  },
  "front-end": {
    title: "Front-End",
    text: "Aqui nascem as interfaces e os componentes do Design System — tudo o que a população vê e toca na tela, acessível por padrão.",
  },
};

const CHEFE_POR_ID = Object.fromEntries(CHEFES.map((c) => [c.id, c]));
const GINASIOS = CHEFES.filter((c) => c.id !== "diretoria");
// Sigla visível de cada Stack no HUD (o nome completo vai para o leitor de tela).
const SIGLA_STACK = { front: "FE", back: "BE", dados: "DB", full: "FS" };
// Clique "de teclado" (detail 0) logo depois de as escolhas aparecerem vem da
// mesma tecla que abriu a conversa (Enter repetido, keyup do Espaço): ignora.
const GUARDA_ESCOLHA_MS = 350;

const DPAD = [
  { dir: "up", label: "Andar para cima", glyph: "▲" },
  { dir: "left", label: "Andar para a esquerda", glyph: "◀" },
  { dir: "right", label: "Andar para a direita", glyph: "▶" },
  { dir: "down", label: "Andar para baixo", glyph: "▼" },
];

export default function VilaSemec({ members }) {
  const hostRef = useRef(null);
  const stageRef = useRef(null);
  const engineRef = useRef(null);
  const actionsRef = useRef(null);
  const actionsShownAt = useRef(0);
  const rodadaRef = useRef(0);
  // Índices dos líderes vencidos, para marcar um engine recém-criado.
  const leadersDoneRef = useRef([]);
  const [status, setStatus] = useState("loading");
  // Tela de título ("Começar"): o jogo só abre depois dela; a vila aparece
  // ao fundo em modo vitrine.
  const [started, setStarted] = useState(false);
  // Página do diálogo: { title, text, link?, linkLabel?, actions? }, com
  // actions = [{ label, primary?, onSelect }] (só na última página).
  const [dialog, setDialog] = useState(null);
  const [facing, setFacing] = useState(null);
  const [talked, setTalked] = useState(() => new Set());
  const [focused, setFocused] = useState(false);
  const [clock, setClock] = useState(null);
  // Modal sobre a vila: { tipo: "escolha", diretor } ou
  // { tipo: "batalha", chefeId, chefe, jogador, rodada }.
  const [modal, setModal] = useState(null);

  const { progresso, temInicial, vencidos, liberado, escolherInicial, registrarResultado, recomecar } = useProgresso();

  // Índice em members → id do chefe (líderes dos ginásios e Diretoria).
  const lideres = useMemo(() => mapaDeLideres(members), [members]);
  const liderDe = useCallback(
    (chefeId) => {
      for (const [i, c] of lideres) if (c === chefeId) return i;
      return -1;
    },
    [lideres]
  );

  const closeDialog = useCallback(() => setDialog(null), []);
  const focusStage = useCallback(() => stageRef.current?.focus({ preventScroll: true }), []);
  // "Agora não": fecha a conversa e devolve o foco ao palco.
  const dismiss = useCallback(() => {
    setDialog(null);
    focusStage();
  }, [focusStage]);

  const abrirBatalha = useCallback(
    (chefeId, liderIndex) => {
      if (!progresso?.jogador) return;
      rodadaRef.current += 1;
      const base = CHEFE_POR_ID[chefeId];
      setDialog(null);
      setModal({
        tipo: "batalha",
        chefeId,
        chefe: { ...base, titulo: members[liderIndex]?.name || base.titulo },
        // Lutador congelado na abertura: o progresso muda no fim da batalha.
        jogador: progresso.jogador,
        rodada: rodadaRef.current,
      });
    },
    [members, progresso]
  );

  const acoesBatalha = useCallback(
    (chefeId, index, label = "Batalhar!") => [
      { label, primary: true, onSelect: () => abrirBatalha(chefeId, index) },
      { label: "Agora não", onSelect: dismiss },
    ],
    [abrirBatalha, dismiss]
  );

  // Abre a escolha da linguagem inicial (modal), entregue pela Diretoria.
  const acaoEscolherLinguagem = useCallback(
    (index) => ({
      label: "Escolher minha linguagem",
      primary: true,
      onSelect: () => {
        setDialog(null);
        setModal({ tipo: "escolha", diretor: index });
      },
    }),
    []
  );

  // "Recomeçar jornada": pede confirmação no próprio diálogo antes de apagar o
  // progresso. "Cancelar" vem primeiro (recebe o foco) e devolve a fala
  // anterior sem mudar nada; nenhuma das duas é a ação principal.
  const pedirRecomeco = useCallback(
    (index, falaAnterior) => {
      const title = falaAnterior.title;
      setDialog({
        pages: [
          {
            title,
            text: "Tem certeza? Você vai perder a sua linguagem, o nível e todas as Stacks conquistadas.",
            actions: [
              { label: "Cancelar", onSelect: () => setDialog({ pages: [falaAnterior], page: 0 }) },
              {
                label: "Sim, recomeçar",
                onSelect: () => {
                  // Limpa o localStorage e o estado: o HUD e os marcadores dos
                  // líderes (efeito de setLeadersDone) voltam ao início.
                  recomecar();
                  setDialog({
                    pages: [
                      {
                        title,
                        text: "Jornada reiniciada! Quando quiser, escolha a sua primeira linguagem.",
                        actions: [acaoEscolherLinguagem(index), { label: "Agora não", onSelect: dismiss }],
                      },
                    ],
                    page: 0,
                  });
                },
              },
            ],
          },
        ],
        page: 0,
      });
    },
    [recomecar, acaoEscolherLinguagem, dismiss]
  );

  // Fala de quem é líder (ginásio ou Diretoria), conforme o progresso.
  const falaDeLider = useCallback(
    (index, chefeId) => {
      const m = members[index];
      const chefe = CHEFE_POR_ID[chefeId];
      const base = { title: `${m.name} · ${chefe.titulo}`, link: m.linkedin, linkLabel: `LinkedIn de ${m.name}` };
      const venceu = vencidos.includes(chefeId);

      if (chefeId === "diretoria") {
        const intro = `Olá! Eu sou ${m.name}, ${m.role} aqui na SEMEC.`;
        if (!temInicial) {
          return {
            ...base,
            text: `${intro} Para fazer parte do time, você vai precisar de uma companheira de jornada: uma linguagem de programação. Vamos escolher a sua?`,
            actions: [acaoEscolherLinguagem(index), { label: "Agora não", onSelect: dismiss }],
          };
        }
        // Com linguagem, toda fala da Diretoria oferece recomeçar a jornada
        // (depois das ações da fala; sem ações, entra um "Fechar" antes).
        const comRecomeco = (fala) => {
          const completa = {
            ...fala,
            actions: [
              ...(fala.actions ?? [{ label: "Fechar", onSelect: dismiss }]),
              { label: "Recomeçar jornada", onSelect: () => pedirRecomeco(index, completa) },
            ],
          };
          return completa;
        };
        if (venceu) {
          return comRecomeco({
            ...base,
            text: "Parabéns, Full Stack! Você venceu os três ginásios e a Diretoria. Quer uma revanche?",
            actions: acoesBatalha(chefeId, index, "Revanche"),
          });
        }
        if (!vencidos.includes("database")) {
          const faltam = GINASIOS.filter((c) => !vencidos.includes(c.id)).length;
          const proximo = GINASIOS.find((c) => !vencidos.includes(c.id) && liberado(c.id));
          const lider = proximo ? members[liderDe(proximo.id)] : null;
          const dica = proximo ? ` Seu próximo desafio é o ${proximo.ginasio}${lider ? `, com ${lider.name}` : ""}.` : "";
          const falta = faltam === 1 ? "Falta 1 Stack" : `Faltam ${faltam} Stacks`;
          return comRecomeco({ ...base, text: `${intro} Continue firme! ${falta} para você virar Full Stack.${dica}` });
        }
        return comRecomeco({ ...base, text: `${chefe.falaInicio} Dica: ${chefe.dica}`, actions: acoesBatalha(chefeId, index) });
      }

      // Líder de ginásio.
      if (!temInicial) {
        return {
          ...base,
          text: "Você ainda não tem uma linguagem de programação. A Diretoria, na sede da SEMEC, entrega a sua primeira!",
        };
      }
      if (venceu) {
        return { ...base, text: `Você já tem a ${chefe.stack.nome}! Revanche?`, actions: acoesBatalha(chefeId, index, "Revanche") };
      }
      if (!liberado(chefeId)) {
        const requer = CHEFE_POR_ID[chefe.requer];
        return { ...base, text: `Volte quando tiver a ${requer?.stack.nome ?? "Stack anterior"}!` };
      }
      return { ...base, text: `${chefe.falaInicio} Dica: ${chefe.dica}`, actions: acoesBatalha(chefeId, index) };
    },
    [members, vencidos, temInicial, liberado, liderDe, acoesBatalha, acaoEscolherLinguagem, pedirRecomeco, dismiss]
  );

  const openNpc = useCallback(
    (index) => {
      const m = members[index];
      if (!m) return;
      setTalked((prev) => new Set(prev).add(index));
      const chefeId = lideres.get(index);
      if (chefeId) {
        setDialog({ pages: [falaDeLider(index, chefeId)], page: 0 });
        return;
      }
      // Demais pessoas: apresentação + quem lidera a área, se houver.
      let text = `Olá! Eu sou ${m.name}, ${m.role} aqui na SEMEC.`;
      const chefeArea = m.group === "interns" ? CHEFE_POR_AREA[areaOf(m.role)] : null;
      const liderIndex = chefeArea ? liderDe(chefeArea) : -1;
      if (liderIndex >= 0) {
        text += ` Quer batalhar? Fale com ${members[liderIndex].name}, ${minusculaInicial(CHEFE_POR_ID[chefeArea].titulo)}.`;
      }
      setDialog({
        pages: [{ title: m.name, text, link: m.linkedin, linkLabel: `LinkedIn de ${m.name}` }],
        page: 0,
      });
    },
    [members, lideres, liderDe, falaDeLider]
  );

  const escolher = useCallback(
    (especieId) => {
      escolherInicial(especieId);
      const diretor = modal?.tipo === "escolha" ? members[modal.diretor] : null;
      const front = liderDe("frontend");
      const onde = front >= 0 ? `: fale com ${members[front].name}, na frente do prédio` : "";
      setModal(null);
      setDialog({
        pages: [
          {
            title: diretor ? diretor.name : "Diretoria",
            text: `Ótima escolha! ${LINGUAGENS[especieId]?.nome ?? "A sua linguagem"} vai com você. Comece pelo Ginásio Front-End${onde}. Lá você conquista a sua primeira Stack.`,
          },
        ],
        page: 0,
      });
    },
    [escolherInicial, members, modal, liderDe]
  );

  const fecharModal = useCallback(() => setModal(null), []);

  const onInteractRef = useRef(null);
  useEffect(() => {
    onInteractRef.current = (ev) => {
      if (ev.type === "npc") openNpc(ev.index);
      else if (SIGN_TEXT[ev.id]) setDialog({ pages: [SIGN_TEXT[ev.id]], page: 0 });
    };
  }, [openNpc]);

  useEffect(() => {
    let engine = null;
    let cancelled = false;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    import("./vila-engine")
      .then(({ createVila }) => {
        if (cancelled || !hostRef.current) return;
        engine = createVila(hostRef.current, {
          members,
          leaders: new Set(mapaDeLideres(members).keys()),
          reducedMotion,
          modelUrl: `${basePath}/quem-somos/gava.glb`,
          onInteract: (ev) => onInteractRef.current?.(ev),
          onFacing: setFacing,
          onReady: () => setStatus("ready"),
          onClock: setClock,
        });
        engineRef.current = engine;
        engine.setPaused(true);
        // Engine recriado (ex.: recarga a quente) já nasce com os "✓" certos.
        engine.setLeadersDone(leadersDoneRef.current);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      engineRef.current = null;
      engine?.dispose();
    };
  }, [members]);

  useEffect(() => {
    engineRef.current?.setPaused(!started || Boolean(dialog) || Boolean(modal));
    engineRef.current?.setAttract(!started);
  }, [started, dialog, modal, status]);

  // Líderes vencidos: a estrela do balão vira "✓".
  useEffect(() => {
    const done = [];
    for (const [i, c] of lideres) if (vencidos.includes(c)) done.push(i);
    leadersDoneRef.current = done;
    engineRef.current?.setLeadersDone(done);
  }, [lideres, vencidos, status]);

  // Fechou o modal (escolha ou batalha): o foco volta ao palco e o jogo segue.
  // Roda depois da limpeza do ModalJornada, que tenta devolver o foco ao botão
  // que o abriu (já removido da tela).
  const hadModal = useRef(false);
  useEffect(() => {
    if (modal) {
      hadModal.current = true;
    } else if (hadModal.current) {
      hadModal.current = false;
      focusStage();
    }
  }, [modal, focusStage]);

  const startGame = useCallback(() => {
    setStarted(true);
    setDialog({ pages: INTRO, page: 0 });
    stageRef.current?.focus({ preventScroll: true });
  }, []);

  // Enter na tela de título começa o jogo (como "Press Start"), exceto quando
  // o foco está num campo, link ou botão — esses tratam a própria tecla.
  useEffect(() => {
    if (started) return undefined;
    const onKey = (e) => {
      if (e.key !== "Enter" || e.repeat) return;
      if (e.target.closest?.("input, textarea, select, button, a, [contenteditable='true']")) return;
      e.preventDefault();
      startGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, startGame]);

  const current = dialog ? dialog.pages[dialog.page] : null;
  const isLastPage = dialog ? dialog.page === dialog.pages.length - 1 : false;
  const choices = current && isLastPage && current.actions?.length ? current.actions : null;

  const focusChoices = useCallback(() => {
    actionsRef.current?.querySelector("button")?.focus({ preventScroll: true });
  }, []);

  // Escolhas visíveis: o foco vai para a primeira.
  useEffect(() => {
    if (!choices) return;
    actionsShownAt.current = performance.now();
    focusChoices();
  }, [choices, focusChoices]);

  // Esc fecha o diálogo também com o foco fora do palco (nas escolhas ou no
  // link). Com modal aberto, quem trata o Esc é o próprio modal.
  useEffect(() => {
    if (!dialog || modal) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape" || e.target === stageRef.current) return;
      if (!e.target.closest?.(".vila")) return;
      e.preventDefault();
      setDialog(null);
      focusStage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, modal, focusStage]);

  const advance = useCallback(() => {
    // Na página com escolhas, avançar não pula a escolha: leva o foco a ela.
    if (choices) {
      focusChoices();
      return;
    }
    setDialog((d) => (d && d.page < d.pages.length - 1 ? { ...d, page: d.page + 1 } : null));
  }, [choices, focusChoices]);

  const onKeyDown = (e) => {
    const engine = engineRef.current;
    // Modal aberto (escolha ou batalha): o palco não reage a nada.
    if (modal) return;
    if (dialog) {
      if (KEY_DIRS[e.code]) e.preventDefault();
      if (e.repeat) return;
      if (ACTION_KEYS.has(e.code)) {
        e.preventDefault();
        advance();
      } else if (e.code === "Escape") {
        e.preventDefault();
        closeDialog();
      }
      return;
    }
    if (!engine) return;
    const dir = KEY_DIRS[e.code];
    if (dir) {
      e.preventDefault();
      if (!e.repeat) engine.press(dir);
    } else if (ACTION_KEYS.has(e.code)) {
      e.preventDefault();
      if (!e.repeat) engine.interact();
    } else if (e.key === "Shift") {
      engine.setRun(true);
    }
  };

  const onKeyUp = (e) => {
    const engine = engineRef.current;
    if (!engine) return;
    const dir = KEY_DIRS[e.code];
    if (dir) engine.release(dir);
    else if (e.key === "Shift") engine.setRun(false);
  };

  const onBlur = () => {
    setFocused(false);
    engineRef.current?.releaseAll();
  };

  const finishDialog = () => {
    advance();
    focusStage();
  };

  const selectChoice = (action) => (e) => {
    // Clique de teclado vindo da mesma tecla que abriu a conversa: ignora.
    if (e.detail === 0 && performance.now() - actionsShownAt.current < GUARDA_ESCOLHA_MS) return;
    action.onSelect();
  };

  let hint = "";
  if (!dialog && !modal && facing?.type === "npc" && members[facing.index]) {
    const chefeId = lideres.get(facing.index);
    const papel = chefeId ? `, ${minusculaInicial(CHEFE_POR_ID[chefeId].titulo)}` : "";
    hint = `Espaço: falar com ${members[facing.index].name}${papel}`;
  } else if (!dialog && !modal && facing?.type === "sign") {
    hint = "Espaço: ler a placa";
  }

  const total = members.length;
  const jogador = progresso?.jogador;

  return (
    <section className="vila" aria-labelledby="vila-titulo">
      {/* `application` é o papel ARIA para uma área que consome as setas
          (o leitor de tela deixa de interceptá-las). O jsx-a11y o trata
          como não interativo, mas ele precisa de foco e de teclado. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div tabIndex={0}
        ref={stageRef}
        className="vila-stage"
        role="application"
        aria-roledescription="jogo"
        aria-label="Vila SEMEC: mapa explorável do time"
        aria-describedby="vila-instrucoes"
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onFocus={() => setFocused(true)}
        onBlur={onBlur}
        onPointerDown={() => stageRef.current?.focus()}
      >
        <div ref={hostRef} className="vila-canvas" />
      </div>

      <p id="vila-instrucoes" className="sr-only">
        Use as setas ou W A S D para andar, Shift para correr, Espaço ou Enter
        para conversar e Esc para fechar o diálogo. A mesma equipe está
        listada logo abaixo do mapa.
      </p>

      {!started && <TitleScreen onStart={startGame} />}

      {started && (
        <div className="vila-hud vila-hud--top">
          <div className="vila-panel vila-title">
            <h1 id="vila-titulo">Quem Somos</h1>
            <p className="vila-counter">
              Conversas: <strong>{talked.size}</strong>/{total}
            </p>
            {clock && (
              <p className="vila-clock">
                {clock.night ? <Moon aria-hidden="true" size={14} /> : <Sun aria-hidden="true" size={14} />}
                <span className="sr-only">{clock.night ? "Noite, " : "Dia, "}</span>
                <time>{clock.time}</time>
              </p>
            )}
            {jogador ? (
              <p className="vila-lang">
                <span className="sr-only">Sua linguagem: </span>
                <strong>{jogador.nome}</strong>
                <span className="vila-lang-nivel">Nv {jogador.nivel}</span>
                <span className="vila-lang-tipo">
                  <span className="sr-only">, tipo </span>
                  {nomeTipo(jogador.tipo)}
                </span>
              </p>
            ) : (
              <p className="vila-lang vila-lang--vazia">Sem linguagem ainda</p>
            )}
            <ul className="vila-stacks" aria-label="Stacks">
              {CHEFES.map((c) => {
                const ok = vencidos.includes(c.id);
                return (
                  <li key={c.id} className="vila-stack" data-ok={ok} title={`${c.stack.nome}${ok ? "" : " (ainda não)"}`}>
                    <span aria-hidden="true">{SIGLA_STACK[c.stack.id]}</span>
                    <span className="sr-only">
                      {c.stack.nome}: {ok ? "conquistada" : "ainda não conquistada"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="vila-hud-actions">
            <a className="vila-panel vila-skip" href="#equipe">
              Ver equipe em lista
            </a>
            <FullscreenButton />
          </div>
        </div>
      )}

      {status === "loading" && started && (
        <p className="vila-status" role="status">
          Carregando a vila…
        </p>
      )}
      {status === "error" && (
        <p className="vila-status" role="alert">
          Não foi possível carregar o mapa 3D neste navegador. A equipe está
          listada logo abaixo.
        </p>
      )}

      {status === "ready" && started && !focused && !dialog && !modal && (
        <p className="vila-chip" aria-hidden="true">
          Clique no mapa para jogar
        </p>
      )}
      {hint && (
        <p className="vila-chip vila-chip--hint" aria-hidden="true">
          {hint}
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {hint}
      </p>

      {current && (
        <div className="vila-dialog" role="region" aria-label="Diálogo" aria-live="polite">
          <p className="vila-dialog-title">{current.title}</p>
          <p className="vila-dialog-text">{current.text}</p>
          <div className="vila-dialog-actions" ref={actionsRef}>
            {current.link && (
              <a href={current.link} target="_blank" rel="noopener noreferrer" className="vila-dialog-link" aria-label={current.linkLabel}>
                LinkedIn
              </a>
            )}
            {choices ? (
              choices.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={`vila-dialog-next${action.primary ? " vila-dialog-next--primary" : ""}`}
                  onClick={selectChoice(action)}
                  onKeyDown={(e) => {
                    // Tecla segurada não dispara a escolha sozinha.
                    if (e.repeat && (e.key === "Enter" || e.key === " ")) e.preventDefault();
                  }}
                >
                  {action.label}
                </button>
              ))
            ) : (
              <button type="button" className="vila-dialog-next" onClick={finishDialog}>
                {isLastPage ? (dialog.pages === INTRO ? "Jogar" : "Fechar") : "Próximo"}
                <span aria-hidden="true"> ▼</span>
              </button>
            )}
          </div>
        </div>
      )}

      {started && !modal && (
        <div className="vila-pad" aria-label="Controles de toque" role="group">
          {DPAD.map(({ dir, label, glyph }) => (
            <button
              key={dir}
              type="button"
              className={`vila-pad-btn vila-pad-btn--${dir}`}
              aria-label={label}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture?.(e.pointerId);
                engineRef.current?.press(dir);
              }}
              onPointerUp={() => engineRef.current?.release(dir)}
              onPointerCancel={() => engineRef.current?.release(dir)}
              onClick={(e) => {
                // Ativação por teclado (detail 0): um passo por clique.
                if (e.detail === 0) engineRef.current?.step(dir);
              }}
            >
              <span aria-hidden="true">{glyph}</span>
            </button>
          ))}
          <button
            type="button"
            className="vila-pad-btn vila-pad-btn--a"
            aria-label={dialog ? "Avançar diálogo" : "Conversar"}
            onClick={() => (dialog ? advance() : engineRef.current?.interact())}
          >
            A
          </button>
        </div>
      )}

      {modal?.tipo === "escolha" && (
        <ModalJornada titulo="Escolha a sua linguagem inicial" onFechar={fecharModal}>
          <EscolhaInicial onEscolher={escolher} />
        </ModalJornada>
      )}
      {modal?.tipo === "batalha" && (
        <BatalhaOverlay
          key={modal.rodada}
          chefe={modal.chefe}
          jogador={modal.jogador}
          onFim={(resultado, jogadorFinal) => registrarResultado(modal.chefeId, resultado, jogadorFinal)}
          onFechar={fecharModal}
        />
      )}
    </section>
  );
}
