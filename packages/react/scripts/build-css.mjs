import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

/** Deriva as entradas CSS sem manter cópias manuais dos tokens. */
export function buildCss(pkgRoot, outDir) {
  const source = fs.readFileSync(path.join(pkgRoot, "tokens.css"), "utf8");
  const parsed = postcss.parse(source);
  const roots = parsed.nodes.filter((node) => node.type === "rule" && node.selector === ":root");
  const base = parsed.nodes.filter((node) => node.type === "atrule" && (
    (node.name === "layer" && node.params === "base") ||
    (node.name === "media" && node.params === "(prefers-reduced-motion: reduce)")
  ));
  if (roots.length !== 1 || base.length !== 2) {
    throw new Error("tokens.css: esperados um :root, uma @layer base e um @media de reduced motion; revise a extração.");
  }
  const variables = roots[0].clone();
  const settings = roots[0].clone({ nodes: [] });
  variables.walkDecls((declaration) => {
    if (!declaration.prop.startsWith("--")) {
      settings.append(declaration.clone());
      declaration.remove();
    }
  });
  // color-scheme também muda o documento: fica na adoção explícita da base.
  const baseNodes = base.map((node) => node.clone());
  if (settings.nodes.length) baseNodes.find((node) => node.name === "layer").prepend(settings);
  fs.mkdirSync(outDir, { recursive: true });
  // O agregador original continua idêntico, inclusive para consumidores existentes.
  fs.writeFileSync(path.join(outDir, "tokens.css"), source);
  for (const [name, nodes] of [["variables", [variables]], ["base", baseNodes]]) {
    fs.writeFileSync(path.join(outDir, `${name}.css`), `${nodes.map((node) => node.toString()).join("\n\n")}\n`);
  }
  fs.writeFileSync(path.join(outDir, "source.css"), '@source "./components/**/*.js";\n');
}
