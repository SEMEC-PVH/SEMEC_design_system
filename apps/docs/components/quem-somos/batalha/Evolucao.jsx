"use client";

import { useEffect, useRef, useState } from "react";
import { LINGUAGENS } from "./dados";
import { Sprite } from "./Sprite";
import s from "./batalha.module.css";

// Cena de evolução no estilo dos RPGs clássicos de GBA: a linguagem aparece
// sozinha no centro, vira uma silhueta branca, as silhuetas da forma antiga e
// da nova se alternam cada vez mais rápido, um clarão cobre tudo e a nova
// forma surge colorida com uma explosão de faíscas.
//
// Decorativa (aria-hidden): as mensagens vão para a caixa de texto da batalha
// (aria-live), via onRevelar/onFim no pai. Com movimento reduzido, a troca
// é direta, sem alternância, raios, faíscas nem clarão.

// Quanto cada forma fica na tela durante a troca (ms): acelera até piscar.
const TROCAS = [520, 440, 370, 310, 260, 220, 185, 155, 130, 110, 95, 85, 75, 70, 65, 60, 60, 60, 60, 60];
const DURACAO = { intro: 1600, brilho: 1000, flash: 450, revelado: 2800, reduzido: 1800 };
const FAISCAS = 12;

function Forma({ especieId, ativa }) {
  const l = LINGUAGENS[especieId];
  return (
    <div className={s.evoForma} data-ativa={ativa}>
      <Sprite especieId={especieId} vista="frente" sigla={l.sigla} tipo={l.tipo} className={s.evoSprite} />
    </div>
  );
}

export default function Evolucao({ deId, paraId, onRevelar, onFim }) {
  const [fase, setFase] = useState("intro");
  const [nova, setNova] = useState(false);
  // Os callbacks do pai mudam a cada render; a linha do tempo não reinicia.
  const cb = useRef({ onRevelar, onFim });
  useEffect(() => {
    cb.current = { onRevelar, onFim };
  });

  useEffect(() => {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = [];
    let t = 0;
    const depois = (ms, fn) => {
      t += ms;
      timers.push(setTimeout(fn, t));
    };
    const revelar = () => {
      setNova(true);
      setFase("revelado");
      cb.current.onRevelar?.();
    };

    if (reduzir) {
      depois(DURACAO.reduzido, revelar);
    } else {
      depois(DURACAO.intro, () => setFase("brilho"));
      depois(DURACAO.brilho, () => setFase("troca"));
      TROCAS.forEach((ms, i) => depois(ms, () => setNova(i % 2 === 0)));
      depois(60, () => setFase("flash"));
      depois(DURACAO.flash, revelar);
    }
    depois(DURACAO.revelado, () => cb.current.onFim?.());
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={s.evolucao} data-fase={fase} aria-hidden="true">
      <span className={s.evoRaios} />
      <span className={s.evoFaiscas}>
        {Array.from({ length: FAISCAS }, (_, i) => (
          <i key={i} />
        ))}
      </span>
      <div className={s.evoPalco}>
        <Forma especieId={deId} ativa={!nova} />
        <Forma especieId={paraId} ativa={nova} />
      </div>
      <span className={s.evoClarao} />
    </div>
  );
}
