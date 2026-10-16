"use client";

// Oficina da bicicleta (bicicletário da praça do Front-End): minigame de
// precisão em 3 etapas — encher o pneu, apertar o parafuso do guidão e
// lubrificar a corrente. Um cursor vai e volta na barra; "Agora!" (botão,
// Enter ou Espaço) acerta se ele estiver na faixa verde. Errar não perde
// nada: tenta de novo. Ao fim, onConcluir() entrega a bicicleta.
//
// O cursor anda por animação CSS (sem estilo inline); o acerto compara as
// caixas do cursor e da faixa na tela. Cada etapa tem faixa mais estreita e
// cursor mais rápido; com movimento reduzido, tudo mais lento e mais largo.
import { useRef, useState } from "react";
import s from "./OficinaBike.module.css";

const ETAPAS = [
  { titulo: "Encher o pneu", texto: "Bombeie e pare no verde: nem murcho, nem estourando." },
  { titulo: "Apertar o parafuso do guidão", texto: "Pare a chave na marca certa, sem espanar a rosca." },
  { titulo: "Lubrificar a corrente", texto: "Uma gota de óleo bem no elo certo." },
];

export default function OficinaBike({ onConcluir }) {
  const [etapa, setEtapa] = useState(0);
  const [aviso, setAviso] = useState("");
  const [acertou, setAcertou] = useState(false);
  const [erros, setErros] = useState(0);
  const cursorRef = useRef(null);
  const faixaRef = useRef(null);
  const fim = etapa >= ETAPAS.length;

  const tentar = () => {
    if (acertou || fim) return;
    const c = cursorRef.current?.getBoundingClientRect();
    const f = faixaRef.current?.getBoundingClientRect();
    if (!c || !f) return;
    const meio = c.left + c.width / 2;
    if (meio >= f.left && meio <= f.right) {
      setAcertou(true);
      setAviso(etapa === ETAPAS.length - 1 ? "Perfeito!" : "Acertou! Próxima etapa…");
      setTimeout(() => {
        setAcertou(false);
        setAviso("");
        setEtapa((e) => e + 1);
      }, 900);
    } else {
      setErros((n) => n + 1);
      setAviso(meio < f.left ? "Cedo demais! Tente de novo." : "Passou do ponto! Tente de novo.");
    }
  };

  if (fim) {
    return (
      <div className={s.oficina}>
        <p className={s.vitoria}>Bicicleta consertada! Ela é sua.</p>
        <p className={s.texto}>
          Ela fica no seu HUD: toque no botão da bicicleta ou aperte <kbd className={s.tecla}>B</kbd> para subir e
          descer.
        </p>
        <button type="button" className={s.agora} onClick={onConcluir}>
          Pegar a bicicleta
        </button>
      </div>
    );
  }

  const atual = ETAPAS[etapa];
  return (
    <div className={s.oficina}>
      <ol className={s.passos} aria-label="Etapas do conserto">
        {ETAPAS.map((e, i) => (
          <li key={e.titulo} data-estado={i < etapa ? "feito" : i === etapa ? "atual" : "falta"}>
            <span className="sr-only">{i < etapa ? "Feito: " : i === etapa ? "Agora: " : "Depois: "}</span>
            {e.titulo}
          </li>
        ))}
      </ol>
      <p className={s.etapa}>
        Etapa {etapa + 1} de {ETAPAS.length}: {atual.titulo}
      </p>
      <p className={s.texto}>{atual.texto}</p>
      <div className={s.barra} data-etapa={etapa} aria-hidden="true">
        <span ref={faixaRef} className={s.faixa} />
        {/* key: reinicia o vaivém a cada etapa */}
        <span key={etapa} ref={cursorRef} className={s.cursor} data-parado={acertou || undefined} />
      </div>
      <button type="button" className={s.agora} onClick={tentar} disabled={acertou}>
        Agora!
      </button>
      <p className={s.aviso} aria-live="polite" data-acerto={acertou || undefined}>
        {aviso}
      </p>
      {erros >= 3 && !acertou && <p className={s.dica}>Dica: aperte um pouquinho antes de o cursor chegar no verde.</p>}
    </div>
  );
}
