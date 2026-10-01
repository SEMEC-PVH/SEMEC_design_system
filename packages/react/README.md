# @semec/ds

Design System SEMEC — componentes React + tokens CSS + artefatos para agentes de IA.

React 19 + Tailwind CSS v4 + shadcn (Radix + CVA + clsx + tailwind-merge). Tokens `pv-*` (tema claro).

## Instalação

```bash
npm install @semec/ds
```

## Uso rápido

```tsx
// 1. Importar tokens no seu CSS global
import "@semec/ds/react/tokens.css";

// 2. Usar componentes
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@semec/ds/react";

function App() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulário</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Nome" />
        <Button variant="primary">Salvar</Button>
      </CardContent>
    </Card>
  );
}
```

### Toast

```tsx
import { Toaster, useToast } from "@semec/ds/react";

// Adicionar Toaster no root do app
function App() {
  return (
    <>
      <MinhaPagina />
      <Toaster />
    </>
  );
}

// Usar em qualquer componente
function MeuComponente() {
  const { toast } = useToast();

  return (
    <Button onClick={() => toast({ title: "Salvo!", description: "Dados gravados." })}>
      Salvar
    </Button>
  );
}
```

### Sheet (modal lateral)

```tsx
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@semec/ds/react";

function Exemplo() {
  return (
    <Sheet>
      <SheetTrigger>Abrir</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Título</SheetTitle>
        </SheetHeader>
        <p>Conteúdo do sheet.</p>
      </SheetContent>
    </Sheet>
  );
}
```

## Subpath exports

| Import | O que é |
|---|---|
| `@semec/ds/react` | Todos os componentes + `cn()` |
| `@semec/ds/react/tokens.css` | Tokens `pv-*` (primitivos + semânticos) + utilitários animação |
| `@semec/ds/react/pv-preset` | Preset Tailwind v4 (JS config) |
| `@semec/ds/react/pv-preset.ts` | Preset Tailwind v4 (arquivo TS original) |
| `@semec/ds/react/server` | Helpers Node.js (ex: `getComponentMetadata()`) |
| `@semec/ds/skills` | Manifest + componentes para agentes IA |
| `@semec/ds/skills/llms.txt` | Índice para IA |
| `@semec/ds/skills/llms-full.txt` | Dump completo |
| `@semec/ds/skills/manifest.json` | JSON para consumo por máquinas |
| `@semec/ds/skills/components/*.md` | Chunk RAG por componente |
| `@semec/ds/skills/semec-ds` | Skill full do agente |
| `@semec/ds/lite/skills/semec-ds-lite` | Skill lite (tokens + a11y + responsive) |

## Componentes

46 componentes organizados por categoria:

| Categoria | Componentes |
|---|---|
| **Navegação** | Abas, Breadcrumb, Link, Menu de Navegação, Paginação, Sidebar, Trilha de Navegação |
| **Formulários** | Botão, Botão de Ícone, Caixa de Marcação, Caixa de Texto, Campo de Formulário, Combobox, DatePicker, Envio de Arquivos, Interruptor, Menu de Seleção, Menu Suspenso, RadioGroup, Select, Slider, OTP Input, Toggle |
| **Dados** | Avatar, Cartão, Etiqueta, Tabela, Tabela de Dados |
| **Feedback** | Aviso, Dialogo de Alerta, Dica, Drawer, ErrorSummary, Modal, Notificação, Popover, Progress, Toast |
| **Layout** | Acordeão, Área de Texto, Calendário, Esqueleto, Separador, Sheet, Timeline |

## Tokens

Config CSS recomendada (Tailwind v4 — o `@source` faz o Tailwind varrer as classes do pacote):

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

O caminho CSS-first acima é o que o Tailwind v4 espera. Alternativa com preset JS (opcional):

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
@config "@semec/ds/react/pv-preset";
```

## Tema

Os tokens do pacote (`tokens.css`) são tema **claro**. Não há `shadcn.css` no pacote (removido na 2.0.0).

## Validação (Zod)

Schemas Zod ficam no entry **`@semec/ds/react/validacao`** — o entry principal não importa `zod`:

```ts
import { cpfSchema, emailSchema } from "@semec/ds/react/validacao";
import { validateCPF } from "@semec/ds/react"; // helpers puros, sem zod
```

## Segurança (CSP)

Alguns componentes Radix injetam `<style>` dinamicamente (scrollbar hiding, scroll locking). Para ambientes com **Content Security Policy** estrita, use o `SemecProvider` com o nonce do servidor:

```tsx
import { SemecProvider } from "@semec/ds/react";

function RootLayout({ nonce }) {
  return (
    <html>
      <body>
        <SemecProvider nonce={nonce}>
          <App />
        </SemecProvider>
      </body>
    </html>
  );
}
```

Medido na prova com política estrita (SEM-752/SEM-780):

- **Popover** — 0 violações de política (sem nonce).
- **ScrollArea, Select** — 1 violação cada, mesmo com nonce (continuam com scrollbar CSS estático no `tokens.css`).
- **Dialog, AlertDialog, Drawer, Sheet, DropdownMenu** — scroll locking do body; use `SemecProvider` com nonce.

## Dependências

- **Peer**: React 19+, React DOM 19+
- **Peer opcional**: `zod` ^3.23 — só se usar `@semec/ds/react/validacao`
- **Tailwind CSS**: v4+ (com `@source` apontando para `node_modules/@semec/ds/dist/react`)
- **Ícones**: `lucide-react`

Todas as dependências Radix UI são instaladas automaticamente.

## Documentação

- [Site de documentação](https://semec.github.io/design-system)
- [Guia de contribuição](../../CONTRIBUTING.md)
- [ADRs](../../docs/adr/README.md)

## Licença

MIT
