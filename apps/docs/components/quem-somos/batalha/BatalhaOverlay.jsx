"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Batalha from "./Batalha";
import ModalJornada from "./ModalJornada";
import { curado } from "./progresso.js";
import { TITULO_FULL_STACK, TelaFullStack, TelaResultado, tituloResultado } from "./TelaResultado";

// Batalha da Vila num modal que cobre a área inteira do jogo (variante
// "tela" do ModalJornada: a <section class="vila">, também em tela cheia),
// seguida da tela de resultado (ou da tela "Você é FULL STACK!") no mesmo
// formato. Entra e sai com a transição clássica de batalha.
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

  // "Voltar à vila" passa pelo modal, para a saída tocar a transição antes
  // de onFechar (que desmonta tudo).
  const modalRef = useRef(null);
  const voltar = useCallback(() => modalRef.current?.fechar(), []);

  if (!fim) {
    return (
      <ModalJornada ref={modalRef} variante="tela" tituloVisivel={false} titulo={chefe.ginasio}>
        <Batalha jogador={lutador} chefe={chefe} onFim={aoTerminar} />
      </ModalJornada>
    );
  }

  if (fim.zerou) {
    return (
      <ModalJornada ref={modalRef} variante="tela" ginasio={chefe.id} titulo={TITULO_FULL_STACK} onFechar={onFechar}>
        <TelaFullStack onVoltar={voltar} rotuloVoltar="Voltar à vila" />
      </ModalJornada>
    );
  }

  return (
    <ModalJornada
      ref={modalRef}
      variante="tela"
      ginasio={chefe.id}
      titulo={tituloResultado(chefe, fim.resultado)}
      onFechar={onFechar}
    >
      <TelaResultado chefe={chefe} resultado={fim.resultado} onVoltar={voltar} rotuloVoltar="Voltar à vila" />
    </ModalJornada>
  );
}
