#!/usr/bin/env node
/**
 * Confere os `.d.ts` publicados como um consumidor ESM puro os vê (D12):
 * `module`/`moduleResolution: nodenext`, `skipLibCheck: false`, importando
 * `@semec/ds/react` e subpaths por componente (`@semec/ds/react/<nome>`).
 * Pega extensão faltando em import relativo dos `.d.ts`, subpath sem tipos e
 * tipo quebrado que o `typecheck` do `src/` (moduleResolution bundler) não vê.
 *
 * O consumidor é gerado numa pasta temporária dentro do pacote, para que
 * `@semec/ds` resolva pelo próprio nome (self-reference do `exports`) e os
 * `@types/*` venham do `node_modules` do monorepo. Sem dependência nova: usa o
 * `typescript` já instalado. Requer `npm run build:ds` antes.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (!fs.existsSync(path.join(pkgRoot, "dist", "react", "index.d.ts"))) {
  console.error("check-dts: dist/react/index.d.ts não existe. Rode `npm run build:ds` antes.");
  process.exit(1);
}

const tsc = createRequire(path.join(pkgRoot, "package.json")).resolve("typescript/bin/tsc");
const dir = fs.mkdtempSync(path.join(pkgRoot, ".check-dts-"));

const consumer = `import * as React from "react";
import { Button, IconButton, Spinner, Stepper, PasswordInput, InputMask, Input, FormField } from "@semec/ds/react";
import { Button as SubButton, buttonVariants, type ButtonProps } from "@semec/ds/react/button";
import { Stepper as SubStepper, type StepperProps } from "@semec/ds/react/stepper";
import { InputMask as SubInputMask, applyInputMask, inputMaskPatterns, type InputMaskPreset } from "@semec/ds/react/input-mask";
import { PasswordInput as SubPasswordInput, type PasswordInputProps } from "@semec/ds/react/password-input";
import { FormField as SubFormField, useFormFieldControl } from "@semec/ds/react/form-field";
// Módulo interno do loading: fica fora dos exports e não pode resolver.
// @ts-expect-error
import { ButtonLoadingIndicator } from "@semec/ds/react/button-loading";

// O subpath tem de expor o mesmo símbolo da raiz.
const same: [typeof Button, typeof Stepper, typeof InputMask, typeof PasswordInput, typeof FormField] = [
  SubButton,
  SubStepper,
  SubInputMask,
  SubPasswordInput,
  SubFormField,
];

const preset: InputMaskPreset = "cpf";
const masked: string = applyInputMask("12345678901", preset).masked;
const pattern: string = inputMaskPatterns.cep;
const classes: string = buttonVariants({ variant: "outline", size: "sm" });
const buttonProps: ButtonProps = { loading: true, loadingText: "Enviando…" };
const stepperProps: StepperProps = { steps: [{ label: "Dados" }], currentStep: 0 };
const passwordProps: PasswordInputProps = { autoComplete: "current-password", defaultVisible: false };

export const element = (
  <FormField label="CPF">
    <InputMask mask="cpf" onValueChange={(m: string, raw: string) => m + raw} />
    <PasswordInput {...passwordProps} />
    <Stepper {...stepperProps} onStepClick={(i: number) => i} />
    <Button {...buttonProps}>Enviar</Button>
    <IconButton label="Baixar" loading />
    <Spinner decorative />
    <Input />
  </FormField>
);

export { same, masked, pattern, classes, useFormFieldControl, React };
`;

const tsconfig = {
  compilerOptions: {
    module: "nodenext",
    moduleResolution: "nodenext",
    target: "es2022",
    jsx: "react-jsx",
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    types: [],
  },
  files: ["consumer.tsx"],
};

let status = 1;
try {
  fs.writeFileSync(path.join(dir, "consumer.tsx"), consumer);
  fs.writeFileSync(path.join(dir, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));
  const result = spawnSync(process.execPath, [tsc, "-p", path.join(dir, "tsconfig.json")], {
    cwd: dir,
    encoding: "utf8",
  });
  status = result.status ?? 1;
  if (status !== 0) {
    console.error("check-dts: os .d.ts publicados não compilam como consumidor nodenext:");
    console.error((result.stdout || "") + (result.stderr || ""));
  } else {
    console.log("check-dts: ok (@semec/ds/react e subpaths button, stepper, input-mask, password-input, form-field; button-loading fechado; nodenext, skipLibCheck false).");
  }
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
process.exit(status);
