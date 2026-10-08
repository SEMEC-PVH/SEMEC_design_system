"use client";

// Tela de título da Vila SEMEC, no formato dos jogos de console:
//   1. "Pressione Start" — logo sobre a vila em modo vitrine (o motor
//      sobrevoa o mapa ao fundo);
//   2. menu em caixa de RPG (moldura dupla, cursor ▶) — Novo jogo, Como
//      jogar, Ver equipe em lista. Setas movem o cursor, Enter escolhe, Esc
//      volta.
// O VilaSemec controla `started`; aqui só chamamos onStart().
import { useCallback, useEffect, useRef, useState } from "react";
import FullscreenButton from "./FullscreenButton";
import styles from "./TitleScreen.module.css";

const YEAR = 2026;

export default function TitleScreen({ onStart }) {
  const [stage, setStage] = useState("press"); // "press" | "menu" | "help"
  const menuRef = useRef(null);
  const pressRef = useRef(null);

  const openMenu = useCallback(() => setStage("menu"), []);

  // Teclado na captura da janela (o VilaSemec também escuta Enter e
  // começaria o jogo direto):
  //   - "Pressione Start": Enter/Espaço abre o menu;
  //   - menu/ajuda: Esc volta; Enter fora de um item leva o foco ao menu.
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;
      const t = e.target;
      if (t.closest?.("input, textarea, select, [contenteditable='true']")) return;
      const inBox = Boolean(t.closest?.(`.${styles.box}`));
      if (stage === "press") {
        if (e.key !== "Enter" && e.key !== " ") return;
        if (t.closest?.("a, button") && t !== pressRef.current) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        openMenu();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setStage(stage === "help" ? "menu" : "press");
      } else if ((e.key === "Enter" || e.key === " ") && !inBox && !t.closest?.("a, button")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        menuRef.current?.querySelector("button, a")?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [stage, openMenu]);

  // Ao abrir o menu ou a ajuda (ação do usuário), o foco vai para o primeiro
  // item ("Novo jogo" / "Voltar").
  useEffect(() => {
    if (stage !== "press") menuRef.current?.querySelector("button, a")?.focus({ preventScroll: true });
  }, [stage]);

  // Navegação do menu como em console: setas sobem/descem, Esc volta.
  const onMenuKey = (e) => {
    const items = [...(menuRef.current?.querySelectorAll("button, a") ?? [])];
    const i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus({ preventScroll: true });
    }
  };

  return (
    <div className={styles.root} data-stage={stage}>
      <div className={styles.vignette} aria-hidden="true" />
      <FullscreenButton className={styles.fullscreen} />

      <header className={styles.brand}>
        <h1 id="vila-titulo" className={styles.ribbon}>
          Quem Somos
        </h1>
        <p className={styles.logo} aria-hidden="true">
          <span className={styles.logoTop}>Vila</span>
          <span className={styles.logoMain}>SEMEC</span>
        </p>
        <p className={styles.tagline}>O time do Design System</p>
      </header>

      {stage === "press" && (
        <button ref={pressRef} type="button" className={styles.press} onClick={openMenu}>
          <span className={styles.pressText}>
            Pressione <span className={styles.key}>Enter</span>
          </span>
          <span className={styles.pressTouch}>Toque para começar</span>
        </button>
      )}

      {stage !== "press" && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- navegação por setas dentro do menu (os itens são botões/links)
        <div className={styles.box} onKeyDown={onMenuKey}>
          {stage === "menu" ? (
            <nav aria-label="Menu do jogo">
              <ul ref={menuRef} className={styles.menu}>
                <li>
                  <button type="button" className={styles.item} onClick={onStart}>
                    Novo jogo
                  </button>
                </li>
                <li>
                  <button type="button" className={styles.item} onClick={() => setStage("help")}>
                    Como jogar
                  </button>
                </li>
                <li>
                  <a className={styles.item} href="#equipe">
                    Ver equipe em lista
                  </a>
                </li>
              </ul>
            </nav>
          ) : (
            <div ref={menuRef}>
              <p className={styles.helpTitle}>Como jogar</p>
              <dl className={styles.help}>
                <dt>
                  <kbd>←</kbd>
                  <kbd>↑</kbd>
                  <kbd>↓</kbd>
                  <kbd>→</kbd> / <kbd>WASD</kbd>
                </dt>
                <dd>Andar</dd>
                <dt>
                  <kbd>Shift</kbd>
                </dt>
                <dd>Correr</dd>
                <dt>
                  <kbd>Espaço</kbd> / <kbd>Enter</kbd>
                </dt>
                <dd>Conversar e ler placas</dd>
                <dt>
                  <kbd>Esc</kbd>
                </dt>
                <dd>Fechar diálogo</dd>
                <dt>Clique</dt>
                <dd>Andar até o ponto</dd>
              </dl>
              <button type="button" className={styles.item} onClick={() => setStage("menu")}>
                Voltar
              </button>
            </div>
          )}
        </div>
      )}

      <footer className={styles.footer} aria-hidden="true">
        <span>© {YEAR} SEMEC Porto Velho</span>
        <span>v1.0</span>
      </footer>
    </div>
  );
}
