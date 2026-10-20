# Modelos de servidor do `@semec/ds-css`

Parciais prontas para montar telas do Design System SEMEC no servidor, sem React: **PHP puro**, **Jinja2** (Django com django-jinja, Flask), **Twig** (Symfony, Slim) e **Blade** (Laravel). As quatro linguagens têm as mesmas parciais, com os mesmos nomes e os mesmos parâmetros, e geram o mesmo HTML: o HTML recomendado no [README do pacote](../README.md), com as classes `.semec-*` e o ARIA certo. Decisão no [ADR-030](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/adr/0030-modelos-de-servidor-no-ds-css.md).

| Parcial | O que gera |
|---|---|
| `pagina` | Layout base: `<html lang="pt-BR">`, `<link>` das fontes e do CSS, `<script>` do `@semec/ds-elements`, pular para o conteúdo, cabeçalho, `<main id="conteudo">` e rodapé |
| `pular-para-o-conteudo` | Link "Pular para o conteúdo principal" |
| `cabecalho` | Marca, órgão, serviço e menu com `aria-current="page"` no item atual |
| `rodape` | Seções de links e a linha final |
| `campo` | `input`, `textarea` ou `select` com rótulo, obrigatório, dica, erro, `aria-describedby` e `aria-invalid` |
| `resumo-de-erros` | Lista de links para os campos com erro, focada ao carregar a página |
| `alerta` | Aviso nas variantes info, success, warning e danger, com o ícone do kit |
| `botao` | `<button>` ou link com a aparência de botão |

## Instalação

Os modelos vêm no pacote, em `node_modules/@semec/ds-css/templates/`. Copie a pasta da sua linguagem para o projeto (ou aponte o carregador de templates para ela) e publique na pasta pública os arquivos `dist/semec-ds.css` (deste pacote), `dist/fonts.css` com `dist/fonts/` (do `@semec/ds-tokens`) e `dist/semec-elements.js` (do `@semec/ds-elements`). Os caminhos padrão do layout são `/css/semec-ds.css`, `/css/fonts.css` e `/js/semec-elements.js`; troque pelos parâmetros `css_href`, `fontes_href` e `elements_src`.

Ao atualizar o pacote, copie de novo: os modelos acompanham as classes do CSS da mesma versão.

### PHP puro (8.2+)

```php
<?php
require __DIR__ . '/semec/semec.php'; // templates/php copiado para ./semec

echo semec_render('pagina', [
    'titulo' => 'Transferência escolar — SEMEC',
    'cabecalho' => [
        'marca_src' => '/img/marca.svg',
        'servico' => 'Matrícula e transferência',
        'nav' => [['href' => '/transferencia', 'texto' => 'Transferência', 'atual' => true]],
    ],
    'conteudo' => function () use ($erros, $dados) {
        echo semec_render('resumo-de-erros', ['erros' => $erros]);
        echo '<form method="post" novalidate>';
        echo semec_render('campo', [
            'id' => 'cpf', 'rotulo' => 'CPF', 'obrigatorio' => true,
            'valor' => $dados['cpf'] ?? '', 'erro' => $erros['cpf'] ?? null,
            'dica' => 'Somente números.',
        ]);
        echo semec_render('botao', ['texto' => 'Enviar', 'tipo' => 'submit']);
        echo '</form>';
    },
]);
```

`semec_render()` devolve o HTML. Toda saída passa por `semec_e()` (`htmlspecialchars` com `ENT_QUOTES`). O conteúdo da página (`conteudo`, `head`) é uma função que imprime o HTML do seu app; um texto passado no lugar dela sai escapado.

### Jinja2 (Django com django-jinja, Flask)

Copie `templates/jinja` para uma pasta `semec/` dentro do diretório de templates (os modelos se referem uns aos outros como `semec/…`).

```jinja
{% extends "semec/pagina.jinja" %}
{% from "semec/campo.jinja" import campo %}
{% from "semec/botao.jinja" import botao %}
{% from "semec/resumo-de-erros.jinja" import resumo_de_erros %}
{% block conteudo %}
  {{ resumo_de_erros(erros=erros) }}
  <form method="post" novalidate>
    {{ campo(id="cpf", rotulo="CPF", obrigatorio=true, valor=dados.cpf, erro=erros_por_campo.cpf, dica="Somente números.") }}
    {{ botao(texto="Enviar", tipo="submit") }}
  </form>
{% endblock %}
```

Os parâmetros do layout (`titulo`, `cabecalho`, `rodape`…) vêm do contexto da view: `render(request, "transferencia.jinja", {"titulo": …, "cabecalho": {…}})`. As macros se chamam como a parcial, com `_` no lugar de `-` (`resumo_de_erros`, `pular_para_o_conteudo`). Cada macro liga o próprio autoescape: o HTML sai escapado mesmo no Flask, que não liga o autoescape para a extensão `.jinja`. Funciona com `StrictUndefined`.

O Django com o motor de templates próprio (DTL) não lê Jinja: use o django-jinja para estas telas ou copie o HTML do README do pacote.

### Twig (Symfony, Slim)

Registre a pasta com o namespace `semec` (no Symfony, `twig.paths: {'%kernel.project_dir%/vendor-semec/twig': semec}`; no Twig puro, `$loader->addPath($dir, 'semec')`).

```twig
{% extends '@semec/pagina.html.twig' %}
{% block conteudo %}
  {% include '@semec/resumo-de-erros.html.twig' with {erros: erros} only %}
  <form method="post" novalidate>
    {% include '@semec/campo.html.twig' with {id: 'cpf', rotulo: 'CPF', obrigatorio: true, valor: dados.cpf, erro: erros_por_campo.cpf|default(null)} only %}
    {% include '@semec/botao.html.twig' with {texto: 'Enviar', tipo: 'submit'} only %}
  </form>
{% endblock %}
```

Use sempre `only`, para a parcial não herdar variáveis da página. Cada parcial liga o próprio autoescape (`html`). Funciona com `strict_variables` ligado (padrão do Symfony em desenvolvimento).

### Blade (Laravel)

Registre o namespace no `AppServiceProvider`: `View::addNamespace('semec', resource_path('views/vendor/semec'))` (copie `templates/blade` para essa pasta).

```blade
@extends('semec::pagina')
@section('conteudo')
  @include('semec::resumo-de-erros', ['erros' => $resumo])
  <form method="post" novalidate>
    @csrf
    @include('semec::campo', ['id' => 'cpf', 'rotulo' => 'CPF', 'obrigatorio' => true, 'valor' => old('cpf'), 'erro' => $errors->first('cpf') ?: null, 'dica' => 'Somente números.'])
    @include('semec::botao', ['texto' => 'Enviar', 'tipo' => 'submit'])
  </form>
@endsection
```

Atenção: o `@include` do Blade passa para a parcial **todas** as variáveis da view. Uma variável `$titulo`, `$id` ou `$erro` da página vira parâmetro da parcial se você não passar o seu. Passe os parâmetros que importam ou renderize isolado: `{!! view('semec::alerta', ['descricao' => 'Salvo.'])->render() !!}` (o `{!! !!}` aqui só imprime o HTML que a parcial já escapou). O layout `pagina` já renderiza cabeçalho, rodapé e o link de pular isolados.

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
| `pagina` | `conteudo` | bloco | — | Conteúdo do `<main id="conteudo">`. Jinja e Twig: `{% block conteudo %}`; Blade: `@section('conteudo')`; PHP: função que imprime. |
| `pagina` | `head` | bloco | — | Fim do `<head>` (CSS do app, por exemplo). Mesmo formato do `conteudo`. |
| `pular-para-o-conteudo` | `texto` | texto | Pular para o conteúdo principal | Texto do link. |
| `pular-para-o-conteudo` | `alvo` | texto | `conteudo` | `id` do `<main>` (sem `#`). |
| `cabecalho` | `marca_src` | texto | — | Endereço da imagem da marca. |
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
| `resumo-de-erros` | `erros` | lista | — | Itens `{campo, mensagem}`; `campo` é o `id` do controle. Lista vazia não imprime nada. |
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

## Segurança

- Escape em tudo: PHP com `htmlspecialchars(…, ENT_QUOTES)`; Jinja, Twig e Blade com o autoescape de HTML, ligado dentro de cada parcial do Jinja e do Twig mesmo que o ambiente o desligue. Nenhum parâmetro é impresso como HTML.
- Endereços (`href`, `marca_src`, `css_href`…) são escapados, mas não filtrados: não passe URL digitada pelo usuário sem validar o esquema (`javascript:` é um link válido para o navegador).
- Os testes renderizam dados com `<script>`, aspas e atributos `on*` nas quatro linguagens e conferem que nada sai cru.

## Comportamento

O HTML é o mesmo que o CSS espera; o comportamento continua com o app ou com o `@semec/ds-elements`:

- O resumo de erros recebe `autofocus` e é focado quando a página carrega com erros (envio tradicional de formulário). Se o formulário for enviado por JavaScript, chame `resumo.focus()` depois de inserir o resumo.
- Os campos não mostram erro enquanto a pessoa digita; mostre-os no envio, junto com o resumo.
- O layout carrega o `@semec/ds-elements` com `type="module"`: os elementos `<semec-*>` (diálogo, abas, combobox, menu, acordeão) funcionam no conteúdo da página sem mais configuração.

## Testes

`npm run test:modelos` (na raiz do monorepo, depois de `npm run build:pacotes`) renderiza cada parcial com as mesmas fixtures nas quatro linguagens, compara com um HTML canônico único, roda o axe-core no Chromium, confere as classes contra o `classes.json`, testa XSS e confere esta tabela contra os modelos. Precisa de PHP 8.2+ com Composer e Python 3 (instala `twig/twig`, `illuminate/view` e `jinja2` só para o teste) ou, sem eles, do Docker (`php:8.3-cli`, `composer:2`, `python:3.12-slim`).
