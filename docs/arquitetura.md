# Design System SEMEC — Documento de Arquitetura

Versão 0.1 (rascunho para discussão) — 20/08/2026
Autor: Departamento de Tecnologia / SEMEC — Porto Velho
Projeto Cowork: **Design System**

---

## 1. Contexto

Os frontends da SEMEC nasceram isolados. Cada projeto (Gestão de Demandas Cartão Cidade, painéis fiscais, organograma, SIGO) definiu sua própria paleta, sua própria tipografia, seus próprios botões, tabelas e formulários. O custo disso aparece em quatro lugares:

- **Retrabalho** — todo projeto novo reconstrói os mesmos vinte componentes.
- **Inconsistência** — o cidadão e o servidor veem produtos que não parecem da mesma instituição.
- **Acessibilidade** — cada projeto resolve (ou não resolve) contraste, foco e navegação por teclado do seu jeito.
- **Manutenção** — uma correção de segurança ou de usabilidade em um componente não chega aos outros sistemas.

O Governo Federal resolveu esse problema com o **Padrão Digital de Governo (gov.br DS)**, mantido pelo SERPRO: um site de documentação organizado em fundamentos visuais, componentes, padrões e templates, um UIKit em Figma e bibliotecas publicadas em npm (`@govbr-ds/core` e derivados). É esse *modelo de organização* que queremos reproduzir na escala da secretaria.

## 2. Decisão de partida

**Construir um Design System próprio da SEMEC, inspirado na estrutura do gov.br DS, e não um fork ou uma camada sobre `@govbr-ds/core`.**

Motivo: o `@govbr-ds/core` é uma biblioteca CSS/JS acoplada à identidade visual e ao ciclo de release do Governo Federal, pensada para páginas institucionais gov.br. Nossos alvos são majoritariamente **sistemas internos densos** (contratos, demandas, painéis fiscais), onde precisamos de tabelas com muitas colunas, filtros, formulários longos e gráficos — território que o gov.br DS cobre pouco. O que herdamos dele é a **arquitetura da informação, o rigor de acessibilidade e o processo de governança**, não o CSS.

Consequência assumida: perdemos a conformidade "de graça" com o padrão federal. Mitigação: adotamos WCAG 2.1 nível AA como critério de aceite bloqueante e mantemos a nomenclatura semântica compatível com o gov.br, de modo que uma futura convergência seja um trabalho de tema, não de reescrita.

## 3. Objetivos e não-objetivos

**Objetivos**

1. Um único vocabulário visual e de interação para todo frontend produzido pela SEMEC.
2. Componentes acessíveis por construção — teclado, leitor de tela, contraste — sem que cada time precise saber ARIA.
3. Consumo por quatro alvos: **Next.js** (SIGO), **React + Vite** (Cartão Cidade e similares), **HTML/CSS puro** (páginas estáticas, organogramas, artefatos avulsos) e **painéis de dados** (Equilíbrio Fiscal, SICONFORMI).
4. Distribuição versionada via **registry npm do Gitea institucional**, com atualização controlada por SemVer.
5. Documentação viva: quem for implementar não deve precisar perguntar nada a ninguém.

**Não-objetivos (nesta fase)**

- Não vamos suportar Vue, Angular ou Web Components. Se surgir a necessidade, a camada de tokens já resolve 70% do problema.
- Não vamos criar um framework de aplicação (roteamento, estado, auth). O DS entrega interface, não arquitetura de app.
- Não vamos absorver regras de negócio. Nenhum componente do DS conhece "contrato", "empenho" ou "secretaria".

## 4. Princípios

1. **Token é a fonte da verdade.** Nenhum valor bruto (`#1351B4`, `16px`) escrito em componente. Sempre uma variável semântica.
2. **Acessibilidade não é feature, é critério de aceite.** Componente que falha em axe ou em navegação por teclado não entra na release.
3. **O DS é conservador.** É melhor ter 25 componentes sólidos que 80 medianos. Componente só entra se aparecer em pelo menos dois projetos reais.
4. **Semântica antes de aparência.** A API expõe intenção (`variant="destructive"`), não estilo (`color="vermelho"`).
5. **Escapatória sempre disponível.** Todo componente aceita `className` e repassa props ao elemento raiz. DS que engessa é DS abandonado.
6. **Português como língua do produto.** Rótulos, mensagens, documentação e nomes de padrões em pt-BR; código e API em inglês.

## 5. Arquitetura em camadas

Cinco camadas, cada uma dependendo apenas da anterior. Essa é a espinha dorsal do sistema e espelha a organização do gov.br DS (fundamentos → componentes → padrões → templates).

```
L4  Templates      Shell administrativo, página pública, página de erro, login
      ▲
L3  Padrões        Formulário de cadastro, tabela com filtros, listagem+detalhe,
                   fluxo em etapas, painel de indicadores
      ▲
L2  Componentes    Button, Input, Select, Table, Modal, Toast, Tabs, Card,
                   Breadcrumb, Pagination, Badge, Alert, DatePicker, FileUpload…
      ▲
L1  Primitivos     Reset, escala tipográfica, grid, elevação, foco visível,
                   utilitários de layout (Stack, Grid, Box)
      ▲
L0  Tokens         Cor, tipografia, espaçamento, raio, sombra, borda, duração,
                   z-index, breakpoint
```

Transversal a todas: **acessibilidade**, **temas** (claro/escuro e variação por órgão) e **dataviz**.

### 5.1 L0 — Tokens

Três níveis, hierarquia obrigatória:

| Nível | Exemplo | Quem usa |
|---|---|---|
| **Primitivo** | `blue-60: #1351B4` | ninguém, exceto o nível semântico |
| **Semântico** | `color-action-primary → blue-60` | componentes e aplicações |
| **De componente** | `button-primary-bg → color-action-primary` | apenas o componente correspondente |

Formato de autoria: **JSON no padrão DTCG** (W3C Design Tokens). Compilação por **Style Dictionary** para quatro saídas:

- `tokens.css` — custom properties (`--semec-color-action-primary`)
- `tokens.ts` — objeto tipado, para dataviz e lógica
- `tokens.json` — consumo por ferramentas de design (Figma Tokens)
- `tokens.scss` — apenas se algum projeto legado exigir

Trocar de tema = trocar o mapeamento primitivo→semântico. Nenhum componente muda.

### 5.2 L1 — Primitivos

Camada CSS pura: reset, `:focus-visible` padronizado, escala tipográfica modular, sistema de grid de 12 colunas, breakpoints. Mais três utilitários de layout em React (`Stack`, `Inline`, `Grid`) que eliminam 90% do CSS ad-hoc nas aplicações.

### 5.3 L2 — Componentes

Comportamento e acessibilidade delegados a **Radix UI** (primitivos headless, sem estilo, com ARIA e gerenciamento de foco já resolvidos). Estilo aplicado por cima com **Tailwind CSS v4** lendo as custom properties dos tokens, e variantes declaradas com **CVA (class-variance-authority)**.

Ou seja: não escrevemos comportamento de dropdown, dialog, tooltip ou combobox — isso é onde 100% dos DS internos falham em acessibilidade.

**Inventário inicial proposto (MVP, 24 componentes):**

*Ação:* Button, IconButton, Link
*Formulário:* Input, Textarea, Select, Combobox, Checkbox, Radio, Switch, DatePicker, FileUpload, FormField (label+erro+ajuda)
*Navegação:* Breadcrumb, Tabs, Pagination, Menu lateral, Header institucional
*Exibição:* Table, Card, Badge, Empty state, Skeleton
*Feedback:* Alert, Modal, Toast, Tooltip

### 5.4 L3 — Padrões

Aqui mora o valor real para sistemas internos. Um padrão é a composição resolvida de um problema recorrente:

- **Tabela de dados** — colunas configuráveis, ordenação, filtro, paginação servidor, seleção, exportação, estado vazio, estado de carregamento.
- **Formulário de cadastro** — layout, agrupamento em seções, validação, mensagens de erro, rascunho, confirmação de saída.
- **Listagem + detalhe** — a estrutura de 80% das telas do SIGO.
- **Fluxo em etapas** — cadastros longos divididos.
- **Painel de indicadores** — grade de cartões de KPI + gráficos.

### 5.5 L4 — Templates

Shell administrativo (header institucional + menu + breadcrumb + área de conteúdo + rodapé), página pública, tela de login/identificação por e-mail institucional, páginas 403/404/500.

## 6. Topologia de pacotes

Monorepo único, múltiplos pacotes publicados sob o escopo `@semec`.

```
ds-semec/
├── packages/
│   ├── tokens/        @semec/ds-tokens     JSON DTCG → CSS/TS/JSON
│   ├── css/           @semec/ds-css        CSS compilado, zero JS  ← alvo HTML puro
│   ├── icons/         @semec/ds-icons      SVG → componentes React + sprite
│   ├── react/         @semec/ds-react      componentes L2 + L3
│   ├── charts/        @semec/ds-charts     camada dataviz          ← alvo painéis
│   └── config/        @semec/ds-config     eslint, tsconfig, tailwind preset
├── apps/
│   ├── docs/          site de documentação (Storybook + páginas MDX)
│   └── playground/    sandbox de validação
└── .gitea/workflows/  build, teste, publicação
```

Por que separar `css` de `react`: o alvo "HTML/CSS puro" não pode carregar React. O pacote `@semec/ds-css` entrega classes prontas (`.semec-btn`, `.semec-btn--primary`) e um bundle via CDN interna, para páginas estáticas e artefatos avulsos. O mesmo token, duas entregas.

### 6.1 Como cada alvo consome

| Alvo | Pacotes | Observações |
|---|---|---|
| **Next.js (SIGO)** | `ds-react`, `ds-tokens`, `ds-icons`, `ds-charts` | Componentes interativos marcados com `"use client"`; os de apresentação permanecem Server Components. Exportações por subpath para não quebrar tree-shaking. |
| **React + Vite** | idem | Sem restrição de RSC. |
| **HTML/CSS puro** | `ds-css`, `ds-icons` (sprite) | Um `<link>` e um `<script>` opcional para comportamentos simples (menu, modal). |
| **Painéis de dados** | `ds-charts` + `ds-react` | Paleta categórica e sequencial derivada dos tokens, validada para daltonismo e contraste. |

## 7. Stack técnica

| Camada | Escolha | Por quê |
|---|---|---|
| Linguagem | TypeScript (strict) | Contrato de API explícito para quem consome |
| Runtime UI | React 19 | Alinha com Next.js do SIGO e Vite do Cartão Cidade |
| Comportamento | Radix UI | Acessibilidade e foco resolvidos por especialistas |
| Estilo | Tailwind CSS v4 + CVA | Tailwind v4 é CSS-first e lê custom properties nativamente |
| Tokens | Style Dictionary + DTCG | Padrão de mercado, multi-saída |
| Build | tsup (libs) / Vite (docs) | Rápido, ESM+CJS, `.d.ts` |
| Documentação | Storybook | Documentação viva, testes de interação, addon de acessibilidade |
| Testes | Vitest + Testing Library + axe-core | Unidade, integração e acessibilidade automatizada |
| Regressão visual | Playwright screenshots | Detecta quebra de estilo entre versões |
| Versionamento | Changesets | Changelog e bump de versão automatizados |
| Gerenciador | pnpm workspaces | Monorepo eficiente |
| CI/CD | Gitea Actions | Já em uso na prefeitura |

## 8. Distribuição e versionamento

- **Registry:** container/package registry do Gitea institucional (`git.portovelho.ro.gov.br`), escopo `@semec`.
- **Autenticação:** `.npmrc` por projeto mapeando o escopo para o registry (`npm config set @semec:registry=https://git.portovelho.ro.gov.br/api/packages/{owner}/npm/` mais `_authToken`), com token de leitura para desenvolvedores e token de publicação restrito ao CI. O registry npm do Gitea suporta pacotes com escopo e dist-tags; não permite republicar a mesma versão — o que reforça o SemVer estrito.
- **SemVer estrito:** *major* = quebra de API ou mudança visual disruptiva; *minor* = componente novo ou prop nova; *patch* = correção.
- **Canais:** `latest` (estável) e `next` (pré-release, para validar no SIGO antes de liberar).
- **Depreciação:** prop ou componente marcado como deprecated permanece funcionando por **duas versões minor** com aviso em console e no changelog, antes de ser removido em major.
- **Pipeline:** PR → lint + typecheck + testes + axe + build → merge na `main` → Changeset gera versão → publica no registry → publica o site de documentação.

## 9. Acessibilidade

Critério de aceite bloqueante, não recomendação.

- **WCAG 2.1 nível AA** como alvo, com atenção ao eMAG (padrão de acessibilidade do governo brasileiro) na nomenclatura e nos comportamentos esperados.
- Contraste mínimo 4.5:1 para texto e 3:1 para elementos de interface — validado automaticamente no build dos tokens.
- Navegação completa por teclado, com `:focus-visible` sempre perceptível.
- `axe-core` rodando em CI sobre todas as stories do Storybook; violação = build vermelho.
- Todo componente documenta seu comportamento de teclado e seus requisitos de rótulo.

## 10. Identidade visual

Uma paleta neutra. A arquitetura suporta os três casos — o tema é uma troca de mapeamento — mas a escolha define o primeiro conjunto de tokens primitivos. **Questão em aberto (Q1).**

Suporte previsto desde o início a **tema claro e escuro** e a **multi-tema por órgão** (`data-theme="semec"`), o que permite reaproveitar o DS em outras secretarias sem fork.

## 11. Governança

**Papéis**

- *Mantenedores do DS* (equipe do Departamento de Tecnologia): revisam e publicam.
- *Contribuidores* (times de produto): propõem e implementam.
- *Aprovação de design*: quem detém a identidade visual institucional.

**Fluxo de entrada de componente**

1. Time abre uma **proposta** (issue com template): problema, onde já apareceu, protótipo, alternativas.
2. Mantenedores avaliam a **regra dos dois projetos** — o componente precisa ter uso real em pelo menos dois lugares.
3. Aprovado, vira issue de implementação com critérios de aceite.
4. PR precisa de: componente + tipos + stories + testes + teste de acessibilidade + documentação de uso e de quando **não** usar.
5. Revisão de código e de acessibilidade. Merge. Changeset. Release.

**Definition of Done de um componente**

- [ ] API tipada e documentada
- [ ] Estados cobertos: padrão, hover, foco, ativo, desabilitado, erro, carregando, vazio
- [ ] Responsivo nos breakpoints definidos
- [ ] Tema claro e escuro
- [ ] Navegação por teclado documentada e testada
- [ ] `axe` sem violações
- [ ] Story no Storybook com exemplos de uso e de mau uso
- [ ] Teste de regressão visual

## 12. Roadmap

| Fase | Escopo | Resultado |
|---|---|---|
| **F0 — Fundação** | Monorepo, tooling, CI, publicação no Gitea, tokens primitivos e semânticos, Storybook no ar | `@semec/ds-tokens` 0.1.0 publicado e consumido por um projeto real |
| **F1 — MVP** | 24 componentes L2 + shell administrativo | SIGO como projeto piloto, construído inteiramente sobre o DS |
| **F2 — Padrões** | Tabela de dados, formulário de cadastro, listagem+detalhe | Redução mensurável de código nos apps |
| **F3 — Dataviz** | `@semec/ds-charts`, paletas validadas | Painel fiscal migrado |
| **F4 — Expansão** | `@semec/ds-css` para HTML puro, multi-tema por órgão | Adoção fora da SEMEC |

Cada fase termina com uma release versionada e um projeto real consumindo. Nenhuma fase termina em "biblioteca pronta esperando usuário".

## 13. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| DS vira projeto de uma pessoa e morre | Alto | Piloto obrigatório (SIGO) desde a F1; DS que já está em produção não é abandonado |
| Times contornam o DS por pressa | Alto | Escapatória oficial (`className`, `asChild`) + coleta dos contornos como backlog |
| Registry do Gitea instável ou sem suporte a npm | Médio | Validar na F0; alternativa: publicar via tarball em release do Gitea ou usar Verdaccio no Portainer |
| Sobrecarga de manutenção | Médio | Regra dos dois projetos; poucos componentes, bem feitos |
| Identidade visual não definida | Médio | Arquitetura de tema desacopla; começar com paleta neutra e trocar depois sem reescrever |

## 14. Questões em aberto

As questões em aberto deste documento (Q1–Q6) foram movidas para [questoes-abertas.md](questoes-abertas.md), onde são mantidas junto com as demais questões pendentes do projeto.

---

*Documento vivo. Mudanças estruturais entram como novo ADR, não como edição silenciosa.*
