"use client";

import { EQUIPE, GRUPOS, linkValido } from "./dados";
import { FICHAS } from "../fichas";
import styles from "./Equipe.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Mascote de um membro (ficha do personagem → ficha do mascote), se houver.
const mascoteDe = (membro) => {
  const id = FICHAS[membro.ficha]?.mascote;
  return id ? FICHAS[id] : null;
};

const TOTAL_MASCOTES = EQUIPE.filter((m) => mascoteDe(m)).length;

// Grupos na ordem de GRUPOS, só os que têm alguém.
const SECOES = GRUPOS.map((g) => ({
  ...g,
  membros: EQUIPE.filter((m) => m.grupo === g.id),
})).filter((g) => g.membros.length > 0);

function IconeLinkedin() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconeGithub() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .3" />
    </svg>
  );
}

function IconeControle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true" focusable="false">
      <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" />
      <path d="M17.32 5H6.68a4 4 0 0 0-3.98 3.59l-.9 8.1A2.5 2.5 0 0 0 4.29 19.5c.84 0 1.6-.45 2.02-1.17L7.5 16.5h9l1.19 1.83c.42.72 1.18 1.17 2.02 1.17a2.5 2.5 0 0 0 2.49-2.81l-.9-8.1A4 4 0 0 0 17.32 5z" />
    </svg>
  );
}

function IconeSeta() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Faixa decorativa com os bonecos de todos (os nomes estão nos cards abaixo).
function Mosaico() {
  return (
    <ul className={styles.mosaico} aria-hidden="true">
      {EQUIPE.map((m, i) => {
        const ficha = FICHAS[m.ficha];
        if (!ficha) return null;
        return (
          <li key={m.ficha} className={styles.mosaicoItem} data-pos={i % 2 ? "baixo" : "cima"}>
            {/* eslint-disable-next-line @next/next/no-img-element -- export estático, imagem pequena já otimizada */}
            <img src={`${basePath}/quem-somos/fichas/${ficha.imagem}`} alt="" width={480} height={720} loading="eager" decoding="async" />
          </li>
        );
      })}
    </ul>
  );
}

function CartaoMembro({ membro, onAbrir }) {
  const mascote = mascoteDe(membro);
  const primeiroNome = FICHAS[membro.ficha]?.nome || membro.name.split(" ")[0];
  const linkedin = linkValido(membro.linkedin) ? membro.linkedin : null;
  const github = linkValido(membro.github) ? membro.github : null;
  return (
    <li className={styles.cartao}>
      <article className={styles.cartaoCorpo}>
        <div className={styles.retratoMoldura}>
          {/* eslint-disable-next-line @next/next/no-img-element -- export estático, imagem pequena já otimizada */}
          <img className={styles.retrato} src={`${basePath}${membro.photo}`} alt={`Retrato de ${membro.name}`} width={320} height={320} loading="lazy" decoding="async" />
          {mascote && (
            <span className={styles.mascoteSelo}>
              {/* eslint-disable-next-line @next/next/no-img-element -- export estático, imagem pequena já otimizada */}
              <img src={`${basePath}/quem-somos/fichas/${mascote.imagem}`} alt="" width={480} height={720} loading="lazy" decoding="async" />
            </span>
          )}
        </div>

        <h3 className={styles.nome}>{membro.name}</h3>
        <p className={styles.cargo}>{membro.role}</p>
        {membro.bio && <p className={styles.bio}>{membro.bio}</p>}
        {mascote && (
          <p className={styles.mascoteTexto}>
            Mascote: <strong>{mascote.nome}</strong>
          </p>
        )}

        <div className={styles.rodape}>
          {(linkedin || github) && (
            <ul className={styles.links} aria-label={`Perfis de ${primeiroNome}`}>
              {linkedin && (
                <li>
                  <a href={linkedin} target="_blank" rel="noopener noreferrer" className={styles.link} aria-label={`LinkedIn de ${membro.name} (abre em nova aba)`}>
                    <IconeLinkedin />
                  </a>
                </li>
              )}
              {github && (
                <li>
                  <a href={github} target="_blank" rel="noopener noreferrer" className={styles.link} aria-label={`GitHub de ${membro.name} (abre em nova aba)`}>
                    <IconeGithub />
                  </a>
                </li>
              )}
            </ul>
          )}
          <button type="button" className={styles.verFicha} onClick={(e) => onAbrir?.(membro, e.currentTarget)}>
            Ver ficha<span className="sr-only"> de {membro.name}</span>
            <IconeSeta />
          </button>
        </div>
      </article>
    </li>
  );
}

export default function EquipePagina({ onAbrir, onJogar }) {
  return (
    // id "equipe": destino dos links "#equipe" da Vila (voltam para cá).
    <div id="equipe" className={styles.pagina}>
      <header className={styles.hero}>
        <div className={styles.heroTexto}>
          <p className={styles.sobretitulo}>Equipe do Design System</p>
          <h1 id="equipe-hero-titulo" className={styles.titulo}>
            Quem Somos
          </h1>
          <p className={styles.subtitulo}>
            Somos o time de tecnologia e design por trás do Design System da SEMEC Porto Velho. Construímos e mantemos essas ferramentas para garantir experiências digitais consistentes e acessíveis para a população.
          </p>
          <ul className={styles.numeros} aria-label="A equipe em números">
            <li>
              <strong>{EQUIPE.length}</strong> pessoas
            </li>
            <li>
              <strong>{SECOES.length}</strong> áreas
            </li>
            <li>
              <strong>{TOTAL_MASCOTES}</strong> mascotes
            </li>
          </ul>
          <div className={styles.acoes}>
            <button type="button" className={styles.cta} data-jogar-vila onClick={() => onJogar?.()}>
              <IconeControle />
              Jogar na Vila SEMEC
            </button>
            <p className={styles.ctaDica}>Conheça a equipe em 3D: batalhas, quests e a galeria do time.</p>
          </div>
        </div>
        <Mosaico />
      </header>

      {SECOES.map((secao) => (
        <section key={secao.id} className={styles.secao} data-grupo={secao.id} aria-labelledby={`equipe-${secao.id}`}>
          <div className={styles.secaoCabeca}>
            <h2 id={`equipe-${secao.id}`} className={styles.secaoTitulo}>
              {secao.rotulo}
            </h2>
            <span className={styles.secaoConta}>
              {secao.membros.length} {secao.membros.length === 1 ? "pessoa" : "pessoas"}
            </span>
          </div>
          <ul className={styles.grade}>
            {secao.membros.map((m) => (
              <CartaoMembro key={m.ficha} membro={m} onAbrir={onAbrir} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
