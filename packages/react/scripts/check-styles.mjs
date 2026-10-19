#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const css = readFileSync(new URL(import.meta.resolve("@semec/ds/react/styles.css")), "utf8");
const bytes = Buffer.byteLength(css);
const gzipBytes = gzipSync(css).length;

// Margem para evolução do kit; impede publicar tokens sem componentes ou
// incorporar classes do site/app por detecção automática acidental.
assert.ok(bytes >= 40_000 && bytes <= 90_000, `styles.css: ${bytes} bytes (esperado 40–90 kB)`);
assert.ok(gzipBytes <= 16_000, `styles.css: ${gzipBytes} bytes gzip (limite 16 kB)`);
assert.doesNotMatch(css, /@(import|source|theme|utility|tailwind)\b/, "Diretiva de build no CSS publicado");
assert.ok(css.split("\n").length < 10, "styles.css deve ser minificado");
for (const selector of [
  ".bg-primary", ".bg-card", ".bg-popover", ".text-destructive",
  ".border-destructive", ".fixed", ".z-50", ".shadow-elevation-3",
  "\\:animate-in", "\\:animate-out", ".focus-visible\\:ring-2",
]) {
  assert.ok(css.includes(selector), `Utilitário ausente: ${selector}`);
}
assert.match(css, /@keyframes enter\{/);
assert.match(css, /@keyframes exit\{/);
assert.match(css, /--pv-blue-hero:/, "Os tokens devem estar embutidos");
assert.match(css, /box-sizing:border-box/, "O reset deve estar embutido");
console.log(`check-styles: ok (${bytes} bytes; ${gzipBytes} bytes gzip; export, tokens, reset e componentes).`);
