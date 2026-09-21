# @semec/ds

Design System SEMEC — componentes React + tokens CSS + artefatos para agentes de IA.

React 19 + Tailwind CSS v4 + shadcn (Radix + CVA + clsx + tailwind-merge). Tema claro/escuro via `data-theme="dark"`.

## Instalação

```bash
npm install @semec/ds
```

## Uso rápido

```tsx
// 1. Importar tokens no seu CSS global
import "@semec/ds/react/tokens.css";
import "@semec/ds/react/shadcn.css";

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

## Subpath exports

| Import | O que é |
|---|---|
| `@semec/ds/react` | Todos os componentes + `cn()` |
| `@semec/ds/react/tokens.css` | Tokens `pv-*` (primitivos + semânticos) |
| `@semec/ds/react/shadcn.css` | Variáveis shadcn HSL |
| `@semec/ds/react/pv-preset` | Preset Tailwind v4 (JS config) |
| `@semec/ds/react/pv-preset.ts` | Preset Tailwind v4 (arquivo TS original) |
| `@semec/ds/react/server` | Helpers Node.js (ex: `getComponentMetadata()`) |
| `@semec/ds/skills` | Manifest + componentes para agentes IA |
| `@semec/ds/skills/llms.txt` | Índice para IA |
| `@semec/ds/skills/llms-full.txt` | Dump completo |
| `@semec/ds/skills/manifest.json` | JSON para consumo por máquinas |
| `@semec/ds/skills/components/*.md` | Chunk RAG por componente |

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

```css
/* Tokens primitivos + semânticos */
@import "@semec/ds/react/tokens.css";

/* Variáveis shadcn */
@import "@semec/ds/react/shadcn.css";
```

Ou use o preset Tailwind v4:

```css
@import "tailwindcss";
@config "@semec/ds/react/pv-preset";
@import "@semec/ds/react/tokens.css";
@import "@semec/ds/react/shadcn.css";
```

## Tema escuro

Ative com `data-theme="dark"` em um ancestral:

```html
<html lang="pt-BR" data-theme="dark">
```

## Dependências

- **Peer**: React 19+
- **Tailwind CSS**: v4+
- **Ícones**: `lucide-react`

Todas as dependências Radix UI são instaladas automaticamente.

## Documentação

- [Site de documentação](https://semec.github.io/design-system)
- [Guia de contribuição](../../CONTRIBUTING.md)
- [ADRs](../../docs/adr/README.md)

## Licença

MIT
