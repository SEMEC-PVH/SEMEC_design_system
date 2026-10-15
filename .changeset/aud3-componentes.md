---
"@semec/ds": minor
---

Componentes novos e estado de carregamento no botão (AUD-36, AUD-63), sem remover nada público:

- `Stepper`: etapas de um processo em `ol`/`li`, etapa atual com `aria-current="step"`, situação de cada etapa em texto para leitor de tela, horizontal a partir de 768px e empilhado em telas estreitas; com `onStepClick`, as etapas concluídas e a atual viram botões de 44px. Textos em PT-BR sobrescrevíveis por `labels`.
- `PasswordInput`: compõe o `Input` com botão de 44px para mostrar ou ocultar a senha (`aria-pressed`, `aria-controls`, nome fixo "Mostrar senha" sobrescrevível por `labels`); repassa todas as props do `Input`, inclusive `autoComplete`.
- `InputMask`: compõe o `Input` com máscaras de CPF, CNPJ, CEP, data e telefone (fixo/celular automático) ou padrão próprio (`9`, `A`, `*`). Cursor estável ao editar no meio, colar com outra pontuação funciona, `inputMode` pela máscara, `onValueChange(masked, raw)`. Também exporta `applyInputMask` e `inputMaskPatterns`.
- `Button` ganha `loading` e `loadingText`: Spinner decorativo, `aria-busy="true"`, `aria-disabled="true"` e clique bloqueado, sem tirar o foco; o nome acessível continua sendo o texto visível. `IconButton` ganha `loading` (Spinner no lugar do ícone). O `disabled` nativo continua como antes.
- `Spinner` ganha `decorative`: só visual (raiz `<span aria-hidden>`, sem `role`, `aria-label` nem texto sr-only). Sem a prop, nada muda.
- `Button` com `loading` (e `IconButton` com `loading`, `Button asChild loading`) renderiza num React Server Component: o bloqueio do clique fica num filho `"use client"`, e o elemento é o mesmo com e sem `loading` (o foco não se perde). Com `asChild`, o spinner entra dentro do link.
- `InputMask`: dígito igual a literal do padrão (ex.: o `5` de `+55`) não é mais engolido; nos telefones, `+55`/`55` de país colado é descartado; Backspace logo depois de um literal e Delete logo antes apagam o dígito vizinho.
- `PasswordInput`: `spellCheck={false}`, `autoCapitalize="none"` e `autoCorrect="off"` por padrão (sobrescrevíveis).
