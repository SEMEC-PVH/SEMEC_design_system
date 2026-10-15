# @semec/ds

## 4.0.0

### Major Changes

- b3843da: Remove o que foi anunciado como depreciado na 3.1.0 e na 3.2.0 (ADR-013). Nenhum componente sai e nenhuma cor renderizada muda. Guia com antes/depois, tabela primitivo → semântico e codemod: [docs/migracao-4.0.md](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/migracao-4.0.md).
  
  **Removido**
  
  - **`onChange(valor)` dos campos não nativos (AUD-35).** `Calendar`, `Combobox`, `InputOTP` e `FileUpload` perdem o `onChange(valor)`/`onChange(files)`: use `onValueChange`, com a mesma assinatura (existe desde a 3.2.0). A prop passa a ser tipada como `onChange?: never` (o TypeScript recusa) e o componente a descarta em tempo de execução, sem repassá-la ao DOM, com um `console.error` único em desenvolvimento ("onChange foi removido na 4.0; use onValueChange"). Sai o aviso de depreciação (`lib/deprecation`).
  - **`DatePicker`: `onChange` vira o evento nativo (AUD-35).** Recebe o `ChangeEvent` do `<input type="date">`, como `Input` e `Textarea`; o valor ISO continua em `onValueChange(string)`. Código que fazia `onChange={setData}` passa a receber o evento: troque por `onValueChange`.
  - **Utilitários de primitivo (AUD-55).** O `@theme` do `tokens.css` não declara mais `--color-pv-*`, e os dois `pv-preset` não têm mais as cores `pv-*`: `bg-pv-*`, `text-pv-*`, `border-pv-*`, `ring-pv-*` etc. deixam de gerar CSS. As variáveis `--pv-*` continuam no `:root`. Use os semânticos.
  - **Import por caminho de arquivo em `dist/` (AUD-20).** O `exports` nunca publicou `./dist/*`; a 4.0 trata o bloqueio como contrato (novo `check-exports` no `test:dist`). Use `@semec/ds/react` ou `@semec/ds/react/<componente>`.
  
  **Novo**
  
  - Tokens semânticos para os usos de primitivo que o próprio kit tinha, apontando para o primitivo (sem hex novo): `--text-brand` → `text-text-brand` (título do `SectionHeader`, 12,43:1), `--feedback-success-emphasis` → `bg-success-emphasis` e `--text-on-success-emphasis` → `text-success-emphasis-foreground` (Toast `success`, 5,85:1). Também no `pv-preset` (`text-brand`, `success.emphasis`).
  - Codemod `npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4 <pasta> [--write]` (bin `semec-ds`; roda com a 3.x ainda instalada; depois de atualizar, `npx semec-ds codemod-4` ou `node node_modules/@semec/ds/codemods/v4.mjs`): troca `onChange` por `onValueChange` no JSX dos componentes acima importados do kit (no `DatePicker`, só quando a função inline recebe a string; referência é relatada) e relata, sem reescrever, cada `*-pv-*`, `--color-pv-*` e import de `dist/`. Também relata re-export por barrel local. Lê o JSX com a API do compilador do TypeScript 5, carregado do projeto ou do `npx -p typescript@5`, sem dependência nova (o `typescript` não entra em `peerDependencies`).
  
  Depreciação: anunciado na 4.0 para sair na 5.0: `ariaLabel` e `emptyMessage` do `Combobox` (use rótulo visível ou o atributo `aria-label`, e `emptyText`) e `modal` do `AlertDialog` e `onPointerDownOutside`/`onInteractOutside` do `AlertDialogContent` (ignorados desde a 3.1.0).

## 3.2.0

### Minor Changes

- 1786562: Componentes novos e estado de carregamento no botão (AUD-36, AUD-63), sem remover nada público:
  
  - `Stepper`: etapas de um processo em `ol`/`li`, etapa atual com `aria-current="step"`, situação de cada etapa em texto para leitor de tela, horizontal a partir de 768px e empilhado em telas estreitas; com `onStepClick`, as etapas concluídas e a atual viram botões de 44px. Textos em PT-BR sobrescrevíveis por `labels`.
  - `PasswordInput`: compõe o `Input` com botão de 44px para mostrar ou ocultar a senha (`aria-pressed`, `aria-controls`, nome fixo "Mostrar senha" sobrescrevível por `labels`); repassa todas as props do `Input`, inclusive `autoComplete`.
  - `InputMask`: compõe o `Input` com máscaras de CPF, CNPJ, CEP, data e telefone (fixo/celular automático) ou padrão próprio (`9`, `A`, `*`). Cursor estável ao editar no meio, colar com outra pontuação funciona, `inputMode` pela máscara, `onValueChange(masked, raw)`. Também exporta `applyInputMask` e `inputMaskPatterns`.
  - `Button` ganha `loading` e `loadingText`: Spinner decorativo, `aria-busy="true"`, `aria-disabled="true"` e clique bloqueado, sem tirar o foco; o nome acessível continua sendo o texto visível. `IconButton` ganha `loading` (Spinner no lugar do ícone). O `disabled` nativo continua como antes.
  - `Spinner` ganha `decorative`: só visual (raiz `<span aria-hidden>`, sem `role`, `aria-label` nem texto sr-only). Sem a prop, nada muda.
  - `Button` com `loading` (e `IconButton` com `loading`, `Button asChild loading`) renderiza num React Server Component: o bloqueio do clique fica num filho `"use client"`, e o elemento é o mesmo com e sem `loading` (o foco não se perde). Com `asChild`, o spinner entra dentro do link.
  - `InputMask`: dígito igual a literal do padrão (ex.: o `5` de `+55`) não é mais engolido; nos telefones, `+55`/`55` de país colado é descartado; Backspace logo depois de um literal e Delete logo antes apagam o dígito vizinho.
  - `PasswordInput`: `spellCheck={false}`, `autoCapitalize="none"` e `autoCorrect="off"` por padrão (sobrescrevíveis).
  - `Button` com `loading`: o clique cancela só envio e navegação e continua subindo aos ancestrais; com `asChild`, o `onClick` do filho também não dispara.
  - `InputMask`: valor que começa com o prefixo fixo do padrão (ex.: `08001234567` em `0800-999-9999`) não repete o prefixo; Backspace/Delete junto de literal funcionam no teclado virtual do Android (`beforeinput`).
- 1786562: Contrato único de formulário (ADR-015, AUD-35), só aditivo:
  
  - `onValueChange(valor)` em `Input`, `Textarea`, `DatePicker`, `Combobox`, `InputOTP`, `FileUpload` e `Calendar` (em `Input`/`Textarea`, o `onChange` nativo continua recebendo o evento).
  - `invalid` (boolean → `aria-invalid` + estilo de erro) em `Input`, `Textarea`, `DatePicker`, `Checkbox`, `Switch`, `RadioGroup`, `SelectTrigger`, `Slider`, `Combobox`, `InputOTP`, `FileUpload` e `FormField` (sem mensagem). Passado explicitamente, vence o estado do `FormField`.
  - `InputOTP` ganha `name` (input oculto, vai no `FormData`), `form`, `defaultValue` e `required`.
  - `FileUpload` ganha `name`, `required` e `disabled` de primeiro nível.
  - Correção: o `FileUpload` agora funciona em `<form>` nativo. O `input.files` acompanha a lista mostrada (antes era zerado a cada escolha, e por isso o arquivo não ia no `FormData` e o `required` nunca validava). Arquivos soltos na zona também passam a ser enviados.
  - `invalid={false}` explícito dentro de um `FormField` com erro não liga mais a mensagem ao `aria-describedby` do controle.
  - Tabela de equivalência por componente na emenda de 15/10/2026 do ADR-015.
  
  Depreciação: o `onChange(value)` de `Combobox`, `InputOTP`, `DatePicker` e `Calendar` e o `onChange(files)` de `FileUpload` ficam obsoletos (aviso único em desenvolvimento) e saem na 4.0; use `onValueChange`, com a mesma assinatura. No `DatePicker`, o `onChange` passa a receber o evento nativo na 4.0.
- 1786562: Saída por módulo e fronteira RSC (AUD-20). O `dist/react` deixa de ser um bundle único: cada arquivo de `src/components` e `src/lib` vira um módulo ESM próprio (imports relativos com `.js`), e o `index.js` só reexporta. Com o `sideEffects` restrito ao CSS, o bundler do app poda o que não é importado: `import { Button } from "@semec/ds/react"` cai de ~340 kB para cerca de 35 kB minificado com as dependências, quase tudo `tailwind-merge` (o código do kit fica em ~3 kB). Os componentes interativos (estado, efeitos, contexto, Radix ou handlers) passam a declarar `"use client"`, preservado no `dist`, e importar `@semec/ds/react` num Server Component do Next App Router deixa de quebrar; os apresentacionais (`Heading`, `Card`, `Badge`, `Button`, `Link`, `Table` etc.) renderizam no servidor. Novos subpaths `@semec/ds/react/<componente>` (ex.: `@semec/ds/react/button`), com tipos. Mudança só aditiva: `@semec/ds/react` e os demais exports seguem iguais. Novo `npm run test:dist` (CI) prova o import na camada `react-server` e limita o tamanho do `Button` sozinho.
- 1786562: Tokens e documentação canônica (onda 3 da auditoria de 14/10/2026). Nenhum valor renderizado muda.
  
  - **Novo primitivo `--pv-yellow-50`** (`#fdf6e3`, AUD-56): `--feedback-warning-surface` passa a apontar para ele, em vez de um hex solto no L1. Primitivo novo não ganha utilitário `bg-pv-*`.
  - **Elevações sem `rgba()`** (AUD-56): `--elevation-1/2/3` usam `rgb(var(--pv-gray-900-rgb) / 0.08 | 0.1 | 0.14)`, com o novo primitivo `--pv-gray-900-rgb: 20 35 58` (canais de `--pv-gray-900`), e resultam exatamente nos `rgba(20, 35, 58, …)` anteriores. Sem `color-mix`, de propósito: o Tailwind gera para ele um fallback de sombra opaca em navegadores antigos (Chrome < 111).
  - **Raio sem autorreferência** (AUD-57): a escala fica como está (`rounded-sm` 2px · `rounded-md` 8px · `rounded-lg` 12px · `rounded-full`). O valor passa a morar em `--pv-radius-*`; `--radius-*` continua no `:root` apontando para ele, e o `@theme` deixa de declarar `--radius-sm: var(--radius-sm)`, que entrava em ciclo quando o `tokens.css` era importado dentro de `@layer`. `var(--radius-*)` e `rounded-*` seguem funcionando. `rounded-xl` e acima são o padrão do Tailwind, fora da escala.
  - **Tipografia sem autorreferência** (AUD-57, mesmo caso do raio): o valor da escala passa a morar em `--pv-text-*` e `--pv-leading-*`; `--text-*` e `--leading-*` continuam no `:root` como apelidos, e o `@theme` deixa de declarar `--text-xs: var(--text-xs)` e `--leading-xs: var(--leading-xs)` (16 autorreferências). `text-*`, `leading-*` e `var(--text-*)` seguem iguais.
  - Depreciação: utilitários de primitivo `bg-pv-*` / `text-pv-*` / `border-pv-*` (de `--color-pv-*` no `@theme` e das cores `pv-*` do `pv-preset`) saem na 4.0 (AUD-55, anunciado na 3.1.0). O comentário do `tokens.css` que os chamava de "uso direto" foi corrigido e marca o bloco como `@deprecated`; as variáveis `--pv-*` continuam. Use os semânticos (`bg-primary`, `bg-brand-hero`, `text-foreground`, `bg-success-surface`…).
  - **Avisos cancelados:** a escala de raio não muda na 4.0 (AUD-57) e o `Button` mantém `disabled` nativo; `aria-disabled` focalizável vale só durante o `loading` (AUD-63).
  - **Licença e crédito** (AMB-09, AUD-69): crédito à SEMEC é recomendado, não obrigatório (MIT). As skills `semec-ds` e `semec-ds-lite` deixam de dizer "Crédito obrigatório", o `manifest.json` do lite passa a `credit.required: false` e o README do pacote ganha a seção "Licença e crédito".

## 3.1.0

### Minor Changes

- e7d0760: Publica o que já estava no `main` e não saiu no npm 3.0.0 (diff `fb7d782..main` em `packages/react`).
  
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
- eaa3edd: Componentes de conteúdo (onda 2 da auditoria 2026-10).
  
  - **Novos componentes (AUD-36):** `Heading` (`level` 1–6 e `size` independente, na escala do kit), `SkipLink` ("Pular para o conteúdo principal", visível no foco, leva o foco ao alvo `#conteudo` ou `href`) e `Footer` (`<footer>`/`contentinfo` com `FooterContent`, `FooterSection`, `FooterLinks`, `FooterLink` e `FooterBottom`). Stepper, PasswordInput e máscara de Input seguem no backlog.
  - **Alert (AUD-22):** o `role` agora depende da variante: `destructive` → `role="alert"`; `default`, `success` e `warning` → `role="status"`. Nova prop `announce` (`assertive` · `polite` · `off`) para sobrescrever; um `role` explícito tem precedência. **Atenção:** `warning` e `success` deixam de interromper o leitor de tela; passe `announce="assertive"` onde o aviso exigir ação imediata.
  - **Níveis de título (AUD-23):** nova prop `as` em `AlertTitle`, `CardTitle` e `TimelineTitle`, e `titleAs` em `EmptyState`, `ErrorState`, `SectionHeader` e `FooterSection`. Padrões mantidos (`CardTitle`/`TimelineTitle` `div`, `EmptyState`/`ErrorState` `h3`, `SectionHeader` `h2`), exceto `AlertTitle`, que passa de `<h5>` fixo para `div`: o `<h5>` quebrava a ordem dos títulos (`heading-order`). Use `as="h2"`…`"h6"` quando o aviso abrir uma seção.
  - **Superfícies (AUD-53):** `Skeleton` usa `bg-surface-sunken`, vira `forwardRef` e é `aria-hidden` por padrão (anuncie o carregamento com `aria-busy` no contêiner). A trilha do `Progress` ganha contorno `border-strong` sobre `surface` (3,77:1 sobre branco, 3,49:1 sobre `bg`; antes 1,09:1); o indicador `primary` tem 5,42:1 sobre a trilha.
  - **Timeline (AUD-61):** `Timeline` renderiza `<ol>` e `TimelineItem` `<li>`; `TimelineDot` ganha `srLabel` para o status em texto e passa de 12 px para 16 px; `TimelineConnector` deixa de ser `absolute` e fica visível (`flex-1`, `bg-border-strong`, 3,77:1). O espaçamento entre itens passou do `TimelineItem` para o `TimelineContent`.
  - **HeaderBrand (AUD-62):** sem `logo`, o placeholder é decorativo (`aria-hidden`, antes `role="img"`) e há um aviso no console em desenvolvimento. O nome quebra linha no mobile em vez de truncar (nova prop `truncate` para o corte antigo); `Header` ganha `flex-wrap`. Novas props `homeLabel` e `href` aceita `""`/`null` para marca sem link.
  - **Sombras (AUD-29):** `Card` usa `shadow-elevation-1` no lugar de `shadow-md`.
  - **Textos e tipos (AUD-31, AUD-59, AUD-64):** `DataTable` aceita `labels` (`sortBy`, `pageOf`, `previous`, `next`) e `Spinner` aceita `label`, com padrões em PT-BR. Contêineres de ícone de `EmptyState`/`ErrorState` ficam `aria-hidden`. Interfaces de props exportadas: `AlertProps`, `AlertTitleProps`, `CardTitleProps`, `EmptyStateProps`, `SeparatorProps`, `SemecProviderProps`, `SkeletonProps`, `ProgressProps`, `SpinnerProps`, `TimelineDotProps`, `TimelineTitleProps`, `DataTableLabels`, e os tipos `HeadingLevel`/`HeadingTag`.
- 6bc4037: Artefatos de IA, SKILLs e política de depreciação (onda 2 da auditoria de 14/10/2026).
  
  - Contagem e lista de componentes geradas do manifest pelo `build-artifacts.mjs` (SKILL, README do pacote, `llms.txt`); `manifest.json` ganha `componentCount` e `exportName` por componente (AUD-49).
  - SKILL `semec-ds` corrigida: texto grande (≥ 24px regular ou ≥ 18,66px bold), 44px como régua do DS (o 2.5.5 é AAA), tabela token → utilitário com a armadilha `text-muted`/`text-secondary`, espaçamento e escala tipográfica, nova seção "Comportamentos fixos do kit" (AUD-50, AUD-30, AUD-27, AUD-28).
  - Nova seção "Padrões de tela" na SKILL: esqueleto com `SkipLink`, `Header`, `Heading`, `Footer`, landmarks, container único, título da página, tabelas no mobile e Sidebar (AUD-51); marca = `brand-hero`, ação = `primary` (AUD-58).
  - O prompt por componente (`dsPrompt`) passa a mandar usar o componente de `@semec/ds/react` em vez de recriá-lo; a SKILL publicada no npm e no site sai sem as seções de mantenedor (AUD-67).
  - Variante lite coerente com "sem React": `@semec/ds/lite/tokens.css` sem `@source` para `dist/react` (AUD-68).
  - Depreciação: anunciado para sair na 4.0 (ADR-013): import por caminho de arquivo em `dist/` (AUD-20), `onChange(value)`/`onChange(files)` nos campos não nativos (AUD-35), utilitários de primitivo `bg-pv-*`/`text-pv-*` (AUD-55), valores atuais de `rounded-sm`/`rounded-lg` (AUD-57) e `disabled` nativo do `Button` como seletor (AUD-63). Lista em CONTRIBUTING.md § Depreciações anunciadas; errata da 2.0.0 no CHANGELOG (AUD-43).
- 81517cd: Formulários (onda 2 da auditoria 2026-10):
  
  - **Combobox no padrão APG** (AUD-03, #17): o gatilho é uma parada de Tab e abre uma camada nomeada com o campo de busca (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete="list"`) e a lista (`role="listbox"` + `role="option"`/`aria-selected`). Setas ↑/↓, Home/End, Enter seleciona (sem enviar o formulário), Esc fecha e devolve o foco ao gatilho, Tab fecha e segue. `ComboboxProps` passa a estender os atributos de `<button>` (`id`, `aria-*`, `disabled`…), com as novas props `name` (gera `<input type="hidden">`), `defaultValue`, `required`, `searchPlaceholder`, `emptyText` e `labels`. O nome acessível passa a ser rótulo + texto visível (corrige `label-content-name-mismatch`, WCAG 2.5.3) e funciona com `<Label htmlFor>`, FormField e `aria-labelledby`. `ariaLabel` e `emptyMessage` ficam `@deprecated`, sem remoção; o padrão genérico "Selecionar" sai.
  - **FormField liga dica e erro ao campo** (AUD-21): novo `FormFieldContext` (+ `useFormField` e `useFormFieldControl`). Input, Textarea, SelectTrigger, Combobox, DatePicker, Checkbox, RadioGroup, Switch, InputOTP, FileUpload e Slider recebem `id` (gerado com `useId` se faltar), `aria-describedby` (dica + erro) e `aria-invalid` com erro, sem sobrescrever o que o consumidor passou. O `<label for>` acompanha o `id` do filho; em controles não rotuláveis (RadioGroup, InputOTP, Slider) o rótulo vira `aria-labelledby`. Novos tipos `InputProps` e `TextareaProps`.
  - **Menos `role="alert"`** (AUD-22): o erro do FormField não usa mais `role="alert"` (é lido ao focar o campo; o anúncio fica com o ErrorSummary); o erro do FileUpload vira região `aria-live="polite"` sempre montada.
  - **DatePicker com um só indicador** (AUD-54): o ícone virou botão "Abrir calendário" de 44px que chama `showPicker()` (recuo: foco no campo); o indicador nativo segue oculto e, no Firefox, fica só o nativo. Nova prop `labels`.
  - **Alvos de 44px** (AUD-10): opções do Combobox e itens do Select com `min-h-11`, busca do Combobox `h-11`; Switch e polegar do Slider ganham área de toque de 44px sem mudar o desenho.
  - **Textos sobrescrevíveis** (AUD-31): `labels` em Combobox, DatePicker, FileUpload e InputOTP (padrões em PT-BR).
  - **Ícones decorativos com `aria-hidden`** (AUD-59) em Select, Checkbox e RadioGroup.
  - **Tipos e ids** (AUD-64): `export interface` em `ComboboxProps`, `FormFieldProps`, `ErrorSummaryProps`, `InputOTPProps`, `InputOTPSlotProps`; o ErrorSummary troca o id fixo do título por `useId`, aceita ref de função e perde a margem externa `mb-6` (espace pelo layout).
  - **Sombras por token** (AUD-29): `shadow-sm`/`shadow-lg` viram `shadow-elevation-1/2` em Combobox, Select, Checkbox, RadioGroup, Switch e InputOTP.
- abc0b06: Navegação e controles (onda 2 da auditoria 2026-10).
  
  - **Calendar no padrão APG de grade de datas (AUD-37).** `role="grid"` rotulado pelo mês (`aria-live="polite"`), uma parada de `Tab` (roving tabindex), setas, `Home`/`End`, `PageUp`/`PageDown` (mês) e `Shift+PageUp`/`PageDown` (ano), `Enter`/`Espaço` para selecionar, `aria-selected`, `aria-current="date"` no dia de hoje e `aria-disabled` fora de `min`/`max`. Cada dia tem nome completo em PT-BR via `Intl` ("14 de outubro de 2026"). `min`/`max` em `AAAA-MM-DD` passam a ser lidos como data local (antes, o `new Date()` em UTC deslocava um dia). Nova prop `labels` (`previousMonth`, `nextMonth`) e tipos `CalendarProps`/`CalendarLabels` exportados.
  - **Alvos de 44px (AUD-10).** `TabsTrigger`, `NavigationMenuTrigger`, `Toggle` `md` (padrão), células e botões do `Calendar` passam a ter 44px; `Toggle` `lg` vai a 48px. `Button` `sm` e `Toggle` `sm` mantêm o visual de 36px, com a área clicável estendida a 44×44px por pseudo-elemento.
  - **Aba ativa sem depender só de cor (AUD-38).** Barra inferior de 3px em `primary` (4,97:1 contra a lista e 5,00:1 contra o fundo da aba) e peso semibold.
  - **Link sublinhado por padrão (AUD-25).** Nova prop `underline` (padrão `true`); `underline={false}` sublinha só no hover e fica restrito a contextos de navegação.
  - **NavigationMenu em PT-BR (AUD-31).** O `<nav>` passa a se chamar "Menu principal" (antes, "Main" do Radix); sobrescreva com `aria-label`. O `aria-hidden-focus` com o menu aberto vem do sentinela de foco do Radix e foi incluído na EXC-01 com a evidência.
  - **Pagination com textos sobrescrevíveis (AUD-31).** Nova prop `labels` (`navigation`, `previous`, `next`, `page(n)`); os botões numéricos passam a se chamar "Página N".
  - **`DropdownMenuShortcut` com contraste AA (AUD-39).** `opacity-60` (4,28:1) trocado por `text-muted-foreground` (7,56:1).
  - **Sombras por token (AUD-29), ícones decorativos com `aria-hidden` (AUD-59) e props exportadas (AUD-64)** em Tabs, NavigationMenu, DropdownMenu, Calendar e Breadcrumb (`BreadcrumbProps`, `DropdownMenuItemProps` e afins).
- 9158fb2: Overlays acessíveis (onda 2 da auditoria):
  
  - `AlertDialog` passa a usar `@radix-ui/react-alert-dialog` (AUD-34, Refs #34): `role="alertdialog"`, sempre modal, não fecha por clique fora e abre com o foco em `AlertDialogCancel`. Todos os exports e props anteriores continuam aceitos; `modal` (no `AlertDialog`) e `onPointerDownOutside`/`onInteractOutside` (no `AlertDialogContent`) ficam `@deprecated` e são ignorados. `AlertDialogAction` e `AlertDialogCancel` ganham a prop `variant` (as do `Button`; padrão `primary` e `outline`) e passam a 44px de altura. Novos tipos exportados: `AlertDialogProps`, `AlertDialogContentProps`, `AlertDialogActionProps`, `AlertDialogCancelProps`.
  - Botão X de `Dialog`, `Sheet` e `Drawer` com alvo de 44×44px (ícone continua com 16px); `DialogHeader`, `SheetHeader` e `DrawerHeader` reservam espaço à direita para o X. `ToastAction` com 44px de altura e X do Toast com alvo de 44px sem mudar a altura do aviso (AUD-10, Refs #24).
  - Nova prop `closeLabel` em `DialogContent`, `SheetContent` e `DrawerContent` (padrão "Fechar") e novo tipo `DialogContentProps` (AUD-31, AUD-64).
  - `SheetContent` e `DrawerContent` rolam o conteúdo longo (`overflow-y-auto`; `top`/`bottom` com altura máxima de 85dvh); `DialogContent` e `AlertDialogContent` limitados à altura da tela com rolagem. Manifest documenta o padrão controlado sem Trigger com `onCloseAutoFocus` devolvendo o foco à origem (AUD-52).
  - X do Toast sem `opacity-60`: contraste de 2,76–2,87:1 para 6,91–7,56:1 (`text-muted-foreground` sobre card, `warning-surface` e `destructive-surface`); na variante `success`, de 4,06:1 para 5,85:1 (AUD-39).
  - `ToasterProps` agora é `export interface` (AUD-64).
- cc37b69: Empacotamento, tipos e testes do `@semec/ds` (onda 2 da auditoria, Refs #34).
  
  - **Tipos em `node16`/`nodenext` (AUD-40):** os `.d.ts` de `dist/react` agora usam especificadores relativos com extensão `.js`; `import { Button } from "@semec/ds/react"` deixa de dar TS2305 em projetos com `moduleResolution: "nodenext"`. Continua funcionando com `bundler`. Os `.d.ts.map` deixaram de ser publicados (apontavam para `src/`, que saiu do tarball).
  - **Dependências (AUD-44):** `tailwind-merge` 2 → 3 (entende a sintaxe do Tailwind v4: `cn("p-4 p-(--space-2)")` resolve para `p-(--space-2)`), com `extendTailwindMerge` para os utilitários de token (`text-display`, `p-space-N`, `shadow-elevation-N`, `duration-fast`...). Peer `zod` aceita `^3.23.0 || ^4.0.0` (validação testada nas duas). Novo peer `tailwindcss ^4.0.0`.
  - **`lucide-react` como peer (AUD-59):** sai de `dependencies` e vira peer `>=0.468.0 <2`, sem cópia duplicada no app. npm 7+ e pnpm 8+ instalam o peer sozinhos; com Yarn, instale `lucide-react` se o app ainda não tiver.
  - **Tarball (AUD-65):** inclui `LICENSE` e `CHANGELOG.md`; deixa de levar `src/`, `manifest.js` e `server.js` da raiz (nenhum era alcançável pelos `exports`; as cópias usadas estão em `dist/`). 251 → 132 arquivos, 314,7 kB → 265,3 kB. Novos exports: `./package.json`, `./react/fonts.css`, `./react/fonts/*` e `./lite/fonts.css`. `engines.node >=22`.
  - **Testes (AUD-45):** primeira suíte Vitest + Testing Library + axe (`npm test`), com render de cada componente do manifest, teclado em Dialog, Tabs, Accordion, Select e DropdownMenu e axe nas camadas abertas; o gate passa a auditar as camadas abertas no Chromium (EXC-01 só em Select e DropdownMenu).
- d05512c: Sidebar: gaveta mobile acessível, landmark, `aria-current`, `tooltip` e breakpoint único (AUD-09, AUD-32, AUD-33, AUD-10, AUD-31, AUD-59, AUD-64, AUD-29; Refs #23).
  
  - **Gaveta mobile (AUD-09):** agora é um modal sobre o Radix Dialog. O foco fica preso na gaveta, Esc fecha, o conteúdo de trás fica inerte (`aria-hidden` e rolagem travada) e o foco volta para quem abriu (o `SidebarTrigger`, outro gatilho ou o elemento focado antes do Ctrl/⌘+B). A gaveta tem título acessível (sr-only, "Menu de navegação") e um botão visível "Fechar menu" de 44×44. O portal fica dentro do `SidebarProvider`, então as variáveis `--sidebar-*` continuam valendo.
  - **`SidebarTrigger`:** 44×44 (`h-11 w-11`, antes 36), `aria-expanded` e `aria-controls` (aponta para o painel só quando ele existe no DOM), `type="button"` e nova prop `label` (padrão "Alternar barra lateral").
  - **Landmark (AUD-32):** no desktop (e dentro da gaveta), o conteúdo fica num `<nav aria-label="Menu lateral">`. Nova prop `as` (`"nav"` · `"aside"` · `"div"`) e `aria-label` direto sobrescreve o nome.
  - **`SidebarInset`:** nova prop `as` (`"main"` padrão · `"div"` · `"section"`). Sem a prop, continua `<main>`; use `as="div"` quando o layout já tiver o próprio `<main>`. Ganhou `min-w-0` de fábrica (AUD-33) e a sombra do `variant="inset"` passou a `shadow-elevation-1` (AUD-29).
  - **Item ativo:** `SidebarMenuButton isActive` e `SidebarMenuSubButton isActive` geram `aria-current="page"` (sobrescrevível pela própria prop `aria-current`).
  - **`tooltip`:** a prop de `SidebarMenuButton` agora funciona (Tooltip do kit, à direita, só no modo recolhido `collapsible="icon"`) e não vaza mais para o DOM. O `SidebarProvider` inclui um `TooltipProvider`.
  - **Breakpoint (AUD-33):** a troca para gaveta usa `matchMedia("not all and (min-width: 48rem)")` com listener e é segura em SSR (no servidor vale desktop). O breakpoint é único: abaixo de 768px (48rem), o complemento exato do `md:` que a versão desktop já usava. Ao alargar a tela, a gaveta aberta fecha.
  - **Alvos de 44px (AUD-10):** `SidebarMenuButton` e `SidebarMenuSubButton` com `min-h-11`; no modo recolhido o botão tem 44×44, e a largura do modo ícone passou de 3rem para 3,75rem.
  - **Desktop recolhido em `offcanvas`:** a barra fora da tela fica `inert` (sai da ordem de Tab), a menos que você passe `inert` explicitamente.
  - **Textos (AUD-31):** nova prop `labels` em `Sidebar` (`navigation`, `mobileTitle`, `close`), todos com padrão em PT-BR.
  - **Ícones (AUD-59):** `PanelLeft` e o X da gaveta com `aria-hidden="true"`.
  - **Tipos (AUD-64):** novas interfaces exportadas `SidebarProviderProps`, `SidebarProps`, `SidebarLabels`, `SidebarTriggerProps`, `SidebarInsetProps`, `SidebarMenuButtonProps` e `SidebarMenuSubButtonProps`. `setOpenMobile` do `useSidebar()` passa a aceitar função (`setOpenMobile((v) => !v)`), como já funcionava na prática.
  
  **Migração:** nenhuma quebra de API. Quem testava o painel mobile por `aria-label="Navegação"` deve usar o papel `dialog` com nome "Menu de navegação" (ou passar `labels.mobileTitle`). Na gaveta fechada o painel não fica mais no DOM, então o `ref` da `Sidebar` em telas estreitas é `null` até ela abrir.
- 4030e40: Fundação (onda 2 da auditoria 2026-10):
  
  - **AUD-26** — Poppins auto-hospedada: novo `@semec/ds/react/fonts.css` com `@font-face` 400, 500, 600 e 700 (`font-display: swap`) e os `.woff2` em `dist/react/fonts/`, com a licença SIL OFL 1.1 (`fonts/OFL.txt`). Não há 800/900. Importe antes do `tokens.css`.
  - **AUD-27** — a escala `--space-*` vira utilitário: `p-space-4`, `gap-space-2`, `mt-space-12`… (CSS-first e preset JS com os mesmos nomes). Os utilitários numéricos do Tailwind continuam como estão.
  - **AUD-28** — escala tipográfica completa: `--text-3xl` passa a 32px (era o 30px do Tailwind) e entra `--text-display` (40px). Cada `text-*` aplica a entrelinha do degrau (`--leading-*`); entram `leading-xs`…`leading-display` e `font-regular`. *Mudança visual:* a entrelinha padrão de `text-xs`/`sm`/`lg`/`xl`/`2xl` passa à da especificação (ex.: `text-sm` 20px → 21px).
  - **AUD-30** — novos `text-text-muted`, `text-text-secondary`, `text-text-strong` e `text-text-on-brand`. `text-muted`/`text-secondary` continuam sendo a cor de fundo `--surface-alt` (1,09:1) e não devem ser usados para texto; `bg-muted`/`bg-secondary` não mudam.
  - **AUD-53** — novo `--surface-sunken` (`bg-surface-sunken`, primitivo `--pv-gray-300`): 1,47:1 sobre `--surface`; preenchimento `--action-primary` sobre ele, 3,68:1.
  - **AUD-60** — novo `--focus-ring-inverse` (`ring-ring-inverse`). Dentro de `data-surface="brand"` ou `bg-brand-hero`, o anel de foco (outline global e `ring-ring`) passa ao inverso: 9,38:1 sobre `--brand-hero` (antes 1,00:1). `data-surface="default"` volta ao anel padrão.
  - **AUD-25** (parte global) — o reset de `a` continua em `@layer base`, então `underline` sempre vence; `<a>` sem `class` passa a ser sublinhado.

### Patch Changes

- 37d1345: Input e Textarea: anel de foco do campo inválido agora usa `destructive` a 100% (6,47:1 sobre a superfície, antes 1,69:1) (AUD-24, #33).
- ad75435: FileUpload: anel de foco visível na zona quando o input está focado. Novas props opcionais: `value` (controlado), `multiple`, `id` e `inputProps`. O `accept` agora também é validado ao arrastar e soltar. O `className` vale só na raiz. Dica e erro ficam ligados ao input por `aria-describedby`, com `aria-invalid` quando há erro (#18).
  
  **Migração:** o `id` passado ao `FileUpload` agora vai para o `<input type="file">`, não para a `div` raiz. Assim `<label htmlFor>` e os links do ErrorSummary focam o campo. Se algum CSS ou teste usava esse `id` para achar a raiz, troque por `className` ou por um `data-*` na raiz.
- d6c47ef: InputOTP: o foco avança entre os dígitos, e digitar, editar o dígito do meio e colar funcionam (#16). A tela guarda a posição de cada slot, mas o `onChange` entrega só os dígitos preenchidos, sem lacunas: com "1" no slot 1 e "6" no slot 6, o valor emitido é "16". No modo controlado, a tela segue sempre o `value` do pai (se o pai truncar ou recusar, vale o `value`). Sem `value`, o componente funciona como não controlado. O anel de foco aparece só no slot focado (`focus-within`). Há `autocomplete="one-time-code"`, e o grupo tem `role="group"` rotulado: aceita `aria-label`/`aria-labelledby`, com "Código de verificação" como padrão.
- 73c2276: Slider: `aria-label`/`aria-labelledby` passam para os polegares (`role="slider"`), um polegar por valor e nova prop opcional `getAriaLabel(index)` para nomear cada polegar (#22).
- db1e7e6: `Badge` success/warning/danger/info passa a usar os tokens `--feedback-*-surface` opacos (#20), garantindo contraste AA em qualquer fundo (info 4,89:1, warning 5,49:1, danger 5,91:1, success 6,31:1). Atenção: o fundo dessas variantes deixa de ser semitransparente e agora é opaco, então não deixa mais passar a cor do container.
- fd65721: Foco visível em itens de `DropdownMenu` e `Select` (#21): o item focado ganha anel interno de 2px em `--focus-ring` (9,38:1 sobre o popover) e fundo `tint`, em vez de só um fundo sutil de 1,09:1. Como o Radix move o foco para o item sob o mouse, o anel também aparece no hover.
- e397c12: Toast acessível em PT-BR (#15): `ToastClose` ganha nome acessível "Fechar notificação"; `ToastProvider` e `ToastViewport` usam "Notificação" e "Notificações ({hotkey})" por padrão; `Toaster` aceita `label`, `viewportLabel` e `closeLabel` opcionais.
- 89ff295: DataTable e Pagination acessíveis por teclado (#19, AUD-05): publica a ordenação por botão com `aria-sort` (b142658), `aria-sort="none"` quando `sortDir` é nulo, linha com `onRowClick` focável e ativável por Enter/Espaço com contorno de foco visível, ícones decorativos com `aria-hidden` e alvos de paginação de 44px (`h-11`).
- a91bbdc: Corrige os exemplos de uso do manifest (artefatos de IA e páginas de componente): Toast com `<Toaster />` + `useToast()` (#27); `SidebarToggleButton` separado do `SidebarTrigger` e Dica com `IconButton label` (#28); todos os exemplos com rótulo ou nome acessível (#30); a11y real da Tabela e da Tabela de dados; "estados vazios" em PT-BR.
- 5414ddf: `SidebarToggleButton`: `label` deixa de ser obrigatório (#28). Sem ele, o nome acessível alterna entre `labelOpen`/`labelClosed` ("Fechar menu"/"Abrir menu"); com ele, vira rótulo fixo, e o estado continua em `aria-expanded`.
  
  **Migração:** antes, o `label` passado ao `SidebarToggleButton` era descartado em silêncio. Agora ele é usado como rótulo fixo do botão (o estado aberto/fechado continua anunciado por `aria-expanded`). Se você passava `label` só para o TypeScript compilar e quer manter o rótulo dinâmico ("Fechar menu"/"Abrir menu"), remova a prop ou use `labelOpen`/`labelClosed`.
- 1150c2d: Exporta `cn()` (clsx + tailwind-merge) no entry `@semec/ds/react`, como o README e a SKILL já anunciavam (AUD-41, Refs #33).
- d13e106: Documentação publicada no pacote: errata do CHANGELOG 3.0.0 (bundle único, sem `"use client"`; usar o kit em arquivos `"use client"` no Next App Router) (#25); receita de Toast com `<Toaster />` + `useToast()` nas skills (#27); skills sem tokens inexistentes no pacote (`--container-max`, `--measure`, `--control-height-*`, `data-density`, `--pv-blue-900 #1e3a5f`) (#29); bloco "Comece aqui" no README com Radix automático, `@source` relativo ao CSS, carga da Poppins, `<Toaster />`/`TooltipProvider` e contagem real de 49 componentes (#31); URLs `repository`/`homepage`/`bugs` e links do README apontando para `SEMEC-PVH/SEMEC_design_system` (AUD-42, Refs #33).
- 6bf315a: `dsTokens` (`@semec/ds/lite/skills`) alinhado ao `tokens.css` publicado: sai `--pv-green-600`, `--font-poppins` e `--font-mono` (inexistentes no pacote); entram `--font-medium`, `--font-semibold` e `--text-on-brand` (#29).
- 6941bed: Torna determinístico o carimbo `generatedAt` / "Gerado em" dos artefatos de agentes (llms.txt, llms-full.txt, manifest.json): usa `SOURCE_DATE_EPOCH` ou a data do último commit do pacote, em vez da hora do build (#26).
- 64f2474: Integração da onda 2 da auditoria (#34):
  
  - `AlertDialogContent` declara `aria-modal="true"`. Sem ele, leitores de tela e o axe não reconheciam o `role="alertdialog"` como modal e acusavam `aria-hidden-focus` no conteúdo de fundo (AUD-34).
  - As células do `Calendar` declaram `role="gridcell"` explicitamente, para que `aria-selected` valha em qualquer árvore de acessibilidade (AUD-37).

## 3.0.0

> **Errata (registrada em 14/10/2026, auditoria AUD-11, #25).** O item "Build com `splitting: true` (ESM por módulo) para poda de árvore" desta versão **não corresponde ao que foi publicado**. O texto original foi mantido, riscado, logo abaixo. Estado real da 3.0.0 (que continua valendo na 3.1.0):
>
> - O `dist/react/index.js` é **um bundle único** (sem chunks por módulo). Importar uma só peça, como `maskCPF`, carrega o kit inteiro. Não há poda de árvore por componente.
> - O `dist` **não tem a diretiva `"use client"`**: importar `@semec/ds/react` num Server Component (Next.js App Router) falha.
> - **O que fazer:** no Next App Router, importe o kit só em arquivos `"use client"` (componentes e providers, como `<Toaster />`). Em Vite/SPA nada muda.
> - **Correção técnica:** saída por módulo e `"use client"` por componente estão planejados para uma versão futura (AUD-20).

### Major Changes

- Schemas Zod saem do entry principal: use `@semec/ds/react/validacao` (`cpfSchema`, `cnpjSchema`, `cpfCnpjSchema`, `emailSchema`, `cepSchema`). O main (`@semec/ds/react`) não importa mais `zod`; o peer opcional passa a ser verdadeiro (SEM-782).
- ~~Build com `splitting: true` (ESM por módulo) para poda de árvore em apps que importam poucas peças.~~ **Não entregue na 3.0.0 — ver errata acima.**
- `tokens.css`: cor padrão de borda (`border-color: var(--color-border)` na camada base) — tabela e `Badge outline` deixam de sair com borda `currentColor` (SEM-781).
- `tokens.css`: `@media (prefers-reduced-motion: reduce)` global (SEM-784).
- `tokens.css`: token `--color-border-strong` (classes `border-border-strong` em Header/FileUpload) e utilitários `slide-in-from-*`/`slide-out-to-*` com fração e percentual arbitrário (SEM-786).
- Sheet e Drawer animam o painel (`animate-in`/`animate-out` + fade), não só o overlay (SEM-786).
- Sidebar mobile: papel de diálogo (`role="dialog"`, `aria-modal`), foco no painel, Esc fecha, trava do `body`, largura `SIDEBAR_WIDTH_MOBILE` (SEM-785).
- Documentação CSS: config recomendada inclui `@source` para o Tailwind v4 varrer as classes do pacote (SEM-783).

### Migration

```diff
- import { cpfSchema } from "@semec/ds/react";
+ import { cpfSchema } from "@semec/ds/react/validacao";
```

Helpers puros (`validateCPF`, `validateCNPJ`, `validateEmail`) e masks continuam no main.

## 2.1.0

### Minor Changes

- Pipeline único de artefatos de IA (`build-artifacts.mjs`) e skills canônicas `semec-ds` / `semec-ds-lite` (ADR-023). Novos subpath exports para as skills; aliases `ds-semec-skill` mantidos para compatibilidade.

## 2.0.0

> **Errata (registrada em 14/10/2026, auditoria AUD-43).** A 2.0.0 removeu tokens, o tema escuro e o `shadcn.css` **sem depreciação prévia, sem lista e sem guia de migração**, embora o [ADR-013](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/adr/0013-politica-de-depreciacao-duas-minors.md) (aviso por duas minors antes da remoção) estivesse Aceito desde 20/08/2026. A lista abaixo foi levantada comparando os tarballs publicados 1.1.0 e 2.0.0 (`dist/react/tokens.css` e `exports`). Nenhum export JavaScript de `@semec/ds/react` foi removido.
>
> **23 tokens removidos de `tokens.css`** (13 primitivos L0 e os 10 utilitários `--color-pv-*` correspondentes no `@theme`). Primitivo não é para uso direto; o substituto é o token semântico (L1) do papel:
>
> | Removido (1.1.0) | Utilitário removido | Use no lugar |
> |---|---|---|
> | `--pv-blue-100`, `--pv-blue-200`, `--pv-blue-300` | `bg-pv-blue-100` | superfície colorida: `--tint` (`bg-tint`) ou `--feedback-info-surface` (`bg-info-surface`) |
> | `--pv-blue-400` | — | foco: `--focus-ring` (`ring-ring`); ação: `--action-primary` (`bg-primary`) |
> | `--pv-blue-900`, `--pv-blue-950` | `bg-pv-blue-900`, `bg-pv-blue-950` | texto forte: `--fg` / `--text-strong` (`text-foreground`); marca: `--brand-hero` (`bg-brand-hero`) |
> | `--pv-green-500` | `bg-pv-green-500` | sucesso: `--feedback-success` (`text-success`, `bg-success`) e `--feedback-success-surface` (`bg-success-surface`) |
> | `--pv-red-400`, `--pv-red-500`, `--pv-red-600`, `--pv-red-800` | `bg-pv-red-400`, `bg-pv-red-500`, `bg-pv-red-600`, `bg-pv-red-800` | perigo: `--feedback-danger` (`bg-destructive`, `text-destructive`) e `--feedback-danger-surface` (`bg-destructive-surface`) |
> | `--pv-yellow-400`, `--pv-yellow-500` | `bg-pv-yellow-400`, `bg-pv-yellow-500` | aviso: `--feedback-warning` (`text-warning`) e `--feedback-warning-surface` (`bg-warning-surface`) |
>
> Atenção: o `main` (próxima minor) reintroduz `--pv-blue-900` e `--pv-green-500` para o toast de sucesso, **com outros valores** (`#1e3a5f` → `#26325B` e `#86c95b` → `#82C353`). Quem ainda usa esses nomes vindos da 1.1.0 verá cores diferentes; use os semânticos da tabela.
>
> **Tema escuro removido.** O bloco `[data-theme="dark"]` do `tokens.css` (ADR-012) saiu sem substituto: o pacote passa a ser só tema claro. `data-theme="dark"` na `<html>` não tem mais efeito.
>
> **`shadcn.css` removido**, com os exports `@semec/ds/react/shadcn.css` e `@semec/ds/lite/shadcn.css`. As variáveis HSL do shadcn (`--background`, `--primary`, `--muted-foreground`…) não existem mais; use `tokens.css`, cujo `@theme` expõe os utilitários equivalentes (`bg-background`, `bg-primary`, `text-muted-foreground`…).
>
> **Política a partir de agora.** Remoções só saem em major e depois de pelo menos duas minors de aviso (ADR-013). O que já está anunciado para sair na 4.0 fica em "Depreciações anunciadas", no [CONTRIBUTING.md](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/CONTRIBUTING.md#depreciações-anunciadas).

### Major Changes

- Remove o dark theme dos tokens CSS (`tokens.css`) e enxarga os primitivos; `@theme inline` expandido.
- Remove o export `@semec/ds/react/shadcn.css` (e o arquivo `shadcn.css` do pacote).
- Externaliza `zod` do bundle: passa a peerDependency opcional; adiciona `get-nonce` como dependência.
- Adiciona `SemecProvider` com suporte a nonce CSP (SEM-752).
- Unifica os pipelines de artefatos de IA num só gerador (`build-artifacts.mjs`) e define skills canônicas `semec-ds` (full) e `semec-ds-lite` (SEM-699).
- Corrige a11y e CSS v4 em Toaster, Progress e Sidebar (SEM-746/749/750).
- Corrige bugs de tokens, sidebar e a11y (SEM-743 a SEM-751).
- Adiciona CSS estático de scrollbar para viewport do Select e doc CSP (SEM-752).

## 1.1.0

### Minor Changes

- a7f90da: Melhorias e ciência de uso
- Corrige grid responsivo, remove TOC da página quem-somos e automatiza publicação npm
