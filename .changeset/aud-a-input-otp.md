---
"@semec/ds": patch
---

InputOTP: o foco avança entre os dígitos, e digitar, editar o dígito do meio e colar funcionam (#16). A tela guarda a posição de cada slot, mas o `onChange` entrega só os dígitos preenchidos, sem lacunas: com "1" no slot 1 e "6" no slot 6, o valor emitido é "16". No modo controlado, a tela segue sempre o `value` do pai (se o pai truncar ou recusar, vale o `value`). Sem `value`, o componente funciona como não controlado. O anel de foco aparece só no slot focado (`focus-within`). Há `autocomplete="one-time-code"`, e o grupo tem `role="group"` rotulado: aceita `aria-label`/`aria-labelledby`, com "Código de verificação" como padrão.
