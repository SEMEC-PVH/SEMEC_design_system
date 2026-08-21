# Análise do repositório oficial — SEMEC_design_system

Auditoria técnica · 21/08/2026
Repositório: `github.com/SEMEC-PVH/SEMEC_design_system` · commit `ac223dd`
Método: leitura integral do código, build verificado, contraste calculado programaticamente, confronto com os docs 01–05 do projeto.

---

## Veredito

O que está no repositório é o **site de documentação** de um design system, não o design system. Nenhum projeto da SEMEC consegue consumir nada daqui: não há pacote publicável, não há token exportado, não há componente reutilizável. Na arquitetura do doc 01, isto é o `apps/docs` — sozinho, sem os `packages/` que ele deveria documentar.

Isso não é um defeito se o objetivo desta fase era registrar a identidade visual antes de codificá-la — e como registro ele é bom, organizado e navegável. Vira um problema no momento em que for tratado como "a F0 já começou", porque o roadmap pressupõe o inverso: tokens publicados *antes* do site que os documenta.

Há também um desalinhamento a resolver antes de qualquer adoção: o repositório **viola várias das regras que ele próprio publica**, e a paleta que ele documenta como oficial tem seis falhas de contraste WCAG AA — incluindo o botão de CTA e o anel de foco.

---

## 1. O que existe hoje

| Métrica | Valor |
|---|---|
| Linhas de código | 2.124 (919 CSS + 1.205 JSX) |
| Rotas estáticas | 19 (build ✓) |
| Tokens de cor em `:root` | 22 |
| Componentes consumíveis | 0 |
| Commits / branches | 3 / 1 |
| PDF versionado | 20 MB |

Next.js 16.3.2 com React 19.2.8, App Router, `output: 'export'` — site totalmente estático. Dezesseis componentes React, todos de documentação (`Card`, `Swatch`, `Preview`, `TypeRow`, `Shape`) ou de demonstração visual com markup fixo (`DemoHeader`, `DemoHero`, `DemoControls`, `DemoCard`, `DemoFooter`). Quatro páginas de fundamentos, seis de componentes, quatro de regras.

### Arquitetura prevista × arquitetura presente

| Camada / decisão (doc 01) | No repositório | Estado |
|---|---|---|
| **L0 Tokens** — JSON DTCG + Style Dictionary, 3 níveis | 22 custom properties escritas à mão em um único CSS, nível primitivo apenas | parcial |
| **L1 Primitivos** — reset, grid, foco, `Stack/Inline/Grid` | reset de 6 linhas; sem grid, sem foco padronizado, sem utilitários | ausente |
| **L2 Componentes** — 24 componentes, Radix + CVA + Tailwind v4 | zero componentes consumíveis; 5 demos com conteúdo fixo e CSS global | ausente |
| **L3 Padrões** — tabela de dados, formulário, listagem+detalhe | — | ausente |
| **L4 Templates** — shell administrativo, login, erro | — | ausente |
| **Distribuição** — `@semec/*` no registry npm do Gitea | repositório único, `private: true`, remoto no GitHub | divergente |
| **TypeScript strict** | JavaScript sem tipos, `jsconfig` só com alias de path | divergente |
| **Storybook · Vitest · axe · Playwright · Changesets** | nenhum; nem ESLint, nem Prettier, nem CI | ausente |
| **Documentação viva** | presente e bem organizada — é o que o repositório de fato entrega | feito |

Não é uma cobrança de que a F0 esteja concluída. É a constatação de que o que existe é a F0 *do site*, e o doc 01 define a F0 como "`@semec/ds-tokens` 0.1.0 publicado e consumido por um projeto real". São dois pontos de partida diferentes, e vale escolher um conscientemente.

---

## 2. Contraste medido (WCAG 2.1 AA)

Critérios: 4,5:1 para texto normal (1.4.3), 3:1 para texto grande e componentes de interface (1.4.11).

| Par | Onde aparece | Razão | AA |
|---|---|---|---|
| branco sobre `pv-green-600` | `.btn.green` — "CTA de destaque" | **2,48** | falha |
| `pv-green-500` como anel de foco sobre branco | `:focus` dos inputs · regra nº 1 da página de Acessibilidade | **2,00** | falha |
| `--ps-body #cfcecd` sobre header branco | logotipo "DEVSEMEC" no tema claro | **1,57** | falha |
| `#94a3b8` sobre branco | rótulo "Em breve" do ServiceCard | **2,56** | falha |
| `#9ca3af` sobre `#f4f6f9` | rodapé do próprio site do DS | **2,35** | falha |
| `pv-green-700` como texto sobre branco | link "Acessar" do card · links da tabela de componentes | **3,59** | falha |
| `pv-green-700` sobre `pv-green-50` | seta e etiqueta verde do ServiceCard | **3,26** | falha |
| `pv-gray-500` sobre o fundo de página | subtítulos e microtextos | 4,47 | no limite |
| branco sobre `#223f99` | herói, footer, CTA institucional | 9,38 | passa |
| branco sobre `pv-blue-900` | botão primário, chip ativo, item ativo da sidebar | 11,50 | passa |
| `pv-blue-950` sobre `pv-yellow-500` | selo "Novo" | 10,13 | passa |
| `pv-yellow-500` sobre `#223f99` | eyebrow "Portal de Serviços" | 5,91 | passa |

**Leitura:** o verde institucional funciona como preenchimento, não como cor de texto nem de foco. Nos três papéis em que a documentação o coloca — fundo de botão com texto branco, cor de link, anel de foco — ele reprova. O azul passa com folga nos dois tons.

A correção não exige mudar a identidade: basta um tom escuro dedicado na família verde (em torno de `#3d6b23`, ~7:1 sobre branco) reservado a texto e foco, mantendo `pv-green-600` apenas para superfícies com texto escuro. O anel de foco pode passar a usar o azul institucional, que já atende.

---

## 3. Achados principais

### F1 — O working tree inteiro aparece modificado, sem mudança nenhuma · BLOQUEANTE

`git status` lista 44 arquivos modificados; `git diff --stat` soma 4.022 inserções e 4.022 remoções, todas de linhas idênticas. Causa: CRLF no disco contra LF no índice, sem `.gitattributes` e sem `core.autocrlf`. Qualquer PR aberto de uma máquina Windows parece reescrever o repositório inteiro, e revisão de código deixa de ser possível.

**Correção:** `.gitattributes` com `* text=auto eol=lf`, depois `git add --renormalize .` e um commit único de normalização. Pré-requisito de tudo o mais.

### F2 — Seis falhas de contraste em componentes publicados como oficiais · BLOQUEANTE

Detalhadas na seção 2. O agravante é de governança: o doc 01 define WCAG 2.1 AA como *critério de aceite bloqueante*, e a página de Acessibilidade elege o anel de foco verde como regra nº 1. Hoje o DS publica como referência exatamente os pares que reprovam.

**Correção:** criar `pv-green-800` para texto e foco; trocar o anel de foco por `#223f99`; substituir `#94a3b8` e `#9ca3af` por `pv-gray-500`; corrigir `--ps-body` no tema claro.

### F3 — As duas regras mais citadas do DS não estão implementadas · BLOQUEANTE

`prefers-reduced-motion` aparece apenas dentro de textos explicativos — **nenhuma media query** no CSS. As transições de hover dos cards e o deslize da sidebar rodam sempre.

A página de Acessibilidade prescreve `focus-visible:ring-2 ring-pv-green-500`. No CSS não existe **nenhum bloco `:focus-visible`**; há só `:focus` em dois inputs, e esses fazem `outline: none` trocando por um box-shadow verde — justamente o par de 2,00:1.

**Correção:** um bloco global `:focus-visible` com o azul institucional e um `@media (prefers-reduced-motion: reduce)` zerando transições. ~10 linhas de CSS.

### F4 — O build depende de internet aberta para o Google Fonts · BLOQUEANTE

`next/font/google` busca Poppins, Press Start 2P e JetBrains Mono em `fonts.googleapis.com` *durante o build*. Testado sem rede: o build falha com três erros e não produz saída. Em CI atrás do proxy da prefeitura, ou em runner self-hosted do Gitea sem egresso, este repositório não compila.

**Correção:** migrar para `next/font/local` com os `.woff2` versionados em `app/fonts/`. Também elimina a dependência externa em produção.

### F5 — A escala "azul institucional" não contém o azul institucional · ALTO

`--hero: #223f99` é o azul real — herói, footer e logotipo usam ele. Mas a escala `pv-blue-50 → 950`, documentada como "Azul institucional (primário)", é interpolada a partir de `#1e3a5f`, que é outro azul. Os dois convivem: `#223f99` aparece escrito à mão em quatro arquivos JSX e como variável avulsa no CSS, fora da paleta. A página de Pendências reconhece o problema — mas ela está publicada como referência.

**Decisão necessária:** ou `#223f99` vira o centro de uma escala reconstruída, ou a escala atual é rebatizada como neutro de interface e o azul de marca ganha token próprio. Conviver não resolve.

### F6 — A paleta tem duas fontes da verdade · ALTO

Os 22 tokens existem em `app/globals.css` e são repetidos, um a um, como arrays literais em `fundamentos/cores/page.jsx`. Ao ajustar uma cor, quem editar só um dos dois publica documentação que mente sobre o próprio sistema — e nada detecta isso.

No total: **33 hex literais** em JSX (27 valores distintos), **13 `rgba()` literais** no CSS (incluindo as três sombras institucionais e o anel de foco) e **30 blocos `style={{…}}`** inline. A página de Anti-padrões abre com "não usar hex solto de cor — sempre token `pv-*`".

**Correção:** um `tokens.json` como origem única, gerando o `globals.css` e alimentando a página de Cores por importação. É o primeiro passo real da camada L0.

### F7 — Os demos são a implementação de referência e não têm acessibilidade · ALTO

- `.demo-tabs` são `<button>` soltos, sem `role="tab"`, sem `aria-selected` — a aba ativa é só uma classe CSS.
- `.demo-chips` não usam `aria-pressed`, apesar de a regra de acessibilidade citar exatamente esse atributo para toggles.
- O campo de busca do demo tem apenas `placeholder`, sem `<label>` nem `aria-label`.
- Ícones decorativos (`⌕ → f ◎ ▶`) sem `aria-hidden`; os ícones de rede social do footer são letras isoladas sem nome acessível.

Se o preview não é acessível, ele não é referência — é dívida distribuída.

### F8 — Os grupos da sidebar não abrem pelo teclado · ALTO

`<div className="side-title" onClick={…}>` — não é focável, não tem `role`, não tem `aria-expanded`. Quem navega por teclado ou leitor de tela não consegue expandir ou recolher as seções da navegação do próprio guia. No mobile, a sidebar fechada sai da tela com `transform: translateX(-100%)` mas continua na ordem de tabulação e legível para leitor de tela.

**Correção:** trocar o `div` por `<button aria-expanded>` e aplicar `inert` na sidebar quando fechada.

### F9 — A documentação descreve o código de outro repositório · ALTO

As notas de cada componente prescrevem classes Tailwind — `bg-pv-blue-900`, `max-w-6xl`, `rounded-2xl border-slate-200/80`, `focus-visible:ring-pv-green-500`, `-mt-12` — que não existem aqui: este repositório não usa Tailwind. Elas descrevem o `semec-digital`.

Funciona enquanto o leitor souber disso. Deixa de funcionar quando o DS for a fonte da verdade, porque a documentação vira instrução para reproduzir um código que o DS não fornece — e ninguém detecta quando o semec-digital mudar.

**Correção:** ou o repositório assume Tailwind v4 (como o doc 01 define) e as notas viram verdade, ou as notas passam a citar tokens e classes que este repositório publica.

### F10 — O DS não é feito com o próprio DS, e assina com marca não institucional · MÉDIO

O corpo do site usa **JetBrains Mono** enquanto a página de Tipografia documenta **Poppins** como família única. Defensável — docs e produto podem ter linguagens diferentes — mas não está dito em lugar nenhum.

O logotipo do header é a palavra **DEVSEMEC** em Press Start 2P, fonte pixel de videogame. A página de Anti-padrões proíbe `font-press-start` "fora do logotipo" — a exceção foi criada para acomodar essa escolha. Enquanto isso há um MIV oficial da PMPV de 20 MB dentro do repositório, e o `app/icon.svg` é um "S" em Arial.

**Decisão necessária:** o DS assina como DEVSEMEC (marca do time de tecnologia) ou como SEMEC/PMPV (marca institucional)? É a Q1 do doc 01, ainda em aberto, e ela trava a definição dos tokens primitivos.

---

## 4. Itens menores

| # | Achado | Correção |
|---|---|---|
| F11 | Remoto é `github.com/SEMEC-PVH`; o doc 01 e o ADR de distribuição estabelecem o Gitea institucional | Definir se é espelho consciente ou migração pendente |
| F12 | 20 MB de PDF (o MIV) versionados; `.git` já pesa 16 MB | Mover para release asset ou storage; deixar o link |
| F13 | `output: 'export'` sem `basePath`: se publicado em subpasta, links e assets quebram | Definir `basePath` junto com o destino de publicação |
| F14 | Sem README, LICENSE, CONTRIBUTING, CODEOWNERS, CI, ESLint, Prettier, `.editorconfig`, `engines` ou testes | O repositório que se propõe a ser a referência de qualidade não tem porteiro |
| F15 | `legacy/index.html` (703 linhas) duplica o guia inteiro na versão anterior | Arquivar fora da `main` ou remover |
| F16 | A página de Tipografia documenta o token `--font-poppins--bold`, inexistente | Remover ou criar |
| F17 | Previews injetam `h4/h5/h6` no outline das páginas (h1 → h3 → h5) | Títulos de preview devem ser elementos não semânticos |
| F18 | Navegação principal em `<aside>` sem `<nav>`; sem skip link (existe `id="topo"` sem âncora) | Landmarks corretos |
| F19 | A busca do header abre resultados sem `aria-expanded`, `role="listbox"` ou região viva | Leitor de tela não anuncia os resultados |
| F20 | O `Swatch` copia o hex e dá retorno só visual (outline por 700 ms) | Adicionar região viva com "copiado" |

---

## 5. Ordem de ataque sugerida

**Dias — destrava**

1. `.gitattributes` e renormalização (F1) — sem isso não há revisão de código possível
2. Corrigir as seis falhas de contraste (F2)
3. Bloco global `:focus-visible` e `prefers-reduced-motion` (F3)
4. Auto-hospedar as fontes e tirar o build da rede (F4)
5. README dizendo o que o repositório é e o que ele não é

**Semanas — consolida**

6. Resolver o azul institucional (F5) — enquanto não resolver, a página de Cores publica informação errada
7. `tokens.json` como origem única gerando CSS e documentação (F6)
8. Acessibilidade dos demos e da navegação (F7, F8)
9. Decidir logotipo e identidade com quem detém o MIV (F10 / Q1 do doc 01)
10. ESLint, Prettier e um workflow de CI com build + axe

**Estrutural — vira design system**

11. Extrair `@semec/ds-tokens` e `@semec/ds-css` como pacotes publicáveis
12. Este repositório passa a ser o `apps/docs` do monorepo
13. Publicar no registry escolhido (F11) e validar com um consumidor real
14. Só então os 24 componentes L2 — com Radix, tipos e testes, como o doc 01 define

O ponto de virada é o item 11: é quando o SIGO ou o Cartão Cidade passam a **consumir** alguma coisa em vez de apenas ler. Antes disso, por melhor que fique a documentação, o design system continua sendo um documento.
