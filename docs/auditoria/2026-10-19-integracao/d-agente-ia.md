# D — Agente de IA usando só os artefatos do @semec/ds

Pacote testado: `C:\dev\semec-int\semec-ds-4.2.0.tgz` (futura 4.2.1), extraído em `C:\dev\semec-int\d-agente-ia\pkg\package\`.
Data: 19/10/2026. Ambiente: Node 24.21, npm 11.19, Vite 8, React 19.3, Vue 3.5, Tailwind 4.3, Playwright 1.64 (Chromium 1194) e axe-core 4.x.

Fontes consultadas: `package/README.md`, `dist/skills/` (llms.txt, llms-full.txt, manifest.json, components/*.md, semec-ds/SKILL.md) e `dist/lite/` (SKILL lite, llms.txt, manifest.json). Os `.d.ts` foram abertos só depois das telas prontas, para conferir as props. Não abri `src/`, `dist/react/*.js`, o repositório nem os worktrees. Também li o `tokens.css`, porque a skill lite manda linká-lo, mas só para listar as variáveis disponíveis fora do `@theme`.

## Resumo

- **Para React, os artefatos bastam.** A tela completa saiu certa de primeira: cabeçalho, trilha, formulário de 8 campos com RHF + Zod, ErrorSummary, tabela, Dialog de confirmação e Toast. O `tsc` passou sem nenhum erro de prop ou de import, o build passou e o axe deu **0 violações** em 6 estados, inclusive com o Select aberto (configurado como pede o README). O foco também se comportou como esperado: o SkipLink é a 1ª parada de Tab, o envio inválido leva o foco ao ErrorSummary, o link do resumo foca o campo e o Dialog devolve o foco ao botão de origem. Todas as props citadas no manifest existem nos `.d.ts`, e os exemplos dos `.md`, da SKILL e do README compilam contra os tipos reais (só 3 problemas pequenos, ver INT-D-14 e INT-D-15). O que atrapalhou: a receita de instalação do formulário quebra hoje (INT-D-03), e o `reset()` do RHF deixa erros nos controles Radix (INT-D-04), o que não está documentado.
- **Sem React (HTML puro e Vue), a lite garante acessibilidade, mas não garante o mesmo visual.** As duas telas passaram no axe com 0 violações e têm teclado e foco corretos. Os tokens L1 existem todos em CSS puro. Mas a lite não descreve a anatomia dos componentes, e algumas frases dela levam a escolhas diferentes do kit: cabeçalho azul (o do kit é branco), rótulo de 12px (o do kit tem 14px), botão com canto de 8px (o do kit é pílula) e campo com fonte de 16px (o do kit usa 14px). Lado a lado, as três telas parecem "da mesma família", mas não "do mesmo sistema".
- **Nenhum artefato fala de Vue ou de outro framework.** Cheguei ao caminho certo (Tailwind + lite, sem `@source`) por dedução. Além disso, `npm install @semec/ds` num projeto Vue instala React e cerca de 20 pacotes Radix.
- **Auditoria dos artefatos:** o `manifest.json` é JSON válido e os 55 componentes têm `.md`, sem sobra nem falta. Não há marcadores de conflito, e os 11 links externos respondem 200. Não encontrei exemplo com API depreciada. O problema mais visível é que **todos** os artefatos do tarball trazem a faixa "Não publicado… pode não ter o que está descrito aqui" (INT-D-02).

### Contagem por severidade

| Severidade | Qtde |
|---|---|
| Alta | 1 |
| Média | 8 |
| Baixa | 10 |
| **Total** | **19** |

## Placar

| Tela | Erros do agente induzidos por artefato | Erros meus (o artefato avisava) | Certa de primeira | tsc / build | axe |
|---|---|---|---|---|---|
| React (Vite + React 19, tgz) | 2: instalação ERESOLVE (INT-D-03) e erros reaparecendo após `reset()` (INT-D-04). Mais 1 contorno: logo inexistente (INT-D-11) | 1: tabela que rola sem parada de Tab em 390px (INT-D-09) | ~95%. Nenhuma prop inventada, nenhum import errado, nenhum token inexistente | ok / ok | 0 violações em 6 estados |
| HTML puro (só a lite, sem Tailwind) | 5 divergências visuais: INT-D-01, 05, 06, 07 e 18 | 0 | Funcional e a11y ~100%; fidelidade visual ao kit ~70% | n/a | 0 violações em 5 estados |
| Vue 3 (formulário, Tailwind + lite) | As mesmas 5 divergências da HTML, mais a falta de orientação (INT-D-08) e o peso das dependências React (INT-D-10) | 0 | Funcional e a11y ~100%; fidelidade visual ~70% | vue-tsc ok / ok | 0 violações em 4 estados |

Medições lado a lado (estilos computados, `prints/comparacao-estilos.json`):

| Elemento | React (kit) | HTML (lite) | Vue (lite) |
|---|---|---|---|
| Fundo do cabeçalho | branco + borda inferior | `--brand-hero` (azul) | `--brand-hero` (azul) |
| Rótulo do campo | 14px / 500 | 12px / 600 | 12px / 600 |
| Fonte do campo / select | 14px | 16px | 16px |
| Padding horizontal do campo | 16px | 12px | 12px |
| Raio do botão | 9999px (pílula) | 8px | 8px |
| Padding horizontal do botão | 20px | 16px | 16px |
| Altura de campo e botão, borda do campo, h1, raio do cartão, dica | iguais nas três (44px, `--pv-gray-400`, 32px/700, 12px, 12px `--text-muted`) | | |

## Prints

Em `C:\dev\semec-int\d-agente-ia\prints\`:

- `react-1-inicial`, `react-1b-skiplink`, `react-2-erros`, `react-3a-select-aberto`, `react-3-preenchido`, `react-4-dialogo`, `react-5-toast`, `react-6-mobile` (.png)
- `html-1…6` (o mesmo roteiro; o diálogo é `<dialog>` nativo)
- `vue-1…4`, `vue-6-mobile` (só o formulário)
- `comparacao-lado-a-lado.png` (estado de erro das três telas) e `comparacao-estilos.json`
- `*-resultado.json` (axe, foco, overflow, console de cada tela)

Código: `d-agente-ia\react-app\src\App.tsx`, `d-agente-ia\html-app\` (index.html, app.css, app.js), `d-agente-ia\vue-app\src\App.vue`. Scripts de teste: `d-agente-ia\tools\testar.mjs`, `comparar.mjs`, `extrair.mjs` e `extrair2.mjs` (compilam os exemplos dos `.md`, da SKILL e do README contra os tipos).

## Auditoria dos artefatos (tarefa 1)

| Verificação | Resultado |
|---|---|
| `manifest.json` (full e lite) válido como JSON | Sim |
| Todo componente do manifest tem `.md` | Sim: 55/55, sem `.md` órfão |
| Nomes de props do manifest batem com os `.d.ts` | Sim: as 21 props avulsas conferidas existem (`emptyText`, `viewportLabel`, `closeLabel`, `loadingText`, `titleAs`, `announce`, `homeLabel`, `viewportProps`, `focusable`, `siblingCount`, `decorative`, `rowLabel`, `srLabel`, `onStepClick`, `openCalendar`, `errorRole`, `focusKey`, `underline`, `onSurface`, `isActive`, `collapsible`); as variantes do `Badge` também batem |
| Exemplos compilam contra os tipos | 55 exemplos de `.md` + 13 blocos da SKILL e do README: só `next/link` (INT-D-15) e `FormField` sem import (INT-D-14). O resto são variáveis de contexto propositais |
| Marcadores de conflito | Nenhum |
| Versão errada | Faixa "Não publicado / 4.2.0" em todos os artefatos (INT-D-02) |
| Links quebrados | 11 URLs externas respondem 200. Há um link relativo sem domínio (INT-D-17) |
| Exemplos com API depreciada | Nenhum (`onChange` de valor, `ariaLabel`, `emptyMessage` e `digits` não aparecem em exemplos) |
| SKILL completa × lite | Sem contradição de tokens. Divergem no `aria-describedby` do erro (INT-D-18) e na borda de campo, que só a completa nomeia (INT-D-19). As duas compartilham as frases que induzem erro visual (INT-D-05, 06 e 07) |

## Achados

### INT-D-01 — A skill lite não descreve a anatomia dos componentes
- **Severidade:** Alta
- **Artefato:** `dist/lite/semec-ds-lite/SKILL.md`, seção "Padrões de tela (sem React)", e `dist/lite/manifest.json` (sem nenhum dado de componente).
- **Trecho:** "Para os mesmos padrões com componentes prontos (`SkipLink`, `Header`, `Heading`, `Footer`, `Table`…), veja a skill `semec-ds`."
- **Problema:** a lite dá tokens e regras de a11y, mas não diz como cada peça é desenhada: altura, raio, padding e fonte de campo e botão, peso e tamanho do rótulo, cabeçalho, badge, toast, diálogo e resumo de erros. As telas HTML e Vue saíram acessíveis, mas com 6 diferenças medidas em relação ao kit (tabela do placar). Remeter à skill `semec-ds` não resolve, porque ela também não tem essa anatomia; só o código-fonte nos `.md` tem, e um agente lite não os lê.
- **Sugestão:** acrescentar à lite (e gerar do manifest) uma seção "Anatomia dos componentes (sem React)":
  > | Peça | Receita |
  > |---|---|
  > | Rótulo de campo | `text-sm font-medium text-foreground`; asterisco `text-destructive` |
  > | Campo (input, select, textarea) | `h-11 w-full rounded-md border border-input bg-surface px-4 py-2 text-sm text-foreground`; inválido: `border-destructive` |
  > | Dica / erro | `text-xs text-text-muted` / `text-xs text-destructive`; a dica some quando há erro |
  > | Botão principal | `min-h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-hover` |
  > | Botão secundário | o mesmo, com `border border-border-strong bg-surface text-foreground` |
  > | Cabeçalho | `<header>` `bg-surface border-b border-border px-4 py-3`; nome do órgão `text-brand-hero font-bold`; link atual `text-brand-hero font-semibold` |
  > | Resumo de erros | `rounded-md border-2 border-destructive bg-destructive/5 p-4 px-6`; título `h2 text-xl font-semibold text-destructive` |
  > | Badge | `rounded-full px-2 text-xs font-semibold` + `bg-*-surface text-*` |
  > | Toast de sucesso | `bg-success-emphasis text-success-emphasis-foreground rounded-lg shadow-elevation-2`; título `text-base font-bold`, texto `text-sm` |

### INT-D-02 — Faixa "Não publicado" e versão 4.2.0 em todos os artefatos do tarball
- **Severidade:** Média
- **Artefato:** `SKILL.md` (l. 9-11), `semec-ds-lite/SKILL.md` (l. 9-11), `llms.txt` (l. 5), os 55 `components/*.md` e o campo `unreleased` de `manifest.json` (full e lite).
- **Trecho:** "**Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (patch) que ainda não estão no npm. O @semec/ds@4.2.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.2.1.**"
- **Problema:** dentro do pacote instalado, o agente lê que o pacote "pode não ter o que está descrito" e passa a desconfiar de todo artefato. O texto também diz "Gerado para `@semec/ds@4.2.0`" enquanto o README fala de comportamento "desde a 4.2.1". Se a 4.2.1 for publicada a partir desse build, a faixa vai junto. Há ainda um erro de concordância: "1 changeset … que ainda não estão".
- **Sugestão:** gerar os artefatos do tarball sem o bloco `unreleased`, ou com a versão que está sendo publicada (no `prepublishOnly`, ler a versão final). Acrescentar ao `test:dist` uma checagem que falha se `Não publicado` aparecer em `dist/`. Se a faixa continuar no repositório, corrigir para "inclui 1 changeset pendente (patch), que ainda não está no npm".

### INT-D-03 — O comando de instalação da receita de formulário falha hoje
- **Severidade:** Média
- **Artefato:** README ("Validação (Zod)"), SKILL ("Instalação" e "Exemplo Canônico"), `manifest.json` (`install.form`) e o bloco de instalação de todos os `.md`.
- **Trecho:** "`npm install react-hook-form @hookform/resolvers zod`"
- **Problema:** num projeto Vite novo (npm 11), o comando falha com `ERESOLVE`. O `@hookform/resolvers@6` declara o peer opcional `effect@^4`, que conflita com `effect@3` trazido por `@typeschema`. Um agente que segue o artefato fica parado aqui. Com `@hookform/resolvers@^5` funciona, e a receita compila e roda.
- **Sugestão:** "`npm install react-hook-form @hookform/resolvers@^5 zod` (a receita é testada com o resolvers 5; o 6 falha com ERESOLVE no npm 11 por causa do peer `effect`)". Revalidar quando o resolvers 6 corrigir o peer.

### INT-D-04 — `reset()` do React Hook Form deixa erros no Select, no RadioGroup e no Checkbox
- **Severidade:** Média
- **Artefato:** SKILL, "Padrão de formulários" e "Contrato dos controles de formulário"; `campo-de-formulario.md`.
- **Trecho:** não há; o assunto não é tratado.
- **Problema:** depois de um envio válido, chamei `reset()` e as mensagens "Escolha a escola de destino.", "Escolha o turno desejado." e "Confirme que as informações são verdadeiras." voltaram (`prints/react-5-toast.png` da 1ª rodada). A instrumentação mostrou a causa: o reset nativo do `<form>`, que o RHF dispara por causa dos campos com `register`, faz o `Select` chamar `onValueChange("")` e o `Checkbox` chamar `onCheckedChange(false)`. O RHF recebe isso como mudança e revalida. Contornei com `setTimeout(() => clearErrors(), 50)`.
- **Sugestão:** acrescentar à SKILL, em "Padrão de formulários":
  > **Limpar o formulário:** `Select`, `RadioGroup` e `Checkbox` escutam o `reset` nativo do `<form>` e chamam `onValueChange`/`onCheckedChange` com o valor vazio. Com React Hook Form, depois de `reset()` chame `clearErrors()` no próximo ciclo (`setTimeout(() => clearErrors())`), ou faça o reset com `reset(valoresIniciais, { keepErrors: false })` e verifique o resultado.

  Melhor ainda: avaliar no kit se esses controles devem ignorar o `reset` quando são controlados (`value` definido).

### INT-D-05 — "text-xs = rótulo", mas o rótulo do FormField tem 14px
- **Severidade:** Média
- **Artefato:** SKILL, tabela "Texto" (`text-xs` | 12px | Rótulo); lite, "Tipografia" ("`xs` = rótulo").
- **Problema:** seguindo a lite, fiz os rótulos de campo com 12px (HTML e Vue). O `FormField` usa `text-sm font-medium` (14px). O "rótulo" da tabela é de etiqueta e legenda, não de campo, e a frase não diz isso.
- **Sugestão:** "`text-xs` | 12px | Etiqueta, dica e mensagem de erro de campo (o **rótulo de campo** é `text-sm font-medium`, 14px)".

### INT-D-06 — "Controle = rounded-md", mas o Button é pílula
- **Severidade:** Média
- **Artefato:** SKILL ("Raio: … Escolha pelo papel (controle `rounded-md`, cartão `rounded-lg`, pílula `rounded-full`)") e lite ("controle `md`, cartão `lg`, pílula `full`").
- **Problema:** o `Button` do kit usa `rounded-full` (fonte em `botoes.md`). Seguindo a regra, os botões HTML e Vue saíram com 8px. A regra contradiz o próprio kit.
- **Sugestão:** "controle de entrada (campo, select) `rounded-md`; **botão `rounded-full`** (pílula); cartão e diálogo `rounded-lg`".

### INT-D-07 — "Marca = brand-hero (faixas institucionais)" leva a um cabeçalho azul; o Header do kit é branco
- **Severidade:** Média
- **Artefato:** lite ("**Marca e ação:** marca = `bg-brand-hero text-text-on-brand`…") e SKILL ("Faixas institucionais, hero e selo usam `bg-brand-hero`").
- **Problema:** sem descrição do cabeçalho, as telas HTML e Vue usaram uma faixa `bg-brand-hero`. O `Header` do kit é `bg-surface border-b border-border`, com a marca em `text-brand-hero`. É a diferença mais visível entre as telas (`prints/comparacao-lado-a-lado.png`).
- **Sugestão:** acrescentar à lite: "O cabeçalho do portal **não** é faixa de marca: `<header>` com `bg-surface border-b border-border`, nome do órgão em `text-brand-hero font-bold` e link atual em `text-brand-hero font-semibold`. `bg-brand-hero` fica para hero e faixas de destaque dentro da página."

### INT-D-08 — Nenhum artefato orienta projetos Vue, Angular ou outros sem React
- **Severidade:** Média
- **Artefato:** README (cita a lite só na tabela de subpaths), lite, `llms.txt`.
- **Trecho:** grep por `vue|angular|svelte` em todos os artefatos: 0 ocorrências.
- **Problema:** um agente que começa pelo README (o arquivo mais visível) só encontra instruções de React e Next. O caminho certo para Vue (lite + Tailwind, sem `@source`, controles nativos) teve de ser deduzido. Também não há receita de ErrorSummary sem React além de três linhas na lite.
- **Sugestão:** no README, logo após "Comece aqui", uma seção:
  > ### Sem React (Vue, Angular, Svelte, HTML)
  > Os componentes são React. Em outro framework, use a variante **lite**: `@import "tailwindcss"; @import "@semec/ds/lite/fonts.css"; @import "@semec/ds/lite/tokens.css";` (sem `@source`), controles HTML nativos e a skill `@semec/ds/lite/skills/semec-ds-lite`, que traz tokens, a11y e a anatomia de cada peça. Sem Tailwind, use as variáveis `var(--…)`.

  Repetir a frase na `description` da lite ("Use em Vue, Angular, HTML ou qualquer app sem React").

### INT-D-09 — `tabela.md` não avisa que a Table rola sem parada de Tab no mobile
- **Severidade:** Média
- **Artefato:** `components/tabela.md` (exemplo básico). O aviso existe só na SKILL ("Tabelas").
- **Problema:** parti do exemplo do `.md` e a tabela de 5 colunas ficou rolando na horizontal em 390px, sem nenhum elemento focável (`prints/react-6-mobile.png`), o que falha o WCAG 2.1.1 para quem usa só teclado. O axe em 1280px não pega. A lite dá a receita (`tabindex="0"`, `role="region"`, `aria-label`), mas a SKILL completa só diz "prefira menos colunas" e não diz como tornar o wrapper focável, já que ele "não recebe foco".
- **Sugestão:** no `tabela.md` e na SKILL: "Se a tabela pode rolar na horizontal e não tem nada focável, envolva-a em `<div role="region" aria-label="Solicitações" tabIndex={0} className="overflow-x-auto">` ou reduza as colunas abaixo de `md:`." Avaliar uma prop `scrollLabel` na `Table` que já faça isso.

### INT-D-10 — Instalar o pacote num projeto lite (Vue) traz React e Radix
- **Severidade:** Baixa
- **Artefato:** lite, "Instalação".
- **Trecho:** "O `npm install` traz junto as dependências do kit React (o pacote é um só) e, no npm 7+, também os peers dele…"
- **Problema:** está documentado, mas o projeto Vue ganhou `react`, `react-dom`, `lucide-react` e cerca de 20 `@radix-ui/*` no `node_modules`, o que pesa em auditoria de dependências da prefeitura. O bundle não é afetado.
- **Sugestão:** documentar `npm install @semec/ds --omit=peer` para a lite, ou publicar os tokens num pacote à parte (`@semec/tokens`). Texto: "Na lite, `npm install @semec/ds --omit=peer` evita instalar React e lucide."

### INT-D-11 — O pacote não traz a logo, e os exemplos usam nomes diferentes
- **Severidade:** Baixa
- **Artefato:** SKILL (`/marca.svg`), `cabecalho.md` (`/logo-prefeitura.svg`), README.
- **Problema:** sem logo, o `HeaderBrand` mostra um placeholder e avisa no console. O agente não tem de onde tirar o arquivo oficial; criei um SVG provisório.
- **Sugestão:** "A logo oficial não vem no pacote: peça o SVG à SEMEC (ou baixe em <URL>) e salve como `public/marca.svg`". Usar o mesmo nome em todos os exemplos.

### INT-D-12 — `notificacao.md` diz "12px" e traz hex; o Toast real usa 16/14px
- **Severidade:** Baixa
- **Artefato:** `notificacao.md`, `manifest.json` (variants do `toast`).
- **Trecho:** "success (verde SEMEC #82C353, texto #26325B, 12px, Poppins)"
- **Problema:** o fonte mostra título `text-base font-bold` e texto `text-sm`. Além disso, os hex soltos contradizem a regra "sem hex" da própria skill.
- **Sugestão:** "success (fundo `bg-success-emphasis`, texto `text-success-emphasis-foreground`, 5,85:1; título 16px bold, descrição 14px)".

### INT-D-13 — O kit usa `px-5`, `py-1.5` e `gap-1.5`, que a SKILL proíbe
- **Severidade:** Baixa
- **Artefato:** SKILL ("fique nos degraus do DS (nada de `px-5`, `py-1.5`)"); fonte em `botoes.md` (`md: min-h-11 px-5 py-2`, `sm: … py-1.5`) e `campo-de-formulario.md` (`gap-1.5`).
- **Problema:** quem replica o visual pela regra não chega ao kit (padding de 16px no lugar de 20px; gap de 4px no lugar de 6px).
- **Sugestão:** "A regra vale para o código do app. Exceções do kit: botão `px-5` (20px) e `FormField` `gap-1.5` (6px). Replique esses valores se estiver recriando a peça sem React."

### INT-D-14 — Exemplo de `menu-de-selecao.md` usa `FormField` sem importar e valores estranhos
- **Severidade:** Baixa
- **Artefato:** `components/menu-de-selecao.md`, "Uso".
- **Problema:** o `tsc` acusa `Cannot find name 'FormField'`. Os valores `"pbh"` e `"riob"` para Porto Velho e Rio Branco confundem.
- **Sugestão:** `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, FormField } from "@semec/ds/react";` e valores `"porto-velho"` e `"rio-branco"`.

### INT-D-15 — `botoes.md` importa `next/link` sem aviso
- **Severidade:** Baixa
- **Artefato:** `components/botoes.md`, "Uso".
- **Problema:** num app Vite, o exemplo não compila (`TS2307: Cannot find module 'next/link'`).
- **Sugestão:** comentar a linha: `// Next.js: import Link from "next/link"; em Vite/SPA use <a href> ou o Link do seu roteador`.

### INT-D-16 — O nome padrão do `HeaderNav` é "Principal"; as skills pedem "Menu principal"
- **Severidade:** Baixa
- **Artefato:** `cabecalho.md` (fonte: `aria-label="Principal"`; o exemplo de uso não passa `aria-label`); SKILL ("cada `<nav>` com `aria-label` distinto ("Menu principal"…)").
- **Problema:** quem copia o exemplo do `.md` fica com um landmark chamado "Principal", diferente do padrão da SKILL e do `NavigationMenu`.
- **Sugestão:** padrão `"Menu principal"` no componente; enquanto isso, `<HeaderNav aria-label="Menu principal">` no exemplo do `.md`.

### INT-D-17 — Caminhos de `src/` e um link relativo que não existem para quem instala
- **Severidade:** Baixa
- **Artefato:** `manifest.json` (`file: "src/components/button.tsx"`), cabeçalho de cada `.md` ("**Arquivo:** `src/components/…`"), `tabela.md` e manifest (`/padroes/dados-relatorios/tabelas`).
- **Problema:** `src/` não está no tarball, e o link relativo não resolve fora do site.
- **Sugestão:** trocar por `https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/button.tsx` e `https://semec-pvh.github.io/SEMEC_design_system/padroes/dados-relatorios/tabelas/`.

### INT-D-18 — Lite e kit discordam sobre a dica quando o campo tem erro
- **Severidade:** Baixa
- **Artefato:** lite, "Formulários e Validação", padrão 1.
- **Trecho:** "campo com `aria-invalid="true"` e `aria-describedby="[id]-hint [id]-error"`"
- **Problema:** o `FormField` esconde a dica quando há erro (`hintId` só sem `error`) e descreve o campo só pelo erro. Seguindo a lite ao pé da letra, as telas sem React mostram dica e erro juntos.
- **Sugestão:** "Com erro, a dica sai da tela e o campo fica com `aria-describedby="[id]-error"`; sem erro, `aria-describedby="[id]-hint"`."

### INT-D-19 — A lite não nomeia o token da borda de campo
- **Severidade:** Baixa
- **Artefato:** lite, tabela "Tailwind CSS v4" (não tem `border-input`) e L1 "Cor" (`--border-strong` = "Bordas proeminentes").
- **Problema:** a cor da borda de campo só aparece como primitivo (`--pv-gray-400` "Borda de campo"), que a própria lite proíbe usar. Escolhi `--border-strong` por dedução e acertei (mesma cor), mas foi sorte.
- **Sugestão:** acrescentar à lite: "`border-input` / `--border-strong` | Borda de campo (3:1 sobre `--surface`)".

## Erros do agente (tarefa 6)

| # | Tela | Erro | Frase do artefato que induziu |
|---|---|---|---|
| 1 | React | `npm install` falhou com ERESOLVE | "npm install react-hook-form @hookform/resolvers zod" (INT-D-03) |
| 2 | React | Erros reapareceram no Select, RadioGroup e Checkbox depois de `reset()` | nenhuma; o assunto não é tratado (INT-D-04) |
| 3 | React | Logo provisória criada à mão | "Passe sempre `logo` com o asset real (`<img alt="Prefeitura de Porto Velho">`)", sem dizer onde obter (INT-D-11) |
| 4 | React | Tabela rola sem parada de Tab em 390px (erro meu; a SKILL avisa, o `.md` não) | exemplo de `tabela.md` (INT-D-09) |
| 5 | HTML/Vue | Cabeçalho pintado de `brand-hero` | "marca = `bg-brand-hero text-text-on-brand`" (INT-D-07) |
| 6 | HTML/Vue | Rótulo de campo em 12px | "`xs` = rótulo" (INT-D-05) |
| 7 | HTML/Vue | Botão com canto de 8px | "controle `md`, cartão `lg`, pílula `full`" (INT-D-06) |
| 8 | HTML/Vue | Campo com fonte de 16px e padding de 12px | nenhuma receita de campo na lite (INT-D-01) |
| 9 | HTML/Vue | Badge, toast, diálogo e rodapé desenhados por palpite | "Para os mesmos padrões com componentes prontos… veja a skill `semec-ds`" (INT-D-01) |

Nenhuma prop inventada, nenhum import errado e nenhum token inexistente nas três telas. O `tsc` e o `vue-tsc` passaram na primeira tentativa.

## Observação fora do pacote

A skill instalada no repositório, que aparece na lista do agente, ainda se descreve com "47 componentes", enquanto a do pacote diz 55. Vale regenerar `.claude/skills/semec-ds/SKILL.md` no repositório.
