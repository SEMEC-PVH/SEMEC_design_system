# Base de estilos genéricos SEMEC

Ponto de partida para sites novos em **React + Tailwind CSS v4 + shadcn**, com a
paleta `pv-*` já em produção no portal SEMEC Digital.

Camada L0 (primitivos) + L1 (semânticos) + componentes base (L2 genéricos), no
formato shadcn (Radix + CVA + clsx + tailwind-merge).

> Este diretório não faz parte do build do site de documentação. É copiado para
> dentro do site novo; a evolução e a distribuição futuras do design system
> seguem o ADR-022 (npm público, pacote `@semec/ds`).

## O que tem aqui

| Arquivo | Papel |
|---|---|
| `tokens.css` | Primitivos `pv-*` + semânticos (`--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, feedback…) + `@theme inline` + `@layer base`, claro/escuro (`[data-theme="dark"]`) |
| `shadcn.css` | Variáveis no formato shadcn (`--background`, `--primary`, `--ring`…) mapeadas para a paleta, em HSL |
| `pv-preset.ts` | Preset Tailwind v4 para projetos que usam config JS (`@config`) |
| `src/lib/utils.ts` | `cn()` (clsx + tailwind-merge) |
| `src/components/` | Accordion, Alert, AlertDialog, Badge, Breadcrumb, Button, Card, Checkbox, Combobox, DatePicker, Dialog, EmptyState, ErrorSummary, FileUpload, FormField, IconButton, Input, Label, Link, Pagination, Popover, RadioGroup, Select, Separator, Skeleton, Switch, Table, Tabs, Textarea, Toast, Tooltip |
| `src/index.ts` | Barrel de export |
| `package.json` | Dependências necessárias (peer: React 19) |

## Como usar num site novo

1. **Copie a pasta** `packages/react/` para o projeto (ex.: `src/base/`). Mantenha os
   imports relativos dentro dela — não depende de alias.

2. **Instale as dependências** (do `package.json`):
   ```bash
   npm i class-variance-authority clsx tailwind-merge lucide-react \
     @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-checkbox \
     @radix-ui/react-radio-group @radix-ui/react-select @radix-ui/react-switch \
     @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-dialog \
     @radix-ui/react-toast @radix-ui/react-tooltip @radix-ui/react-accordion
   npm i -D tailwindcss @tailwindcss/vite
   ```

3. **Carregue Poppins** (400–700) pelo `next/font`/Google Fonts do seu app. A
   base declara `--font-family-sans: "Poppins", …`; redefina essa variável se o
   app nomear a fonte de outro jeito.

4. **Importe os CSS no `globals.css`** (caminho CSS-first, recomendado):
   ```css
   @import "tailwindcss";
   @import "./base/tokens.css";
   @import "./base/shadcn.css";
   ```

   Ou, se preferir preset JS:
   ```css
   @import "tailwindcss";
   @config "./base/pv-preset.ts";
   @import "./base/tokens.css";
   @import "./base/shadcn.css";
   ```

5. **Use os componentes**:
   ```tsx
   import { Button, Input, Card, Badge } from "./base";
   ```
   Ou importe arquivos individuais (`./base/components/button`).

## Tema escuro

Ative com `data-theme="dark"` em um ancestral (ex.: no `<html>`), mesma
convenção do design system (ADR-012). Exemplo:

```html
<html lang="pt-BR" data-theme="dark">
```

## Convenções

- **Semântica antes de aparência:** `variant="destructive"`, nunca
  `color="vermelho"`.
- **Escapatória:** todo componente aceita `className` e repassa props ao
  elemento raiz.
- **Ícones:** `lucide-react` (padrão do portal).
- **Acessibilidade:** foco visível via `--focus-ring`, alvo de toque mínimo
  44px no tamanho `md` de controles, `aria-[invalid]` nos campos de formulário.
- **Link:** componente é `<a>` estilizado (framework-agnóstico). Em Next,
  envolva com `asChild` + `next/link` ou use o seu Link e aplique a classe.
- **Toast:** requer `<ToastProvider>` no app + `<ToastViewport />`; dispare com
  `useToast().toast(...)` (Radix Toast, sem Sonner).
- **DatePicker:** usa o `<input type="date">` nativo (valor ISO `YYYY-MM-DD`),
  sem biblioteca de calendário. Para período, use dois campos.