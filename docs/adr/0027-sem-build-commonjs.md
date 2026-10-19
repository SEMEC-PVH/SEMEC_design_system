---
adr: 27
titulo: "Sem build CommonJS: o @semec/ds continua somente ESM"
status: Aceito
data: 2026-10-19
responde_achado: [INT-B1-07, INT-B1-08, INT-B1-10, INT-A-11]
---

# ADR-027 — Sem build CommonJS: o `@semec/ds` continua somente ESM

**Status:** Aceito (19/10/2026).

**Contexto.** Os testes de integração de 19/10/2026 ([relatório](../auditoria/2026-10-19-testes-de-integracao.md), [B1](../auditoria/2026-10-19-integracao/b1-react-fora-do-padrao.md)) mostraram que `require("@semec/ds/...")` falhava com `ERR_PACKAGE_PATH_NOT_EXPORTED` em todos os subpaths: o `exports` só tinha a condição `import`. O relatório sugeriu duas correções: a condição `default` (sem quebra) e, como opção, um build CommonJS de verdade (`tsup --format esm,cjs` + condição `require`), deixando esta última para um ADR por causa do risco de pacote duplo.

A 4.4.0 já entregou a primeira: cada subpath JS tem `default` apontando para o mesmo arquivo ESM. Com o `require(esm)` do Node (sem flag a partir da 22.12, que é o piso do `engines` do pacote), o `require()` carrega esse ESM de forma síncrona. Na conferência de 19/10/2026 (Node 24.21, `dist` da 4.4.0), **65 de 65 subpaths JS** exportados resolveram por `require`, e em todos o objeto obtido por `require` e por `import` é o **mesmo módulo** (mesmas referências de `FormField`, `FormFieldContext`, `useToast` e `toast`). O único subpath excluído é `./react/button-loading`, que o `exports` bloqueia de propósito (`null`).

O que ainda não funciona sem build CJS:

- Node anterior a 22.12 (fora do `engines`);
- ferramentas com carregador próprio que não fazem `require(esm)`, como o Jest 29 sem transformação (o README já traz a configuração com `babel-jest` e `transformIgnorePatterns`);
- TypeScript com `module: "node16"` em projeto CommonJS, que acusa TS1479 (com `nodenext` ou `"type": "module"`, passa).

**Decisão.** O `@semec/ds` **não ganha build CommonJS agora**. O pacote continua somente ESM, com `import` + `default` em cada subpath, e o caminho para `require()` é o `require(esm)` do Node 22.12+. Os pacotes novos da onda 2 seguem a mesma regra: o JS do `@semec/ds-tokens` (`./tokens`) sai só em ESM, com `default`; o `@semec/ds-css` não tem JS.

O assunto **volta a ser discutido**, num ADR novo, quando qualquer um destes critérios for atendido:

1. **Consumidor real preso a Node < 22.12**, com registro em issue: um sistema da Prefeitura ou de parceiro que precise do kit e não possa atualizar o Node dentro de um ciclo de release dele.
2. **Ferramenta sem `require(esm)` e sem contorno documentado**: ferramenta de build ou de teste usada por um consumidor real em que nem `import()` dinâmico nem transformação (como no Jest) resolvem.
3. **Regressão do `require(esm)`**: uma versão LTS do Node dentro do `engines` em que o `require` do pacote volte a falhar ou entregue instância diferente da do `import`. O teste desta decisão (65/65 subpaths, mesma instância) vira o critério de aceite.

Enquanto nenhum critério for atendido, pedidos de CJS são respondidos com a seção "CommonJS / Node" do README e com este ADR.

**Alternativas descartadas.**

- *Build CJS completo (`esm,cjs` + condição `require`)*. O ganho é pequeno: atende só a Node < 22.12, fora do `engines`, e a ferramentas que já têm contorno. O risco é concreto. Com duas cópias físicas de cada módulo, um mesmo app pode carregar a versão ESM por um caminho (`import` no código do app) e a CJS por outro (`require` numa dependência ou num teste). O kit tem estado de módulo que quebra nesse cenário: o `FormFieldContext` (`form-field.tsx`) seria criado duas vezes, e um `Input` da cópia CJS dentro de um `FormField` da cópia ESM perderia `id`, `aria-describedby` e `aria-invalid` sem erro nenhum, o que é falha de acessibilidade (ADR-014); o store do `useToast` (`toast.tsx`, `memoryState` e `listeners` no escopo do módulo) também seria duplicado, e um `toast()` disparado por uma cópia nunca apareceria no `<Toaster>` da outra. O mesmo vale para `NonceContext`, `SidebarContext`, `InputOTPContext` e `AvatarAltContext`. O custo também é concreto: o `dist` (hoje 3,8 MB) praticamente dobra; o `exports` (mais de 60 entradas), o `typesVersions` e os `.d.ts` ganham uma variante `.d.cts`; e cada verificação do `test:dist` (RSC, poda, barrel, tipos, exports) precisa rodar nos dois formatos.
- *CJS só como "casca" que reexporta o ESM*: um arquivo `.cjs` que faz `module.exports = require("./index.js")` depende do mesmo `require(esm)`, então não atende a Node < 22.12, que é o único caso que justificaria o CJS.
- *CJS só para subpaths sem estado (tokens, preset, skills)*: reduz o risco de pacote duplo, mas cria uma regra por subpath que o consumidor não consegue adivinhar, e os subpaths sem estado já funcionam com `require(esm)`.
- *Voltar a tirar o `default`*: o `require()` voltaria a falhar até no Node 24, sem ganho nenhum.

**Consequências.**

- O pacote é declarado **somente ESM** no README, em `docs/arquitetura.md` (INT-B1-11) e nos artefatos de IA. A seção "CommonJS / Node" do README é a referência para `require()`.
- O `engines.node >=22.12` passa a ser parte do contrato de `require()`: baixar esse piso exigiria rever este ADR.
- Os pacotes `@semec/ds-tokens` e `@semec/ds-css` (ADR-026 e ADR-028) não têm estado de módulo, mas seguem a mesma regra para que o consumidor tenha uma resposta só.
- Se um critério de reabertura for atendido, o ADR novo precisa tratar o pacote duplo antes do build: por exemplo, CJS como casca sobre o mesmo arquivo de estado, ou contextos guardados em `globalThis` com `Symbol.for`, e um teste que monte `FormField` e `Toaster` misturando `require` e `import`.
- Fica sem decisão o suporte a Jest sem transformação: hoje é documentação (README, "Testes com Jest").
