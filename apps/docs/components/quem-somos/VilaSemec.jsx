"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Play, Sun } from "lucide-react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

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
  const [status, setStatus] = useState("loading");
  // Tela de título ("Começar"): o jogo só abre depois dela; a vila aparece
  // ao fundo em modo vitrine.
  const [started, setStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [facing, setFacing] = useState(null);
  const [talked, setTalked] = useState(() => new Set());
  const [focused, setFocused] = useState(false);
  const [clock, setClock] = useState(null);

  const openNpc = useCallback(
    (index) => {
      const m = members[index];
      if (!m) return;
      setTalked((prev) => new Set(prev).add(index));
      setDialog({
        pages: [{ title: m.name, text: `Olá! Eu sou ${m.name}, ${m.role} aqui na SEMEC.`, link: m.linkedin, linkLabel: `LinkedIn de ${m.name}` }],
        page: 0,
      });
    },
    [members]
  );

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
          reducedMotion,
          modelUrl: `${basePath}/quem-somos/gava.glb`,
          onInteract: (ev) => onInteractRef.current?.(ev),
          onFacing: setFacing,
          onReady: () => setStatus("ready"),
          onClock: setClock,
        });
        engineRef.current = engine;
        engine.setPaused(true);
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
    engineRef.current?.setPaused(!started || Boolean(dialog));
    engineRef.current?.setAttract(!started);
  }, [started, dialog, status]);

  const startGame = useCallback(() => {
    setStarted(true);
    setShowHelp(false);
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

  const advance = useCallback(() => {
    setDialog((d) => (d && d.page < d.pages.length - 1 ? { ...d, page: d.page + 1 } : null));
  }, []);
  const closeDialog = useCallback(() => setDialog(null), []);

  const onKeyDown = (e) => {
    const engine = engineRef.current;
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
    stageRef.current?.focus({ preventScroll: true });
  };

  const current = dialog ? dialog.pages[dialog.page] : null;
  const isLastPage = dialog ? dialog.page === dialog.pages.length - 1 : false;

  let hint = "";
  if (!dialog && facing?.type === "npc" && members[facing.index]) {
    hint = `Espaço: falar com ${members[facing.index].name}`;
  } else if (!dialog && facing?.type === "sign") {
    hint = "Espaço: ler a placa";
  }

  const total = members.length;

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

      {!started && (
        <div className="vila-start">
          <div className="vila-start-card">
            <h1 id="vila-titulo" className="vila-start-kicker">
              Quem Somos
            </h1>
            <p className="vila-start-logo" aria-hidden="true">
              <span>Vila</span> SEMEC
            </p>
            <p className="vila-start-sub">
              Explore a vila e conheça o time por trás do Design System da
              SEMEC Porto Velho.
            </p>
            <div className="vila-start-actions">
              <button type="button" className="vila-start-btn vila-start-btn--primary" onClick={startGame}>
                <Play aria-hidden="true" size={18} />
                Começar
              </button>
              <button
                type="button"
                className="vila-start-btn"
                aria-expanded={showHelp}
                aria-controls="vila-start-help"
                onClick={() => setShowHelp((v) => !v)}
              >
                Como jogar
              </button>
              <a className="vila-start-btn" href="#equipe">
                Ver equipe em lista
              </a>
            </div>
            {showHelp && (
              <ul id="vila-start-help" className="vila-start-help">
                <li><kbd>Setas</kbd> ou <kbd>W A S D</kbd> andar</li>
                <li><kbd>Shift</kbd> correr</li>
                <li><kbd>Espaço</kbd> ou <kbd>Enter</kbd> conversar e ler placas</li>
                <li><kbd>Esc</kbd> fechar diálogo</li>
                <li>Ou clique no mapa para andar até lá</li>
              </ul>
            )}
            <p className="vila-start-press" aria-hidden="true">
              Pressione <kbd>Enter</kbd> para começar
            </p>
          </div>
        </div>
      )}

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
          </div>
          <a className="vila-panel vila-skip" href="#equipe">
            Ver equipe em lista
          </a>
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

      {status === "ready" && started && !focused && !dialog && (
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
          <div className="vila-dialog-actions">
            {current.link && (
              <a href={current.link} target="_blank" rel="noopener noreferrer" className="vila-dialog-link" aria-label={current.linkLabel}>
                LinkedIn
              </a>
            )}
            <button type="button" className="vila-dialog-next" onClick={finishDialog}>
              {isLastPage ? (dialog.pages === INTRO ? "Jogar" : "Fechar") : "Próximo"}
              <span aria-hidden="true"> ▼</span>
            </button>
          </div>
        </div>
      )}

      {started && (
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
    </section>
  );
}
