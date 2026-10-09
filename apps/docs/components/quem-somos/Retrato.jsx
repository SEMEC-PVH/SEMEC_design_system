"use client";

import { useCallback, useEffect, useState } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Pausas da "máquina de escrever" (ms): pontuação segura o ritmo como num RPG.
const PAUSA_LETRA = 24;
const PAUSA_VIRGULA = 120;
const PAUSA_PONTO = 240;

// Texto aparecendo letra por letra. `chave` identifica a fala (o objeto da
// página): uma fala nova recomeça do zero mesmo que o texto seja igual.
// Com reduced motion, o texto já aparece inteiro.
export function useDigitacao(texto, chave, instantaneo) {
  const total = texto?.length ?? 0;
  const [estado, setEstado] = useState({ chave: null, n: 0 });
  const n = estado.chave === chave ? estado.n : instantaneo ? total : 0;

  useEffect(() => {
    if (!chave || n >= total) return undefined;
    const anterior = texto[n - 1] ?? "";
    const pausa = /[.!?…]/.test(anterior) ? PAUSA_PONTO : /[,;:]/.test(anterior) ? PAUSA_VIRGULA : PAUSA_LETRA;
    const id = setTimeout(() => setEstado({ chave, n: n + 1 }), pausa);
    return () => clearTimeout(id);
  }, [chave, texto, n, total]);

  const completar = useCallback(() => setEstado({ chave, n: total }), [chave, total]);
  return { visivel: texto ? texto.slice(0, n) : "", pronto: n >= total, completar };
}

// Boca aberta em sílabas: abre e fecha a cada 2 letras, fechada em espaço e
// pontuação (as pausas viram "respiro").
export function bocaAberta(visivel, pronto) {
  if (pronto || !visivel) return false;
  const ultima = visivel[visivel.length - 1];
  if (!/[\p{L}\p{N}]/u.test(ultima)) return false;
  return Math.floor(visivel.length / 2) % 2 === 0;
}

const iniciais = (nome = "") =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

// Retrato de quem fala, ao lado da caixa de diálogo. `retrato` é o nome do
// arquivo em public/quem-somos/retratos/ (<nome>.webp e <nome>-fala.webp,
// boca aberta); sem ele, monograma com as iniciais.
export default function Retrato({ membro, falando, boca }) {
  const [semFala, setSemFala] = useState(false);
  const base = membro.retrato ? `${basePath}/quem-somos/retratos/${membro.retrato}` : null;
  return (
    <div className="vila-retrato" data-falando={falando} aria-hidden="true">
      {base ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- export estático, imagem pequena já otimizada */}
          <img className="vila-retrato-img" src={`${base}.webp`} alt="" data-oculta={boca && !semFala} />
          {!semFala && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="vila-retrato-img"
              src={`${base}-fala.webp`}
              alt=""
              data-oculta={!boca}
              onError={() => setSemFala(true)}
            />
          )}
        </>
      ) : (
        <span className="vila-retrato-sigla">{iniciais(membro.name)}</span>
      )}
    </div>
  );
}
