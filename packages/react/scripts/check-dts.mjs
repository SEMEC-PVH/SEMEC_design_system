#!/usr/bin/env node
/**
 * Confere os `.d.ts` publicados como um consumidor ESM puro os vê (D12):
 * `module`/`moduleResolution: nodenext` (e `bundler`), `skipLibCheck: false`, importando
 * `@semec/ds/react`, subpaths por componente (`@semec/ds/react/<nome>`) e os
 * entries de dados `@semec/ds/skills` e `@semec/ds/lite/skills`.
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
import { Button, IconButton, Spinner, Stepper, PasswordInput, InputMask, Input, FormField, DataTable } from "@semec/ds/react";
import { Button as SubButton, buttonVariants, type ButtonProps } from "@semec/ds/react/button";
import { Stepper as SubStepper, type StepperProps } from "@semec/ds/react/stepper";
import { InputMask as SubInputMask, applyInputMask, inputMaskPatterns, type InputMaskPreset } from "@semec/ds/react/input-mask";
import { PasswordInput as SubPasswordInput, type PasswordInputProps } from "@semec/ds/react/password-input";
import { FormField as SubFormField, useFormFieldControl } from "@semec/ds/react/form-field";
import type {
  CalendarProps,
  ComboboxProps,
  DatePickerProps,
  FileUploadProps,
  InputOTPProps,
} from "@semec/ds/react";
// 4.0.1: os entries de dados para agentes também têm tipos (antes: TS7016).
import { dsComponents, dsBySlug, dsByCategory, dsCategories, dsPrompt, dsPortal, type DsComponent } from "@semec/ds/skills";
import { dsCategories as liteCategories, dsPortal as litePortal, dsTokens } from "@semec/ds/lite/skills";
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

// 4.0 (AUD-35): o onChange(valor) saiu. O tipo recusa o handler antigo...
// @ts-expect-error onChange(date) removido do Calendar
const oldCalendar: CalendarProps = { onChange: (date: Date) => date };
// @ts-expect-error onChange(value) removido do Combobox
const oldCombobox: ComboboxProps = { options: [], onChange: (value: string) => value };
// @ts-expect-error onChange(value) removido do InputOTP
const oldOtp: InputOTPProps = { onChange: (value: string) => value };
// @ts-expect-error onChange(files) removido do FileUpload
const oldUpload: FileUploadProps = { onChange: (files: File[]) => files };
// @ts-expect-error no DatePicker, onChange é o evento nativo, não a string
const oldDatePicker: DatePickerProps = { onChange: (value: string) => value.trim() };
// ...e aceita o contrato novo: onValueChange(valor) e, no DatePicker, o evento nativo.
const newProps: [CalendarProps, ComboboxProps, InputOTPProps, FileUploadProps, DatePickerProps] = [
  { onValueChange: (date: Date) => date },
  { options: [], onValueChange: (value: string) => value },
  { onValueChange: (value: string) => value },
  { onValueChange: (files: File[]) => files },
  {
    onValueChange: (value: string) => value,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => event.target.value,
  },
];

// NEXT42-03: linha tipada com \`interface\` (sem assinatura de índice). Com
// \`T extends Record<string, unknown>\` dava TS2344/TS2322; \`type\` já passava.
interface ProtocoloI {
  numero: string;
  status: string;
}
type ProtocoloT = { numero: string; status: string };
const protocolosI: ProtocoloI[] = [{ numero: "2026/1", status: "Aberto" }];
const protocolosT: ProtocoloT[] = [{ numero: "2026/2", status: "Fechado" }];
export const tabelas = (
  <>
    <DataTable<ProtocoloI>
      columns={[{ key: "numero", header: "Número", render: (p: ProtocoloI) => p.numero }]}
      data={protocolosI}
      rowLabel={(p) => "Abrir protocolo " + p.numero}
      onRowClick={(p) => p.status}
    />
    <DataTable
      columns={[{ key: "status", header: "Situação", render: (p: ProtocoloI) => p.status.toUpperCase() }]}
      data={protocolosI}
    />
    <DataTable columns={[{ key: "numero", header: "Número" }]} data={protocolosT} rowKey={(p) => p.numero} />
  </>
);

const firstComponent: DsComponent | undefined = dsComponents[0];
const bySlug: DsComponent | undefined = dsBySlug["botoes"];
const forms: DsComponent[] = dsByCategory("formularios");
const prompt: string = firstComponent ? dsPrompt(firstComponent) : "";
const categoryKeys: string[] = [...dsCategories, ...liteCategories].map((c) => c.key);
const portalHrefs: string[] = [...dsPortal.items, ...litePortal.items].map((i) => i.href);
const semanticTokens: string[] = dsTokens.semantic;
// @ts-expect-error o código do componente é string, não número
const wrongCode: number = bySlug?.code;

export { forms, prompt, categoryKeys, portalHrefs, semanticTokens, wrongCode };
export { oldCalendar, oldCombobox, oldOtp, oldUpload, oldDatePicker, newProps };
export { same, masked, pattern, classes, useFormFieldControl, React };
`;

// O mesmo consumidor em nodenext (ESM puro do Node) e em bundler (Vite, Next).
const resolutions = [
  { module: "nodenext", moduleResolution: "nodenext" },
  { module: "esnext", moduleResolution: "bundler" },
];
const tsconfigFor = (resolution) => ({
  compilerOptions: {
    ...resolution,
    target: "es2022",
    jsx: "react-jsx",
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    types: [],
  },
  files: ["consumer.tsx"],
});

// 4.0.1: o erro do onChange removido tem de citar o onValueChange (antes, com
// `never`, o tsc dizia só "not assignable to type 'undefined'").
const removedOnChange = `import { Calendar, Combobox, FileUpload, InputOTP } from "@semec/ds/react";
export const a = <Calendar onChange={(date: Date) => date} />;
export const b = <Combobox options={[]} onChange={(value: string) => value} />;
export const c = <InputOTP onChange={(value: string) => value} />;
export const d = <FileUpload onChange={(files: File[]) => files} />;
`;

let status = 1;
try {
  fs.writeFileSync(path.join(dir, "consumer.tsx"), consumer);
  status = 0;
  for (const resolution of resolutions) {
    fs.writeFileSync(path.join(dir, "tsconfig.json"), JSON.stringify(tsconfigFor(resolution), null, 2));
    const result = spawnSync(process.execPath, [tsc, "-p", path.join(dir, "tsconfig.json")], {
      cwd: dir,
      encoding: "utf8",
    });
    if ((result.status ?? 1) !== 0) {
      status = 1;
      console.error(`check-dts: os .d.ts publicados não compilam como consumidor ${resolution.moduleResolution}:`);
      console.error((result.stdout || "") + (result.stderr || ""));
    }
  }
  fs.writeFileSync(path.join(dir, "consumer.tsx"), removedOnChange);
  fs.writeFileSync(path.join(dir, "tsconfig.json"), JSON.stringify(tsconfigFor(resolutions[0]), null, 2));
  const msg = spawnSync(process.execPath, [tsc, "-p", path.join(dir, "tsconfig.json")], { cwd: dir, encoding: "utf8" });
  const out = (msg.stdout || "") + (msg.stderr || "");
  const cited = out.match(/not assignable to type 'OnChangeRemovidoUseOnValueChange'/g)?.length ?? 0;
  if (cited !== 4) {
    status = 1;
    console.error(`check-dts: o erro do onChange removido devia citar OnChangeRemovidoUseOnValueChange 4 vezes (Calendar, Combobox, InputOTP, FileUpload); citou ${cited}:`);
    console.error(out);
  }
  if (status === 0) {
    console.log("check-dts: ok (@semec/ds/react e subpaths button, stepper, input-mask, password-input, form-field; DataTable com linha `interface`; @semec/ds/skills e @semec/ds/lite/skills tipados; button-loading fechado; onChange(valor) da 3.x recusado com erro que cita onValueChange; nodenext e bundler, skipLibCheck false).");
  }
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
process.exit(status);
