## O que muda

<!-- Problema resolvido e solução, em poucas linhas. -->

Closes #

## Checklist (ver CONTRIBUTING.md)

- [ ] Issue vinculada (exceto correção pontual)
- [ ] Changeset em `.changeset/` se o PR muda arquivo publicado do `@semec/ds` (`npm run changeset`) — a CI cobra
- [ ] `npm run build:ds` passando
- [ ] `npm run typecheck` passando
- [ ] `npm run build` passando
- [ ] `npm run lint` passando
- [ ] Artefatos de agentes regenerados e commitados (`apps/docs/public`) quando `packages/react/manifest.js` mudou — a CI cobra
- [ ] Navegação por teclado verificada ponta a ponta (Tab, Shift+Tab, Enter, Espaço, Esc, setas) e foco visível
- [ ] Contraste calculado para qualquer cor nova (4.5:1 texto, 3:1 texto grande e UI)
- [ ] Nenhum hex, `rgba()` ou `style` inline novo fora dos tokens `pv-*`
- [ ] Commits em PT-BR no formato `tipo(escopo): descrição no imperativo`

## Como foi verificado

<!-- Comandos rodados, telas conferidas, capturas. -->

## Revisão

Quando houver revisor, de preferência um code owner que **não** seja o autor (`.github/CODEOWNERS`). A aprovação não é obrigatória; a CI verde é.
Quem revisa (ou o próprio autor, sem revisor) confirma teclado, foco e contraste — não só o código.
