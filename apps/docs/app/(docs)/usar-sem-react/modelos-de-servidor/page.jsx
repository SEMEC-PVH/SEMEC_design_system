import Link from "next/link";
import MdxPre from "@/components/docs/MdxPre";
import Note from "@/components/ui/Note";

export const metadata = {
  title: "Modelos de servidor",
  description:
    "Parciais oficiais do SEMEC Design System para PHP, Laravel (Blade), Symfony (Twig), Django e Flask (Jinja2): página, cabeçalho, rodapé, campo, combobox, rádios, checkbox, resumo de erros, alerta e botão, com escape e acessibilidade.",
};

const REPO = "https://github.com/SEMEC-PVH/SEMEC_design_system";
const README_MODELOS = `${REPO}/tree/main/packages/css/templates#readme`;

/** Bloco de código com botão de copiar. Linhas longas rolam: o bloco recebe foco. */
function Code({ children }) {
  const longo = children.split("\n").some((l) => l.length > 28);
  return (
    <MdxPre tabIndex={longo ? 0 : undefined}>
      <code>{children}</code>
    </MdxPre>
  );
}

/** Tabela larga: região rolável nomeada e focável (WCAG 2.1.1). */
function Tabela({ label, children }) {
  return (
    // Região que rola precisa receber foco para rolar pelo teclado (axe
    // scrollable-region-focusable); é o padrão role="region" + aria-label.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className="table-scroll" role="region" aria-label={label} tabIndex={0}>
      <table>{children}</table>
    </div>
  );
}

const parciais = [
  { nome: "pagina", gera: "Layout base: lang pt-BR, CSS, fontes, script do @semec/ds-elements, pular para o conteúdo, cabeçalho, <main id=\"conteudo\"> e rodapé." },
  { nome: "pular-para-o-conteudo", gera: "Link \"Pular para o conteúdo principal\", primeiro elemento focável." },
  { nome: "cabecalho", gera: "Marca, órgão, serviço e menu, com aria-current=\"page\" no item atual." },
  { nome: "rodape", gera: "Seções de links e a linha final." },
  { nome: "campo", gera: "input, textarea ou select com rótulo, obrigatório, dica, erro, aria-describedby e aria-invalid." },
  { nome: "combobox", gera: "Campo de escolha com filtro: um <select> dentro do <semec-combobox>, com rótulo, dica e erro." },
  { nome: "radio-grupo", gera: "Grupo de rádios em <fieldset> com <legend>, dica e erro." },
  { nome: "checkbox", gera: "Uma caixa de marcação (declaração, aceite) ou um grupo delas em <fieldset>." },
  { nome: "resumo-de-erros", gera: "Lista de links para os campos com erro, focada quando a página volta do envio." },
  { nome: "alerta", gera: "Aviso info, success, warning ou danger, com o ícone e o role do Alert do kit." },
  { nome: "botao", gera: "<button> ou link com aparência de botão, nas variantes e tamanhos do Button; aceita os gatilhos do @semec/ds-elements em atributos." },
];

const linguagens = [
  { stack: "PHP puro", pasta: "templates/php", chamada: "semec_render('campo', [...])" },
  { stack: "Django (django-jinja) e Flask", pasta: "templates/jinja", chamada: "{{ campo(id=\"cpf\", ...) }}" },
  { stack: "Symfony, Slim (Twig)", pasta: "templates/twig", chamada: "{% include '@semec/campo.html.twig' with {...} only %}" },
  { stack: "Laravel (Blade)", pasta: "templates/blade", chamada: "@include('semec::campo', [...])" },
];

const camposParametros = [
  { nome: "id", desc: "id do controle. A dica vira <id>-hint e o erro, <id>-error." },
  { nome: "rotulo", desc: "Texto do <label>." },
  { nome: "tipo", desc: "text (padrão), email, tel, number, date, password, url, search, textarea ou select." },
  { nome: "valor", desc: "Valor atual: value, conteúdo do textarea ou opção selecionada." },
  { nome: "obrigatorio", desc: "required no controle e * visual (aria-hidden) no rótulo." },
  { nome: "dica", desc: "Dica ligada por aria-describedby. Com erro, a dica sai, como no FormField do kit." },
  { nome: "erro", desc: "Mensagem de erro: marca aria-invalid=\"true\" e entra no aria-describedby." },
  { nome: "opcoes, opcao_vazia", desc: "Opções do select ({valor, texto}) e a primeira opção vazia (\"Selecione\")." },
  { nome: "nome, autocomplete, desabilitado", desc: "name (padrão: o id), autocomplete e disabled." },
  { nome: "atributos", desc: "Mapa de atributos extras: inputmode, maxlength, pattern, rows, placeholder, data-* e aria-*. Outros nomes (on*, style, class, href) são ignorados; o valor sai escapado." },
];

export default function ModelosDeServidorPage() {
  return (
    <>
      <h1>Modelos de servidor</h1>
      <p className="subtitle">
        Parciais prontas do SEMEC Design System para PHP, Laravel, Symfony,
        Django e Flask: a tela sai com o mesmo HTML, o mesmo visual e a mesma
        acessibilidade dos componentes React.
      </p>

      <p>
        O <code>@semec/ds-css</code> traz, além das classes, a pasta{" "}
        <code>templates/</code> com onze parciais em quatro linguagens: PHP puro,
        Jinja2, Twig e Blade. Os nomes e os parâmetros são os mesmos nas quatro,
        e todas geram o HTML recomendado nas{" "}
        <Link href="/usar-sem-react">instruções para usar sem React</Link>, com
        rótulo, dica, erro e <code>aria-*</code> já ligados. Você passa os dados;
        a parcial cuida da marcação e do escape.
      </p>

      <h2 id="parciais">Parciais</h2>
      <Tabela label="Parciais disponíveis">
        <thead>
          <tr>
            <th scope="col">Parcial</th>
            <th scope="col">O que gera</th>
          </tr>
        </thead>
        <tbody>
          {parciais.map((p) => (
            <tr key={p.nome}>
              <td>
                <code>{p.nome}</code>
              </td>
              <td>{p.gera}</td>
            </tr>
          ))}
        </tbody>
      </Tabela>

      <h2 id="instalacao">Instalação</h2>
      <Code>{`npm install @semec/ds-css @semec/ds-elements`}</Code>
      <p>
        Os modelos ficam em <code>node_modules/@semec/ds-css/templates/</code>.
        Copie a pasta da sua linguagem para o projeto e publique na pasta pública
        o <code>dist/semec-ds.css</code> do <code>@semec/ds-css</code>, o{" "}
        <code>dist/fonts.css</code> com a pasta <code>dist/fonts/</code> do{" "}
        <code>@semec/ds-tokens</code> e o <code>dist/semec-elements.js</code> do{" "}
        <code>@semec/ds-elements</code>. O layout procura esses arquivos em{" "}
        <code>/css/semec-ds.css</code>, <code>/css/fonts.css</code> e{" "}
        <code>/js/semec-elements.js</code>; mude com os parâmetros{" "}
        <code>css_href</code>, <code>fontes_href</code> e{" "}
        <code>elements_src</code>.
      </p>
      <Tabela label="Pasta e forma de chamar em cada linguagem">
        <thead>
          <tr>
            <th scope="col">Sistema</th>
            <th scope="col">Pasta</th>
            <th scope="col">Chamada</th>
          </tr>
        </thead>
        <tbody>
          {linguagens.map((l) => (
            <tr key={l.pasta}>
              <td>{l.stack}</td>
              <td>
                <code>{l.pasta}</code>
              </td>
              <td>
                <code>{l.chamada}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </Tabela>
      <p>
        Ao atualizar o pacote, copie a pasta de novo: os modelos acompanham as
        classes da mesma versão do CSS.
      </p>

      <h2 id="php">PHP puro</h2>
      <p>
        Inclua o <code>semec.php</code> uma vez. <code>semec_render()</code>{" "}
        devolve o HTML da parcial; o conteúdo da página é uma função que imprime
        o HTML do seu app. Os exemplos desta página usam{" "}
        <strong>um único mapa campo → mensagem</strong> (<code>$erros</code>)
        para o resumo e para cada campo: vazio, nada aparece. Os quatro exemplos
        rodam como estão no teste dos modelos.
      </p>
      <Code>{`<?php
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
]);`}</Code>
      <p>
        A função do <code>conteudo</code> só enxerga as variáveis do{" "}
        <code>use (...)</code>; se faltar uma, o PHP não avisa por causa do{" "}
        <code>??</code>. O resumo também aceita a lista{" "}
        <code>{"[['campo' => 'cpf', 'mensagem' => '…']]"}</code>; item sem campo
        ou sem mensagem não vira link.
      </p>
      <Note>
        A marca da Prefeitura não vem no pacote: use o arquivo oficial do órgão,
        servido pelo seu app, em <code>marca_src</code>. Sem ele, o cabeçalho sai
        só com o nome do órgão e do serviço.
      </Note>

      <h2 id="jinja">Django e Flask (Jinja2)</h2>
      <p>
        Copie <code>templates/jinja</code> para uma pasta <code>semec/</code>{" "}
        dentro do diretório de templates. No Django, use o{" "}
        <a href="https://niwi.nz/django-jinja/latest/">django-jinja</a> (os
        arquivos <code>.jinja</code> vão para o motor Jinja2); no Flask, a
        pasta <code>templates/</code>, com o autoescape configurado (abaixo).
      </p>
      <Code>{`{% extends "semec/pagina.jinja" %}
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
{% endblock %}`}</Code>
      <p>
        A view passa <code>erros</code> (o mapa, vazio quando não há erro),{" "}
        <code>dados</code> (<code>{"{}"}</code> no primeiro acesso) e os
        parâmetros do layout, por exemplo{" "}
        <code>
          render(request, &quot;transferencia.jinja&quot;, &#123;&quot;titulo&quot;: …,
          &quot;cabecalho&quot;: &#123;…&#125;, &quot;erros&quot;: erros, &quot;dados&quot;: dados&#125;)
        </code>
        . No Django, ponha <code>{"{{ csrf_input }}"}</code> dentro do{" "}
        <code>&lt;form&gt;</code>. As macros têm o nome da parcial com{" "}
        <code>_</code> no lugar de <code>-</code>. Funciona com{" "}
        <code>StrictUndefined</code> (use <code>.get()</code> para chave que pode
        faltar).
      </p>
      <Note>
        <strong>Flask: ligue o autoescape para .jinja.</strong> O Flask só escapa
        templates <code>.html</code>, <code>.htm</code>, <code>.xml</code>,{" "}
        <code>.xhtml</code> e <code>.svg</code>. As parciais do DS ligam o
        próprio autoescape, mas a sua tela (o template filho) não: com o nome{" "}
        <code>transferencia.jinja</code>, um <code>{"{{ dados.nome }}"}</code>{" "}
        sai cru, e isso é XSS. Configure ao criar o app, ou dê às suas telas a
        extensão <code>.html</code>:
      </Note>
      <Code>{`from jinja2 import select_autoescape

app.jinja_env.autoescape = select_autoescape(["html", "htm", "xml", "xhtml", "jinja"])`}</Code>
      <p>
        No Django com django-jinja, a extensão <code>.jinja</code> precisa estar no{" "}
        <code>match_extension</code> e o motor com{" "}
        <code>&quot;autoescape&quot;: True</code> (o padrão do django-jinja).
      </p>
      <Note>
        O motor padrão do Django (DTL) não lê Jinja2. Num projeto só com DTL, use
        o django-jinja nas telas novas ou copie o HTML das{" "}
        <Link href="/usar-sem-react">instruções sem React</Link>.
      </Note>

      <h2 id="twig">Symfony e Slim (Twig)</h2>
      <p>
        Registre a pasta com o namespace <code>semec</code>: no Symfony,{" "}
        <code>twig.paths</code> no <code>config/packages/twig.yaml</code>; no
        Twig puro, <code>$loader-&gt;addPath($pasta, &apos;semec&apos;)</code>.
      </p>
      <Code>{`{% extends '@semec/pagina.html.twig' %}
{% block conteudo %}
  <h1 class="semec-heading semec-heading--1">Solicitar transferência</h1>
  {% include '@semec/resumo-de-erros.html.twig' with {erros: erros} only %}
  <form method="post" novalidate>
    {% include '@semec/campo.html.twig' with {id: 'cpf', rotulo: 'CPF', obrigatorio: true, valor: dados.cpf|default(null), erro: erros.cpf|default(null), dica: 'Somente números.', atributos: {inputmode: 'numeric', maxlength: 11}} only %}
    {% include '@semec/botao.html.twig' with {texto: 'Enviar', tipo: 'submit'} only %}
  </form>
{% endblock %}`}</Code>
      <p>
        Use sempre <code>only</code>, para a parcial não receber as variáveis da
        página. As parciais funcionam com <code>strict_variables</code> ligado.
      </p>

      <h2 id="blade">Laravel (Blade)</h2>
      <p>
        Copie <code>templates/blade</code> para{" "}
        <code>resources/views/vendor/semec</code> e registre o namespace no{" "}
        <code>AppServiceProvider</code>:{" "}
        <code>
          View::addNamespace(&apos;semec&apos;, resource_path(&apos;views/vendor/semec&apos;))
        </code>
        .
      </p>
      <Code>{`@extends('semec::pagina')
@section('conteudo')
  <h1 class="semec-heading semec-heading--1">Solicitar transferência</h1>
  {!! view('semec::resumo-de-erros', ['erros' => array_map(fn ($m) => $m[0], $errors->getMessages())])->render() !!}
  <form method="post" novalidate>
    @csrf
    {!! view('semec::campo', ['id' => 'cpf', 'rotulo' => 'CPF', 'obrigatorio' => true, 'valor' => old('cpf'), 'erro' => $errors->first('cpf') ?: null, 'dica' => 'Somente números.', 'atributos' => ['inputmode' => 'numeric', 'maxlength' => 11]])->render() !!}
    {!! view('semec::botao', ['texto' => 'Enviar', 'tipo' => 'submit'])->render() !!}
  </form>
@endsection`}</Code>
      <p>
        <code>&#123;!! view(&apos;semec::…&apos;, [...])-&gt;render() !!&#125;</code>{" "}
        renderiza a parcial isolada; o <code>&#123;!! !!&#125;</code> só imprime
        o HTML que a parcial já escapou. <strong>Não use <code>@include</code>{" "}
        com as parciais:</strong> ele passa todas as variáveis da view, e o{" "}
        <code>$titulo</code> do layout viraria o título do resumo de erros; um{" "}
        <code>$id</code>, <code>$tipo</code> ou <code>$erro</code> mudaria o
        campo.
      </p>

      <h2 id="escolhas">Combobox, rádios e checkbox</h2>
      <ul>
        <li>
          <code>combobox</code>: o <code>&lt;semec-combobox&gt;</code> envolve só
          o <code>&lt;select&gt;</code>, então a lista abre colada ao campo, não
          depois da dica ou do erro. Sem JavaScript, o select funciona sozinho;
          com o <code>@semec/ds-elements</code>, vira campo com filtro e o campo
          de busca assume o <code>id</code> (o link do resumo é{" "}
          <code>#id</code>).
        </li>
        <li>
          <code>radio-grupo</code> e <code>checkbox</code> com{" "}
          <code>opcoes</code>: <code>&lt;fieldset&gt;</code> com{" "}
          <code>&lt;legend&gt;</code>, dica e erro ligados ao grupo. O primeiro
          controle leva o <code>id</code> (o link do resumo é <code>#id</code>);
          os outros, <code>id-2</code>, <code>id-3</code>…
        </li>
        <li>
          <code>checkbox</code> sem <code>opcoes</code>: uma caixa só, com o
          rótulo ao lado (declaração, aceite dos termos).
        </li>
      </ul>

      <h2 id="atributos">Atributos extras</h2>
      <p>
        <code>campo</code> e <code>botao</code> aceitam <code>atributos</code>,
        um mapa nome → valor: os gatilhos do <code>@semec/ds-elements</code>{" "}
        (<code>data-semec-dialog-open</code>, <code>data-semec-menu-trigger</code>
        …), <code>aria-describedby</code> e <code>form</code> num botão,{" "}
        <code>inputmode</code>, <code>maxlength</code>, <code>pattern</code> e{" "}
        <code>rows</code> num campo. Só valem nomes <code>data-*</code>,{" "}
        <code>aria-*</code> e uma lista de atributos de formulário; outros
        (<code>on*</code>, <code>style</code>, <code>class</code>,{" "}
        <code>href</code>) são ignorados, e o valor sai escapado.{" "}
        <code>true</code> gera o atributo sem valor.
      </p>

      <h2 id="parametros">Parâmetros</h2>
      <p>
        Os parâmetros são os mesmos nas quatro linguagens. Ausente, nulo ou vazio
        usa o padrão. Valor fora da lista (variante, tamanho, tipo) também volta
        ao padrão, então nenhum parâmetro vira classe ou atributo arbitrário. Os
        parâmetros do <code>campo</code>:
      </p>
      <Tabela label="Parâmetros da parcial campo">
        <thead>
          <tr>
            <th scope="col">Parâmetro</th>
            <th scope="col">O que faz</th>
          </tr>
        </thead>
        <tbody>
          {camposParametros.map((p) => (
            <tr key={p.nome}>
              <td>
                <code>{p.nome}</code>
              </td>
              <td>{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </Tabela>
      <p>
        A tabela completa, com todas as parciais, tipos e padrões, está no{" "}
        <a href={README_MODELOS}>README dos modelos</a>.
      </p>

      <h2 id="seguranca">Segurança</h2>
      <ul>
        <li>
          Toda saída é escapada: <code>htmlspecialchars</code> com{" "}
          <code>ENT_QUOTES</code> no PHP, autoescape de HTML no Jinja, no Twig e no
          Blade. O Jinja e o Twig ligam o autoescape dentro de cada parcial, mesmo
          que o projeto o tenha desligado. Isso não protege a sua tela: no
          Flask, configure o autoescape para <code>.jinja</code> (veja acima).
        </li>
        <li>
          Nenhum parâmetro aceita HTML. O conteúdo da página entra pelo bloco do
          template, escrito por você.
        </li>
        <li>
          Endereços (<code>href</code>, <code>marca_src</code>) são escapados, mas
          não filtrados. Não use como link uma URL digitada pelo usuário sem
          validar o esquema.
        </li>
      </ul>

      <h2 id="comportamento">Comportamento e acessibilidade</h2>
      <ul>
        <li>
          O resumo de erros recebe <code>autofocus</code>: quando o formulário
          volta do servidor com erros, o foco vai para ele, como no{" "}
          <code>ErrorSummary</code> do kit. Em envio por JavaScript, chame{" "}
          <code>focus()</code> no resumo depois de inseri-lo.
        </li>
        <li>
          Com erro, a mensagem substitui a dica e o campo recebe{" "}
          <code>aria-invalid=&quot;true&quot;</code>. Mostre os erros no envio,
          não enquanto a pessoa digita (veja{" "}
          <Link href="/padroes/formularios/mensagens-de-erro">Mensagens de erro</Link>
          ).
        </li>
        <li>
          O layout carrega o <code>@semec/ds-elements</code> como módulo. Os
          elementos <code>&lt;semec-*&gt;</code> (diálogo, abas, combobox, menu e
          acordeão) funcionam dentro do conteúdo sem outra configuração.
        </li>
      </ul>

      <h2 id="testes">Como é testado</h2>
      <p>
        Cada parcial é renderizada nas quatro linguagens com os mesmos dados e
        comparada com um único HTML de referência. O mesmo teste roda o axe-core
        no Chromium (zero violações), confere cada classe contra a lista oficial
        do <code>@semec/ds-css</code>, injeta <code>&lt;script&gt;</code> e aspas
        em todos os textos e confere a tabela de parâmetros. Os exemplos desta
        página rodam como estão (com e sem erro), e um app Flask de verdade
        confirma a configuração de autoescape. Para rodar no monorepo:
      </p>
      <Code>{`npm run build:pacotes
npm run test:modelos`}</Code>
      <p>
        O teste usa PHP 8.2+, Composer e Python 3 da máquina ou, sem eles, o
        Docker.
      </p>

      <h2 id="mais">Para saber mais</h2>
      <ul>
        <li>
          <a href={README_MODELOS}>README dos modelos</a>, com a tabela de
          parâmetros.
        </li>
        <li>
          Decisão:{" "}
          <a href={`${REPO}/blob/main/docs/adr/0030-modelos-de-servidor-no-ds-css.md`}>
            ADR-030
          </a>{" "}
          (modelos oficiais de servidor no <code>@semec/ds-css</code>).
        </li>
        <li>
          <Link href="/usar-sem-react">Usar sem React</Link>: pacotes, CDN e as
          classes <code>.semec-*</code>.
        </li>
      </ul>
    </>
  );
}
