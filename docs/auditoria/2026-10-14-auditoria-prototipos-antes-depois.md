# Auditoria do Design System SEMEC: protótipos antes × depois

| Campo | Valor |
|---|---|
| Data | 14/10/2026 |
| Versão auditada | `@semec/ds@3.0.0` do npm (publicada em 01/10/2026). É idêntica byte a byte ao `packages/react/src` do commit `fb7d782`. |
| Repositório no dia | Branch `feat/quem-somos-batalhas`. O HEAD tem 5 componentes alterados em relação ao npm, e o `origin/main` tem 14 arquivos a mais (`ErrorState`, `Button success` etc.). Nada disso foi publicado. Os achados indicam quando valem só para o npm ou só para o repo. |
| Método | 5 telas (requerimento, consulta, painel, institucional, acesso). Cada uma foi construída duas vezes: **antes**, com React + Tailwind v4 à mão, e **depois**, só com `@semec/ds` lido como consumidor (README, SKILL, llms.txt, `.md`, `.d.ts`). Fases: 0 matriz de 78 requisitos; 1 construção; 2 medição (axe-core 4.14, Chrome headless, 1366×900 e 390×844, LOC, bundle Vite isolado); 3 auditoria em 5 dimensões; 4 verificação adversarial; e esta consolidação. |
| Agentes | 15 agentes mais o orquestrador: 1 de matriz, 5 construtores, 5 auditores, 3 verificadores e 1 integrador. |
| Régua (decisões do usuário) | axe: **zero serious/critical** em WCAG 2.1 A/AA. Moderate, minor e best-practice entram como recomendação. Divergência entre código e especificação vira **contradição** e não reprova. Requisito de estado-alvo é só **observação**. Só tema claro. Conteúdo em PT-BR, `dd/mm/aaaa` e `R$ 1.234,56`. Classes brutas do Tailwind no "depois" contam como desvio de token. Alvo de toque de 44 px no mobile. |
| Severidade | A severidade final é a do verificador da fase 4. Achado não reverificado mantém a original e leva a marca "(não reverificado)". |

---

## 1. Veredito geral

O `@semec/ds` 3.0.0 **cumpre a promessa visual**. Cinco construtores independentes produziram telas que parecem um único produto: 0 hex, 0 `rgba()`, 0 `style` e 0 cor genérica. Os pares de texto L1 passam AA, e a mecânica do Radix (foco preso, Esc, setas) superou o "antes". Mas o kit **ainda não serve como régua de acessibilidade nem permite adoção sem fricção**. Pela régua do usuário, 2 das 5 telas reprovam por defeito do próprio kit: requerimento (toast com `button-name` critical, Combobox e Select serious) e consulta (contraste do Badge). A tela painel reprova também se a exceção do Radix (AUD-19) não for aceita. Componentes de formulário essenciais têm defeitos funcionais: InputOTP, FileUpload e Combobox. A documentação para humanos e para IA diverge do pacote (Toast, SidebarTrigger, tokens inexistentes, exemplos que geram violações), e o mesmo número de versão 3.0.0 cobre três conteúdos diferentes. A maior parte das correções é pequena (esforço P) e cabe num patch 3.0.1. Os problemas estruturais, como bundle sem poda, fronteira RSC, contrato de formulário, testes e revisão, pedem uma minor e uma major planejadas.

**Placar dos 78 requisitos (após verificação)**

| Dimensão | ✅ Atende | ⚠️ Parcial | ❌ Não atende | 🔭 Alvo | ❓ Não verificável | Total |
|---|---|---|---|---|---|---|
| 1. Acessibilidade (REQ-01–16) | 1 | 11 | 2 | 2 | 0 | 16 |
| 2. Tokens e cor (17–27) | 7 | 3 | 0 | 1 | 0 | 11 |
| 3. Tipografia, espaço, forma e movimento (28–36) | 2 | 3 | 2 | 2 | 0 | 9 |
| 4. Componentes e API (37–50) | 4 | 6 | 0 | 4 | 0 | 14 |
| 5. Conteúdo e idioma (51–54) | 1 | 2 | 1 | 0 | 0 | 4 |
| 6. Responsividade (55–58) | 1 | 2 | 1 | 0 | 0 | 4 |
| 7. Artefatos para IA (59–63) | 1 | 2 | 1 | 0 | 1 | 5 |
| 8. Distribuição e consumo (64–70) | 1 | 3 | 1 | 2 | 0 | 7 |
| 9. Governança (71–78) | 0 | 5 | 2 | 1 | 0 | 8 |
| **Total** | **18** | **37** | **10** | **12** | **1** | **78** |

Os ❌ são REQ-01 (0 serious/critical), REQ-05 (teclado), REQ-28 (Poppins), REQ-32 (escala de espaço), REQ-53 (texto fixo sobrescrevível), REQ-57 (alvo de 44 px), REQ-61 (contagem e versão derivadas), REQ-68 (SemVer com Changesets), REQ-71 (depreciação) e REQ-74 (revisão por outra pessoa).

**Achados consolidados:** 69, sendo **1 Bloqueante, 17 Altos, 33 Médios e 18 Baixos**. Eles vêm de 103 achados de origem: 30 A11Y, 23 API, 14 TOK, 19 DOC e 17 GOV.

---

## 2. Antes × Depois

### 2.1 Métricas

| Tela | axe serious+critical antes → depois (estado inicial) | axe em fluxo completo (depois) | moderate antes → depois | LOC antes → depois | JS gzip (kB) | CSS (kB) |
|---|---|---|---|---|---|---|
| requerimento | 0 → 0 | **1 critical + 2 serious** (Toast `button-name`; Combobox `label-content-name-mismatch`; Select `aria-hidden-focus`). Antes: 0 | 0 → 0 (fluxo: `heading-order`) | 435 → 350 (−20%) | 71 → 147 | 16 → 80 |
| consulta | 0 → **1** (Badge info, 4,42:1) | o mesmo Badge | 0 → 0 | 399 → 380 (−5%) | 72 → 148 | 15 → 90 |
| painel | **16** → 0 (15 de contraste, erro do dev "antes") | menu aberto: `aria-hidden-focus` (exceção AUD-19) | 5 (mobile) → 4 (`region` ×3, `heading-order`) | 411 → 461 (+12%) | 72 → 150 | 18 → 90 |
| institucional | 0 → 0 | 0 | 0 → 1 (`heading-order`, `AlertTitle` h5) | 347 → 318 (−8%) | 73 → 149 | 21 → 90 |
| acesso | 0 → 0 | 0 serious; InputOTP grava "1" ao digitar "123456" sem contorno | 0 → 2 (`heading-order`) | 339 → 380 (+12%) | 70 → 146 | 14 → 90 |
| **Total** | 16 → 1 | — | — | **1931 → 1889 (−2%)** | **+~76 kB constantes** | **+~70 kB constantes** |

| Código de estilo | Antes | Depois |
|---|---|---|
| hex | 4 | 0 |
| `style` inline | 1 | 0 |
| classes arbitrárias `[...]` | 8 | 6 |
| cores primárias distintas entre as 5 telas | 5 | 1 (`--action-primary`) |
| escalas de neutro | 2 (slate e gray) | 1 (L1) |
| sombras e raios fora do token | 13 sombras e 8 raios `xl/2xl` | 0 nas telas (o kit tem 10 sombras próprias, AUD-29) |
| pesos e menor fonte | 800/900 e 10 px | 400–700 e 12 px |
| Fonte renderizada | Segoe UI nas 5 | Segoe UI em 4; Poppins via Google Fonts em 1 (desvio da tela) |

### 2.2 Leitura

- **Acessibilidade.** O ganho é real onde o "antes" errou cor: no painel, 16 serious caíram para 0. Onde o "antes" foi correto, o "depois" piorou por causa do kit. Em fluxo completo, o "antes" ficou com 0 violações em todas as telas, exceto o painel. O "depois" introduziu violações que **o consumidor não consegue corrigir**: o Toast sem nome e o Badge vêm do componente. A medição do estado inicial esconde isso. Só os roteiros de fluxo mostraram.
- **Código.** −2% de LOC no total, com grande variação: −20% no requerimento e +12% no painel e no acesso. Imports, composição verbosa (Sidebar) e contornos de lacunas consomem a economia. O esforço percebido foi **igual ou maior** no "depois", até 2× no acesso. O tempo foi gasto em divergências de doc e bugs, não em escrever UI.
- **Bundle.** O kit acrescenta cerca de 76 kB gzip de JS e cerca de 70 kB de CSS **constantes**, independentemente de quantos componentes a página usa. A causa é o bundle único sem poda (AUD-20). Na verificação, com saída por módulo, `Button` sozinho custaria 24,7 kB min em vez de 292 kB.
- **Consistência visual.** É o maior ganho. As 5 telas "depois" compartilham ação, neutros, campos, cartões, raio e sombra. A variação que sobra (selo da marca, tamanho e cor do h1, largura de container) vem de tokens que faltam (AUD-15, AUD-28).

---

## 3. O que o DS acerta (verificado)

1. **Disciplina de cor total nas telas.** As 5 "depois" têm 0 hex, 0 `rgba()`, 0 `style`, 0 primitivo `pv-*` e 0 cor genérica. As "antes" somam 4 hex, 1 `style` e mais de 300 classes de cor genérica. Os utilitários semânticos bastaram para todas as necessidades. O kit não tem cor literal em `src/components` nem em `src/lib`; a única exceção é `bg-black/50` nos overlays.
2. **Os pares de texto do L1 passam AA.** São 40 pares, de 4,89 a 15,77:1. A borda de campo tem 3,49 a 3,77:1. O código corrige falhas que a própria especificação registrava (CTR-05 e CTR-06). *Ajuste da verificação:* isso vale para os **pares isolados**. Na aplicação real falham o foco em menu e Select (1,09:1, AUD-07), o foco do campo inválido (1,69:1, AUD-24), o anel sobre a cor de marca (1,00:1, AUD-60) e o link em relação ao texto (2,91:1, AUD-25).
3. **Anel de foco global forte.** `--focus-ring` com offset dá 8,66 a 9,38:1, e a regra global `:focus-visible` (`tokens.css:498-501`) cobre o que não tem estilo próprio. *Ajuste:* a frase "0 elementos sem indicador nas 5 telas" é exagerada. O `medir.mjs` contou como indicador o fundo de 1,09:1 dos menus.
4. **`prefers-reduced-motion` global e efetivo** (`tokens.css:505-514`). Os valores computados ficam em `1e-05s`. O ErrorSummary também respeita a preferência no JS.
5. **Comportamento interativo do Radix superou o "antes".** O foco fica preso e volta ao gatilho no Dialog (no "antes" ia para o `body`). Tooltip abre por foco, abas e menus respondem às setas. *Ressalva:* o "0 serious" do painel foi medido com os menus fechados (ver AUD-19).
6. **`IconButton` exige nome acessível pelo tipo** (`label` vira `aria-label` + `title`). O X de Dialog, Sheet e Drawer tem "Fechar" em sr-only.
7. **Semântica de navegação correta.** Breadcrumb tem `nav` rotulado, `ol` e `aria-current`. Pagination tem `aria-current` e anterior/próxima rotulados. `HeaderNavLink` tem `aria-current` e `min-h-11`. `TableHead` tem `scope="col"`.
8. **ErrorSummary bem resolvido.** Recebe foco automático e reforça a cada envio (`focusKey`); os links levam o foco ao campo, inclusive ao 1º rádio de um grupo.
9. **Zod realmente opcional, e Radix instalado sozinho.** `zod` aparece 0 vezes no `index.js`, os schemas ficam em `/react/validacao` e o peer é opcional. Os 20 `@radix-ui/*` estão em `dependencies`, e `npm ls` sai limpo. É a única quebra com guia de migração, o modelo a seguir.
10. **Escapatória `className` + `...props` + `ref` consistente** em quase todo o kit. A exceção é o `Combobox` (AUD-03).
11. **Strings embutidas quase todas em PT-BR.** As exceções vêm do Radix (Toast "Notification" e NavigationMenu "Main").
12. **Reflow** sem rolagem horizontal em 320 e 640 px nas 5 telas. A `Table` rola dentro do próprio contêiner. Input, Select, Combobox, DatePicker, Button `md`, IconButton e slot do OTP têm 44 px por padrão.
13. **Tipografia segura por padrão.** Nenhuma tela "depois" passou do peso 700 nem ficou abaixo de 12 px.
14. **Pipeline de artefatos de IA reprodutível na parte gerada.** A regeneração isolada deu 0 diferenças de conteúdo, e as variantes do manifest batem com os `cva`. *Ajuste:* dos 48 snippets, só **2** têm erro de API real (sidebar-trigger e tooltip). Os outros 2 que falham no `tsc` são artefato do fragmento.
15. **Tipos corretos com `moduleResolution: bundler`**, `npm run typecheck` e `npm run lint` verdes (0 problemas), e CI e entrega automatizadas. *Ressalva:* o Release não depende da CI (AUD-46).
16. **Nenhuma regra de negócio nos componentes, e variantes por intenção** (Button 6, Badge 7, Alert 4).
17. **Processo de ADR bem desenhado** (template, ciclo de status, substituições registradas) e **CSP documentada** com `SemecProvider nonce`.

*Não sobreviveu como acerto do pacote:* "o time responde a problemas". As correções existem no repositório, mas nada chegou ao npm (AUD-12).

---

## 4. O que o DS erra: achados consolidados

Legenda de esforço: P = horas a 1 dia; M = dias; G = semanas. "npm" = vale para o pacote publicado; "repo" = vale também para o HEAD.

### 4.1 Bloqueante (1)

#### AUD-01: Toast com botão de fechar sem nome (axe critical) e anúncios em inglês
- **Origem:** A11Y-02, API-02, A11Y-24 (parte do Toast).
- **Evidência:** `toast.tsx:72-87`: o `ToastClose` tem só `<X aria-hidden>`. O axe acusa `button-name` **critical** com qualquer toast aberto. `Toaster()` (`toast.tsx:235-254`) não aceita props, e os padrões do Radix (`react-toast/dist/index.mjs:47,99`) fazem a região ser anunciada como "Notifications (F8)" e cada aviso como "Notification …".
- **Impacto:** **todo** app que usa toast reprova a régua, e o consumidor não tem como corrigir pelo caminho recomendado. Também viola o ADR-016 (PT-BR). Telas afetadas: requerimento e painel.
- **Correção:** `<span className="sr-only">Fechar notificação</span>` no `ToastClose`. `Toaster({ label="Notificação", viewportLabel="Notificações ({hotkey})", closeLabel })`. Teste axe com toast aberto.
- **Esforço:** P.

### 4.2 Alta (17)

#### AUD-02: InputOTP não avança o foco, grava o dígito na posição errada e mostra anel de foco falso
- **Origem:** A11Y-01, API-01, DOC-12 (parte), CTR-A11Y-3. *Rebaixado de Bloqueante: o fluxo com Tab funciona.*
- **Evidência:** `input-otp.tsx:34` cria `slotsRef`, mas nenhum `InputOTPSlot` atribui o `ref` (`:159-171`). Digitar "123456" grava `"1"`. Com o array esparso (`:40-42`), "1" no slot 1 e "6" no slot 6 viram `"16"`. O `<input>` tem `outline-none`, e o anel depende do `activeSlot`, que continua visível depois do blur. Faltam `autocomplete="one-time-code"` e o rótulo do grupo. Vale para npm, repo e `origin/main`.
- **Impacto:** a verificação em 2 etapas fica inutilizável na prática para todos os usuários. A SKILL promete "foco entre dígitos". Tela afetada: acesso, que precisou de contorno.
- **Correção:** `ref={(el) => (slotsRef.current[index] = el)}`. Valor montado por array de tamanho fixo. `focus-within:ring` em vez de `activeSlot`. `autoComplete="one-time-code"`, `role="group"` + `aria-labelledby`.
- **Esforço:** P.

#### AUD-03: Combobox fora do padrão ARIA e com props fechadas
- **Origem:** A11Y-03, API-06.
- **Evidência:** `combobox.tsx:12-37`: `ComboboxProps` não estende atributos HTML nem repassa `...props` (sem `id`, `name`, `required`, `aria-invalid`, `aria-describedby`). O `ariaLabel="Selecionar"` substitui o texto visível e gera `label-content-name-mismatch` **serious** (2.5.3). O popover sem nome (`aria-dialog-name`) é best-practice e fica fora da régua. As opções são `<button role="option">` alcançadas por Tab, sem setas nem `aria-activedescendant`. O `<label for>` do FormField fica órfão.
- **Impacto:** reprova a régua no requerimento, não integra com FormField, ErrorSummary nem formulário nativo, e a navegação exige uma parada de Tab por opção.
- **Correção:** padrão APG "combobox com listbox" (ou `cmdk`). Estender `Omit<ButtonHTMLAttributes,"onChange"|"value">`. `name` via `input hidden`. `aria-labelledby` em vez de `aria-label`. `searchPlaceholder`.
- **Esforço:** M.

#### AUD-04: FileUpload com foco invisível e não controlado
- **Origem:** A11Y-04, API-07. *Rebaixado de Bloqueante.*
- **Evidência:** `file-upload.tsx:83`: o único elemento focável é um input `sr-only` de 1×1 px. As classes `focus-visible:` (`:71`) ficam numa `div` não focável, o que falha o 2.4.7. Estado interno sem `value` (`:24`), `multiple` fixo (`:82`), sem prop `id` (`:28`), `className` aplicado duas vezes (`:50`, `:74`), `accept` não validado no drop, hint e erro sem `aria-describedby`.
- **Impacto:** quem navega por teclado não vê onde está, e o link do ErrorSummary leva a esse foco invisível. O arquivo some ao voltar de etapa. Tela afetada: requerimento.
- **Correção:** `has-[:focus-visible]:ring-2 ring-ring` na zona. Props `value`, `multiple`, `id` e `inputProps`. Validar `accept` no drop. `className` só na raiz. Ligar hint e erro ao input.
- **Esforço:** M.

#### AUD-05: DataTable publicada ordena só com mouse; a Table promete `aria-sort` que não existe
- **Origem:** A11Y-05, API-17, DOC-08, CTR-A11Y-2.
- **Evidência:** npm `dist/react/index.js:690-704`: `onClick` fica no `<th>`, sem botão, sem `tabindex` e com 0 `aria-sort`, o que falha o 2.1.1. A correção existe no commit `b142658` (07/10), mas `git tag --contains` volta vazio, ou seja, não foi publicada. O manifest da `table` anuncia "aria-sort · aria-rowcount · aria-colcount", e `table.tsx` só tem `role="table"`. Continuam no repo: `onRowClick` só no `<tr>`, paginação `h-9` e nenhum estado de carregamento ou vazio rico.
- **Impacto:** quem instala hoje recebe uma tabela inacessível. A consulta descartou o componente e refez a ordenação à mão.
- **Correção:** publicar 3.0.1 com `b142658`. Coluna de ação no lugar de `onRowClick`. `h-11` na paginação. Corrigir a linha a11y da `table` no manifest.
- **Esforço:** P (publicar) + M (restante).

#### AUD-06: Badge info e warning abaixo de 4,5:1
- **Origem:** TOK-01, A11Y-07.
- **Evidência:** `badge.tsx:14-17` usa `bg-*/15` em vez dos tokens `-surface`. Info dá 4,42:1 sobre o card e 4,11 sobre `--bg`; warning dá 4,46 sobre `--bg`, em texto de 12 px. O axe acusa `color-contrast` **serious** na consulta. Com os tokens `-surface` corretos: info 4,89, warning 5,49.
- **Impacto:** o status de processo reprova AA sem erro do consumidor.
- **Correção:** `bg-info-surface`, `bg-warning-surface`, `bg-success-surface`, `bg-destructive-surface`. Opcionalmente, texto info em `--pv-blue-700`.
- **Esforço:** P.

#### AUD-07: Foco em itens de DropdownMenu e Select com 1,09:1
- **Origem:** A11Y-09, CTR-A11Y-11.
- **Evidência:** `dropdown-menu.tsx:28,87,103,127` e `select.tsx:112` combinam `outline-none` com `focus:bg-accent`: `#f5f5f5` sobre popover branco = 1,09:1. Medido: `outline:none`, `box-shadow:none`. Falha o 1.4.11 e o REQ-04.
- **Impacto:** o usuário de teclado com baixa visão não vê o item ativo. O `medir.mjs` não pega o problema.
- **Correção:** `focus:bg-tint` + `focus-visible:ring-2 ring-ring ring-inset`, ou barra lateral com `--focus-ring`.
- **Esforço:** P.

#### AUD-08: Slider com polegar sem nome acessível, sem API para nomear
- **Origem:** A11Y-11.
- **Evidência:** `slider.tsx:9-21`: o `aria-label` vai para o Root, e o `Thumb` (`role="slider"`) não recebe props. O axe acusa `aria-input-field-name` **serious** (wcag2a).
- **Impacto:** o consumidor não consegue tornar o controle acessível.
- **Correção:** repassar `aria-label`/`aria-labelledby` ao `Thumb` (ou prop `thumbLabel`) e suportar vários polegares.
- **Esforço:** P.

#### AUD-09: Gaveta mobile da Sidebar sem focus trap, sem botão de fechar e com gatilho de 36 px
- **Origem:** A11Y-12, CTR-A11Y-5.
- **Evidência:** `sidebar.tsx:248-267` declara `role="dialog" aria-modal`, mas não prende o foco. Em 390 px, o Tab sai para o conteúdo atrás do overlay. Não há botão de fechar. O `SidebarTrigger` (`:324-346`) tem 36×36 px e não tem `aria-expanded`.
- **Impacto:** quem usa teclado ou leitor de tela sai do "modal" para conteúdo encoberto. Tela afetada: painel.
- **Correção:** implementar a gaveta sobre o `Sheet` (Radix Dialog) ou aplicar `inert` aos irmãos. Botão "Fechar menu". Gatilho `h-11 w-11` com `aria-expanded`.
- **Esforço:** M.

#### AUD-10: Alvos de toque abaixo de 44 px nos tamanhos padrão, e X de 16 px
- **Origem:** A11Y-19, API-16, CTR-A11Y-7. *Ajuste: vale pela decisão do usuário (44 px), não pela WCAG 2.1. Checkbox e Radio com `<label>` e links inline saem da lista.*
- **Evidência:** X de Dialog, Sheet e Drawer = **16×16** (`dialog.tsx:45`, `sheet.tsx:66`, `drawer.tsx:51`), abaixo até dos 24 px da WCAG 2.2. Pagination, TabsTrigger, SidebarTrigger, Button `sm` e ToastAction têm 36 px. Toggle, NavigationMenuTrigger e AlertDialogAction têm 40. Calendar tem 32/36. A SKILL diz "Mínimo 44×44px".
- **Impacto:** o "depois" ainda tem 8 a 9 alvos pequenos por tela, todos padrão do kit. O "antes" tinha 18 a 25.
- **Correção:** X com `size-11 inline-flex items-center justify-center`. Padrão `h-11` em Pagination, Tabs, SidebarTrigger, Toggle, NavigationMenu e AlertDialog.
- **Esforço:** M.

#### AUD-11: Contradição documental: o CHANGELOG 3.0.0 anuncia poda de árvore e o fonte declara fronteira RSC, mas o dist não entrega nenhum dos dois
- **Origem:** CTR-API-1, CTR-API-2, CTR-26 (contradição); o defeito técnico está em AUD-20.
- **Nota de severidade:** o tree-shaking e a fronteira RSC foram **rebaixados para Média** como defeito técnico (AUD-20), porque o REQ-42 é estado-alvo (ADR-006). Mas o `CHANGELOG.md:8` da 3.0.0 afirma que a capacidade **já existe** ("Build com `splitting: true` (ESM por módulo) para poda de árvore"), e 4 componentes do `src` declaram `"use client"`. Uma afirmação falsa de capacidade no registro de release induz o consumidor a decisões erradas. Por isso esta contradição é **Alta**, mesmo com o defeito subjacente em Média.
- **Evidência:** `dist/react/` tem **um** `index.js` (134 kB) e nenhum chunk. Importar só `maskCPF` custa 292 kB min / 78,4 kB gzip. `grep -c '"use client"' dist/react/index.js` = 0. Com `node --conditions=react-server`, o import falha (`useLayoutEffect` não encontrado).
- **Impacto:** quem lê o CHANGELOG acredita que paga só pelo que importa e que pode usar Server Components. Nenhum dos dois é verdade.
- **Correção:** errata imediata no CHANGELOG ("bundle único; poda e RSC planejados") e nota no README sobre a ponte `"use client"`. A solução real está em AUD-20.
- **Esforço:** P.

#### AUD-12: A mesma versão 3.0.0 cobre três conteúdos; correções presas sem release e Changesets abandonado
- **Origem:** DOC-03, API-18, GOV-07, CTR-A11Y-1, CTR-API-8, CTR-N2, CTR-30.
- **Evidência:** o npm é igual a `fb7d782`. O HEAD tem +5 componentes alterados (combobox, data-table, date-picker, dropdown-menu, input-otp). O `origin/main` e o site têm +14 arquivos (`ErrorState`, `Button variant="success"`, `FormHeader`). Todos se declaram "3.0.0", e `.changeset/` só tem `config.json`. O último changeset é de 28/09 (1.1.0); a 2.0.0, a 2.1.0 e a 3.0.0 saíram por bump manual.
- **Impacto:** um agente que siga o `AGENTS.md` lê o `llms.txt` e o `manifest.json` do site e gera `import { ErrorState }`, que quebra o build no consumidor do npm. As correções de a11y não chegam a quem instala.
- **Correção:** changeset obrigatório em PR que toque `packages/react` (CI com `changeset status`) e `changesets/action`. Publicar 3.0.1. O site deve mostrar "desde a versão X".
- **Esforço:** P (processo) / M (marcação no site).

#### AUD-13: Toast documentado de três formas; a receita da SKILL e do manifest não renderiza nada
- **Origem:** DOC-01, API-10, GOV-08 (item 4), CTR-API-4, CTR-N5, CTR-31.
- **Evidência:** a SKILL (`:152`, `:267`) e o `notificacao.md:35-42` mandam `<ToastProvider><App/><ToastViewport/></ToastProvider>`. Mas o `ToastProvider` é o Provider cru do Radix (`toast.tsx:10`), e só o `Toaster` mapeia o estado (`:235-253`). O README manda `<Toaster/>`, que funciona. O demo do site usa uma 3ª forma.
- **Impacto:** seguindo a SKILL, nada aparece e nenhum erro é exibido. 2 de 2 construtores perderam tempo com isso.
- **Correção:** manifest e SKILL passam a mandar `<Toaster/>` + `useToast()`. Remover a regra "requer ToastProvider + ToastViewport".
- **Esforço:** P.

#### AUD-14: Documentação de componente com API errada (SidebarTrigger e IconButton)
- **Origem:** DOC-02, API-20 (parte), DOC-10 (tooltip), CTR-API-9, CTR-N3.
- **Evidência:** `gatilho-da-barra-lateral.md:36-38` mostra `<SidebarTrigger open onToggle/>`, o que dá `TS2322`. Essas props são do `SidebarToggleButton`. A correção do repo também não compila (`TS2741 label`), porque `Omit<IconButtonProps,"icon">` mantém `label` obrigatório. O `dica.md:39` usa `<IconButton aria-label>`, mas o tipo exige `label`.
- **Impacto:** em JS, as props são ignoradas sem aviso (o painel caiu nisso); em TS, não compila.
- **Correção:** `Omit<…,"icon"|"label">` e `label?` no `SidebarToggleButton`. Separar as entradas no manifest. Corrigir o tooltip para `label="Ajuda"`.
- **Esforço:** P.

#### AUD-15: Tokens e mecanismos documentados que não existem no pacote, incluindo o hex legado `#1e3a5f`
- **Origem:** DOC-07 (Alta), TOK-03 (Média), CTR-12, CTR-N7.
- **Evidência:** a SKILL (`:205`, `:257-260`) cita `--container-max`, `--container-docs`, `--measure`, `--control-height-md` e `data-density="compact"`, e todos dão 0 ocorrências no `tokens.css` publicado (existem só em `apps/docs/app/tokens.css`). A SKILL lite (`:43`) lista `--pv-blue-900 #1e3a5f`. O `dsTokens` (`src/lite/skills.ts`) lista `--pv-blue-900`, `--pv-green-500/600`, `--font-poppins` e `--font-mono`, todos inexistentes, e os verdes são proibidos como texto pelo REQ-24.
- **Impacto:** a falha é silenciosa: `var()` resolve para vazio. 3 telas caíram na escala bruta (`max-w-6xl`), o que deu 5 larguras de container diferentes. Um agente lite pode colar o hex legado.
- **Correção:** gerar as tabelas de tokens da SKILL e o `dsTokens` a partir do `tokens.css`. Decidir entre migrar container, medida e altura de controle para o pacote ou retirá-los da doc (AMB-11).
- **Esforço:** M.

#### AUD-16: Exemplos "copie e cole" geram violações de a11y
- **Origem:** DOC-09. *Ajuste: 5 violam a régua e 6 são desvios de regra do DS.*
- **Evidência:** o axe sobre os snippets renderizados dá `label` critical em date-picker e file-upload, `button-name` critical em dropdown-menu e serious em progress (`aria-progressbar-name`) e combobox. Desvios de regra: `main` aninhado na sidebar, `Button size="sm"` no header, `w-[250px]` no skeleton, input e textarea só com placeholder (o axe aceita). A SKILL manda "copie o snippet de `usage`" (`:165`).
- **Impacto:** o atalho que a própria SKILL recomenda aos agentes produz telas reprovadas.
- **Correção:** corrigir os 11 `usage` e renderizar todos no gate da CI com axe.
- **Esforço:** M.

#### AUD-17: Caminho de instalação contraditório ou incompleto
- **Origem:** DOC-06, GOV-08 (itens 2, 3, 5 e 6), CTR-API-5, CTR-31. *Ajuste: o `@source "../node_modules"` está certo para `src/index.css`; falta só explicar que o caminho é relativo ao CSS.*
- **Evidência:** a SKILL (`:17-23`) manda instalar 12 pacotes Radix à mão. O README (`:178`) diz que vêm automaticamente, e o `package.json` tem 20. O "Uso rápido" do README (`:15-20`) importa `tokens.css` via JS, sem `@import "tailwindcss"` nem `@source`, e os componentes saem sem estilo. Não há orientação de `source()`: o Tailwind varreu o projeto inteiro e causou reload cruzado. O README não cita `TooltipProvider`.
- **Impacto:** 3 de 5 diários registram a contradição sobre o Radix. Um time novo só chega ao visual correto por tentativa.
- **Correção:** um bloco "Comece aqui" único, gerado pelo `build-artifacts.mjs` e injetado no README e na SKILL. Remover a lista de Radix. Recomendar `source("./src")`. Fazer o `SemecProvider` incluir `TooltipProvider` e `Toaster`.
- **Esforço:** P/M.

#### AUD-18: Revisão por outra pessoa não acontece e nada a obriga
- **Origem:** GOV-14.
- **Evidência:** 14 de 14 PRs com `reviews=[]`, todos mergeados pelo próprio autor. `branches/main/protection` responde 404 e não há rulesets. `CODEOWNERS` aponta para `@SEMEC-PVH/design-system`, time inexistente. 212 commits contra 18 merges; a maioria entra direto no `main`, inclusive os majors.
- **Impacto:** o checklist "Reviewed by someone other than the author" e a verificação manual de teclado e contraste não têm registro. Como o kit tem 0 testes (AUD-45), a revisão é a única barreira, e ela não existe. Bus factor de 1 a 2.
- **Correção:** proteger o `main` (PR obrigatório, 1 aprovação, checks obrigatórios), CODEOWNERS com usuários nominais e template de PR com o checklist.
- **Esforço:** P.

### 4.3 Média (33)

| ID | Título | Origem | Evidência curta | Impacto | Correção | Esf. |
|---|---|---|---|---|---|---|
| AUD-19 | **Exceção conhecida a decidir:** Select e DropdownMenu abertos geram `aria-hidden-focus` serious | A11Y-06 | `hideOthers` do Radix Select 2.4.1 marca `#root` como `aria-hidden` sem `inert`. Reproduzido no Select **e no DropdownMenu**; o Dialog não dispara. O foco fica preso, então o impacto real é nulo. | **Reprova a régua formalmente** (requerimento; painel com menu aberto). | Decidir: (a) registrar exceção documentada e testada, ou (b) aplicar `inert` aos irmãos ou subir o Radix. | M |
| AUD-20 | Bundle sem poda e sem fronteira RSC (defeito técnico) | API-03, API-04, GOV-01, GOV-09 | 1 `index.js`; 136 `forwardRef`/`createContext` sem PURE + 143 `displayName` no topo; 292 kB qualquer que seja o import. 0 `"use client"`; `react-server` falha. Saída por módulo medida: `Button` 24,7 kB. *Média por REQ-42 ser alvo; GOV-01 foi mantido Alta por um verificador e API-04 rebaixado por outro, e prevalece Média conforme a régua. A contradição documental está em AUD-11.* | +76 kB gzip por página. Em Next App Router, o kit inteiro exige ponte `"use client"`. | Saída por arquivo (`preserveModules`/`bundle:false`), subpaths `./react/*`, `"use client"` nos componentes com estado, teste de import RSC. | M |
| AUD-21 | FormField não liga erro e dica ao campo | A11Y-15, API-05, DOC-04, CTR-A11Y-6 | `form-field.tsx:16-17,29`: ids só existem com `id` (não documentado); sem `aria-describedby`/`aria-invalid`/`aria-required` no filho; sem modo `fieldset`. O axe não acusa (3.3.1 atendido pelo texto visível). | 4 de 5 telas montaram `aria-describedby` à mão adivinhando `<id>-error`. | `FormFieldContext` com `useId()`; Input, Select etc. consomem; `as="fieldset"`. | M |
| AUD-22 | `role="alert"` em excesso | A11Y-16, API-14 (Alert) | Fixo em `alert.tsx:44` (inclusive success), `form-field.tsx:36`, `file-upload.tsx:113`, `error-summary.tsx:54`. 6 erros geram 7 anúncios assertivos. | Leitor de tela interrompido; aviso estático lido como urgente. | `role` por variante (`destructive`/`warning` → `alert`, demais → `status`); FormField sem `role` quando há resumo. | P |
| AUD-23 | Níveis de título fixos ou ausentes | A11Y-17, API-14, API-08 (linha 1) | `AlertTitle` `<h5>` (`alert.tsx:60`), `CardTitle` `<div>`, `EmptyState` `<h3>`, `ErrorSummary` `<h2>` com id fixo. `heading-order` em 3 telas (moderate). | Sentido nas **5/5** telas; h1/h2 feitos à mão. | Prop `as`/`asChild`/`headingLevel`; `useId()` no ErrorSummary. | P |
| AUD-24 | Anel de foco do campo inválido com 1,69:1 | A11Y-10 | `input.tsx:10`, `textarea.tsx:11`: `aria-[invalid=true]:ring-destructive/30` vence `focus-visible:ring-ring`. A borda vermelha (5,98:1) atenua. | Foco fraco justamente no campo com erro. | `aria-[invalid=true]:focus-visible:ring-destructive` a 100%. | P |
| AUD-25 | Link sem sublinhado, a 2,91:1 do texto | A11Y-08, TOK-10 | `tokens.css:493-496` zera `text-decoration`; `link.tsx:11-13` sublinha só no hover. *Ajuste: o axe não dispara porque o Link difere em peso e tamanho, não por causa do `inline-flex`.* | Link em parágrafo falha o 1.4.1 por julgamento; a tela institucional teve de corrigir à mão. | Sublinhado padrão; `inline` em vez de `inline-flex`. | P |
| AUD-26 | Poppins não é entregue nem tem receita no README | TOK-04, DOC-05, GOV-08 (item 1) | 0 woff2 e 0 `@font-face`; README sem fonte; SKILL `:33` com uma linha. 4 telas em Segoe UI; consulta via Google Fonts (desvio da tela). *Família ainda aberta em QA-03.* | A identidade tipográfica não chega ao produto; o layout varia entre máquinas. | Publicar `@semec/ds/react/fonts.css` + woff2 400–700 e incluir no setup. | P |
| AUD-27 | Espaçamento: `--space-*` não vira utilitário, há dois dialetos e o kit sai da escala | TOK-02, CTR-T2 | `@theme inline` sem spacing; `p-space-4` não gera CSS; o preset JS mapeia o contrário. Telas: `p-(--space-*)` em 3 e escala crua em 2. Kit: 25 usos fora da escala (`px-5`, `py-1.5`…). | Sintaxe de token verbosa, telas do mesmo sistema escritas de dois jeitos. | `--spacing-*` no `@theme` ou documentar `p-N` = escala; alinhar o kit. | M |
| AUD-28 | Escala tipográfica sem título de página, e line-heights ignoradas | TOK-05, CTR-T4, CTR-T5 | Para em `--text-2xl`; `text-3xl` = 30px do Tailwind (a especificação diz 32); `--leading-*` e `--font-*` não viram utilitário. h1 em 18, 24 e 36 px nas 5 telas. | Títulos diferentes entre as telas. | `--text-3xl`/`--text-display`; `--text-*--line-height`; `--font-weight-*`; papel de cada degrau. | P |
| AUD-29 | Sombras fora do token no kit, a começar pelo Card | TOK-06 | `card.tsx:12` `shadow-md` = `rgb(0 0 0/.1)` (preto puro); 10 sombras do Tailwind contra 14 `shadow-elevation`. | O componente mais usado sai do sistema. | `shadow-elevation-1` no Card e nos controles. | P |
| AUD-30 | Armadilha: `text-muted`/`text-secondary` compilam para cor de fundo (1,09:1) | TOK-07 | `@theme` mapeia `--color-muted`/`secondary` → `--surface-alt`; a SKILL full lista `--text-muted` e cita `text-muted-foreground` 0 vezes. | Risco latente: texto invisível para quem seguir a lista L1. | Expor `--color-text-*` ou renomear; tabela token → utilitário na SKILL. | P |
| AUD-31 | Textos fixos sem prop de sobrescrita, e `NavigationMenu` com "Main" em inglês | API-09, A11Y-24 | 17 textos sem prop: "Fechar" (Dialog/Sheet/Drawer), DataTable, FileUpload, Pagination, Calendar (sem `Intl`), "Dígito N" etc. `NavigationMenu` sem `aria-label` cai em "Main" do Radix. | Viola o ADR-016 e o REQ-53; leitor de tela mistura idiomas. | Prop `labels` por componente ou `SemecProvider locale`; `aria-label="Menu principal"` como padrão. | M |
| AUD-32 | Sidebar desktop sem landmark, `SidebarInset` como `<main>`, item ativo sem `aria-current` e `tooltip` tipado mas ignorado | A11Y-13, API-11, CTR-A11Y-9, CTR-API-6 | `sidebar.tsx:272-311` só `div`; `:380-393` `<main>`; `:529-559` só `data-active`; `:534` `tooltip` vaza para o DOM. | Navegação não encontrada por landmark; modo recolhido sem rótulo; `main` aninhado pelo exemplo. | `<nav aria-label>`; `as` no Inset; `aria-current`; implementar `tooltip`. | M |
| AUD-33 | Breakpoint da Sidebar: 768 no código, 900 na SKILL, detecção frágil | A11Y-27, API-12, TOK-13, CTR-A11Y-8, CTR-API-3, CTR-T6 | `sidebar.tsx:113` `innerWidth < 768`; `SidebarInset` sem `min-w-0`: no painel, `innerWidth` = 849 em 390 px, e a gaveta não ativou. | Navegação inacessível com conteúdo largo. | `matchMedia("(width < 48rem)")`, `min-w-0` de fábrica, corrigir a SKILL. | P |
| AUD-34 | `AlertDialog` é um `Dialog` com outro nome | A11Y-18, API-13, CTR-A11Y-4, CTR-N4 | `alert-dialog.tsx:2` importa `react-dialog`: `role="dialog"`, fecha por Esc e overlay; `Action` = `Close` fecha antes de validar; botões `h-10`. | Confirmação destrutiva dispensável por acidente; o painel desistiu do componente. | `@radix-ui/react-alert-dialog`, `buttonVariants`, documentar validar antes de fechar. | P |
| AUD-35 | Contrato de formulário heterogêneo (ADR-015) | API-23, CTR-API-7 | `onChange(event)`, `onChange(value)`, `onValueChange` e `onCheckedChange` convivem; só FormField e FileUpload aceitam `error`; Combobox e InputOTP sem `name`. | Integração com formulário e validação é caso a caso. | Padronizar `value`/`onValueChange`/`name`/`id`/`invalid` e documentar a equivalência. | M |
| AUD-36 | Lacunas de cobertura sentidas pelas telas (backlog) | API-08 | Ver seção 6. *Rebaixado: backlog agregado com itens de estado-alvo.* | Peças feitas à mão em todas as telas. | Prioridade 1: `Heading`/`as`, FormField com contexto, `Footer`, `SkipLink`. Prioridade 2: `Stepper`, `PasswordInput`, `Button loading`, `Input mask`. | G |
| AUD-37 | Calendar sem padrão de grade | A11Y-22 | `calendar.tsx:120-145`: 35 botões na ordem de Tab, sem `role="grid"`, setas ou `aria-selected`; nome do dia só com o número; navegação de mês com 32 px. | Escolher uma data exige dezenas de Tabs. | Padrão APG "date picker grid" com `Intl.DateTimeFormat('pt-BR')`. | M |
| AUD-38 | Aba ativa (Tabs) indicada quase só por cor (não reverificado) | A11Y-20 | `tabs.tsx:15,30`: fundo da ativa 1,01:1 contra a lista; texto ativo × inativo 2,09:1. | Aba selecionada indistinguível em escala de cinza. | Sublinhado `border-b-2 border-primary` + `font-semibold`. | P |
| AUD-39 | Contrastes secundários abaixo do limiar | A11Y-23 | X do Toast `opacity-60` 2,76–2,87:1; `DropdownMenuShortcut` 4,28:1; trilha de Progress e Slider 1,09:1. | Ícone de fechar e informação auxiliar pouco visíveis. | Tirar `opacity-60`; trilha com `--border-strong`. | P |
| AUD-40 | Tipos inutilizáveis com `moduleResolution: node16/nodenext` | GOV-02 | `index.d.ts` com `export *` sem extensão: TS2305 em `Button`. Com `bundler`, funciona. | Projetos Node/TS estritos ficam sem tipos. | d.ts com extensões `.js` e `@arethetypeswrong/cli` na CI. | P |
| AUD-41 | APIs anunciadas que não existem: `cn()`, `getComponentMetadata()`, e `/react/server` só funciona no monorepo | GOV-03, GOV-04, DOC-10, CTR-24, CTR-25 | `'cn' in mod` = false (TS2305), mas está no README, na SKILL `:92` e no `manifest.json`. `server` só tem `dsPackageRootResolve`, que lança fora do monorepo. `digits` vazou como export. | Quebra de build de quem compõe classes como no shadcn; subpath público inútil. | Exportar `cn`; remover ou reimplementar `server`; tirar `digits` da superfície pública. | P |
| AUD-42 | URLs do npm dão 404 e o README tem links relativos quebrados | GOV-05, DOC-14, CTR-27 | `repository`, `homepage` e `bugs` apontam para `SEMEC/design-system` (404); o real é `SEMEC-PVH/SEMEC_design_system` (200). | Pela página do npm não se chega ao site nem ao repo. | Corrigir os 3 campos e usar URLs absolutas no README. | P |
| AUD-43 | Remoções sem depreciação com o ADR-013 já vigente | GOV-06, CTR-23 | 2 majors com quebra em 2 dias (30/09 e 01/10). A 2.0.0 removeu 23 tokens, o tema escuro e `shadcn.css` sem lista nem guia; 0 `deprecat`/`console.warn`. O ADR-013 está Aceito desde 20/08. *Atenuantes: a 3.0.0 tem guia; adoção externa baixa (877 downloads).* | Atualizar quebra sem aviso, o que desestimula atualizar. | Errata da 2.0.0 com os 23 tokens e seus substitutos; `@deprecated` + aviso em dev por 2 minors; diff de exports e tokens na CI. | M |
| AUD-44 | Dependências defasadas: `tailwind-merge` 2, peer `zod ^3` e sem peer `tailwindcss` | GOV-11 | `twMerge("p-4 p-(--space-2)")` não resolve o conflito (justamente a sintaxe de token das telas). zod 4 como `latest` (não reverificado). | `className` com valor de token não sobrepõe de forma determinística. | `tailwind-merge ^3`; `zod ^3.23 \|\| ^4`; peer `tailwindcss ^4`. | P |
| AUD-45 | Kit sem nenhum teste, e ADR-009/014 "Aceito" sem marca de alvo | GOV-12, CTR-14 | `*.test.*` só no mini game; o `gate` do main faz axe só em SSR estático. *REQ-72 é alvo; o que conta como achado é a contradição de status.* | Todos os bugs desta auditoria seriam pegos por testes simples de comportamento. | Vitest + Testing Library + `vitest-axe` nos estados abertos; smoke com `npm pack` em Vite e Next. Até lá, marcar os ADRs como alvo. | G |
| AUD-46 | CI não cobre o checklist; Release independente da CI; artefatos não verificados | GOV-13, DOC-15 | `release.yml` sem `needs:` (publicou com CI vermelha em 3 commits); lint ignora `.tsx` do kit; sem `git diff --exit-code` dos artefatos; `generatedAt` gera diff a cada build. A CI mais recente (`ea5a25c`) passou. | Uma versão pode ir ao npm com CI vermelha; o kit não passa por jsx-a11y. | `needs:` no Release, lint jsx-a11y em `.tsx`, verificação dos artefatos, `--provenance`. | P/M |
| AUD-47 | ADRs com status incoerente com o código | GOV-15, CTR-03, CTR-11, CTR-28 | ADR-012 (tema escuro) Aceito, mas o tema foi removido na 2.0.0 sem ADR; ADR-024 cita `--pv-red-400` (inexistente); ADR-018 (`@semec/ds-react`) não está marcado como substituído. | Quem lê o índice tira conclusões erradas sobre o estado atual. | ADR "Tema único claro"; errata do ADR-024; 018 marcado como "Substituído por 022". | P |
| AUD-48 | Identidade parada há cerca de 55 dias, e docs canônicos desatualizados | GOV-16, DOC-16, CTR-01, CTR-29, CTR-N6 | QA-01, QA-03 e QA-09 abertas sem dono; `objetivo.md:15` "2.1.0"; "sem CI de a11y" (o main tem gate); nota do `Sidebar.jsx` obsoleta (lint dá 0). | Marca e fonte provisórias na 3ª major; doc canônica errada. | Dono e data para QA-01/03/09; atualizar `objetivo.md`, AGENTS e CONTRIBUTING. | P |
| AUD-49 | Contagem de componentes fixada à mão e divergente | DOC-11, CTR-02, CTR-32 | README 46, SKILL 47, llms.txt 48, site 49, ADR-018 32. A lista do README tem 3 duplicatas e omite Header. | Perda de confiança; o agente não sabe se `Header` existe. | Gerar a lista e a contagem a partir do manifest. | P |
| AUD-50 | Afirmações da SKILL contraditas pelo código ou pelo WCAG | DOC-12 | "Texto grande ≥18px bold" (o correto é 18,66); 44 px atribuído ao WCAG 2.5.5 (que é AAA) dentro de um bloco "AA"; "@theme expõe tokens" logo após o espaçamento; omite `role="alert"` fixo, h5/h3 fixos e placeholder "Logo". | Retrabalho e `heading-order` em 4 de 5 diários. | Corrigir as frases e criar a seção "comportamentos fixos do kit". | P |
| AUD-51 | Artefatos do pacote sem padrões de tela (não reverificado) | DOC-13 | A SKILL não cobre skip link, landmarks, container, tabela responsiva nem Sidebar com `min-w-0`; o `llms.txt` do npm cita padrões "no site" sem URL. | Cada tela reinventou o esqueleto da página. | `dist/skills/patterns/*.md` gerados a partir de `/padroes`; URL absoluta no `llms.txt`. | M |

### 4.4 Baixa (18)

| ID | Título | Origem | Evidência curta | Correção | Esf. |
|---|---|---|---|---|---|
| AUD-52 | Sheet/Dialog controlado sem Trigger não devolve o foco, e a doc não ensina | A11Y-14, API-16 (doc) | Comportamento do Radix; `onCloseAutoFocus` chega via `...props`. Consulta e painel precisaram de contorno. | Exemplo controlado com `onCloseAutoFocus` + `ref`; `overflow-y-auto` no Sheet. | P |
| AUD-53 | Superfícies de 1,1:1: Skeleton, trilha e campo cinza no card | A11Y-21, TOK-12 | `skeleton.tsx:9` e `progress.tsx:13` com `#f5f5f5` sobre branco; Input `bg-background` (1,08:1) parece desabilitado. | Token `--surface-sunken`; `bg-surface` nos campos; padrão `aria-busy` documentado. | P |
| AUD-54 | DatePicker com ícone duplo no 3.0.0 | API-15 | Indicador nativo + `CalendarIcon`; a correção do repo deixa o ícone `pointer-events-none`. | Ícone clicável com `showPicker()` ou só o nativo. | P |
| AUD-55 | Primitivos L0 expostos como utilitários "de uso direto" | TOK-08, CTR-15, CTR-T3 | `tokens.css:221` diz "uso direto: bg-pv-blue-600" e contradiz `:8-9`; o texto vai para o `llms-full.txt:291`. 0 usos nas telas. | Remover `--color-pv-*` do `@theme` (major) ou mover para arquivo opcional; corrigir o comentário. | P |
| AUD-56 | Hex solto no L1 e `rgba()` nas elevações | TOK-09 | `tokens.css:146` `#fdf6e3`; `:199-201` `rgba(20,35,58,…)`. | `--pv-yellow-50`; `color-mix` sobre `--pv-gray-900`. | P |
| AUD-57 | Raio diverge da especificação; `rounded-lg` = `rounded-xl`; autorreferência frágil | TOK-11, CTR-T1, CTR-N1 | sm 2px / lg 12px (a especificação diz 4/16); `--radius-sm: var(--radius-sm)` cicla se for importado dentro de `@layer`. | Decidir a escala; nomes L1 distintos. | P |
| AUD-58 | Consistência entre telas: selo, h1 e container variam | TOK-14 | Deriva por falta de tokens (AUD-15, AUD-28) e de asset de marca (QA-01/09). | Definir marca = `brand-hero` e ação = `primary` na SKILL. | P |
| AUD-59 | `lucide-react` 0.468 como dependency: cópia duplicada e ícones sem `aria-hidden` | API-19, A11Y-25 | `npm ls`: 0.468 aninhado + 1.57 na raiz; Check, Chevron e PanelLeft sem `aria-hidden`. | Peer `>=0.468 <2`; `aria-hidden` explícito. | P |
| AUD-60 | Anel de foco global invisível sobre a cor de marca (1,00:1) | A11Y-26 | `--focus-ring` = `--pv-blue-hero` sem offset sobre `bg-brand-hero`. | `--focus-ring-inverse` ou outline duplo. | P |
| AUD-61 | Timeline sem semântica de lista, status só por cor e conector invisível | A11Y-28 | Só `div`s; `TimelineDot` de 12 px; conector `absolute h-full` num pai sem altura. | `ol/li`, `srLabel`, `self-stretch`. | P |
| AUD-62 | HeaderBrand com placeholder "Logo" anunciado como imagem; trunca no mobile | A11Y-29 | `header.tsx:43-50`; `href=""` necessário para não virar link (não documentado). | `logo` obrigatório ou aviso em dev; prop para quebrar linha. | P |
| AUD-63 | Button sem `loading`/`aria-busy`; Spinner polui o nome acessível (estado-alvo) | A11Y-30, API-22, CTR-08 | `button.tsx:8`; Spinner com `role=status` + `aria-label` + sr-only: "Carregando Entrando…". | Prop `loading`; Spinner `decorative`. | M |
| AUD-64 | Tipos e consistência menores | API-21 | 11+ interfaces de Props não exportadas; `ErrorSummary` com id fixo e `mb-6`; typo `get-nce`. | `export interface`; `useId()`. | P |
| AUD-65 | Tarball sem LICENSE e CHANGELOG, com redundância | GOV-10 | 247 arquivos e 1,4 MB; `src/` duplicado; sem `./package.json` nos exports; sem `engines`. | `files` enxuto; copiar LICENSE; `engines: node >=22`. | P |
| AUD-66 | Caracteres corrompidos publicados ("e空 states") | DOC-17 | `dist/skills/llms.txt:115`, `manifest.json:787`. | Publicar já como "estados vazios"; verificação de caracteres no gate. | P |
| AUD-67 | `dsPrompt` convida a recriar componentes; a SKILL do npm traz seções de mantenedor | DOC-18 | `manifest.js:957-960` "Crie um <code>…"; SKILL `:272-297` com caminhos do monorepo. | "Use o componente X… não reimplemente"; separar as seções. | P |
| AUD-68 | Variante lite incoerente com "sem React" (não reverificado) | DOC-19 | O lite manda instalar o pacote inteiro e varrer `dist/react`. | Usar `@semec/ds/lite/tokens.css` sem `@source`. | P |
| AUD-69 | Crédito "obrigatório" só na SKILL (não reverificado) | GOV-17 | Ausente do README; a MIT não exige. | Decidir AMB-09. | P |

---

## 5. Contradições doc × código consolidadas

Pela régua, contradição não reprova nem código nem documento: é registrada para decisão. As que viraram achado estão referenciadas.

| ID | Tema | Documento diz | Código ou pacote faz | Achado |
|---|---|---|---|---|
| CTR-C01 | Poda e RSC | CHANGELOG 3.0.0: "ESM por módulo para poda"; `src` com 4 `"use client"` | 1 `index.js`, 0 diretivas, 292 kB constantes | AUD-11 (**Alta**) |
| CTR-C02 | Versão | `objetivo.md` 2.1.0; mesma "3.0.0" no npm, no repo e no site | Três conteúdos diferentes | AUD-12, AUD-48 |
| CTR-C03 | Toast | README `<Toaster/>` × SKILL/manifest `ToastProvider+Viewport` × demo manual | Só o `Toaster` renderiza | AUD-13 |
| CTR-C04 | SidebarTrigger | Doc com `open`/`onToggle`/`aria-expanded` | São props do `SidebarToggleButton` | AUD-14 |
| CTR-C05 | Tokens de layout | SKILL: `--container-max`, `--measure`, `--control-height-md`, `data-density`; lite: `--pv-blue-900` | Só existem no site, ou não existem | AUD-15 |
| CTR-C06 | InputOTP | SKILL: "foco entre dígitos" | Foco não avança | AUD-02 |
| CTR-C07 | Table/DataTable | Manifest: `aria-sort · aria-rowcount · aria-colcount` | Nenhum desses atributos; DataTable npm sem `aria-sort` | AUD-05 |
| CTR-C08 | AlertDialog | "Força decisão" | `role="dialog"`, dispensável | AUD-34 |
| CTR-C09 | Sidebar mobile | SKILL "< 900px"; "focus trap só em modais" | `innerWidth < 768`; `aria-modal` sem trap | AUD-33, AUD-09 |
| CTR-C10 | FormField / ADR-015 | `error` padrão nos campos; "erros via `aria-invalid` + `role=alert`" | Só FormField e FileUpload aceitam `error`; nada é injetado no filho | AUD-21, AUD-35 |
| CTR-C11 | Alvo de toque | SKILL "mínimo 44×44px" | Padrões de 36, 40, 32, 20 e 16 px | AUD-10 |
| CTR-C12 | Instalação do Radix | SKILL: instalar 12 Radix à mão | README "automático"; o pacote tem 20 em dependencies | AUD-17 |
| CTR-C13 | `cn` e `server` | README: `cn()` e `getComponentMetadata()` | Nenhum dos dois existe | AUD-41 |
| CTR-C14 | `tooltip` da Sidebar | Tipo declara `tooltip` | Ignorado, vaza para o DOM | AUD-32 |
| CTR-C15 | Contagem | 32 / 46 / 47 / 48 / 49 | `src/components` com 49 arquivos | AUD-49 |
| CTR-C16 | Espaçamento | Preset JS mapeia `spacing` → `--space-*`; SKILL "@theme expõe tokens" | CSS-first não mapeia | AUD-27 |
| CTR-C17 | Tipografia | Especificação: `text-3xl` 32px, `display` 40px; `--leading-*` | 30px do Tailwind; `display` inexistente; line-height do Tailwind | AUD-28 |
| CTR-C18 | L0/L1 | "Nunca use primitivo direto" | `tokens.css:221` "uso direto: bg-pv-blue-600"; hex e `rgba()` no L1 | AUD-55, AUD-56 |
| CTR-C19 | Raio | Especificação sm 4 / lg 16 | Código sm 2 / lg 12 | AUD-57 |
| CTR-C20 | Tema escuro | ADR-012 Aceito; ADR-024 usa `--pv-red-400` | Removido na 2.0.0 sem ADR | AUD-47 |
| CTR-C21 | Testes e axe | ADR-009/014 Aceito ("violação reprova o PR") | 0 testes do kit; `objetivo.md` diz que não há CI de a11y, mas o main tem gate | AUD-45, AUD-48 |
| CTR-C22 | Changesets e depreciação | ADR-022 "Changesets SemVer estrito"; ADR-013 "duas minors" | Bump manual; remoções sem aviso | AUD-12, AUD-43 |
| CTR-C23 | Button | Especificação: 4 variantes, raio 8px, `aria-disabled`, `loading` | 6 variantes, `rounded-full`, `disabled` nativo, sem `loading` | AUD-63 (alvo) |
| CTR-C24 | Paleta e foco | Especificação: blue-600 `#1f4493`, `text-muted` gray-500, foco blue-400 | `#3a6ca6`, gray-600, `--pv-blue-hero` (o **código é melhor** que a especificação) | Acerto 2 |
| CTR-C25 | Fonte | Especificação: "não existem 800/900"; QA-03 aberta | O site publica `Poppins-800.woff2`; o pacote não traz fonte | AUD-26 |
| CTR-C26 | Lint conhecido | AGENTS/CONTRIBUTING: violação em `Sidebar.jsx` | `npm run lint` dá 0 problemas | AUD-48 |
| CTR-C27 | URLs | `package.json`: `SEMEC/design-system` | 404; o real é `SEMEC-PVH/SEMEC_design_system` | AUD-42 |
| CTR-C28 | Texto grande e AAA | SKILL "≥18px bold"; 2.5.5 citado como AA | WCAG: 18,66px bold; 2.5.5 é AAA | AUD-50 |
| CTR-C29 | Movimento | Especificação `--duration-fast` | L1 real `--pv-duration-fast` (prefixo de primitivo) | — (registro) |
| CTR-C30 | Checkbox | SKILL "indeterminado" | Desenha sempre `Check` (o `aria-checked="mixed"` está correto) | — (registro) |

---

## 6. Lacunas de componentes por frequência nas telas

| Lacuna | Telas | Nº |
|---|---|---|
| Título semântico configurável (`Heading`, `as` em AlertTitle, CardTitle e EmptyState) | requerimento, consulta, painel, institucional, acesso | 5 |
| Espaçamento por token como utilitário (`p-space-*`) | requerimento, consulta, painel, institucional, acesso | 5 |
| Fonte Poppins entregue pelo pacote | requerimento, consulta, painel, institucional, acesso | 5 |
| Ligação automática erro/dica do FormField | requerimento, painel, institucional, acesso | 4 |
| Token de container e medida (`--container-max`, `--measure`) | requerimento, consulta, institucional, acesso | 4 |
| HeaderBrand com logo real, sem truncar, e Header responsivo (hambúrguer) | requerimento, institucional, acesso | 3 |
| Footer institucional | institucional, acesso | 2 |
| Stepper / etapas numeradas | requerimento, institucional | 2 |
| Input com máscara (`mask="cpf"`) e máscara de telefone | requerimento, acesso | 2 |
| Retorno de foco em Sheet/Dialog controlados (doc) | consulta, painel | 2 |
| Tabela ordenável acessível e responsiva (mobile) | consulta | 1 |
| `Button loading` (`aria-busy`) | acesso | 1 |
| `PasswordInput` (mostrar/ocultar) | acesso | 1 |
| `SkipLink` | institucional | 1 |
| Contador de caracteres no Textarea | requerimento | 1 |
| Separador rotulado ("ou") | acesso | 1 |
| Avaliação (rating) | institucional | 1 |
| KPI/StatCard e contador sobre ícone | painel | 1 |
| Diálogo de confirmação com campo obrigatório | painel | 1 |
| Badge neutra / `whitespace-nowrap` | consulta | 1 |
| API pública da Sidebar para o modo ícone | painel | 1 |
| Família mono (protocolos e códigos) | requerimento, painel | 2 |

---

## 7. Plano de ação recomendado

### Onda 1, agora: patch 3.0.1 (1 a 2 semanas, sem quebra)

| Item | Ação | Esf. |
|---|---|---|
| AUD-01 | Nome no `ToastClose`; rótulos PT-BR e props no `Toaster` | P |
| AUD-06 | Badge com tokens `-surface` | P |
| AUD-07 | Foco visível em itens de menu e Select | P |
| AUD-08 | Repassar o rótulo ao `Thumb` do Slider | P |
| AUD-02 | Registrar `ref` dos slots, valor por array fixo, `focus-within`, `one-time-code` | P |
| AUD-04 | Anel visível na zona do FileUpload e ligação de hint e erro (props novas ficam na Onda 2) | P |
| AUD-24 | Anel 100% no campo inválido | P |
| AUD-05 / AUD-12 | Publicar `b142658` e os demais commits pendentes com changeset; ativar a exigência de changeset na CI | P |
| AUD-11 | Errata do CHANGELOG 3.0.0 (poda e RSC) e nota sobre a ponte `"use client"` | P |
| AUD-13 / AUD-14 | Corrigir a doc do Toast, do SidebarTrigger e do tooltip; `label?` no `SidebarToggleButton` | P |
| AUD-15 | Remover da SKILL, da lite e do `dsTokens` os tokens inexistentes, inclusive `#1e3a5f` | P |
| AUD-17 | Bloco "Comece aqui" único; remover a lista de Radix da SKILL | P |
| AUD-16 | Corrigir os 11 `usage` | M |
| AUD-18 | Proteger o `main`, corrigir o CODEOWNERS, template de PR | P |
| AUD-19 | **Decidir** a exceção `aria-hidden-focus` (registrar e testar ou aplicar `inert`) | P |
| AUD-41 / AUD-42 / AUD-66 | Exportar `cn`; corrigir URLs; corrigir "空" | P |
| AUD-46 | Release com `needs:` sobre a CI | P |

### Onda 2, próxima minor: 3.1 (1 a 2 meses, aditiva; depreciações começam aqui)

| Item | Ação | Esf. |
|---|---|---|
| AUD-03 | Combobox no padrão APG, com `id`/`name`/`aria-*` | M |
| AUD-04 | FileUpload controlado (`value`, `multiple`, `id`, validação de `accept`) | M |
| AUD-09 / AUD-32 / AUD-33 | Gaveta sobre o Sheet, landmark, `aria-current`, `tooltip`, `matchMedia`, `min-w-0` | M |
| AUD-10 | Alvos de 44 px nos padrões; X com 44 px | M |
| AUD-21 / AUD-22 / AUD-23 | `FormFieldContext`, `role` por variante, `as` em títulos | M |
| AUD-25 / AUD-26 | Link sublinhado; `fonts.css` + woff2 | P |
| AUD-27 / AUD-28 / AUD-29 / AUD-30 | Espaçamento e tipografia no `@theme`, sombras por token, utilitários `text-text-*` | M |
| AUD-31 | Prop `labels` ou `SemecProvider locale`; `NavigationMenu` em PT-BR | M |
| AUD-34 | `AlertDialog` sobre `react-alert-dialog` | P |
| AUD-36 | Prioridade 1 das lacunas: `Heading`, `Footer`, `SkipLink`; depois `Stepper`, `PasswordInput`, `Input mask` | G |
| AUD-40 / AUD-44 | d.ts para nodenext; `tailwind-merge 3`, `zod 4`, peer `tailwindcss` | P |
| AUD-45 / AUD-46 | Primeira suíte Vitest + axe nos estados abertos; jsx-a11y em `.tsx`; verificação de artefatos | G |
| AUD-49 / AUD-50 / AUD-51 | Lista, contagem, frases e padrões de tela gerados pelo pipeline | M |
| AUD-43 | Política de depreciação ativa: errata da 2.0.0, `@deprecated` + aviso em dev para o que sairá na 4.0 | M |
| AUD-37 / AUD-38 / AUD-39 | Calendar em grade; indicador da aba ativa; contrastes secundários | M |

### Onda 3, próxima major: 4.0 (após 2 minors de depreciação, conforme o ADR-013)

| Item | Ação | Esf. |
|---|---|---|
| AUD-20 | Saída por módulo, subpaths `./react/*`, `"use client"` por componente, teste RSC em Next | M |
| AUD-35 | Contrato de formulário único (`value`/`onValueChange`/`name`/`id`/`invalid`) | M |
| AUD-55 / AUD-56 / AUD-57 | Tirar o L0 do `@theme`; L1 sem hex e sem `rgba()`; escala de raio decidida | P |
| AUD-41 | Remover ou reimplementar `/react/server`; tirar `digits` | P |
| AUD-63 | Button com `loading`/`aria-busy` e decisão sobre `aria-disabled` (CTR-08) | M |
| AUD-47 / AUD-48 | ADR "tema único claro", identidade decidida (QA-01/03/09) e docs canônicos derivados | P |

---

## 8. Limitações desta auditoria

- **Sem build real de Next.js App Router.** A quebra em RSC foi inferida com `node --conditions=react-server` e pelo padrão do site de docs, que só importa o kit em arquivos `"use client"`.
- **Sem leitor de tela real** (NVDA, JAWS, TalkBack). Os anúncios ("Notification…", `role=alert` múltiplo) foram inferidos da árvore de acessibilidade e das regiões vivas.
- **Não foi testado colar o código no InputOTP**, nem o preenchimento automático por SMS em celular real.
- **Só Chrome headless no Windows.** Firefox, Safari e dispositivos móveis reais não foram testados; o mobile foi emulado em 390×844. O zoom de 200% não foi medido à parte, só o reflow em 320 e 640 px.
- **Não houve teste em PC fraco real da prefeitura.** O bundle foi medido em build Vite isolado por página, não num app de produção com cache compartilhado.
- **Os construtores foram agentes de IA, não times da prefeitura.** O "antes" seguiu a instrução de "capricho normal, sem esforço heroico de a11y"; tempo e esforço são percepção dos agentes.
- **A renderização da fonte depende da máquina.** Poppins não estava instalada; o diário do painel afirmava o contrário, e a verificação refutou.
- **Só tema claro** (decisão do usuário). eMAG não foi verificado (REQ-16 é alvo).
- **Não reverificados na fase 4:** A11Y-20 (Tabs, AUD-38), DOC-13 (AUD-51), DOC-19 (AUD-68), GOV-17 (AUD-69) e a parte de zod 4 de GOV-11. A11Y-22 a A11Y-30 foram aceitos por amostragem.
- **Objeto de auditoria:** o pacote npm 3.0.0. O HEAD local e o `origin/main` (ErrorState, gate com axe) foram lidos só para registrar divergências, não auditados como produto.
- **Possível conflito com o `medir.mjs`:** ele conta mudança de fundo como "indicador de foco" e compara `scrollWidth` com `innerWidth`. As duas coisas mascararam AUD-07 e AUD-33 na medição automática.
- Nenhum arquivo do repositório foi editado.

---

## 9. Anexos: evidências

Base: `C:\Users\Administrador\AppData\Local\Temp\claude\C--dev-SEMEC-design-system\0b9416b4-0e12-4b06-b05f-44bc44f14d2b\scratchpad\auditoria\`

| Arquivo ou pasta | Conteúdo |
|---|---|
| `briefing-fase1.md`, `briefing-fase3.md`, `briefing-fase4.md` | Regras e decisões do usuário |
| `fase0-matriz-requisitos.md` | 78 REQ, 23 CTR, 15 AMB |
| `fase2-medicoes.md` | axe, LOC, bundle e achados de setup |
| `fase3-acessibilidade.md`, `fase3-componentes-api.md`, `fase3-tokens-visual.md`, `fase3-ia-docs.md`, `fase3-distribuicao-governanca.md` | Auditoria por dimensão (achados de origem) |
| `fase4-verificacao-a11y.md`, `fase4-verificacao-api-tokens.md`, `fase4-verificacao-docs-gov.md` | Vereditos e severidades finais |
| `lab\antes\<tela>\`, `lab\depois\<tela>\` (com `DIARIO.md`) | Protótipos e diários dos construtores |
| `lab\medicoes\<lado>-<tela>\` | `relatorio.json`, `desktop.png`, `mobile.png`, `foco-*.png` |
| `tmp-acessibilidade\` | `contraste.txt` (105 pares), `resultado.json`, prints `foco-menu.png`, `foco-invalido.png`, `foco-fileupload.png`, `tabs.png` |
| `tmp-verif-a11y\` | `resultado.json`, `resultado2.json`, `menu-foco.png`, `fileupload-foco.png` |
| `tmp-componentes-api\`, `tmp-verif-api-tokens\` | `shake.mjs`, `permod.mjs`, `gz.mjs` (poda), `tw.mjs` / `tw-out.css` (CSS compilado), `otp\` (harness do InputOTP e do Toast) |
| `tmp-tokens\` | `compilar.mjs`, `classes.mjs`, `fontes.mjs`, folhas de contato `antes-desktop.png`, `depois-desktop.png`, `mobile.png` |
| `tmp-ia-docs\`, `tmp-verif-docs-gov\` | `tc\` (typecheck dos 48 snippets), `regen\`, `nn\axe-snip.mjs`, `site-manifest.json` |
| `tmp-distribuicao\` | Tarballs 1.1.0 e 2.1.0, `subpaths.mjs`, `tt\a.tsx` (nodenext) |
| `relatorio-dados.json` | Dados estruturados deste relatório para a página visual |
