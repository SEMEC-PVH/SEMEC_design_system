# Modelos de servidor do `@semec/ds-css`

Parciais prontas para montar telas do Design System SEMEC no servidor, sem React: **PHP puro**, **Jinja2** (Django com django-jinja, Flask), **Twig** (Symfony, Slim) e **Blade** (Laravel). As quatro linguagens têm as mesmas parciais, com os mesmos nomes e os mesmos parâmetros, e geram o mesmo HTML: o HTML recomendado no [README do pacote](https://github.com/SEMEC-PVH/SEMEC_design_system/tree/main/packages/css#readme), com as classes `.semec-*` e o ARIA certo. Decisão no [ADR-030](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/adr/0030-modelos-de-servidor-no-ds-css.md).

| Parcial | O que gera |
|---|---|
| `pagina` | Layout base: `<html lang="pt-BR">`, `<link>` das fontes e do CSS, `<script>` do `@semec/ds-elements`, pular para o conteúdo, cabeçalho, `<main id="conteudo">` e rodapé |
| `pular-para-o-conteudo` | Link "Pular para o conteúdo principal" |
| `cabecalho` | Marca, órgão, serviço e menu com `aria-current="page"` no item atual |
| `rodape` | Seções de links e a linha final |
| `campo` | `input`, `textarea` ou `select` com rótulo, obrigatório, dica, erro, `aria-describedby` e `aria-invalid` |
| `combobox` | Campo de escolha com filtro: um `<select>` dentro do `<semec-combobox>`, com rótulo, dica e erro |
| `radio-grupo` | Grupo de rádios em `<fieldset>` com `<legend>`, dica e erro |
| `checkbox` | Uma caixa de marcação (declaração, aceite) ou um grupo delas em `<fieldset>` |
| `resumo-de-erros` | Lista de links para os campos com erro, focada ao carregar a página |
| `alerta` | Aviso nas variantes info, success, warning e danger, com o ícone do kit |
| `botao` | `<button>` ou link com a aparência de botão |

## Instalação

Os modelos vêm no pacote, em `node_modules/@semec/ds-css/templates/`. Copie a pasta da sua linguagem para o projeto (ou aponte o carregador de templates para ela) e publique na pasta pública os arquivos `dist/semec-ds.css` (deste pacote), `dist/fonts.css` com `dist/fonts/` (do `@semec/ds-tokens`) e `dist/semec-elements.js` (do `@semec/ds-elements`). Os caminhos padrão do layout são `/css/semec-ds.css`, `/css/fonts.css` e `/js/semec-elements.js`; troque pelos parâmetros `css_href`, `fontes_href` e `elements_src`.

Ao atualizar o pacote, copie de novo: os modelos acompanham as classes do CSS da mesma versão.

**A marca não vem no pacote.** O arquivo da marca da Prefeitura é do órgão (peça à comunicação a versão oficial em SVG) e fica na pasta pública do seu app, por exemplo em `/img/marca.svg`; passe o endereço em `marca_src`. Sem `marca_src`, o cabeçalho sai só com o nome do órgão e do serviço, sem imagem.

### Erros: um mapa só

Os exemplos usam **um único mapa `campo → mensagem`** para o resumo e para cada campo. A parcial `resumo-de-erros` aceita esse mapa (ou a lista `{campo, mensagem}`), e o `erro` de cada campo é a mensagem daquele campo. Sem erros, o mapa fica vazio e nada aparece. Item sem campo ou sem mensagem não vira link.

### PHP puro (8.2+)

<!-- exemplo:php (o teste roda este trecho como está) -->
```php
<?php
require __DIR__ . '/semec/semec.php'; // templates/php copiado para ./semec

// Um só mapa campo => mensagem serve ao resumo e a cada campo.
$dados = $_POST;
$erros = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST' && trim($dados['cpf'] ?? '') === '') {
    $erros['cpf'] = 'Informe o CPF.';
}

echo semec_render('pagina', [
    'titulo' => 'Transferência escolar — SEMEC',
    'cabecalho' => [
        'marca_src' => '/img/marca.svg', // a marca oficial, servida pelo seu app
        'servico' => 'Matrícula e transferência',
        'nav' => [['href' => '/transferencia', 'texto' => 'Transferência', 'atual' => true]],
    ],
    'conteudo' => function () use ($erros, $dados) {
        echo '<h1 class="semec-heading semec-heading--1">Solicitar transferência</h1>';
        echo semec_render('resumo-de-erros', ['erros' => $erros]);
        echo '<form method="post" novalidate>';
        echo semec_render('campo', [
            'id' => 'cpf', 'rotulo' => 'CPF', 'obrigatorio' => true,
            'valor' => $dados['cpf'] ?? '', 'erro' => $erros['cpf'] ?? null,
            'dica' => 'Somente números.',
            'atributos' => ['inputmode' => 'numeric', 'maxlength' => 11],
        ]);
        echo semec_render('botao', ['texto' => 'Enviar', 'tipo' => 'submit']);
        echo '</form>';
    },
]);
```

`semec_render()` devolve o HTML. Toda saída passa por `semec_e()` (`htmlspecialchars` com `ENT_QUOTES`). O conteúdo da página (`conteudo`, `head`) é uma função que imprime o HTML do seu app; um texto passado no lugar dela sai escapado. A função só enxerga as variáveis do `use (...)`: esqueceu uma, o PHP não avisa por causa do `??`.

### Jinja2 (Django com django-jinja, Flask)

Copie `templates/jinja` para uma pasta `semec/` dentro do diretório de templates (os modelos se referem uns aos outros como `semec/…`).

<!-- exemplo:jinja (o teste renderiza este trecho com StrictUndefined) -->
```jinja
{% extends "semec/pagina.jinja" %}
{% from "semec/campo.jinja" import campo %}
{% from "semec/botao.jinja" import botao %}
{% from "semec/resumo-de-erros.jinja" import resumo_de_erros %}
{% block conteudo %}
  <h1 class="semec-heading semec-heading--1">Solicitar transferência</h1>
  {{ resumo_de_erros(erros=erros) }}
  <form method="post" novalidate>
    {{ campo(id="cpf", rotulo="CPF", obrigatorio=true, valor=dados.get("cpf"), erro=erros.get("cpf"), dica="Somente números.", atributos={"inputmode": "numeric", "maxlength": 11}) }}
    {{ botao(texto="Enviar", tipo="submit") }}
  </form>
{% endblock %}
```

A view passa `erros` (o mapa, vazio quando não há erro), `dados` (o que veio do formulário, `{}` no primeiro acesso) e os parâmetros do layout: `render(request, "transferencia.jinja", {"titulo": …, "cabecalho": {…}, "erros": erros, "dados": dados})`. No Django, ponha `{{ csrf_input }}` dentro do `<form>`. As macros se chamam como a parcial, com `_` no lugar de `-` (`resumo_de_erros`, `radio_grupo`, `pular_para_o_conteudo`). Funciona com `StrictUndefined` (use `.get()` para chave que pode faltar, como no exemplo).

**Flask: ligue o autoescape para `.jinja`.** O Flask só escapa templates `.html`, `.htm`, `.xml`, `.xhtml` e `.svg`. Cada parcial do DS liga o próprio autoescape, mas a sua tela (o template filho, com o bloco `conteudo`) não: com o nome `transferencia.jinja`, um `{{ dados.nome }}` sai **cru**, e isso é XSS. Configure uma vez, ao criar o app:

<!-- exemplo:flask (o teste roda um app Flask com esta linha) -->
```python
from jinja2 import select_autoescape

app.jinja_env.autoescape = select_autoescape(["html", "htm", "xml", "xhtml", "jinja"])
```

ou dê às suas telas a extensão `.html` (`transferencia.html` pode estender `semec/pagina.jinja`). No Django com django-jinja, a extensão `.jinja` precisa estar no `match_extension` e o motor com `"autoescape": True` (o padrão do django-jinja).

O Django com o motor de templates próprio (DTL) não lê Jinja: use o django-jinja para estas telas ou copie o HTML do README do pacote.

### Twig (Symfony, Slim)

Registre a pasta com o namespace `semec` (no Symfony, `twig.paths: {'%kernel.project_dir%/vendor-semec/twig': semec}`; no Twig puro, `$loader->addPath($dir, 'semec')`).

<!-- exemplo:twig (o teste renderiza este trecho com strict_variables) -->
```twig
{% extends '@semec/pagina.html.twig' %}
{% block conteudo %}
  <h1 class="semec-heading semec-heading--1">Solicitar transferência</h1>
  {% include '@semec/resumo-de-erros.html.twig' with {erros: erros} only %}
  <form method="post" novalidate>
    {% include '@semec/campo.html.twig' with {id: 'cpf', rotulo: 'CPF', obrigatorio: true, valor: dados.cpf|default(null), erro: erros.cpf|default(null), dica: 'Somente números.', atributos: {inputmode: 'numeric', maxlength: 11}} only %}
    {% include '@semec/botao.html.twig' with {texto: 'Enviar', tipo: 'submit'} only %}
  </form>
{% endblock %}
```

Use sempre `only`, para a parcial não herdar variáveis da página. Cada parcial liga o próprio autoescape (`html`). Funciona com `strict_variables` ligado (padrão do Symfony em desenvolvimento).

### Blade (Laravel)

Registre o namespace no `AppServiceProvider`: `View::addNamespace('semec', resource_path('views/vendor/semec'))` (copie `templates/blade` para essa pasta).

<!-- exemplo:blade (o teste renderiza este trecho) -->
```blade
@extends('semec::pagina')
@section('conteudo')
  <h1 class="semec-heading semec-heading--1">Solicitar transferência</h1>
  {!! view('semec::resumo-de-erros', ['erros' => array_map(fn ($m) => $m[0], $errors->getMessages())])->render() !!}
  <form method="post" novalidate>
    @csrf
    {!! view('semec::campo', ['id' => 'cpf', 'rotulo' => 'CPF', 'obrigatorio' => true, 'valor' => old('cpf'), 'erro' => $errors->first('cpf') ?: null, 'dica' => 'Somente números.', 'atributos' => ['inputmode' => 'numeric', 'maxlength' => 11]])->render() !!}
    {!! view('semec::botao', ['texto' => 'Enviar', 'tipo' => 'submit'])->render() !!}
  </form>
@endsection
```

`{!! view(…)->render() !!}` renderiza a parcial isolada; o `{!! !!}` só imprime o HTML que a parcial já escapou. Não use `@include` com as parciais: ele passa **todas** as variáveis da view, e um `$titulo` da página (o do layout) viraria o título do resumo de erros; um `$id`, `$tipo` ou `$erro` mudaria o campo. O layout `pagina` já renderiza cabeçalho, rodapé e o link de pular isolados.

## Campos de escolha

```php
echo semec_render('combobox', [
    'id' => 'escola', 'rotulo' => 'Escola de destino', 'obrigatorio' => true,
    'opcao_vazia' => 'Selecione a escola', 'valor' => $dados['escola'] ?? null,
    'opcoes' => [['valor' => 'emef-aponia', 'texto' => 'EMEF Aponiã'], ['valor' => 'emef-sao-sebastiao', 'texto' => 'EMEF São Sebastião']],
    'erro' => $erros['escola'] ?? null,
]);
echo semec_render('radio-grupo', [
    'id' => 'turno', 'rotulo' => 'Turno desejado', 'obrigatorio' => true, 'valor' => $dados['turno'] ?? null,
    'opcoes' => [['valor' => 'manha', 'texto' => 'Manhã'], ['valor' => 'tarde', 'texto' => 'Tarde']],
    'erro' => $erros['turno'] ?? null,
]);
echo semec_render('checkbox', [
    'id' => 'declaracao', 'rotulo' => 'Declaro que as informações são verdadeiras', 'obrigatorio' => true,
    'valor' => 'sim', 'marcado' => ($dados['declaracao'] ?? '') === 'sim', 'erro' => $erros['declaracao'] ?? null,
]);
```

- **`combobox`:** o `<semec-combobox>` envolve **só o `<select>`**, então a lista abre colada ao campo (não depois da dica ou do erro). Sem JavaScript, o `<select>` funciona sozinho; com o `@semec/ds-elements`, vira campo com filtro e o campo de busca assume o `id`. O link do resumo é `#id`.
- **`radio-grupo`** e **`checkbox` com `opcoes`:** `<fieldset>` com `<legend>`; a dica e o erro ficam ligados ao grupo (`aria-describedby` no `<fieldset>`) e cada opção recebe `aria-invalid`. O primeiro controle leva o `id` (o link do resumo é `#id`); os outros, `<id>-2`, `<id>-3`… No grupo de checkboxes, `valor` é a lista das opções marcadas e o `name` precisa de `[]` no PHP (`'nome' => 'documentos[]'`); o `obrigatorio` só põe o `*` (o navegador não sabe validar "pelo menos um"): valide no servidor.

## Atributos extras

`campo` e `botao` aceitam `atributos`, um mapa nome → valor, para o que a parcial não gera: os gatilhos do `@semec/ds-elements` (`data-semec-dialog-open`, `data-semec-dialog-close`, `data-semec-dialog-cancel`, `data-semec-menu-trigger`), `aria-describedby` num botão, `form`, e `inputmode`, `maxlength`, `pattern`, `rows`, `placeholder`… num campo.

```php
echo semec_render('botao', ['texto' => 'Excluir rascunho', 'variante' => 'destructive', 'atributos' => ['data-semec-dialog-open' => 'excluir']]);
```

Valem nomes `data-*` e `aria-*` e estes: `inputmode`, `enterkeyhint`, `maxlength`, `minlength`, `pattern`, `min`, `max`, `step`, `rows`, `cols`, `placeholder`, `readonly`, `spellcheck`, `autocapitalize`, `size`, `multiple`, `accept`, `form`, `formnovalidate`, `title`, `lang` e `dir`, em minúsculas. Qualquer outro nome (`on*`, `style`, `class`, `href`, `formaction`…) e os que a parcial já controla (no `campo`, `aria-invalid` e `aria-describedby`; no `botao`, `aria-label` e `aria-disabled`) são ignorados. O valor sai escapado; `true` gera o atributo sem valor (`data-semec-menu-trigger`); `false`, nulo e vazio omitem.

## Parâmetros

Os mesmos nas quatro linguagens. Parâmetro ausente, `null` ou texto vazio usa o padrão. Valor fora da lista (variante, tamanho, tipo) também cai no padrão: nenhum parâmetro vira classe ou atributo arbitrário. Todo texto e todo atributo saem escapados; nenhum parâmetro aceita HTML.

| Parcial | Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `pagina` | `titulo` | texto | — | `<title>` da página. Inclua o nome do serviço: "Transferência — SEMEC". |
| `pagina` | `css_href` | texto | `/css/semec-ds.css` | Endereço do `semec-ds.css`. |
| `pagina` | `fontes_href` | texto ou `false` | `/css/fonts.css` | Endereço do `fonts.css` do `@semec/ds-tokens` (com `fonts/` ao lado). `false` omite o `<link>`. |
| `pagina` | `elements_src` | texto ou `false` | `/js/semec-elements.js` | Endereço do bundle do `@semec/ds-elements`, carregado com `<script type="module">`. `false` omite. |
| `pagina` | `pular_texto` | texto | Pular para o conteúdo principal | Texto do link de pular. |
| `pagina` | `cabecalho` | objeto | — | Parâmetros da parcial `cabecalho`. Sem ele, a página não tem cabeçalho. |
| `pagina` | `rodape` | objeto | — | Parâmetros da parcial `rodape`. Sem ele, a página não tem rodapé. |
| `pagina` | `conteudo` | bloco | — | Conteúdo do `<main id="conteudo">`. Jinja e Twig: `{% block conteudo %}`; Blade: `@section('conteudo')`; PHP: função que imprime. Comece com o `<h1>` da tela. |
| `pagina` | `head` | bloco | — | Fim do `<head>` (CSS do app, por exemplo). Mesmo formato do `conteudo`. |
| `pular-para-o-conteudo` | `texto` | texto | Pular para o conteúdo principal | Texto do link. |
| `pular-para-o-conteudo` | `alvo` | texto | `conteudo` | `id` do `<main>` (sem `#`). |
| `cabecalho` | `marca_src` | texto | — | Endereço da imagem da marca (não vem no pacote: veja Instalação). Sem ele, não há `<img>`. |
| `cabecalho` | `marca_alt` | texto | Prefeitura de Porto Velho | Texto alternativo da marca. |
| `cabecalho` | `marca_largura` | número | `90` | Largura da imagem, em px. |
| `cabecalho` | `marca_altura` | número | `36` | Altura da imagem, em px. |
| `cabecalho` | `inicio` | texto | `/` | Destino do link da marca. |
| `cabecalho` | `orgao` | texto | SEMEC | Nome do órgão. |
| `cabecalho` | `servico` | texto | — | Nome do serviço, depois do órgão. |
| `cabecalho` | `rotulo_inicio` | texto | ir para o início | Texto só para leitor de tela no link da marca. |
| `cabecalho` | `nav` | lista | — | Itens do menu: `{href, texto, atual}`. O item com `atual: true` recebe `aria-current="page"`. Sem itens, não há `<nav>`. |
| `cabecalho` | `nav_rotulo` | texto | Menu principal | `aria-label` do `<nav>`. |
| `rodape` | `secoes` | lista | — | Seções `{titulo, links: [{href, texto}]}`. O título é `<h2>`. |
| `rodape` | `texto_final` | texto | Prefeitura de Porto Velho · SEMEC | Linha final do rodapé. |
| `campo` | `id` | texto | — | `id` do controle. A dica é `<id>-hint` e o erro, `<id>-error`. |
| `campo` | `rotulo` | texto | — | Texto do `<label>`. |
| `campo` | `nome` | texto | o `id` | `name` do controle. |
| `campo` | `tipo` | `text`, `email`, `tel`, `number`, `date`, `password`, `url`, `search`, `textarea`, `select` | `text` | Tipo do `<input>`, ou `textarea`/`select`. |
| `campo` | `valor` | texto | — | Valor atual (`value`, conteúdo do `textarea` ou opção selecionada). |
| `campo` | `obrigatorio` | booleano | `false` | `required` no controle e `*` visual (`aria-hidden`) no rótulo. |
| `campo` | `dica` | texto | — | Dica abaixo do campo, ligada por `aria-describedby`. Com `erro`, a dica sai, como no FormField do kit. |
| `campo` | `erro` | texto | — | Mensagem de erro. Marca `aria-invalid="true"` e liga a mensagem por `aria-describedby`. |
| `campo` | `opcoes` | lista | — | Opções do `select`: `{valor, texto}`. |
| `campo` | `opcao_vazia` | texto | — | Primeira opção do `select`, com valor vazio ("Selecione"). |
| `campo` | `autocomplete` | texto | — | Atributo `autocomplete` (ex.: `email`, `name`, `tel`). |
| `campo` | `desabilitado` | booleano | `false` | `disabled` no controle. |
| `campo` | `atributos` | mapa | — | Atributos extras do controle (veja Atributos extras): `inputmode`, `maxlength`, `pattern`, `rows`, `data-*`… |
| `combobox` | `id` | texto | — | `id` do `<select>` (o campo de busca do elemento assume esse `id`). Dica `<id>-hint`, erro `<id>-error`. |
| `combobox` | `rotulo` | texto | — | Texto do `<label>`. |
| `combobox` | `nome` | texto | o `id` | `name` do `<select>` (o valor enviado). |
| `combobox` | `valor` | texto | — | Valor da opção escolhida. |
| `combobox` | `opcoes` | lista | — | Opções `{valor, texto}`. |
| `combobox` | `opcao_vazia` | texto | — | Opção de valor vazio; com o elemento, vira o placeholder ("Selecione a escola"). |
| `combobox` | `obrigatorio` | booleano | `false` | `required` e `*` visual no rótulo. |
| `combobox` | `dica` | texto | — | Dica abaixo do campo. Com `erro`, a dica sai. |
| `combobox` | `erro` | texto | — | Mensagem de erro (`aria-invalid` e `aria-describedby`). |
| `combobox` | `desabilitado` | booleano | `false` | `disabled` no `<select>`. |
| `combobox` | `texto_vazio` | texto | Nenhum resultado | Mensagem quando o filtro não acha nada (atributo `empty-text` do elemento). |
| `radio-grupo` | `id` | texto | — | `id` do primeiro rádio (os outros: `<id>-2`, `<id>-3`…). Dica `<id>-hint`, erro `<id>-error`. |
| `radio-grupo` | `rotulo` | texto | — | Texto da `<legend>` (a pergunta). |
| `radio-grupo` | `nome` | texto | o `id` | `name` dos rádios. |
| `radio-grupo` | `valor` | texto | — | Valor da opção marcada. |
| `radio-grupo` | `opcoes` | lista | — | Opções `{valor, texto}`. |
| `radio-grupo` | `obrigatorio` | booleano | `false` | `required` nos rádios e `*` visual na legenda. |
| `radio-grupo` | `dica` | texto | — | Dica do grupo, ligada ao `<fieldset>`. Com `erro`, a dica sai. |
| `radio-grupo` | `erro` | texto | — | Mensagem de erro do grupo; cada rádio recebe `aria-invalid="true"`. |
| `radio-grupo` | `desabilitado` | booleano | `false` | `disabled` no `<fieldset>` (todas as opções). |
| `checkbox` | `id` | texto | — | `id` da caixa (no grupo, da primeira; as outras, `<id>-2`…). Dica `<id>-hint`, erro `<id>-error`. |
| `checkbox` | `rotulo` | texto | — | Texto ao lado da caixa; no grupo, a `<legend>`. |
| `checkbox` | `nome` | texto | o `id` | `name` (no grupo do PHP, termine com `[]`). |
| `checkbox` | `valor` | texto ou lista | — | Caixa única: o `value` enviado (sem ele, o navegador envia `on`). Grupo: a lista dos valores marcados. |
| `checkbox` | `marcado` | booleano | `false` | Caixa única marcada (`checked`). |
| `checkbox` | `opcoes` | lista | — | Com opções `{valor, texto}`, vira um grupo em `<fieldset>`. |
| `checkbox` | `obrigatorio` | booleano | `false` | Caixa única: `required` e `*`. Grupo: só o `*` na legenda (valide no servidor). |
| `checkbox` | `dica` | texto | — | Dica da caixa ou do grupo. Com `erro`, a dica sai. |
| `checkbox` | `erro` | texto | — | Mensagem de erro; as caixas recebem `aria-invalid="true"`. |
| `checkbox` | `desabilitado` | booleano | `false` | `disabled` na caixa ou no `<fieldset>`. |
| `resumo-de-erros` | `erros` | mapa ou lista | — | O mapa `campo → mensagem` (o mesmo do `erro` de cada campo) ou a lista `{campo, mensagem}`; `campo` é o `id` do controle. Vazio não imprime nada; item sem campo ou mensagem não vira link. |
| `resumo-de-erros` | `titulo` | texto | Há um problema | Título `<h2>` do resumo. |
| `resumo-de-erros` | `id` | texto | `resumo-de-erros` | `id` do resumo; o título é `<id>-titulo`. |
| `resumo-de-erros` | `focar` | booleano | `true` | `autofocus`: o foco vai para o resumo quando a página volta com erros, como o `autoFocus` do ErrorSummary do kit. |
| `alerta` | `descricao` | texto | — | Texto do aviso. |
| `alerta` | `titulo` | texto | — | Título curto do aviso. |
| `alerta` | `variante` | `info`, `success`, `warning`, `danger` | `info` | Cor e ícone. |
| `alerta` | `anuncio` | `assertive`, `polite`, `off` | `assertive` em `danger`, `polite` nas outras | `role="alert"`, `role="status"` ou nenhum, como o `announce` do Alert do kit. Aviso que já vem na página pode usar `off`. |
| `alerta` | `id` | texto | — | `id` do aviso. |
| `botao` | `texto` | texto | — | Texto do botão. |
| `botao` | `variante` | `primary`, `secondary`, `outline`, `ghost`, `destructive`, `success`, `link` | `primary` | Variante visual. |
| `botao` | `tamanho` | `sm`, `md`, `lg` | `md` | Tamanho (o `md` não gera modificador). |
| `botao` | `tipo` | `button`, `submit`, `reset` | `button` | `type` do `<button>`. |
| `botao` | `href` | texto | — | Gera um link `<a>` com aparência de botão. |
| `botao` | `desabilitado` | booleano | `false` | `disabled` no `<button>`; no link, tira o `href` e põe `aria-disabled="true"`. |
| `botao` | `rotulo` | texto | — | `aria-label`, quando o texto visível não basta. |
| `botao` | `id` | texto | — | `id` do botão. |
| `botao` | `nome` | texto | — | `name` do `<button>`. |
| `botao` | `valor` | texto | — | `value` do `<button>`. |
| `botao` | `atributos` | mapa | — | Atributos extras (veja Atributos extras): gatilhos do `@semec/ds-elements`, `aria-describedby`, `form`… |

## Largura da página

O `@semec/ds-css` não tem classe de contêiner (as classes saem dos componentes do kit, e o kit não tem um): a largura do conteúdo é do app. Um ponto de partida, com os tokens, no CSS do app (passe-o no bloco `head` do layout):

```css
#conteudo {
  max-width: 72rem;
  margin-inline: auto;
  padding: var(--space-6) var(--space-4);
}
/* Grade de colunas: minmax(0, 1fr), senão uma tabela larga estoura a tela em 320 px. */
.minha-grade { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--space-6); }
```

## Segurança

- Escape em tudo: PHP com `htmlspecialchars(…, ENT_QUOTES)`; Jinja, Twig e Blade com o autoescape de HTML, ligado dentro de cada parcial do Jinja e do Twig mesmo que o ambiente o desligue. Nenhum parâmetro é impresso como HTML.
- O que as parciais ligam não protege a **sua** tela: no Flask, configure o autoescape para `.jinja` (veja a seção Jinja2) ou use `.html`.
- `atributos` só aceita nomes da lista (nunca `on*`, `style` ou `href`), e o valor sai escapado.
- Endereços (`href`, `marca_src`, `css_href`…) são escapados, mas não filtrados: não passe URL digitada pelo usuário sem validar o esquema (`javascript:` é um link válido para o navegador).
- Os testes renderizam dados com `<script>`, aspas e atributos `on*` nas quatro linguagens e conferem que nada sai cru.

## Comportamento

O HTML é o mesmo que o CSS espera; o comportamento continua com o app ou com o `@semec/ds-elements`:

- O resumo de erros recebe `autofocus` e é focado quando a página carrega com erros (envio tradicional de formulário). Se o formulário for enviado por JavaScript, chame `resumo.focus()` depois de inserir o resumo. O link do resumo leva ao campo e o CSS deixa uma margem acima dele (`scroll-margin-top`), para o rótulo continuar visível.
- Os campos não mostram erro enquanto a pessoa digita; mostre-os no envio, junto com o resumo.
- O layout carrega o `@semec/ds-elements` com `type="module"`: os elementos `<semec-*>` (diálogo, abas, combobox, menu, acordeão) funcionam no conteúdo da página sem mais configuração. Para abrir um diálogo por um botão da parcial `botao`, use `atributos` (`data-semec-dialog-open`).

## Testes

`npm run test:modelos` (na raiz do monorepo, depois de `npm run build:pacotes`) renderiza cada parcial com as mesmas fixtures nas quatro linguagens, compara com um HTML canônico único, roda o axe-core no Chromium, confere as classes contra o `classes.json`, testa XSS e confere esta tabela contra os modelos. Também roda os exemplos desta página como estão (PHP com e sem erro, Jinja com `StrictUndefined`, Twig com `strict_variables`, Blade), confere que eles são os mesmos da página do site e sobe um app Flask de verdade para provar a configuração de autoescape. Precisa de PHP 8.2+ com Composer e Python 3 (instala `twig/twig`, `illuminate/view`, `jinja2` e `flask` só para o teste) ou, sem eles, do Docker (`php:8.3-cli`, `composer:2`, `python:3.12-slim`).
