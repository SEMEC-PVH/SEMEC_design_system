---
"@semec/ds-css": minor
---

Classes dos componentes interativos, geradas do TSX/`cva` do kit como as demais: diálogo e alerta (`semec-dialog`, `semec-dialog--alert`, no `<dialog>` nativo, com o overlay no `::backdrop`), abas (`semec-tabs__*`), combobox (`semec-combobox__*`), menu (`semec-menu`, `semec-menu__*`) e accordion (`semec-accordion__*`). Os estados são os atributos do Radix (`data-state`, `data-highlighted`, `data-disabled`, `aria-selected`, `aria-expanded`, `hidden`; a opção escolhida do combobox leva `data-state="checked"` e a ativa, `data-highlighted`), os mesmos que os elementos `<semec-*>` do `@semec/ds-elements` põem. O popup do combobox e do menu é posicionado pelo CSS, abaixo do gatilho, e sobe com `data-side="top"`. A paridade compara cada um aberto com o React (estilo computado, posição, screenshot e axe).
