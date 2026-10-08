"use client";

import { useState } from "react";
import s from "./batalha.module.css";

// Imagens das batalhas (sprites das linguagens e cenários dos ginásios), com
// fallback: as imagens são opcionais e o jogo funciona sem elas.
//
// Arquivos esperados em apps/docs/public/quem-somos/batalha/:
// - sprites/<especieId>-frente.webp e sprites/<especieId>-costas.webp
//   (ex.: python-frente.webp, python-costas.webp, anaconda-costas.webp);
// - cenarios/<chefeId>.webp (frontend, backend, database, diretoria).
//
// Sem a imagem (404 ou erro), o sprite vira o monograma (sigla na cor do
// tipo) e o cenário fica com o fundo desenhado em CSS do ginásio.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const urlSprite = (especieId, vista) => `${BASE}/quem-somos/batalha/sprites/${especieId}-${vista}.webp`;
export const urlCenario = (chefeId) => `${BASE}/quem-somos/batalha/cenarios/${chefeId}.webp`;

// Situação de cada URL nesta sessão. Uma URL que falhou não é pedida de novo
// (a cada troca de menu ou nova batalha o monograma ficaria piscando com a
// tentativa); uma que carregou já esconde o monograma na montagem seguinte.
const falharam = new Set();
const carregaram = new Set();

function useImagem(src) {
  const [, atualizar] = useState(0);
  return {
    falhou: falharam.has(src),
    carregou: carregaram.has(src),
    aoCarregar: () => {
      carregaram.add(src);
      atualizar((n) => n + 1);
    },
    aoFalhar: () => {
      falharam.add(src);
      atualizar((n) => n + 1);
    },
  };
}

// Sprite de uma linguagem. Decorativo (alt vazio, aria-hidden): o nome já
// está na caixa de status ou no cartão. A evolução troca a especieId e, com
// ela, a URL (o novo sprite é carregado; o monograma cobre a espera).
export function Sprite({ especieId, vista, sigla, tipo, className = "" }) {
  const src = urlSprite(especieId, vista);
  const { falhou, carregou, aoCarregar, aoFalhar } = useImagem(src);
  return (
    <div className={`${s.sprite} ${className}`} data-tipo={tipo} data-vista={vista} aria-hidden="true">
      {!carregou && (
        <span className={s.monograma}>
          <span className={s.sigla}>{sigla}</span>
        </span>
      )}
      {!falhou && (
        // <img> simples: export estático (sem otimização de imagem), onError
        // para o fallback e posição só por classe (next/image põe style inline).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          className={s.spriteImg}
          data-carregada={carregou}
          src={src}
          alt=""
          draggable={false}
          onLoad={aoCarregar}
          onError={aoFalhar}
        />
      )}
    </div>
  );
}

// Cenário do ginásio: imagem de fundo (object-fit: cover) sobre o fundo
// desenhado em CSS ([data-ginasio] no container), que aparece se ela faltar.
export function Cenario({ chefeId }) {
  const src = urlCenario(chefeId);
  const { falhou, aoCarregar, aoFalhar } = useImagem(src);
  if (falhou) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={s.cenarioImg} src={src} alt="" aria-hidden="true" draggable={false} onLoad={aoCarregar} onError={aoFalhar} />
  );
}
