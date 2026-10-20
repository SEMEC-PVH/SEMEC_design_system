---
"@semec/ds": patch
"@semec/ds-css": patch
---

Dialog e AlertDialog deixam 1 rem de margem de cada lado em telas estreitas (320 px), em vez de encostar nas bordas. A largura passa de `w-full` para `w-[calc(100%-2rem)]`, mantendo o limite `max-w-lg`; quem sobrescreve `max-w-*` pelo `className` não é afetado. O `.semec-dialog` do @semec/ds-css acompanha o kit.
