---
"@semec/ds-tokens": major
---

Primeira versão do `@semec/ds-tokens`: os tokens do Design System SEMEC sem React nem Tailwind. Traz `tokens.css` (só as variáveis `:root`), `base.css`, `fonts.css` com a Poppins 400–700, `tokens.json` (DTCG, igual ao `@semec/ds/tokens.json`), o módulo `tokens` com tipos e as saídas geradas pelo Style Dictionary 5 para Android (`colors.xml`, `dimens.xml`), iOS (`SemecTokens.swift`) e Figma (`tokens-studio.json`, com as referências L1 → L0). Fonte de verdade: o `tokens.css` do `@semec/ds` (ADR-026).
