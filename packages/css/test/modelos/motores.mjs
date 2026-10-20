/**
 * Motores dos modelos de servidor (ADR-030): PHP 8.2+ (PHP puro, Twig e Blade)
 * e Python 3 (Jinja2). Usa o binário local quando existe (a CI ubuntu-latest
 * tem php, composer e python3); senão, Docker: composer:2 para instalar o
 * vendor de teste, php:8.3-cli para renderizar e python:3.12-slim com jinja2.
 *
 * SEMEC_MODELOS_MOTOR=local|docker força um dos caminhos (padrão: auto).
 * SEMEC_PHP e SEMEC_PYTHON apontam binários específicos.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const cssRoot = path.resolve(here, "../..");
const phpDir = path.join(here, "php");
const cacheDir = path.join(here, ".cache");
const JINJA = "jinja2==3.1.6";
// Flask real para provar a configuração de autoescape documentada (render_flask.py).
const FLASK = "flask==3.1.1";
const IMG_PHP = "php:8.3-cli";
const IMG_COMPOSER = "composer:2";
const IMG_PYTHON = "python:3.12-slim";

const modo = process.env.SEMEC_MODELOS_MOTOR ?? "auto";

function run(cmd, args, { input, cwd, env } = {}) {
  const r = spawnSync(cmd, args, {
    input,
    cwd,
    env: env ? { ...process.env, ...env } : process.env,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: 10 * 60 * 1000,
    windowsHide: true,
  });
  return { ok: !r.error && r.status === 0, status: r.status, stdout: r.stdout ?? "", stderr: (r.stderr ?? "") + (r.error ? String(r.error) : "") };
}

const has = (cmd, args) => run(cmd, args).ok;

function docker(args, input) {
  // No Windows o Docker Desktop aceita C:\...:/work; no Linux, o caminho é o mesmo.
  return run("docker", ["run", "--rm", "-i", "-v", `${cssRoot}:/work`, ...args], { input });
}

function dockerOk() {
  return has("docker", ["version", "--format", "{{.Server.Version}}"]);
}

function fail(lang, tentativas) {
  const detalhe = tentativas.map((t) => `  - ${t.como}: ${t.erro.trim().split("\n").slice(-8).join("\n    ")}`).join("\n");
  throw new Error(`Não foi possível renderizar os modelos ${lang}. Instale o motor local ou o Docker.\n${detalhe}`);
}

function parseJson(lang, out) {
  try {
    return JSON.parse(out);
  } catch {
    throw new Error(`Saída inválida do motor ${lang}:\n${out.slice(0, 2000)}`);
  }
}

/** Um processo PHP por chamada [script, argumento]; as saídas JSON se juntam. */
function emSequencia(chamadas, executar) {
  const saida = {};
  for (const chamada of chamadas) {
    const r = executar(chamada);
    if (!r.ok) return { ok: false, erro: r.stderr || r.stdout };
    Object.assign(saida, parseJson("PHP", r.stdout));
  }
  return { ok: true, saida };
}

/**
 * PHP puro, Twig e Blade. Padrão: render.php em dois processos, o principal
 * (PHP, Twig, Blade) e o Twig sem autoescape.
 */
function renderPhp(input, chamadas = [["render.php", "principal"], ["render.php", "twig-sem-autoescape"]]) {
  const tentativas = [];
  const vendor = path.join(phpDir, "vendor", "autoload.php");
  const php = process.env.SEMEC_PHP ?? "php";

  if (modo !== "docker" && has(php, ["-v"])) {
    if (!fs.existsSync(vendor)) {
      const composer = process.env.SEMEC_COMPOSER ?? "composer";
      const r = run(composer, ["install", "--no-interaction", "--no-progress", "--prefer-dist"], { cwd: phpDir });
      if (!r.ok) tentativas.push({ como: "composer local", erro: r.stderr || r.stdout });
    }
    if (fs.existsSync(vendor)) {
      const r = emSequencia(chamadas, ([script, arg]) => run(php, [path.join(here, script), arg], { input }));
      if (r.ok) return { saida: r.saida, como: `php local ${run(php, ["-r", "echo PHP_VERSION;"]).stdout}` };
      tentativas.push({ como: "php local", erro: r.erro });
    }
  }

  if (modo !== "local" && dockerOk()) {
    if (!fs.existsSync(vendor)) {
      const r = docker(["-w", "/work/test/modelos/php", IMG_COMPOSER, "install", "--no-interaction", "--no-progress", "--prefer-dist"]);
      if (!r.ok) tentativas.push({ como: `docker ${IMG_COMPOSER}`, erro: r.stderr || r.stdout });
    }
    const r = emSequencia(chamadas, ([script, arg]) => docker(["-w", "/work/test/modelos", IMG_PHP, "php", script, arg], input));
    if (r.ok) return { saida: r.saida, como: `docker ${IMG_PHP}` };
    tentativas.push({ como: `docker ${IMG_PHP}`, erro: r.erro });
  }

  fail("PHP/Twig/Blade", tentativas.length ? tentativas : [{ como: "php", erro: "php e Docker indisponíveis" }]);
}

function pythonLocal() {
  const candidatos = process.env.SEMEC_PYTHON ? [process.env.SEMEC_PYTHON] : process.platform === "win32" ? ["python", "py"] : ["python3", "python"];
  for (const py of candidatos) {
    const r = run(py, ["-c", "import sys; print('%d.%d' % sys.version_info[:2]); sys.exit(0 if sys.version_info >= (3, 8) else 1)"]);
    if (r.ok) return { py, versao: r.stdout.trim() };
  }
  return null;
}

/**
 * Python: `script` com o pacote `pacote` (módulo `modulo`) instalado só para o
 * teste, numa pasta de cache (`sufixo` separa as instalações).
 */
function renderPython({ nome, script, pacote, modulo, sufixo = "" }, input = "") {
  const tentativas = [];
  const local = modo !== "docker" ? pythonLocal() : null;

  if (local) {
    const alvo = path.join(cacheDir, `py-${local.versao}${sufixo}`);
    let env;
    if (!run(local.py, ["-c", `import ${modulo}`]).ok) {
      if (!fs.existsSync(path.join(alvo, modulo))) {
        const r = run(local.py, ["-m", "pip", "install", "--quiet", "--disable-pip-version-check", "--target", alvo, pacote]);
        if (!r.ok) tentativas.push({ como: `pip local (${local.py})`, erro: r.stderr || r.stdout });
      }
      env = { PYTHONPATH: alvo };
    }
    const r = run(local.py, [path.join(here, script)], { input, env });
    if (r.ok) return { saida: parseJson(nome, r.stdout), como: `python local ${local.versao}` };
    tentativas.push({ como: `python local (${local.py})`, erro: r.stderr || r.stdout });
  }

  if (modo !== "local" && dockerOk()) {
    const alvo = `/work/test/modelos/.cache/py-docker${sufixo}`;
    const sh = `[ -d ${alvo}/${modulo} ] || pip install --quiet --disable-pip-version-check --root-user-action=ignore --target ${alvo} ${pacote} >&2; PYTHONPATH=${alvo} python ${script}`;
    const r = docker(["-w", "/work/test/modelos", IMG_PYTHON, "sh", "-c", sh], input);
    if (r.ok) return { saida: parseJson(nome, r.stdout), como: `docker ${IMG_PYTHON}` };
    tentativas.push({ como: `docker ${IMG_PYTHON}`, erro: r.stderr || r.stdout });
  }

  fail(nome, tentativas.length ? tentativas : [{ como: "python", erro: "python 3 e Docker indisponíveis" }]);
}

/** Jinja2. */
const renderJinja = (input) => renderPython({ nome: "Jinja2", script: "render.py", pacote: JINJA, modulo: "jinja2" }, input);

/**
 * Flask de verdade (CONS-03): a tela do app como a documentação manda, sem
 * configurar, com o autoescape documentado e com extensão .html.
 * Devolve { saida: {"padrao-jinja", "documentado-jinja", "padrao-html"}, como }.
 */
export const renderizarFlask = () => renderPython({ nome: "Flask", script: "render_flask.py", pacote: FLASK, modulo: "flask", sufixo: "-flask" });

/**
 * Renderiza todos os casos. Devolve { saidas: {variante: {id: html}}, motores: {...} }.
 * Variantes: php, twig, twig-sem-autoescape, blade, jinja, jinja-sem-autoescape.
 */
export function renderizarTodos(casos) {
  const input = JSON.stringify(casos.map(({ id, parcial, dados }) => ({ id, parcial, dados })));
  const php = renderPhp(input);
  const jinja = renderJinja(input);
  return {
    saidas: { ...php.saida, ...jinja.saida },
    motores: { "php/twig/blade": php.como, jinja: jinja.como },
  };
}

/**
 * Exemplos do templates/README.md (escritos em .cache/exemplos por quem chama):
 * exemplos.php (PHP puro, Twig, Blade) e exemplos.py (Jinja2, StrictUndefined).
 * Devolve { saidas: {php|twig|blade|jinja: {get, post}}, motores }.
 */
export function renderizarExemplos() {
  const php = renderPhp("", [["exemplos.php", "todos"]]);
  const jinja = renderPython({ nome: "Jinja2", script: "exemplos.py", pacote: JINJA, modulo: "jinja2" });
  return { saidas: { ...php.saida, ...jinja.saida }, motores: { "php/twig/blade": php.como, jinja: jinja.como } };
}
