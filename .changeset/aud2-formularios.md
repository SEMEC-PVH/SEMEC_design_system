---
"@semec/ds": minor
---

Formulários (onda 2 da auditoria 2026-10):

- **Combobox no padrão APG** (AUD-03, #17): o gatilho é uma parada de Tab e abre uma camada nomeada com o campo de busca (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete="list"`) e a lista (`role="listbox"` + `role="option"`/`aria-selected`). Setas ↑/↓, Home/End, Enter seleciona (sem enviar o formulário), Esc fecha e devolve o foco ao gatilho, Tab fecha e segue. `ComboboxProps` passa a estender os atributos de `<button>` (`id`, `aria-*`, `disabled`…), com as novas props `name` (gera `<input type="hidden">`), `defaultValue`, `required`, `searchPlaceholder`, `emptyText` e `labels`. O nome acessível passa a ser rótulo + texto visível (corrige `label-content-name-mismatch`, WCAG 2.5.3) e funciona com `<Label htmlFor>`, FormField e `aria-labelledby`. `ariaLabel` e `emptyMessage` ficam `@deprecated`, sem remoção; o padrão genérico "Selecionar" sai.
- **FormField liga dica e erro ao campo** (AUD-21): novo `FormFieldContext` (+ `useFormField` e `useFormFieldControl`). Input, Textarea, SelectTrigger, Combobox, DatePicker, Checkbox, RadioGroup, Switch, InputOTP, FileUpload e Slider recebem `id` (gerado com `useId` se faltar), `aria-describedby` (dica + erro) e `aria-invalid` com erro, sem sobrescrever o que o consumidor passou. O `<label for>` acompanha o `id` do filho; em controles não rotuláveis (RadioGroup, InputOTP, Slider) o rótulo vira `aria-labelledby`. Novos tipos `InputProps` e `TextareaProps`.
- **Menos `role="alert"`** (AUD-22): o erro do FormField não usa mais `role="alert"` (é lido ao focar o campo; o anúncio fica com o ErrorSummary); o erro do FileUpload vira região `aria-live="polite"` sempre montada.
- **DatePicker com um só indicador** (AUD-54): o ícone virou botão "Abrir calendário" de 44px que chama `showPicker()` (recuo: foco no campo); o indicador nativo segue oculto e, no Firefox, fica só o nativo. Nova prop `labels`.
- **Alvos de 44px** (AUD-10): opções do Combobox e itens do Select com `min-h-11`, busca do Combobox `h-11`; Switch e polegar do Slider ganham área de toque de 44px sem mudar o desenho.
- **Textos sobrescrevíveis** (AUD-31): `labels` em Combobox, DatePicker, FileUpload e InputOTP (padrões em PT-BR).
- **Ícones decorativos com `aria-hidden`** (AUD-59) em Select, Checkbox e RadioGroup.
- **Tipos e ids** (AUD-64): `export interface` em `ComboboxProps`, `FormFieldProps`, `ErrorSummaryProps`, `InputOTPProps`, `InputOTPSlotProps`; o ErrorSummary troca o id fixo do título por `useId`, aceita ref de função e perde a margem externa `mb-6` (espace pelo layout).
- **Sombras por token** (AUD-29): `shadow-sm`/`shadow-lg` viram `shadow-elevation-1/2` em Combobox, Select, Checkbox, RadioGroup, Switch e InputOTP.
