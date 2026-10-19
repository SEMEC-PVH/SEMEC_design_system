# Integração do @semec/ds sem React (relatório A)

- **Pacote testado:** `C:\dev\semec-int\semec-ds-4.2.0.tgz` (branch `fix/pendencias-4.2`, futura 4.2.1), instalado sempre por `npm i C:/dev/semec-int/semec-ds-4.2.0.tgz`.
- **Data:** 19/10/2026. **Ambiente:** Windows 11, Node 24.21, npm 11, Python 3.14.8, Docker 29.8 (`php:8-cli`), Vite 8.3.4, Tailwind 4.3.3, Angular 22.2, Playwright 1.56.1 (Chromium headless), axe-core 4.14.0.
- **Projetos:** `C:\dev\semec-int\a-sem-react\` (um por cenário). **Prints:** `C:\dev\semec-int\a-sem-react\prints\`. **Script de verificação** (print, fontes, estilos computados, foco por Tab e axe): `C:\dev\semec-int\a-sem-react\_tools\check.cjs`.
- **Comparação com o npm:** o `tokens.css` e o `fonts.css` do .tgz são idênticos byte a byte aos da 4.2.0 publicada (mesmo SHA-1), então os testes de CDN feitos contra a 4.2.0 valem para a 4.2.1.

## Resumo

1. **Funciona:** só com os tokens, cores, tipografia, Poppins, foco visível e `prefers-reduced-motion` funcionam em HTML puro, PHP, Flask/Jinja, Vue 3 e Angular 22. As fontes carregam pelos caminhos relativos, desde que `fonts/` fique ao lado do `fonts.css`. O axe deu 0 violações em todas as telas.
2. **Funciona:** com Tailwind v4 (Vite vanilla, Vue e Angular via PostCSS), os utilitários do dialeto (`bg-surface`, `p-space-4`, `text-text-muted`, `shadow-elevation-1`…) são gerados sem `@source`, como a skill lite diz.
3. **Não funciona:** não existe receita de classes por componente para quem não usa React. Os "Padrões de tela (sem React)" da lite são utilitários do Tailwind e não fazem nada em CSS puro. A única receita está no código TSX dos `.md`, com a instrução "não recrie o estilo". Seguindo a lite, o Button sai diferente do kit (cantos de 8px em vez de pílula).
4. **Não funciona:** não há tokens em JSON, DTCG ou Style Dictionary, nem valores fora do CSS. O `dsTokens` só lista nomes e faltam 22 tokens L1. Para app mobile, Figma ou back-end (PDF, e-mail), a única fonte é fazer parse do `tokens.css`.
5. **Riscos:** sem Tailwind, a classe `bg-brand-hero` que a lite recomenda deixa o anel de foco branco sobre fundo claro (1,08:1). Incluir o `tokens.css` num sistema legado aplica um reset global (margens, listas, botões). Uma regra legada `:focus{outline:0}` anula o foco do kit sem o axe perceber. No Vite sem Tailwind, o build dá 29 avisos e 56% do CSS vai morto para produção.

## Matriz cenário × resultado

| # | Cenário | Resultado | Tempo até a 1ª tela* | Principais atritos |
|---|---|---|---|---|
| 1a | HTML puro, arquivos copiados de `node_modules` para `/static` | ✅ | ~12 min (install 20 s; o resto foi escrever o CSS dos componentes à mão) | Sem receita de componente (INT-A-02); reset global (INT-A-05); 64 MB instalados para 76 KB úteis (INT-A-13) |
| 1b | HTML puro, `<link>` em `/node_modules/@semec/ds/dist/react/*` | ✅ | +1 min | Caminho `dist/` não é contrato público (a lite avisa) |
| 1c | CDN unpkg, caminho do `exports` (`/react/tokens.css`) | ✅ | +1 min | unpkg resolve o `exports`; carga de ~2 s |
| 1d | CDN jsDelivr, caminho `dist/` | ✅ | +1 min | Carga de ~4,8 s no teste |
| 1e | CDN jsDelivr, caminho do `exports` | ❌ | — | 404 → `ERR_BLOCKED_BY_ORB`, página sem estilo (INT-A-12) |
| 1f | Padrões da skill lite colados em HTML sem Tailwind | ❌ | — | As classes não existem (INT-A-03) e o foco fica branco (INT-A-01) |
| 2a | Vite vanilla + `@tailwindcss/vite` | ✅ | ~12 min (scaffold 22 s, build 0,1 s; o resto foi achar as classes no TSX) | Receita só no código-fonte (INT-A-02); Button diverge (INT-A-04) |
| 2b | Tailwind CLI (`@tailwindcss/cli`) | ⚠️ | ~3 min (29 s + diagnóstico) | Poppins dá 404 até copiar `fonts/` à mão (INT-A-08) |
| 3a | PHP 8 (`php:8-cli -S` no Docker) | ✅ | ~5 min (reaproveitando o CSS do 1a; sem ele, ~15 min) | Nenhum ponto de integração de back-end (INT-A-09); arquivos copiados à mão |
| 3b | Flask 3.1 + Jinja | ✅ | ~5 min (venv + install 25 s) | Macros Jinja escritos à mão; sem parciais no kit |
| 4a | Vue 3 + Vite, CSS importado no JS, sem Tailwind | ⚠️ | ~5 min (scaffold 38 s) | 29 avisos `Unknown at rule` no build; `@theme`/`@utility` vão para produção (INT-A-07) |
| 4b | Vue 3 + Vite + Tailwind v4 | ✅ | ~3 min | — |
| 4c | Angular 22, `styles.css` com `@import` dos subpaths | ✅ | ~6 min (`ng new` 62 s, build 5 s) | Sem aviso, mas `@theme`/`@utility` no bundle; o npm instala react/react-dom num app Angular |
| 4d | Angular 22 + Tailwind v4 (`@tailwindcss/postcss` + `.postcssrc.json`) | ✅ | ~2 min (37 s) | Nenhum: utilitários, fontes e foco ok |
| 5a | Node puro: `require`/`import` dos `manifest.json` (full e lite) | ✅ | ~1 min | `import` sem `with {type:"json"}` falha, mas é regra do Node |
| 5b | Node puro: `require("@semec/ds/skills")` e `require("@semec/ds/lite/skills")` | ⚠️ | — | `ERR_PACKAGE_PATH_NOT_EXPORTED` (INT-A-11); o `import` funciona |
| 5c | Tokens para mobile ou Figma (JSON/DTCG/Style Dictionary) | ❌ | — | Não existe (INT-A-09); `dsTokens` incompleto (INT-A-10) |
| 6 | A11y só com tokens (axe nas telas 1 e 3) | ⚠️ | — | 0 violações; foco e contraste saem "de graça" só no caminho feliz (INT-A-01, INT-A-06) |

\* Tempo de relógio desta sessão, contando escrever a tela. Os tempos medidos de instalação e build estão entre parênteses.

### Resultado do axe (wcag2a, wcag2aa, wcag21a, wcag21aa, best-practice)

| Página | Violações | Regras aprovadas | Foco no 1º campo (Tab) |
|---|---|---|---|
| `c1-html/local.html` | 0 | 36 | `outline: 2px solid rgb(34,63,153)`, offset 2px |
| `c3-php` (`http://localhost:8104/`) | 0 | 37 | idem |
| `c3-flask` (`http://localhost:8105/`) | 0 | 37 | idem |
| `c2-vite-tailwind`, `c4-*` | 0 | 36–37 | anel `ring-ring` (Tailwind) ou outline do kit |
| `c1-html/a11y-armadilhas.html` | **0** | 20 | **`outline: none`**: foco invisível, que o axe não detecta |
| `c1-html/lite-sem-tailwind.html` | **0** | 35 | **`outline: 2px solid rgb(255,255,255)`** sobre `#f4f6f9` (1,08:1) |

Contraste dos pares de tokens que a lite recomenda (calculado): branco sobre `--action-primary` 5,42:1; `--feedback-danger` sobre a superfície dele 5,91:1 e sobre `--surface` 6,47:1; aviso 5,49:1; sucesso 6,31:1; info 4,89:1; `--border-strong` sobre `--surface` 3,77:1; `--focus-ring` sobre `--bg` 8,66:1. Com os pares certos, o AA sai de graça. Em compensação, `--border` sobre `--surface` dá 1,24:1 e o verde `--feedback-success-emphasis` usado como texto dá 2,13:1, e o kit não impede nenhum dos dois.

## Achados

### INT-A-01 — Sem Tailwind, a classe `bg-brand-hero` deixa o foco branco sobre fundo claro
- **Severidade:** Alto (WCAG 2.4.7)
- **Cenário:** 1 e 6
- **Passos:** a página `c1-html/lite-sem-tailwind.html` usa só `fonts.css` + `tokens.css` via `<link>` e copia literalmente o padrão da lite "marca = `bg-brand-hero text-text-on-brand`" num `<header>`. Tab até o link "Início".
- **Esperado:** sem Tailwind, a classe não pinta nada, mas o foco continua com o anel padrão (`--focus-ring`, 9,38:1).
- **Obtido:** o `@layer base` do `tokens.css` troca `--focus-ring` por `--focus-ring-inverse` em `.bg-brand-hero`, mesmo sem o fundo da marca. O anel fica `rgb(255,255,255)` sobre `#f4f6f9`, com contraste de 1,08:1, e o axe não acusa.
- **Evidência:** `node _tools/check.cjs c6-foco-branco-sem-tailwind http://localhost:8101/lite-sem-tailwind.html --tab 1` → `A outline=solid 2px rgb(255, 255, 255)`; print `prints/c6-foco-branco-sem-tailwind-foco.png`.
- **Correção:** no `@layer base`, faça `.bg-brand-hero` também pintar `background-color: var(--brand-hero); color: var(--text-on-brand)`. É inofensivo com Tailwind, porque o utilitário dá o mesmo valor. A alternativa é tirar `.bg-brand-hero` do seletor e documentar só `data-surface="brand"` para quem não usa Tailwind. Na lite, a seção "sem Tailwind" deve dizer que a área de marca precisa de `background: var(--brand-hero)` próprio junto com `data-surface="brand"`.

### INT-A-02 — Não há receita de classes por componente para quem não usa React
- **Severidade:** Alto
- **Cenário:** 1, 2, 3 e 4
- **Passos:** reproduzir Button, Input, Card e Alert sem os componentes, procurando a receita no `manifest.json` (full e lite), na skill lite, no `llms.txt` e em `skills/components/*.md`.
- **Esperado:** uma lista de classes (Tailwind) ou um CSS pronto por componente e variante, com estados (`hover`, `focus-visible`, `aria-invalid`, `disabled`).
- **Obtido:** o manifest lite não tem componentes. O full tem `usage` só em JSX. A skill lite traz tokens e padrões gerais. A única fonte das classes é o código TSX/CVA na seção "Fonte" dos `.md` (ex.: `botoes.md`, `caixa-de-texto.md`, `cartao.md`, `aviso.md`), e o prompt do mesmo arquivo diz "não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes". No cenário 1, as 17 regras de `shared/app.css` foram escritas à mão. No cenário 2, as classes foram copiadas do `cva` do TSX.
- **Evidência:** `C:\dev\semec-int\a-sem-react\shared\app.css` (receita à mão); `c2-tw-vite/index.html` (classes extraídas do TSX); prints `c1-local.png` e `c2-vite-tailwind.png`.
- **Correção:** a curto prazo, gere no `build-artifacts.mjs` uma seção "Receitas" na lite (e um campo `classes` no manifest) com a string de classes de cada variante, tirada do `cva`, mais um trecho HTML acessível para Button, Input/FormField, Card e Alert. A médio prazo, implemente o `@semec/ds-css` do ADR-004 (classes semânticas compiladas, ver Lacunas). Para não-React, troque o texto do prompt por "use a receita oficial".

### INT-A-03 — Os "Padrões de tela (sem React)" da lite só existem com Tailwind
- **Severidade:** Médio
- **Cenário:** 1 e 3
- **Passos:** a lite tem a seção "Sem Tailwind" e, depois, a seção "Padrões de tela (sem React)", com `mx-auto w-full max-w-[75rem] px-4`, `text-3xl font-bold`, `bg-destructive-surface text-destructive border-destructive`, `bg-primary`, `min-h-11 min-w-11`. Colá-los numa página só com `tokens.css`.
- **Esperado:** um equivalente em CSS puro (`var(--…)`) para quem seguiu o caminho "Sem Tailwind".
- **Obtido:** nenhuma classe tem efeito: botão cinza do navegador em Arial, `min-height: 0`, alerta sem cor e container sem largura máxima.
- **Evidência:** print `prints/c1-lite-sem-tailwind.png`; o estilo computado do botão é `background rgb(240,240,240)`, `font-family Arial`, `min-height 0px`.
- **Correção:** renomeie a seção para "Padrões de tela (Tailwind, sem React)" e acrescente, para cada padrão, a versão em CSS puro (ex.: erro de servidor = `background: var(--feedback-danger-surface); color: var(--feedback-danger); border: 1px solid var(--feedback-danger)`), ou aponte para o CSS pronto do INT-A-02.

### INT-A-04 — Seguir a lite gera um Button diferente do kit
- **Severidade:** Médio
- **Cenário:** 1 × 2
- **Passos:** montar o botão primário pela regra da lite ("Bordas: escolha pelo papel: controle `md`, cartão `lg`, pílula `full`"; "só os nove degraus… p-5, py-1.5 não") e comparar com as classes do `cva` do Button.
- **Esperado:** a lite e o componente seguem a mesma regra.
- **Obtido:** o Button usa `rounded-full` (pílula), `px-5` e, no tamanho `sm`, `py-1.5`, os dois fora da escala de nove degraus. O botão "pela lite" sai com `border-radius: 8px`, e o "pelo código" com `9999px`.
- **Evidência:** estilo computado `botao.border-radius` = `8px` em `c1-local` e `c3-php`, e `9999px` em `c2-vite-tailwind` e `c4-angular-tailwind`; compare `prints/c1-local.png` com `prints/c2-vite-tailwind.png`.
- **Correção:** na lite e no comentário do `tokens.css`, registre que o botão é pílula (`--radius-full`) e o campo é `md`. Decida se `px-5`/`py-1.5` entram na escala ou se o Button passa a `px-space-4`/`px-space-6`.

### INT-A-05 — `tokens.css` aplica um reset global, sem aviso no caminho "Sem Tailwind"
- **Severidade:** Médio
- **Cenário:** 1 (adoção incremental num sistema legado)
- **Passos:** `c1-html/legado.html` (HTML sem CSS) e `legado-tokens.html` (o mesmo, com `<link>` para `tokens.css`).
- **Esperado:** "só variáveis", ou o reset documentado como opt-in.
- **Obtido:** o `@layer base` faz `* { margin:0; padding:0 }`, `body` em Poppins com `--bg` e `a { text-decoration:none }` nos links com classe. O `h1` vai de 21,44px para 0px de margem e o `ul` de 40px para 0px de recuo (os marcadores somem), os parágrafos encostam uns nos outros, o botão perde o padding e os links com classe perdem o sublinhado. Regras legadas fora de camada vencem, mas o padrão do navegador, do qual muito sistema legado depende, some.
- **Evidência:** prints `prints/c1-legado.png` × `prints/c1-legado-tokens.png`; estilo computado do `h1` `margin-top 21.44px → 0px` e do `ul` `padding-left 40px → 0px`.
- **Correção:** separe em `variables.css` (só `:root`) + `base.css` (reset, foco, links, reduced motion) e mantenha o `tokens.css` como agregador para quem já usa. Na lite "Sem Tailwind", avise que o `tokens.css` traz reset e mostre como incluir só as variáveis.

### INT-A-06 — O foco visível do kit é anulado por qualquer regra legada fora de camada, e o axe não percebe
- **Severidade:** Médio
- **Cenário:** 6
- **Passos:** `c1-html/a11y-armadilhas.html` = `tokens.css` + um reset legado típico `a:focus, button:focus, input:focus { outline: 0; }`. Tab até o botão.
- **Esperado:** a lite promete que "O `tokens.css` já aplica, na camada base, `:focus-visible { outline… }`".
- **Obtido:** `outline: none` no botão focado. O axe dá 0 violações (ele não avalia 2.4.7 de forma confiável). Pela cascata de camadas, isso é esperado, mas a lite só explica o efeito das camadas no trecho do Tailwind.
- **Evidência:** `check.cjs c6-armadilhas … --tab 2` → `BUTTON outline=none 0px`; print `prints/c6-armadilhas-foco.png`.
- **Correção:** na lite "Sem Tailwind": "qualquer CSS seu fora de `@layer` vence a camada base; procure `outline: 0|none` no CSS legado". Inclua no checklist um teste manual de Tab ou um teste Playwright que confira `outline-style != none` no elemento focado (o script `_tools/check.cjs` serve de modelo).

### INT-A-07 — Importar o `tokens.css` por JS sem Tailwind gera avisos e leva CSS morto para produção
- **Severidade:** Médio
- **Cenário:** 4a e 4c (e 1, em bytes)
- **Passos:** Vue 3 + Vite 8 com `import '@semec/ds/lite/tokens.css'` no `main.js`, como a lite manda para bundler sem Tailwind; `npx vite build`.
- **Esperado:** build limpo e CSS só com o que o navegador usa.
- **Obtido:** 29 avisos `[lightningcss minify] Unknown at rule: @theme` (1) e `@utility` (28), cerca de 160 linhas de ruído por build. O CSS final mantém o `@theme` e os 28 `@utility`. No Angular 22, o build não avisa, mas o bundle também leva tudo. Medido: 56% do `tokens.css` sem comentários (9.930 de 17.891 bytes) é `@theme`/`@utility`, que o navegador descarta. O README full diz "nunca via import em JS", e a lite diz para importar no JS: as duas orientações divergem.
- **Evidência:** `c4-vue/build.log`; `grep -o "@theme\|@utility" dist/assets/*.css` → 1 e 28; idem em `c4-angular/dist/c4-angular/browser/styles-*.css`.
- **Correção:** publique `./lite/variables.css` (ou `tokens.plain.css`) sem `@theme`, `@utility` e `@property --tw-*`, gerado no build a partir do `tokens.css`, e use-o nas instruções sem Tailwind (`<link>`, CDN, import no JS).

### INT-A-08 — Com o Tailwind CLI, a Poppins dá 404, e a lite não avisa
- **Severidade:** Médio
- **Cenário:** 2b
- **Passos:** `npx @tailwindcss/cli -i src/input.css -o public/app.css` com os três `@import` da lite e servir `public/`.
- **Esperado:** as fontes carregam, ou a lite avisa.
- **Obtido:** o CLI mantém `url("./fonts/Poppins-*.woff2")` relativo ao `app.css`, gerando 4×404 e texto em `system-ui`. O README full documenta isso; a lite (que é o caminho de quem usa o CLI sem bundler) não fala do CLI.
- **Evidência:** `falhas: 404 http://localhost:8103/fonts/Poppins-400.woff2` (×4), print `prints/c2-cli-tailwind.png`; depois de `cp -r node_modules/@semec/ds/dist/react/fonts public/fonts`, as quatro carregam (`prints/c2-cli-tailwind-fontes-copiadas.png`).
- **Correção:** copie para a lite a nota do README sobre o `@tailwindcss/cli` e ofereça no `bin` um `npx semec-ds copiar-fontes <destino>` que copie `fonts.css` + `fonts/` (serve também ao PHP e ao Flask).

### INT-A-09 — Não existem tokens em formato de dados (JSON, DTCG, Style Dictionary)
- **Severidade:** Alto (bloqueia o uso fora da web: app mobile, Figma, geração de PDF ou e-mail no back-end)
- **Cenário:** 3 e 5
- **Passos:** procurar no pacote e no repositório `tokens.json`, `$value`, `dtcg` e `style-dictionary`; inspecionar `manifest.json` → `tokens`, o `pv-preset` e `@semec/ds/lite/skills` → `dsTokens`.
- **Esperado:** pelo ADR-003 (DTCG + Style Dictionary) e por `docs/arquitetura.md` §5.1, um `tokens.json` com valores.
- **Obtido:** nada no pacote. O `manifest.tokens` é `{"files":["tokens.css","fonts.css","pv-preset.ts"]}`. O `pv-preset` só tem `var(--…)`, e o `dsTokens` só tem nomes. O ADR-003 está marcado como "alvo; tokens ainda em CSS escrito à mão".
- **Evidência:** `grep -rl -i "dtcg\|\$value\|style-dictionary\|tokens.json"` no pacote extraído não retorna nada. Protótipo de viabilidade: `c5-node/gerar-dtcg.mjs` (30 linhas) extrai 115 tokens do `:root` com referências e valores resolvidos (ex.: `action-primary` → `{pv-blue-600}` → `#3a6ca6`), gerando `c5-node/tokens.dtcg.json`.
- **Correção:** a curto prazo, gere `dist/tokens/tokens.json` (DTCG, com `$value` por referência e o valor resolvido em `$extensions`) e `tokens.ts` no `build-artifacts.mjs` a partir do `tokens.css`, exportados em `./tokens.json`. A médio prazo, cumpra o ADR-003 (JSON como fonte, Style Dictionary gerando CSS, TS, JSON, Android e iOS). Ver custos em Lacunas.

### INT-A-10 — `dsTokens` (`@semec/ds/lite/skills`) está incompleto
- **Severidade:** Médio
- **Cenário:** 5
- **Passos:** `node c5-node/diff-tokens.mjs` compara os nomes do `:root` do `tokens.css` com `dsTokens`.
- **Esperado:** todos os L1 listados.
- **Obtido:** faltam 22 dos 68 L1, entre eles `--surface-sunken`, `--focus-ring-inverse`, `--tint`, `--text-brand`, `--brand-hero`, os quatro `--feedback-*-surface`, `--feedback-success-emphasis`, `--text-on-success-emphasis`, `--text-3xl`, `--text-display`, os oito `--leading-*` e `--easing-standard`. Um agente ou ferramenta que confie no `dsTokens` não conhece a cor de marca nem os fundos de feedback.
- **Evidência:** saída `L1 do tokens.css ausentes de dsTokens (22): …`.
- **Correção:** gere o `dsTokens` no build a partir do `:root` do `tokens.css` (o mesmo parser do INT-A-09), em vez da lista escrita à mão, e acrescente valores. Inclua o teste de paridade no `test:dist`.

### INT-A-11 — `require("@semec/ds/skills")` e `require("@semec/ds/lite/skills")` falham em CommonJS
- **Severidade:** Baixo
- **Cenário:** 5b
- **Passos:** `node -e 'require("@semec/ds/skills")'` e `node -e 'require("@semec/ds/lite/skills")'`.
- **Esperado:** funcionar, como `require("@semec/ds/skills/manifest.js")`, que funciona no Node 24 (require de ESM).
- **Obtido:** `Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './skills' is not defined by "exports"`: as duas entradas só têm a condição `import`. Os `manifest.json` funcionam com `require` e com `import … with {type:"json"}`.
- **Evidência:** saída dos comandos acima, no projeto `c5-node`.
- **Correção:** acrescente `"default": "./dist/skills/index.js"` (e o equivalente na lite) depois de `import`. Com `engines.node >=22`, o `require(esm)` resolve.

### INT-A-12 — No jsDelivr, os caminhos do `exports` dão 404 e a página fica sem estilo; a documentação não fala de CDN
- **Severidade:** Baixo
- **Cenário:** 1c–1e
- **Passos:** `curl` e Playwright com `https://cdn.jsdelivr.net/npm/@semec/ds@4.2.0/react/tokens.css` e `…/lite/tokens.css`.
- **Esperado:** os mesmos caminhos públicos do `exports` servem também no CDN, ou a doc informa o caminho certo.
- **Obtido:** o unpkg resolve o `exports` (200 em `/react/tokens.css`); o jsDelivr não (404, e o Chromium bloqueia com `ERR_BLOCKED_BY_ORB`, sem nenhum estilo). Pelo caminho `dist/react/…` (CSS e woff2), os dois respondem 200, e as fontes carregam pelo caminho relativo. A raiz do pacote dá 404 nos dois (não há `main`, `style` nem `unpkg`). Há ainda um `tokens.css` solto na raiz do pacote, duplicado de `dist/react/tokens.css`.
- **Evidência:** prints `prints/c1-unpkg.png`, `c1-jsdelivr.png` e `c1-jsdelivr-exports.png` (sem estilo); tabela de `curl` com códigos 200/404.
- **Correção:** na lite, inclua um bloco "Via CDN" com `https://cdn.jsdelivr.net/npm/@semec/ds@4.2.1/dist/react/fonts.css` e `…/tokens.css` (versão fixa e SRI) e declare `"style"`/`"jsdelivr"`/`"unpkg": "./dist/react/tokens.css"` no `package.json`.

### INT-A-13 — Quem só quer CSS instala 64 MB (React, lucide, Tailwind) para usar 76 KB
- **Severidade:** Baixo (a lite documenta)
- **Cenário:** 1, 3 e 4
- **Passos:** `npm i C:/dev/semec-int/semec-ds-4.2.0.tgz` num projeto vazio (`c3-php`) e `du -sh`.
- **Obtido:** `node_modules` com 64 MB e 20 pacotes (lucide-react 45 MB, react-dom 7,8 MB, tailwindcss 0,8 MB). O que se usa (`tokens.css` + `fonts/`) soma 76 KB. Num projeto Angular, o npm instala `react` e `react-dom` como peers.
- **Evidência:** `du -sh node_modules` → `64M`.
- **Correção:** publique um pacote leve (`@semec/ds-tokens`, só CSS, fontes e JSON, sem dependências) ou marque `react`, `react-dom`, `lucide-react` e `tailwindcss` como `peerDependenciesMeta.optional`.

### INT-A-14 — Os nomes dos utilitários não seguem os nomes dos tokens, e utilitários fora da escala continuam gerados
- **Severidade:** Baixo (parte está documentada)
- **Cenário:** 2
- **Passos:** `c2-tw-vite/sonda.html` com candidatos naturais; `vite build`; contar seletores gerados.
- **Obtido:** não existem `text-fg`, `bg-bg`, `bg-action-primary`, `bg-feedback-danger`, `text-feedback-danger` nem `text-brand` (o token é `--fg`, `--bg`, `--action-primary`…). `text-muted` e `text-secondary` são gerados como `color: var(--surface-alt)` (texto invisível, AUD-30). `rounded-xl` continua gerado, embora a doc diga para não usar.
- **Evidência:** contagem de seletores no CSS de `c2-tw-vite/dist` (`text-fg 0`, `bg-bg 0`, `text-muted 1 → color:var(--surface-alt)`, `rounded-xl 1`).
- **Correção:** no `@theme`, anule os nomes fora da escala (`--radius-xl: initial` e afins) e as armadilhas (`--color-muted`/`--color-secondary` como texto). Avalie apelidos `--color-fg`/`--color-bg`/`--color-action-primary` para casar com o nome do token.

## Contagem por severidade

| Severidade | Qtde | IDs |
|---|---|---|
| Bloqueante | 0 | — |
| Alto | 3 | INT-A-01, INT-A-02, INT-A-09 |
| Médio | 7 | INT-A-03, INT-A-04, INT-A-05, INT-A-06, INT-A-07, INT-A-08, INT-A-10 |
| Baixo | 4 | INT-A-11, INT-A-12, INT-A-13, INT-A-14 |

## Lacunas estruturais (o que o kit precisa para servir sistemas sem React)

| # | Lacuna | O que entregar | Custo estimado |
|---|---|---|---|
| L1 | **CSS de componentes pronto** (ADR-004, `@semec/ds-css`, fase F4) | Classes semânticas compiladas (`.semec-btn`, `.semec-btn--primary`, `.semec-field`, `.semec-card`, `.semec-alert--danger`…), geradas dos mesmos `cva` por `@apply` num build Tailwind e servidas por `<link>`/CDN. Começar pelos ~10 componentes de formulário e shell (Button, Input, Label/FormField, ErrorSummary, Card, Alert, Header, Footer, SkipLink, Table). Contrato de nomes vira API pública | 5–8 dias para os 10 primeiros (build + regressão visual contra o React); +1 a 2 semanas para cobrir o resto |
| L2 | **Tokens como dados** (ADR-003) | `tokens.json` DTCG + `tokens.ts` derivados do CSS no `build-artifacts.mjs` (protótipo de 30 linhas em `c5-node/gerar-dtcg.mjs`) | 0,5–1 dia (derivado) |
| L2b | ADR-003 completo | JSON como fonte, Style Dictionary gerando CSS/TS/JSON/Android (XML)/iOS (Swift), paridade na CI, import no Figma (Tokens Studio) | 3–5 dias + 2–3 dias para as saídas mobile e Figma |
| L3 | **CSS só de variáveis** | `variables.css` (sem `@theme`, `@utility`, `@property` e reset) + `base.css` opcional; `tokens.css` continua como agregador | 0,5 dia |
| L4 | **Receitas na skill lite** | Seção "Receitas" gerada do `cva`: classes Tailwind por variante + trecho HTML acessível + equivalente em CSS puro; `classes` no manifest | 1–2 dias |
| L5 | **Parciais para template de servidor** | Exemplos oficiais em Jinja, Twig/Blade e PHP puro para campo com erro, alerta, resumo de erros e cabeçalho (dependem de L1 ou L4) | 2–3 dias |
| L6 | **Pacote leve sem peers** | `@semec/ds-tokens` (CSS, fontes, JSON) ou peers opcionais | 1 dia + ajuste de publicação |
| L7 | **Guia "Usar sem React"** no site e na lite | CDN com versão e SRI, CLI do Tailwind, reset, armadilhas de foco, comando `copiar-fontes` | 1 dia |
| L8 | (Opcional) **Web Components** para os interativos (Dialog, Tabs, Combobox) em sistemas sem framework | Comportamento acessível sem React | 3–4 semanas; só se houver demanda |

## Projetos e evidências

- `c1-html/` — `local.html`, `nm.html`, `unpkg.html`, `jsdelivr.html`, `jsdelivr-exports.html`, `legado*.html`, `lite-sem-tailwind.html`, `a11y-armadilhas.html` (servidos por `python -m http.server 8101`)
- `c2-tw-vite/` (Vite 8 + `@tailwindcss/vite`, `sonda.html`) e `c2-tw-cli/` (`@tailwindcss/cli`)
- `c3-php/public/index.php` (Docker `php:8-cli`, porta 8104) e `c3-flask/` (`app.py`, `templates/macros.html`, porta 8105)
- `c4-vue/` (CSS puro), `c4-vue-tw/`, `c4-angular/` (CSS puro), `c4-angular-tw/` (PostCSS)
- `c5-node/` — `diff-tokens.mjs`, `gerar-dtcg.mjs`, `tokens.dtcg.json`
- `shared/app.css` e `shared/corpo.html` — a receita escrita à mão para o mesmo formulário
- `prints/` — 28 PNG (`*-foco.png` = depois de Tab)
