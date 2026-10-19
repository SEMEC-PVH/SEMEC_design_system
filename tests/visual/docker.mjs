#!/usr/bin/env node
/**
 * Roda a regressão visual no contêiner oficial do Playwright (TST-B1).
 *
 * As baselines (tests/visual/__screenshots__) são geradas em Linux, na imagem
 * mcr.microsoft.com/playwright na MESMA versão do @playwright/test instalado:
 * a renderização de fonte muda entre sistemas operacionais, então Windows e
 * macOS comparam dentro do contêiner, e a CI usa a mesma imagem como contêiner
 * do job.
 *
 *   node tests/visual/docker.mjs [argumentos do playwright test]
 *
 * - Já dentro da imagem do Playwright (CI ou este próprio script): roda o
 *   `playwright test` direto.
 * - Fora dela: `docker run` com o repositório montado em /work. O node_modules
 *   do host (binários do Windows/macOS) fica escondido atrás de volumes
 *   nomeados, onde o contêiner faz o próprio `npm ci` (só quando o
 *   package-lock.json muda).
 *
 * O `dist/` do kit é gerado ANTES, no host, pelo `pretest:visual` (build:ds).
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
// `--browsers=webkit,firefox` vira VISUAL_BROWSERS (projetos opcionais, ver playwright.visual.config.mjs).
const args = process.argv.slice(2).filter((a) => {
  const m = /^--browsers=(.+)$/.exec(a);
  if (m) process.env.VISUAL_BROWSERS = m[1];
  return !m;
});
const config = "playwright.visual.config.mjs";

const installed = JSON.parse(readFileSync(path.join(root, "node_modules/@playwright/test/package.json"), "utf8")).version;
const declared = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).devDependencies?.["@playwright/test"];
if (declared !== installed) {
  console.error(
    `@playwright/test precisa de versão exata no package.json (declarado: ${declared}, instalado: ${installed}): ` +
      "a imagem do contêiner e as baselines dependem dela."
  );
  process.exit(1);
}
const image = `mcr.microsoft.com/playwright:v${installed}-noble`;

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { stdio: "inherit", cwd: root, ...opts });
  if (r.error) {
    console.error(`não foi possível executar '${cmd}': ${r.error.message}`);
    return 1;
  }
  return r.status ?? 1;
}

// A imagem oficial traz os navegadores em /ms-playwright.
const insideImage = process.platform === "linux" && existsSync("/ms-playwright");

if (insideImage) {
  // A CI declara a imagem no ci.yml; confere que ela traz o Chromium desta versão do Playwright.
  const { browsers } = JSON.parse(readFileSync(path.join(root, "node_modules/playwright-core/browsers.json"), "utf8"));
  const revision = browsers.find((b) => b.name === "chromium")?.revision;
  if (!existsSync(`/ms-playwright/chromium-${revision}`)) {
    console.error(`a imagem não tem o chromium-${revision} do Playwright ${installed}: use ${image}.`);
    process.exit(1);
  }
  const cli = path.join(root, "node_modules/@playwright/test/cli.js");
  process.exit(run(process.execPath, [cli, "test", "-c", config, ...args], { env: { ...process.env, VISUAL_IN_CONTAINER: "1" } }));
}

if (run("docker", ["version", "--format", "{{.Server.Version}}"], { stdio: ["ignore", "ignore", "inherit"] }) !== 0) {
  console.error(
    "Docker indisponível. A regressão visual compara em Linux (contêiner do Playwright): " +
      "inicie o Docker Desktop e rode de novo. Ver tests/visual/README.md."
  );
  process.exit(1);
}

// Volumes por checkout: worktrees diferentes não disputam o mesmo node_modules.
const id = createHash("sha1").update(root.toLowerCase()).digest("hex").slice(0, 10);
const volumes = [
  [`semec-visual-${id}-nm`, "/work/node_modules"],
  [`semec-visual-${id}-nm-react`, "/work/packages/react/node_modules"],
  [`semec-visual-${id}-nm-docs`, "/work/apps/docs/node_modules"],
  ["semec-visual-npm-cache", "/root/.npm"],
];

const quoted = args.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(" ");
const script = [
  "set -e",
  'hash=$(sha1sum package-lock.json | cut -d" " -f1)',
  'if [ "$(cat node_modules/.semec-visual-lock 2>/dev/null)" != "$hash" ]; then',
  '  echo "contêiner: instalando dependências (package-lock mudou)..."',
  "  npm ci --no-audit --no-fund --loglevel=error",
  '  echo "$hash" > node_modules/.semec-visual-lock',
  "fi",
  `node tests/visual/docker.mjs ${quoted}`,
].join("\n");

const env = ["CI", "VISUAL_PORT", "VISUAL_BROWSERS"].flatMap((k) => (process.env[k] ? ["-e", `${k}=${process.env[k]}`] : []));

process.exit(
  run("docker", [
    "run",
    "--rm",
    "--init",
    "--ipc=host",
    "-v",
    `${root}:/work`,
    ...volumes.flatMap(([name, target]) => ["-v", `${name}:${target}`]),
    "-w",
    "/work",
    "-e",
    "HOME=/root",
    ...env,
    image,
    "bash",
    "-c",
    script,
  ])
);
