# @semec/ds-elements

Web Components acessíveis do Design System SEMEC para páginas HTML, PHP, Django, Flask e qualquer stack sem React: diálogo, abas, combobox, menu e acordeão.

- **Light DOM, sem shadow DOM.** Você escreve o HTML com as classes `.semec-*` do [`@semec/ds-css`](https://github.com/SEMEC-PVH/SEMEC_design_system/tree/main/packages/css#readme); o elemento só acrescenta comportamento e ARIA. O CSS do app continua valendo.
- **Aprimoramento progressivo.** Sem JavaScript, o conteúdo continua legível: painéis visíveis, links funcionando e o `<select>` nativo no lugar do combobox.
- **Mesmo comportamento do kit React.** Teclado e foco seguem os padrões [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/) e o Radix usado no `@semec/ds`. Os elementos põem os mesmos atributos de estado do Radix (`data-state`, `data-highlighted`…), que o `@semec/ds-css` estiliza.
- **Sem dependências de runtime.** Cerca de 29 kB minificado (9 kB com gzip) no arquivo único do CDN, somente ESM ([ADR-027](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/adr/0027-sem-build-commonjs.md)).

Decisão: [ADR-029](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/adr/0029-web-components-light-dom-sem-dependencias.md). Página no site: [Usar sem React › Web Components](https://semec-pvh.github.io/SEMEC_design_system/usar-sem-react/web-components/).

## Instalação

**Requer o `@semec/ds-css` 1.1.0 ou mais novo.** As classes dos componentes interativos (`.semec-dialog`, `.semec-tabs`, `.semec-combobox`, `.semec-menu`, `.semec-accordion`) não existem na 1.0.0: com ela, os elementos funcionam, mas ficam sem estilo.

### Com npm

```bash
npm install @semec/ds-elements "@semec/ds-css@^1.1.0"
```

No arquivo de entrada do app:

```js
import "@semec/ds-tokens/fonts.css";
import "@semec/ds-css/index.css";
import "@semec/ds-elements/auto"; // registra todos os elementos
```

Para registrar na hora que preferir, importe as classes:

```js
import { defineSemecElements, SemecDialog } from "@semec/ds-elements";

defineSemecElements(); // pode ser chamada de novo sem erro
```

### Com CDN

Use versão fixa (nunca uma faixa como `@1`: o SRI vale para um arquivo só) e `integrity`. O bloco completo tem as fontes, o CSS a partir da 1.1.0 e o script:

```html
<link rel="stylesheet" crossorigin="anonymous"
  href="https://cdn.jsdelivr.net/npm/@semec/ds-tokens@1.0.0/dist/fonts.css"
  integrity="sha384-JPaBLIHnh0Pteb6nPfiQvklhUDnfvln4jCKfD1ASorqT7xYuyugBAs5ZvE32NxXb">
<link rel="stylesheet" crossorigin="anonymous"
  href="https://cdn.jsdelivr.net/npm/@semec/ds-css@1.1.0/dist/semec-ds.css"
  integrity="sha384-CALCULE-NA-RELEASE">
<script type="module" crossorigin="anonymous"
  src="https://cdn.jsdelivr.net/npm/@semec/ds-elements@1.0.0/dist/semec-elements.js"
  integrity="sha384-CALCULE-NA-RELEASE"></script>
```

`sha384-CALCULE-NA-RELEASE` não é um valor: calcule o hash do arquivo publicado (`curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A`). O `<script type="module">` já é adiado: pode ficar no `<head>`. Sem CDN, copie `dist/semec-elements.js` e `dist/semec-elements.js.map` para a mesma pasta pública e aponte o `src` para o `.js` (sem o `.map`, tudo funciona, mas o DevTools mostra um 404 ao abrir).

### Exports

| Caminho | O que é |
|---|---|
| `@semec/ds-elements` | Classes (`SemecDialog`, `SemecTabs`, `SemecCombobox`, `SemecMenu`, `SemecAccordion`), `semecElements` e `defineSemecElements()`. Não registra nada ao importar. |
| `@semec/ds-elements/auto` | Registra tudo ao importar (efeito colateral). |
| `@semec/ds-elements/dist/semec-elements.js` | Arquivo único, minificado, que registra tudo. É o do CDN. |

Importar o pacote no servidor (SSR, Node) não quebra: sem `HTMLElement`, `defineSemecElements()` não faz nada.

## Regras comuns

- Registrar duas vezes não quebra: uma tag já registrada é mantida (inclusive com o bundle do CDN e o pacote do npm na mesma página).
- Remover o elemento da página remove os ouvintes. Ao voltar (mover no DOM, trocar com HTMX/Turbo), ele monta de novo sem duplicar.
- O elemento cria `id` só onde falta (`semec-<parte>-<n>`) e não troca o que você escreveu.
- Estado escondido usa o atributo `hidden`. Nada depende do CSS para esconder.
- Os estados seguem os do Radix: `data-state="open|closed"` (diálogo, popup do menu, listbox, item/gatilho/painel do acordeão), `data-state="active|inactive"` (aba e painel), `data-highlighted` (item ativo do menu e opção ativa do combobox), `data-disabled`, `aria-selected` (aba ativa e opção ativa do combobox), `data-state="checked|unchecked"` (opção escolhida do combobox), `aria-expanded`. O popup do menu e do combobox recebe `data-side="top"` quando não cabe embaixo e `data-align="end"` quando passaria da borda direita da janela (o CSS alinha pelo fim do gatilho).
- Partes acrescentadas depois de montado (abas e painéis, itens do menu e do acordeão, opções e atributos do `<select>`) são lidas de novo, como numa troca parcial do HTMX.

## `<semec-dialog>`

Envolve um `<dialog>` nativo aberto com `showModal()`: o resto da página fica inerte e o diálogo vai para a camada superior.

O gatilho padrão é um link para uma página com o mesmo conteúdo: sem JavaScript, ele leva até lá; com JavaScript, abre o diálogo e ganha `role="button"` (Enter e Espaço).

```html
<a class="semec-btn" href="/contato/editar" data-semec-dialog-open="editar-contato">Editar contato</a>

<semec-dialog id="editar-contato">
  <dialog class="semec-dialog">
    <div class="semec-dialog__header">
      <h2 class="semec-dialog__title">Editar contato</h2>
      <p class="semec-dialog__description">Altere o telefone do responsável.</p>
    </div>
    <div class="semec-form-field">
      <label class="semec-label" for="telefone">Telefone</label>
      <input class="semec-field" id="telefone" name="telefone">
    </div>
    <div class="semec-dialog__footer">
      <button type="button" class="semec-btn semec-btn--outline" data-semec-dialog-close>Cancelar</button>
      <button type="button" class="semec-btn" data-semec-dialog-close>Salvar</button>
    </div>
    <!-- O X é desenhado pelo CSS (::before): não ponha <svg> aqui, só o nome acessível. -->
    <button type="button" class="semec-dialog__close" data-semec-dialog-close>
      <span class="semec-sr-only">Fechar</span>
    </button>
  </dialog>
</semec-dialog>
```

Confirmação destrutiva: atributo `alert` e o modificador `semec-dialog--alert` (o elemento põe o modificador se ele faltar). O botão de cancelar leva `data-semec-dialog-cancel` (fecha e recebe o foco inicial); `data-semec-dialog-close` é o "fechar" genérico (o X, o "Salvar" que fecha):

```html
<semec-dialog id="excluir" alert>
  <dialog class="semec-dialog semec-dialog--alert">
    <div class="semec-dialog__header">
      <h2 class="semec-dialog__title">Excluir o rascunho?</h2>
      <p class="semec-dialog__description">Esta ação não pode ser desfeita.</p>
    </div>
    <div class="semec-dialog__footer">
      <button type="button" class="semec-btn semec-btn--outline" data-semec-dialog-cancel>Cancelar</button>
      <button type="button" class="semec-btn semec-btn--destructive" data-semec-dialog-close>Excluir</button>
    </div>
  </dialog>
</semec-dialog>
```

| | |
|---|---|
| Abrir | `[data-semec-dialog-open="<id>"]` em qualquer lugar da página (o id do `<semec-dialog>` ou do `<dialog>`), ou `elemento.open()` |
| Fechar | `[data-semec-dialog-close]`, `[data-semec-dialog-cancel]`, Esc, clique no fundo (não no `alert`), `elemento.close()` ou `<form method="dialog">` |
| Foco | Inicial no `[autofocus]` ou no primeiro focável; no `alert`, no cancelar. Tab e Shift+Tab circulam dentro. Ao fechar, volta ao gatilho (ou ao elemento focado antes de `open()`). |
| ARIA | `aria-labelledby`/`aria-describedby` a partir de `__title`/`__description`; `alert` vira `role="alertdialog"` + `aria-modal="true"`; o gatilho recebe `aria-haspopup="dialog"`, `aria-controls` e `aria-expanded` |
| Estado | `data-state` no `<dialog>` e no gatilho; trava a rolagem da página enquanto aberto |
| Eventos | `semec-open`; `semec-close` com `detail.returnValue` |

Sem JavaScript, o diálogo não abre. Não deixe nele algo que a pessoa precisa para concluir a tarefa sem alternativa: por isso o gatilho é um link para uma página com o mesmo conteúdo. Um `<button>` como gatilho só serve quando o diálogo é um atalho para algo que também existe fora dele. Se o `<semec-dialog>` for removido aberto (troca do HTMX ou do Turbo), o foco volta ao gatilho.

### Confirmar antes de enviar um formulário

Para pedir confirmação antes de um envio, o gatilho é o próprio botão de envio. Sem JavaScript, ele envia o formulário direto; com JavaScript, o clique (ou o Enter num campo) abre o diálogo, e o "Confirmar" dentro dele envia:

```html
<form method="post" action="/rascunhos/12/excluir">
  <button type="submit" class="semec-btn semec-btn--destructive" data-semec-dialog-open="confirmar-exclusao">Excluir rascunho</button>

  <semec-dialog id="confirmar-exclusao" alert>
    <dialog class="semec-dialog semec-dialog--alert">
      <div class="semec-dialog__header">
        <h2 class="semec-dialog__title">Excluir o rascunho?</h2>
        <p class="semec-dialog__description">Esta ação não pode ser desfeita.</p>
      </div>
      <div class="semec-dialog__footer">
        <button type="button" class="semec-btn semec-btn--outline" data-semec-dialog-cancel>Cancelar</button>
        <button type="submit" class="semec-btn semec-btn--destructive">Confirmar</button>
      </div>
    </dialog>
  </semec-dialog>
</form>
```

## `<semec-tabs>`

Escreva a lista como um sumário de links para os painéis. Sem JavaScript, ela continua sendo um sumário e todos os painéis aparecem.

```html
<semec-tabs class="semec-tabs">
  <nav class="semec-tabs__list" aria-label="Seções da matrícula">
    <a class="semec-tabs__trigger" href="#dados">Dados</a>
    <a class="semec-tabs__trigger" href="#documentos">Documentos</a>
    <a class="semec-tabs__trigger" href="#historico">Histórico</a>
  </nav>
  <section class="semec-tabs__panel" id="dados">…</section>
  <section class="semec-tabs__panel" id="documentos">…</section>
  <section class="semec-tabs__panel" id="historico">…</section>
</semec-tabs>
```

Os gatilhos podem ser `<button>` com `aria-controls="<id do painel>"`. Sem `href` nem `aria-controls`, vale a ordem.

| | |
|---|---|
| Atributos | `value` (aba ativa: o `data-value` do gatilho ou o `id` do painel), `orientation="vertical"` |
| Teclado | ←/→ (↑/↓ na vertical) com volta ao início, Home/End; a aba ativa muda junto com o foco (ativação automática, como no Radix); Tab vai ao painel |
| ARIA | `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby`, `aria-orientation`, roving tabindex, painel com `tabindex="0"` |
| Estado | `data-state="active|inactive"` no gatilho e no painel; painéis inativos com `hidden` |
| Evento | `semec-change` com `detail.value` |

Abre na aba do `value`, na que tiver `aria-selected="true"`, na do `#hash` da URL ou na primeira. Gatilho desabilitado: `disabled` (botão) ou `aria-disabled="true"`.

Um link `#id` da página para um painel inativo, ou para algo dentro dele (o resumo de erros apontando um campo de outra aba), ativa a aba antes de navegar; o `hashchange` (voltar/avançar) também. Abas e painéis acrescentados ou removidos depois são montados de novo; se a aba ativa sai, a primeira habilitada assume.

## `<semec-combobox>`

Parte de um `<select>` nativo, que é a fonte das opções e o valor do formulário:

```html
<div class="semec-form-field">
  <label class="semec-label" for="escola">Escola</label>
  <semec-combobox class="semec-combobox">
    <select class="semec-field" id="escola" name="escola" aria-describedby="escola-dica" required>
      <option value="">Selecione a escola</option>
      <option value="rio-madeira">EMEF Rio Madeira</option>
      <option value="sao-sebastiao">EMEF São Sebastião</option>
    </select>
  </semec-combobox>
  <p class="semec-hint" id="escola-dica">Digite parte do nome para filtrar.</p>
</div>
```

O `<semec-combobox>` envolve **só o `<select>`**: o rótulo, a dica e a mensagem de erro ficam fora dele (a lista abre logo abaixo do campo, posicionada em relação ao elemento).

Com JavaScript, o elemento cria `<input class="semec-combobox__input" role="combobox">`, `<ul class="semec-combobox__listbox" role="listbox">` com `<li class="semec-combobox__option" role="option">` (a escolhida com `data-state="checked"` e o ícone `__check`), a mensagem `.semec-combobox__empty` e uma região viva. O campo assume o `id` do select (o `<label for>` continua funcionando), o `aria-describedby`, o `aria-invalid` e o `required`. A opção de valor vazio vira o placeholder. O select fica com `hidden`, `aria-hidden` e fora do Tab, mas o `name` continua indo no envio.

| | |
|---|---|
| Teclado | Digitar filtra (sem diferença de acento e caixa); ↓/↑ abrem na escolhida e movem (param nas pontas, como no kit); Alt+↓ abre sem mover; Home/End com a lista aberta; Enter escolhe; Esc fecha e, com a lista fechada, limpa a escolha; Tab fecha e segue |
| ARIA | `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, `aria-activedescendant` na opção ativa; `aria-selected="true"` na opção **ativa** (a que o `aria-activedescendant` aponta e o leitor de tela anuncia), `"false"` nas demais, como no APG e no kit React; "N resultados" ou "Nenhum resultado" anunciados (`role="status"`) |
| Estado | Opção ativa: `data-highlighted`. Opção escolhida (o valor atual): `data-state="checked"`, as outras `"unchecked"` (convenção do Radix para item marcado; o CSS mostra o check por esse atributo). `data-disabled` nas desabilitadas, `data-state="open|closed"` no listbox e no elemento |
| Atributos | `empty-text` troca "Nenhum resultado"; `invalid-text` troca "Escolha uma opção da lista." |
| Eventos | `semec-change` com `detail.value` e `detail.label`; o `<select>` dispara `input` e `change`, como se a escolha fosse nele |

Texto digitado que não virou escolha volta ao escolhido quando o campo perde o foco (ou escolhe a opção de texto igual). Enquanto isso, o campo fica inválido ("Escolha uma opção da lista."): o formulário não é enviado com um texto que não vai no envio. Enter com a lista fechada escolhe a opção de texto igual antes de enviar. Esc que limpa uma escolha avisa "Escolha removida" na região viva.

O estado se muda no `<select>`, também depois de montado: opções novas ou alteradas entram na lista sem apagar o que a pessoa está digitando, e `disabled`, `required`, `aria-invalid`, `aria-describedby`, `aria-label`, `aria-labelledby` e `title` passam para o campo. O `required` sai do select escondido (ele travaria o envio sem mensagem); para deixar de exigir, use `elemento.input.required = false`. `elemento.value = "x"` também escolhe.

## `<semec-menu>`

```html
<semec-menu>
  <button type="button" class="semec-btn semec-btn--outline" data-semec-menu-trigger>Ações do rascunho</button>
  <div class="semec-menu">
    <div class="semec-menu__label">Rascunho</div>
    <button type="button" class="semec-menu__item">Editar</button>
    <button type="button" class="semec-menu__item">Duplicar</button>
    <hr class="semec-menu__separator">
    <a class="semec-menu__item" href="/rascunhos/12/arquivar">Arquivar</a>
    <button type="button" class="semec-menu__item" disabled>Excluir</button>
  </div>
</semec-menu>
```

Sem JavaScript, os itens aparecem como uma lista comum de botões e links.

Rótulo de seção: dentro de `role="menu"`, um texto solto não é lido em modo menu. Os itens que vêm depois de um `.semec-menu__label` (até o próximo separador ou rótulo) são envolvidos num `<div class="semec-menu__group" role="group">` rotulado por ele, e o rótulo sai da árvore de acessibilidade para não ser lido duas vezes. Se você já escreveu o grupo (`role="group"` ou `.semec-menu__group` com o rótulo dentro ou logo antes), ele é usado. Itens acrescentados depois recebem o papel antes de entrar na navegação.

| | |
|---|---|
| Teclado | No botão: Enter, Espaço e ↓ abrem no primeiro item; ↑ abre no último. No menu: ↑/↓ com volta ao início, Home/End, primeira letra (repetir a letra percorre os itens), Enter/Espaço ativam (inclusive links), Esc fecha e devolve o foco, Tab fecha e segue |
| Ponteiro | Clique no botão abre com o foco no menu (como o Radix); passar o mouse destaca o item; clique fora fecha |
| ARIA | Botão com `aria-haspopup="menu"`, `aria-expanded` e `aria-controls` (só aberto); popup `role="menu"` rotulado pelo botão; itens `role="menuitem"` com `tabindex="-1"`; `role="separator"`; o `.semec-menu__label` dá nome a um `role="group"` com os itens da seção (veja abaixo) |
| Estado | `data-state` no botão e no popup, `data-highlighted` no item com foco, `data-disabled` nos desabilitados (fora da navegação), `data-side="top"` e `data-align="end"` |
| Evento | `semec-select` com `detail.item` e `detail.value` (`data-value` ou o texto). Cancelável: `event.preventDefault()` deixa o menu aberto |

## `<semec-accordion>`

```html
<semec-accordion class="semec-accordion" type="single" collapsible>
  <div class="semec-accordion__item">
    <h3 class="semec-accordion__header">
      <button type="button" class="semec-accordion__trigger">
        Quem pode pedir transferência?
        <svg class="semec-accordion__icon" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
      </button>
    </h3>
    <div class="semec-accordion__panel" id="quem-pode">
      <p>O responsável legal pelo estudante.</p>
    </div>
  </div>
  <!-- outros itens -->
</semec-accordion>
```

Use o nível de heading que a página pede. Sem JavaScript, todos os painéis aparecem e os botões não fazem nada (continuam anunciados como botões): se isso confundir na sua tela, esconda os botões até o elemento ser definido no CSS do app (`semec-accordion:not(:defined) .semec-accordion__trigger`) e repita o texto num heading comum.

| | |
|---|---|
| Atributos | `type="single"` (padrão, um aberto por vez) ou `"multiple"`; `collapsible` (single: deixa fechar o aberto); `value` (abertos, separados por espaço) |
| Teclado | Enter/Espaço alternam; ↑/↓ entre os botões, com volta; Home/End |
| ARIA | `aria-expanded`, `aria-controls`; painel `role="region"` com `aria-labelledby`; item aberto que não pode fechar (single sem `collapsible`) fica `aria-disabled="true"`, como no Radix |
| Estado | `data-state="open|closed"` no item, no header, no gatilho e no painel; painel fechado com `hidden` |
| Evento | `semec-change` com `detail.value` (texto em single, lista em multiple) |

Abre os itens do `value` ou os que tiverem `data-state="open"` no HTML. O valor de cada item é o `data-value`, o `id` do painel ou a posição. Um link `#id` da página para algo dentro de um painel fechado abre o item antes de navegar. Itens acrescentados depois entram fechados e montados.

## Acessibilidade

Testado no navegador real (Playwright: Chromium, Firefox e WebKit) com teclado completo, foco, ARIA e axe-core sem violações em cada estado aberto, com e sem JavaScript. A mesma sequência de teclas foi comparada com os componentes React do kit e leva ao mesmo foco e ao mesmo estado.

Diferenças em relação ao Radix, por seguir o APG:

- Menu: ↑ no botão abre no último item, as setas voltam ao início e Tab fecha o menu (no Radix, ↑ não abre, as setas param nas pontas e Tab fica preso).
- Combobox: é um campo editável (APG "Editable Combobox With List Autocomplete"), não um botão que abre um campo de busca. O filtro ignora acentos. Esc com a lista fechada limpa a escolha.
- Diálogo: o clique no fundo não tira o foco do elemento atual.

Limitações conhecidas:

- Combobox sem `<optgroup>`: os grupos do select viram uma lista única.
- Menu sem submenus e sem itens de marcar (checkbox/radio).
- O diálogo depende de `showModal()` e de `adoptedStyleSheets` (Chrome 73+, Firefox 101+, Safari 16.4+).
- Leitores de tela reais (NVDA, JAWS, VoiceOver) não fazem parte da bateria automática: confira os fluxos críticos com eles antes de publicar uma tela.

## Licença

MIT.
