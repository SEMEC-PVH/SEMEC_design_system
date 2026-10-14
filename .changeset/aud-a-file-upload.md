---
"@semec/ds": patch
---

FileUpload: anel de foco visível na zona quando o input está focado. Novas props opcionais: `value` (controlado), `multiple`, `id` e `inputProps`. O `accept` agora também é validado ao arrastar e soltar. O `className` vale só na raiz. Dica e erro ficam ligados ao input por `aria-describedby`, com `aria-invalid` quando há erro (#18).

**Migração:** o `id` passado ao `FileUpload` agora vai para o `<input type="file">`, não para a `div` raiz. Assim `<label htmlFor>` e os links do ErrorSummary focam o campo. Se algum CSS ou teste usava esse `id` para achar a raiz, troque por `className` ou por um `data-*` na raiz.
