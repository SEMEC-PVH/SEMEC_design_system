# @semec/ds-tokens

Design tokens do Design System SEMEC (Prefeitura de Porto Velho), sem React e sem Tailwind. Um pacote só, com as mesmas cores, espaçamentos, raios, tipografia, sombras e movimento para:

- **Web:** CSS custom properties (`tokens.css`), estilos globais (`base.css`) e a fonte Poppins auto-hospedada (`fonts.css`);
- **JavaScript/TypeScript:** JSON no formato W3C DTCG (`tokens.json`) e módulo JS com tipos (`tokens`);
- **Android:** `colors.xml` e `dimens.xml`;
- **iOS:** `SemecTokens.swift` (SwiftUI `Color`, UIKit `UIColor` e dimensões em pontos);
- **Figma:** `tokens-studio.json`, importável no plugin Tokens Studio.

O pacote não tem `dependencies` nem `peerDependencies`: instalar não traz React, Tailwind nem nada mais.

> A fonte de verdade é o `tokens.css` do repositório (`packages/react/tokens.css`). Todos os arquivos deste pacote são gerados a partir dele no build ([ADR-026](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/adr/0026-pacote-ds-tokens-saidas-por-plataforma.md)). Não edite os arquivos de `dist/`; mudanças de token entram pelo `tokens.css`.

## Instalação

```bash
npm install @semec/ds-tokens
# pnpm add @semec/ds-tokens
# yarn add @semec/ds-tokens
```

Node 22.12 ou mais recente para os exports JS (`import` e `require`).

## O que vem no pacote

| Export | Arquivo | Conteúdo |
| --- | --- | --- |
| `@semec/ds-tokens/tokens.css` | `dist/tokens.css` | Só as variáveis CSS em `:root` (L0 primitivos `--pv-*` e L1 semânticos). Sem `@theme`, `@utility`, `@property` nem reset. |
| `@semec/ds-tokens/base.css` | `dist/base.css` | Reset, cor e fonte do `body`, links, anel de foco (`:focus-visible`) e `prefers-reduced-motion`. |
| `@semec/ds-tokens/fonts.css` | `dist/fonts.css` + `dist/fonts/` | Poppins 400, 500, 600 e 700 (woff2, SIL OFL 1.1). |
| `@semec/ds-tokens/tokens.json` | `dist/tokens.json` | DTCG com as camadas `L0` e `L1`; as referências L1 → L0 ficam como `{L0.pv-gray-50}`. |
| `@semec/ds-tokens/tokens` | `dist/tokens.js` + `.d.ts` | `tokens` (nome → valor CSS resolvido) e `dsTokens` (categorias). |
| `@semec/ds-tokens/android/colors.xml` | `dist/android/colors.xml` | `<color name="semec_…">`. |
| `@semec/ds-tokens/android/dimens.xml` | `dist/android/dimens.xml` | `<dimen name="semec_…">` em `dp` (texto em `sp`). |
| `@semec/ds-tokens/ios/SemecTokens.swift` | `dist/ios/SemecTokens.swift` | `enum SemecTokens`. |
| `@semec/ds-tokens/figma/tokens-studio.json` | `dist/figma/tokens-studio.json` | Conjuntos `L0` e `L1` do Tokens Studio. |

Os tokens L0 (`--pv-blue-700`, `--pv-gray-900`…) são a paleta. Nos componentes e telas, use os L1 (`--action-primary`, `--fg`, `--surface`, `--space-4`, `--radius-md`…): são eles que carregam o significado e o contraste verificado (WCAG 2.1 AA).

## Web sem bundler (HTML ou CDN)

Copie os arquivos de `node_modules/@semec/ds-tokens/dist/` para a pasta estática do site (mantenha a pasta `fonts/` ao lado do `fonts.css`) ou use um CDN que sirva pacotes npm. A ordem é `fonts.css`, `tokens.css`, `base.css`, e depois o CSS do app:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@semec/ds-tokens@1.0.0/dist/fonts.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@semec/ds-tokens@1.0.0/dist/tokens.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@semec/ds-tokens@1.0.0/dist/base.css" />
    <link rel="stylesheet" href="/css/app.css" />
  </head>
  <body>…</body>
</html>
```

No CDN, fixe sempre a versão (`@1.0.0`, não `@latest`) e, se a política do órgão pedir, acrescente `integrity` (SRI) calculado dos arquivos publicados. No `<link>` use o caminho físico (`dist/…`); os nomes curtos dos exports só valem num bundler.

No CSS do app, use as variáveis:

```css
.aviso {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--feedback-info-surface);
  color: var(--fg);
}
```

O `base.css` é opcional: sem ele, você recebe só as variáveis e mantém o reset do seu projeto. Se não usar o `base.css`, garanta por conta própria o anel de foco visível (`outline` com `var(--focus-ring)`) e o `prefers-reduced-motion`.

## Com bundler (Vite, Next.js, webpack)

No CSS global:

```css
@import "@semec/ds-tokens/fonts.css";
@import "@semec/ds-tokens/tokens.css";
@import "@semec/ds-tokens/base.css";
```

Ou no ponto de entrada JS:

```js
import "@semec/ds-tokens/fonts.css";
import "@semec/ds-tokens/tokens.css";
import "@semec/ds-tokens/base.css";
```

O bundler resolve as URLs relativas do `fonts.css` e copia os woff2 para o build. O `package.json` declara `sideEffects: ["**/*.css"]`, então o tree-shaking não descarta esses imports.

Valores em JS ou TypeScript (gráficos, canvas, e-mails):

```ts
import { tokens, dsTokens } from "@semec/ds-tokens/tokens";

tokens["action-primary"]; // "#3a6ca6"
dsTokens.spacing;         // ["--space-0", "--space-1", …]
```

```js
// CommonJS (Node 22.12+ carrega o módulo ES por require)
const { tokens } = require("@semec/ds-tokens/tokens");
const dtcg = require("@semec/ds-tokens/tokens.json");
```

Com Tailwind v4 e componentes React, use o `@semec/ds` (ele traz o `@theme` e as utilities). Este pacote é para quem não usa Tailwind ou não usa a web.

## Android

1. Copie `node_modules/@semec/ds-tokens/dist/android/colors.xml` e `dimens.xml` para `app/src/main/res/values/` (ou baixe do CDN na versão fixa).
2. Use os recursos pelo nome, sempre com o prefixo `semec_` e em snake_case:

```xml
<TextView
  android:textColor="@color/semec_fg"
  android:textSize="@dimen/semec_text_base"
  android:padding="@dimen/semec_space_4"
  android:background="@color/semec_surface" />
```

```kotlin
val primaria = ContextCompat.getColor(context, R.color.semec_action_primary)
```

Os semânticos apontam para os primitivos (`semec_bg` → `@color/semec_pv_gray_50`). Dimensões: `1rem = 16px`, e `px` vira `dp` 1:1; tamanhos de texto (`semec_text_*`, `semec_pv_text_*`) saem em `sp`, para respeitar o tamanho de fonte do sistema.

A Poppins está em `dist/fonts/` (woff2). No Android, use os TTF oficiais da Poppins em `res/font/` com a mesma licença (OFL).

## iOS

1. Arraste `node_modules/@semec/ds-tokens/dist/ios/SemecTokens.swift` para o target do app no Xcode (ou para um pacote Swift interno).
2. Use o `enum SemecTokens` (membros em camelCase):

```swift
import SwiftUI

Text("Emitir certidão")
  .foregroundStyle(SemecTokens.Colors.textOnBrand)
  .padding(SemecTokens.Dimensions.space4)
  .background(SemecTokens.Colors.actionPrimary)
  .clipShape(RoundedRectangle(cornerRadius: SemecTokens.Dimensions.radiusMd))
```

```swift
// UIKit
view.backgroundColor = SemecTokens.UIColors.surface
```

`SemecTokens.ColorValues` traz os componentes sRGB (0–1) para outros usos. As dimensões estão em pontos (`1rem = 16pt`). Os blocos SwiftUI/UIKit ficam em `#if canImport(…)`, então o arquivo também compila fora do iOS (Swift 5 e 6 no Linux, testado no pacote), só com `ColorValues` e `Dimensions`. Para textos que respeitam o Dynamic Type, use `SemecTokens.Dimensions.textBase` com `@ScaledMetric` ou `UIFontMetrics`.

## Figma (Tokens Studio)

O `tokens-studio.json` tem dois conjuntos: `L0` (paleta) e `L1` (semânticos). Os semânticos referenciam os primitivos (`bg` = `{pv-gray-50}`), então trocar um primitivo atualiza tudo o que depende dele.

Passo a passo:

1. No Figma, instale e abra o plugin **Tokens Studio for Figma**.
2. Em **Settings → Token Storage**, escolha **Local document** (ou conecte o repositório, se a equipe usar sincronização por Git/URL).
3. Na aba **Tokens**, abra o menu **Tools → Load from file/folder or preset** e selecione o `tokens-studio.json` (copie de `node_modules/@semec/ds-tokens/dist/figma/` ou baixe do CDN na versão fixa). Confirme a substituição dos tokens.
4. Na lista de conjuntos, deixe **L0** como *Source* (fonte das referências, sem gerar estilos) e **L1** como *Enabled*.
5. Para criar as variables nativas do Figma, use **Styles & Variables → Export to Figma**, marque *Variables* (e *Styles* para tipografia e sombras, se quiser) e exporte os conjuntos. Cores viram variables de cor; espaçamentos, raios e tamanhos de texto viram variables numéricas em px.
6. Ao sair uma versão nova do pacote, repita o passo 3 e exporte de novo. Não edite os valores no Figma: a mudança tem de nascer no `tokens.css` do repositório, senão o próximo import a desfaz.

Mapeamento de tipos: cores → `color`; espaçamento → `spacing`; raios → `borderRadius`; tamanhos de texto → `fontSizes` (px); entrelinha → `lineHeights` (%); pesos → `fontWeights`; família → `fontFamilies` (`Poppins`; a pilha completa está na descrição); sombras → `boxShadow`; duração e curva de animação → `other`. A descrição de cada token traz o nome da variável CSS correspondente.

## O que é testado em cada plataforma

Os testes do pacote (`npm run test --workspace @semec/ds-tokens`; só as plataformas: `npm run test:plataformas --workspace @semec/ds-tokens`) leem as saídas com as ferramentas de cada plataforma e conferem **todos** os valores contra o `tokens.json`:

| Plataforma | O que o teste faz | O que só a plataforma real confirma |
| --- | --- | --- |
| iOS | Compila o `SemecTokens.swift` com `swiftc` em Swift 5 e Swift 6, com warnings como erro, e executa um programa que imprime cada `ColorValues` e cada `Dimensions`. Fora da Apple, compila também os blocos SwiftUI e UIKit contra *stubs* com as assinaturas da Apple (`Color(_:red:green:blue:opacity:)`, `UIColor(red:green:blue:alpha:)`). Num Mac, esses blocos usam o SwiftUI de verdade. | A compilação dos blocos `Colors` (SwiftUI) e `UIColors` (UIKit) contra o SDK real do iOS e a cor exibida num aparelho só aparecem num Mac com Xcode. |
| Android | Compila `colors.xml` e `dimens.xml` com o `aapt2` oficial (`compile` + `link`), lê a tabela de recursos gerada (`aapt2 dump resources`), resolve as referências `@color/…` e `@dimen/…` e confere valores e unidades (`dp`/`sp`). Também valida o XML e os nomes de recurso (`[a-z0-9_]`) sem ferramenta externa. | O uso num app (tema, `R.color.*` no Kotlin, renderização) fica para um projeto Android real. |
| Figma | Lê o `tokens-studio.json` com `@tokens-studio/sd-transforms` + Style Dictionary (o mesmo caminho de exportação do Tokens Studio), resolve todas as referências L1 → L0 e confere cada valor. Uma referência quebrada derruba o teste. | O import no plugin Tokens Studio e a exportação para as variables e os estilos do Figma só se confirmam no Figma. |

Ferramentas: o teste usa `swiftc` e `aapt2` locais quando existem (o `aapt2` vem de `AAPT2`, ou do `build-tools` em `ANDROID_HOME`/`ANDROID_SDK_ROOT`). Sem eles, usa Docker: a imagem oficial `swift:6.0` e a `python:3.12-slim` com o `aapt2` baixado do Google Maven (versão e sha256 fixos no teste). Sem ferramenta local nem Docker, os testes de Swift e Android pulam com aviso; com `SEMEC_PLATAFORMAS_EXIGIR=1`, falham. A CI (`ubuntu-latest`, que traz Swift e o Android SDK) roda com `SEMEC_PLATAFORMAS_EXIGIR=1`.

## Versões e mudanças

O pacote segue SemVer e é versionado por changesets no monorepo do Design System SEMEC. Renomear ou remover um token é mudança *major*. Os valores são os mesmos do `@semec/ds` da mesma época: os dois são gerados do mesmo `tokens.css`, e o `tokens.json` daqui é igual byte a byte ao `@semec/ds/tokens.json`.

## Licença

MIT. A fonte Poppins é distribuída sob a SIL Open Font License 1.1 (`dist/fonts/OFL.txt`).
