"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Batalha from "./Batalha";
import ModalJornada from "./ModalJornada";
import { curado } from "./progresso.js";
import { TITULO_FULL_STACK, TelaFullStack, TelaResultado, tituloResultado } from "./TelaResultado";

// Batalha da Vila num modal sobre a página inteira, seguida da tela de
// resultado (ou da tela "Você é FULL STACK!").
//
// chefe: item de CHEFES, possivelmente com `titulo` trocado pelo nome de uma
// pessoa (ex.: { ...chefe, titulo: "Ana Souza" }).
// onFim(resultado, jogadorFinal) é do chamador: salva o progresso e DEVOLVE
// { venceu, zerou }. Este componente não salva nada.
// onFechar() fecha o modal ("Voltar à vila", "Fechar" ou Esc, só depois da batalha).
//
// Um único ModalJornada fica montado da batalha ao resultado, para o foco
// voltar ao elemento de origem só quando o modal fechar de vez.
export default function BatalhaOverlay({ chefe, jogador, onFim, onFechar }) {
  // O lutador entra curado e fixo: a Batalha guarda o próprio estado.
  const [lutador] = useState(() => curado(jogador));
  // null durante a batalha; depois { resultado, zerou }.
  const [fim, setFim] = useState(null);
  const onFimRef = useRef(onFim);
  useEffect(() => {
    onFimRef.current = onFim;
  }, [onFim]);

  const aoTerminar = useCallback((resultado, jogadorFinal) => {
    const retorno = onFimRef.current?.(resultado, jogadorFinal);
    setFim({ resultado, zerou: Boolean(retorno?.zerou) });
  }, []);

  const voltar = useCallback(() => onFechar?.(), [onFechar]);

  if (!fim) {
    return (
      <ModalJornada titulo={chefe.ginasio}>
        <Batalha jogador={lutador} chefe={chefe} onFim={aoTerminar} />
      </ModalJornada>
    );
  }

  if (fim.zerou) {
    return (
      <ModalJornada titulo={TITULO_FULL_STACK} onFechar={voltar}>
        <TelaFullStack onVoltar={voltar} rotuloVoltar="Voltar à vila" />
      </ModalJornada>
    );
  }

  return (
    <ModalJornada titulo={tituloResultado(chefe, fim.resultado)} onFechar={voltar}>
      <TelaResultado chefe={chefe} resultado={fim.resultado} onVoltar={voltar} rotuloVoltar="Voltar à vila" />
    </ModalJornada>
  );
}
