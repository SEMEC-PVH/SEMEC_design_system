---
adr: 25
titulo: "Tema único claro no pacote @semec/ds"
status: Aceito
data: 2026-10-15
substitui: [12]
responde_achado: [AUD-47]
---

# ADR-025 — Tema único claro no pacote `@semec/ds`

**Status:** Aceito (15/10/2026).

**Substitui.** [ADR-012](0012-tema-por-atributo-de-dados.md) (tema por atributo de dados, com claro/escuro e multi-órgão).

**Contexto.** O ADR-012 decidiu que o tema seria aplicado por atributo no elemento raiz (`data-theme`, `data-color-scheme="dark"`), trocando só o mapeamento L0 → L1, e que todo componente seria validado nos dois esquemas de cor. A versão 1.1.0 do pacote chegou a publicar um bloco `[data-theme="dark"]` no `tokens.css`. A 2.0.0 removeu esse bloco, e com ele os primitivos que só o tema escuro usava (entre eles `--pv-red-400`), **sem ADR, sem depreciação e sem guia de migração** — a errata está no [CHANGELOG](../../packages/react/CHANGELOG.md) (AUD-43). Desde então o índice dizia "Aceito" para uma decisão que o código não cumpre, e o ADR-024 seguiu citando `--pv-red-400` como token do tema escuro (AUD-47, CTR-C20 da [auditoria de 14/10/2026](../auditoria/2026-10-14-auditoria-prototipos-antes-depois.md)).

Duas coisas diferentes atendem pelo nome "tema escuro" neste repositório, e a confusão vem daí:

1. **O pacote `@semec/ds`** (`packages/react/tokens.css`): só tema claro desde a 2.0.0. `color-scheme: light` no `:root`; `data-theme="dark"` na `<html>` do consumidor não tem efeito.
2. **O site de documentação** (`apps/docs/app/tokens.css` e `globals.css`): tem tema escuro **próprio**, por `[data-theme="dark"]` e `ThemeToggle`, com primitivos que só o site declara (como `--pv-red-400`). É CSS do app, não do pacote, e não é publicado no npm.

**Decisão.** O pacote `@semec/ds` tem **um tema só, claro**. Os tokens L1 (`--bg`, `--fg`, `--surface`, `--feedback-*`…) têm um valor cada e não trocam por atributo. Os componentes são validados (contraste, foco, axe) nesse tema.

O tema escuro do site de documentação continua existindo e continua sendo do site: ele pode declarar primitivos e L1 próprios, sem que isso vire promessa do pacote. Quem consome o pacote e quer tema escuro faz no próprio app, sobrescrevendo os L1 sob um seletor seu, e responde pelo contraste do que sobrescrever.

O mecanismo multi-órgão do ADR-012 (`data-theme="semec"` e variações por órgão) **não foi implementado** e não fica decidido aqui. Se a [QA-02](../questoes-abertas.md) (SEMEC ou PMPV) ou a [QA-08](../questoes-abertas.md) (Calculadora de Taxas) pedirem mais de um tema, isso entra como ADR novo, com a troca restrita ao L1, como o ADR-003 já prevê.

**Alternativas descartadas.**

- *Restaurar o tema escuro no pacote*: dobra a matriz de validação (contraste e axe em dois esquemas para cada componente) sem nenhum consumidor que tenha pedido; os sistemas da SEMEC hoje são todos claros.
- *Manter o ADR-012 como "Aceito (alvo)"*: o índice continuaria descrevendo como decisão em vigor algo que foi removido, que é exatamente o problema apontado no AUD-47.
- *Mover o tema escuro do site para o pacote*: os valores do site foram escolhidos para a leitura da documentação, não validados para os componentes do kit.

**Consequências.**

- O ADR-012 passa a `Substituído por ADR-025`. O item "Tema claro e tema escuro" da definição de pronto (CONTRIBUTING, Parte 2) passa a "tema claro".
- O [ADR-024](0024-vermelho-de-perigo-pv-red-700.md) ganha errata: `--pv-red-400` existe só no CSS do site, para o tema escuro do site; no pacote, o perigo é `--pv-red-700` e não há troca por tema.
- A remoção de 2.0.0 continua registrada como falha de processo (AUD-43). Uma eventual volta do tema escuro ao pacote seria aditiva (minor); uma nova remoção seguiria o [ADR-013](0013-politica-de-depreciacao-duas-minors.md).
- Documentação que diga "tema por `data-theme`" sobre o pacote está desatualizada e deve apontar para este ADR.
