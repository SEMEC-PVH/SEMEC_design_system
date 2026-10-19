# Frente C: regressão do caminho de adoção pelo README (Next 16 + Vite)

- **Data:** 19/10/2026
- **Pacote:** `C:\dev\semec-int\semec-ds-4.2.0.tgz` (`npm pack` da `fix/pendencias-4.2`, futura 4.2.1; o `package.json` ainda diz `4.2.0`)
- **Fonte única:** `package/README.md` do .tgz (438 linhas). Quando o README manda para a skill (`@semec/ds/skills/semec-ds`) ou para o `.md` do componente, eu segui o que ele indica.
- **Ambiente:** Windows 11, Node 24.21.0, npm 11.19.0, Playwright 1.x com Chromium headless 156, axe-core 4.x
- **Projetos:**
  - `C:\dev\semec-int\c-regressao\nx`: `create-next-app@latest` → Next **16.4.2**, React 19.3.0, `@tailwindcss/turbopack`
  - `C:\dev\semec-int\c-regressao\vt`: `create vite@latest`, template react-ts → Vite **8.3.4**, React 19.3.1, **TypeScript 7.0.2**, oxlint
- **Código da tela:** `C:\dev\semec-int\c-regressao\shared\` (o mesmo nos dois apps)
- **Scripts:** `C:\dev\semec-int\c-regressao\tools\teste.mjs` (bateria), `js.mjs` (peso de JS) e `smap.mjs` (composição do bundle)
- **Resultados brutos:** `C:\dev\semec-int\c-regressao\resultado-*.json` e `log-*.txt`
- **Prints:** `C:\dev\semec-int\c-regressao\prints\`, com 320, 768 e 1280 px e os estados de erros, enviado, dialog, gaveta e navmenu, para `next`, `next-dev`, `next-export`, `vite` e `vite-dev`

## Resumo

O caminho do README funciona de ponta a ponta nos dois cenários. Os dois apps compilaram de primeira (`next build`, `output: 'export'` e `tsc -b && vite build`).

Nas 5 execuções (Next start, Next dev, Next export, Vite preview e Vite dev):
- o console ficou sem erros, sem avisos e sem aviso de hidratação;
- o axe-core não achou nenhuma violação nos 9 estados medidos;
- o teclado funcionou no formulário inteiro;
- não houve rolagem horizontal da página a 320 px.

Os prints do Next e do Vite são idênticos byte a byte.

Conferi um por um os 21 achados da validação anterior (NEXT42-\*, V42-VITE-\*, DIG-\*, NAV-\*). Nenhum voltou. Os que dependem de dispositivo ou de CI ficaram como "documentado/presente", não como "reproduzido corrigido".

Achados novos: **4** (0 Crítica, 0 Alta, 2 Média, 2 Baixa). O mais importante não é do kit: a receita de formulário do README (`npm install react-hook-form @hookform/resolvers zod`) **falha hoje** com ERESOLVE, porque o `@hookform/resolvers@6.0.0` saiu hoje (19/10, 05:35 UTC).

### Matriz

| | Build | a11y (axe) | Teclado | Responsivo 320/768/1280 | Hidratação/console | JS do cliente (gzip) |
|---|---|---|---|---|---|---|
| **Next 16.4 `next build` (Turbopack)** | OK | 0 violações em 9 estados | OK | OK (scrollWidth = viewport) | 0 erros/avisos (start e dev) | página: 255 kB; rota vazia: 176 kB → tela ≈ +80 kB |
| **Next 16.4 `output: 'export'`** | OK depois de tirar `cacheComponents` do template (ver INT-C-03) | 0 | OK | OK | 0 | igual ao `next build` |
| **Next 16.4 `next build --webpack`** | OK | não medido | não medido | não medido | não medido | rota vazia 281 kB (+105 kB do barrel no layout); com `optimizePackageImports` 173 kB |
| **Vite 8 + React 19 + TS 7** | OK (só o aviso de chunk > 500 kB do Vite) | 0 | OK | OK | 0 (preview e dev) | 617 kB brutos / 187 kB gzip num chunk; o kit ocupa 70,8 kB brutos (30 módulos, só os usados) |

Estados analisados pelo axe:
- fechado a 1280 e 320;
- erros a 1280 e 320;
- Select aberto: só WCAG, sem `aria-hidden-focus`, como manda o README;
- Dialog, Sheet e Toast abertos;
- gaveta da Sidebar a 320.

Teclado verificado em cada execução:
- O `SkipLink` é a 1ª parada e leva o foco ao `<main>`.
- A ordem do Tab segue os campos.
- InputMask: digitar `52998224725` dá `529.982.247-25`.
- DatePicker: digitar dá ISO `1990-03-15`.
- Select: abre com ↓ e escolhe com setas + Enter.
- Radio: as setas mudam e marcam.
- FileUpload: o input recebe o foco, e a zona mostra o anel.
- Checkbox: marca com Espaço.
- Enviar vazio: o foco vai para o `ErrorSummary`. Os 7 links levam o foco ao campo certo, inclusive Select (combobox), Radio (1º item), FileUpload e Checkbox.
- Envio válido: aparece o Toast de sucesso.
- Dialog: o foco entra e fica preso (4 Tabs), e o Esc devolve o foco ao gatilho.
- Sheet: o Esc devolve o foco ao gatilho.
- DataTable: ordena com Enter, o `aria-sort` alterna e o botão se chama só "Número", com a descrição "Ordenar por Número".
- Gaveta da Sidebar a 320: o gatilho tem 44×44 e `aria-expanded`, e o Esc devolve o foco ao gatilho.

Fonte: Poppins carregada (`document.fonts.check` verdadeiro) e `lang="pt-BR"` nos dois apps. CSS do kit: 71 kB no Next e 72,3 kB no Vite (12,8 kB gzip), de acordo com o README (~68 kB / ~12 kB).

> Nota de método: com o Radio sem valor, `keyboard.press("ArrowDown")` instantâneo do Playwright move o foco, mas não marca o item, porque o roving focus do Radix foca no `setTimeout`, depois do keyup. Com a tecla segurada por 60 ms (como uma pessoa faz), o item é marcado. Isso é artefato do teste, não achado.

## Achados antigos

| ID | O que era | Como conferi | Status |
|---|---|---|---|
| NEXT42-01 | Barrel com `export *` levava o kit ao cliente num Server Component | `dist/react/index.js` reexporta por nome. Turbopack, export: `/leve-raiz` (Heading + NavigationMenu pela raiz) = `/leve-subpath` = **181,5 kB gzip** (593 044 B brutos, idênticos), só +5,8 kB sobre a rota vazia. Com `--webpack`, `optimizePackageImports` traz para 179,1 kB, como o README diz | **Corrigido** |
| NEXT42-02 / V42-VITE-01 | HeaderNav estourava 320 px | 4 links (Início, IPTU, ISS, Ajuda): `scrollWidth` 320 = viewport, `nav` com `flex-wrap: wrap` | **Corrigido** |
| NEXT42-03 / V42-VITE-02 | DataTable recusava `interface` | `interface Protocolo` com e sem genérico explícito: `tsc` 5.9 (Next) e `tsc -b` 7.0.2 (Vite) sem erro | **Corrigido** |
| NEXT42-05 | FooterLink curto com 30×44 | "IPTU" a 320: link 28,6×44 com `::after` de 44×44; a 768/1280, `::after` none | **Corrigido** |
| NEXT42-06 | FileUpload sem `*` | Rótulo `Documentos *` com `required` | **Corrigido** |
| NEXT42-07 | Títulos internos com `leading-none` | `DialogTitle` com `leading-tight`: 18 px / 22,5 px; o título longo quebra em 2 linhas (45 px) sem colar | **Corrigido** |
| NEXT42-08 | Aviso `no-img-element` sem explicação | README, passo 2 ("Logo no Next"). O lint do app dá exatamente esse aviso, e o build passa | **Corrigido (doc)** |
| V42-VITE-03 | Painel do NavigationMenu estreito (141×55) | Exemplo da doc (`className="p-2"`): links de 212×44, 1 linha, a 1280 e 390 | **Corrigido** |
| V42-VITE-04 | SKILL sem agrupar SidebarTrigger + HeaderBrand | "Esqueleto com Sidebar" tem o `<div className="flex min-w-0 items-center gap-2">`. Seguido, a marca fica à esquerda | **Corrigido (doc)** |
| V42-VITE-05 | `caption` cortada dentro do overflow | A legenda vira `<p>` fora do `.overflow-auto` (288/288 px a 320), e a tabela é nomeada por `aria-labelledby` | **Corrigido** |
| V42-VITE-06 | Mensagens dos schemas | Vazio: "Informe o CPF."; inválido: "CPF inválido. Confira os 11 dígitos." | **Corrigido** |
| V42-VITE-07 | Vite sem `lang="pt-BR"` | README, passo 2 (Vite) manda trocar. Seguido, `lang=pt-BR` | **Corrigido (doc)** |
| DIG-02, DIG-03, DIG-07 | Falso positivo do codemod com `--color-pv-*` do app e comentários | App com `@theme { --color-pv-blue-900 }`, comentário `/* bg-pv-blue-500 … */`, `bg-pv-blue-900` e `bg-pv-blue-500` no JSX: o codemod relata só `bg-pv-blue-500` e resume "1 utilitário … com cor declarada pelo próprio app … não foram relatados" | **Corrigido** |
| DIG-04 | Migração vinda da 3.0/3.1 | Seção "Vindo direto da 3.0 ou da 3.1" em `docs/migracao-4.0.md` (branch). O link do README aponta para `main`, onde a seção só aparece depois do merge | **Corrigido na branch** |
| DIG-05 | Alvo de Checkbox/Radio | SKILL, linha 488. Os exemplos dos `.md` dos componentes ainda não seguem (ver INT-C-04) | **Corrigido na SKILL, parcial nos `.md`** |
| DIG-08 | Duas cópias do `react-dismissable-layer` | `npm ls` nos dois apps: uma só, 1.2.1. Esc no DropdownMenu e no Combobox dentro do Dialog fecha só o menu; o Dialog continua aberto e o foco volta ao gatilho | **Corrigido** |
| DIG-13 | Caminho longo no Windows | README, "Limitações conhecidas". No caminho curto (`C:\dev\semec-int\c-regressao\nx`) não ocorreu. Não forcei o caminho longo | **Documentado** |
| NAV-01 | Campos com 14 px no mobile | `#nome` com 16 px a 320 e 14 px a 768/1280. Não testei iPhone real | **Corrigido (Chromium)** |
| NAV-02 | Tab do Safari | README, "Acessibilidade". Não há Safari nesta máquina | **Documentado** |
| NAV-03 | Formato do DatePicker | SKILL e `.md`: formato pelo idioma do navegador. Chromium headless com `locale: pt-BR` mostra `dd/mm/yyyy`, como esperado | **Documentado** |
| NAV-05 | CI em WebKit/Firefox | Job em `.github/workflows/ci.yml` (branch). Não rodei a CI | **Presente** |

## Achados novos

### INT-C-01: a receita de formulário do README falha com ERESOLVE (`@hookform/resolvers@6.0.0`)
- **Severidade:** Média. Bloqueia o passo, mas tem contorno, e a causa é externa e de hoje.
- **Passos:**
  1. Num app novo (Next ou Vite), com o kit instalado, rode o comando do README, seção "Validação (Zod)", que se repete na SKILL: `npm install react-hook-form @hookform/resolvers zod`.
- **Esperado:** instala.
- **Obtido:** `npm error ERESOLVE unable to resolve dependency tree … peerOptional effect@"^4.0.0" from @hookform/resolvers@6.0.0`, porque o `effect@3.22.3` já vem pela cadeia opcional `@typeschema/*`. Reproduzido nos dois apps. O `@hookform/resolvers@6.0.0` foi publicado em 2026-10-19T05:35Z.
- **Contorno usado:** `npm install react-hook-form @hookform/resolvers@5 zod@4`. Com o 5.9.2, a receita funciona inteira.
- **Agravante:** o mesmo comando sem versão, numa tentativa que passou, resolveu `zod@3.25.76` (o npm escolheu o 3 pela árvore do `eslint-config-next`). Quem quer zod 4 precisa pedir `zod@4`.
- **Evidência:** `C:\Users\Administrador\AppData\Local\npm-cache\_logs\2026-10-19T12_14_34_689Z-eresolve-report.txt`.
- **Sugestão:**
  - fixar as faixas no README e na SKILL: `npm install react-hook-form @hookform/resolvers@^5 zod@^4`;
  - acompanhar a 6.x do resolvers (ou testar `--legacy-peer-deps`) e então atualizar a receita;
  - pôr esse install num teste de consumidor da CI, para detectar esse tipo de quebra.

### INT-C-02: o pacote testado diz `4.2.0`, mas o README fala de "desde a 4.2.1" e descreve a 4.2.0 como a versão com o defeito
- **Severidade:** Média para o processo de release; Baixa para quem adota, depois de versionado.
- **Passos:**
  1. Instale o .tgz.
  2. Veja que `npm ls @semec/ds` mostra `@semec/ds@4.2.0`.
  3. Leia o README, passo 5: "desde a 4.2.1 o barrel … No 4.2.0 e anteriores, a raiz num Server Component levava o kit inteiro".
- **Esperado:** versão e texto coerentes.
- **Obtido:**
  - quem segue o README acredita estar na versão afetada e muda para subpath sem precisar;
  - o `CHANGELOG.md` do pacote não tem entrada da 4.2.1;
  - o tarball tem o mesmo número da 4.2.0 já publicada no npm (`npm view @semec/ds versions` termina em `4.2.0`), com conteúdo diferente. Se esse .tgz circular (cache do npm, lockfile com `resolved` local), duas 4.2.0 distintas convivem.
- **Sugestão:**
  - rodar `changeset version` antes de qualquer `npm pack` de validação, ou gerar o pacote de teste como `4.2.1-rc.N`;
  - fazer o gate recusar `npm pack` quando houver changeset pendente e o README citar uma versão maior que a do `package.json`.

### INT-C-03: o README não cobre `output: 'export'`, e o template do `create-next-app` 16.4 quebra o export
- **Severidade:** Baixa. Não é do kit, mas é o caminho que o próprio site do DS usa.
- **Passos:**
  1. Rode `create-next-app@latest`. Ele gera `cacheComponents: true` e `partialPrefetching: true` no `next.config.ts`.
  2. Siga o README.
  3. Acrescente `output: "export"`.
  4. Rode `next build`.
- **Esperado:** export estático.
- **Obtido:** `Error: Invariant: PPR cannot be enabled in export mode`. Tirar só o `partialPrefetching` não basta; é preciso tirar também o `cacheComponents`. Feito isso, o export sai completo:
  - as fontes Poppins são copiadas para `out/_next/static/media`;
  - axe 0, console limpo e o mesmo comportamento do `next start`.
- **Sugestão:** uma linha no passo 2 (Next) ou em "Limitações conhecidas": "Para `output: 'export'`, remova `cacheComponents` e `partialPrefetching` que o `create-next-app` 16.4 gera". Vale também lembrar o `basePath`, se o app for servido em subpasta.

### INT-C-04: o `orgName` padrão "SEMEC" do HeaderBrand não está no README nem nos esqueletos da SKILL, e os exemplos de Checkbox e Radio contradizem a regra de alvo
- **Severidade:** Baixa.
- **Passos (orgName):**
  1. Copie o "Esqueleto com Sidebar" da SKILL, que passa só `logo` e `serviceName`.
- **Obtido:** a marca mostra **"SEMEC | Protocolo digital"** (prints `*-320.png` e `*-1280.png`). O padrão `orgName = "SEMEC"` só aparece no `cabecalho.md` e no código (`header.js`). Um sistema de outra secretaria sai com "SEMEC" sem perceber. O `.d.ts` não traz JSDoc com o padrão.
- **Passos (alvo):**
  1. Copie os exemplos de `caixa-de-marcacao.md` e `botao-de-opcao.md` (`<div className="flex items-center gap-2">`).
- **Obtido:** linhas de cerca de 24 px de altura. A SKILL, linha 488 (DIG-05), pede `flex min-h-11 items-center gap-2`. O axe não acusa, porque `target-size` é WCAG 2.2.
- **Sugestão:**
  - incluir `orgName` nos dois esqueletos da SKILL e um JSDoc `@default "SEMEC"`;
  - trocar o `className` dos exemplos de Checkbox e Radio no manifest para `flex min-h-11 items-center gap-2`.

## Onde o README foi ambíguo, faltou passo ou não funcionou

1. **Receita de formulário:** o comando sem versão quebra hoje (INT-C-01) e pode trazer o zod 3 em vez do 4.
2. **Versão:** o texto fala de 4.2.1 num pacote 4.2.0 (INT-C-02).
3. **`output: 'export'`:** não é mencionado, e o template novo quebra o export (INT-C-03).
4. **API dos componentes de formulário:** o README não tem exemplo de InputMask, DatePicker, Select, RadioGroup, Checkbox, FileUpload nem Sidebar. Ele aponta para "a skill `semec-ds`", mas não diz **onde** ela está no disco (`node_modules/@semec/ds/dist/skills/semec-ds/SKILL.md`). A tabela de subpaths só dá o specifier `@semec/ds/skills/semec-ds`. Sugestão: uma linha com o caminho físico e com `dist/skills/components/<slug>.md`.
5. **RHF com controles não nativos:** a receita da SKILL só mostra `Input` com `register`/`Controller`. Para Select, RadioGroup, Checkbox e FileUpload, tive de deduzir a ligação: `onValueChange={field.onChange}`, `checked={field.value}`, e `id` no `SelectTrigger` (não no `Select`) para o link do `ErrorSummary`. Também tive de deduzir o `id` do grupo de Radio, cujo link foca o 1º item. Tudo funcionou, mas por tentativa. Sugestão: estender a receita com esses quatro.
6. **Passo 4 + `--webpack`:** o exemplo de `Providers` importa da raiz num arquivo sem `"use client"`. No Turbopack não custa nada. Com `next build --webpack`, porém, todas as rotas ganham cerca de 105 kB gzip (rota vazia: 281 kB contra 176 kB). O passo 5 avisa sobre o webpack, mas o exemplo do passo 4 não. Sugestão: importar `Toaster` e `TooltipProvider` por subpath nesse exemplo, ou dizer ali que, com webpack, vale o aviso do passo 5.
7. **Funcionou exatamente como escrito:**
   - limpeza do `globals.css` e do `layout.tsx`;
   - `@source` relativo;
   - ordem `fonts.css` antes de `tokens.css`;
   - `lang` no Vite;
   - apagar o `App.css`;
   - nota do `@tailwindcss/turbopack`;
   - aviso do `no-img-element`;
   - configuração do axe com a camada aberta.

   O template novo do Vite vem com **TypeScript 7** e oxlint, e os tipos do kit passaram no `tsc -b` 7.0.2. O README só fala de TypeScript 5 no contexto do codemod, o que está correto.

## Contagem por severidade

| Severidade | Quantidade | IDs |
|---|---|---|
| Crítica | 0 | — |
| Alta | 0 | — |
| Média | 2 | INT-C-01, INT-C-02 |
| Baixa | 2 | INT-C-03, INT-C-04 |
