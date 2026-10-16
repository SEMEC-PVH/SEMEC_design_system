---
"@semec/ds": patch
---

Remove os marcadores de conflito de merge do exemplo canônico da SKILL `semec-ds` (TST-02, #49). O lado HEAD (código que não compilava: `errors.length` sobre objeto e `handleSubmit` sem callback) saiu; ficou o lado SEM-817. A SKILL publicada no tarball (`@semec/ds/skills/semec-ds`), no site e em `.claude/` / `.opencode/` volta a ter só código válido.

- `build-artifacts.mjs` (roda no `build` do pacote) agora falha se encontrar marcadores (`<<<<<<<`, `=======`, `>>>>>>>` no início da linha) nas fontes dos artefatos (SKILLs, `manifest.js`, README, tokens, fontes dos componentes) ou nos artefatos gerados. As fontes são checadas antes de qualquer escrita.
- O gate (`npm run gate`) ganha a checagem `[marcadores]`, que varre todos os arquivos de texto versionados do repositório.
