---
adr: 26
titulo: "Pacote @semec/ds-tokens e saídas por plataforma"
status: Aceito
data: 2026-10-19
atualiza: [3]
---

# ADR-026 — Pacote `@semec/ds-tokens` e saídas por plataforma

**Status:** Aceito (19/10/2026). Onda 2 da issue #74.

**Atualiza.** [ADR-003](0003-design-tokens-tres-niveis-dtcg.md) (tokens em três níveis, DTCG, Style Dictionary): a fonte continua sendo o CSS e o JSON passa a ser derivado.

**Contexto.** O ADR-003 previa autoria em JSON DTCG compilada pelo Style Dictionary. Na prática, os tokens nasceram e continuam em CSS escrito à mão (`packages/react/tokens.css`), com os comentários de contraste, as decisões de auditoria (AUD-27, AUD-30, AUD-56, AUD-57) e o `@theme` do Tailwind no mesmo arquivo. Desde a 4.x o `@semec/ds` já deriva desse CSS um `tokens.json` DTCG, um módulo `tokens` e os arquivos `variables.css`/`base.css`, com testes de paridade (`check-tokens.mjs`, `check-css.mjs`).

Faltavam três coisas:

1. **Consumir os tokens sem React.** Hoje quem quer só as cores e espaçamentos instala o `@semec/ds` inteiro, que traz Radix, CVA e os peers `react`, `react-dom` e `lucide-react`. Isso afasta sistemas em Vue, Angular, PHP ou HTML puro, que a prefeitura também mantém.
2. **Saídas nativas.** Apps Android e iOS e o Figma não leem CSS. Sem um arquivo gerado, cada equipe copia hex à mão e os valores divergem a cada mudança.
3. **Um contrato de pacote estável** para a camada de classes CSS (`@semec/ds-css`, ADR-028), que precisa depender só dos tokens.

**Decisão.**

- Cria-se o pacote **`@semec/ds-tokens`** em `packages/tokens/`, publicado no npm a partir da 1.0.0, **sem `dependencies` nem `peerDependencies`**.
- **A fonte de verdade continua `packages/react/tokens.css`** (e as fontes em `packages/react/fonts/`). O build do pacote lê esses arquivos e gera tudo em `dist/`; nada em `dist/` é editado à mão. O build reaproveita o parser do kit (`packages/react/scripts/token-data.mjs`) e a extração de CSS (`build-css.mjs`) sem alterá-los, então o `@semec/ds` não muda de saída nem de versão por causa deste pacote.
- **O JSON é derivado, não fonte.** O `tokens.json` do pacote é DTCG, com as camadas `L0` e `L1` e as referências L1 → L0 (`{L0.pv-gray-50}`), e é **igual byte a byte** ao `@semec/ds/tokens.json`. Quem quer mudar um token edita o `tokens.css`.
- **Exports** (todos com `default`): `tokens.css` (só o `:root`, igual ao `@semec/ds/react/variables.css`), `base.css` (reset, foco, links e reduced motion), `fonts.css` + `fonts/*` (Poppins 400–700), `tokens.json`, `tokens` (JS + `.d.ts`), `android/colors.xml`, `android/dimens.xml`, `ios/SemecTokens.swift` e `figma/tokens-studio.json`.
- **As saídas de plataforma são geradas pelo Style Dictionary 5** a partir do DTCG, com transformações e formatos próprios registrados por `hooks` (sem estado global):
  - Android: `android/resources` do próprio Style Dictionary; nomes `semec_` + snake_case; cores `#RRGGBB` (ou `#AARRGGBB` com alfa); os semânticos referenciam os primitivos (`@color/semec_pv_gray_50`); dimensões com `1rem = 16px`, em `dp`, e tamanhos de texto em `sp`.
  - iOS: `enum SemecTokens` com `ColorValues` (sRGB), `Colors` (SwiftUI), `UIColors` (UIKit) e `Dimensions` (`CGFloat` em pontos). SwiftUI e UIKit ficam em `#if canImport`, então o arquivo compila em Swift 6 também fora da Apple.
  - Figma: formato do Tokens Studio, com os conjuntos `L0` e `L1` e as referências preservadas como `{pv-gray-50}`. Do Tokens Studio saem as variables do Figma.
- **Testes do pacote** (`npm run test --workspace @semec/ds-tokens`, também no `npm test` da raiz) provam a paridade byte a byte com o `@semec/ds`, o `tokens.css` sem diretivas do Tailwind e com todos os L0 e L1, os valores resolvidos de Android, iOS e Tokens Studio contra o JSON (lidos também por `swiftc`, `aapt2` e `sd-transforms`; ver Consequências), a resolução dos exports por `import` e `require` e o conteúdo do `npm pack`.

**Alternativas descartadas.**

- *Inverter a fonte para JSON agora, como o ADR-003 previa.* Exigiria reescrever o `tokens.css` como saída gerada, perdendo no mesmo arquivo os comentários de contraste e de auditoria que hoje orientam quem mexe nos tokens, e mudaria o build do `@semec/ds` numa onda que promete não mexer nele. Fica possível no futuro sem quebrar consumidores: o contrato publicado é o `dist/`, não a origem.
- *Escrever os geradores de Android, iOS e Figma à mão, sem Style Dictionary.* Menos uma devDependency, mas cada formato novo viraria código nosso a manter; o Style Dictionary já resolve referências, nomes e o XML do Android, e é a ferramenta que o ADR-003 escolheu.
- *Publicar os tokens como subpaths do `@semec/ds` (`@semec/ds/lite/*`).* Já existe e continua, mas instala React, Radix e os peers. O objetivo aqui é um pacote que não traga nada além dos tokens.
- *Copiar `tokens.css` e as fontes para dentro de `packages/tokens/`.* Duas fontes de verdade, com divergência garantida.

**Consequências.**

- Sistemas sem React consomem os tokens com `npm install @semec/ds-tokens` (sem dependências transitivas) ou por CDN, e apps nativos e o Figma recebem arquivos gerados na mesma versão.
- Toda mudança em `packages/react/tokens.css` muda também o `@semec/ds-tokens`. O changeset precisa listar os dois pacotes quando um token muda; renomear ou remover token é *major* nos dois ([ADR-013](0013-politica-de-depreciacao-duas-minors.md)).
- O parser `token-data.mjs` passa a ter dois consumidores. Um tipo de valor novo no `tokens.css` (por exemplo `color-mix()`) quebra o build dos dois de propósito: precisa de mapeamento no parser e, para as plataformas, nas transformações do `packages/tokens/scripts/platforms.mjs`.
- Os comentários do `tokens.css` (que citam `@semec/ds/react/fonts.css` e o `@theme`) vão também para o `tokens.css` deste pacote, porque ele é igual ao `variables.css`. Se incomodar, a limpeza é no CSS fonte.
- **Verificação nas plataformas (onda 3, 20/10/2026).** Os testes de `packages/tokens/test/plataformas.test.mjs` passaram a ler as saídas com as ferramentas reais e a conferir todos os valores contra o `tokens.json`:
  - *iOS:* `swiftc` (Swift 6.0.3 na imagem oficial `swift:6.0`, ou o local) compila o `SemecTokens.swift` em Swift 5 e Swift 6 com warnings como erro e executa um programa que imprime cada `ColorValues` e `Dimensions`. Fora da Apple, os blocos SwiftUI/UIKit compilam contra *stubs* com as assinaturas da Apple; num Mac, contra o SwiftUI real.
  - *Android:* o `aapt2` oficial (Android SDK local, ou o do Google Maven com sha256 fixo num contêiner `python:3.12-slim`) faz `compile` + `link` de `colors.xml` e `dimens.xml`; a tabela de recursos (`aapt2 dump resources`) é resolvida e conferida, com as unidades `dp`/`sp`.
  - *Figma:* o `tokens-studio.json` é lido com `@tokens-studio/sd-transforms` + Style Dictionary (o caminho de exportação do Tokens Studio); todas as referências L1 → L0 resolvem e cada valor bate. Um teste negativo prova que uma referência quebrada derruba a verificação.
  - Nenhum defeito de geração apareceu: o gerador não mudou.
  - Sem ferramenta local nem Docker, os testes de Swift e Android pulam com aviso; com `SEMEC_PLATAFORMAS_EXIGIR=1` falham. A CI roda assim no job `test` (o `ubuntu-latest` traz Swift e o Android SDK).
  - **Continua sem confirmação automática:** a compilação dos blocos SwiftUI e UIKit contra o SDK do iOS (só num Mac com Xcode), o uso dos recursos num app Android real e o import no plugin Tokens Studio com a exportação para as variables do Figma (só no Figma).
- O `@semec/ds` não passa a depender do `@semec/ds-tokens` nesta onda; essa troca fica para uma decisão futura.
