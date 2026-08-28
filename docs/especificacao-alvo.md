> **Este documento descreve o estado-alvo, não o estado atual.** A paleta, os tokens semânticos e o catálogo de componentes aqui especificados ainda não existem em código. O que este repositório publica hoje é a linguagem visual extraída do portal `semec-digital`, baseada na paleta `pv-*` — que é diferente da paleta especificada aqui. Enquanto a questão Q1 (ver `questoes-abertas.md`) não for decidida, este documento é proposta, e as páginas do site são a referência vigente.

# Design System SEMEC

Padrão digital da Secretaria Municipal de Economia de Porto Velho
Versão 0.1 — 20/08/2026 · Documento vivo

> Estrutura desta documentação espelha a do Padrão Digital de Governo (gov.br/ds): fundamentos visuais → componentes → padrões → templates → guias → comunidade. O conteúdo é inteiramente da SEMEC.

---

# Sobre

## O que é

O Design System SEMEC é o conjunto de decisões visuais, componentes de interface e diretrizes que padroniza todo produto digital feito pela secretaria. Ele existe para que qualquer sistema novo — do SIGO a um painel de indicadores — nasça com a mesma cara, o mesmo comportamento e o mesmo nível de acessibilidade, sem que cada equipe precise redecidir o que já foi decidido.

Não é um framework, não é um tema e não é uma pasta de componentes copiada entre projetos. É uma biblioteca versionada, publicada e mantida.

## Para quem

**Pessoas desenvolvedoras** que constroem interfaces na SEMEC ou para a SEMEC — internas, de outras secretarias ou contratadas.
**Pessoas de design** que desenham telas e precisam saber o que já existe antes de criar algo novo.
**Gestores** que precisam garantir que um sistema entregue por terceiro seja reconhecível como um sistema da secretaria.

## Princípios

**1. O token é a fonte da verdade.**
Nenhum valor bruto escrito em componente. Sempre uma variável semântica. Se você precisou escrever `#1e3a5f`, o design system falhou — abra uma issue.

**2. Acessibilidade é critério de aceite, não recomendação.**
Componente que falha em contraste ou em navegação por teclado não entra na versão. Serviço público não tem usuário opcional.

**3. Conservador por escolha.**
Vinte e cinco componentes sólidos valem mais que oitenta medianos. Um componente só entra no sistema depois de aparecer em pelo menos dois produtos reais.

**4. Semântica antes de aparência.**
A interface expressa intenção (`variant="destructive"`), não decoração (`color="vermelho"`). Assim o tema muda sem que o código mude.

**5. Escapatória sempre disponível.**
Todo componente aceita `className` e repassa propriedades ao elemento raiz. Um sistema que engessa é um sistema abandonado.

**6. Português na interface, inglês no código.**
Rótulos, mensagens e documentação em pt-BR. Nomes de componentes e propriedades em inglês.

---

# Primeiros passos

## Instalação

```bash
npm config set @semec:registry=https://git.portovelho.ro.gov.br/api/packages/semec/npm/
npm install @semec/ds-react @semec/ds-tokens
```

## Uso conforme o projeto

**Next.js e React + Vite**

```tsx
import '@semec/ds-tokens/css'
import { Button } from '@semec/ds-react/button'
```

**HTML e CSS puro** — sem build, sem React:

```html
<link rel="stylesheet" href="https://.../@semec/ds-css/dist/semec.css">
<button class="semec-btn semec-btn--primary">Enviar</button>
```

**Painéis de dados**

```tsx
import { paletaCategorica } from '@semec/ds-charts'
```

## Pacotes

| Pacote | Conteúdo |
|---|---|
| `@semec/ds-tokens` | Tokens em CSS, TypeScript e JSON |
| `@semec/ds-css` | CSS compilado, sem JavaScript |
| `@semec/ds-icons` | Ícones em React e sprite SVG |
| `@semec/ds-react` | Componentes e padrões |
| `@semec/ds-charts` | Camada de visualização de dados |
| `@semec/ds-config` | Preset do Tailwind, ESLint e TypeScript |

---

# Fundamentos visuais

## Visão geral

Os fundamentos são as decisões que antecedem qualquer componente: que cores existem, que fontes usamos, como o espaço é dividido, que forma os elementos têm. Tudo neste sistema é construído sobre eles.

Cada fundamento existe como token em três níveis — primitivo, semântico e de componente. Componentes consomem apenas os dois últimos.

---

## Cor

### A marca

A identidade cromática da SEMEC vem da sua marca. Três cores:

| | Hex | Papel |
|---|---|---|
| **Azul** | `#1f4493` | Cor institucional dominante |
| **Verde** | `#6bbd55` | Cor de apoio |
| **Amarelo** | `#fbdb04` | Cor de destaque |

### Escala primária — Azul

Derivada do azul da marca (`H 221° · S 65%`). O degrau **600 é a cor da marca**.

| Token | Hex | Contraste sobre branco |
|---|---|---|
| `blue-950` | `#09132a` | 18,40:1 |
| `blue-900` | `#0f2148` | 15,77:1 |
| `blue-800` | `#152f65` | 12,93:1 |
| `blue-700` | `#1a397a` | 11,05:1 |
| **`blue-600`** | **`#1f4493`** | **9,08:1** |
| `blue-500` | `#2756b9` | 6,75:1 |
| `blue-400` | `#4171d7` | 4,59:1 |
| `blue-300` | `#7999dd` | 2,84:1 |
| `blue-200` | `#b1c2e7` | 1,79:1 |
| `blue-100` | `#d9e1f2` | 1,31:1 |
| `blue-50` | `#f0f3f9` | 1,11:1 |

Do 600 ao 950: texto sobre fundo claro, superfícies escuras, botões primários.
Do 400 ao 500: apenas elementos gráficos e bordas.
Do 50 ao 300: fundos e superfícies.

### Escala de apoio — Verde

| Token | Hex | Contraste sobre branco |
|---|---|---|
| `green-900` | `#203e18` | 11,91:1 |
| `green-800` | `#2e5822` | 8,27:1 |
| `green-700` | `#376b29` | 6,40:1 |
| `green-600` | `#438132` | 4,77:1 |
| `green-500` | `#54a23f` | 3,19:1 |
| `green-400` | `#6fbf5a` | 2,27:1 |
| `green-300` | `#97cd88` | 1,84:1 |
| `green-200` | `#c1dfb9` | 1,45:1 |
| `green-100` | `#e0eedd` | 1,20:1 |
| `green-50` | `#f3f8f1` | 1,08:1 |

**Regra de uso:** verde para texto, apenas `green-600` ou mais escuro. O verde da marca (`green-400`, 2,27:1) é cor de elemento gráfico, nunca de texto.

### Escala de destaque — Amarelo

| Token | Hex | Contraste sobre branco |
|---|---|---|
| `yellow-900` | `#554a01` | 8,82:1 |
| `yellow-800` | `#786902` | 5,48:1 |
| `yellow-700` | `#927f02` | 4,00:1 |
| `yellow-600` | `#b09903` | 2,83:1 |
| `yellow-500` | `#ddc104` | 1,80:1 |
| `yellow-400` | `#fbdf1d` | 1,34:1 |

**Regra de uso:** amarelo é cor de **fundo**, com texto escuro por cima. Amarelo como cor de texto sobre branco não passa em nenhum degrau abaixo do 800.

### Neutros

| Token | Hex |
|---|---|
| `gray-900` | `#14233a` |
| `gray-700` | `#374151` |
| `gray-500` | `#6b7280` |
| `gray-300` | `#d1d5db` |
| `gray-200` | `#e5e7eb` |
| `gray-100` | `#f5f5f5` |
| `gray-50` | `#f4f6f9` |

### Tokens semânticos

Esta é a camada que você usa no dia a dia. Nunca chame um primitivo diretamente.

| Token semântico | Aponta para | Uso |
|---|---|---|
| `color-brand-primary` | `blue-600` | Marca |
| `color-brand-secondary` | `green-600` | Apoio |
| `color-brand-accent` | `yellow-500` | Destaque |
| `color-action-primary` | `blue-600` | Botão primário, link |
| `color-action-primary-hover` | `blue-700` | Estado de hover |
| `color-action-primary-active` | `blue-800` | Estado pressionado |
| `color-surface-base` | `gray-50` | Fundo da página |
| `color-surface-raised` | `#ffffff` | Cartão, modal |
| `color-surface-sunken` | `gray-100` | Área recuada |
| `color-text-primary` | `gray-900` | Texto principal |
| `color-text-secondary` | `gray-700` | Texto de apoio |
| `color-text-muted` | `gray-500` | Texto auxiliar (≥16px) |
| `color-text-on-brand` | `#ffffff` | Texto sobre a marca |
| `color-border-default` | `gray-200` | Bordas |
| `color-border-strong` | `gray-300` | Bordas de campo |
| `color-focus-ring` | `blue-400` | Indicador de foco |
| `color-feedback-success` | `green-700` | Sucesso |
| `color-feedback-warning` | `yellow-800` | Alerta |
| `color-feedback-danger` | `red-600` | Erro |
| `color-feedback-info` | `blue-600` | Informação |

> **Inconsistência conhecida:** `color-border-strong` → `gray-300`. O valor `#d1d5db` tem contraste de **1,47:1** sobre branco. O próprio documento estabelece 3:1 como mínimo para borda de campo (critério WCAG 1.4.11). O token não atende ao papel que lhe foi atribuído.

> **Inconsistência conhecida:** `color-text-muted` → `gray-500`. O valor `#6b7280` tem **4,47:1** sobre `gray-50`, e a ressalva "(≥16px)" não resolve — o limiar de texto grande no WCAG é **18,66px em peso normal ou 14pt em negrito**, não 16px. O token precisa subir um degrau ou mudar de papel.

### Regras de contraste

| Situação | Mínimo exigido |
|---|---|
| Texto até 18px | 4,5:1 |
| Texto ≥18px ou ≥14px em negrito | 3:1 |
| Ícone, borda de campo, indicador de foco | 3:1 |

O contraste de cada token é verificado automaticamente na compilação. Um token que não atende ao seu papel declarado quebra a build.

---

## Tipografia

### Famílias

Duas, e apenas duas.

| Papel | Família | Pesos |
|---|---|---|
| **Texto** | Poppins | 400, 500, 600, 700 |
| **Display** | Poppins | 600, 700 |

Fontes decorativas (como a `Press Start 2P` usada hoje em um serviço) são exceção declarada, restrita ao contexto onde nascem, e não fazem parte do sistema.

### Escala

| Token | Tamanho | Entrelinha | Uso |
|---|---|---|---|
| `text-display` | 40px | 1,1 | Título de página inicial |
| `text-3xl` | 32px | 1,2 | Título de página |
| `text-2xl` | 24px | 1,25 | Título de seção |
| `text-xl` | 20px | 1,3 | Subtítulo |
| `text-lg` | 18px | 1,4 | Destaque de corpo |
| `text-base` | 16px | 1,5 | Corpo — **padrão** |
| `text-sm` | 14px | 1,5 | Texto de apoio, tabela densa |
| `text-xs` | 12px | 1,4 | Rótulo, legenda, chip |

Oito degraus. Abaixo de 12px, nada.

### Pesos e hierarquia

| Peso | Token | Uso |
|---|---|---|
| 400 | `font-regular` | Corpo de texto — **o padrão** |
| 500 | `font-medium` | Rótulo, ênfase leve |
| 600 | `font-semibold` | Título, botão |
| 700 | `font-bold` | Título de página, ênfase forte |

Não existem 800 e 900 no sistema. O navegador sintetiza esses pesos quando a fonte não os tem, e o resultado é um texto borrado.

**Diretriz:** o peso padrão de texto corrido é 400. Se quase tudo na tela está em negrito, nada está.

---

## Grid e layout

| Token | Valor |
|---|---|
| `container-max` | 1200px (`--container-max`) |
| `container-docs` | 48rem (768px) (`--container-docs`) — coluna do guia de documentação |
| `measure` | 72ch (`--measure`) — largura de leitura do texto corrido |
| Colunas | 12 |
| Calha | 24px |
| Margem lateral (móvel) | 16px |
| Margem lateral (≥640px) | 24px |

### Pontos de quebra

| Token | Largura | Alvo |
|---|---|---|
| `sm` | 640px | Celular grande / tablet retrato |
| `md` | 768px | Tablet |
| `lg` | 1024px | Notebook |
| `xl` | 1280px | Monitor |

**A SEMEC desenha primeiro para o celular.** O uso real dos serviços é majoritariamente móvel.

---

## Espaçamento

Escala de 8px com meio-degrau, limitada a nove valores:

| Token | Valor |
|---|---|
| `space-0` | 0 |
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-12` | 48px |
| `space-16` | 64px |

Aplicação: `space-2` dentro de componente, `space-4` entre elementos relacionados, `space-6` entre grupos, `space-12` entre seções.

---

## Iconografia

Biblioteca: **Lucide**, distribuída em `@semec/ds-icons`.

| Propriedade | Valor |
|---|---|
| Traço | 2px |
| Tamanhos | 16px (`sm`), 20px (`md`, padrão), 24px (`lg`) |
| Cor | Herdada do texto (`currentColor`) |
| Alinhamento | Óptico com a linha de base |

**Regras**

- Ícone sozinho, sem rótulo, exige `aria-label`.
- Ícone decorativo ao lado de texto recebe `aria-hidden="true"`.
- Ícone nunca substitui rótulo em formulário.
- Um conceito, um ícone: `FileText` é sempre documento, em todo o sistema.

**Vocabulário do domínio tributário**, já consolidado no portal:

| Conceito | Ícone |
|---|---|
| IPTU / imóvel | `Home` |
| ITBI / transmissão | `KeyRound` |
| ISS / autônomo | `Briefcase` |
| Taxas | `ReceiptText` |
| Empresa | `Building2` |
| Documento | `FileText` |
| Cálculo | `Calculator` |
| Benefício fiscal | `BadgePercent` |
| Risco / conformidade | `ShieldCheck` |
| Valor / retenção | `Coins` |

---

## Elevação

Três níveis. Não cinco.

| Token | Sombra | Uso |
|---|---|---|
| `elevation-0` | nenhuma | Elemento no plano da página |
| `elevation-1` | `0 1px 2px rgba(20,35,58,.08)` | Cartão, campo |
| `elevation-2` | `0 4px 12px rgba(20,35,58,.10)` | Menu, popover, cartão em hover |
| `elevation-3` | `0 12px 32px rgba(20,35,58,.14)` | Modal, painel lateral |

A sombra sempre usa o azul-escuro neutro do sistema, nunca preto puro, e nunca cor.

---

## Forma

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 4px | Chip, tag, campo pequeno |
| `radius-md` | 8px | Botão, campo, cartão — **padrão** |
| `radius-lg` | 16px | Cartão grande, modal |
| `radius-full` | 9999px | Selo, avatar, botão circular |

Quatro valores. Qualquer outro é desvio.

---

## Movimento

| Token | Valor |
|---|---|
| `duration-fast` | 150ms |
| `duration-base` | 250ms |
| `duration-slow` | 400ms |
| `easing-standard` | `cubic-bezier(0.16, 1, 0.3, 1)` |

A curva é a que o portal já usa em todas as suas animações — foi promovida a padrão do sistema.

**Regra obrigatória:** toda animação respeita `prefers-reduced-motion`. Quando a pessoa pediu menos movimento, a transição vira mudança imediata.

---

## Marca e ilustração

| Asset | Uso |
|---|---|
| `logo-semec` | Marca da secretaria — cabeçalho, documentos |
| `logo-semec-emblema` | Emblema isolado — favicon, avatar |
| `marca-prefeitura` (horizontal, vertical positiva, vertical negativa) | Assinatura institucional |
| `ilustracao-cidade` | Elemento gráfico de Porto Velho |

Todos distribuídos como componentes em `@semec/ds-react`, com uma única implementação. Área de proteção mínima: metade da altura do símbolo em todos os lados. A marca nunca é redesenhada, recolorida ou distorcida dentro de um projeto.

---

# Componentes

## Como ler esta seção

Cada componente é documentado em seis blocos:

**Visão geral** — o que resolve e quando usar.
**Anatomia** — as partes que o compõem.
**Variações** — as formas que assume.
**Estados** — padrão, hover, foco, ativo, desabilitado, erro, carregando.
**Acessibilidade** — comportamento de teclado, papéis ARIA, requisitos de rótulo.
**Quando não usar** — os casos em que outro componente é a resposta certa.

## Catálogo

### Ação

| Componente | Descrição |
|---|---|
| `Button` | Ação primária, secundária, terciária e destrutiva |
| `IconButton` | Ação representada só por ícone; exige rótulo acessível |
| `Link` | Navegação; nunca usado para executar ação |

### Formulário

| Componente | Descrição |
|---|---|
| `FormField` | Invólucro: rótulo, ajuda, erro e obrigatoriedade |
| `Input` | Texto, com máscaras de CPF, CNPJ, CEP, moeda e data |
| `Textarea` | Texto longo |
| `Select` | Escolha única em lista curta |
| `Combobox` | Escolha única em lista longa, com busca |
| `Checkbox` | Escolha múltipla e confirmação |
| `Radio` | Escolha única entre poucas opções visíveis |
| `Switch` | Liga/desliga com efeito imediato |
| `DatePicker` | Data e período |
| `FileUpload` | Anexo, com tipo e tamanho declarados |

### Navegação

| Componente | Descrição |
|---|---|
| `Header` | Cabeçalho institucional |
| `TopBar` | Barra superior de governo |
| `Breadcrumb` | Caminho de navegação |
| `Tabs` | Alternância entre visões do mesmo objeto |
| `Pagination` | Navegação entre páginas de resultado |
| `SideMenu` | Menu lateral de sistema administrativo |
| `Footer` | Rodapé institucional |

### Exibição

| Componente | Descrição |
|---|---|
| `Card` | Agrupamento de conteúdo relacionado |
| `Table` | Dados tabulares |
| `Badge` | Rótulo de estado ou categoria |
| `EmptyState` | Ausência de dados, com próximo passo |
| `Skeleton` | Carregamento de estrutura conhecida |

### Feedback

| Componente | Descrição |
|---|---|
| `Alert` | Mensagem persistente no fluxo |
| `Toast` | Confirmação temporária de ação |
| `Modal` | Interrupção que exige decisão |
| `Tooltip` | Esclarecimento breve; nunca conteúdo essencial |

---

## Exemplo de especificação — Button

### Visão geral

Executa uma ação. Se o resultado é navegar para outro lugar, o componente correto é `Link`.

### Anatomia

Ícone opcional à esquerda · rótulo · ícone opcional à direita. O rótulo é obrigatório, exceto em `IconButton`.

### Variações

| Variação | Aparência | Quando usar |
|---|---|---|
| `primary` | Fundo `color-action-primary`, texto branco | A ação principal da tela. **Uma por tela.** |
| `secondary` | Borda `blue-600`, texto `blue-600`, fundo transparente | Ações de apoio |
| `ghost` | Só texto | Ação terciária, barra de ferramentas |
| `destructive` | Fundo `color-feedback-danger` | Exclusão e ações irreversíveis |

### Tamanhos

| Token | Altura | Texto | Alvo de toque |
|---|---|---|---|
| `sm` | 32px | `text-sm` | Interno a tabela |
| `md` | 44px | `text-base` | **Padrão** |
| `lg` | 52px | `text-lg` | Ação principal em página |

Altura mínima de 44px na variação padrão, atendendo ao alvo de toque recomendado.

### Estados

`default` · `hover` (`action-primary-hover`) · `focus-visible` (anel de 2px em `color-focus-ring`, deslocado 2px) · `active` (`action-primary-active`) · `disabled` (opacidade 50%, cursor bloqueado) · `loading` (indicador substitui o ícone, rótulo permanece, botão fica inerte).

### Acessibilidade

- É um `<button>` de verdade. `<div>` clicável não é botão.
- Ativado por Enter e Espaço.
- Estado de carregamento comunicado por `aria-busy="true"`.
- Estado desabilitado usa `aria-disabled` e permanece focalizável, para que o leitor de tela o anuncie.
- Botão só de ícone exige `aria-label`.

### Quando não usar

Para navegar — use `Link`. Para alternar um valor imediatamente — use `Switch`. Para escolher entre opções — use `Radio` ou `Select`.

---

# Padrões

Padrão é a composição resolvida de um problema recorrente. É onde o sistema economiza mais trabalho.

| Padrão | Resolve |
|---|---|
| **Tabela de dados** | Colunas configuráveis, ordenação, filtro, paginação no servidor, seleção, exportação, estado vazio, carregamento |
| **Formulário de cadastro** | Seções, validação, mensagens de erro, rascunho, confirmação de saída, resumo antes do envio |
| **Listagem e detalhe** | A estrutura da maioria das telas de sistema administrativo |
| **Fluxo em etapas** | Cadastros longos divididos, com progresso e retorno |
| **Painel de indicadores** | Grade de cartões de KPI, gráficos e recorte temporal |
| **Busca e filtro de catálogo** | Busca sem acento, filtro por categoria, agrupamento — já implementado no portal |
| **Consulta pública** | Entrada de identificador (CPF, CNPJ, inscrição), resultado e emissão de documento |

---

# Templates

| Template | Composição |
|---|---|
| **Portal público** | TopBar + Header + conteúdo + Footer + banner de cookies + Libras + botão de contato |
| **Sistema administrativo** | Header + menu lateral + breadcrumb + área de conteúdo |
| **Formulário de serviço** | Cabeçalho do serviço + formulário + ações + geração de documento |
| **Identificação** | Acesso por e-mail institucional |
| **Páginas de estado** | 403, 404, 500 e manutenção |

---

# Acessibilidade

## Compromisso

Todo componente do sistema atende ao **WCAG 2.1 nível AA**, com atenção às diretrizes do eMAG. Isso não é meta: é condição para publicar uma versão.

## Verificação automática

`axe-core` roda sobre todos os exemplos a cada integração. Violação reprova a build. O contraste de cada token é validado na compilação.

## Requisitos por componente

- Navegação completa por teclado, sem armadilha de foco.
- Indicador de foco sempre visível, com contraste de no mínimo 3:1.
- Alvo de toque mínimo de 44×44px.
- Todo campo tem rótulo associado — `placeholder` não é rótulo.
- Erro comunicado por texto, não só por cor.
- Movimento respeitando `prefers-reduced-motion`.

## Auditoria da paleta atual

Verificação dos tokens hoje em uso no portal, sobre o fundo padrão `#f4f6f9`:

| Token | Contraste | Situação |
|---|---|---|
| `pv-blue-900` `#1e3a5f` | 10,62:1 | Aprovado |
| `pv-blue-800` `#26476f` | 8,76:1 | Aprovado |
| `pv-blue-700` `#2f5a8a` | 6,57:1 | Aprovado |
| `pv-blue-600` `#3a6ca6` | 5,00:1 | Aprovado |
| `pv-blue-500` `#5a84b5` | 3,59:1 | Só texto grande |
| `pv-blue-400` `#7a9dc4` | 2,60:1 | **Reprovado para texto** |
| `pv-green-700` `#5a9636` | 3,32:1 | Só texto grande |
| `pv-green-600` `#70b643` | 2,29:1 | **Reprovado para texto** |
| `pv-green-500` `#86c95b` | 1,84:1 | **Reprovado, inclusive como foco** |
| `pv-yellow-600` `#d9ad2e` | 1,95:1 | Só como fundo |
| `pv-yellow-500` `#f2c94c` | 1,47:1 | Só como fundo |
| `pv-gray-500` `#6b7280` | 4,47:1 | Marginal — falha por 0,03 |

**Três correções necessárias no portal:**

1. `group-hover:text-pv-green-700` no cartão de serviço — texto verde a 3,32:1, abaixo do mínimo para o tamanho usado.
2. `focus-visible:ring-pv-green-500` — indicador de foco a 1,84:1, contra os 3:1 exigidos pelo critério 1.4.11. É a falha mais séria: afeta quem navega por teclado.
3. `pv-gray-500` como texto pequeno — falha por margem estreita; sobe para o degrau seguinte.

---

# Guias

## Para quem desenvolve

1. Instale os pacotes e o preset do Tailwind.
2. Procure o componente antes de criar um. Se não existir, procure o padrão.
3. Nunca escreva cor, tamanho, raio ou sombra em valor bruto.
4. Precisa de algo que não existe? Abra uma proposta — não copie para dentro do seu projeto.
5. Rode `axe` localmente antes de abrir o pull request.

## Para quem desenha

1. Trabalhe a partir dos fundamentos: as cores e os tamanhos disponíveis são os que estão aqui.
2. Verifique contraste ao escolher qualquer par de cores.
3. Desenhe todos os estados, não só o padrão — inclusive o vazio, o de carregamento e o de erro.
4. Desenhe primeiro para o celular.

## Para quem contribui

**1. Proposta.** Abra uma issue descrevendo o problema, onde ele já apareceu e as alternativas consideradas.
**2. Regra dos dois projetos.** O componente precisa ter uso real em pelo menos dois produtos.
**3. Implementação.** Aprovada a proposta, implemente com componente, tipos, exemplos, testes, verificação de acessibilidade e documentação de uso e de não-uso.
**4. Revisão.** Código e acessibilidade revisados por pessoa diferente de quem implementou.
**5. Publicação.** Changeset gera a versão e o registro de mudanças.

### Definição de pronto

- [ ] API tipada e documentada
- [ ] Estados: padrão, hover, foco, ativo, desabilitado, erro, carregando, vazio
- [ ] Responsivo nos quatro pontos de quebra
- [ ] Tema claro e escuro
- [ ] Teclado documentado e testado
- [ ] `axe` sem violações
- [ ] Exemplo de uso e de mau uso
- [ ] Teste de regressão visual

---

# Governança e versões

## Papéis

**Mantenedores** — Departamento de Tecnologia da SEMEC. Revisam, aprovam e publicam.
**Contribuidores** — equipes de produto, internas ou contratadas.
**Aprovação de identidade** — responsável pela marca institucional.

## Versionamento

Versionamento semântico estrito.

| Mudança | Incremento |
|---|---|
| Quebra de API ou mudança visual disruptiva | maior |
| Componente novo ou propriedade nova | menor |
| Correção | correção |

**Canais:** `latest` para produção, `next` para validação prévia.

**Depreciação:** propriedade ou componente marcado como obsoleto continua funcionando por duas versões menores, com aviso, antes de sair em uma versão maior. Toda versão maior traz guia de migração.

## Como acompanhar

Registro de mudanças publicado a cada versão. Mudanças estruturais entram como novo ADR no documento 02 — nunca como edição silenciosa desta documentação.

---

*Design System SEMEC · Departamento de Tecnologia · Secretaria Municipal de Economia de Porto Velho*
