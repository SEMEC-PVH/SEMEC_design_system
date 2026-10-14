---
"@semec/ds": minor
---

Publica o que já estava no `main` e não saiu no npm 3.0.0 (diff `fb7d782..main` em `packages/react`).

**Novidades**

- `ErrorState`: estado de falha ao carregar, com `title`, `description`, `icon`, `action`, `onRetry`/`retryLabel` (padrão "Tentar novamente") e `variant` `"default"` ou `"inline"`.
- `FormHeader` e `SectionHeader` (no módulo do Card): cabeçalho de formulário em faixa e cabeçalho de seção com `title`, `description` e `badge`.
- `Button` com `variant="success"`.
- `portalContainer` em `Combobox` e `DropdownMenuContent`, para escolher onde a camada flutuante é montada (por exemplo, o `body` de um iframe).
- Tokens `--pv-green-500` (#82C353) e `--pv-blue-900` (#26325B), com utilitários `bg-pv-green-500`/`text-pv-blue-900` e as mesmas cores no preset JS (`pv-green.500`, `pv-blue.900`).

**Correções**

- `DataTable`: ordenação por teclado (botão no cabeçalho com "Ordenar por …"), `aria-sort` e `scope="col"`.
- `InputOTP`: `value` e `onChange` passam a ser opcionais (sem `onChange` vira só leitura, sem erro), e o separador fica `aria-hidden`.
- `DatePicker` esconde o ícone nativo de calendário do WebKit (o do kit continua).
- `Select`: o conteúdo acompanha a largura do gatilho, e os itens longos quebram linha.
- `AlertDescription` formata listas (`ul`/`ol`).

**Mudanças visuais (sem mudança de API)**

- `Toast`: a pilha passa para o canto superior direito; a variante `success` ganha fundo verde `--pv-green-500` com texto `--pv-blue-900`; o título fica 16px/bold.
- `Input`, `Textarea` e `Select` passam a usar fundo `bg-surface` (branco) em vez de `bg-background`.
- A cor `--color-input` (borda dos campos, classe `border-input`) passa de `--border-strong` para `--border`, que é mais clara. Quem precisa da borda anterior pode usar `border-border-strong`.
