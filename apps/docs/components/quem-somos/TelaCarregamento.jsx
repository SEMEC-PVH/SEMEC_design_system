"use client";

// Tela de carregamento da Vila SEMEC (abre com a página, some quando o motor
// avisa "pronto"): logo de cartucho como na tela de título, a equipe
// "chegando" (os retratos acendem conforme o progresso), barra em blocos com
// a porcentagem, a lista das etapas e uma dica do jogo que troca sozinha.
//
// Enquanto carrega, o motor ocupa a página em rajadas (GLBs, shaders): as
// animações daqui são só de transform/opacity, que o navegador roda fora do
// JavaScript e não congelam. Com movimento reduzido, nada se mexe.
import { useEffect, useState } from "react";
import s from "./TelaCarregamento.module.css";

const EQUIPE = [
  { id: "pedro", nome: "Pedro" },
  { id: "gava", nome: "Vinicius" },
  { id: "rafa", nome: "Rafa" },
  { id: "leo", nome: "Leo" },
  { id: "mariana", nome: "Mariana" },
  { id: "tiago", nome: "Thiago" },
  { id: "ze-carlos", nome: "Zé Carlos" },
  { id: "emily", nome: "Emily" },
];

// Etapas na ordem do motor (vila-engine.js, avancarPreparoVila). "render" é o
// fim dos gráficos; "pronto" fecha a tela.
const ETAPAS = [
  { fases: ["cargas"], rotulo: "Personagens e prédios" },
  { fases: ["compilar", "texturas", "render"], rotulo: "Gráficos e texturas" },
  { fases: ["predios"], rotulo: "SEMEC por dentro" },
];

const DICAS = [
  "Fale com o Vinicius, na porta da SEMEC, para ganhar a sua primeira linguagem.",
  "Os líderes de ginásio têm uma estrela no balão.",
  "Conserte a bicicleta do bicicletário da praça do Front-End e ande mais rápido.",
  "Segure Shift para correr; com a bicicleta, aperte B.",
  "O Pedro perdeu a ocarina dele. Que tal procurar no mato alto?",
  "Na StackDex você vê todas as Stacks que já conquistou.",
  "A Galeria da Equipe fica no 6º andar: entre no prédio e pegue o elevador.",
  "Use a roda do mouse (ou + e −) para aproximar a câmera.",
];
const DICA_MS = 5000;

// progresso 0..1 e fase do motor; podePular mostra "Continuar mesmo assim".
export default function TelaCarregamento({ baseUrl, progresso = 0, fase = "cargas", podePular = false, onPular }) {
  const [dica, setDica] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDica((d) => (d + 1) % DICAS.length), DICA_MS);
    return () => clearInterval(id);
  }, []);

  const pct = Math.round(Math.min(Math.max(progresso, 0), 1) * 100);
  const etapaAtual = Math.max(
    0,
    ETAPAS.findIndex((e) => e.fases.includes(fase))
  );
  const rotuloAtual = ETAPAS[etapaAtual]?.rotulo ?? "Quase lá";

  return (
    <div className={s.tela}>
      <div className={s.nuvens} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <p className={s.logo} aria-hidden="true">
        <span className={s.logoTop}>Vila</span>
        <span className={s.logoMain}>SEMEC</span>
      </p>

      <div className={s.caixa}>
        <h2 className={s.titulo}>Carregando a Vila</h2>

        <ul className={s.equipe} aria-hidden="true">
          {EQUIPE.map((m, i) => (
            <li key={m.id} data-chegou={pct >= ((i + 1) / (EQUIPE.length + 1)) * 100 || undefined}>
              <span className={s.avatar}>
                {/* eslint-disable-next-line @next/next/no-img-element -- export estático, retratos pequenos */}
                <img src={`${baseUrl}retratos/${m.id}.webp`} alt="" width={64} height={64} />
              </span>
              <span className={s.nome}>{m.nome}</span>
            </li>
          ))}
        </ul>

        <div className={s.barraLinha}>
          <span className={s.barraBox}>
            <progress className={s.barra} max={100} value={pct} aria-label="Progresso do carregamento" />
          </span>
          <span className={s.pct} aria-hidden="true">
            {pct}%
          </span>
        </div>

        <ol className={s.etapas} aria-label="Etapas">
          {ETAPAS.map((e, i) => {
            const estado = i < etapaAtual ? "feito" : i === etapaAtual ? "atual" : "falta";
            return (
              <li key={e.rotulo} data-estado={estado}>
                <span className={s.marca} aria-hidden="true">
                  {estado === "feito" ? "✓" : ""}
                </span>
                <span className="sr-only">{estado === "feito" ? "Feito: " : estado === "atual" ? "Agora: " : "Depois: "}</span>
                {e.rotulo}
              </li>
            );
          })}
        </ol>
        <p className="sr-only" role="status">
          {rotuloAtual}
        </p>

        <p className={s.dica}>
          <span className={s.dicaRotulo}>Dica</span>
          <span key={dica} className={s.dicaTexto}>
            {DICAS[dica]}
          </span>
        </p>

        {podePular && (
          <button type="button" className={s.pular} onClick={onPular}>
            Continuar mesmo assim
            <span className={s.pularNota}>pode travar um pouco no começo</span>
          </button>
        )}
      </div>
    </div>
  );
}
