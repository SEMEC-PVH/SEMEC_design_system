import Link from "next/link";
import MdxPre from "@/components/docs/MdxPre";
import Note from "@/components/ui/Note";

export const metadata = {
  title: "Usar sem React",
  description:
    "Como usar a identidade visual do SEMEC Design System sem React: @semec/ds-tokens, @semec/ds-css, HTML, PHP, Django, Flask, Vue, Angular, Android, iOS e Figma.",
};

const REPO = "https://github.com/SEMEC-PVH/SEMEC_design_system";

// Versões e caminhos físicos dos arquivos no CDN. O jsDelivr serve os arquivos
// do pacote, não os aliases do "exports": o caminho é o do tarball publicado.
// Ao trocar a versão, recalcule o SRI sobre o arquivo publicado com
// `npm run sri` (scripts/release/sri.mjs), que reescreve as constantes SRI_*.
const VERSAO_TOKENS = "1.0.0";
const VERSAO_CSS = "1.1.1";
const SRI_FONTS = "sha384-JPaBLIHnh0Pteb6nPfiQvklhUDnfvln4jCKfD1ASorqT7xYuyugBAs5ZvE32NxXb";
const SRI_CSS = "sha384-fidW0owPdsWVRx89cAJc3pdox6KepexJueUrreuoNW1MNXGhmRfddyuPv/zT6v/G";
const CDN_FONTS = `https://cdn.jsdelivr.net/npm/@semec/ds-tokens@${VERSAO_TOKENS}/dist/fonts.css`;
const CDN_CSS = `https://cdn.jsdelivr.net/npm/@semec/ds-css@${VERSAO_CSS}/dist/semec-ds.css`;

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

const pacotes = [
  {
    caso: "Página HTML, PHP, Django, Flask, Vue, Angular ou outro framework sem React",
    pacote: "@semec/ds-css",
    vem: "Classes .semec-* prontas (botão, campos, cartão, alerta, cabeçalho, tabela…), com tokens e base incluídos.",
  },
  {
    caso: "Diálogo, abas, combobox, menu ou acordeão nessas mesmas páginas",
    pacote: "@semec/ds-elements",
    vem: "Web Components acessíveis que dão o comportamento (teclado, foco, ARIA) ao HTML com as classes .semec-*. Veja Web Components.",
  },
  {
    caso: "App com CSS próprio (ou outro kit) que só quer as cores, fontes e medidas",
    pacote: "@semec/ds-tokens",
    vem: "Variáveis CSS (tokens.css), base opcional (base.css), fonte Poppins (fonts.css).",
  },
  {
    caso: "Android, iOS, Figma, back-end, PDF ou e-mail",
    pacote: "@semec/ds-tokens",
    vem: "tokens.json (DTCG), tokens em JS, colors.xml e dimens.xml, SemecTokens.swift, JSON do Tokens Studio.",
  },
  {
    caso: "App React",
    pacote: "@semec/ds + Tailwind v4",
    vem: "Componentes React acessíveis prontos. É o caminho da Introdução.",
  },
  {
    caso: "App sem React que já usa Tailwind v4",
    pacote: "@semec/ds (variante lite) + Tailwind v4",
    vem: "Tokens como utilitários do Tailwind (bg-primary, text-text-muted…), sem os componentes.",
  },
];

const classes = [
  {
    grupo: "Botão",
    nomes: ".semec-btn + --primary, --secondary, --outline, --ghost, --destructive, --success, --link; tamanhos --sm, --md (padrão), --lg e --icon",
    obs: "Estado desabilitado por [disabled] ou [aria-disabled=\"true\"]. --icon exige aria-label.",
  },
  {
    grupo: "Campos",
    nomes: ".semec-field (input, select, textarea), .semec-label, .semec-label__required, .semec-hint, .semec-error, .semec-form-field",
    obs: "Erro por [aria-invalid=\"true\"] no campo. .semec-form-field é o wrapper com o espaçamento do FormField.",
  },
  {
    grupo: "Escolha",
    nomes: ".semec-checkbox, .semec-radio, .semec-choice",
    obs: "Estilizam o input nativo; a linha .semec-choice dá o alvo de 44 px.",
  },
  {
    grupo: "Cartão",
    nomes: ".semec-card, __header, __title, __description, __content, __footer",
    obs: "",
  },
  {
    grupo: "Alerta",
    nomes: ".semec-alert + --info, --success, --warning, --danger; __title, __description",
    obs: "Junte ícone ou título ao texto: cor sozinha não comunica.",
  },
  {
    grupo: "Cabeçalho",
    nomes: ".semec-header, __brand, __divider, __org, __separator, __service, __nav, __link",
    obs: "Link atual com [aria-current=\"page\"].",
  },
  {
    grupo: "Rodapé",
    nomes: ".semec-footer, __content, __section, __title, __links, __link, __bottom",
    obs: "",
  },
  {
    grupo: "Pular para o conteúdo",
    nomes: ".semec-skip-link",
    obs: "Primeiro elemento focável da página, apontando para o <main>.",
  },
  {
    grupo: "Tabela",
    nomes: ".semec-table, __wrapper, __caption",
    obs: "O __wrapper rola na horizontal: use role=\"region\", tabindex=\"0\" e aria-label.",
  },
  {
    grupo: "Resumo de erros",
    nomes: ".semec-error-summary, __title, __list, __link",
    obs: "O foco ao enviar o formulário fica com o JavaScript do app (ou com o autofocus dos modelos de servidor).",
  },
  {
    grupo: "Badge",
    nomes: ".semec-badge + --default, --secondary, --outline, --success, --warning, --danger, --info",
    obs: "",
  },
  {
    grupo: "Toast",
    nomes: ".semec-toast + --info, --success, --warning, --danger; __body, __title, __description, __action, __close",
    obs: "Só a aparência. Mostrar, anunciar (role=\"status\") e fechar ficam com o app.",
  },
  {
    grupo: "Títulos",
    nomes: ".semec-heading + --1 a --6",
    obs: "A escala do Heading. Mantenha a ordem h1 → h2 → h3 no HTML.",
  },
  {
    grupo: "Diálogo",
    nomes: ".semec-dialog + --alert; __header, __title, __description, __footer, __close",
    obs: "No <dialog> nativo. Comportamento: <semec-dialog> do @semec/ds-elements.",
  },
  {
    grupo: "Abas",
    nomes: ".semec-tabs, __list, __trigger, __panel",
    obs: "Comportamento: <semec-tabs>.",
  },
  {
    grupo: "Combobox",
    nomes: ".semec-combobox, __input, __listbox, __option, __empty, __check",
    obs: "A partir de um <select> nativo. Comportamento: <semec-combobox>.",
  },
  {
    grupo: "Menu",
    nomes: ".semec-menu, __item, __separator, __label",
    obs: "Sem JavaScript, os itens ficam visíveis no fluxo. Comportamento: <semec-menu>.",
  },
  {
    grupo: "Acordeão",
    nomes: ".semec-accordion, __item, __header, __trigger, __panel, __icon",
    obs: "Sem JavaScript, os painéis ficam abertos. Comportamento: <semec-accordion>.",
  },
  {
    grupo: "Utilitário",
    nomes: ".semec-sr-only",
    obs: "Texto só para leitor de tela.",
  },
];

export default function UsarSemReactPage() {
  return (
    <>
      <h1>Usar sem React</h1>
      <p className="subtitle">
        A identidade visual do SEMEC Design System em qualquer tecnologia: HTML,
        PHP, Django, Flask, Vue, Angular, Android, iOS e Figma.
      </p>

      <p>
        Os componentes do <code>@semec/ds</code> são React. Para os outros
        sistemas da Prefeitura existem dois pacotes sem React, gerados da mesma
        fonte de tokens: o <code>@semec/ds-tokens</code> (cores, fontes e medidas
        em vários formatos) e o <code>@semec/ds-css</code> (classes CSS prontas
        com o mesmo visual dos componentes React).
      </p>

      <h2 id="qual-pacote">Qual pacote usar</h2>
      <Tabela label="Qual pacote usar em cada caso">
        <thead>
          <tr>
            <th scope="col">Seu caso</th>
            <th scope="col">Pacote</th>
            <th scope="col">O que vem</th>
          </tr>
        </thead>
        <tbody>
          {pacotes.map((p) => (
            <tr key={p.caso}>
              <td>{p.caso}</td>
              <td>
                <code>{p.pacote}</code>
              </td>
              <td>{p.vem}</td>
            </tr>
          ))}
        </tbody>
      </Tabela>
      <p>
        O <code>@semec/ds-css</code> já depende do <code>@semec/ds-tokens</code>:
        instale só ele quando quiser as classes. Os dois são somente CSS e dados,
        sem JavaScript de comportamento. Diálogo, abas, combobox, menu e
        acordeão ganham comportamento com os{" "}
        <Link href="/usar-sem-react/web-components">Web Components</Link> do{" "}
        <code>@semec/ds-elements</code>; foco do resumo de erros e mostrar o
        toast continuam com o código do seu app.
      </p>

      <h2 id="html">HTML puro</h2>
      <h3>Com npm</h3>
      <Code>{`npm install @semec/ds-css`}</Code>
      <p>
        Num projeto com bundler (Vite, webpack), importe uma vez, no arquivo de
        entrada. O <code>index.css</code> traz tokens, base e classes:
      </p>
      <Code>{`import "@semec/ds-tokens/fonts.css";
import "@semec/ds-css/index.css";`}</Code>
      <p>
        Sem bundler, o navegador não entende os nomes do pacote: aponte o{" "}
        <code>&lt;link&gt;</code> para os arquivos reais. Copie{" "}
        <code>dist/semec-ds.css</code> do <code>@semec/ds-css</code>, e o{" "}
        <code>dist/fonts.css</code> com a pasta <code>dist/fonts/</code> do{" "}
        <code>@semec/ds-tokens</code>, para a pasta pública do site. Mantenha{" "}
        <code>fonts/</code> ao lado do <code>fonts.css</code>, porque os
        endereços das fontes são relativos.
      </p>
      <Code>{`<link rel="stylesheet" href="/css/fonts.css">
<link rel="stylesheet" href="/css/semec-ds.css">`}</Code>

      <h3>Com CDN</h3>
      <p>
        Use sempre uma <strong>versão fixa</strong> e o atributo{" "}
        <code>integrity</code> (SRI). Assim o navegador recusa o arquivo se o
        conteúdo do CDN mudar:
      </p>
      <Code>{`<link rel="stylesheet" crossorigin="anonymous"
  href="${CDN_FONTS}"
  integrity="${SRI_FONTS}">
<link rel="stylesheet" crossorigin="anonymous"
  href="${CDN_CSS}"
  integrity="${SRI_CSS}">`}</Code>
      <Note>
        Os hashes acima valem só para o <code>@semec/ds-tokens</code>{" "}
        {VERSAO_TOKENS} e o <code>@semec/ds-css</code> {VERSAO_CSS}. Ao usar
        outra versão, calcule o hash do arquivo publicado com{" "}
        <code>curl -sL &lt;url&gt; | openssl dgst -sha384 -binary | openssl base64 -A</code>{" "}
        e prefixe com <code>sha384-</code>. Com Content-Security-Policy, libere{" "}
        <code>https://cdn.jsdelivr.net</code> em <code>style-src</code> e{" "}
        <code>font-src</code>.
      </Note>

      <h3>Exemplo de marcação</h3>
      <Code>{`<a class="semec-skip-link" href="#conteudo">Pular para o conteúdo</a>
<main id="conteudo" tabindex="-1">
  <h1 class="semec-heading--1">Solicitar certidão</h1>
  <form novalidate>
    <div class="semec-form-field">
      <label class="semec-label" for="cpf">
        CPF <span class="semec-label__required" aria-hidden="true">*</span>
      </label>
      <input class="semec-field" id="cpf" name="cpf" required
        aria-describedby="cpf-hint">
      <p class="semec-hint" id="cpf-hint">Somente números.</p>
    </div>
    <button class="semec-btn semec-btn--primary" type="submit">Enviar</button>
  </form>
</main>`}</Code>
      <p>
        Com erro, troque a dica pela mensagem: o campo recebe{" "}
        <code>aria-invalid=&quot;true&quot;</code> e{" "}
        <code>aria-describedby</code> passa a apontar para o{" "}
        <code>&lt;p class=&quot;semec-error&quot;&gt;</code>. As regras completas
        estão em{" "}
        <Link href="/padroes/formularios/mensagens-de-erro">Mensagens de erro</Link>.
      </p>

      <h2 id="servidor-e-frameworks">Servidor e frameworks</h2>
      <p>
        Em PHP, Laravel, Symfony, Django ou Flask, prefira os{" "}
        <Link href="/usar-sem-react/modelos-de-servidor">modelos de servidor</Link>:
        parciais prontas de página, cabeçalho, campo, resumo de erros, alerta e
        botão, com o HTML e a acessibilidade do kit e o escape já feitos.
      </p>

      <h3>PHP</h3>
      <p>
        Copie os arquivos para a pasta pública (como no HTML puro) e carregue-os
        no layout comum a todas as páginas:
      </p>
      <Code>{`<!-- layout.php -->
<head>
  <link rel="stylesheet" href="/css/fonts.css">
  <link rel="stylesheet" href="/css/semec-ds.css">
</head>
<body>
  <?php include __DIR__ . '/cabecalho.php'; ?>
  <main id="conteudo" tabindex="-1"><?= $conteudo ?></main>
</body>`}</Code>
      <p>
        Escape tudo que vem do usuário (<code>htmlspecialchars</code>) antes de
        pôr numa mensagem de erro ou num <code>value</code>.
      </p>

      <h3>Django</h3>
      <p>
        Coloque <code>fonts.css</code>, <code>fonts/</code> e{" "}
        <code>semec-ds.css</code> em <code>static/semec/</code> e use a tag{" "}
        <code>static</code> no template base:
      </p>
      <Code>{`{% load static %}
<link rel="stylesheet" href="{% static 'semec/fonts.css' %}">
<link rel="stylesheet" href="{% static 'semec/semec-ds.css' %}">`}</Code>
      <p>
        No widget do formulário, passe a classe pelos atributos, por exemplo{" "}
        <code>forms.TextInput(attrs=&#123;&quot;class&quot;: &quot;semec-field&quot;&#125;)</code>,
        e marque <code>aria-invalid</code> quando o campo tiver erro. Depois do{" "}
        <code>collectstatic</code>, confira na aba de rede que os{" "}
        <code>.woff2</code> respondem 200.
      </p>

      <h3>Flask</h3>
      <Code>{`<link rel="stylesheet" href="{{ url_for('static', filename='semec/fonts.css') }}">
<link rel="stylesheet" href="{{ url_for('static', filename='semec/semec-ds.css') }}">`}</Code>

      <h3>Vue</h3>
      <Code>{`// main.js
import "@semec/ds-tokens/fonts.css";
import "@semec/ds-css/index.css";`}</Code>
      <Code>{`<template>
  <div class="semec-form-field">
    <label class="semec-label" for="email">E-mail</label>
    <input
      id="email"
      v-model="email"
      class="semec-field"
      :aria-invalid="erro ? 'true' : undefined"
      :aria-describedby="erro ? 'email-error' : undefined"
    />
    <p v-if="erro" id="email-error" class="semec-error">{{ erro }}</p>
  </div>
</template>`}</Code>

      <h3>Angular</h3>
      <p>
        Declare os estilos no <code>angular.json</code>, antes do CSS do app:
      </p>
      <Code>{`"styles": [
  "@semec/ds-tokens/fonts.css",
  "@semec/ds-css/index.css",
  "src/styles.css"
]`}</Code>
      <Code>{`<input
  class="semec-field"
  id="nome"
  formControlName="nome"
  [attr.aria-invalid]="form.controls.nome.invalid && form.controls.nome.touched ? 'true' : null"
/>`}</Code>
      <p>
        Use <code>[attr.aria-invalid]</code>: com <code>null</code>, o Angular
        remove o atributo quando o campo está válido.
      </p>

      <h2 id="mobile-e-design">Android, iOS e Figma</h2>
      <p>
        Todos saem do mesmo <code>tokens.json</code>, gerado do CSS do pacote.
        Não edite os arquivos gerados: atualize o pacote e copie de novo.
      </p>

      <h3>Android</h3>
      <p>
        Copie <code>android/colors.xml</code> e <code>android/dimens.xml</code>{" "}
        de <code>node_modules/@semec/ds-tokens/dist/</code> para{" "}
        <code>app/src/main/res/values/</code>. Cada recurso é o token com o
        prefixo <code>semec_</code>, em snake_case (<code>--action-primary</code>{" "}
        vira <code>semec_action_primary</code>). Texto sai em <code>sp</code>, o
        resto em <code>dp</code>:
      </p>
      <Code>{`<Button
  android:background="@color/semec_action_primary"
  android:padding="@dimen/semec_space_4" />`}</Code>

      <h3>iOS</h3>
      <p>
        Adicione <code>dist/ios/SemecTokens.swift</code> ao alvo do app no
        Xcode. Ele traz as cores (<code>SemecTokens.Colors</code> para SwiftUI,{" "}
        <code>SemecTokens.UIColors</code> para UIKit) e as medidas (
        <code>SemecTokens.Dimensions</code>, em pontos). Os nomes seguem os
        tokens em camelCase: <code>--action-primary</code> vira{" "}
        <code>actionPrimary</code>.
      </p>
      <Code>{`Text("Enviar")
  .padding(SemecTokens.Dimensions.space4)
  .background(SemecTokens.Colors.actionPrimary)`}</Code>

      <h3>Figma</h3>
      <p>
        No plugin Tokens Studio, importe{" "}
        <code>dist/figma/tokens-studio.json</code> (Tools → Load from file). Para
        variáveis nativas do Figma, use a exportação do plugin para variables. Os
        valores são os mesmos do código, então o design e o sistema não divergem.
      </p>

      <h2 id="classes">Classes .semec-*</h2>
      <p>
        Os nomes abaixo são a API pública do <code>@semec/ds-css</code> e seguem
        BEM curto: bloco <code>.semec-x</code>, parte <code>__parte</code>,
        variação <code>--variacao</code>. O visual de cada classe é testado
        contra o componente React equivalente.
      </p>
      <Tabela label="Classes do @semec/ds-css">
        <thead>
          <tr>
            <th scope="col">Componente</th>
            <th scope="col">Classes</th>
            <th scope="col">Observação</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => (
            <tr key={c.grupo}>
              <td>{c.grupo}</td>
              <td>
                <code>{c.nomes}</code>
              </td>
              <td>{c.obs}</td>
            </tr>
          ))}
        </tbody>
      </Tabela>

      <h2 id="armadilhas">Armadilhas</h2>

      <h3>Reset em sistema existente</h3>
      <p>
        O <code>index.css</code> e o <code>semec-ds.css</code> incluem o{" "}
        <code>base.css</code>: zera margens, define a fonte e a cor do{" "}
        <code>body</code>, sublinha links soltos e desenha o anel de foco. Num
        sistema que já tem reset próprio (ou Bootstrap), isso muda telas
        inteiras. Nesse caso, importe só{" "}
        <code>@semec/ds-tokens/tokens.css</code> e{" "}
        <code>@semec/ds-css/components.css</code>, adote o{" "}
        <code>base.css</code> aos poucos e garanta um foco visível equivalente.
      </p>

      <h3>
        <code>outline: 0</code> em CSS legado
      </h3>
      <p>
        O <code>base.css</code> fica numa camada (<code>@layer base</code>). Uma
        regra antiga como <code>:focus &#123; outline: 0 &#125;</code> fora de
        camada vence o foco do design system, mesmo carregada antes. Remova essa
        regra. O axe não acusa foco apagado: percorra a tela com Tab e Shift+Tab
        e confira o anel em cada controle (veja{" "}
        <Link href="/padroes/acessibilidade/foco-visivel">Foco visível</Link>).
      </p>

      <h3>
        <code>data-surface=&quot;brand&quot;</code> não pinta o fundo
      </h3>
      <p>
        O atributo só troca o anel de foco para branco, para ele aparecer sobre
        a cor da marca. O elemento precisa ter o fundo de marca próprio,{" "}
        <code>background: var(--brand-hero)</code>. Sem esse fundo, o anel
        branco fica sobre a página clara com contraste de 1,08:1, e o foco some.
      </p>
      <Code>{`.faixa-destaque {
  background: var(--brand-hero);
  color: var(--text-on-brand);
}`}</Code>
      <Code>{`<section class="faixa-destaque" data-surface="brand">…</section>`}</Code>

      <h3>Caminhos do pacote</h3>
      <p>
        Nomes como <code>@semec/ds-css/index.css</code> só funcionam num bundler.
        No <code>&lt;link&gt;</code> e no CDN, use o caminho real do arquivo
        dentro do pacote e fixe a versão.
      </p>

      <h2 id="mais">Para saber mais</h2>
      <ul>
        <li>
          <a href={`${REPO}/tree/main/packages/tokens#readme`}>
            README do @semec/ds-tokens
          </a>{" "}
          e{" "}
          <a href={`${REPO}/tree/main/packages/css#readme`}>
            README do @semec/ds-css
          </a>
          .
        </li>
        <li>
          Decisões: ADR-026 (tokens e plataformas), ADR-028 (classes{" "}
          <code>.semec-*</code>) e{" "}
          <a href={`${REPO}/blob/main/docs/adr/0027-sem-build-commonjs.md`}>
            ADR-027
          </a>{" "}
          (pacote somente ESM), no{" "}
          <a href={`${REPO}/blob/main/docs/adr/README.md`}>índice de ADRs</a>.
        </li>
        <li>
          Para agentes de IA: a{" "}
          <a href={`${REPO}/blob/main/packages/react/skills/semec-ds-lite/SKILL.md`}>
            skill lite
          </a>{" "}
          resume tokens, acessibilidade e padrões de tela sem React.
        </li>
      </ul>
    </>
  );
}
