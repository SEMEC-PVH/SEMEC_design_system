---
"@semec/ds": minor
---

Artefatos de IA, SKILLs e política de depreciação (onda 2 da auditoria de 14/10/2026).

- Contagem e lista de componentes geradas do manifest pelo `build-artifacts.mjs` (SKILL, README do pacote, `llms.txt`); `manifest.json` ganha `componentCount` e `exportName` por componente (AUD-49).
- SKILL `semec-ds` corrigida: texto grande (≥ 24px regular ou ≥ 18,66px bold), 44px como régua do DS (o 2.5.5 é AAA), tabela token → utilitário com a armadilha `text-muted`/`text-secondary`, espaçamento e escala tipográfica, nova seção "Comportamentos fixos do kit" (AUD-50, AUD-30, AUD-27, AUD-28).
- Nova seção "Padrões de tela" na SKILL: esqueleto com `SkipLink`, `Header`, `Heading`, `Footer`, landmarks, container único, título da página, tabelas no mobile e Sidebar (AUD-51); marca = `brand-hero`, ação = `primary` (AUD-58).
- O prompt por componente (`dsPrompt`) passa a mandar usar o componente de `@semec/ds/react` em vez de recriá-lo; a SKILL publicada no npm e no site sai sem as seções de mantenedor (AUD-67).
- Variante lite coerente com "sem React": `@semec/ds/lite/tokens.css` sem `@source` para `dist/react` (AUD-68).
- Depreciação: anunciado para sair na 4.0 (ADR-013): import por caminho de arquivo em `dist/` (AUD-20), `onChange(value)`/`onChange(files)` nos campos não nativos (AUD-35), utilitários de primitivo `bg-pv-*`/`text-pv-*` (AUD-55), valores atuais de `rounded-sm`/`rounded-lg` (AUD-57) e `disabled` nativo do `Button` como seletor (AUD-63). Lista em CONTRIBUTING.md § Depreciações anunciadas; errata da 2.0.0 no CHANGELOG (AUD-43).
