import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { dsComponents } from "../manifest.js";

/**
 * Receita oficial de formulário (RHF + Zod + FormField + ErrorSummary) na SKILL
 * e no manifest (TST-17 e TST-20, épico #54).
 *
 * - TST-17: com o `useForm` padrão o RHF foca o 1º campo inválido e o resumo
 *   nunca recebe o foco; os itens seguiam `Object.entries(errors)`, fora da
 *   ordem da tela.
 * - TST-20: a receita importa `react-hook-form` e `@hookform/resolvers`, que
 *   não estavam nas instruções de instalação, e `maskCurrency` não tinha a
 *   assinatura documentada.
 *
 * A compilação dos blocos com `tsc --strict` é feita fora da suíte (o pacote
 * não tem `react-hook-form` nas devDependencies).
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const repoRoot = path.resolve(pkgRoot, "../..");

const skill = fs.readFileSync(path.join(pkgRoot, "skills/semec-ds/SKILL.md"), "utf8");

function blocoCanonico() {
  const secao = skill.slice(skill.indexOf("### Exemplo Canônico"));
  const m = /```tsx\n([\s\S]*?)```/.exec(secao);
  if (!m?.[1]) throw new Error("Exemplo canônico não encontrado na SKILL");
  return m[1];
}

const usoFormField = dsComponents.find((c) => c.code === "form-field")?.usage ?? "";

describe.each([
  ["SKILL semec-ds (exemplo canônico)", blocoCanonico],
  ["manifest.js (form-field.usage)", () => usoFormField],
])("receita RHF + ErrorSummary — %s", (_nome, codigo) => {
  it("desliga o foco do RHF no 1º campo inválido (TST-17)", () => {
    expect(codigo()).toMatch(/shouldFocusError:\s*false/);
  });

  it("ordena os itens por lista fixa de ids, não por Object.entries(errors) (TST-17)", () => {
    const c = codigo();
    expect(c).not.toMatch(/Object\.(entries|keys|values)\(errors\)/);
    const ordem = /const ORDEM_CAMPOS = \[([^\]]+)\]/.exec(c)?.[1];
    expect(ordem).toBeDefined();
    const ids = [...ordem!.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    // Mesma ordem dos campos no JSX.
    const naTela = [...c.matchAll(/<Input\s+id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(naTela);
    expect(c).toMatch(/ORDEM_CAMPOS\.flatMap/);
  });

  it("muda o focusKey só no envio inválido (TST-17)", () => {
    const c = codigo();
    expect(c).toMatch(/focusKey=\{tentativa\}/);
    expect(c).toMatch(/handleSubmit\(onSubmit,\s*(onInvalid|\(\) => setTentativa)/);
  });

  it("traz um campo R$ com maskCurrency (TST-20)", () => {
    expect(codigo()).toMatch(/field\.onChange\(maskCurrency\(v\)\)/);
  });
});

describe("instalação da receita (TST-20)", () => {
  const cmd = "npm install react-hook-form @hookform/resolvers@^5 zod@^4";

  it("SKILL fixa a receita em resolvers 5 e Zod 4 (INT-C-01)", () => {
    const secaoInstalacao = skill.slice(skill.indexOf("## Instalação"), skill.indexOf("**Tailwind v4 no bundler:**"));
    expect(secaoInstalacao).toContain(cmd);
    expect(skill.slice(skill.indexOf("### Exemplo Canônico"))).toContain(cmd);
    expect(usoFormField).toContain(cmd);
  });

  it("README manda instalar os três pacotes opcionais (TST-20)", () => {
    const readme = fs.readFileSync(path.join(pkgRoot, "README.md"), "utf8");
    expect(readme).toContain(cmd);
  });

  it("manifest.json publicado traz os pacotes em install.peers e install.form", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "apps/docs/public/manifest.json"), "utf8"));
    expect(manifest.install.form).toBe(cmd);
    for (const p of ["react-hook-form", "@hookform/resolvers", "zod"]) {
      expect(manifest.install.peers).toContain(p);
    }
  });
});

describe("maskCurrency documentada (TST-20)", () => {
  it("a SKILL dá a assinatura, o retorno vazio e o espaço não separável", () => {
    const lib = skill.slice(skill.indexOf("## Lib utilities"), skill.indexOf("## Componentes"));
    expect(lib).toContain("maskCurrency(value: string): string");
    expect(lib).toMatch(/sem dígitos[^\n]*devolve `""`/);
    expect(lib).toContain("U+00A0");
    expect(lib).toMatch(/onValueChange=\{\(v\) => setValor\(maskCurrency\(v\)\)\}/);
  });
});
