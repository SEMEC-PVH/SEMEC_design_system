"use client";

import { useEffect, useRef } from "react";

/**
 * ErrorSummary — resumo de erros de formulário.
 *
 * Reúne, no topo do formulário, todos os erros de validação, cada um como
 * link para o campo que o causou. É requisito de acessibilidade, não
 * enfeite: sem ele, quem usa leitor de tela em um formulário longo não
 * tem como descobrir o que falhou nem onde.
 *
 * Atende aos critérios 3.3.1 (identificação de erros) e 3.3.3 (sugestão de
 * erro) da WCAG, e ao que a página "Mensagens de erro acessíveis" deste
 * site já prescreve: associar cada mensagem ao campo, anunciar para leitor
 * de tela, e não depender só de cor.
 *
 * Comportamento de foco. Ao aparecer, o resumo recebe o foco — e não o
 * primeiro campo com erro. É deliberado: quem chega pelo resumo ouve
 * quantos erros existem e quais são antes de decidir para onde ir. Levar o
 * foco direto ao primeiro campo economiza um passo e esconde os outros
 * erros. O caminho até o campo continua a um Enter de distância, pelos
 * links da lista.
 *
 * @param {string}  title     Cabeçalho do bloco.
 * @param {Array}   errors    `[{ id, message }]` — `id` é o do campo.
 * @param {boolean} autoFocus Move o foco para o resumo ao aparecer.
 * @param {*}       focusKey  Muda a cada envio para refocar em nova tentativa.
 */
export default function ErrorSummary({
  title = "Há um problema",
  errors = [],
  autoFocus = true,
  focusKey,
  className = "",
  ...rest
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (autoFocus && errors.length > 0) {
      containerRef.current?.focus();
    }
    // `focusKey` permite refocar quando a pessoa envia de novo e os erros
    // são os mesmos — sem ele, a lista idêntica não dispararia nada.
  }, [autoFocus, errors.length, focusKey]);

  // Resumo vazio nunca é renderizado: um bloco de erro sem erro é ruído,
  // e um `role="alert"` vazio faz o leitor de tela anunciar o nada.
  if (errors.length === 0) return null;

  function irParaCampo(event, id) {
    const alvo =
      document.getElementById(id) ??
      document.querySelector(`[name="${id}"]`);
    if (!alvo) return; // sem alvo, deixa o link se comportar como âncora

    event.preventDefault();

    // O id pode estar no invólucro do campo, não no controle. O foco
    // pertence ao controle.
    const focavel = alvo.matches("input, select, textarea, button")
      ? alvo
      : alvo.querySelector("input, select, textarea, button") ?? alvo;

    focavel.focus({ preventScroll: true });

    // A regra de `prefers-reduced-motion` em `globals.css` alcança o CSS,
    // não a opção `behavior` do JS. Quem pediu menos movimento salta.
    const menosMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    focavel.scrollIntoView({
      block: "center",
      behavior: menosMovimento ? "auto" : "smooth",
    });
  }

  return (
    <div
      ref={containerRef}
      role="alert"
      tabIndex={-1}
      aria-labelledby="ds-error-summary-title"
      className={`ds-error-summary ${className}`.trim()}
      {...rest}
    >
      <h2 id="ds-error-summary-title" className="ds-error-summary__title">
        {title}
      </h2>

      <ul className="ds-error-summary__list">
        {errors.map((erro) => (
          <li key={erro.id}>
            <a
              href={`#${erro.id}`}
              onClick={(event) => irParaCampo(event, erro.id)}
            >
              {erro.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
