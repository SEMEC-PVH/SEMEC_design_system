/**
 * Testes de plataforma do @semec/ds-tokens: as saídas nativas e a do Figma lidas
 * pelas ferramentas reais, não por expressão regular.
 *
 * - Swift: compila dist/ios/SemecTokens.swift com swiftc (Swift 5 e 6, warnings como erro),
 *   executa um programa que imprime cada valor e confere contra o tokens.json.
 *   Fora da Apple, compila também os blocos SwiftUI/UIKit contra stubs com as assinaturas
 *   da Apple (test/plataformas/swift-stubs). Num Mac, os blocos usam o SwiftUI real.
 * - Android: compila colors.xml e dimens.xml com aapt2 (compile + link), lê a tabela de
 *   recursos com `aapt2 dump resources`, resolve as referências e confere os valores.
 * - Figma: lê o tokens-studio.json com @tokens-studio/sd-transforms + Style Dictionary
 *   (o caminho de exportação do Tokens Studio), resolve as referências e confere os valores.
 *
 * Ferramentas: usa `swiftc` e `aapt2` locais quando existem (CI ubuntu-latest tem os dois:
 * Swift no PATH e o Android SDK em ANDROID_HOME); senão, Docker (`swift:6.0` e
 * `python:3.12-slim` com o aapt2 oficial do Google Maven, sha256 fixo). Sem nenhum dos
 * dois, o teste pula com aviso; com SEMEC_PLATAFORMAS_EXIGIR=1 ele falha em vez de pular.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import StyleDictionary from "style-dictionary";
import { register } from "@tokens-studio/sd-transforms";
import {
  allTokens, camel, colorNames, dimensionNames, dist, dtcg, expectedChannels, expectedHex, expectedPx,
  isFontSize, pkgRoot, read, snake,
} from "./esperado.mjs";

const fixtures = path.join(pkgRoot, "test", "plataformas");
const exigir = process.env.SEMEC_PLATAFORMAS_EXIGIR === "1";
const SWIFT_IMAGE = process.env.SEMEC_SWIFT_IMAGE ?? "swift:6.0";
const PYTHON_IMAGE = "python:3.12-slim";
const AAPT2_VERSION = "8.13.2-14304508";
const AAPT2_SHA256 = "839609d6d776d6dd60a02aa577d97193ce3e650cf1deaabf062321e23bbd6bf6";
const AAPT2_URL = `https://dl.google.com/dl/android/maven2/com/android/tools/build/aapt2/${AAPT2_VERSION}/aapt2-${AAPT2_VERSION}-linux.jar`;

const run = (cmd, args, options = {}) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options });
const ok = (cmd, args) => {
  try {
    return run(cmd, args, { timeout: 20_000 }).status === 0;
  } catch {
    return false;
  }
};

const docker = ok("docker", ["info", "--format", "{{.ServerVersion}}"]);
const localSwiftc = process.env.SEMEC_SWIFTC ?? (process.platform !== "win32" && ok("swiftc", ["--version"]) ? "swiftc" : null);

function findLocalAapt2() {
  if (process.env.AAPT2) return process.env.AAPT2;
  const exe = process.platform === "win32" ? "aapt2.exe" : "aapt2";
  for (const sdk of [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT].filter(Boolean)) {
    const buildTools = path.join(sdk, "build-tools");
    if (!fs.existsSync(buildTools)) continue;
    const versions = fs.readdirSync(buildTools)
      .filter((dir) => fs.existsSync(path.join(buildTools, dir, exe)))
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
    if (versions.length) return path.join(buildTools, versions.at(-1), exe);
  }
  return ok("aapt2", ["version"]) ? "aapt2" : null;
}
const localAapt2 = findLocalAapt2();

/** Opções do test(): pula com aviso (ou falha, com SEMEC_PLATAFORMAS_EXIGIR=1) sem ferramenta. */
function toolOptions(available, what) {
  if (available || exigir) return { timeout: 900_000 };
  const reason = `${what} indisponível (nem local nem Docker): teste pulado. Defina SEMEC_PLATAFORMAS_EXIGIR=1 para falhar.`;
  console.warn(`AVISO @semec/ds-tokens: ${reason}`);
  return { skip: reason };
}

function workdir(name) {
  // realpath: expande nomes 8.3 do Windows (ADMINI~1), que o Docker não monta.
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), `semec-ds-tokens-${name}-`)));
}
function cleanup(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Arquivos criados pelo root do contêiner (Docker no Linux): o tmp do sistema limpa depois.
  }
}

/** Roda um script sh no diretório: localmente ou num contêiner com o diretório montado em /w. */
function sh(dir, script, image) {
  fs.writeFileSync(path.join(dir, "run.sh"), script);
  const result = image
    ? run("docker", ["run", "--rm", "--platform", "linux/amd64", "-v", `${dir}:/w`, "-w", "/w", image, "sh", "run.sh"])
    : run("sh", ["run.sh"], { cwd: dir });
  assert.equal(result.status, 0, `falhou (${image ?? "local"}):\n${result.stdout}\n${result.stderr}\n${result.error ?? ""}`);
  return result.stdout;
}

// ---------------------------------------------------------------------------
// Swift
// ---------------------------------------------------------------------------

/** Programa que imprime cada valor de SemecTokens e conta os membros SwiftUI/UIKit. */
function swiftProgram() {
  const colors = colorNames.map(camel);
  const dims = dimensionNames.map(camel);
  const list = (prefix) => colors.map((name) => `  ${prefix}.${name},`).join("\n");
  return `// Gerado pelo plataformas.test.mjs do @semec/ds-tokens.
import Foundation
#if canImport(SwiftUI)
import SwiftUI
#endif
#if canImport(UIKit)
import UIKit
#endif

func color(_ name: String, _ value: SemecTokens.RGBA) {
  print("color \\(name) \\(value.red) \\(value.green) \\(value.blue) \\(value.alpha)")
}
func dimen(_ name: String, _ value: CGFloat) {
  print("dimen \\(name) \\(Double(value))")
}

${colors.map((name) => `color("${name}", SemecTokens.ColorValues.${name})`).join("\n")}
${dims.map((name) => `dimen("${name}", SemecTokens.Dimensions.${name})`).join("\n")}

#if canImport(SwiftUI)
let swiftUIColors: [Color] = [
${list("SemecTokens.Colors")}
]
print("swiftui \\(swiftUIColors.count)")
#endif
#if canImport(UIKit)
let uiKitColors: [UIColor] = [
${list("SemecTokens.UIColors")}
]
print("uikit \\(uiKitColors.count)")
#endif
`;
}

const SWIFT_SCRIPT = `set -eu
SWIFTC="\${SWIFTC:-swiftc}"
OUT="$(mktemp -d)"
"$SWIFTC" --version 2>&1 | head -n 1 > versao.txt
"$SWIFTC" -swift-version 5 -warnings-as-errors SemecTokens.swift main.swift -o "$OUT/v5"
"$OUT/v5" > saida-swift5.txt
if "$SWIFTC" --version 2>&1 | grep -Eq 'Swift version ([6-9]|[1-9][0-9])\\.'; then
  "$SWIFTC" -swift-version 6 -warnings-as-errors SemecTokens.swift main.swift -o "$OUT/v6"
  "$OUT/v6" > saida-swift6.txt
fi
if [ "\${STUBS:-0}" = "1" ]; then
  mkdir -p "$OUT/stubs"
  for module in SwiftUI UIKit; do
    "$SWIFTC" -parse-as-library -emit-library -static -emit-module -module-name "$module" \\
      "stubs/$module.swift" -emit-module-path "$OUT/stubs/$module.swiftmodule" -o "$OUT/stubs/lib$module.a"
  done
  "$SWIFTC" -swift-version 5 -warnings-as-errors -I "$OUT/stubs" -L "$OUT/stubs" -lSwiftUI -lUIKit \\
    SemecTokens.swift main.swift -o "$OUT/ui"
  "$OUT/ui" > saida-stubs.txt
fi
rm -rf "$OUT"
`;

function parseSwift(output) {
  const colors = new Map();
  const dims = new Map();
  const counts = {};
  for (const line of output.trim().split("\n")) {
    const [kind, name, ...values] = line.trim().split(" ");
    if (kind === "color") colors.set(name, values.map(Number));
    else if (kind === "dimen") dims.set(name, Number(values[0]));
    else counts[kind] = Number(name);
  }
  return { colors, dims, counts };
}

function checkSwiftValues(output, label) {
  const { colors, dims, counts } = parseSwift(output);
  assert.equal(colors.size, colorNames.length, `${label}: número de cores`);
  for (const name of colorNames) {
    const [r, g, b, a] = colors.get(camel(name)) ?? assert.fail(`${label}: sem ColorValues.${camel(name)}`);
    const channels = [r, g, b].map((c) => c * 255);
    assert.deepEqual(channels.map(Math.round), expectedChannels(name), `${label}: cor ${name}`);
    for (const c of channels) assert.ok(Math.abs(c - Math.round(c)) < 1e-9, `${label}: ${name} não é n/255`);
    assert.equal(a, 1, `${label}: alfa de ${name}`);
  }
  assert.equal(dims.size, dimensionNames.length, `${label}: número de dimensões`);
  for (const name of dimensionNames) assert.equal(dims.get(camel(name)), expectedPx(name), `${label}: dimensão ${name}`);
  return counts;
}

test("Swift: SemecTokens.swift compila (Swift 5 e 6) e os valores batem com o tokens.json",
  toolOptions(localSwiftc || docker, "swiftc"), () => {
    assert.ok(localSwiftc || docker, "swiftc indisponível e SEMEC_PLATAFORMAS_EXIGIR=1");
    const dir = workdir("swift");
    try {
      fs.copyFileSync(path.join(dist, "ios", "SemecTokens.swift"), path.join(dir, "SemecTokens.swift"));
      fs.writeFileSync(path.join(dir, "main.swift"), swiftProgram());
      const apple = localSwiftc && process.platform === "darwin";
      const stubs = !apple;
      if (stubs) fs.cpSync(path.join(fixtures, "swift-stubs"), path.join(dir, "stubs"), { recursive: true });
      const env = `export STUBS=${stubs ? 1 : 0}\n${localSwiftc ? `export SWIFTC='${localSwiftc}'\n` : ""}`;
      sh(dir, env + SWIFT_SCRIPT, localSwiftc ? null : SWIFT_IMAGE);
      const version = fs.readFileSync(path.join(dir, "versao.txt"), "utf8").trim();
      console.log(`  swiftc: ${version} (${localSwiftc ? "local" : SWIFT_IMAGE})`);

      const outputs = ["saida-swift5.txt", "saida-swift6.txt"].filter((file) => fs.existsSync(path.join(dir, file)));
      for (const file of outputs) {
        const counts = checkSwiftValues(fs.readFileSync(path.join(dir, file), "utf8"), file);
        if (apple) assert.equal(counts.swiftui, colorNames.length, "SwiftUI real: Colors incompleto");
      }
      if (/Swift version ([6-9]|\d{2,})\./.test(version)) assert.ok(outputs.includes("saida-swift6.txt"), "Swift 6 não compilou");
      if (stubs) {
        const counts = checkSwiftValues(fs.readFileSync(path.join(dir, "saida-stubs.txt"), "utf8"), "stubs");
        assert.equal(counts.swiftui, colorNames.length, "bloco SwiftUI: Colors incompleto");
        assert.equal(counts.uikit, colorNames.length, "bloco UIKit: UIColors incompleto");
      }
    } finally {
      cleanup(dir);
    }
  });

// ---------------------------------------------------------------------------
// Android
// ---------------------------------------------------------------------------

async function aapt2Jar() {
  const cache = path.join(os.tmpdir(), "semec-ds-tokens-cache");
  const file = path.join(cache, `aapt2-${AAPT2_VERSION}-linux.jar`);
  const sha = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
  if (fs.existsSync(file) && sha(fs.readFileSync(file)) === AAPT2_SHA256) return file;
  const response = await fetch(AAPT2_URL);
  assert.ok(response.ok, `download do aapt2 falhou: HTTP ${response.status} ${AAPT2_URL}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  assert.equal(sha(buffer), AAPT2_SHA256, "sha256 do aapt2 não confere");
  fs.mkdirSync(cache, { recursive: true });
  fs.writeFileSync(file, buffer);
  return file;
}

const AAPT2_STEPS = `"$AAPT2" version > versao.txt 2>&1
"$AAPT2" compile --dir res -o compilado.zip
"$AAPT2" link compilado.zip --manifest AndroidManifest.xml -o semec.apk
"$AAPT2" dump resources semec.apk > recursos.txt
`;

function runAapt2Local(dir) {
  // Sem sh: no Windows o aapt2.exe do SDK roda direto.
  const step = (...args) => {
    const result = run(localAapt2, args, { cwd: dir });
    assert.equal(result.status, 0, `aapt2 ${args[0]} falhou:\n${result.stdout}\n${result.stderr}`);
    return result.stdout;
  };
  fs.writeFileSync(path.join(dir, "versao.txt"), step("version"));
  step("compile", "--dir", "res", "-o", "compilado.zip");
  step("link", "compilado.zip", "--manifest", "AndroidManifest.xml", "-o", "semec.apk");
  fs.writeFileSync(path.join(dir, "recursos.txt"), step("dump", "resources", "semec.apk"));
}

/** `aapt2 dump resources` → Map(tipo/nome → valor bruto). */
function parseDump(dump) {
  const values = new Map();
  let current = null;
  for (const line of dump.split("\n")) {
    const resource = line.match(/^\s+resource 0x[\da-f]+ (\w+\/\w+)/);
    if (resource) {
      current = resource[1];
      continue;
    }
    const value = line.match(/^\s+\(\) (.+)$/);
    if (value && current) {
      values.set(current, value[1].trim());
      current = null;
    }
  }
  const resolve = (key, trail = []) => {
    const raw = values.get(key);
    assert.ok(raw !== undefined, `recurso ausente: ${key}`);
    const ref = raw.match(/^@(\w+\/\w+)$/);
    if (!ref) return raw;
    assert.ok(!trail.includes(ref[1]), `referência circular em ${key}`);
    return resolve(ref[1], [...trail, key]);
  };
  return { values, resolve };
}

test("Android: colors.xml e dimens.xml compilam com aapt2 e os valores batem com o tokens.json",
  toolOptions(localAapt2 || docker, "aapt2"), async () => {
    assert.ok(localAapt2 || docker, "aapt2 indisponível e SEMEC_PLATAFORMAS_EXIGIR=1");
    const dir = workdir("android");
    try {
      fs.mkdirSync(path.join(dir, "res", "values"), { recursive: true });
      for (const file of ["colors.xml", "dimens.xml"]) {
        fs.copyFileSync(path.join(dist, "android", file), path.join(dir, "res", "values", file));
      }
      fs.copyFileSync(path.join(fixtures, "android", "AndroidManifest.xml"), path.join(dir, "AndroidManifest.xml"));
      if (localAapt2) {
        runAapt2Local(dir);
      } else {
        fs.copyFileSync(await aapt2Jar(), path.join(dir, "aapt2.jar"));
        sh(dir, `set -eu
python -c "import zipfile, os; zipfile.ZipFile('aapt2.jar').extract('aapt2', '/tmp/aapt2-bin'); os.chmod('/tmp/aapt2-bin/aapt2', 0o755)"
AAPT2=/tmp/aapt2-bin/aapt2
${AAPT2_STEPS}`, PYTHON_IMAGE);
      }
      console.log(`  aapt2: ${fs.readFileSync(path.join(dir, "versao.txt"), "utf8").trim()} (${localAapt2 ?? `${PYTHON_IMAGE} + Google Maven ${AAPT2_VERSION}`})`);

      const { values, resolve } = parseDump(fs.readFileSync(path.join(dir, "recursos.txt"), "utf8"));
      const colors = [...values.keys()].filter((key) => key.startsWith("color/"));
      const dimens = [...values.keys()].filter((key) => key.startsWith("dimen/"));
      assert.equal(colors.length, colorNames.length, "número de cores compiladas");
      assert.equal(dimens.length, dimensionNames.length, "número de dimensões compiladas");
      for (const name of colorNames) {
        assert.equal(resolve(`color/${snake(name)}`), `#ff${expectedHex(name).slice(1).toLowerCase()}`, `cor ${name}`);
      }
      for (const name of dimensionNames) {
        const [, n, unit] = resolve(`dimen/${snake(name)}`).match(/^(-?[\d.]+)(dp|sp)$/) ?? assert.fail(`dimensão ${name}`);
        assert.equal(Number(n), expectedPx(name), `dimensão ${name}`);
        assert.equal(unit, isFontSize(name) ? "sp" : "dp", `unidade de ${name}`);
      }
      // Os semânticos continuam referências aos primitivos depois de compilados.
      assert.equal(values.get("color/semec_bg"), "@color/semec_pv_gray_50");
    } finally {
      cleanup(dir);
    }
  });

test("Android: XML bem formado e nomes de recurso válidos (sem ferramenta externa)", () => {
  for (const [file, kind, names] of [["colors.xml", "color", colorNames], ["dimens.xml", "dimen", dimensionNames]]) {
    const xml = read(`android/${file}`);
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n/, `${file}: declaração XML`);
    const body = xml.replace(/^<\?xml[^>]*\?>/, "").replace(/<!--[\s\S]*?-->/g, "").trim();
    assert.match(body, /^<resources>[\s\S]*<\/resources>$/, `${file}: raiz <resources>`);
    const inner = body.slice("<resources>".length, -"</resources>".length);
    const entries = [...inner.matchAll(new RegExp(`<${kind} name="([^"]*)">([^<]*)</${kind}>`, "g"))];
    assert.equal(inner.replace(new RegExp(`<${kind} name="[^"]*">[^<]*</${kind}>`, "g"), "").trim(), "", `${file}: conteúdo fora dos recursos`);
    assert.equal(entries.length, names.length, `${file}: número de recursos`);
    const seen = new Set();
    for (const [, name, value] of entries) {
      // Nome de recurso Android: vira campo Java/Kotlin em R, então [a-z0-9_] começando por letra.
      assert.match(name, /^[a-z][a-z0-9_]*$/, `${file}: nome inválido ${name}`);
      assert.ok(!seen.has(name), `${file}: nome duplicado ${name}`);
      seen.add(name);
      assert.doesNotMatch(value, /[&<>]/, `${file}: valor sem escape em ${name}`);
    }
  }
});

// ---------------------------------------------------------------------------
// Figma (Tokens Studio)
// ---------------------------------------------------------------------------

register(StyleDictionary, { excludeParentKeys: true });

/** Resolve o tokens-studio.json como o Tokens Studio exporta: sets juntos, transforms do sd-transforms. */
async function resolveStudio(studio) {
  const sd = new StyleDictionary({
    tokens: structuredClone(studio),
    preprocessors: ["tokens-studio"],
    log: { verbosity: "silent", warnings: "error", errors: { brokenReferences: "throw" } },
    platforms: { css: { transformGroup: "tokens-studio" } },
  });
  const { allTokens: resolved } = await sd.getPlatformTokens("css");
  return new Map(resolved.map((token) => [token.path.at(-1), token]));
}

const hex8 = (color) => `#${[...color.components.map((c) => Math.round(c * 255)), Math.round((color.alpha ?? 1) * 255)]
  .map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
const dimPx = (dimension) => `${dimension.unit === "rem" ? dimension.value * 16 : dimension.value}px`;

/** Valor que o Style Dictionary + sd-transforms deve produzir, calculado do tokens.json. */
function expectedStudio(name) {
  const token = allTokens[name];
  const resolved = token.$extensions["br.gov.portovelho.semec"].resolved;
  const target = (value) => (typeof value === "string" && value.startsWith("{") ? allTokens[value.slice(1, -1).split(".")[1]] : null);
  const value = target(token.$value)?.$value ?? token.$value;
  switch (token.$type) {
    case "color": return expectedHex(name).toLowerCase();
    case "dimension": return `${expectedPx(name)}px`;
    case "number": return Number(resolved);
    case "fontWeight": return Number(resolved);
    case "fontFamily": return value[0];
    case "shadow": return `${dimPx(value.offsetX)} ${dimPx(value.offsetY)} ${dimPx(value.blur)} ${dimPx(value.spread)} ${hex8(value.color)}`;
    case "duration": return resolved;
    case "cubicBezier": return resolved;
    default: throw new Error(`tipo sem conferência: ${token.$type}`);
  }
}

test("Tokens Studio: sd-transforms + Style Dictionary resolvem todas as referências e os valores batem com o tokens.json", async () => {
  const studio = JSON.parse(read("figma/tokens-studio.json"));
  const sets = studio.$metadata.tokenSetOrder;
  assert.deepEqual(sets, ["L0", "L1"]);
  // O Tokens Studio junta os sets por nome: um nome repetido em L0 e L1 seria sobrescrito sem aviso.
  const names = sets.flatMap((set) => Object.keys(studio[set]));
  assert.equal(new Set(names).size, names.length, "nome de token repetido entre os sets");

  const resolved = await resolveStudio(studio);
  assert.equal(resolved.size, Object.keys(allTokens).length, "número de tokens resolvidos");
  let references = 0;
  for (const [name, token] of Object.entries(allTokens)) {
    const out = resolved.get(name) ?? assert.fail(`Tokens Studio sem ${name}`);
    // Formato legado do Tokens Studio (value/type): o Style Dictionary mantém `value`.
    const outValue = out.$value ?? out.value;
    // Peso sai como string ("400") e o hex com caixa variável: normaliza antes de comparar.
    const norm = (v) => (typeof v !== "string" ? v : /^\d+$/.test(v) ? Number(v) : v.toLowerCase());
    assert.equal(norm(outValue), norm(expectedStudio(name)), `valor de ${name}`);
    assert.doesNotMatch(JSON.stringify(outValue), /\{[^}]*\}/, `${name} com referência não resolvida`);
    if (typeof token.$value === "string" && token.$value.startsWith("{")) {
      references++;
      const target = token.$value.slice(1, -1).split(".")[1];
      assert.equal(out.original.value, `{${target}}`, `${name}: referência ${token.$value} perdida no Tokens Studio`);
      assert.deepEqual(outValue, resolved.get(target).value ?? resolved.get(target).$value, `${name}: valor ≠ do alvo ${target}`);
    }
  }
  const dtcgReferences = Object.values(allTokens).filter((token) => typeof token.$value === "string" && token.$value.startsWith("{")).length;
  assert.equal(references, dtcgReferences);
  assert.ok(references > 30, `poucas referências: ${references}`);
  assert.ok(Object.keys(dtcg.L1).length > 0);
});

test("Tokens Studio: uma referência quebrada é detectada (o teste acima não passa por vazio)", async () => {
  const studio = JSON.parse(read("figma/tokens-studio.json"));
  studio.L1.bg.value = "{pv-gray-inexistente}";
  await assert.rejects(resolveStudio(studio), /references \(1\) could not be found|pv-gray-inexistente/);
});
