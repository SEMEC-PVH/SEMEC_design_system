"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FICHAS } from "./fichas";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const FOCAVEIS = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

// Elementos do painel alcançáveis pelo Tab (visíveis).
const focaveis = (painel) =>
  [...painel.querySelectorAll(FOCAVEIS)].filter((el) => el.tabIndex >= 0 && el.getClientRects().length > 0);

// Imagem da ficha; se o arquivo não carregar, um selo discreto com a inicial
// (o nome e a descrição já estão no texto ao lado). Remontada a cada ficha
// (key), o erro de uma não vaza para a outra.
function FichaImagem({ ficha }) {
  const [erro, setErro] = useState(false);
  return (
    <div className="vila-ficha-figura">
      {erro ? (
        <span className="vila-ficha-sem-imagem" aria-hidden="true">
          {ficha.nome.charAt(0)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- export estático, imagem pequena já otimizada
        <img
          className="vila-ficha-img"
          src={`${basePath}/quem-somos/fichas/${ficha.imagem}`}
          alt={ficha.alt}
          width={480}
          height={720}
          onError={() => setErro(true)}
        />
      )}
    </div>
  );
}

// Ficha de um personagem ou mascote da Vila, aberta ao clicar nele no mapa.
// Diálogo modal dentro do palco (cobre a <section class="vila">, inclusive em
// tela cheia):
// - role="dialog" + aria-modal, nomeado pelo nome (h2);
// - ao abrir e ao trocar de ficha, o foco vai para o nome (tabIndex -1);
// - Tab e Shift+Tab ficam presos no painel; Esc e clique no fundo fecham;
// - os irmãos do overlay ficam `inert` enquanto a ficha está aberta. Quem
//   devolve o foco ao palco é a Vila, depois que a ficha sai da tela (o palco
//   só deixa de ser inerte na limpeza deste componente).
export default function FichaPersonagem({ id, onClose, onChange }) {
  const ficha = FICHAS[id];
  const tituloId = useId();
  const fundoRef = useRef(null);
  const painelRef = useRef(null);
  const tituloRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Abertura: fundo inerte, Esc fecha, Tab preso no painel.
  useEffect(() => {
    const fundo = fundoRef.current;
    const painel = painelRef.current;
    if (!fundo || !painel) return undefined;
    const pai = fundo.parentElement;
    const marcados = pai ? [...pai.children].filter((el) => el !== fundo && !el.inert) : [];
    for (const el of marcados) el.inert = true;

    let voltando = false;
    const aoTeclar = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        // Captura no document: os atalhos do jogo (Esc do diálogo) não agem.
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      voltando = e.shiftKey;
      const lista = focaveis(painel);
      if (lista.length === 0) {
        e.preventDefault();
        tituloRef.current?.focus();
        return;
      }
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      const ativo = document.activeElement;
      if (!painel.contains(ativo)) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primeiro).focus();
      } else if (e.shiftKey && (ativo === primeiro || ativo === tituloRef.current)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && ativo === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    // Rede de segurança: foco que escapar volta para dentro.
    const aoFocar = (e) => {
      if (painel.contains(e.target)) return;
      const lista = focaveis(painel);
      const alvo = lista.length ? (voltando ? lista[lista.length - 1] : lista[0]) : tituloRef.current;
      alvo?.focus();
    };
    document.addEventListener("keydown", aoTeclar, true);
    document.addEventListener("focusin", aoFocar, true);
    return () => {
      document.removeEventListener("keydown", aoTeclar, true);
      document.removeEventListener("focusin", aoFocar, true);
      for (const el of marcados) el.inert = false;
    };
  }, []);

  // Ao abrir e a cada troca de ficha, o foco vai para o nome (o conteúdo
  // anterior saiu da tela; o leitor de tela anuncia a ficha nova).
  useEffect(() => {
    tituloRef.current?.focus({ preventScroll: true });
  }, [id]);

  if (!ficha) return null;
  const personagem = ficha.tipo === "personagem";
  const relacionadaId = personagem ? ficha.mascote : ficha.dono;
  const relacionada = relacionadaId ? FICHAS[relacionadaId] : null;

  return (
    // Clique no fundo (fora do painel) fecha; pelo teclado, o Esc faz o mesmo.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      ref={fundoRef}
      className="vila-ficha-fundo"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={painelRef}
        className="vila-panel vila-ficha"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
      >
        <FichaImagem key={id} ficha={ficha} />
        <div className="vila-ficha-corpo">
          <p className="vila-ficha-etiqueta">{personagem ? "Personagem" : "Mascote"}</p>
          <h2 ref={tituloRef} id={tituloId} tabIndex={-1} className="vila-ficha-nome">
            {ficha.nome}
          </h2>
          {ficha.nomeCompleto && ficha.nomeCompleto !== ficha.nome && (
            <p className="vila-ficha-nome-completo">{ficha.nomeCompleto}</p>
          )}
          <p className="vila-ficha-subtitulo">{ficha.subtitulo}</p>
          <p className="vila-ficha-descricao">{ficha.descricao}</p>
          <div className="vila-ficha-acoes">
            {relacionada && (
              <button
                type="button"
                className="vila-dialog-next vila-dialog-next--primary"
                onClick={() => onChange(relacionadaId)}
              >
                {personagem ? `Ver mascote: ${relacionada.nome}` : `Ver dono: ${relacionada.nome}`}
              </button>
            )}
            <button type="button" className="vila-dialog-next" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
