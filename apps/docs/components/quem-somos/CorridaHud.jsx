"use client";

// HUD da corrida da Pista, sobre o palco do jogo (o pai é a <section class="vila">):
// contagem 3-2-1-JÁ! no meio da tela e, no topo, a barra com volta,
// cronômetro, checkpoints e recorde.
//
// Props:
//   fase              "contagem" | "correndo" | "fim"
//   n                 3 | 2 | 1 na contagem
//   inicio            performance.now() da largada (cronômetro ao vivo)
//   tempo             opcional: tempo final (ms) para congelar o relógio no "fim"
//   volta, voltas     volta atual (1..voltas) e total
//   checkpoint        checkpoints já passados nesta volta (0..totalCheckpoints)
//   totalCheckpoints  checkpoints por volta
//   recorde           ms ou null
//   reducedMotion     sem pulo da contagem
//
// Acessibilidade:
// - o cronômetro atualiza o texto direto no DOM a cada quadro (sem re-render)
//   e fica em role="timer" (aria-live desligado por padrão): o leitor de tela
//   lê o tempo quando o usuário chega nele, nunca a cada quadro;
// - uma única região aria-live="assertive" anuncia o que importa: a contagem,
//   cada checkpoint, cada volta e a chegada (com o tempo por extenso);
// - números da contagem e bolinhas são aria-hidden (o texto vai pela região);
// - paleta fixa (clara nos dois temas): gray-950 sobre white ≈ 19:1.
import { useEffect, useRef, useState } from "react";
import { formatarTempo, formatarTempoFalado } from "./corrida";
import s from "./CorridaHud.module.css";

function anuncio({ fase, n, volta, voltas, checkpoint, totalCheckpoints, tempo }) {
  if (fase === "contagem") return n ? String(n) : "";
  if (fase === "fim") return tempo != null ? `Chegada! Tempo: ${formatarTempoFalado(tempo)}.` : "Chegada!";
  if (checkpoint > 0) {
    const fimVolta = checkpoint >= totalCheckpoints;
    return `Checkpoint ${checkpoint} de ${totalCheckpoints}${voltas > 1 ? `, volta ${volta} de ${voltas}` : ""}${fimVolta ? "." : ""}`;
  }
  if (volta > 1) return volta === voltas ? `Última volta! Volta ${volta} de ${voltas}.` : `Volta ${volta} de ${voltas}.`;
  return "Já! Valendo.";
}

export default function CorridaHud({
  fase,
  n,
  inicio,
  tempo,
  volta = 1,
  voltas = 2,
  checkpoint = 0,
  totalCheckpoints = 0,
  recorde = null,
  reducedMotion = false,
}) {
  const relogioRef = useRef(null);
  // A região aria-live só fala o que muda DEPOIS de existir: o primeiro texto
  // ("3") entra um quadro após montar, para ser anunciado.
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setPronto(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const correndo = fase === "correndo";

  // Cronômetro: requestAnimationFrame escrevendo no próprio <span>.
  useEffect(() => {
    const el = relogioRef.current;
    if (!el) return undefined;
    if (!correndo || inicio == null) {
      // Fora da corrida: zero na contagem; no fim, o tempo final congelado.
      const fim = fase === "fim" ? (tempo ?? (inicio != null ? performance.now() - inicio : 0)) : 0;
      el.textContent = formatarTempo(fim);
      return undefined;
    }
    let id = 0;
    const passo = () => {
      el.textContent = formatarTempo(performance.now() - inicio);
      id = requestAnimationFrame(passo);
    };
    passo();
    return () => cancelAnimationFrame(id);
  }, [correndo, inicio, fase, tempo]);

  const texto = anuncio({ fase, n, volta, voltas, checkpoint, totalCheckpoints, tempo });
  const pontos = Array.from({ length: totalCheckpoints }, (_, i) => i < checkpoint);

  return (
    <div className={s.hud} data-reduzido={reducedMotion || undefined}>
      <div className={s.barra}>
        <p className={s.volta}>
          <span className={s.rotulo}>Volta</span>{" "}
          <strong>
            {Math.min(volta, voltas)}/{voltas}
          </strong>
        </p>
        <p className={s.tempoCaixa}>
          <span className="sr-only">Tempo: </span>
          <span ref={relogioRef} role="timer" className={s.relogio}>
            0:00.00
          </span>
        </p>
        {totalCheckpoints > 0 && (
          <p className={s.checks}>
            <span className="sr-only">
              Checkpoints: {checkpoint} de {totalCheckpoints}
            </span>
            <span className={s.pontos} aria-hidden="true">
              {pontos.map((feito, i) => (
                <span key={i} className={s.ponto} data-feito={feito || undefined} />
              ))}
            </span>
          </p>
        )}
        <p className={s.recorde}>
          <span className={s.rotulo}>Recorde</span>{" "}
          {recorde != null ? (
            <>
              <strong aria-hidden="true">{formatarTempo(recorde)}</strong>
              <span className="sr-only">{formatarTempoFalado(recorde)}</span>
            </>
          ) : (
            <strong>—</strong>
          )}
        </p>
      </div>

      {fase === "contagem" && n ? (
        <p key={n} className={s.contagem} data-n={n} aria-hidden="true">
          {n}
        </p>
      ) : null}
      {correndo && (
        <p className={`${s.contagem} ${s.ja}`} aria-hidden="true">
          JÁ!
        </p>
      )}

      <p className="sr-only" aria-live="assertive" aria-atomic="true">
        {pronto ? texto : ""}
      </p>
    </div>
  );
}
