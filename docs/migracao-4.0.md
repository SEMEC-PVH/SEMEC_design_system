# Migração para o @semec/ds 4.0

A 4.0 só remove o que foi anunciado como depreciado na 3.1.0 e na 3.2.0, conforme a política de duas minors ([ADR-013](adr/0013-politica-de-depreciacao-duas-minors.md)). Nenhum componente saiu e nenhum valor de token mudou. Se o seu app já roda na 3.2.0 sem avisos `[@semec/ds]` no console de desenvolvimento e sem utilitários `bg-pv-*`, a atualização não exige mudança.

| O que saiu | O que usar | Achado |
|---|---|---|
| `onChange(valor)` de `Calendar`, `Combobox`, `InputOTP` e `onChange(files)` de `FileUpload` | `onValueChange`, com a mesma assinatura (existe desde a 3.2.0) | AUD-35 |
| `onChange(valor)` do `DatePicker` | `onValueChange(string)`. O `onChange` continua existindo, mas agora recebe o **evento nativo** do `<input type="date">` | AUD-35 |
| Utilitários de primitivo `bg-pv-*`, `text-pv-*`, `border-pv-*`… e as variáveis `--color-pv-*` do `@theme` e as cores `pv-*` do `pv-preset` | Os utilitários semânticos (tabela abaixo). As variáveis `--pv-*` continuam no `:root` | AUD-55 |
| Import por caminho de arquivo em `dist/` | `@semec/ds/react` ou `@semec/ds/react/<componente>` | AUD-20 |

Ordem sugerida:

1. Atualize para a 3.2.0 e resolva os avisos de depreciação no console de desenvolvimento.
2. Ainda na 3.2.0, rode o codemod da 4.0 em modo simulação. O `-p` baixa a 4.0 e o TypeScript 5 só para rodar o comando, sem mexer no `package.json`:
   `npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4 src`
3. Rode de novo com `--write`, revise o diff e resolva à mão as linhas marcadas como `revisar` e `utilitário`.
4. Atualize para a 4.0 (`npm i @semec/ds@4`) e rode o typecheck. Com pnpm ou Yarn, confira que `lucide-react` está no `package.json` do app (`pnpm add lucide-react`, `yarn add lucide-react`): ele é peer do kit desde a 3.1.0, e esses gerenciadores não instalam peer sozinhos (o npm 7+ instala). O `zod`, se usar `@semec/ds/react/validacao`, pode ser o 3 (`^3.23.0`) ou o 4. Ele é a rede de segurança do que o codemod não vê: no TypeScript, todo `onChange` que sobrou em `Calendar`, `Combobox`, `InputOTP` e `FileUpload` vira erro de compilação. Em JavaScript, o componente mostra um `console.error` em desenvolvimento ("onChange foi removido na 4.0; use onValueChange").

## 1. `onChange(valor)` sai dos campos não nativos (AUD-35)

Desde a 3.2.0 todo campo do kit segue o contrato `value` / `onValueChange` / `name` / `id` / `invalid` (emenda de 15/10/2026 do [ADR-015](adr/0015-formularios-api-controlada.md)). Na 4.0, `onChange` volta a ter um único significado no kit: o evento do DOM.

### `Calendar`, `Combobox`, `InputOTP`, `FileUpload`

Antes (3.x):

```tsx
<Combobox options={municipios} value={municipio} onChange={setMunicipio} />
<InputOTP maxLength={6} onChange={setCodigo}>…</InputOTP>
<FileUpload label="Anexo" onChange={(files) => setAnexos(files)} />
<Calendar value={data} onChange={setData} />
```

Depois (4.0):

```tsx
<Combobox options={municipios} value={municipio} onValueChange={setMunicipio} />
<InputOTP maxLength={6} onValueChange={setCodigo}>…</InputOTP>
<FileUpload label="Anexo" onValueChange={(files) => setAnexos(files)} />
<Calendar value={data} onValueChange={setData} />
```

O que acontece com um `onChange` que sobrar:

- **TypeScript:** a prop é tipada como `onChange?: never` nesses quatro componentes, então `onChange={setMunicipio}` não compila (`Type '…' is not assignable to type 'undefined'`); o JSDoc da prop, visível no editor, diz "Removido na 4.0 (AUD-35): use `onValueChange`".
- **JavaScript:** o componente descarta a prop e ela não chega ao DOM. O handler nunca é chamado, nem com o valor nem com um evento, e a seleção para de atualizar. Para isso não passar em silêncio, em desenvolvimento (`process.env.NODE_ENV !== "production"`) o componente mostra uma vez um `console.error`: "onChange foi removido na 4.0; use onValueChange (ver guia de migração)". Em produção não há mensagem. Sem isso, o `onChange` iria parar na `<div>` raiz e receberia o evento `change` que borbulha dos `<input>` internos (dígitos do `InputOTP`, `<input type="file">` do `FileUpload`), e um handler escrito para o valor quebraria em silêncio.
- **Por que não há `onChange` nativo nesses quatro:** nenhum deles é um único `<input>`. O `Calendar` é uma grade de botões, o `Combobox` é um botão com uma camada flutuante, o `InputOTP` são vários campos e o `FileUpload` é uma zona de arrastar. Um evento nativo da raiz não diria qual valor mudou. Para o `<input type="file">` do `FileUpload`, continua existindo `inputProps` (exceto `onChange`, `value`, `type`, `id`, `accept` e `multiple`, que são do componente).

### `DatePicker`

O `DatePicker` é um `<input type="date">`, então o `onChange` passa a ser o evento nativo, como em `Input` e `Textarea`. Quem recebia a string troca para `onValueChange`.

Antes (3.x):

```tsx
<DatePicker value={vencimento} onChange={setVencimento} />
<DatePicker value={vencimento} onChange={(iso) => setVencimento(iso)} />
```

Depois (4.0):

```tsx
<DatePicker value={vencimento} onValueChange={setVencimento} />
// ou, se precisar do evento:
<DatePicker value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
```

Atenção: o código antigo `onChange={setVencimento}` **compila** na 4.0 se o tipo do setter aceitar qualquer valor (por exemplo, `useState<any>`), e passaria a guardar o evento em vez da data. O codemod relata todo `onChange` de `DatePicker` com handler por referência para você conferir.

## 2. Primitivos L0 fora do `@theme` (AUD-55)

O `tokens.css` não declara mais `--color-pv-*` no `@theme`, e os dois `pv-preset` (`@semec/ds/react/pv-preset` e o `.ts`) não têm mais as cores `pv-*`. Com isso, `bg-pv-blue-600`, `text-pv-gray-900`, `border-pv-gray-200` e afins **deixam de gerar CSS**: o Tailwind ignora a classe sem erro, e o elemento perde a cor. As variáveis `--pv-*` continuam no `:root` (são a base dos semânticos), mas primitivo continua não sendo para uso direto em tela.

### Tabela primitivo → semântico

Escolha pelo **papel** do elemento, não pela cor. "—" quer dizer que não há semântico para aquele uso: reveja o desenho.

| Primitivo (3.x) | Fundo (`bg-`, `from-`, `fill-`…) | Texto (`text-`, `placeholder-`) | Contorno (`border-`, `ring-`, `outline-`, `divide-`) | Observação |
|---|---|---|---|---|
| `pv-blue-50` | `bg-tint` | — | — | Em aviso informativo, `bg-info-surface` |
| `pv-blue-600` | `bg-primary` | `text-primary` | `border-primary` | Ação primária; em informação, `*-info` |
| `pv-blue-700` | `bg-primary-hover` | `text-primary-hover` | `border-primary-hover` | Hover da ação primária |
| `pv-blue-800` | `bg-primary-active` | `text-primary-active` | `border-primary-active` | Ação pressionada |
| `pv-blue-hero` | `bg-brand-hero` | `text-brand-hero` | `ring-ring` | Faixa de marca; anel de foco é `ring-ring` |
| `pv-blue-900` | — | `text-text-brand` **(novo)** | — | Título institucional; sobre o verde do Toast `success`, `text-success-emphasis-foreground` **(novo)** |
| `pv-green-50` | `bg-success-surface` | — | — | |
| `pv-green-500` | `bg-success-emphasis` **(novo)** | — | — | Verde cheio; 2,13:1 sobre branco, não use como texto nem contorno |
| `pv-green-800` | `bg-success` | `text-success` | `border-success` | |
| `pv-yellow-800` | `bg-warning` | `text-warning` | `border-warning` | |
| `pv-red-50` | `bg-destructive-surface` | — | — | |
| `pv-red-700` | `bg-destructive` | `text-destructive` | `border-destructive` | |
| `pv-gray-50` | `bg-background` | — | — | Fundo da página |
| `pv-gray-100` | `bg-surface-alt` | — | — | Também `bg-muted` / `bg-secondary` |
| `pv-gray-200` | `bg-border` | — | `border-border` | Borda e divisor (1,24:1, decorativo) |
| `pv-gray-300` | `bg-surface-sunken` | — | — | Contorno de 3:1 é `border-border-strong` |
| `pv-gray-400` | `bg-border-strong` | — | `border-border-strong` | Contorno de controle (3,77:1); para texto, `text-text-muted` |
| `pv-gray-600` | — | `text-text-muted` | — | Também `text-muted-foreground`. **Não** `text-muted` (é fundo) |
| `pv-gray-700` | — | `text-text-secondary` | — | **Não** `text-secondary` (é fundo) |
| `pv-gray-900` | `bg-foreground` | `text-foreground` | — | Também `text-text-strong` |
| `pv-white` | `bg-surface` | `text-text-on-brand` | `ring-ring-inverse` | Texto sobre a marca |
| `pv-black` | — | — | — | Texto: `text-foreground`; véu de modal: `bg-black/50` (Tailwind) |

O modificador de opacidade continua funcionando: `bg-pv-blue-600/10` → `bg-primary/10`. Variantes também: `hover:bg-pv-blue-700` → `hover:bg-primary-hover`.

### Semânticos novos na 4.0

Três usos do próprio kit não tinham semântico. Os tokens novos apontam para o primitivo (sem hex novo) e geram utilitário pelo `@theme` e pelo preset:

| Token L1 | Aponta para | Utilitário | Onde o kit usa | Contraste |
|---|---|---|---|---|
| `--text-brand` | `--pv-blue-900` | `text-text-brand` | Título do `SectionHeader` | 12,43:1 sobre `--surface`, 11,48:1 sobre `--bg` |
| `--feedback-success-emphasis` | `--pv-green-500` | `bg-success-emphasis` | Fundo do Toast `success` | — (fundo) |
| `--text-on-success-emphasis` | `--pv-blue-900` | `text-success-emphasis-foreground` | Texto e X do Toast `success` | 5,85:1 sobre `--feedback-success-emphasis` |

Nada muda na tela: as cores renderizadas são as mesmas da 3.2.0.

### Se você usava a variável do `@theme`

`var(--color-pv-blue-600)` também deixou de existir. Use o semântico (`var(--color-primary)` ou `var(--action-primary)`). A variável de primitivo `var(--pv-blue-600)` continua, mas use-a só para declarar um token semântico do seu app.

## 3. Import por caminho de arquivo em `dist/` (AUD-20)

O `exports` do `package.json` só publica os subpaths do contrato e nunca teve uma entrada `./dist/*` (conferido nas tags 2.1.0, 3.1.0 e 3.2.0). Por isso, um import como `@semec/ds/dist/react/index.js` já falha com `ERR_PACKAGE_PATH_NOT_EXPORTED` no Node e nos bundlers que respeitam `exports` (Next, Vite, webpack 5, esbuild, TypeScript com `moduleResolution` `bundler`/`node16`/`nodenext`). Só ferramentas que ignoram `exports` (webpack 4, Jest antigo, TypeScript com `moduleResolution: "node"`) conseguiam chegar ao arquivo. A 4.0 não muda o `exports`; ela passa a tratar o bloqueio como contrato (conferido no `npm run test:dist`, script `check-exports`), e o layout interno do `dist` pode mudar em qualquer versão.

| Antes | Depois |
|---|---|
| `@semec/ds/dist/react/index.js` | `@semec/ds/react` |
| `@semec/ds/dist/react/components/button.js` | `@semec/ds/react/button` |
| `@semec/ds/dist/react/tokens.css` | `@semec/ds/react/tokens.css` |

O `@source "../node_modules/@semec/ds/dist/react"` do Tailwind não é import e continua igual.

## 4. Codemod

O pacote traz um codemod a partir da 4.0 (bin `semec-ds`). Ele lê o JSX com a API JS do compilador TypeScript, que existe do TypeScript 4.7 ao 5.x; **o TypeScript 7 não tem essa API**. O pacote não declara o `typescript` como dependência: o codemod usa o do projeto ou o que vier no `npx -p`.

Antes de atualizar (o app ainda na 3.x, que não tem o bin), rode a 4.0 e o TypeScript 5 só para o comando:

```bash
npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4 src            # simulação: só relata
npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4 src --write    # grava as trocas seguras
```

Depois de atualizar, com o TypeScript 5 no projeto (`npm i -D typescript@5`), o comando encurta:

```bash
npx semec-ds codemod-4 src --write
# equivalente, sem npx:
node node_modules/@semec/ds/codemods/v4.mjs src --write
```

Sem um TypeScript utilizável, o codemod para com uma mensagem pedindo o TypeScript 5 (`npm i -D typescript@5` ou o `npx -p … -p typescript@5` acima). Se o projeto tiver o TypeScript 7, o `npx -p typescript@5` resolve: o codemod ignora o 7 e usa o 5 que veio no `npx`.

O que ele faz:

- **Reescreve** `onChange=` → `onValueChange=` no JSX de `Calendar`, `Combobox`, `InputOTP` e `FileUpload` importados de `@semec/ds/react` ou do subpath do componente (com alias, `import { Combobox as Cb }`, ou namespace, `import * as DS`). Componente homônimo de outra biblioteca é ignorado. Só o nome do atributo muda; o resto do arquivo fica igual.
- **`DatePicker`:** reescreve quando a função inline recebe o valor (`(iso) => …`, `(v: string) => …`). Ignora quando ela já usa o evento (`(e) => e.target.value`). Quando o handler é uma referência (`onChange={salvar}`), só **relata** a linha, porque não dá para saber o que ele recebe.
- **Relata** (`revisar`) o elemento que tem `onChange` e `onValueChange` ao mesmo tempo.
- **Relata** (`utilitário`), sem reescrever, cada `*-pv-*` e cada `--color-pv-*` em `.js/.jsx/.ts/.tsx`, CSS, MDX, HTML, Vue, Svelte e Astro, com a sugestão da tabela acima. A troca é manual porque depende do papel do elemento.
- **Relata** (`import`) cada `@semec/ds/dist/...` usado como especificador de módulo: `import … from`, `import "…"`, `import()`, `require()`, `export … from` e `@import` no CSS. O `@source "../node_modules/@semec/ds/dist/react"` do Tailwind **não** é relatado: ele é o caminho documentado e continua igual.
- **Relata** (`revisar`) o re-export por barrel local (`export { Combobox } from "@semec/ds/react"`, também com alias ou `export *`): os arquivos que importam do barrel não são reescritos.
- Pula `node_modules`, `.next`, `dist`, `build`, `out`, `coverage` e pastas ocultas.

Exemplo de saída:

```text
@semec/ds codemod-4 (simulação: nada foi gravado; use --write para aplicar as reescritas)

src/formulario.tsx
  15:9  reescrito  <Combobox onChange> → onValueChange
  17:26  reescrito  <Data onChange> → onValueChange (o handler recebe a data em string)
  20:26  revisar    <Data onChange={salvar}>: não dá para saber se o handler recebe a data (string, 3.x) ou o evento (4.0). Se recebe a string, troque por onValueChange.
  28:33  revisar    <DS.Combobox> tem onChange e onValueChange: remova o onChange (na 4.0 ele não é mais chamado).

src/tela.jsx
  2:25  import     @semec/ds/dist/react/index.js: caminho de arquivo em dist/ não é contrato e o "exports" já bloqueia; use @semec/ds/react ou @semec/ds/react/<componente>
  7:22  utilitário text-pv-blue-900 → text-text-brand (texto institucional escuro (novo na 4.0); sobre o verde do Toast success, text-success-emphasis-foreground)
  9:26  utilitário bg-pv-blue-600 → bg-primary (ação primária; em informação, *-info)

Resumo: 3 arquivo(s) lido(s) · 7 onChange → onValueChange (não gravado) · 2 para revisar · 12 utilitário(s) L0 · 1 import(s) de dist/.
```

Limites: o codemod não detecta props repassadas por spread (`<Combobox {...props} />`), `React.createElement(Combobox, { onChange })`, wrappers seus em volta dos componentes do kit nem os usos que passam por um barrel local (este ele só relata). Por isso o typecheck é a rede de segurança: depois de atualizar para a 4.0, todo `onChange` que sobrou em `Calendar`, `Combobox`, `InputOTP` e `FileUpload` vira erro de compilação no TypeScript, e em JavaScript aparece o `console.error` de desenvolvimento.

## 5. O que continua depreciado (sai na 5.0)

Anunciado na 4.0, sem mudança de comportamento agora. Lista oficial em [CONTRIBUTING.md § Depreciações anunciadas](../CONTRIBUTING.md#depreciações-anunciadas).

- `Combobox`: `ariaLabel` (use rótulo visível, `<Label htmlFor>`/`FormField`, ou o atributo `aria-label`, que continua aceito) e `emptyMessage` (use `emptyText`).
- `AlertDialog`: `modal`; `AlertDialogContent`: `onPointerDownOutside` e `onInteractOutside`. Já são ignorados desde a 3.1.0 (o AlertDialog é sempre modal e não fecha por clique fora); só os tipos saem.
