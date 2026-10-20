import Link from "next/link";
import MdxPre from "@/components/docs/MdxPre";
import Note from "@/components/ui/Note";

export const metadata = {
  title: "Web Components",
  description:
    "Diálogo, abas, combobox, menu e acordeão acessíveis sem React: @semec/ds-elements, Web Components em light DOM e sem dependências, para HTML, PHP, Django e Flask.",
};

const REPO = "https://github.com/SEMEC-PVH/SEMEC_design_system";

// Versão e caminho físico do arquivo no CDN (o jsDelivr serve o tarball, não o "exports").
// Ao trocar a versão (e depois da primeira publicação), recalcule o SRI sobre o
// arquivo publicado com `npm run sri` (scripts/release/sri.mjs). Enquanto a versão
// não está no npm, SRI_ELEMENTS fica com o marcador SRI_PENDENTE.
// O bloco do CDN mostra as três peças: fontes, CSS (as classes interativas só
// existem a partir do @semec/ds-css 1.1.0) e o script. VERSAO_CSS nunca abaixo
// de VERSAO_CSS_MINIMA.
const VERSAO_TOKENS = "1.0.0";
const SRI_FONTS = "sha384-JPaBLIHnh0Pteb6nPfiQvklhUDnfvln4jCKfD1ASorqT7xYuyugBAs5ZvE32NxXb";
const VERSAO_CSS_MINIMA = "1.1.0";
const VERSAO_CSS = "1.1.0";
const SRI_CSS = "sha384-j3GopGmbfBDbmxOnmviq5aOKVv2aScbeW5TzndRUOYUB/OcrQrD++8POpif35M/W";
const VERSAO_ELEMENTS = "1.0.0";
const SRI_PENDENTE = "sha384-CALCULE-NA-RELEASE";
const SRI_ELEMENTS = "sha384-X3yHwotBgX64Ja/D0NFwawT1nbyBHXFZKqk2K0M6IK0OLeMfY2fKRZP0eh0VWCco";
const CDN_FONTS = `https://cdn.jsdelivr.net/npm/@semec/ds-tokens@${VERSAO_TOKENS}/dist/fonts.css`;
const CDN_CSS = `https://cdn.jsdelivr.net/npm/@semec/ds-css@${VERSAO_CSS}/dist/semec-ds.css`;
const CDN_ELEMENTS = `https://cdn.jsdelivr.net/npm/@semec/ds-elements@${VERSAO_ELEMENTS}/dist/semec-elements.js`;
const PENDENTES = [SRI_CSS, SRI_ELEMENTS].some((v) => v === SRI_PENDENTE);

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
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className="table-scroll" role="region" aria-label={label} tabIndex={0}>
      <table>{children}</table>
    </div>
  );
}

function Teclas({ label, linhas }) {
  return (
    <Tabela label={label}>
      <thead>
        <tr>
          <th scope="col">Tecla ou ação</th>
          <th scope="col">O que acontece</th>
        </tr>
      </thead>
      <tbody>
        {linhas.map(([tecla, efeito]) => (
          <tr key={tecla}>
            <td>{tecla}</td>
            <td>{efeito}</td>
          </tr>
        ))}
      </tbody>
    </Tabela>
  );
}

const elementos = [
  { tag: "<semec-dialog>", react: "Dialog e AlertDialog", semJs: "Não abre. Use um link como gatilho para uma página com o mesmo conteúdo." },
  { tag: "<semec-tabs>", react: "Tabs", semJs: "A lista vira um sumário de links e todos os painéis aparecem." },
  { tag: "<semec-combobox>", react: "Combobox", semJs: "O <select> nativo funciona sozinho, com o mesmo name." },
  { tag: "<semec-menu>", react: "DropdownMenu", semJs: "Os itens aparecem como uma lista de botões e links." },
  { tag: "<semec-accordion>", react: "Accordion", semJs: "Todos os painéis aparecem abertos." },
];

export default function WebComponentsPage() {
  return (
    <>
      <h1>Web Components</h1>
      <p className="subtitle">
        Diálogo, abas, combobox, menu e acordeão com a mesma acessibilidade do
        kit React, em qualquer página HTML, PHP, Django ou Flask.
      </p>

      <p>
        O <code>@semec/ds-css</code> dá o visual. Para os componentes que
        precisam de comportamento (abrir, fechar, mover o foco, navegar pelo
        teclado), existe o <code>@semec/ds-elements</code>: cinco elementos
        HTML próprios que você escreve em volta do HTML com as classes{" "}
        <code>.semec-*</code>. Veja também{" "}
        <Link href="/usar-sem-react">Usar sem React</Link>.
      </p>

      <h2 id="como-funciona">Como funciona</h2>
      <ul>
        <li>
          <strong>Sem shadow DOM.</strong> O HTML continua seu: o CSS do app,
          os testes e as ferramentas de acessibilidade enxergam tudo.
        </li>
        <li>
          <strong>Aprimoramento progressivo.</strong> Sem JavaScript, o
          conteúdo continua legível. O elemento só acrescenta comportamento e
          atributos ARIA.
        </li>
        <li>
          <strong>Mesmo comportamento do kit.</strong> Teclado e foco seguem
          os padrões WAI-ARIA APG, comparados com os componentes React nos
          mesmos cenários.
        </li>
        <li>
          <strong>Sem dependências.</strong> Um arquivo de cerca de 29 kB (9 kB com gzip),
          somente ESM.
        </li>
      </ul>
      <Tabela label="Elementos do @semec/ds-elements">
        <thead>
          <tr>
            <th scope="col">Elemento</th>
            <th scope="col">Equivale no React</th>
            <th scope="col">Sem JavaScript</th>
          </tr>
        </thead>
        <tbody>
          {elementos.map((e) => (
            <tr key={e.tag}>
              <td>
                <code>{e.tag}</code>
              </td>
              <td>{e.react}</td>
              <td>{e.semJs}</td>
            </tr>
          ))}
        </tbody>
      </Tabela>

      <h2 id="instalar">Instalar</h2>
      <Note>
        Os elementos precisam do <code>@semec/ds-css</code>{" "}
        {VERSAO_CSS_MINIMA} ou mais novo. As classes dos componentes
        interativos não existem nas versões anteriores: os elementos
        funcionam, mas ficam sem estilo.
      </Note>
      <h3>Com npm</h3>
      <Code>{`npm install @semec/ds-elements "@semec/ds-css@^${VERSAO_CSS_MINIMA}"`}</Code>
      <Code>{`import "@semec/ds-tokens/fonts.css";
import "@semec/ds-css/index.css";
import "@semec/ds-elements/auto";`}</Code>
      <p>
        O <code>auto</code> registra todos os elementos ao importar. Para
        registrar quando quiser, use{" "}
        <code>import &#123; defineSemecElements &#125; from &quot;@semec/ds-elements&quot;</code>{" "}
        e chame <code>defineSemecElements()</code>. Chamar duas vezes, ou
        carregar o arquivo do CDN junto, não quebra.
      </p>

      <h3>Com CDN ou arquivo copiado</h3>
      <p>
        O bloco completo, com versão fixa em cada arquivo: as fontes, o CSS
        (a partir da {VERSAO_CSS_MINIMA}) e o script. Não use uma faixa como{" "}
        <code>@1</code>: o <code>integrity</code> vale para um arquivo só.
      </p>
      <Code>{`<link rel="stylesheet" crossorigin="anonymous"
  href="${CDN_FONTS}"
  integrity="${SRI_FONTS}">
<link rel="stylesheet" crossorigin="anonymous"
  href="${CDN_CSS}"
  integrity="${SRI_CSS}">
<script type="module" crossorigin="anonymous"
  src="${CDN_ELEMENTS}"
  integrity="${SRI_ELEMENTS}"></script>`}</Code>
      <Note>
        {PENDENTES ? (
          <>
            <code>{SRI_PENDENTE}</code> não é um valor: troque pelo hash do
            arquivo publicado daquela versão, como no CSS.{" "}
          </>
        ) : (
          <>
            Os hashes acima valem só para estas versões; em outra versão,
            calcule o do arquivo publicado, como no CSS.{" "}
          </>
        )}
        Sem CDN, copie <code>dist/semec-elements.js</code> e{" "}
        <code>dist/semec-elements.js.map</code> do pacote para a mesma pasta
        pública e aponte o <code>src</code> para o <code>.js</code> (sem o{" "}
        <code>.map</code>, o DevTools mostra um 404). O{" "}
        <code>type=&quot;module&quot;</code> já espera a página carregar: o
        script pode ficar no <code>&lt;head&gt;</code>.
      </Note>

      <h2 id="estados">Estados</h2>
      <p>
        Os elementos põem os mesmos atributos que o Radix põe no kit React, e
        o <code>@semec/ds-css</code> estiliza por eles. Não crie classes de
        estado próprias:
      </p>
      <ul>
        <li>
          <code>data-state=&quot;open&quot;</code> ou <code>&quot;closed&quot;</code>{" "}
          no diálogo, no menu, na lista do combobox e no acordeão;{" "}
          <code>&quot;active&quot;</code> ou <code>&quot;inactive&quot;</code>{" "}
          nas abas;
        </li>
        <li>
          <code>data-highlighted</code> no item ativo do menu e na opção ativa
          do combobox; <code>data-disabled</code> nos desabilitados;
        </li>
        <li>
          <code>aria-selected=&quot;true&quot;</code> na aba ativa e na opção
          ativa do combobox (a que o leitor de tela anuncia);{" "}
          <code>data-state=&quot;checked&quot;</code> na opção escolhida;
        </li>
        <li>
          <code>hidden</code> em painel ou popup fechado. Nada depende do CSS
          para esconder.
        </li>
      </ul>

      <h2 id="dialogo">Diálogo</h2>
      <p>
        Sem JavaScript, o diálogo não abre. Por isso o gatilho padrão é um
        link para uma página com o mesmo conteúdo: com JavaScript, ele abre o
        diálogo e passa a se comportar como botão.
      </p>
      <Code>{`<a class="semec-btn" href="/contato/editar"
  data-semec-dialog-open="editar-contato">Editar contato</a>

<semec-dialog id="editar-contato">
  <dialog class="semec-dialog">
    <div class="semec-dialog__header">
      <h2 class="semec-dialog__title">Editar contato</h2>
      <p class="semec-dialog__description">Altere o telefone.</p>
    </div>
    <!-- campos -->
    <div class="semec-dialog__footer">
      <button type="button" class="semec-btn semec-btn--outline"
        data-semec-dialog-close>Cancelar</button>
      <button type="button" class="semec-btn"
        data-semec-dialog-close>Salvar</button>
    </div>
    <!-- O X vem do CSS: sem <svg> dentro do botão. -->
    <button type="button" class="semec-dialog__close"
      data-semec-dialog-close><span class="semec-sr-only">Fechar</span></button>
  </dialog>
</semec-dialog>`}</Code>
      <p>
        Para confirmar uma ação destrutiva, acrescente <code>alert</code> ao{" "}
        <code>&lt;semec-dialog&gt;</code>, use{" "}
        <code>class=&quot;semec-dialog semec-dialog--alert&quot;</code> no{" "}
        <code>&lt;dialog&gt;</code> (o elemento põe o modificador se faltar) e
        marque o botão de cancelar com <code>data-semec-dialog-cancel</code>:
        ele recebe o foco ao abrir e o clique no fundo não fecha.
      </p>
      <h3 id="confirmar-envio">Confirmar antes de enviar</h3>
      <p>
        O gatilho é o próprio botão de envio. Sem JavaScript, ele envia o
        formulário direto; com JavaScript, abre o diálogo, e o
        &quot;Confirmar&quot; dentro do formulário envia.
      </p>
      <Code>{`<form method="post" action="/rascunhos/12/excluir">
  <button type="submit" class="semec-btn semec-btn--destructive"
    data-semec-dialog-open="confirmar-exclusao">Excluir rascunho</button>

  <semec-dialog id="confirmar-exclusao" alert>
    <dialog class="semec-dialog semec-dialog--alert">
      <div class="semec-dialog__header">
        <h2 class="semec-dialog__title">Excluir o rascunho?</h2>
        <p class="semec-dialog__description">Não pode ser desfeito.</p>
      </div>
      <div class="semec-dialog__footer">
        <button type="button" class="semec-btn semec-btn--outline"
          data-semec-dialog-cancel>Cancelar</button>
        <button type="submit" class="semec-btn semec-btn--destructive"
          >Confirmar</button>
      </div>
    </dialog>
  </semec-dialog>
</form>`}</Code>
      <Teclas
        label="Teclado do diálogo"
        linhas={[
          ["Enter ou Espaço no gatilho", "Abre o diálogo com o foco no primeiro campo (no alerta, no Cancelar)."],
          ["Tab e Shift+Tab", "Circulam dentro do diálogo: o foco não sai para a página."],
          ["Esc", "Fecha. O foco volta ao gatilho."],
          ["Clique no fundo", "Fecha, menos no alerta."],
        ]}
      />
      <p>
        O título e a descrição viram <code>aria-labelledby</code> e{" "}
        <code>aria-describedby</code>, a página para de rolar enquanto o
        diálogo está aberto e os eventos <code>semec-open</code> e{" "}
        <code>semec-close</code> avisam o seu código.
      </p>

      <h2 id="abas">Abas</h2>
      <Code>{`<semec-tabs class="semec-tabs">
  <nav class="semec-tabs__list" aria-label="Seções da matrícula">
    <a class="semec-tabs__trigger" href="#dados">Dados</a>
    <a class="semec-tabs__trigger" href="#documentos">Documentos</a>
  </nav>
  <section class="semec-tabs__panel" id="dados">…</section>
  <section class="semec-tabs__panel" id="documentos">…</section>
</semec-tabs>`}</Code>
      <Teclas
        label="Teclado das abas"
        linhas={[
          ["← e →", "Vão para a aba anterior ou a próxima, com volta ao início, e já mostram o painel."],
          ["↑ e ↓", "O mesmo, com orientation=\"vertical\"."],
          ["Home e End", "Primeira e última aba."],
          ["Tab", "Sai da lista e vai para o painel aberto."],
        ]}
      />
      <p>
        Use o atributo <code>value</code> para escolher a aba aberta e o evento{" "}
        <code>semec-change</code> para saber quando ela muda. Um link da página
        para um painel inativo, ou para um campo dentro dele (como o resumo de
        erros), ativa a aba antes de navegar.
      </p>

      <h2 id="combobox">Combobox</h2>
      <Code>{`<label class="semec-label" for="escola">Escola</label>
<semec-combobox class="semec-combobox">
  <select class="semec-field" id="escola" name="escola">
    <option value="">Selecione a escola</option>
    <option value="rio-madeira">EMEF Rio Madeira</option>
    <option value="sao-sebastiao">EMEF São Sebastião</option>
  </select>
</semec-combobox>`}</Code>
      <p>
        O <code>&lt;semec-combobox&gt;</code> envolve só o{" "}
        <code>&lt;select&gt;</code>: rótulo, dica e erro ficam fora dele. O{" "}
        <code>&lt;select&gt;</code> é a fonte das opções e continua sendo o
        valor enviado no formulário. Com JavaScript, ele fica escondido e
        aparece um campo de busca com o mesmo <code>id</code>, rótulo, dica e
        estado de erro. Digitar filtra sem diferença de acento (&quot;sao&quot;
        encontra &quot;São&quot;) e o leitor de tela ouve quantos resultados
        sobraram. Um texto que não virou escolha deixa o campo inválido
        (&quot;Escolha uma opção da lista.&quot;), e o formulário não é
        enviado com ele. Mudanças no <code>&lt;select&gt;</code> depois de
        carregar (opções novas, <code>disabled</code>,{" "}
        <code>aria-invalid</code>) chegam ao campo.
      </p>
      <Teclas
        label="Teclado do combobox"
        linhas={[
          ["Digitar", "Abre a lista e filtra."],
          ["↓ e ↑", "Abrem na opção escolhida e movem pela lista."],
          ["Home e End", "Primeira e última opção, com a lista aberta."],
          ["Enter", "Escolhe a opção ativa e fecha."],
          ["Esc", "Fecha a lista. Com a lista fechada, limpa a escolha e avisa \"Escolha removida\"."],
          ["Tab", "Fecha e vai para o próximo campo."],
        ]}
      />

      <h2 id="menu">Menu</h2>
      <Code>{`<semec-menu>
  <button type="button" class="semec-btn semec-btn--outline"
    data-semec-menu-trigger>Ações</button>
  <div class="semec-menu">
    <button type="button" class="semec-menu__item">Editar</button>
    <hr class="semec-menu__separator">
    <a class="semec-menu__item" href="/arquivar">Arquivar</a>
  </div>
</semec-menu>`}</Code>
      <Teclas
        label="Teclado do menu"
        linhas={[
          ["Enter, Espaço ou ↓ no botão", "Abre com o foco no primeiro item."],
          ["↑ no botão", "Abre com o foco no último item."],
          ["↑ e ↓", "Movem entre os itens, com volta ao início. Itens desabilitados ficam de fora."],
          ["Home, End e letras", "Primeiro, último e o próximo item que começa com a letra."],
          ["Enter ou Espaço", "Ativa o item (botão ou link) e fecha."],
          ["Esc", "Fecha e devolve o foco ao botão."],
          ["Tab", "Fecha e segue para o próximo elemento."],
        ]}
      />
      <p>
        O evento <code>semec-select</code> diz qual item foi escolhido. Chame{" "}
        <code>event.preventDefault()</code> para manter o menu aberto.
      </p>

      <h2 id="acordeao">Acordeão</h2>
      <Code>{`<semec-accordion class="semec-accordion" type="single" collapsible>
  <div class="semec-accordion__item">
    <h3 class="semec-accordion__header">
      <button type="button" class="semec-accordion__trigger">
        Quem pode pedir transferência?
      </button>
    </h3>
    <div class="semec-accordion__panel">
      <p>O responsável legal pelo estudante.</p>
    </div>
  </div>
</semec-accordion>`}</Code>
      <Teclas
        label="Teclado do acordeão"
        linhas={[
          ["Enter ou Espaço", "Abre ou fecha o item."],
          ["↑ e ↓", "Vão para o item anterior ou o próximo, com volta."],
          ["Home e End", "Primeiro e último item."],
        ]}
      />
      <p>
        Com <code>type=&quot;single&quot;</code>, abrir um item fecha o outro;{" "}
        <code>collapsible</code> deixa fechar o que está aberto. Com{" "}
        <code>type=&quot;multiple&quot;</code>, vários ficam abertos. Escolha o
        nível do heading pela estrutura da página.
      </p>

      <h2 id="acessibilidade">Acessibilidade e limites</h2>
      <p>
        Cada elemento é testado em navegador real (Chromium, Firefox e WebKit):
        teclado completo, foco, atributos ARIA e axe-core sem violações em cada
        estado aberto, com e sem JavaScript. Onde o Radix difere do padrão APG,
        os elementos seguem o APG: no menu, ↑ abre no último item, as setas
        voltam ao início e Tab fecha; o combobox é um campo editável.
      </p>
      <ul>
        <li>O combobox ainda não mostra grupos (<code>&lt;optgroup&gt;</code>).</li>
        <li>O menu não tem submenus nem itens de marcar.</li>
        <li>
          Os testes automáticos não substituem um leitor de tela: confira os
          fluxos críticos com NVDA ou VoiceOver antes de publicar.
        </li>
      </ul>

      <h2 id="mais">Para saber mais</h2>
      <ul>
        <li>
          <a href={`${REPO}/tree/main/packages/elements#readme`}>
            README do @semec/ds-elements
          </a>
          , com atributos, eventos e o HTML completo de cada elemento.
        </li>
        <li>
          Decisão:{" "}
          <a href={`${REPO}/blob/main/docs/adr/0029-web-components-light-dom-sem-dependencias.md`}>
            ADR-029
          </a>{" "}
          (Web Components em light DOM sem dependências).
        </li>
      </ul>
    </>
  );
}
