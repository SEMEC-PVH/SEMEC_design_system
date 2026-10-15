---
"@semec/ds": major
---

Remove o que foi anunciado como depreciado na 3.1.0 e na 3.2.0 (ADR-013). Nenhum componente sai e nenhuma cor renderizada muda. Guia com antes/depois, tabela primitivo → semântico e codemod: [docs/migracao-4.0.md](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/migracao-4.0.md).

**Removido**

- **`onChange(valor)` dos campos não nativos (AUD-35).** `Calendar`, `Combobox`, `InputOTP` e `FileUpload` perdem o `onChange(valor)`/`onChange(files)`: use `onValueChange`, com a mesma assinatura (existe desde a 3.2.0). A prop passa a ser tipada como `onChange?: never` (o TypeScript recusa) e o componente a descarta em tempo de execução, sem repassá-la ao DOM, com um `console.error` único em desenvolvimento ("onChange foi removido na 4.0; use onValueChange"). Sai o aviso de depreciação (`lib/deprecation`).
- **`DatePicker`: `onChange` vira o evento nativo (AUD-35).** Recebe o `ChangeEvent` do `<input type="date">`, como `Input` e `Textarea`; o valor ISO continua em `onValueChange(string)`. Código que fazia `onChange={setData}` passa a receber o evento: troque por `onValueChange`.
- **Utilitários de primitivo (AUD-55).** O `@theme` do `tokens.css` não declara mais `--color-pv-*`, e os dois `pv-preset` não têm mais as cores `pv-*`: `bg-pv-*`, `text-pv-*`, `border-pv-*`, `ring-pv-*` etc. deixam de gerar CSS. As variáveis `--pv-*` continuam no `:root`. Use os semânticos.
- **Import por caminho de arquivo em `dist/` (AUD-20).** O `exports` nunca publicou `./dist/*`; a 4.0 trata o bloqueio como contrato (novo `check-exports` no `test:dist`). Use `@semec/ds/react` ou `@semec/ds/react/<componente>`.

**Novo**

- Tokens semânticos para os usos de primitivo que o próprio kit tinha, apontando para o primitivo (sem hex novo): `--text-brand` → `text-text-brand` (título do `SectionHeader`, 12,43:1), `--feedback-success-emphasis` → `bg-success-emphasis` e `--text-on-success-emphasis` → `text-success-emphasis-foreground` (Toast `success`, 5,85:1). Também no `pv-preset` (`text-brand`, `success.emphasis`).
- Codemod `npx -p @semec/ds@4 -p typescript@5 semec-ds codemod-4 <pasta> [--write]` (bin `semec-ds`; roda com a 3.x ainda instalada; depois de atualizar, `npx semec-ds codemod-4` ou `node node_modules/@semec/ds/codemods/v4.mjs`): troca `onChange` por `onValueChange` no JSX dos componentes acima importados do kit (no `DatePicker`, só quando a função inline recebe a string; referência é relatada) e relata, sem reescrever, cada `*-pv-*`, `--color-pv-*` e import de `dist/`. Também relata re-export por barrel local. Lê o JSX com a API do compilador do TypeScript 5, carregado do projeto ou do `npx -p typescript@5`, sem dependência nova (o `typescript` não entra em `peerDependencies`).

Depreciação: anunciado na 4.0 para sair na 5.0: `ariaLabel` e `emptyMessage` do `Combobox` (use rótulo visível ou o atributo `aria-label`, e `emptyText`) e `modal` do `AlertDialog` e `onPointerDownOutside`/`onInteractOutside` do `AlertDialogContent` (ignorados desde a 3.1.0).
