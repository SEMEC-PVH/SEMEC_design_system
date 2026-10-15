---
"@semec/ds": minor
---

Contrato único de formulário (ADR-015, AUD-35), só aditivo:

- `onValueChange(valor)` em `Input`, `Textarea`, `DatePicker`, `Combobox`, `InputOTP`, `FileUpload` e `Calendar` (em `Input`/`Textarea`, o `onChange` nativo continua recebendo o evento).
- `invalid` (boolean → `aria-invalid` + estilo de erro) em `Input`, `Textarea`, `DatePicker`, `Checkbox`, `Switch`, `RadioGroup`, `SelectTrigger`, `Slider`, `Combobox`, `InputOTP`, `FileUpload` e `FormField` (sem mensagem). Passado explicitamente, vence o estado do `FormField`.
- `InputOTP` ganha `name` (input oculto, vai no `FormData`), `form`, `defaultValue` e `required`.
- `FileUpload` ganha `name`, `required` e `disabled` de primeiro nível.
- Correção: o `FileUpload` agora funciona em `<form>` nativo. O `input.files` acompanha a lista mostrada (antes era zerado a cada escolha, e por isso o arquivo não ia no `FormData` e o `required` nunca validava). Arquivos soltos na zona também passam a ser enviados.
- `invalid={false}` explícito dentro de um `FormField` com erro não liga mais a mensagem ao `aria-describedby` do controle.
- Tabela de equivalência por componente na emenda de 15/10/2026 do ADR-015.

Depreciação: o `onChange(value)` de `Combobox`, `InputOTP`, `DatePicker` e `Calendar` e o `onChange(files)` de `FileUpload` ficam obsoletos (aviso único em desenvolvimento) e saem na 4.0; use `onValueChange`, com a mesma assinatura. No `DatePicker`, o `onChange` passa a receber o evento nativo na 4.0.
