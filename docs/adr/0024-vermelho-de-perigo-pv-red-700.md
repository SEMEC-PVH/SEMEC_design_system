---
adr: 24
titulo: "Vermelho de perigo: escala pv-red com centro em pv-red-700"
status: Aceito
data: 2026-10-07
responde: [QA-07]
---

# ADR-024 — Vermelho de perigo: escala `pv-red` com centro em `pv-red-700`

**Status:** Aceito (07/10/2026).

**Contexto.** A [QA-07](../questoes-abertas.md) (antiga `D3` do documento de identidade) registrava que a paleta institucional declarada tem azul, verde, amarelo e neutros — **não tem vermelho**. Sem token de perigo, estados de erro, bordas inválidas, toasts e diálogos destrutivos ficariam com cor improvisada em cada tela. O [ADR-014](0014-wcag-21-aa-criterio-bloqueante.md) torna WCAG 2.1 AA critério bloqueante, ou seja, o valor precisava passar no cálculo de contraste *antes* de ser adotado, não depois.

Enquanto a questão ficou aberta, `apps/docs/app/tokens.css` manteve a escala `--pv-red-*` marcada como **provisória** ("escolhida por contraste, não por identidade") e o mesmo par de valores foi espelhado em `packages/react/tokens.css`, no fallback do `PreviewFrame` e nos previews — sempre com `#b91c1c`, nunca declarado como decisão.

**Decisão.** Adotar a escala **`--pv-red-*` com centro em `--pv-red-700: #b91c1c`**, e fazer `--feedback-danger`, `--color-feedback-danger` e `--color-destructive` apontarem para ele.

| Token | Valor | Contraste |
|---|---|---|
| `--pv-red-700` (perigo) | `#b91c1c` | 5,98:1 sobre o fundo de página · 6,47:1 com texto branco |
| `--pv-red-50` (superfície) | `#fef2f2` | fundo de `--color-feedback-danger-surface` |
| `--pv-red-400` no tema escuro | `#f87171` | troca de L1 apenas; L0 intacto |

1. **Onde vale.** `packages/react/tokens.css` (kit), `apps/docs/app/tokens.css` (site), fallback do `PreviewFrame` e os exemplos visuais de `/padroes`. Nenhum hex de erro novo fora da escala.
2. **Tema escuro.** Só o L1 troca (`--color-feedback-danger: var(--pv-red-400)`), conforme [ADR-003](0003-design-tokens-tres-niveis-dtcg.md) e [ADR-012](0012-tema-por-atributo-de-dados.md).
3. **Fora de escopo.** Identidade institucional: [QA-01](../questoes-abertas.md) (azul) e [QA-09](../questoes-abertas.md) (assinatura) seguem abertas e podem rebatizar a paleta inteira. Se mudarem, este ADR é reavaliado — mas a troca é localizada no L0/L1, sem tocar em componente.

**Alternativas descartadas.**

- *`#dc2626` (`pv-red-600`)*: 4,83:1 com texto branco — passa no AA, mas com margem menor para texto pequeno e para variações `hover`/`900`.
- *`#ef4444` (`pv-red-500`)*: 3,76:1 com texto branco — reprovado em texto normal (ADR-014).
- *Esperar a marca decidir (QA-01/QA-09)*: mantém o estado de erro — exigido pela definição de pronto de todo componente — travado até uma decisão de governança sem prazo.

**Consequências.** O comentário "escala provisória" sai do `tokens.css` e a QA-07 passa a `Respondida` em `docs/questoes-abertas.md`. Erros, bordas inválidas, `destructive` e toasts têm referência única e medida. O amarelo de alerta (`--pv-yellow-800`) continua marcado como provisório junto da QA-01, e a revisão de identidade futura altera tokens, não componentes.
