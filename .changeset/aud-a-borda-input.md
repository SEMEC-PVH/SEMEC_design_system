---
"@semec/ds": patch
---

Corrige a regressão de contraste da borda dos campos. O token `--color-input` (e `input` no `pv-preset`) volta a usar `var(--border-strong)` em vez de `var(--border)`. A borda de Input, Textarea, Select, DatePicker, Checkbox e Radio passa de 1,24:1 para 3,77:1 sobre `--surface`, e de 1,14:1 para 3,49:1 sobre `--bg` (WCAG 1.4.11, mínimo de 3:1) (#33).
