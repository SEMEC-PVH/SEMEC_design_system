"use client";

// Painel do close: quadro da Galeria da Equipe ou foto de uma chefia num
// andar da SEMFAZ.
//
// A câmera do jogo voa até o quadro/foto (vila-engine.js, cameraDoQuadro) e
// este painel abre ao lado (embaixo, na tela estreita): nome, cargo e bio;
// no museu, LinkedIn, GitHub e projetos (museu-dados.js); nos andares, setor,
// qualificação, e-mail e a fonte dos dados (predio/andares.js).
// Acessibilidade: diálogo modal sem portal (fica dentro da .vila, por causa
// da tela cheia); irmãos inertes enquanto aberto, foco no nome, Tab circular,
// Esc fecha e ←/→ trocam de quadro (fora dos links).

import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { useEffect, useRef } from "react";
import s from "./QuadroMuseu.module.css";

function inertizarIrmaos(el) {
  const pai = el?.parentElement;
  if (!pai) return () => {};
  const marcados = [...pai.children].filter((x) => x !== el && !x.inert);
  for (const x of marcados) x.inert = true;
  return () => {
    for (const x of marcados) x.inert = false;
  };
}

// `tipo`: "quadro" (Galeria) ou "mesa" (andares). `fonte`: { url, atualizadoEm }.
export default function QuadroMuseu({ quadros, id, tipo = "quadro", fonte = null, estreito = false, onTrocar, onFechar }) {
  const rotulo = tipo === "mesa" ? "Mesa" : "Quadro";
  const painelRef = useRef(null);
  const tituloRef = useRef(null);
  const i = quadros.findIndex((q) => q.id === id);
  const q = quadros[i];
  const anterior = quadros[(i - 1 + quadros.length) % quadros.length];
  const proximo = quadros[(i + 1) % quadros.length];

  useEffect(() => inertizarIrmaos(painelRef.current), []);
  // Abriu ou trocou de quadro: o leitor de tela começa pelo nome.
  useEffect(() => {
    tituloRef.current?.focus({ preventScroll: true });
  }, [id]);

  if (!q) return null;

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onFechar();
      return;
    }
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.target.closest("a")) {
      e.preventDefault();
      onTrocar(e.key === "ArrowLeft" ? anterior.id : proximo.id);
      return;
    }
    if (e.key !== "Tab") return;
    const focaveis = [...painelRef.current.querySelectorAll("a[href], button")];
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === tituloRef.current)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={painelRef}
      className={s.painel}
      data-estreito={estreito || undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quadro-museu-nome"
      onKeyDown={onKeyDown}
    >
      <div className={s.topo}>
        <p className={s.numero}>
          {rotulo} {i + 1} de {quadros.length}
        </p>
        <button type="button" className={s.fechar} onClick={onFechar}>
          <X aria-hidden="true" size={16} />
          {tipo === "mesa" ? "Voltar ao andar" : "Voltar à galeria"}
          <kbd className={s.tecla} aria-hidden="true">
            Esc
          </kbd>
        </button>
      </div>

      <h2 id="quadro-museu-nome" ref={tituloRef} tabIndex={-1} className={s.nome}>
        {q.nome}
      </h2>
      <p className={s.cargo}>{q.cargo}</p>
      {q.caminho?.length > 0 && (
        <p className={s.setor}>
          <span className="sr-only">Setor: </span>
          {q.caminho.slice(0, 2).join(" · ")}
        </p>
      )}
      {q.bio && tipo === "mesa" && <h3 className={s.subtitulo}>Qualificação profissional</h3>}
      {q.bio && <p className={s.bio}>{q.bio}</p>}
      {q.email && (
        <p className={s.bio}>
          <a className={s.projetoNome} href={`mailto:${q.email}`}>
            {q.email}
          </a>
        </p>
      )}

      {(q.linkedin || q.github) && (
        <div className={s.links}>
          {q.linkedin && (
            <a className={s.link} href={q.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
              <ExternalLink aria-hidden="true" size={14} />
              <span className="sr-only"> de {q.nome} (abre em nova aba)</span>
            </a>
          )}
          {q.github && (
            <a className={s.link} href={q.github} target="_blank" rel="noopener noreferrer">
              GitHub
              <ExternalLink aria-hidden="true" size={14} />
              <span className="sr-only"> de {q.nome} (abre em nova aba)</span>
            </a>
          )}
        </div>
      )}

      {q.projetos?.length > 0 && <h3 className={s.subtitulo}>Projetos no GitHub</h3>}
      <ul className={s.projetos}>
        {(q.projetos ?? []).map((p) => (
          <li key={p.url} className={s.projeto}>
            <a className={s.projetoNome} href={p.url} target="_blank" rel="noopener noreferrer">
              {p.nome}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
            {p.linguagem && <span className={s.linguagem}>{p.linguagem}</span>}
            {p.descricao && <p className={s.descricao}>{p.descricao}</p>}
          </li>
        ))}
      </ul>

      {fonte && (
        <p className={s.fonte}>
          Dados do{" "}
          <a href={fonte.url} target="_blank" rel="noopener noreferrer">
            Portal de Serviços da Prefeitura de Porto Velho
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
          , atualizados em {fonte.atualizadoEm.split("-").reverse().join("/")}.
        </p>
      )}

      <nav className={s.navegacao} aria-label={tipo === "mesa" ? "Outras mesas do andar" : "Outros quadros"}>
        <button type="button" className={s.passo} onClick={() => onTrocar(anterior.id)}>
          <ChevronLeft aria-hidden="true" size={18} />
          <span>
            <span className="sr-only">{rotulo} anterior: </span>
            {anterior.nome.split(" ")[0]}
          </span>
        </button>
        <button type="button" className={s.passo} onClick={() => onTrocar(proximo.id)}>
          <span>
            <span className="sr-only">Próxima: </span>
            {proximo.nome.split(" ")[0]}
          </span>
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </nav>
    </div>
  );
}
