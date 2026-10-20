/**
 * Normaliza HTML para comparar as saídas dos motores com o canônico:
 * interpreta com o parser HTML5 (jsdom), ordena atributos, desfaz entidades,
 * junta espaços e descarta os espaços que não aparecem na tela (entre blocos
 * e nas bordas de um bloco). O espaço entre elementos de linha dentro de um
 * elemento de linha (ex.: entre os <span> do cabeçalho) é mantido, porque muda
 * o nome acessível.
 */
import { JSDOM } from "jsdom";

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const INLINE = new Set(["a", "abbr", "b", "br", "button", "code", "em", "i", "img", "input", "label", "select", "small", "span", "strong", "sub", "sup", "textarea"]);
const RAW = new Set(["textarea", "pre", "script", "style", "title"]);

const escText = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const escAttr = (s) => escText(s).replaceAll('"', "&quot;");

const isInline = (n) => n && ((n.nodeType === 3 && n.data.trim() !== "") || (n.nodeType === 1 && INLINE.has(n.localName)));

function serialize(node, out) {
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === 10) {
      out.push("<!doctype html>\n");
    } else if (child.nodeType === 8) {
      continue;
    } else if (child.nodeType === 3) {
      const parent = child.parentNode;
      if (parent.nodeType === 1 && RAW.has(parent.localName)) {
        out.push(escText(child.data));
        continue;
      }
      let text = child.data.replace(/\s+/g, " ");
      const prev = child.previousSibling;
      const next = child.nextSibling;
      if (text.trim() === "") {
        // Espaço só entre dois elementos de linha dentro de um elemento de linha
        // (ex.: entre os <span> do cabeçalho). Num bloco ou grid ele não aparece.
        if (parent.nodeType === 1 && INLINE.has(parent.localName) && isInline(prev) && isInline(next)) out.push(" ");
        continue;
      }
      if (!isInline(prev)) text = text.replace(/^ /, "");
      if (!isInline(next)) text = text.replace(/ $/, "");
      out.push(escText(text));
    } else if (child.nodeType === 1) {
      const tag = child.localName;
      const attrs = [...child.attributes]
        .map((a) => [a.name, a.name === "class" ? a.value.trim().split(/\s+/).join(" ") : a.value])
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([n, v]) => (v === "" ? ` ${n}` : ` ${n}="${escAttr(v)}"`))
        .join("");
      const block = !INLINE.has(tag);
      if (block) out.push("\n");
      out.push(`<${tag}${attrs}>`);
      if (tag === "template") serialize(child.content, out);
      else serialize(child, out);
      if (!VOID.has(tag)) out.push(`</${tag}>`);
    }
  }
}

/** Documento completo (com doctype) ou fragmento. */
export function normalizar(html) {
  const doc = /^\s*<!doctype/i.test(html);
  const root = doc ? new JSDOM(html).window.document : JSDOM.fragment(html);
  const out = [];
  serialize(root, out);
  return out.join("").replace(/\n+/g, "\n").trim();
}

/** Árvore para inspeção (XSS, classes). */
export function parse(html) {
  return /^\s*<!doctype/i.test(html) ? new JSDOM(html).window.document : JSDOM.fragment(html);
}
