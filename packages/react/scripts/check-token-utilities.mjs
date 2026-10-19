/** INT-A-14: compile o CSS publicado com os defaults reais do Tailwind v4. */
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { compile } from "tailwindcss";

const require = createRequire(import.meta.url);
const defaults = fs.readFileSync(require.resolve("tailwindcss/theme.css"), "utf8");
const published = fs.readFileSync(require.resolve("@semec/ds/react/tokens.css"), "utf8");
const compiler = await compile(`${defaults}\n${published}\n@tailwind utilities;`);
const forbidden = ["text-muted", "text-secondary", "text-muted/50", "hover:text-secondary", "rounded-xs", "rounded-xl", "rounded-2xl", "rounded-3xl", "rounded-4xl", "rounded-t-xl"];
const allowed = ["rounded-sm", "rounded-md", "rounded-lg", "rounded-full", "text-fg", "bg-bg", "bg-primary", "text-text-muted", "text-text-secondary", "text-muted-foreground", "text-secondary-foreground", "bg-muted", "bg-secondary", "bg-muted/50", "hover:bg-secondary/80", "bg-muted/[25%]", "data-[state=selected]:bg-muted"];
const css = compiler.build([...forbidden, ...allowed]);
const escape = (candidate) => candidate.replace(/[^\w-]/g, (char) => `\\${char}`);
const hasSelector = (candidate) => css.split("\n").some((line) => {
  const selector = line.trimStart();
  const prefix = `.${escape(candidate)}`;
  return selector.startsWith(prefix) && /^[\s:[]/.test(selector.slice(prefix.length));
});
for (const candidate of forbidden) assert.ok(!hasSelector(candidate), `Classe proibida: ${candidate}`);
for (const candidate of allowed) assert.ok(hasSelector(candidate), `Classe ausente: ${candidate}`);
assert.ok(!css.includes("--modifier("), "Modificador Tailwind não resolvido");
assert.ok(!css.includes("--value("), "Valor Tailwind não resolvido");
assert.match(css, /color-mix\(in oklab, var\(--surface-alt\) calc\(50 \* 1%\), transparent\)/);
assert.match(css, /color-mix\(in oklab, var\(--surface-alt\) calc\(80 \* 1%\), transparent\)/);
assert.match(css, /color-mix\(in oklab, var\(--surface-alt\) 25%, transparent\)/);
assert.match(css, /\.text-fg\s*\{\s*color: var\(--fg\)/);
console.log(`check-token-utilities: ${forbidden.length} classes bloqueadas e ${allowed.length} preservadas, incluindo opacidade/estados.`);
