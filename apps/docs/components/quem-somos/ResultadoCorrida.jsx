"use client";

// Resultado da corrida da Pista, dentro de <ModalJornada titulo="Resultado da corrida">
// (o modal nomeia o diálogo, prende o Tab e devolve o foco ao fechar).
//
// Props:
//   tempo        ms da chegada
//   recorde      ms (já com esta corrida contada) ou null
//   novoRecorde  esta corrida bateu o recorde
//   medalha      "ouro" | "prata" | "bronze" | null
//   ganhouStack  primeiro ouro: Stack do Pedal conquistada
//   onDeNovo     "Correr de novo" (foco inicial)
//   onSair       "Voltar à Vila"
//
// Acessibilidade: o foco começa em "Correr de novo" (o ModalJornada não o
// tira de dentro do painel); o tempo grande tem versão por extenso para o
// leitor de tela; a medalha desenhada é decorativa (o nome vem em texto);
// paleta fixa clara: gray-950 sobre white ≈ 19:1.
import { useEffect, useId, useRef } from "react";
import { METAS, MEDALHAS, ROTULO_MEDALHA, formatarTempo, formatarTempoFalado } from "./corrida";
import s from "./ResultadoCorrida.module.css";

// Medalha em SVG: fita, disco e estrela; cores pelas classes (tokens).
export function IconeMedalha({ medalha, tamanho = "grande" }) {
  return (
    <svg className={s.medalha} data-medalha={medalha ?? "nenhuma"} data-tamanho={tamanho} viewBox="0 0 64 80" aria-hidden="true" focusable="false">
      <path className={s.fitaA} d="M18 2h12l8 26H26z" />
      <path className={s.fitaB} d="M46 2H34l-8 26h12z" />
      <circle className={s.disco} cx="32" cy="50" r="26" />
      <circle className={s.aro} cx="32" cy="50" r="19" />
      <path
        className={s.estrela}
        d="M32 37l3.9 7.9 8.7 1.3-6.3 6.1 1.5 8.7L32 56.9l-7.8 4.1 1.5-8.7-6.3-6.1 8.7-1.3z"
      />
    </svg>
  );
}

const COM_ARTIGO = { ouro: "o ouro", prata: "a prata", bronze: "o bronze" };

export default function ResultadoCorrida({ tempo, recorde, novoRecorde, medalha, ganhouStack, onDeNovo, onSair }) {
  const deNovoRef = useRef(null);
  useEffect(() => {
    deNovoRef.current?.focus();
  }, []);

  const metasId = useId();
  // Sem medalha: quanto faltou para o bronze. Com prata/bronze: para a próxima.
  const proxima = medalha === "ouro" ? null : medalha ? MEDALHAS[MEDALHAS.indexOf(medalha) - 1] : "bronze";
  const faltou = proxima ? tempo - METAS[proxima] : 0;

  return (
    <div className={s.resultado}>
      <div className={s.topo}>
        <IconeMedalha medalha={medalha} />
        <div>
          <p className={s.medalhaNome}>{medalha ? `Medalha de ${ROTULO_MEDALHA[medalha].toLowerCase()}` : "Sem medalha desta vez"}</p>
          <p className={s.tempo}>
            <span aria-hidden="true">{formatarTempo(tempo)}</span>
            <span className="sr-only">Tempo: {formatarTempoFalado(tempo)}</span>
          </p>
        </div>
      </div>

      {(novoRecorde || ganhouStack) && (
        <ul className={s.conquistas}>
          {novoRecorde && <li className={s.novoRecorde}>Novo recorde!</li>}
          {ganhouStack && <li className={s.stack}>Stack do Pedal conquistada!</li>}
        </ul>
      )}

      <p className={s.linha}>
        {recorde != null && !novoRecorde ? (
          <>
            Seu recorde: <strong aria-hidden="true">{formatarTempo(recorde)}</strong>
            <span className="sr-only">{formatarTempoFalado(recorde)}</span>
          </>
        ) : null}
        {proxima ? (
          <span className={s.falta}>
            {recorde != null && !novoRecorde ? " · " : ""}Faltaram <strong>{(faltou / 1000).toFixed(2).replace(".", ",")} s</strong>{" "}
            para {COM_ARTIGO[proxima]}.
          </span>
        ) : null}
      </p>

      <div className={s.metas}>
        <p className={s.metasTitulo} id={metasId}>
          Metas (2 voltas)
        </p>
        <ul aria-labelledby={metasId}>
          {MEDALHAS.map((m) => (
            <li key={m} data-ganhou={m === medalha || undefined}>
              <IconeMedalha medalha={m} tamanho="pequena" />
              <span>
                {ROTULO_MEDALHA[m]}: até <span aria-hidden="true">{formatarTempo(METAS[m])}</span>
                <span className="sr-only">{formatarTempoFalado(METAS[m])}</span>
                {m === medalha ? <span className="sr-only"> (a sua)</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className={s.botoes}>
        <button ref={deNovoRef} type="button" className={s.principal} onClick={onDeNovo}>
          Correr de novo
        </button>
        <button type="button" className={s.secundario} onClick={onSair}>
          Voltar à Vila
        </button>
      </div>
    </div>
  );
}
