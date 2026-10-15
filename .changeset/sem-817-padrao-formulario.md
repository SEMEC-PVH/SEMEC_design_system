---
"@semec/ds": minor
---

Padronização de formulários com React Hook Form, Zod e tratamento de erros em 3 níveis (SEM-817):

- `FormField` ganha prop opcional `errorRole` ("alert" | undefined) para anúncio imediato por leitores de tela quando há validação assíncrona ou inline.
- Padrões de arquitetura documentados e integrados às skills do DS (`semec-ds` e `semec-ds-lite`) com:
  - 3 níveis de feedback de erro: Inline (`FormField`), Resumo no topo (`ErrorSummary`) e Servidor/API (`Alert variant="destructive"`).
  - Padrão oficial de validação com `react-hook-form` e `@hookform/resolvers/zod`.
  - Legenda e texto de ajuda abaixo de botões de envio e exportação ("Campos com * são obrigatórios", "O download do arquivo inicia automaticamente").
  - Foco programático no primeiro campo inválido ou no `ErrorSummary` ao submeter com erro.
