---
"@semec/ds": patch
---

Corrige a receita oficial de formulário (React Hook Form + Zod + `FormField` + `ErrorSummary`) na SKILL `semec-ds`, no `manifest` (`form-field.usage`) e no README (TST-17 e TST-20, #54):

- **TST-17:** o exemplo usa `shouldFocusError: false` no `useForm` (sem isso o RHF foca o 1º campo inválido e o `ErrorSummary` nunca recebe o foco), soma a `tentativa` do `focusKey` só no envio inválido (`handleSubmit(onSubmit, onInvalid)`) e monta os itens do resumo por uma lista fixa de ids na ordem da tela (`ORDEM_CAMPOS`), não por `Object.entries(errors)`. A descrição do `ErrorSummary` passa a dizer quando ele puxa o foco (0 → N erros e troca de `focusKey`; não durante a digitação).
- **TST-20:** as instruções de instalação (SKILL, README, `manifest.json` em `install.peers` e no novo campo aditivo `install.form`) incluem `npm install react-hook-form @hookform/resolvers zod`, opcionais e só para a receita. A assinatura de `maskCurrency(value: string): string` está documentada (centavos, `""` sem dígitos desde a 4.0.2, espaço não separável depois de `R$`), com um exemplo de campo R$ avulso e outro dentro da receita.
