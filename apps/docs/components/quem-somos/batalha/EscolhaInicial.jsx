"use client";

import { GOLPES, INICIAIS, LINGUAGENS, VANTAGEM } from "./dados";
import { nomeTipo } from "./motor";
import { Sprite } from "./Sprite";
import s from "./batalha.module.css";

// Cartão de uma linguagem (sprite de frente, nome, tipo e bio) com conteúdo
// extra. Sem a imagem do sprite, aparece o monograma.
export function CartaoLinguagem({ id, children }) {
  const l = LINGUAGENS[id];
  return (
    <div className={s.cartao} data-tipo={l.tipo}>
      <Sprite especieId={id} vista="frente" sigla={l.sigla} tipo={l.tipo} className={s.cartaoRetrato} />
      <h3 className={s.cartaoNome}>{l.nome}</h3>
      <span className={s.chip} data-tipo={l.tipo}>
        {nomeTipo(l.tipo)}
      </span>
      <p className={s.cartaoBio}>{l.bio}</p>
      {children}
    </div>
  );
}

// Escolha da linguagem inicial: subtítulo + os 3 cartões. Sem título próprio
// (o modal da Vila põe o h2 acima).
export default function EscolhaInicial({ onEscolher }) {
  return (
    <>
      <p className={s.subtitulo}>
        Não existe escolha errada: cada uma é forte contra um tipo e fraca contra outro.
      </p>
      <div className={s.grade3}>
        {INICIAIS.map((id) => {
          const l = LINGUAGENS[id];
          return (
            <CartaoLinguagem key={id} id={id}>
              <p className={s.cartaoInfo}>
                Forte contra <strong>{nomeTipo(VANTAGEM[l.tipo])}</strong> · fraca contra{" "}
                <strong>{nomeTipo(Object.keys(VANTAGEM).find((t) => VANTAGEM[t] === l.tipo))}</strong>
              </p>
              <ul className={s.cartaoGolpes}>
                {l.golpes.map(([g]) => (
                  <li key={g}>{GOLPES[g].nome}</li>
                ))}
              </ul>
              <button type="button" className={s.botaoPrimario} onClick={() => onEscolher(id)}>
                Escolher {l.nome}!
              </button>
            </CartaoLinguagem>
          );
        })}
      </div>
    </>
  );
}
