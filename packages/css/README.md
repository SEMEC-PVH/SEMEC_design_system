# @semec/ds-css

CSS puro do Design System SEMEC (Prefeitura de Porto Velho). Classes `.semec-*` prontas para HTML, PHP, Vue, Angular ou qualquer página sem React e sem Tailwind.

As classes saem dos **mesmos `cva` e classes dos componentes React** do [`@semec/ds`](https://www.npmjs.com/package/@semec/ds): o build lê o TSX do kit e compila com o Tailwind v4. Um teste de paridade compara cada classe com o componente React (estilo computado e screenshot no Chromium). Por isso `.semec-btn` tem a mesma cor, o mesmo raio, o mesmo padding, a mesma fonte e o mesmo anel de foco que `<Button>`. Decisão registrada no [ADR-028](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/adr/0028-pacote-ds-css-classes-semec.md).

Os tokens (cores, espaçamento, tipografia) e a base (reset, foco, links, menos movimento) vêm do [`@semec/ds-tokens`](https://www.npmjs.com/package/@semec/ds-tokens), que é instalado junto. As fontes Poppins também ficam lá.

## Instalação

```bash
npm install @semec/ds-css
```

O pacote publica três arquivos:

| Export | Conteúdo | Quando usar |
|---|---|---|
| `@semec/ds-css/dist/semec-ds.css` | Arquivo único: tokens + base + componentes, minificado | `<link>`, CDN, PHP, HTML sem build |
| `@semec/ds-css/index.css` | `@import` dos tokens e da base do `@semec/ds-tokens` + `components.css` | Projeto com bundler (Vite, webpack, esbuild) |
| `@semec/ds-css/components.css` | Só as classes `.semec-*` (sem tokens e sem reset global) | Quando os tokens e a base já são carregados por outro caminho |

## Uso sem bundler (`<link>` ou CDN)

Copie para o projeto as pastas publicadas (ou use um CDN de npm) e carregue as fontes antes do CSS:

```html
<!-- Fontes: o fonts.css precisa da pasta fonts/ ao lado dele. -->
<link rel="stylesheet" href="vendor/semec-ds-tokens/fonts.css">
<link rel="stylesheet" href="vendor/semec-ds-css/semec-ds.css">
```

Pelo CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@semec/ds-tokens@1/fonts.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@semec/ds-css@1/dist/semec-ds.css">
```

Em PHP, o mesmo `<link>` vai no layout (`<head>`) da aplicação. O CSS não precisa de JavaScript.

## Uso com bundler

```css
/* app.css */
@import "@semec/ds-tokens/fonts.css";
@import "@semec/ds-css/index.css";
```

ou, no JavaScript de entrada:

```js
import "@semec/ds-tokens/fonts.css";
import "@semec/ds-css/index.css";
```

## Precedência e personalização

- As classes `.semec-*` ficam **fora de `@layer`** e têm especificidade de uma classe. Uma regra sua com uma classe, carregada depois, ganha delas.
- A base de cada componente (o preflight do Tailwind que o React também recebe: fonte herdada em `button`/`input`, borda zerada, lista sem marcador) vale **só para elementos com classe `semec-*`**, em `@layer base` e com especificidade zero (`:where`). O resto da sua página não é resetado por este pacote.
- Os modificadores (`--primary`, `--sm`…) usam `:where(:not(…))` para o padrão: `class="semec-btn"` já é o botão primário médio.
- Não use cor literal: personalize pelos tokens (`var(--action-primary)`, `var(--space-4)`…) do `@semec/ds-tokens`.

## Navegadores

Os mesmos do kit React (alvos do Tailwind v4): Chrome/Edge 111+, Safari 16.4+ e Firefox 128+. Em navegador mais antigo, `color-mix()` e `@property` caem em fallbacks (cor sólida, anel de foco ainda visível).

## Modelos de servidor

A pasta [`templates/`](templates/README.md) traz parciais prontas em PHP puro, Jinja2 (Django com django-jinja, Flask), Twig e Blade: `pagina`, `pular-para-o-conteudo`, `cabecalho`, `rodape`, `campo`, `resumo-de-erros`, `alerta` e `botao`. Mesmos nomes e parâmetros nas quatro linguagens, escape em toda saída e o HTML desta página, testado contra um HTML canônico único (ADR-030). A tabela de parâmetros está no [README dos modelos](templates/README.md).

## Componentes

O CSS cuida da aparência. Comportamento (foco no resumo de erros, região viva do aviso, fechar) é do seu app, com HTML nativo e JavaScript. Os exemplos abaixo são o HTML recomendado, com os atributos ARIA necessários. Nos componentes interativos (diálogo, abas, combobox, menu e accordion), o comportamento vem pronto nos elementos `<semec-*>` do [`@semec/ds-elements`](#componentes-interativos).

Uma página completa (formulário de transferência escolar com validação, resumo de erros, tabela e aviso) está em [`examples/transferencia.html`](examples/transferencia.html).

### Pular para o conteúdo

Primeiro elemento focável da página. Fica oculto até receber foco pelo teclado.

```html
<a href="#conteudo" class="semec-skip-link">Pular para o conteúdo principal</a>
…
<main id="conteudo" tabindex="-1">…</main>
```

O `tabindex="-1"` no `<main>` deixa o foco ir para o conteúdo ao ativar o link.

### Cabeçalho

```html
<header class="semec-header">
  <a href="/" class="semec-header__brand">
    <img src="marca.svg" alt="Prefeitura de Porto Velho" width="90" height="36">
    <span aria-hidden="true" class="semec-header__divider"></span>
    <span class="semec-header__org">SEMEC <span aria-hidden="true" class="semec-header__separator">|</span> <span class="semec-header__service">Matrícula e transferência</span></span>
    <span class="semec-sr-only">— ir para o início</span>
  </a>
  <nav aria-label="Menu principal" class="semec-header__nav">
    <a href="/matricula" class="semec-header__link">Matrícula</a>
    <a href="/transferencia" class="semec-header__link" aria-current="page">Transferência</a>
  </nav>
</header>
```

Só o link da página atual leva `aria-current="page"`; o estilo de "atual" vem desse atributo. Mantenha os espaços entre os `<span>`: eles separam as palavras no nome acessível do link.

### Títulos

```html
<h1 class="semec-heading semec-heading--1">Solicitação de transferência escolar</h1>
<h2 class="semec-heading semec-heading--2">Minhas solicitações</h2>
```

Escala: `--1` 32 px, `--2` 24 px, `--3` 20 px, `--4` 16 px (também `--5` e `--6`). O nível (`h1`–`h6`) segue a estrutura da página; o modificador segue o visual. `semec-heading` sozinho é o tamanho 2, e `class="semec-heading--3"` sozinho também funciona.

### Botão

```html
<button type="submit" class="semec-btn semec-btn--primary">Revisar e enviar</button>
<button type="reset" class="semec-btn semec-btn--outline">Limpar formulário</button>
<button type="button" class="semec-btn semec-btn--ghost semec-btn--sm">Cancelar</button>
<button type="button" class="semec-btn semec-btn--icon semec-btn--ghost" aria-label="Fechar">
  <svg aria-hidden="true" …></svg>
</button>
<a href="/comprovante.pdf" class="semec-btn semec-btn--secondary">Baixar comprovante</a>
```

- Variantes: `--primary` (padrão), `--secondary`, `--outline`, `--ghost`, `--destructive`, `--success`, `--link`.
- Tamanhos: `--sm` (36 px de altura visual, área de toque de 44 px), `--md` (padrão, 44 px), `--lg` (48 px), `--icon` (44 × 44; exige `aria-label`).
- Desabilitado: `disabled` no `<button>`. Num link, use `aria-disabled="true"` e tire o `href` (ou bloqueie o clique no JS): o CSS apaga e corta o ponteiro, mas o Enter do teclado continua ativando um link com `href`.

### Formulário

```html
<div class="semec-form-field">
  <label for="email" class="semec-label">E-mail<span class="semec-label__required" aria-hidden="true"> *</span></label>
  <input id="email" name="email" type="email" autocomplete="email" required
         class="semec-field" aria-describedby="email-hint">
  <p id="email-hint" class="semec-hint">Usaremos para enviar o protocolo.</p>
</div>
```

Com erro, troque a dica pela mensagem e marque o campo:

```html
<div class="semec-form-field">
  <label for="email" class="semec-label">E-mail<span class="semec-label__required" aria-hidden="true"> *</span></label>
  <input id="email" name="email" type="email" required class="semec-field"
         aria-invalid="true" aria-describedby="email-error">
  <p id="email-error" class="semec-error">Informe um e-mail válido.</p>
</div>
```

- `.semec-field` vale para `<input>`, `<select>` e `<textarea>`. Estados: `:focus-visible` (anel), `[aria-invalid="true"]` (borda e anel de perigo), `:disabled`/`[aria-disabled="true"]`.
- O `*` é visual (`aria-hidden`); a obrigatoriedade vai no `required` do campo. Diga na página que "campos com * são obrigatórios".
- Abaixo de 640 px o `<input>` e o `<textarea>` usam 16 px (o iOS não amplia a página ao focar).
- O `<select>` é o nativo do navegador: teclado e lista são do sistema. A seta é a nativa.
- Não use `role="alert"` em cada mensagem de erro; anuncie no envio com o resumo de erros.

#### Checkbox e rádio

Inputs nativos estilizados. Envolva cada um num `<label class="semec-choice">`: a linha inteira é clicável e tem pelo menos 44 px de altura.

```html
<label class="semec-choice">
  <input type="checkbox" name="declaracao" class="semec-checkbox" required>
  Declaro que as informações são verdadeiras
</label>

<fieldset class="semec-form-field">
  <legend class="semec-label">Turno desejado<span class="semec-label__required" aria-hidden="true"> *</span></legend>
  <label class="semec-choice"><input type="radio" name="turno" value="manha" class="semec-radio" required> Manhã</label>
  <label class="semec-choice"><input type="radio" name="turno" value="tarde" class="semec-radio"> Tarde</label>
</fieldset>
```

Inválido: `aria-invalid="true"` no input (ou no grupo, que passa a borda de perigo aos rádios de dentro) e a mensagem `.semec-error` ligada por `aria-describedby`.

### Resumo de erros

```html
<div id="resumo" class="semec-error-summary" role="alert" tabindex="-1" aria-labelledby="resumo-titulo">
  <h2 id="resumo-titulo" class="semec-error-summary__title">Há um problema</h2>
  <ul class="semec-error-summary__list">
    <li><a href="#email">Informe um e-mail válido.</a></li>
  </ul>
</div>
```

A cada envio inválido, mostre o resumo e mova o foco para ele (`resumo.focus()`); não mova o foco enquanto a pessoa digita. Cada link leva ao campo (`href="#id"`) e, com JavaScript, foca o campo. Os links da lista não precisam de classe (`.semec-error-summary__link` também existe).

### Cartão

```html
<section class="semec-card" aria-labelledby="titulo-dados">
  <div class="semec-card__header">
    <h2 id="titulo-dados" class="semec-card__title">Dados da solicitação</h2>
    <p class="semec-card__description">Confira os dados antes de enviar.</p>
  </div>
  <div class="semec-card__content">…</div>
  <div class="semec-card__footer">Protocolo disponível após o envio.</div>
</section>
```

Escolha o nível do título conforme a hierarquia da página.

### Alerta

```html
<div role="status" class="semec-alert semec-alert--info">
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
  <div class="semec-alert__title">Prazo de transferência</div>
  <div class="semec-alert__description"><p>As solicitações vão até 30 de novembro.</p></div>
</div>
```

- Variantes: `--info` (padrão), `--success`, `--warning`, `--danger`.
- O ícone (primeiro `<svg>` filho) é decorativo e herda a cor da variante; escreva o significado no texto. Os ícones do kit React são do [Lucide](https://lucide.dev) (`info`, `circle-check`, `triangle-alert`, `circle-alert`).
- `role="alert"` só para erro dinâmico urgente (`--danger`); os demais, `role="status"`. Aviso que já está na página ao carregar pode ficar sem `role`.

### Tabela

```html
<div class="semec-table__wrapper" role="region" aria-label="Solicitações de transferência" tabindex="0">
  <table class="semec-table">
    <caption class="semec-table__caption">Solicitações de transferência enviadas</caption>
    <thead>
      <tr><th scope="col">Protocolo</th><th scope="col">Situação</th></tr>
    </thead>
    <tbody>
      <tr><td>2026-000318</td><td><span class="semec-badge semec-badge--success">Deferida</span></td></tr>
    </tbody>
  </table>
</div>
```

O wrapper rola na horizontal em tela estreita. `role="region"`, `aria-label` e `tabindex="0"` deixam a rolagem acessível pelo teclado (o foco do wrapper usa o anel da base). `th`, `td`, `tr`, `thead`, `tbody`, `tfoot` e `caption` dentro de `.semec-table` não precisam de classe.

### Badge

```html
<span class="semec-badge semec-badge--warning">Em análise</span>
```

Variantes do Badge React: padrão (`--default`), `--secondary`, `--outline`, `--success`, `--warning`, `--danger`, `--info`. Escreva o estado no texto; não dependa só da cor. Badge não é botão.

### Aviso (toast)

Só a aparência. A região viva, o tempo de exibição e o fechar são do app.

```html
<!-- Crie a região vazia ao carregar a página; insira o aviso dentro dela. -->
<div role="status" aria-live="polite" aria-atomic="true" class="avisos">
  <div class="semec-toast semec-toast--success">
    <div class="semec-toast__body">
      <p class="semec-toast__title">Solicitação enviada</p>
      <p class="semec-toast__description">Protocolo 2026-000331.</p>
    </div>
    <button type="button" class="semec-toast__action">Ver</button>
    <button type="button" class="semec-toast__close" aria-label="Fechar notificação">
      <svg aria-hidden="true" …></svg>
    </button>
  </div>
</div>
```

Variantes: `--info` (padrão), `--success`, `--warning`, `--danger`. Ao fechar, devolva o foco para um lugar que faça sentido. O posicionamento (fixo no canto, por exemplo) fica no CSS do app.

### Rodapé

```html
<footer class="semec-footer">
  <div class="semec-footer__content">
    <div class="semec-footer__section">
      <h2 class="semec-footer__title">Serviços</h2>
      <ul class="semec-footer__links">
        <li><a href="/matricula" class="semec-footer__link">Matrícula</a></li>
      </ul>
    </div>
  </div>
  <div class="semec-footer__bottom">© 2026 Prefeitura de Porto Velho · SEMEC</div>
</footer>
```

Um rodapé por página, irmão do `<main>`.

## Componentes interativos

Diálogo, abas, combobox, menu e accordion têm as mesmas classes geradas do TSX do kit, mas precisam de JavaScript para abrir, fechar e navegar pelo teclado. Esse comportamento está nos Web Components do **`@semec/ds-elements`** (`<semec-dialog>`, `<semec-tabs>`, `<semec-combobox>`, `<semec-menu>` e `<semec-accordion>`): HTML semântico com as classes deste pacote, sem shadow DOM; o elemento só acrescenta comportamento e ARIA, no padrão WAI-ARIA APG, como o Radix faz no React.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@semec/ds-tokens@1/fonts.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@semec/ds-css@1/dist/semec-ds.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@semec/ds-elements@1/dist/semec-elements.js"></script>
```

**Estados pelos atributos do Radix, nunca por classe.** O CSS lê os mesmos atributos que o Radix põe no React e que os elementos `<semec-*>` põem no HTML. Se você escrever o seu próprio JavaScript, ponha estes:

| Atributo | Onde |
|---|---|
| `data-state="open"` / `"closed"` | `<dialog>`, popup do menu, listbox do combobox, item, gatilho e painel do accordion |
| `data-state="active"` / `"inactive"` | gatilho e painel das abas |
| `data-highlighted` (presente) | item ativo do menu, opção ativa do combobox (a que o Enter escolhe) |
| `data-disabled` (presente) | item, aba ou opção desabilitados (no `<button>`, use também `disabled`) |
| `aria-selected="true"` | opção escolhida do combobox, aba ativa |
| `aria-expanded` | gatilhos (botão do menu, campo do combobox, botão do accordion) |
| `hidden` | painel ou popup fechado: quem esconde é o atributo, não o CSS |
| `data-side="top"` | popup que não cabe embaixo do gatilho (o CSS o põe em cima) |

**Popup sem biblioteca de posicionamento.** O listbox do combobox e o popup do menu são `position: absolute` logo abaixo do gatilho (4 px, o `sideOffset` do React), dentro do wrapper relativo (`.semec-combobox` ou o próprio `<semec-combobox>`; no menu, o `<semec-menu>`), com largura mínima igual à do wrapper e `z-index` 50 (a camada de sobreposição do kit). Com `data-side="top"`, o popup sobe para cima do gatilho.

Os ícones (X do fechar, seta do accordion, check da opção escolhida) são o mesmo ícone lucide do React, desenhados pelo CSS como máscara na cor do texto: não é preciso colar `<svg>` (se houver um `<svg>` com a classe, ele também funciona).

### Diálogo

`.semec-dialog` vai no `<dialog>` nativo (aberto com `showModal()`); o fundo escurecido é o `::backdrop`. Para confirmação destrutiva, use o modificador `--alert` (o AlertDialog do React) e o atributo `alert` no elemento: não fecha no clique fora e o foco começa no botão de cancelar.

```html
<button type="button" class="semec-btn semec-btn--destructive" data-semec-dialog-open="cancelar">Cancelar solicitação</button>

<semec-dialog id="cancelar">
  <dialog class="semec-dialog">
    <div class="semec-dialog__header">
      <h2 class="semec-dialog__title">Cancelar a solicitação?</h2>
      <p class="semec-dialog__description">O protocolo 2026-000318 deixa de valer.</p>
    </div>
    <p>Você pode fazer uma nova solicitação depois.</p>
    <div class="semec-dialog__footer">
      <button type="button" class="semec-btn semec-btn--outline" data-semec-dialog-close>Voltar</button>
      <button type="button" class="semec-btn semec-btn--destructive">Cancelar solicitação</button>
    </div>
    <button type="button" class="semec-dialog__close" data-semec-dialog-close>
      <span class="semec-sr-only">Fechar</span>
    </button>
  </dialog>
</semec-dialog>

<!-- Confirmação destrutiva (AlertDialog): sem o botão X. -->
<semec-dialog alert id="excluir">
  <dialog class="semec-dialog semec-dialog--alert">
    <div class="semec-dialog__header">
      <h2 class="semec-dialog__title">Excluir o rascunho?</h2>
      <p class="semec-dialog__description">Esta ação não pode ser desfeita.</p>
    </div>
    <div class="semec-dialog__footer">
      <button type="button" class="semec-btn semec-btn--outline" data-semec-dialog-close>Cancelar</button>
      <button type="button" class="semec-btn semec-btn--destructive">Excluir</button>
    </div>
  </dialog>
</semec-dialog>
```

O elemento põe `data-state`, `aria-labelledby`/`aria-describedby` (de `__title`/`__description`), `role="alertdialog"` e `aria-modal` no `alert`, trava a rolagem e devolve o foco ao gatilho ao fechar. O botão de fechar fica por último no `<dialog>` (como no React) e tem nome acessível pelo texto oculto. O `<dialog>` fechado continua oculto mesmo com o `display: grid` do painel.

### Abas

```html
<semec-tabs class="semec-tabs" value="dados">
  <div class="semec-tabs__list" role="tablist" aria-label="Solicitação">
    <button type="button" role="tab" class="semec-tabs__trigger" aria-controls="aba-dados" aria-selected="true">Dados</button>
    <button type="button" role="tab" class="semec-tabs__trigger" aria-controls="aba-documentos">Documentos</button>
    <button type="button" role="tab" class="semec-tabs__trigger" aria-controls="aba-historico" disabled>Histórico</button>
  </div>
  <div id="aba-dados" role="tabpanel" class="semec-tabs__panel">Dados do estudante e da escola de destino.</div>
  <div id="aba-documentos" role="tabpanel" class="semec-tabs__panel">Documentos enviados.</div>
  <div id="aba-historico" role="tabpanel" class="semec-tabs__panel">Histórico da solicitação.</div>
</semec-tabs>
```

Sem JavaScript, todos os painéis ficam visíveis, um abaixo do outro. Com o elemento, a aba ativa recebe `data-state="active"`, `aria-selected="true"` e a barra de 3 px em `primary` (não depende só de cor), os painéis inativos recebem `hidden` e o painel ativo é focável (`tabindex="0"`, com o anel de foco do kit). `.semec-tabs` não tem estilo próprio (o `Tabs` do React também não): é o gancho do elemento.

### Combobox

O campo (`__input`) tem a aparência do gatilho do Combobox React; a lista (`__listbox`) e a mensagem sem resultado (`__empty`) são o popover. O `<select>` nativo é a fonte das opções e o valor do formulário: sem JavaScript, ele funciona sozinho.

```html
<label for="escola" class="semec-label">Escola de destino</label>
<semec-combobox class="semec-combobox">
  <select id="escola" name="escola" class="semec-field">
    <option value="">Selecione…</option>
    <option value="centro">Escola Centro</option>
    <option value="norte">Escola Norte</option>
  </select>
</semec-combobox>
```

Depois que o elemento sobe (o `<select>` fica `hidden` e continua no formulário):

```html
<semec-combobox class="semec-combobox" data-state="open">
  <input id="escola" type="text" role="combobox" class="semec-combobox__input" aria-autocomplete="list"
         aria-expanded="true" aria-controls="escola-lista" aria-activedescendant="escola-opcao-1" value="Escola Norte">
  <ul id="escola-lista" role="listbox" class="semec-combobox__listbox" data-state="open">
    <li id="escola-opcao-0" role="option" class="semec-combobox__option" aria-selected="false">Escola Centro</li>
    <li id="escola-opcao-1" role="option" class="semec-combobox__option" aria-selected="true" data-highlighted>
      Escola Norte <span class="semec-combobox__check" aria-hidden="true"></span>
    </li>
  </ul>
  <div class="semec-combobox__empty" hidden>Nenhum resultado.</div>
  <div class="semec-sr-only" role="status"></div>
  <select id="escola-nativo" name="escola" hidden aria-hidden="true" tabindex="-1">…</select>
</semec-combobox>
```

Opção ativa (a do Enter, com `aria-activedescendant` no campo) = `data-highlighted`: fundo `tint` e anel interno. Opção escolhida = `aria-selected="true"`: peso médio e o check. Inválido: `aria-invalid="true"` no campo, como no `.semec-field`.

### Menu

```html
<semec-menu>
  <button type="button" class="semec-btn semec-btn--outline" aria-haspopup="menu" aria-expanded="false" aria-controls="acoes">Ações</button>
  <div id="acoes" role="menu" class="semec-menu" hidden>
    <div class="semec-menu__label" role="presentation">Solicitação</div>
    <button type="button" role="menuitem" class="semec-menu__item">Ver detalhes</button>
    <a href="/comprovante.pdf" role="menuitem" class="semec-menu__item">Baixar comprovante</a>
    <div role="separator" class="semec-menu__separator"></div>
    <button type="button" role="menuitem" class="semec-menu__item" aria-disabled="true" data-disabled>Cancelar solicitação</button>
  </div>
</semec-menu>
```

Itens são `<button>` ou `<a>` (ocupam a linha como o item do React). O item ativo é o focado ou o com `data-highlighted`: fundo `tint` e anel interno de 2 px. O popup tem `w-max` (não quebra linha dentro de um gatilho estreito, como o popper do Radix) e no mínimo a largura do gatilho.

### Accordion

```html
<semec-accordion class="semec-accordion" type="single" collapsible>
  <div class="semec-accordion__item">
    <h3 class="semec-accordion__header">
      <button type="button" class="semec-accordion__trigger" aria-controls="prazo">
        Qual é o prazo da transferência?
        <span class="semec-accordion__icon" aria-hidden="true"></span>
      </button>
    </h3>
    <div id="prazo" role="region" class="semec-accordion__panel">Até 10 dias úteis após o envio.</div>
  </div>
</semec-accordion>
```

O elemento põe `data-state="open|closed"` no item, no gatilho e no painel, `aria-expanded` no gatilho e `hidden` no painel fechado; a seta gira com `data-state="open"` no gatilho. `type="multiple"` deixa vários abertos. Sem JavaScript, os painéis ficam abertos. A animação de altura do Radix (que mede o painel por JavaScript) não entra: o painel abre e fecha pelo `hidden`.

## Lista de classes

| Componente React | Classes |
|---|---|
| Button | `semec-btn`, `semec-btn--primary`, `semec-btn--secondary`, `semec-btn--outline`, `semec-btn--ghost`, `semec-btn--destructive`, `semec-btn--success`, `semec-btn--link`, `semec-btn--sm`, `semec-btn--md`, `semec-btn--lg`, `semec-btn--icon` |
| Input, Select, Textarea | `semec-field` |
| FormField | `semec-form-field`, `semec-label`, `semec-label__required`, `semec-hint`, `semec-error` |
| Checkbox, RadioGroup (nativos) | `semec-checkbox`, `semec-radio`, `semec-choice` |
| Card | `semec-card`, `semec-card__header`, `semec-card__title`, `semec-card__description`, `semec-card__content`, `semec-card__footer` |
| Alert | `semec-alert`, `semec-alert--info`, `semec-alert--success`, `semec-alert--warning`, `semec-alert--danger`, `semec-alert__title`, `semec-alert__description` |
| Header | `semec-header`, `semec-header__brand`, `semec-header__divider`, `semec-header__org`, `semec-header__separator`, `semec-header__service`, `semec-header__nav`, `semec-header__link` |
| Footer | `semec-footer`, `semec-footer__content`, `semec-footer__section`, `semec-footer__title`, `semec-footer__links`, `semec-footer__link`, `semec-footer__bottom` |
| SkipLink | `semec-skip-link` |
| Table | `semec-table`, `semec-table__wrapper`, `semec-table__caption` |
| ErrorSummary | `semec-error-summary`, `semec-error-summary__title`, `semec-error-summary__list`, `semec-error-summary__link` |
| Badge | `semec-badge`, `semec-badge--default`, `semec-badge--secondary`, `semec-badge--outline`, `semec-badge--success`, `semec-badge--warning`, `semec-badge--danger`, `semec-badge--info` |
| Toast | `semec-toast`, `semec-toast--info`, `semec-toast--success`, `semec-toast--warning`, `semec-toast--danger`, `semec-toast__body`, `semec-toast__title`, `semec-toast__description`, `semec-toast__action`, `semec-toast__close` |
| Heading | `semec-heading`, `semec-heading--1`, `semec-heading--2`, `semec-heading--3`, `semec-heading--4`, `semec-heading--5`, `semec-heading--6` |
| Dialog, AlertDialog | `semec-dialog`, `semec-dialog--alert`, `semec-dialog__header`, `semec-dialog__title`, `semec-dialog__description`, `semec-dialog__footer`, `semec-dialog__close` |
| Tabs | `semec-tabs` (gancho, sem estilo), `semec-tabs__list`, `semec-tabs__trigger`, `semec-tabs__panel` |
| Combobox | `semec-combobox`, `semec-combobox__input`, `semec-combobox__listbox`, `semec-combobox__option`, `semec-combobox__empty`, `semec-combobox__check` |
| DropdownMenu | `semec-menu`, `semec-menu__item`, `semec-menu__separator`, `semec-menu__label` |
| Accordion | `semec-accordion` (gancho, sem estilo), `semec-accordion__item`, `semec-accordion__header`, `semec-accordion__trigger`, `semec-accordion__panel`, `semec-accordion__icon` |
| (utilitário) | `semec-sr-only` (só para leitor de tela) |

O arquivo `@semec/ds-css/classes.json` lista cada seletor, as classes Tailwind de origem e o componente React de onde vieram.

## Como o CSS é gerado

`scripts/rules.mjs` mapeia cada classe `.semec-*` para o componente do kit (`packages/react/src/components/*.tsx`) e lê as classes reais com o mesmo avaliador das receitas do kit. Variantes do `cva` viram modificadores por decomposição: para cada combinação de props, o conjunto final do React (já com o `twMerge`) é dividido em base e modificadores, e o build falha se a soma não reproduzir o React. `scripts/build.mjs` compila com o Tailwind v4 e os tokens do kit como referência e grava CSS padrão, achatado, com `var(--…)`.

Testes (`npm run test --workspace @semec/ds-css`, depois de `npm run build:ds`): contrato do pacote, paridade de estilo computado (repouso, `:hover` e `:focus-visible`) e screenshot lado a lado contra o React no Chromium, axe-core e teclado na página de exemplo, alvo de 44 px, layout em 375 px e limite de tamanho. Os interativos são comparados **abertos** com o React (diálogo e alerta abertos, menu aberto com item ativo, listbox aberto e sem resultado, aba ativa, item expandido), um caso por página, incluindo a posição do painel e do popup, o `::backdrop` e o axe de cada página.

## Licença

MIT.
