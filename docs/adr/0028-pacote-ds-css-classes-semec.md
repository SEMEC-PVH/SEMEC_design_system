---
adr: 28
titulo: "Pacote @semec/ds-css e contrato de classes .semec-*"
status: Aceito
data: 2026-10-19
---

# ADR-028 — Pacote `@semec/ds-css` e contrato de classes `.semec-*`

**Status:** Aceito (19/10/2026, onda 2 da issue #74). Entrega a fase F4 da [arquitetura](../arquitetura.md) prevista no [ADR-004](0004-tailwind-v4-cva-css-compilado.md).

**Contexto.** O [ADR-004](0004-tailwind-v4-cva-css-compilado.md) decidiu publicar o CSS já compilado, com classes semânticas, para páginas HTML sem pipeline de build. Até a 4.4.0 isso não existia: quem não usa React tinha duas saídas, ambas frágeis. A primeira era copiar as "receitas" do manifest (INT-A-02): CSS puro com uma classe por combinação (`semec-button-primary-sm`), sem modificadores e com o preflight inteiro do Tailwind junto, que reseta a página toda. A segunda era reescrever o visual à mão, como fez o protótipo HTML da transferência escolar nos testes de integração (`app.css` com `.botao--primario`, `.cartao`, `.resumo`). Cada cópia à mão diverge do React na primeira mudança de `cva`. Os sistemas que mais precisam disso são as telas PHP e HTML da prefeitura, onde não há bundler nem React.

Restrições: o visual tem de ser igual ao do componente React (mesmo token, mesmo anel de foco, mesma altura de 44 px); WCAG 2.1 AA é bloqueante ([ADR-014](0014-wcag-21-aa-criterio-bloqueante.md)); nada de cor literal fora dos tokens; o `@semec/ds` 4.4.0 não muda nesta onda.

**Decisão.** Criamos o pacote `@semec/ds-css` (`packages/css/`), sem React, que depende só do `@semec/ds-tokens` ([ADR-026](0026-pacote-ds-tokens-saidas-por-plataforma.md)).

1. **Publicação.** Três exports: `components.css` (só as classes `.semec-*`, com `var(--…)`, sem tokens nem reset global), `index.css` (`@import` do `tokens.css` e do `base.css` do `@semec/ds-tokens` + `components.css`, para bundler) e `dist/semec-ds.css` (arquivo único minificado, para `<link>`/CDN). As fontes continuam no `@semec/ds-tokens`.
2. **Contrato de nomes (API pública, BEM curto).** Bloco `semec-<componente>`, elemento `__parte`, modificador `--variante`: `semec-btn--primary`, `semec-card__title`, `semec-alert--danger`, `semec-heading--1`. Os modificadores de variante e tamanho são os valores do `cva` do componente React; o padrão do `cva` vale sem modificador (`semec-btn` = primário médio). Estados por atributo nativo ou ARIA, nunca por classe: `:disabled`/`[aria-disabled="true"]`, `[aria-invalid="true"]`, `[aria-current="page"]`, `:checked`, `:focus-visible`. A lista completa está no README do pacote e em `classes.json`. Renomear ou remover uma classe é mudança *major* do pacote.
3. **Geração, nunca cópia.** O build lê o TSX do kit (`packages/react/src/components`) com o avaliador das receitas (`readComponentClasses`) e aplica as classes reais com `@apply` do Tailwind v4, usando o `tokens.css` do kit como referência. Variantes viram modificadores por **decomposição**: para cada combinação de props, o conjunto final de classes do React (já com o `twMerge`) é dividido em base ∩ e modificadores por dimensão; o build falha se base + modificadores não reproduzirem o conjunto do React em alguma combinação. A saída é CSS padrão, achatado (sem nesting) pelo Lightning CSS com os alvos do Tailwind.
4. **Adaptações mínimas para HTML sem Radix**, todas trocando só o *seletor* do estado: `disabled:` ganha o par `aria-disabled:`; `data-[state=checked]:` do Radix vira `:checked` do input nativo (checkbox e rádio, com o ícone Lucide do React como `mask`); `peer-disabled:` vira `:has(:disabled)` na linha `.semec-choice`; o `[toast-close]` do Toast vira `.semec-toast__close`; `data-state`/`data-swipe` do Toast saem (o comportamento é do app).
5. **Base escopada.** O preflight do Tailwind (fonte herdada em controles, borda zerada, lista sem marcador) é necessário para a paridade, mas vale só para elementos com classe `semec-*`, em `@layer base` e com `:where` (especificidade zero). As classes ficam fora de `@layer`, com especificidade de uma classe, para ganhar do CSS legado por elemento (`button {…}`) e perder para uma classe do app carregada depois.
6. **Paridade testada.** `npm run test --workspace @semec/ds-css` compara, no Chromium (Playwright), cada classe/variante com o componente React renderizado do `dist` do kit: estilo computado (cor, fundo, borda, raio, padding, fonte, altura, sombra, contorno) em repouso, `:hover` e `:focus-visible` (forçados via CDP), mais screenshot lado a lado dos principais com tolerância de 1%. Também roda axe-core e teclado numa página de exemplo, alvo de 44 px, layout em 375 px e limite de tamanho. A única divergência aceita é o `line-height` do `<select>` nativo, que o Chromium fixa em `normal` (altura, padding e fonte iguais).

Fora do escopo: comportamento (abrir/fechar, foco, temporizador), componentes que dependem de Radix sem equivalente nativo (Dialog, Select customizado, Combobox, Tabs…), tema escuro e multi-órgão ([ADR-025](0025-tema-unico-claro.md)).

**Alternativas descartadas.**

- *Manter só as receitas do manifest.* Uma classe por combinação (`semec-button-outline-lg`) não forma uma API legível, e o preflight global reseta a página do consumidor.
- *Escrever o CSS à mão a partir dos tokens.* É o que os protótipos fizeram, e cada mudança de `cva` exigiria lembrar de atualizar dois lugares. Sem teste de paridade, a divergência aparece só na tela.
- *Gerar uma utilidade Tailwind por componente e pedir Tailwind ao consumidor.* Atende quem já tem build, mas não o PHP e o HTML puro, que são o público da fase F4.
- *Publicar o `styles.css` do kit (utilitários) e documentar as classes Tailwind.* Já existe; exige copiar listas longas de utilitários e quebra quando o kit troca uma classe.
- *Colocar as classes em `@layer components`.* Qualquer CSS legado sem camada (`input { border: … }`) passaria por cima, independentemente da especificidade.

**Consequências.**

- HTML, PHP e outras stacks usam o mesmo visual do React com um `<link>`. O formulário de transferência escolar foi refeito só com as classes do pacote, servido por PHP (`php:8-cli`) e por HTML estático, com axe 0 e teclado OK.
- O pacote acompanha o kit: mudança de `cva` ou de classe num componente coberto muda o CSS no próximo build, e o teste de paridade acusa diferença de aparência. Componente novo no contrato exige entrada em `scripts/rules.mjs`, caso de paridade e README.
- O build do `@semec/ds-css` depende do código-fonte do kit no monorepo (não do pacote publicado) e o teste depende do `dist` do kit (`npm run build:ds` antes).
- `components.css` contém variáveis internas `--tw-*` e `@property` do Tailwind (anel de foco, sombra). São detalhe de implementação, não tokens; o app não deve depender delas.
- Comportamento continua sendo do app: o README mostra o HTML e os atributos ARIA de cada componente e o que o JavaScript precisa fazer (foco no resumo de erros, região viva do aviso).
- Fica para depois: o `@semec/ds` passar a consumir o `@semec/ds-tokens`/`@semec/ds-css` e um gerador automático de exemplos HTML a partir do manifest.
