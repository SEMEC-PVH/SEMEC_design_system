"use client";

// Tela de carregamento da corrida (Vila → Pista). Aparece por cima do jogo
// quando a íris fecha com a pista ainda fria e some quando o motor termina o
// preparo (vila-engine.js, onCarregamentoPista): faixas quadriculadas de
// bandeira de chegada, a barra em blocos com a bicicleta andando na ponta, a
// lista das etapas e dicas de pilotagem que trocam sozinhas. Na 2ª ida (pista
// já aquecida) o motor nem a chama.
//
// Enquanto carrega, o motor ocupa a página em rajadas (GLBs, shaders): as
// animações daqui são só de transform/opacity. Com movimento reduzido, nada
// se mexe. O foco fica onde estava (o palco do jogo): a tela não tem nada
// focável, só avisa a etapa por role="status".
import { useEffect, useState } from "react";
import { Bike, Flag } from "lucide-react";
import s from "./TelaCarregamentoPista.module.css";

// Etapas na ordem do motor (etapaPreparoPista em vila-engine.js).
const ETAPAS = [
  { id: "circuito", rotulo: "Montando o circuito" },
  { id: "torcida", rotulo: "Chamando a torcida" },
  { id: "zebras", rotulo: "Pintando as zebras" },
  { id: "graficos", rotulo: "Aquecendo os gráficos" },
  { id: "largada", rotulo: "Alinhando na largada" },
];

const DICAS = [
  "Use as setas (ou W A S D) para virar a bicicleta para qualquer lado.",
  "Duas setas juntas levam você na diagonal, ótimo para cortar as curvas.",
  "Solte as setas para frear antes das curvas fechadas.",
  "Passe pelos arcos na ordem: arco fora de ordem não conta.",
  "Duas voltas valem: a corrida acaba na linha de chegada da 2ª volta.",
  "Faça tempo de ouro para ganhar a Stack do Pedal!",
];
const DICA_MS = 4500;
const BLOCOS = 20;
const ANUNCIO_MS = 400;

// progresso 0..1 e etapa do motor (id de ETAPAS).
export default function TelaCarregamentoPista({ progresso = 0, etapa = "circuito" }) {
  const [dica, setDica] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDica((d) => (d + 1) % DICAS.length), DICA_MS);
    return () => clearInterval(id);
  }, []);

  const pct = Math.round(Math.min(Math.max(progresso, 0), 1) * 100);
  const cheios = Math.round((pct / 100) * BLOCOS);
  const etapaAtual = Math.max(
    0,
    ETAPAS.findIndex((e) => e.id === etapa)
  );
  const rotuloAtual = ETAPAS[etapaAtual].rotulo;

  // Leitor de tela: a região "status" nasce vazia (texto já presente quando
  // ela entra na página costuma não ser lido) e recebe uma mensagem por
  // etapa, depois de uma pausa curta: etapa que passa num relance não fala.
  const [anuncio, setAnuncio] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setAnuncio((a) => (a ? `${rotuloAtual}.` : `Carregando a Pista. ${rotuloAtual}.`)), ANUNCIO_MS);
    return () => clearTimeout(id);
  }, [rotuloAtual]);

  return (
    <div className={s.tela}>
      <div className={s.xadrez} data-lado="topo" aria-hidden="true" />
      <div className={s.xadrez} data-lado="base" aria-hidden="true" />

      <div className={s.caixa}>
        <h2 className={s.titulo}>
          <Flag className={s.tituloIcone} aria-hidden="true" focusable="false" />
          Carregando a Pista
        </h2>

        <div
          className={s.barra}
          role="progressbar"
          aria-label="Progresso do carregamento da Pista"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${pct}% — ${rotuloAtual}`}
        >
          <span className={s.blocos} aria-hidden="true">
            {Array.from({ length: BLOCOS }, (_, i) => (
              <span key={i} className={s.bloco} data-cheio={i < cheios || undefined}>
                {i === Math.max(cheios - 1, 0) && <Bike className={s.bike} focusable="false" />}
              </span>
            ))}
          </span>
          <span className={s.pct} aria-hidden="true">
            {pct}%
          </span>
        </div>

        <ol className={s.etapas} aria-label="Etapas">
          {ETAPAS.map((e, i) => {
            const estado = i < etapaAtual ? "feito" : i === etapaAtual ? "atual" : "falta";
            return (
              <li key={e.id} data-estado={estado}>
                <span className={s.marca} aria-hidden="true">
                  {estado === "feito" ? "✓" : ""}
                </span>
                <span className="sr-only">{estado === "feito" ? "Feito: " : estado === "atual" ? "Agora: " : "Depois: "}</span>
                {e.rotulo}
              </li>
            );
          })}
        </ol>
        <p className="sr-only" role="status" aria-live="polite">
          {anuncio}
        </p>

        <p className={s.dica}>
          <span className={s.dicaRotulo}>Dica</span>
          <span key={dica} className={s.dicaTexto}>
            {DICAS[dica]}
          </span>
        </p>
      </div>
    </div>
  );
}
