"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LivroHistoria.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Ilustrações da roda de história do Zé Carlos (cenas.js, HISTORIA_DS), uma
// por trecho, em public/quem-somos/historia/N.webp (1024x683, 3:2).
export const IMAGENS_HISTORIA = [1, 2, 3, 4, 5, 6].map((n) => `${basePath}/quem-somos/historia/${n}.webp`);

// Texto alternativo de cada ilustração (o trecho narrado vem pela caixa de
// diálogo; aqui só se descreve a imagem).
export const ALTS_HISTORIA = [
  "Telas de sistemas bagunçadas, com botões de toda cor e tamanho, e uma senhora e um aluno olhando confusos.",
  "Pedro no quadro branco explicando uma ideia para o time reunido em volta.",
  "Rafa e Mariana montando blocos de cores organizados, com uma grande letra A ao lado.",
  "Leo e Thiago empilhando peças de interface, como botões e cartões, enquanto o Zé Carlos aprova com um sinal de positivo.",
  "Pessoas usando o sistema de jeitos diferentes: um senhor com lupa, uma menina só com o teclado e o Thiago ouvindo o leitor de tela, ao lado da Emily.",
  "O time acenando na frente de uma escola, com crianças em volta e um livro brilhando.",
];

// Livro de histórias aberto na frente do jogador, durante a cena da fogueira.
// Só apresentação: quem manda é `pagina` (índice da ilustração; null fecha).
// Ao sair de null o livro abre; entre páginas a folha antiga vira revelando a
// nova; ao voltar a null a capa fecha e o livro some. Não é interativo
// (pointer-events: none) e não anuncia nada: o texto vem pelo diálogo.
export default function LivroHistoria({ pagina, imagens = IMAGENS_HISTORIA, legendas = ALTS_HISTORIA }) {
  // atual: página na tela (continua durante o fechamento); virando: página
  // antiga que está virando por cima da nova; folha: chave da animação.
  const [estado, setEstado] = useState({ pedida: null, atual: null, virando: null, folha: 0, fechando: false });

  // Ajuste de estado durante o render quando a prop muda (sem efeito).
  if (pagina !== estado.pedida) {
    const s = estado;
    let novo;
    if (pagina === null) novo = { ...s, pedida: null, fechando: s.atual !== null, virando: null };
    else if (s.atual === null || s.fechando) novo = { pedida: pagina, atual: pagina, virando: null, folha: s.folha, fechando: false };
    else novo = { ...s, pedida: pagina, atual: pagina, virando: s.atual === pagina ? s.virando : s.atual, folha: s.folha + 1 };
    setEstado(novo);
  }

  // Pré-carrega todas as ilustrações na primeira vez que o livro abre, para a
  // virada de página não piscar.
  const carregou = useRef(false);
  useEffect(() => {
    if (pagina === null || carregou.current) return;
    carregou.current = true;
    imagens.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }, [pagina, imagens]);

  const { atual, virando, folha, fechando } = estado;
  if (atual === null) return null;

  const fimLivro = (e) => {
    if (e.target !== e.currentTarget || !fechando) return;
    setEstado((s) => (s.fechando ? { ...s, atual: null, virando: null, fechando: false } : s));
  };
  const fimFolha = (e) => {
    if (e.target !== e.currentTarget) return;
    setEstado((s) => ({ ...s, virando: null }));
  };

  return (
    <div className={styles.palco} data-estado={fechando ? "fechando" : "aberto"}>
      <figure className={styles.livro} onAnimationEnd={fimLivro}>
        <span className={styles.brilho} aria-hidden="true" />
        <span className={`${styles.canto} ${styles.cantoNO}`} aria-hidden="true" />
        <span className={`${styles.canto} ${styles.cantoNE}`} aria-hidden="true" />
        <span className={`${styles.canto} ${styles.cantoSO}`} aria-hidden="true" />
        <span className={`${styles.canto} ${styles.cantoSE}`} aria-hidden="true" />
        <div className={styles.folhas}>
          <div className={styles.pagina}>
            {/* eslint-disable-next-line @next/next/no-img-element -- export estático, ilustração já otimizada */}
            <img className={styles.img} src={imagens[atual]} alt={legendas[atual] ?? ""} width={1024} height={683} decoding="async" />
          </div>
          {virando !== null && (
            <div key={folha} className={styles.folha} onAnimationEnd={fimFolha} aria-hidden="true">
              <div className={`${styles.pagina} ${styles.frente}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- export estático, ilustração já otimizada */}
                <img className={styles.img} src={imagens[virando]} alt="" width={1024} height={683} />
              </div>
              <div className={`${styles.pagina} ${styles.verso}`} />
            </div>
          )}
        </div>
        {/* Capa da frente: abre ao aparecer e fecha ao sair. */}
        <span className={styles.tampa} aria-hidden="true" />
      </figure>
    </div>
  );
}
