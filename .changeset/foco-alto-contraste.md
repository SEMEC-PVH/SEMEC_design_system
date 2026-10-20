---
"@semec/ds": patch
"@semec/ds-css": patch
---

Foco visível em alto contraste do Windows (`forced-colors: active`, WCAG 2.4.7): os componentes trocam `outline-none` por `outline-hidden` (Tailwind v4), um contorno transparente que o navegador pinta com a cor do sistema quando o anel `ring-*` (box-shadow) é removido. O item ativo do menu e do Select e a opção ativa do Combobox passam a usar `Highlight`/`HighlightText` nesse modo, e a aba ativa mantém a barra. Com cores normais, nada muda na tela. O `AccordionTrigger` alinha a pergunta longa ao início da linha (`text-start`). O avaliador de classes do kit aceita fixar uma expressão de estado pelo texto exato (usado pelo `@semec/ds-css` no Combobox).

No `@semec/ds-css`, as mesmas classes chegam ao CSS gerado, e mais: sem JavaScript, o popup do `<semec-menu>` fica no fluxo da página em vez de cobrir o conteúdo; o item `disabled` (ou `aria-disabled`) aparece apagado; o listbox e o menu dentro de `.semec-dialog` entram no fluxo do diálogo e não são cortados pela rolagem dele; `prefers-reduced-motion` também vale para o `::backdrop`; e o campo alvo do link do resumo de erros tem margem de rolagem para o rótulo continuar visível.
