import path from "node:path";
import { fileURLToPath } from "node:url";

import { gateBrowserLabel, launchGateBrowser } from "./browser.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Gate de envio nativo de formulário (D1, AUD-35).
 *
 * O FileUpload mostra a lista de arquivos pelo estado do React; o `<form>`
 * nativo envia e valida `required` pelo `input.files`. Os dois têm de bater:
 * arquivo na lista ⇒ arquivo no `FormData` e `checkValidity()` verdadeiro.
 *
 * Por que Chromium e não jsdom: o jsdom não tem `DataTransfer` nem deixa
 * montar um `FileList`, então não reproduz o envio real. Requer o Chromium do
 * Playwright (mesma instalação do gate de estados abertos).
 */
export async function checkFormSubmit() {
  console.log(`▶ [7/7] Envio nativo de formulário com FileUpload (${gateBrowserLabel()})...`);

  const { build } = await import("esbuild");
  const bundle = await build({
    entryPoints: [path.join(here, "form-submit.browser.mjs")],
    bundle: true,
    format: "iife",
    platform: "browser",
    write: false,
    logLevel: "silent",
    define: { "process.env.NODE_ENV": '"development"' },
  });
  const script = bundle.outputFiles[0].text;

  const browser = await launchGateBrowser();

  const errors = [];
  const expect = (label, actual, expected) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) console.log(`  ✓ ${label}`);
    else errors.push(`${label}: esperado ${JSON.stringify(expected)}, obtido ${JSON.stringify(actual)}`);
  };
  const pdf = (name) => ({ name, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });

  try {
    const page = await browser.newPage();
    await page.setContent(
      '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Gate: envio de formulário</title></head><body></body></html>'
    );
    await page.addScriptTag({ content: script });
    await page.evaluate(() => window.__semecFormSubmit.mount());
    await page.waitForSelector("#doc");

    const inspect = (id) => page.evaluate((formId) => window.__semecFormSubmit.inspect(formId), id);
    const changes = () => page.evaluate(() => window.__semecFormSubmit.changes());
    const choose = async (formId, files) => {
      const [chooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        page.locator(`#${formId}`).getByText("clique para escolher").click(),
      ]);
      if (files) await chooser.setFiles(files);
    };

    // Não controlado, required, accept=".pdf".
    const F = "form-nao-controlado";
    expect("sem arquivo: inválido e FormData vazio", await inspect(F), {
      inputFiles: [], formData: [], valid: false, listed: [],
    });

    await choose(F, pdf("a.pdf"));
    expect("arquivo escolhido vai no FormData e valida required", await inspect(F), {
      inputFiles: ["a.pdf"], formData: ["a.pdf"], valid: true, listed: ["a.pdf"],
    });

    await choose(F, pdf("a.pdf"));
    expect("escolher o mesmo arquivo de novo dispara change", (await changes()).naoControlado, 2);

    await choose(F, { name: "b.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ") });
    expect("arquivo recusado (accept) não substitui o aceito no input", await inspect(F), {
      inputFiles: ["a.pdf"], formData: ["a.pdf"], valid: true, listed: ["a.pdf"],
    });

    await choose(F, null);
    await page.evaluate(() => window.__semecFormSubmit.cancel("doc"));
    expect("cancelar o seletor devolve a lista ao input", await inspect(F), {
      inputFiles: ["a.pdf"], formData: ["a.pdf"], valid: true, listed: ["a.pdf"],
    });

    await page.evaluate((id) => window.__semecFormSubmit.drop(id, "c.pdf"), F);
    await page.waitForFunction(() => document.querySelector("#form-nao-controlado li"));
    expect("arquivo solto na zona vai no FormData", await inspect(F), {
      inputFiles: ["c.pdf"], formData: ["c.pdf"], valid: true, listed: ["c.pdf"],
    });

    // Controlado (value/onValueChange), required, multiple.
    const C = "form-controlado";
    await choose(C, [pdf("x.pdf"), pdf("y.pdf")]);
    expect("controlado: vários arquivos no FormData", await inspect(C), {
      inputFiles: ["x.pdf", "y.pdf"], formData: ["x.pdf", "y.pdf"], valid: true, listed: ["x.pdf", "y.pdf"],
    });

    await page.click("#remover");
    expect("controlado: remover pelo value tira do input", await inspect(C), {
      inputFiles: ["x.pdf"], formData: ["x.pdf"], valid: true, listed: ["x.pdf"],
    });

    await page.click("#remover");
    expect("controlado: remover o último volta a inválido", await inspect(C), {
      inputFiles: [], formData: [], valid: false, listed: [],
    });
  } finally {
    await browser.close();
  }

  if (errors.length > 0) {
    console.error("✖ Falha no envio nativo de formulário:");
    for (const e of errors) console.error(`  - ${e}`);
    throw new Error(`Envio nativo de formulário falhou com ${errors.length} erro(s).`);
  }
}

// Execução direta: `node scripts/gate/check-form-submit.mjs` (exige build:ds).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkFormSubmit().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
