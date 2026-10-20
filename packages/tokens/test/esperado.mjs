/**
 * Valores esperados a partir do `resolved` do tokens.json (independente do código de build).
 * Compartilhado por tokens.test.mjs e plataformas.test.mjs.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const pkgRoot = fileURLToPath(new URL("../", import.meta.url));
export const dist = path.join(pkgRoot, "dist");
export const read = (file) => fs.readFileSync(path.join(dist, file), "utf8");
export const dtcg = JSON.parse(read("tokens.json"));
export const allTokens = Object.fromEntries(["L0", "L1"].flatMap((layer) => Object.entries(dtcg[layer])));
export const ext = (token) => token.$extensions["br.gov.portovelho.semec"];
export const colorNames = Object.keys(allTokens).filter((name) => allTokens[name].$type === "color");
export const dimensionNames = Object.keys(allTokens).filter((name) => allTokens[name].$type === "dimension");
export const snake = (name) => `semec_${name.replace(/-/g, "_")}`;
export const camel = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
export const isFontSize = (name) => /^(pv-)?text-/.test(name);

/** Canais 0–255 da cor, a partir do `resolved` (#rrggbb ou "r g b"). */
export function expectedChannels(name) {
  const resolved = ext(allTokens[name]).resolved;
  if (/^#[\da-f]{6}$/i.test(resolved)) return [1, 3, 5].map((i) => parseInt(resolved.slice(i, i + 2), 16));
  const channels = resolved.split(/\s+/).map(Number);
  assert.equal(channels.length, 3, `${name}: valor de cor inesperado ${resolved}`);
  return channels;
}

export function expectedHex(name) {
  return `#${expectedChannels(name).map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function expectedPx(name) {
  const resolved = ext(allTokens[name]).resolved;
  if (resolved === "0") return 0;
  const [, n, unit] = resolved.match(/^(-?\d*\.?\d+)(px|rem)$/);
  return unit === "rem" ? Number(n) * 16 : Number(n);
}
