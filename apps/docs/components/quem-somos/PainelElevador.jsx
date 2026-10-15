"use client";

// Botoeira do elevador do prédio da SEMFAZ: escolhe o andar. Abre quando o
// jogador pisa no elevador (ou aperta Espaço de frente para ele).
// Acessibilidade: diálogo modal sem portal (dentro da .vila, por causa da
// tela cheia), irmãos inertes, foco no andar atual, setas ↑/↓ percorrem os
// andares, Esc fecha sem sair do lugar.

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ANDARES } from "./predio/andares";
import s from "./PainelElevador.module.css";

function inertizarIrmaos(el) {
  const pai = el?.parentElement;
  if (!pai) return () => {};
  const marcados = [...pai.children].filter((x) => x !== el && !x.inert);
  for (const x of marcados) x.inert = true;
  return () => {
    for (const x of marcados) x.inert = false;
  };
}

const pessoasDo = (andar) => andar.zonas.reduce((n, z) => n + z.pessoas.length, 0);

export default function PainelElevador({ atual, onEscolher, onFechar }) {
  const painelRef = useRef(null);
  const andarAtual = ANDARES.find((a) => a.id === atual);

  useEffect(() => {
    const desfazer = inertizarIrmaos(painelRef.current);
    painelRef.current?.querySelector(`[data-andar="${atual}"]`)?.focus({ preventScroll: true });
    return desfazer;
  }, [atual]);

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onFechar();
      return;
    }
    const botoes = [...painelRef.current.querySelectorAll("button")];
    const i = botoes.indexOf(document.activeElement);
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      // A lista vai do último andar (em cima) ao térreo (embaixo).
      e.preventDefault();
      const andares = botoes.filter((b) => b.dataset.andar);
      const j = andares.indexOf(document.activeElement);
      const prox = j < 0 ? 0 : Math.min(Math.max(j + (e.key === "ArrowDown" ? 1 : -1), 0), andares.length - 1);
      andares[prox].focus();
      return;
    }
    if (e.key !== "Tab") return;
    if (e.shiftKey && i === 0) {
      e.preventDefault();
      botoes[botoes.length - 1].focus();
    } else if (!e.shiftKey && i === botoes.length - 1) {
      e.preventDefault();
      botoes[0].focus();
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div ref={painelRef} className={s.painel} role="dialog" aria-modal="true" aria-labelledby="elevador-titulo" onKeyDown={onKeyDown}>
      <div className={s.topo}>
        <h2 id="elevador-titulo" className={s.titulo}>
          Elevador
        </h2>
        <p className={s.display} aria-live="polite">
          <span className="sr-only">Você está no </span>
          {andarAtual?.rotulo}
        </p>
      </div>
      <ul className={s.lista}>
        {[...ANDARES].reverse().map((a) => {
          const aqui = a.id === atual;
          const n = pessoasDo(a);
          return (
            <li key={a.id}>
              <button
                type="button"
                className={s.andar}
                data-andar={a.id}
                aria-current={aqui ? "location" : undefined}
                onClick={() => (aqui ? onFechar() : onEscolher(a.id))}
              >
                <span className={s.numero} aria-hidden="true">
                  {a.numero === 0 ? "T" : a.numero}
                </span>
                <span className={s.textos}>
                  <span className={s.nome}>
                    <span className="sr-only">{a.rotulo}: </span>
                    {a.nome}
                  </span>
                  <span className={s.detalhe}>
                    {aqui ? "Você está aqui" : a.galeria ? "O time do Design System" : `${n} ${n === 1 ? "pessoa" : "pessoas"}`}
                  </span>
                </span>
                {!aqui &&
                  (a.numero > (andarAtual?.numero ?? 0) ? (
                    <ArrowUp aria-hidden="true" size={18} />
                  ) : (
                    <ArrowDown aria-hidden="true" size={18} />
                  ))}
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className={s.fechar} onClick={onFechar}>
        <X aria-hidden="true" size={16} />
        Ficar neste andar
      </button>
    </div>
  );
}
