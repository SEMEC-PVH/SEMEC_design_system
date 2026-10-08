"use client";

import { CHEFES } from "./dados";
import s from "./batalha.module.css";

// Telas de fim de batalha, usadas pelo modal da Vila (BatalhaOverlay). Não
// têm título próprio: quem as mostra põe o título (h2 focável) acima,
// com tituloResultado() / TITULO_FULL_STACK.

export const TITULO_FULL_STACK = "Você é FULL STACK!";

export function tituloResultado(chefe, resultado) {
  if (resultado === "vitoria") return `Você conquistou a ${chefe.stack.nome}!`;
  if (resultado === "desistiu") return "Você saiu da batalha";
  return "Não foi dessa vez…";
}

function falaResultado(chefe, resultado) {
  if (resultado === "vitoria") return chefe.falaDerrota;
  if (resultado === "desistiu") {
    return "Sem pressa: o ginásio continua aberto. A experiência que você ganhou até aqui fica com você — volte quando quiser!";
  }
  return "Todo dev perde para um bug às vezes. A experiência que você ganhou fica — tome um café e tente de novo!";
}

// Vitória (fala do chefe + Stack), derrota ou desistência.
export function TelaResultado({ chefe, resultado, onVoltar, rotuloVoltar = "Voltar ao mapa" }) {
  const venceu = resultado === "vitoria";
  return (
    <>
      <div className={s.fala}>
        <p className={s.falaQuem}>{chefe.titulo}</p>
        <p>{falaResultado(chefe, resultado)}</p>
      </div>
      {venceu && (
        <div className={s.stackGanha} data-stack={chefe.stack.id} aria-hidden="true">
          {chefe.stack.nome}
        </div>
      )}
      <button type="button" className={s.botaoPrimario} onClick={onVoltar}>
        {rotuloVoltar}
      </button>
    </>
  );
}

// Fim da jornada: venceu a Diretoria com as três stacks.
export function TelaFullStack({ onVoltar, rotuloVoltar = "Voltar ao mapa" }) {
  return (
    <>
      <div className={s.fala}>
        <p>
          Front-End, Back-End e Dados: você venceu todos os ginásios e a Diretoria da SEMEC.
          Agora conhece o caminho que cada clique da população percorre — da tela ao banco de dados.
        </p>
      </div>
      <div className={s.stacks}>
        {CHEFES.map((c) => (
          <div key={c.id} className={s.stackGanha} data-stack={c.stack.id}>
            {c.stack.nome}
          </div>
        ))}
      </div>
      <p className={s.subtitulo}>Obrigado por jogar! Conheça o time de verdade na lista da equipe.</p>
      <button type="button" className={s.botaoPrimario} onClick={onVoltar}>
        {rotuloVoltar}
      </button>
    </>
  );
}
