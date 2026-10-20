# @semec/ds-tokens

## 1.0.1

### Patch Changes

- 03072f3: README: nova seção "O que é testado em cada plataforma". O `SemecTokens.swift` agora é compilado e executado com `swiftc` (Swift 5 e 6), o `colors.xml`/`dimens.xml` com o `aapt2` oficial e o `tokens-studio.json` é resolvido com `@tokens-studio/sd-transforms` + Style Dictionary, com cada valor conferido contra o `tokens.json`. Nenhum arquivo gerado mudou; a seção diz também o que só um Mac com Xcode, um app Android ou o Figma confirmam.

## 1.0.0

### Major Changes

- 30cf9d2: Primeira versão do `@semec/ds-tokens`: os tokens do Design System SEMEC sem React nem Tailwind. Traz `tokens.css` (só as variáveis `:root`), `base.css`, `fonts.css` com a Poppins 400–700, `tokens.json` (DTCG, igual ao `@semec/ds/tokens.json`), o módulo `tokens` com tipos e as saídas geradas pelo Style Dictionary 5 para Android (`colors.xml`, `dimens.xml`), iOS (`SemecTokens.swift`) e Figma (`tokens-studio.json`, com as referências L1 → L0). Fonte de verdade: o `tokens.css` do `@semec/ds` (ADR-026).
