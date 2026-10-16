"use client";

// Escolha de personagem (depois de "Novo jogo"): os dois jogadores em 3D
// lado a lado (scene/vitrine-jogador.js) e um grupo de opções embaixo.
// ←/→ trocam, Enter confirma (o escolhido comemora com a clip `escolhido`,
// se houver), Esc volta ao menu (a TitleScreen cuida do Esc).
import { useEffect, useRef, useState } from "react";
import styles from "./TitleScreen.module.css";

export const JOGADORES = [
  {
    id: "homem",
    rotulo: "Ele",
    arquivo: "jogador-homem.glb",
    descricao: "Rapaz negro de cabelo black com degradê e barba, camisa polo mostarda, jaqueta cinza e calça azul-marinho.",
  },
  {
    id: "mulher",
    rotulo: "Ela",
    arquivo: "jogador-mulher.glb",
    descricao: "Moça parda de cabelo chanel ondulado, camiseta coral, cardigã verde-sálvia e calça jeans.",
  },
];

// Personagem escolhido, lembrado entre visitas (sem localStorage, vale o padrão).
const CHAVE_JOGADOR = "vila-semec-jogador";
export const arquivoDoJogador = (id) => (JOGADORES.find((j) => j.id === id) ?? JOGADORES[0]).arquivo;
export function lerJogadorSalvo() {
  try {
    const v = localStorage.getItem(CHAVE_JOGADOR);
    return JOGADORES.some((j) => j.id === v) ? v : null;
  } catch {
    return null;
  }
}
export function salvarJogador(id) {
  try {
    localStorage.setItem(CHAVE_JOGADOR, id);
  } catch {
    // Navegação privada/armazenamento bloqueado: só não lembra.
  }
}

// baseUrl: pasta dos GLBs (…/quem-somos/); leve: usa os -leve.glb.
// Começa no último escolhido; onConfirm(jogador) depois da comemoração.
// Só monta depois de um clique/tecla (nunca no HTML estático), então pode
// ler o navegador já no estado inicial.
export default function EscolhaPersonagem({ baseUrl, leve = false, onConfirm, onVoltar }) {
  const [sel, setSel] = useState(() => Math.max(0, JOGADORES.findIndex((j) => j.id === lerJogadorSalvo())));
  const [carregado, setCarregado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const canvasRef = useRef(null);
  const vitrineRef = useRef(null);
  const opcoesRef = useRef([]);

  useEffect(() => {
    let vitrine = null;
    let cancelado = false;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("./scene/vitrine-jogador").then(({ createVitrineJogador }) => {
      if (cancelado || !canvasRef.current) return;
      vitrine = createVitrineJogador(canvasRef.current, {
        arquivos: JOGADORES.map((j) => baseUrl + (leve ? j.arquivo.replace(/\.glb$/, "-leve.glb") : j.arquivo)),
        reducedMotion: reduzido,
        onReady: () => setCarregado(true),
      });
      vitrineRef.current = vitrine;
    });
    return () => {
      cancelado = true;
      vitrineRef.current = null;
      vitrine?.dispose();
    };
  }, [baseUrl, leve]);

  useEffect(() => {
    vitrineRef.current?.selecionar(sel);
  }, [sel, carregado]);

  const escolher = (i, foco = true) => {
    if (confirmando) return;
    setSel(i);
    if (foco) opcoesRef.current[i]?.focus({ preventScroll: true });
  };

  const confirmar = async () => {
    if (confirmando) return;
    setConfirmando(true);
    await (vitrineRef.current?.confirmar(sel) ?? Promise.resolve());
    onConfirm?.(JOGADORES[sel]);
  };

  // Grupo de opções (radio): setas trocam, Enter/Espaço confirmam.
  const onOpcaoKey = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      const passo = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
      escolher((sel + passo + JOGADORES.length) % JOGADORES.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      confirmar();
    }
  };

  // Clique na cena: o lado da tela escolhe o personagem.
  const onCenaClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    escolher(e.clientX - r.left < r.width / 2 ? 0 : 1, false);
  };

  return (
    <div className={styles.escolha}>
      <p id="vila-escolha-titulo" className={styles.helpTitle}>
        Escolha seu personagem
      </p>
      {/* Atalho de mouse (aria-hidden): o teclado usa o grupo de opções abaixo. */}
      <div className={styles.cena} onClick={onCenaClick} aria-hidden="true">
        <canvas ref={canvasRef} className={styles.cenaCanvas} />
        {!carregado && <span className={styles.cenaCarregando}>Carregando…</span>}
      </div>
      <div role="radiogroup" aria-labelledby="vila-escolha-titulo" className={styles.opcoes}>
        {JOGADORES.map((j, i) => (
          <button
            key={j.id}
            ref={(el) => (opcoesRef.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={sel === i}
            aria-describedby={`vila-escolha-${j.id}`}
            tabIndex={sel === i ? 0 : -1}
            className={styles.opcao}
            onClick={() => (sel === i ? confirmar() : escolher(i))}
            onKeyDown={onOpcaoKey}
            disabled={confirmando}
          >
            {j.rotulo}
            <span id={`vila-escolha-${j.id}`} className={styles.srOnly}>
              {j.descricao}
            </span>
          </button>
        ))}
      </div>
      <div className={styles.acoes}>
        <button type="button" className={styles.item} onClick={confirmar} disabled={confirmando}>
          Começar
        </button>
        <button type="button" className={styles.item} onClick={onVoltar} disabled={confirmando}>
          Voltar
        </button>
      </div>
      <p className={styles.nota} aria-live="polite">
        {confirmando ? `${JOGADORES[sel].rotulo === "Ela" ? "Escolhida" : "Escolhido"}! Entrando na vila…` : "← → para trocar · Enter para começar"}
      </p>
    </div>
  );
}
