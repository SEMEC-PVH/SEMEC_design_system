---
"@semec/ds": patch
---

Integração da onda 2 da auditoria (#34):

- `AlertDialogContent` declara `aria-modal="true"`. Sem ele, leitores de tela e o axe não reconheciam o `role="alertdialog"` como modal e acusavam `aria-hidden-focus` no conteúdo de fundo (AUD-34).
- As células do `Calendar` declaram `role="gridcell"` explicitamente, para que `aria-selected` valha em qualquer árvore de acessibilidade (AUD-37).
