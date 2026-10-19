---
"@semec/ds": minor
---

Adiciona máscaras de data, competência e hora prontas para `InputMask`, helpers de máscara e validações Zod (SEM-845):

- `InputMask` ganha presets `data` (`99/99/9999`), `data-mes-ano` (`99/9999`), `data-hora` (`99/99/9999 99:99`) e `hora` (`99:99`), todos com `inputMode="numeric"`.
- Helpers puros exportados em `@semec/ds/react`: `maskDate`, `maskDateMonthYear`, `maskDateTime`, `maskTime`, `validateDateBR`, `validateDateMonthYear`, `validateTime`.
- Schemas Zod exportados em `@semec/ds/react/validacao`: `dateBRSchema` (com validação de dias do calendário gregoriano e anos bissextos), `dateMonthYearSchema`, `timeSchema` e `dateSchema` (aceita tanto `DD/MM/AAAA` quanto `AAAA-MM-DD`).
