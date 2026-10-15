---
"@semec/ds": patch
---

Correções encontradas testando a 4.0.0 como consumidor (Next 16 e Vite):

- `FormField`: a raiz ganha `content-start`. Em `grid md:grid-cols-2`, um campo com `hint` e outro sem deixavam o controle do mais curto desalinhado (as linhas internas esticavam). Fora do grid, o espaçamento não muda.
- Fundo dos campos: o gatilho do `Combobox` (e a busca dele), o `DatePicker`, os slots do `InputOTP`, o `Checkbox`, os itens do `RadioGroup` e a área do `FileUpload` passam a usar `bg-surface`, como `Input`, `Select`, `Textarea` e `PasswordInput`. A borda (`--border-strong`) fica com 3,77:1 sobre o novo fundo (antes 3,49:1 sobre `--bg`).
- `@semec/ds/skills` e `@semec/ds/lite/skills` passam a ter `.d.ts` (`types` no `exports`): em TS strict o import dava TS7016. Os tipos `DsComponent`, `DsCategory`, `DsPortal` e afins saem desses entries.
- `RadioGroup` com `invalid` (ou com erro no `FormField`) pinta a borda dos itens de vermelho, como o `Checkbox`.
- `Breadcrumb`: o separador vai para o fim do item anterior, no mesmo `li`; quando a trilha quebra no mobile, a linha nova não começa mais por um "›" solto. Continua `aria-hidden`.
- O `onChange` removido na 4.0 (`Calendar`, `Combobox`, `InputOTP`, `FileUpload`) continua recusado pelo tipo, mas o erro do `tsc` agora cita `OnChangeRemovidoUseOnValueChange` em vez de `not assignable to type 'undefined'`.
