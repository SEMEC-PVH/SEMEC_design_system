"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FICHAS } from "../fichas";
import { linkValido } from "./dados";
import styles from "./FichaMembro.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const FOCAVEIS = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

// Imagem de uma ficha (boneco ou mascote); se o arquivo não carregar, um selo
// com a inicial (o nome já está no texto ao lado). Remontada a cada membro
// (key), o erro de um não vaza para o outro.
function ImagemFicha({ ficha, className, largura, altura }) {
  const [erro, setErro] = useState(false);
  if (erro) {
    return (
      <span className={`${className} ${styles.semImagem}`} aria-hidden="true">
        {ficha.nome.charAt(0)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- export estático, imagem já otimizada (webp)
    <img
      className={className}
      src={`${basePath}/quem-somos/fichas/${ficha.imagem}`}
      alt={ficha.alt}
      width={largura}
      height={altura}
      onError={() => setErro(true)}
    />
  );
}

function IconeLinkedin() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconeGithub() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .3" />
    </svg>
  );
}

// Ficha de uma pessoa da equipe: diálogo modal nativo (<dialog> + showModal),
// que já deixa o resto da página inerte e prende o foco no diálogo.
// - nomeado pelo nome (h2); ao abrir, o foco vai para o nome (tabIndex -1);
// - Esc e clique no fundo fecham (o estado fica com quem abriu: o diálogo
//   só some quando `onFechar` desmonta este componente);
// - quem devolve o foco ao elemento que abriu é o QuemSomos.
export default function FichaMembro({ membro, onFechar }) {
  const tituloId = useId();
  const dialogoRef = useRef(null);
  const tituloRef = useRef(null);
  const onFecharRef = useRef(onFechar);
  useEffect(() => {
    onFecharRef.current = onFechar;
  }, [onFechar]);

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!dialogo) return undefined;
    if (!dialogo.open) dialogo.showModal();
    tituloRef.current?.focus({ preventScroll: true });

    // Esc: o navegador dispara "cancel" (às vezes já fecha direto, com
    // "close"); nos dois casos quem decide é o estado do QuemSomos.
    const aoCancelar = (e) => {
      e.preventDefault();
      onFecharRef.current?.();
    };
    const aoFechar = () => onFecharRef.current?.();
    // O <dialog> modal deixa o Tab sair para a barra do navegador: aqui ele
    // dá a volta dentro da ficha.
    const aoTeclar = (e) => {
      if (e.key !== "Tab") return;
      const lista = [...dialogo.querySelectorAll(FOCAVEIS)].filter((el) => el.getClientRects().length > 0);
      if (lista.length === 0) return;
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      const ativo = document.activeElement;
      if (e.shiftKey && (ativo === primeiro || ativo === tituloRef.current)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && ativo === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    dialogo.addEventListener("cancel", aoCancelar);
    dialogo.addEventListener("close", aoFechar);
    dialogo.addEventListener("keydown", aoTeclar);
    // Sem close() aqui: o "close" é assíncrono e, numa remontagem (Strict
    // Mode), chegaria ao ouvinte novo e fecharia a ficha. Ao desmontar, o
    // <dialog> sai do DOM e da camada do topo de qualquer jeito.
    return () => {
      dialogo.removeEventListener("cancel", aoCancelar);
      dialogo.removeEventListener("close", aoFechar);
      dialogo.removeEventListener("keydown", aoTeclar);
    };
  }, []);

  const ficha = FICHAS[membro?.ficha];
  if (!membro) return null;
  const mascote = ficha?.mascote ? FICHAS[ficha.mascote] : null;
  const nomeCompleto = ficha?.nomeCompleto || membro.name;
  const linkedin = linkValido(membro.linkedin) ? membro.linkedin : null;
  const github = linkValido(membro.github) ? membro.github : null;

  return (
    // O fundo (::backdrop) é o próprio <dialog>: clique fora do painel fecha.
    // Pelo teclado, o Esc faz o mesmo.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogoRef}
      className={styles.dialogo}
      aria-labelledby={tituloId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className={styles.painel}>
        <button type="button" className={styles.fecharX} onClick={onFechar} aria-label="Fechar ficha">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className={styles.figura}>
          {ficha ? (
            <ImagemFicha key={membro.ficha} ficha={ficha} className={styles.boneco} largura={480} altura={720} />
          ) : (
            <span className={`${styles.boneco} ${styles.semImagem}`} aria-hidden="true">
              {membro.name.charAt(0)}
            </span>
          )}
        </div>

        <div className={styles.corpo}>
          <h2 ref={tituloRef} id={tituloId} tabIndex={-1} className={styles.nome}>
            {nomeCompleto}
          </h2>
          <p className={styles.cargo}>{membro.role}</p>
          {membro.bio && <p className={styles.bio}>{membro.bio}</p>}
          {ficha?.descricao && ficha.descricao !== membro.bio && (
            <>
              <h3 className={styles.secao}>Na Vila SEMEC</h3>
              <p className={styles.descricao}>{ficha.descricao}</p>
            </>
          )}

          {mascote && (
            <section className={styles.mascote} aria-labelledby={`${tituloId}-mascote`}>
              <ImagemFicha key={ficha.mascote} ficha={mascote} className={styles.mascoteImg} largura={160} altura={240} />
              <div className={styles.mascoteTexto}>
                <p className={styles.mascoteEtiqueta}>Mascote</p>
                <h3 id={`${tituloId}-mascote`} className={styles.mascoteNome}>
                  {mascote.nome}
                </h3>
                <p className={styles.mascoteDescricao}>{mascote.descricao}</p>
              </div>
            </section>
          )}

          {(linkedin || github) && (
            <ul className={styles.links} aria-label={`Perfis de ${membro.name}`}>
              {linkedin && (
                <li>
                  <a className={styles.link} href={linkedin} target="_blank" rel="noopener noreferrer">
                    <IconeLinkedin />
                    LinkedIn
                    <span className="sr-only"> de {membro.name} (abre em nova aba)</span>
                  </a>
                </li>
              )}
              {github && (
                <li>
                  <a className={styles.link} href={github} target="_blank" rel="noopener noreferrer">
                    <IconeGithub />
                    GitHub
                    <span className="sr-only"> de {membro.name} (abre em nova aba)</span>
                  </a>
                </li>
              )}
            </ul>
          )}

          <div className={styles.acoes}>
            <button type="button" className={styles.fechar} onClick={onFechar}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
