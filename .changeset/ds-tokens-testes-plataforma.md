---
"@semec/ds-tokens": patch
---

README: nova seção "O que é testado em cada plataforma". O `SemecTokens.swift` agora é compilado e executado com `swiftc` (Swift 5 e 6), o `colors.xml`/`dimens.xml` com o `aapt2` oficial e o `tokens-studio.json` é resolvido com `@tokens-studio/sd-transforms` + Style Dictionary, com cada valor conferido contra o `tokens.json`. Nenhum arquivo gerado mudou; a seção diz também o que só um Mac com Xcode, um app Android ou o Figma confirmam.
