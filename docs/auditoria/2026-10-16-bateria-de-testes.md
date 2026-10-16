# Bateria de testes do Design System SEMEC: 4 frentes em paralelo

| Campo | Valor |
|---|---|
| Data | 16/10/2026 |
| Versão testada | `main` em `c8c4de9`: `@semec/ds` 4.0.1 + SEM-817 (padrão RHF + Zod + `ErrorSummary`, ainda não publicado). Comparado com o npm 4.0.1: 15 arquivos diferem (TST-15). |
| Método | 4 frentes independentes, cada uma com verificação adversarial: (1) regressão visual com Playwright `toHaveScreenshot`; (2) testes de comportamento por componente (Vitest + Testing Library + axe, mais Chromium/CDP onde o jsdom não alcança); (3) re-auditoria de adequação ao propósito, comparada com a de 14/10 (tarball do `main`, 5 telas, axe, roteiros de fluxo); (4) um agente de IA consumindo o DS só pelos artefatos (`llms.txt`, SKILL, `manifest.json`, `.md`). |
| Agentes | 9 agentes mais o orquestrador: 4 de frente, 4 verificadores e 1 integrador. |
| Régua | A mesma de 14/10: axe com **zero serious/critical** em WCAG 2.1 A/AA; alvo de 44 px no mobile; PT-BR (`dd/mm/aaaa`, `R$ 1.234,56`, vírgula decimal); só tema claro; nada de hex, `rgba()` ou `style`. |
| Severidade | A final é a do verificador. Achado refutado vai para o apêndice. Achado citado por mais de uma frente aparece uma vez só. |

---

## 1. Veredito geral

**O DS está quase adequado ao propósito, mas ainda não.**

A régua automática passa. As 5 telas e 30+ estados de fluxo têm 0 serious/critical no axe. Um agente de IA montou 3 telas e 2 páginas lite só pelos artefatos, com 0 violações em 27 cenários. Poppins carrega, não sobra texto em inglês e o tree-shaking funciona.

O que impede a adequação:

- **Bloqueante (TST-01).** O `ErrorSummary` rouba o foco enquanto a pessoa digita, depois de um envio com erro. Um celular de 11 dígitos é gravado com 10 e passa na validação, ou seja, o dado é corrompido sem aviso. O componente com o bug **já está no npm 4.0.1**. O SEM-817 só trouxe a receita que dispara o problema. Precisa de um patch 4.0.2.
- **Alto.** Há marcadores de conflito de merge no exemplo canônico da SKILL, já no site publicado (TST-02). O Toggle ligado fica indistinguível do desligado (TST-03). A SKILL ensina uma posição de Header que fica sob a Sidebar (TST-04). A ScrollArea só com texto dispara axe serious (TST-05). E a revisão por outra pessoa continua opcional (TST-06).

Com a onda 0 (seção 6) aplicada, o DS atende ao `objetivo.md` na régua de 14/10.

**Achados consolidados: 44.**

| Origem | Bloqueante | Alto | Médio | Baixo | Total |
|---|---|---|---|---|---|
| Kit, documentação e governança | 1 | 5 | 14 | 17 | 37 |
| Entregáveis desta bateria | 0 | 0 | 2 | 5 | 7 |
| **Total** | **1** | **5** | **16** | **22** | **44** |

Eles vêm de 39 achados de origem (8 VIS, 9 TST-F2, 10 da re-auditoria, 11 AIA, e um item pedido pelo orquestrador) mais 21 achados novos dos verificadores. 1 foi refutado.

---

## 2. O que o DS acerta (verificado)

- **axe limpo nas telas reais.** 0 serious/critical nas 5 telas, em 1366 e 390 px, e também 0 moderate no estado inicial. Em 14/10 eram 1 critical + 2 serious no fluxo do requerimento.
- **Agente de IA consegue usar.** Seguindo só os artefatos, o app passou em `next build` e `tsc`, com axe 0 em 27 cenários. Os 55 componentes e a versão 4.0.1 batem entre `llms.txt`, `manifest.json`, SKILL e `package.json`. Na lite, os contrastes ficam entre 5,42 e 15,77:1.
- **Disciplina de token.** 0 hex, 0 `rgba()` e 0 `style` nas telas da re-auditoria e no app do agente.
- **Correções de 14/10 de verdade.** InputOTP, Combobox, FileUpload, DataTable e Toast funcionam. O InputOTP grava "123456".
- **Código menor.** As 5 telas caíram de 1.848 para 1.197 linhas e ficaram 15% menores em bytes.
- **Bundle podado.** O JS varia por tela (110–156 kB gzip) em vez de ficar fixo em 146–150 kB.
- **Tipos.** `tsc` com `nodenext` passa com exit 0, e o `--checkJs` das telas não encontrou nenhuma prop inexistente.
- **Mecânica do Radix.** Foco preso, Esc, setas, Combobox, Calendar, Select, abas e gaveta funcionam por teclado.
- **Base testável.** A suíte visual detecta a troca de um único token (83 testes falham). Os testes novos pegaram todas as mutações de a11y aplicadas pelo verificador, com uma exceção (TST-37).

---

## 3. Placar antes × depois (re-auditoria, Frente 3)

### 3.1 Os 78 requisitos

| Dimensão | 14/10 ✅/⚠️/❌/🔭/❓ | **16/10 ✅/⚠️/❌/🔭/❓** |
|---|---|---|
| 1. Acessibilidade (01–16) | 1 / 11 / 2 / 2 / 0 | **12 / 3 / 0 / 1 / 0** |
| 2. Tokens e cor (17–27) | 7 / 3 / 0 / 1 / 0 | **9 / 1 / 0 / 1 / 0** |
| 3. Tipografia, espaço, forma e movimento (28–36) | 2 / 3 / 2 / 2 / 0 | **5 / 2 / 0 / 2 / 0** |
| 4. Componentes e API (37–50) | 4 / 6 / 0 / 4 / 0 | **12 / 0 / 0 / 2 / 0** |
| 5. Conteúdo e idioma (51–54) | 1 / 2 / 1 / 0 / 0 | **4 / 0 / 0 / 0 / 0** |
| 6. Responsividade (55–58) | 1 / 2 / 1 / 0 / 0 | **3 / 1 / 0 / 0 / 0** |
| 7. Artefatos para IA (59–63) | 1 / 2 / 1 / 0 / 1 | **3 / 2 / 0 / 0 / 0** |
| 8. Distribuição e consumo (64–70) | 1 / 3 / 1 / 2 / 0 | **4 / 1 / 0 / 2 / 0** |
| 9. Governança (71–78) | 0 / 5 / 2 / 1 / 0 | **2 / 5 / 1 / 0 / 0** |
| **Total** | **18 / 37 / 10 / 12 / 1** | **54 / 15 / 1 / 8 / 0** |

O único ❌ que resta é o REQ-74 (revisão por outra pessoa).

**Ressalva do integrador.** O placar é só da Frente 3 e não absorve os achados das outras frentes. Três pontos tendem a rebaixá-lo:

- REQ-56 (reflow) mede rolagem em 320 px com `isMobile`, o que escondia 5 px de rolagem no painel (TST-29).
- A dimensão 4 aparece com 12 ✅ e 0 ⚠️, mas o Toggle (TST-03), o Progress (TST-14) e o DataTable (TST-11) mostram contratos furados.
- A dimensão 7 não conta o llms.txt com links 404 (TST-18) nem o `manifest.json` contraditório (TST-19).

### 3.2 Os 69 achados de 14/10

| Situação | Total | Dos 18 Bloqueante/Alto |
|---|---|---|
| Resolvidos | 57 | 14 |
| Parciais | 11 | 3 (AUD-10, 12, 16) |
| Persistem | 1 (AUD-18) | 1 |

### 3.3 Métricas

| Métrica | 14/10 (depois) | 16/10 |
|---|---|---|
| axe serious+critical, estado inicial | 1 (consulta) | **0** |
| axe em fluxo | 1 critical + 2 serious | **0** (EXC-01 pela config do README) |
| Moderate, estado inicial | painel e institucional | **0** |
| LOC das 5 telas | 1.848 | **1.197** |
| JS gzip por tela | 146–150 kB, fixo | 110–156 kB, conforme a tela |
| Poppins carregada | 1 de 5 telas | **5 de 5**, sem Google Fonts |
| Strings em inglês | várias | **0** |
| Testes do kit | 238 | **457** (11 `it.fails` documentam bugs) |
| Cobertura de linhas, `src/components` | 83,5% | **92,5%** |
| Componentes com teste dedicado | 26/55 | 55/55 (contagem por import; ver TST-37) |
| Regressão visual | inexistente | 323 capturas, 55/55 componentes, 2 viewports |

---

## 4. Achados consolidados

Legenda de esforço: P = horas a 1 dia; M = dias; G = semanas. "npm" quer dizer que já está no pacote publicado; "main", que está só no repositório ou no site.

### 4.1 Bloqueante (1)

#### TST-01: ErrorSummary rouba o foco durante a digitação e corrompe dado
- **Componente:** `ErrorSummary` (npm e main) + receita RHF do SEM-817.
- **Origem:** NOVO-01 (F3) e achados novos do verificador.
- **Evidência:** `error-summary.tsx:42-46` tem um `useEffect` com `[autoFocus, errors.length, focusKey]`. Depois do 1º envio, o RHF revalida a cada tecla. Toda vez que a contagem de erros muda, o foco salta para o resumo. Resultados:
  - "Maria Souza" grava "Maria S";
  - a senha "semec123" grava "s";
  - o celular "69999998888" grava "(69) 9999-9888", número fixo válido que passa no zod.
  Reproduzido com 0, 50 e 120 ms entre teclas. O controle sem `ErrorSummary` grava os 11 dígitos. O axe não detecta. O `dist/react/components/error-summary.js` é idêntico no npm 4.0.1 e no main.
- **Impacto:** viola o WCAG 3.2.2 (nível A). Qualquer validação ao vivo (RHF, Formik) com o 4.0.1 já está exposta. Segurar o SEM-817 não protege ninguém.
- **Recomendação:** refocar só quando o `focusKey` mudar, ou só na transição de 0 para N erros. Teste de comportamento: digitar depois de um envio inválido. Publicar como **4.0.2**.
- **Esforço:** P.

### 4.2 Alto (5)

#### TST-02: Marcadores de conflito de merge no exemplo canônico da SKILL
- **Componente:** SKILL `semec-ds` (fonte, site, tarball do main, `.claude/` e `.opencode/`).
- **Origem:** NOVO-02 (F3) e AIA-01 (F4).
- **Evidência:** `packages/react/skills/semec-ds/SKILL.md:430/439/454` e `apps/docs/public/skills/semec-ds/SKILL.md:491/500/515`. O `curl` no site publicado retorna 1 `<<<<<<<`. O lado HEAD tem `errors.length` sobre um objeto e um `handleSubmit` sem callback. Compilado, dá TS1185 ×3 + TS17008. O merge `c8c4de9` passou em build, gate, lint, test e typecheck. O npm 4.0.1 está limpo.
- **Impacto:** um agente copia código inválido do exemplo mais importante. A próxima publicação leva o erro para o npm.
- **Recomendação:** resolver para o lado SEM-817 (já verificado que compila) e regenerar. Fazer o `build-artifacts.mjs` ou o gate falharem com `^(<<<<<<<|=======|>>>>>>>)`.
- **Esforço:** P.

#### TST-03: Toggle pressionado indistinguível do solto (1,01:1)
- **Componente:** `Toggle` (npm).
- **Origem:** VIS-01 (F1).
- **Evidência:** `toggle.tsx:10` usa `data-[state=on]:bg-accent`, que resolve para `--surface-alt` = `pv-gray-100` (`tokens.css:146/352`), com o mesmo texto do estado solto. Medido: rgb(245,245,245) sobre rgb(244,246,249), cerca de 1,01:1, e 1,09:1 sobre card branco. O hover (`hover:bg-muted`) também é imperceptível. Os prints `toggle--padrao` e `toggle--pressionado` são praticamente iguais. O `aria-pressed` já é emitido pelo Radix.
- **Impacto:** viola o WCAG 1.4.11. Quem enxerga não sabe se o filtro está ligado.
- **Recomendação:** dar ao estado on fundo e/ou borda com pelo menos 3:1 contra a superfície (ex.: `bg-tint` + borda primary, ou primary/primary-foreground). Atualizar a baseline visual.
- **Esforço:** P.

#### TST-04: SKILL indica uma posição de Header que fica sob a Sidebar, com foco invisível
- **Componente:** `Sidebar` + `Header` (SKILL, "Padrões de tela").
- **Origem:** AIA-02 (F4).
- **Evidência:** a SKILL (template:246) diz "o SkipLink e o Header ficam antes do SidebarProvider ou no topo do SidebarInset". A Sidebar desktop é `fixed inset-y-0 z-10` (`sidebar.tsx:451`). Seguindo a 1ª opção ao pé da letra, o `elementFromPoint` no header devolve a sidebar, e a 2ª parada de Tab (link do HeaderBrand) fica coberta. O print mostra "enciamento" cortado. A alternativa testada põe o SkipLink como 5ª parada de Tab.
- **Impacto:** viola o WCAG 2.4.7 em toda tela de painel feita pela receita. O axe não pega.
- **Recomendação:** documentar uma composição só: SkipLink antes do Provider e Header dentro do `SidebarInset`. Testar essa combinação. Ou dar offset ao Header.
- **Esforço:** P.

#### TST-05: ScrollArea só com texto gera axe serious `scrollable-region-focusable`
- **Componente:** `ScrollArea` (npm). **Parcial.**
- **Origem:** TST-F2-09 (F2).
- **Evidência:** `scroll-area.tsx:17` renderiza a Viewport sem `tabIndex`. No Chromium, com 2096 px de conteúdo numa área de 100 px, o axe dá serious em `.h-full`. O exemplo do manifest (linha 1183) é exatamente esse caso. Ressalva: o Chromium recente foca scrollers por Tab, então a barreira real de 2.1.1 fica em navegadores como WebKit/Safari, que não foram medidos.
- **Impacto:** reprova formalmente a régua (mesmo critério do AUD-19). O gate não pega o caso (TST-36).
- **Recomendação:** `tabIndex={0}` e anel de foco na Viewport quando não houver conteúdo focável, ou uma prop para isso. Levar o caso ao gate em navegador.
- **Esforço:** P.

#### TST-06: Revisão por outra pessoa continua não obrigatória (AUD-18 persiste)
- **Componente:** governança (proteção do `main`).
- **Origem:** AUD-18 (F3).
- **Evidência:** `required_approving_review_count` 0 e `require_code_owner_reviews` false. Os 12 PRs mergeados de #36 a #47 não tiveram nenhuma aprovação. O #43 (SEM-817) teve só COMMENTED e foi o PR que trouxe TST-01 e TST-02.
- **Recomendação:** exigir 1 aprovação de code owner diferente do autor.
- **Esforço:** P (configuração). Depende do usuário.

### 4.3 Médio (14)

| ID | Componente | Achado e evidência | Recomendação | Esforço |
|---|---|---|---|---|
| TST-07 | Pagination | As setas usam `h-11 w-11` sem `shrink-0` (`pagination.tsx:84/118`). Em 390 px com page 12/40, as setas medem 23×44 e as reticências 22×44. Em 320 px, **até a fixture padrão** encolhe as setas para 18×44. Origem: VIS-02 e achado novo do verificador. | `shrink-0` nas setas; reduzir as páginas de borda abaixo de `sm`. | P |
| TST-08 | NavigationMenu | `NavigationMenuLink = NavigationMenuPrimitive.Link`, sem classe (`navigation-menu.tsx:85`). O único exemplo (`manifest.js:1382`, `menu-de-navegacao.md:36-52`) usa o link cru. Os links medem 23 px de altura em 390 px, o painel fica sem padding e o link encosta no gatilho. A SKILL não cita `navigationMenuTriggerStyle`. Origem: VIS-04 e NOVO-06. | Estilizar o Link por padrão (`min-h-11`, `px-4`, foco) ou corrigir o exemplo com `navigationMenuTriggerStyle()` e um wrapper com padding. | P |
| TST-09 | DropdownMenu | Os itens, inclusive Checkbox e Radio, usam `px-2 py-1.5` (`dropdown-menu.tsx:105/121/145`), o que dá 33 px de altura. O `SelectItem` já tem 44 px, então a inconsistência fica evidente. Origem: VIS-05. | `min-h-11` nos itens. | P |
| TST-10 | DataTable, Breadcrumb, HeaderBrand, Link | Alvos abaixo de 44 px em 390 px: botão de ordenação com 21 px de altura (`data-table.tsx:136-145`); "Início" do Breadcrumb com 37×21 (`breadcrumb.tsx:31-33`); HeaderBrand com 36–40 px de altura; `Link` tel/mailto sozinho num `<p>` com 21 px (institucional). Resíduo do AUD-10. Origem: VIS-06, AIA-04, AUD-10 parcial e achado novo do verificador. | `min-h-11` ou um `::after` estendido, como no Button sm. | P |
| TST-11 | DataTable | Um botão numa célula de linha clicável também dispara `onRowClick`, no clique e no Enter/Espaço. O `onClick` fica na `<tr>` (`data-table.tsx:172`), e a guarda `target !== currentTarget` só vale para o keydown. O comentário do próprio código promete não sequestrar botões. Origem: TST-F2-04 (rebaixado de Alto). | Ignorar no `onClick` da linha os eventos vindos de `button, a, input, …`. | P |
| TST-12 | HeaderBrand | O nome acessível sai "Prefeitura de Porto Velho SEMECMatrícula— ir para o início", sem espaço entre os nomes nem antes do travessão (`header.tsx:100`). Medido via CDP no Chromium. Afeta o link de marca de toda página. Origem: TST-F2-05. | `{' '}` em volta do separador ou `sr-only " — "`. | P |
| TST-13 | FileUpload | `formatBytes` usa `toFixed(1)` (`file-upload.tsx:82-83`) e produz "5.0 MB" e "1.5 MB" na mensagem de erro. O JSDoc também usa "5.0 MB". Viola o ADR-016. Origem: TST-F2-08. | `Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })`; corrigir o JSDoc. | P |
| TST-14 | Progress | `translateX(-${100 - value}%)` ignora `max` (`progress.tsx:33`). Com value 3 e max 4, a barra mostra 3% enquanto o leitor de tela anuncia 75%. Origem: TST-F2-06. | Usar `(value / max) * 100`. | P |
| TST-15 | Versão (site, manifest, SKILL) | O "4.0.1" do main e do site não é o npm 4.0.1. `diff -rq` aponta 15 arquivos diferentes. `errorRole` aparece 2 vezes no main e no `manifest.json` do site, e 0 no npm. Recorrência do AUD-12. Origem: NOVO-03. | Marcar no site o que é "não publicado" ou publicar o site só no release. | M |
| TST-16 | Heading | `level={1}` mapeia para `text-2xl` (`heading.tsx:19`), o que dá 24 px nas 5 telas. A SKILL (152/257) e o `tokens.css:221` prometem 32 px (`text-3xl`). É resíduo do AUD-28, que a Frente 3 contou duas vezes. Origem: NOVO-04. | Alinhar o mapa à escala ou corrigir a SKILL. Mudança visual: registrar no changeset. | P |
| TST-17 | Receita RHF + ErrorSummary | Com `useForm` padrão, o RHF foca o 1º input inválido e vence o resumo. O resumo nunca recebe foco, apesar de a SKILL:359 prometer "foco automático". Os itens seguem `Object.entries(errors)` (SKILL:406, `manifest.js:433`), fora da ordem da tela: no acesso, "senha" vem antes de "CPF". Origem: AIA-03 e NOVO-05. | No exemplo, `shouldFocusError: false` e ordenar por uma lista fixa de ids. Fazer junto com TST-01. | P |
| TST-18 | llms.txt | Os links são absolutos à raiz (`/componentes/botoes`, `/components/botoes.md`) e dão 404 no site com o `basePath` `/SEMEC_design_system`. A origem é `build-artifacts.mjs:265-267`. Origem: AIA-05. | Gerar os links com o `basePath` ou relativos. | P |
| TST-19 | manifest.json (`install`) | `install.tokens` manda importar `tokens.css` em JS, e `install.preset` é na verdade um `@source` (`build-artifacts.mjs:272-273`). Falta o `fonts.css`. A SKILL:34 diz "não via import em JS", e o `tokens.css` tem `@theme inline`/`@utility`, que exigem processamento junto com o Tailwind. Origem: AIA-06. | `install.css` com as 4 linhas do CSS global; `preset` = `@config "@semec/ds/react/pv-preset"`. | P |
| TST-20 | Exemplo canônico, `maskCurrency` | O exemplo importa `react-hook-form` e `@hookform/resolvers`, que não estão nas instruções de instalação nem em `install.peers`. A assinatura de `maskCurrency` não aparece em lugar nenhum. No kit, `maskCurrency('')` e `maskCurrency('abc')` devolvem "R$ 0,00" (`masks.ts:30-34`), então o campo nunca volta a ficar vazio e passa em `z.string().min(1)`. Origem: AIA-07 e achado novo do verificador. | `maskCurrency('')` deve devolver `''`. Documentar a assinatura e um campo R$. Acrescentar `npm i react-hook-form @hookform/resolvers zod`. | P |

### 4.4 Baixo, kit e documentação (17)

| ID | Componente | Achado e evidência | Recomendação | Esforço |
|---|---|---|---|---|
| TST-21 | Button | `whitespace-nowrap` fixo (`button.tsx:9`). Um rótulo de 59 caracteres gera 103 px de rolagem em 390 px. É caso de borda, e o `className` permite sobrescrever. Origem: VIS-03 (rebaixado). | Documentar o limite de rótulo ou permitir quebra. | P |
| TST-22 | Slider | O `::after` do polegar mede 40×40, porque o `-inset-3` parte da caixa de 16 px (`slider.tsx:81`). Origem: VIS-07. | `after:-inset-3.5`. | P |
| TST-23 | DataTable | O rodapé (`data-table.tsx:200`) não tem wrap. Com rótulos customizados longos, "Página 1 de 2" e "Página anterior" quebram dentro do botão em 390 px. Com o rótulo padrão, fica ok. Origem: VIS-08 (rebaixado). | `flex-wrap` ou `flex-col` abaixo de `sm`. | P |
| TST-24 | Toast | O `onOpenChange` passado a `toast()` é tipado mas descartado, porque o handler interno vem depois do spread (`toast.tsx:219-225`). Origem: TST-F2-01. | Compor os dois handlers. | P |
| TST-25 | Pagination | `siblingCount={0}` vira 1 em silêncio (`pagination.tsx:49`). Origem: TST-F2-03. | Aceitar 0 ou documentar o mínimo. | P |
| TST-26 | Avatar (doc) | Com a foto quebrada, o exemplo do manifest (1047-1051) anuncia só "JS". É problema do exemplo, não do código. Origem: TST-F2-07 (parcial). | Exemplo com `aria-label` no `AvatarFallback`. | P |
| TST-27 | DataTable | O `aria-label="Ordenar por Nome"` no botão vira o nome do `columnheader` no Chromium. É verbosidade sem violação WCAG, e `labels.sortBy` é API pública. Origem: TST-F2-02 (rebaixado). | Avaliar levar a instrução para `aria-describedby`, sem matar o `sortBy`. Ver também TST-41. | P |
| TST-28 | DataTable | A linha clicável tem `tabindex=0` sem papel nem nome: na árvore de acessibilidade aparece `{role:'row', name:''}`, e o Enter dispara a ação. Origem: NOVO-07. | Reforçar na doc a coluna de ações ou expor `rowLabel`. | P |
| TST-29 | Tabs | Em 320 px sem `isMobile`, o painel tem `scrollWidth` 325, ou seja, 5 px de rolagem. Quem vaza é o `TabsList` (`inline-flex`, sem wrap nem `overflow-x`). O layout do consumidor contribui. Origem: achado novo do verificador (F3). | `overflow-x-auto` ou `flex-wrap` no `TabsList`. | P |
| TST-30 | Exemplos `.md` | Erros em TS strict: TS7006 em `manifest.js:438` e TS2339 com `useRef(null)` em 854 e 1274. Origem: AIA-08. | Tipar `data` e usar `useRef<HTMLButtonElement>(null)`. | P |
| TST-31 | Button (doc) | O texto diz "Seis variantes", mas há 7 (`manifest.js:50`, `button.tsx:12-24`). Origem: AIA-09. | Derivar o número da lista. | P |
| TST-32 | AGENTS.md | `AGENTS.md:75` aponta como "full agent skill" o template, que ainda tem `{{ds:…}}` e `<!-- ds:component-list -->`. Origem: AIA-10. | Apontar para `apps/docs/public/skills` ou `dist/skills`. | P |
| TST-33 | SKILL lite | A linha 243 manda usar `--pv-red-50` e `--pv-red-700` (primitivos), contradizendo a linha 56. Não cita o `@semec/ds/lite/pv-preset`. Origem: AIA-11. | `--feedback-danger-surface` e `--feedback-danger`; documentar o preset. | P |
| TST-34 | Kit (resíduos de AUD-27/41/46) | Entre 16 e 24 classes fora da escala de espaço no kit (`py-1.5`, `space-y-1.5`, `px-5`). `digits` e `./react/server` continuam exportados. `apps/docs/eslint.config.mjs:28` ignora `packages/react/**`, então o kit roda sem jsx-a11y. O InputOTP de 42×42 fica numa moldura de 44 (discutível). | Alinhar à escala; remover os exports na próxima major; lint próprio no kit. | M |
| TST-35 | `docs/objetivo.md` | A linha 15 diz "publicada 3.2.0; 4.0.0 em preparação", mas o npm latest é 4.0.1. O documento se declara canônico ("vale o que está aqui"). A linha 17 diz "não há regressão visual", o que muda se o TST-B1 for mergeado. Origem: orquestrador e AUD-48 parcial. | Atualizar para 4.0.1 e gerar a versão a partir do `package.json`. | P |
| TST-36 | Gate | `check-smoke-a11y.mjs:348` testa a ScrollArea em jsdom com 2 linhas e sem overflow, então nunca pega o TST-05. Origem: achado novo do verificador (F2). | Caso com overflow no gate em Chromium. | P |
| TST-37 | Testes (Sidebar) | Nenhum teste verifica `aria-current=page` no `SidebarMenuButton`/`SubButton` (`sidebar.tsx:746/820`). Com a mutação, a suíte inteira continua verde. Isso mostra que "55/55 com teste" por import não garante as promessas do manifest. Origem: achado novo do verificador (F2). | Teste de `aria-current`. Medir cobertura por promessa do manifest, não por import. | P |

### 4.5 Qualidade dos entregáveis desta bateria (2 Médios, 5 Baixos)

Precisam ser resolvidos antes de mergear as branches de teste.

| ID | Entregável | Achado | Recomendação | Severidade / Esforço |
|---|---|---|---|---|
| TST-B1 | `test/regressao-visual` | As baselines são do Windows, e o `snapshotPathTemplate` não tem `{platform}`. O job Linux proposto falharia 100% na 1ª execução, e regravar as baselines no contêiner quebra quem roda no Windows. | `{platform}` no template, ou rodar só em contêiner (Docker com a imagem do Playwright 1.56.1). | Médio / P |
| TST-B2 | `test/regressao-visual` | Os testes de foco e hover fazem `test.skip` quando nada recebe foco (`visual.spec.mjs:59-64`, `:73-84`). Uma perda de focabilidade vira skip silencioso, e hoje 52 testes já caem nesse caminho. | Lista explícita de componentes não focáveis; os demais falham. | Médio / P |
| TST-B3 | `test/regressao-visual` | `document.fonts.check` retorna true até para uma família inexistente, então a asserção da Poppins é vazia. `mobile-390/sidebar--padrao.png` é uma página em branco (sem `SidebarTrigger`). A ScrollArea não transborda e o Toast padrão não desenha. `test:visual` não roda `build:ds` e pode passar contra um `dist/` velho. | Checar `FontFace` carregada; fixtures com gatilho e overflow; `pretest:visual` com `build:ds`. | Baixo / P |
| TST-B4 | `test/comportamento` | 3 testes que passam consultam o botão pelo nome "Ordenar por Nome" e travam o comportamento que o TST-27 discute. O `cobertura.mjs` usa `HEAD` como "antes" e não reproduz mais o 26/55. | Consultar por papel e `aria-sort`; usar `c8c4de9` como base. | Baixo / P |
| TST-B5 | Labs F3/F4 | Problemas de reprodutibilidade: o `overflow()` de `lib.mjs:116` esconde rolagem com `isMobile` (falso negativo do TST-29); `teste-componentes.mjs:17` mede a tabela do Calendar; o `fluxo-requerimento` não é determinístico; o `axe.cjs` engole erro de ação e reporta `viol=0`; o `lite.cjs` aponta para a porta errada; o app do agente não passa mais em `tsc`, porque `exemplos-md/` entrou no `include`. | Corrigir antes de reaproveitar os roteiros. | Baixo / P |
| TST-B6 | `test/regressao-visual` | A harness tem 4,4 MB porque importa o axe do smoke. | Separar as fixtures do smoke do import do axe. | Baixo / P |
| TST-B7 | Métricas dos relatórios | Pequenas divergências: 6 alvos pequenos no institucional (não 3); contraste máximo de 15,77:1 na lite (não 14,57); 12 de 12 PRs sem aprovação (não 11 de 12). Nenhuma muda as conclusões. | Já corrigido neste relatório. | Baixo / — |

---

## 5. Entregáveis

### 5.1 Branches (commits locais, sem push)

| Branch | Worktree | Commit | Conteúdo |
|---|---|---|---|
| `test/regressao-visual` | `C:/dev/semec-wt/regressao-visual` | `4a51dbb` | `@playwright/test` 1.56.1; 323 baselines (1366 e 390, só tema claro, tolerância 0 px); `npm run test:visual` e `test:visual:update`; README com proposta de job de CI. 3 rodadas estáveis, de 51 a 55 s. Pegou a troca de `--action-primary` (83 falhas). |
| `test/comportamento` | `C:/dev/semec-wt/comportamento` | `d95b042` | 9 arquivos novos e 219 testes, de 238 para 457. 11 `it.fails(TST-F2-NN)` documentam os bugs: viram `it` quando a correção entrar. Estável inclusive com `--sequence.shuffle`. Cobertura de linhas de 83,5% para 92,5% e de ramos de 70,4% para 82,6%. |

### 5.2 Labs e evidências

Ficam no scratchpad desta sessão (`C:/Users/ADMINI~1/AppData/Local/Temp/claude/C--dev-SEMEC-design-system/b369909f-e5d9-44d6-aadd-4bc6fecc2e0c/scratchpad/`).

| Conteúdo | Caminho |
|---|---|
| Prints dos achados visuais e prova de regressão | `C:/Users/ADMINI~1/AppData/Local/Temp/claude/C--dev-SEMEC-design-system/b369909f-e5d9-44d6-aadd-4bc6fecc2e0c/scratchpad/visual/` |
| Probes de medição da suíte visual | `C:/Users/ADMINI~1/AppData/Local/Temp/claude/C--dev-SEMEC-design-system/b369909f-e5d9-44d6-aadd-4bc6fecc2e0c/scratchpad/visual-lab/` |
| Harness Chromium/CDP e coverage antes e depois | `C:/Users/ADMINI~1/AppData/Local/Temp/claude/C--dev-SEMEC-design-system/b369909f-e5d9-44d6-aadd-4bc6fecc2e0c/scratchpad/frente2/` |
| Re-auditoria: RELATORIO, lab Vite com 5 telas, roteiros, saídas JSON e prints (`foco-roubado-nome.png`) | `C:/Users/ADMINI~1/AppData/Local/Temp/claude/C--dev-SEMEC-design-system/b369909f-e5d9-44d6-aadd-4bc6fecc2e0c/scratchpad/adequacao/` |
| Agente de IA: app Next, páginas lite, scripts axe/comportamento e 33 prints | `C:/Users/ADMINI~1/AppData/Local/Temp/claude/C--dev-SEMEC-design-system/b369909f-e5d9-44d6-aadd-4bc6fecc2e0c/scratchpad/agente-ia/` |
| Verificações adversariais | `C:/Users/ADMINI~1/AppData/Local/Temp/claude/C--dev-SEMEC-design-system/b369909f-e5d9-44d6-aadd-4bc6fecc2e0c/scratchpad/verificacao-*/` |

O scratchpad é temporário. Se essas evidências precisarem ficar, copie-as para um lugar fora dele.

---

## 6. Proposta de ondas de correção

### Onda 0, agora: patch 4.0.2 (1 a 3 dias, sem quebra)

| ID | Correção | Esforço |
|---|---|---|
| TST-01 | Foco do `ErrorSummary` só na troca de `focusKey` ou de 0 para N erros; teste de digitação após envio inválido | P |
| TST-02 | Resolver o conflito na SKILL, regenerar, republicar o site; checagem de marcadores no gate | P |
| TST-17 | Receita com `shouldFocusError: false` e ordem fixa dos campos | P |
| TST-20 | `maskCurrency('')` → `''`; deps e assinatura na doc | P |
| TST-12, TST-13, TST-14, TST-24 | Espaço no HeaderBrand, decimal PT-BR, `max` do Progress, `onOpenChange` do Toast | P |
| TST-06 | Exigir 1 aprovação de code owner (configuração do repositório) | P |

Os `it.fails` correspondentes da branch `test/comportamento` viram `it` no mesmo PR.

### Onda 1, minor 4.1 (1 a 2 semanas, aditiva; inclui o SEM-817)

- **Visual e a11y:** TST-03 (Toggle), TST-05 (ScrollArea), TST-07 (Pagination), TST-08 (NavigationMenuLink), TST-09 (DropdownMenu), TST-10 (alvos), TST-11 (`onRowClick`), TST-16 (Heading, mudança visual), TST-21, TST-22, TST-23, TST-25, TST-28, TST-29.
- **Artefatos e doc:** TST-04, TST-15, TST-18, TST-19, TST-26, TST-27, TST-30 a TST-33, TST-35.
- Atualizar as baselines visuais afetadas no mesmo PR.

### Onda 2, infraestrutura de teste (em paralelo com a onda 1)

- Corrigir TST-B1 a TST-B6 e mergear as duas branches de teste.
- Ligar `test:visual` na CI em contêiner Linux.
- TST-36 e TST-37: ScrollArea com overflow no gate; teste de `aria-current`.
- Lint jsx-a11y no kit (parte de TST-34).

### Onda 3, próxima major

- Remover `digits` e `./react/server` dos exports.
- Alinhar o kit à escala de espaço (restante de TST-34).

---

## 7. Pendências que dependem do usuário

1. **Publicar a 4.0.2** com o TST-01 antes de qualquer outra coisa. O bug já está no npm.
2. **Ligar a revisão obrigatória** (TST-06). Precisa de acesso de admin ao repositório.
3. **Republicar o site** depois do TST-02. Hoje o site serve a SKILL com conflito.
4. **Heading h1: 24 ou 32 px?** (TST-16). Decidir se o kit ou a SKILL muda. Qualquer escolha muda o visual.
5. **Visual do Toggle ligado** (TST-03): escolher entre fundo tint + borda ou primary cheio.
6. **Mergear as branches** `test/regressao-visual` e `test/comportamento`, e decidir onde as baselines vivem (Windows local ou contêiner Linux, TST-B1).
7. **`labels.sortBy` do DataTable** (TST-27): manter como nome ou mover para descrição.
8. **Testar no Safari/WebKit** a ScrollArea (TST-05) e o fluxo do formulário. Nenhum agente tinha WebKit real.
9. **Testar num PC real da prefeitura**, como já estava pendente para a Vila, se o desempenho do kit importar.

---

## 8. Limitações

- Só tema claro, só Chromium (mais jsdom). WebKit e Firefox não foram medidos.
- Nenhum teste com leitor de tela real: os nomes acessíveis vêm da árvore do CDP.
- O placar de REQ é da Frente 3 e não foi recalculado com os achados das outras frentes (seção 3.1).
- As baselines visuais foram geradas no Windows, com a fonte do sistema para fallback.
- Nada foi alterado em `packages/react/src`. As correções sugeridas foram validadas só em cópias no scratchpad (10 dos 11 `it.fails` passam com a correção mínima).

---

## Apêndice A: refutados e afirmações corrigidas

| Origem | Afirmação | Por que caiu |
|---|---|---|
| NOVO-08 (F3) | "Artefatos de IA do main não regenerados após o merge" | O diff é só no carimbo `Gerado …`/`generatedAt`, que a CI ignora de propósito (`ci.yml:135-145`). A CI também roda em push no `main`. Não há deriva de conteúdo. |
| VIS-01, recomendação | "Acrescentar `aria-pressed`" | O Radix já emite `aria-pressed`. |
| VIS-05, recomendação | "Mesma checagem no `SelectItem`" | O `SelectItem` já mede 44 px. |
| TST-F2-09, título | "Viewport não é focável" | No Chromium o scroller recebe foco por Tab. A violação do axe continua. |
| NOVO-01, narrativa | "Rouba o foco a cada tecla" e "vem do SEM-817 não publicado" | O foco salta a cada mudança na quantidade de erros, e o componente com o bug já está no npm 4.0.1. |
| Re-auditoria | "0 rolagem horizontal em 320 px" | O helper mascarou 5 px no painel (TST-29). |

## Apêndice B: mapa de origem

| TST | Origem |
|---|---|
| 01 | NOVO-01 |
| 02 | NOVO-02, AIA-01 |
| 03 | VIS-01 |
| 04 | AIA-02 |
| 05 | TST-F2-09 |
| 06 | AUD-18 |
| 07 | VIS-02 + novo do verificador |
| 08 | VIS-04, NOVO-06 |
| 09 | VIS-05 |
| 10 | VIS-06, AIA-04, AUD-10 + novo do verificador |
| 11 | TST-F2-04 |
| 12 | TST-F2-05 |
| 13 | TST-F2-08 |
| 14 | TST-F2-06 |
| 15 | NOVO-03 |
| 16 | NOVO-04 / AUD-28 |
| 17 | AIA-03, NOVO-05 |
| 18 | AIA-05 |
| 19 | AIA-06 |
| 20 | AIA-07 + novo do verificador |
| 21 | VIS-03 |
| 22 | VIS-07 |
| 23 | VIS-08 |
| 24 | TST-F2-01 |
| 25 | TST-F2-03 |
| 26 | TST-F2-07 |
| 27 | TST-F2-02 |
| 28 | NOVO-07 |
| 29 | novo do verificador (F3) |
| 30 | AIA-08 |
| 31 | AIA-09 |
| 32 | AIA-10 |
| 33 | AIA-11 |
| 34 | AUD-27/41/46 parciais |
| 35 | orquestrador, AUD-48 parcial |
| 36, 37 | novos do verificador (F2) |
| B1–B7 | verificadores das 4 frentes |
