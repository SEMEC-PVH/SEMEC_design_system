/** INT-A-02 (#65): anatomia extraída do TSX, sem catálogo paralelo de classes. */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { compile } from "@tailwindcss/node";

const cn = (...values) => twMerge(clsx(values));

/** Avalia somente a gramática de classes usada pelo kit; mudanças não suportadas falham. */
export function readComponentClasses(pkgRoot, file) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(pkgRoot, "src/components", `${file}.tsx`), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = new Map();
  function visit(node) {
    if ((ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node)) && node.name && ts.isIdentifier(node.name)) declarations.set(node.name.text, node.initializer ?? node);
    ts.forEachChild(node, visit);
  }
  visit(source);
  function evaluate(node, props) {
    if (!node) return undefined;
    if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
    if (ts.isParenthesizedExpression(node) || ts.isJsxExpression(node)) return evaluate(node.expression, props);
    if (ts.isIdentifier(node)) {
      if (Object.hasOwn(props, node.text)) return props[node.text];
      if (["className", "variant", "size", "loading", "current", "truncate"].includes(node.text)) return undefined;
      if (declarations.has(node.text)) return evaluate(declarations.get(node.text), props);
    }
    if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map((p) => {
      if (ts.isShorthandPropertyAssignment(p)) return [p.name.text, evaluate(p.name, props)];
      if (ts.isPropertyAssignment(p)) return [p.name.text, evaluate(p.initializer, props)];
      throw new Error(`Propriedade não suportada: ${p.getText(source)}`);
    }));
    if (ts.isArrayLiteralExpression(node)) return node.elements.map((n) => evaluate(n, props));
    if (ts.isConditionalExpression(node)) return evaluate(evaluate(node.condition, props) ? node.whenTrue : node.whenFalse, props);
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return evaluate(node.left, props) && evaluate(node.right, props);
    if (ts.isCallExpression(node)) {
      const fn = node.expression.getText(source);
      const args = node.arguments.map((n) => evaluate(n, props));
      if (fn === "cn") return cn(...args);
      if (fn === "cva") return cva(...args);
      if (declarations.has(fn)) return evaluate(declarations.get(fn), props)(...args);
    }
    throw new Error(`Expressão de classes não suportada em ${file}: ${node.getText(source)}`);
  }
  return {
    variants(name) {
      const call = declarations.get(name);
      if (!call || !ts.isCallExpression(call) || call.expression.getText(source) !== "cva") throw new Error(`CVA ausente: ${name}`);
      return evaluate(call.arguments[1], {}).variants;
    },
    classes(component, index = 0, props = {}) {
      const attributes = [];
      const declaration = declarations.get(component);
      if (!declaration) throw new Error(`Componente ausente: ${component}`);
      function collect(node) {
        if (ts.isJsxAttribute(node) && node.name.getText(source) === "className") attributes.push(node.initializer);
        ts.forEachChild(node, collect);
      }
      collect(declaration);
      if (!attributes[index]) throw new Error(`className ausente: ${component}[${index}]`);
      return evaluate(attributes[index], props);
    },
  };
}

const kebab = (name) => name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

export async function buildComponentRecipes(pkgRoot) {
  const recipes = {};
  function recipe(name, file, parts, variantsName) {
    const reader = readComponentClasses(pkgRoot, file);
    const entries = {};
    function add(key, component, index = 0, props = {}) {
      const className = reader.classes(component, index, props);
      if (typeof className !== "string" || !className) throw new Error(`Classes vazias: ${name}.${key}`);
      entries[key] = { component, index, props, className, selector: `semec-${kebab(name)}-${kebab(key)}` };
    }
    for (const [key, spec] of Object.entries(parts)) add(key, ...spec);
    if (variantsName) {
      let combinations = [{}];
      for (const [prop, values] of Object.entries(reader.variants(variantsName))) combinations = combinations.flatMap((props) => Object.keys(values).map((value) => ({ ...props, [prop]: value })));
      for (const props of combinations) add(Object.values(props).join("-"), name, 0, props);
    }
    recipes[name] = { source: `src/components/${file}.tsx`, entries };
  }
  recipe("Button", "button", { root: ["Button"] }, "buttonVariants");
  recipe("Input", "input", { root: ["Input"], invalid: ["Input", 0, { invalid: true }] });
  recipe("Select", "select", { root: ["SelectTrigger"], invalid: ["SelectTrigger", 0, { invalid: true }] });
  recipe("Textarea", "textarea", { root: ["Textarea"], invalid: ["Textarea", 0, { invalid: true }] });
  recipe("FormField", "form-field", { root: ["FormField"], label: ["FormField", 1], required: ["FormField", 2], hint: ["FormField", 3], error: ["FormField", 4] });
  recipe("Card", "card", Object.fromEntries(["Card", "CardHeader", "CardTitle", "CardDescription", "CardContent", "CardFooter"].map((name) => [name === "Card" ? "root" : name.slice(4).toLowerCase(), [name]])));
  recipe("Alert", "alert", { root: ["Alert"], title: ["AlertTitle"], description: ["AlertDescription"] }, "alertVariants");
  recipe("Header", "header", { root: ["Header"], brand: ["HeaderBrand", 5], brandText: ["HeaderBrand", 2], separator: ["HeaderBrand", 3], service: ["HeaderBrand", 4], nav: ["HeaderNav"], link: ["HeaderNavLink"], current: ["HeaderNavLink", 0, { current: true }] });
  recipe("ErrorSummary", "error-summary", { root: ["ErrorSummary"], title: ["ErrorSummary", 1], list: ["ErrorSummary", 2], link: ["ErrorSummary", 3] });
  recipe("Badge", "badge", { root: ["Badge"] }, "badgeVariants");
  recipe("Toast", "toast", { root: ["Toast"], viewport: ["ToastViewport"], title: ["ToastTitle"], description: ["ToastDescription"], close: ["ToastClose"], action: ["ToastAction"] }, "toastVariants");

  const cls = (name, key = "root") => recipes[name].entries[key].selector;
  const html = (name, value, note) => Object.assign(recipes[name], { html: value, note });
  html("Button", `<button type="submit" class="${cls("Button")}">Revisar solicitação</button>`, "Use uma entrada completa por combinação de variante/tamanho. No tamanho icon, forneça aria-label. disabled é nativo; loading exige bloquear a ação e manter o foco com aria-busy e aria-disabled.");
  html("Input", `<label for="nome" class="${cls("FormField", "label")}">Nome completo</label>\n<input id="nome" name="nome" autocomplete="name" class="${cls("Input")}" aria-describedby="nome-hint">\n<p id="nome-hint" class="${cls("FormField", "hint")}">Informe seu nome completo.</p>`, "Inválido: use aria-invalid=\"true\" e aria-describedby apontando para o erro. Input/Textarea têm 16px abaixo de 640px (evita zoom no iOS) e 14px no desktop.");
  html("Select", `<label for="escola" class="${cls("FormField", "label")}">Escola</label>\n<select id="escola" name="escola" class="${cls("Select")}"><option value="">Selecione</option><option value="centro">Escola Centro</option></select>`, "A receita usa select nativo com as classes do SelectTrigger: teclado e popup são do navegador. Não copie role=combobox nem simule o Radix só com CSS. O menu nativo pode ter aparência própria do sistema. Inválido: aria-invalid e descrição do erro, como Input.");
  html("Textarea", `<label for="observacoes" class="${cls("FormField", "label")}">Observações</label>\n<textarea id="observacoes" name="observacoes" class="${cls("Textarea")}"></textarea>`, "Ligue dica/erro com aria-describedby; use aria-invalid=\"true\" quando houver erro.");
  html("FormField", `<div class="${cls("FormField")}">\n  <label for="email" class="${cls("FormField", "label")}">E-mail (obrigatório)</label>\n  <input id="email" name="email" type="email" autocomplete="email" required aria-invalid="true" aria-describedby="email-error" class="${cls("Input", "invalid")}">\n  <p id="email-error" class="${cls("FormField", "error")}">Informe um e-mail válido.</p>\n</div>`, "Sem erro, substitua a mensagem pela dica (classe hint) e atualize aria-describedby. O FormField React oculta a dica enquanto há erro. Não anuncie todos os erros com role=alert; use o resumo no envio.");
  html("Card", `<section class="${cls("Card")}" aria-labelledby="card-title">\n  <div class="${cls("Card", "header")}"><h2 id="card-title" class="${cls("Card", "title")}">Solicitação</h2><p class="${cls("Card", "description")}">Confira seus dados.</p></div>\n  <div class="${cls("Card", "content")}">Conteúdo do cartão.</div>\n  <div class="${cls("Card", "footer")}">Protocolo disponível após o envio.</div>\n</section>`, "Escolha o nível do título conforme a hierarquia da página.");
  html("Alert", `<div role="status" class="${cls("Alert")}">\n  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 8v1m0 3v5"/></svg>\n  <p class="${cls("Alert", "title")}">Informação</p>\n  <div class="${cls("Alert", "description")}"><p>Confira os dados antes de enviar.</p></div>\n</div>`, "Destructive: role=alert apenas para erro dinâmico urgente; demais: role=status. Avisos estáticos podem omitir role. O ícone é decorativo; escreva o significado no texto.");
  html("Header", `<header class="${cls("Header")}">\n  <a href="#conteudo" class="${cls("Header", "brand")}" aria-label="SEMEC — Atendimento — ir para o início"><span class="${cls("Header", "brandText")}">SEMEC <span aria-hidden="true" class="${cls("Header", "separator")}">|</span> <span class="${cls("Header", "service")}">Atendimento</span></span></a>\n  <nav aria-label="Principal" class="${cls("Header", "nav")}"><a href="#conteudo" aria-current="page" class="${cls("Header", "current")}">Solicitações</a><a href="#ajuda" class="${cls("Header", "link")}">Ajuda</a></nav>\n</header>`, "O cabeçalho usa superfície clara e borda. Acrescente o logo oficial com texto alternativo. Só o link atual recebe aria-current=page e a entrada current.");
  html("ErrorSummary", `<div id="resumo" role="alert" tabindex="-1" aria-labelledby="resumo-title" class="${cls("ErrorSummary")}">\n  <h2 id="resumo-title" class="${cls("ErrorSummary", "title")}">Há um problema</h2>\n  <ul class="${cls("ErrorSummary", "list")}"><li><a href="#email" class="${cls("ErrorSummary", "link")}">Informe um e-mail válido.</a></li></ul>\n</div>`, "Após cada envio inválido, foque o resumo com JavaScript; não mova o foco ao digitar. Os links devem focar os campos correspondentes. O CSS não implementa esse comportamento.");
  html("Badge", `<span class="${cls("Badge", "success")}">Aprovado</span>`, "Escreva o estado no texto; não dependa só da cor. Badge não é botão.");
  html("Toast", `<div role="status" aria-live="polite" aria-atomic="true">\n  <div class="${cls("Toast", "success")}">\n    <div><p class="${cls("Toast", "title")}">Solicitação salva</p><p class="${cls("Toast", "description")}">Seu protocolo está disponível.</p></div>\n    <button type="button" toast-close="" aria-label="Fechar notificação" class="${cls("Toast", "close")}">×</button>\n  </div>\n</div>`, "Crie a região viva vazia antes de inserir a mensagem; implemente fechar por clique/teclado e devolva o foco se necessário. Esta anatomia é estática: sem temporizador, swipe ou atalho F8 do Radix. A entrada viewport é opcional; não deixe uma camada vazia bloquear cliques. Não use data-state/data-swipe sem implementar os estados correspondentes.");

  const allEntries = Object.values(recipes).flatMap((r) => Object.values(r.entries));
  const selectors = new Map(allEntries.map((entry) => [entry.selector, entry.className]));
  for (const r of Object.values(recipes)) r.htmlTailwind = r.html.replace(/class="([^"]+)"/g, (_, selector) => `class="${selectors.get(selector).replaceAll('"', '&quot;')}"`);
  // group/peer são marcadores, não utilitários aplicáveis; preservados no HTML Tailwind.
  const rules = allEntries.map((entry) => `.${entry.selector} { @apply ${entry.className.split(/\s+/).filter((c) => !["group", "peer"].includes(c)).join(" ")}; }`).join("\n");
  // O compilador fornece também preflight, defaults e @property necessários aos rings.
  // Só os estilos das receitas são emitidos: nenhum CSS de componente é exportado pelo kit.
  const compiler = await compile(`@import "tailwindcss";\n@import "./tokens.css";\n${rules}`, { base: pkgRoot, onDependency() {} });
  let css = compiler.build([]);
  // tokens.css já é carregado pelo consumidor; não repetir os primitivos na receita.
  const postcss = (await import("postcss")).default;
  const parsed = postcss.parse(css);
  parsed.walkRules((rule) => {
    if (rule.selector === ":root" && rule.nodes.some((n) => n.prop?.startsWith("--pv-"))) rule.remove();
  });
  css = parsed.toString();
  return { css, recipes };
}

export function componentRecipesMarkdown(classes) {
  const out = ["## Anatomia dos componentes (sem React)", "", "Receitas geradas das classes reais do TSX/CVA; não edite as strings. O campo `classes` do manifest contém `css` (CSS puro compartilhado) e `recipes` (HTML, HTML Tailwind e entradas completas por parte/variante). Não combine duas entradas completas no mesmo elemento.", "", "**Sem Tailwind:** carregue `fonts.css`, `variables.css` e `base.css` (no lugar do `tokens.css`, cujas diretivas do Tailwind geram avisos no bundler) e copie o CSS puro abaixo para seu arquivo de receitas; use os trechos HTML com classes `semec-*`. Preserve a pasta `fonts/` junto de `fonts.css`. **Com Tailwind v4:** use os imports da instalação lite e o HTML Tailwind; mantenha as classes literais em arquivos que o Tailwind escaneia (ou registre o arquivo com `@source`). Não precisa escanear o React.", "", "As receitas preservam foco, responsividade e estados CSS. Comportamentos interativos precisam de HTML nativo ou JavaScript da aplicação; ARIA sozinha não implementa interação.", ""];
  for (const [name, r] of Object.entries(classes.recipes)) {
    out.push(`### ${name}`, "", r.note, "", "HTML sem Tailwind:", "", "```html", r.html, "```", "", "HTML com Tailwind v4:", "", "```html", r.htmlTailwind, "```", "", "| Parte / variante | Classe no CSS puro | Classes do componente |", "|---|---|---|");
    for (const [key, entry] of Object.entries(r.entries)) out.push(`| ${key} | \`${entry.selector}\` | \`${entry.className}\` |`);
    out.push("");
  }
  out.push("### CSS puro das receitas", "", "Gerado pelo Tailwind no build do kit. O consumidor copia CSS padrão com `var(--…)`, incluindo os defaults de reset/ring necessários à paridade; não executa Tailwind. Este bloco compartilhado atende todas as anatomias acima. Use-o depois de variables.css e base.css (ou do tokens.css, com Tailwind), antes das personalizações da aplicação.", "", "```css", classes.css.trim(), "```", "");
  return out.join("\n");
}
