---
"@semec/ds": minor
---

Overlays acessíveis (onda 2 da auditoria):

- `AlertDialog` passa a usar `@radix-ui/react-alert-dialog` (AUD-34, Refs #34): `role="alertdialog"`, sempre modal, não fecha por clique fora e abre com o foco em `AlertDialogCancel`. Todos os exports e props anteriores continuam aceitos; `modal` (no `AlertDialog`) e `onPointerDownOutside`/`onInteractOutside` (no `AlertDialogContent`) ficam `@deprecated` e são ignorados. `AlertDialogAction` e `AlertDialogCancel` ganham a prop `variant` (as do `Button`; padrão `primary` e `outline`) e passam a 44px de altura. Novos tipos exportados: `AlertDialogProps`, `AlertDialogContentProps`, `AlertDialogActionProps`, `AlertDialogCancelProps`.
- Botão X de `Dialog`, `Sheet` e `Drawer` com alvo de 44×44px (ícone continua com 16px); `DialogHeader`, `SheetHeader` e `DrawerHeader` reservam espaço à direita para o X. `ToastAction` com 44px de altura e X do Toast com alvo de 44px sem mudar a altura do aviso (AUD-10, Refs #24).
- Nova prop `closeLabel` em `DialogContent`, `SheetContent` e `DrawerContent` (padrão "Fechar") e novo tipo `DialogContentProps` (AUD-31, AUD-64).
- `SheetContent` e `DrawerContent` rolam o conteúdo longo (`overflow-y-auto`; `top`/`bottom` com altura máxima de 85dvh); `DialogContent` e `AlertDialogContent` limitados à altura da tela com rolagem. Manifest documenta o padrão controlado sem Trigger com `onCloseAutoFocus` devolvendo o foco à origem (AUD-52).
- X do Toast sem `opacity-60`: contraste de 2,76–2,87:1 para 6,91–7,56:1 (`text-muted-foreground` sobre card, `warning-surface` e `destructive-surface`); na variante `success`, de 4,06:1 para 5,85:1 (AUD-39).
- `ToasterProps` agora é `export interface` (AUD-64).
