import Link from "next/link";
import MdxPre from "@/components/docs/MdxPre";
import Note from "@/components/ui/Note";

export const metadata = {
  title: "Modelos de servidor",
  description:
    "Parciais oficiais do SEMEC Design System para PHP, Laravel (Blade), Symfony (Twig), Django e Flask (Jinja2): página, cabeçalho, rodapé, campo, resumo de erros, alerta e botão, com escape e acessibilidade.",
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
  { nome: "resumo-de-erros", gera: "Lista de links para os campos com erro, focada quando a página volta do envio." },
  { nome: "alerta", gera: "Aviso info, success, warning ou danger, com o ícone e o role do Alert do kit." },
  { nome: "botao", gera: "<button> ou link com aparência de botão, nas variantes e tamanhos do Button." },
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
        <code>templates/</code> com oito parciais em quatro linguagens: PHP puro,
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
        o HTML do seu app.
      </p>
      <Code>{`<?php
require __DIR__ . '/semec/semec.php';

echo semec_render('pagina', [
    'titulo' => 'Transferência escolar — SEMEC',
    'cabecalho' => [
        'marca_src' => '/img/marca.svg',
        'servico' => 'Matrícula e transferência',
        'nav' => [
            ['href' => '/transferencia', 'texto' => 'Transferência', 'atual' => true],
        ],
    ],
    'conteudo' => function () use ($erros, $dados) {
        echo semec_render('resumo-de-erros', ['erros' => $erros]);
        echo '<form method="post" novalidate>';
        echo semec_render('campo', [
            'id' => 'cpf',
            'rotulo' => 'CPF',
            'obrigatorio' => true,
            'valor' => $dados['cpf'] ?? '',
            'dica' => 'Somente números.',
            'erro' => $errosPorCampo['cpf'] ?? null,
        ]);
        echo semec_render('botao', ['texto' => 'Enviar', 'tipo' => 'submit']);
        echo '</form>';
    },
]);`}</Code>
      <p>
        <code>$erros</code> é a lista do resumo, no formato{" "}
        <code>{"[['campo' => 'cpf', 'mensagem' => 'Informe o CPF.']]"}</code>.
        Lista vazia não imprime nada.
      </p>

      <h2 id="jinja">Django e Flask (Jinja2)</h2>
      <p>
        Copie <code>templates/jinja</code> para uma pasta <code>semec/</code>{" "}
        dentro do diretório de templates. No Django, use o{" "}
        <a href="https://niwi.nz/django-jinja/latest/">django-jinja</a> (os
        arquivos <code>.jinja</code> vão para o motor Jinja2); no Flask, basta a
        pasta <code>templates/</code>.
      </p>
      <Code>{`{% extends "semec/pagina.jinja" %}
{% from "semec/campo.jinja" import campo %}
{% from "semec/botao.jinja" import botao %}
{% from "semec/resumo-de-erros.jinja" import resumo_de_erros %}

{% block conteudo %}
  {{ resumo_de_erros(erros=erros) }}
  <form method="post" novalidate>
    {{ campo(id="cpf", rotulo="CPF", obrigatorio=true,
             valor=dados.cpf, dica="Somente números.",
             erro=erros_por_campo.cpf) }}
    {{ botao(texto="Enviar", tipo="submit") }}
  </form>
{% endblock %}`}</Code>
      <p>
        Os parâmetros do layout vêm do contexto da view, por exemplo{" "}
        <code>
          render(request, &quot;transferencia.jinja&quot;, &#123;&quot;titulo&quot;: …,
          &quot;cabecalho&quot;: &#123;…&#125;&#125;)
        </code>
        . As macros têm o nome da parcial com <code>_</code> no lugar de{" "}
        <code>-</code>.
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
  {% include '@semec/resumo-de-erros.html.twig' with {erros: erros} only %}
  <form method="post" novalidate>
    {% include '@semec/campo.html.twig' with {
      id: 'cpf', rotulo: 'CPF', obrigatorio: true,
      valor: dados.cpf, dica: 'Somente números.',
      erro: erros_por_campo.cpf|default(null)
    } only %}
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
  @include('semec::resumo-de-erros', ['erros' => $resumo])
  <form method="post" novalidate>
    @csrf
    @include('semec::campo', [
      'id' => 'cpf', 'rotulo' => 'CPF', 'obrigatorio' => true,
      'valor' => old('cpf'), 'dica' => 'Somente números.',
      'erro' => $errors->first('cpf') ?: null,
    ])
    @include('semec::botao', ['texto' => 'Enviar', 'tipo' => 'submit'])
  </form>
@endsection`}</Code>
      <p>
        <strong>Atenção:</strong> o <code>@include</code> do Blade passa para a parcial todas as variáveis
        da view. Se a página tem <code>$titulo</code>, <code>$id</code> ou{" "}
        <code>$erro</code>, passe esses parâmetros na chamada ou renderize
        isolado com{" "}
        <code>&#123;!! view(&apos;semec::alerta&apos;, [...])-&gt;render() !!&#125;</code>{" "}
        (a parcial já escapou o HTML).
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
          que o projeto o tenha desligado (o Flask não liga para{" "}
          <code>.jinja</code>).
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
        em todos os textos e confere a tabela de parâmetros. Para rodar no
        monorepo:
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
