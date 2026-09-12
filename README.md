# SEMEC Design System — site de documentação

Este repositório é o **site de documentação (guia visual) do Design System da SEMEC** — Secretaria Municipal de Educação da Prefeitura de Porto Velho. Ele **documenta** os fundamentos visuais (tipografia, cores, layout, raios e sombras), replica a aparência dos componentes do portal e registra as regras de uso. Ele **não é a biblioteca de componentes**: não existe pacote npm publicado, não há componente consumível por outro projeto e as classes utilitárias no estilo Tailwind citadas nas páginas de componentes (`bg-pv-blue-900`, `focus-visible:ring-pv-green-500`, etc.) descrevem o código do repositório **`semec-digital`**, não este. Aqui elas aparecem apenas como texto de referência — o próprio site é escrito em CSS puro com custom properties, sem Tailwind.

*Iframe para scopar estilos. Ponto de atenção: Componentes do Kit renderizados não devem herdar estilização do Site.

Em outras palavras: para **consultar** as decisões visuais, use este site. Para **implementar** uma interface, aplique as regras daqui, exemplo de componentes e guias para seus agentes.

## Stack

| Item | Versão / escolha |
| --- | --- |
| Next.js | 16.3.2 (App Router) |
| React / React DOM | 19.2.8 |
| Linguagem | JavaScript + JSX (sem TypeScript) |
| Estilos | CSS puro em `app/globals.css`, com custom properties (`--pv-*`) |
| Fontes | Arquivos `.woff2` locais em `app/fonts/` (Poppins, Press Start 2P, JetBrains Mono) |
| Saída | Export estático (`output: 'export'` + `trailingSlash: true`) |
| Lint | ESLint 9 (flat config) + `eslint-config-next` + `eslint-plugin-jsx-a11y` |
| Node | >= 20 |

Não há Storybook nem testes automatizados no projeto.

## Como rodar

```bash
npm install
npm run dev
```

O servidor de desenvolvimento sobe em <http://localhost:3000>.

## Como gerar o site estático

```bash
npm run build
```

O `next.config.mjs` usa `output: 'export'`, então o build grava o site já estático em **`out/`** (pasta ignorada pelo git). Para conferir localmente, sirva `out/` com qualquer servidor de arquivos estáticos — por exemplo `npx serve out`. O script `npm start` (`next start`) não se aplica a um projeto com `output: 'export'`.

## Lint

```bash
npm run lint
```

A partir do Next.js 16 o comando `next lint` foi removido; a checagem roda direto pela CLI do ESLint (`eslint .`), configurada em `eslint.config.mjs`.

## Estrutura de pastas

| Caminho | O que é |
| --- | --- |
| `app/layout.js` | Root layout: carrega as fontes locais, define `metadata` e `<html lang="pt-BR">` |
| `app/globals.css` | Folha de estilo única do site: tokens `--pv-*` e todas as classes de layout e componentes |
| `app/(docs)/` | Route group com todas as páginas do guia, sob o mesmo shell de documentação |
| `app/fonts/` | Arquivos `.woff2` das três famílias tipográficas |
| `app/icon.svg` | Ícone do site |
| `components/docs/` | Casca da documentação: `DocsShell`, `Header`, `Sidebar` |
| `components/demos/` | Réplicas visuais dos componentes do portal: `DemoHeader`, `DemoHero`, `DemoControls`, `DemoCard`, `DemoFooter` |
| `components/ui/` | Blocos usados pelas páginas do guia: `Card`, `Preview`, `Swatch`, `TypeRow`, `Shape`, `Buttons` |
| `lib/navigation.js` | Árvore de navegação renderizada na sidebar |
| `lib/clipboard.js` | Helper `copyText` para copiar valores (hex, tokens) |
| `legacy/` | Versão anterior do guia como `index.html` monolítico + o Manual de Identidade Visual (MIV) da PMPV em PDF |
| `next.config.mjs` | Configuração do export estático |
| `jsconfig.json` | Alias `@/*` para a raiz do projeto |

### Rotas do guia

- `/` — visão geral
- `/fundamentos/tipografia`, `/fundamentos/cores`, `/fundamentos/layout`, `/fundamentos/raios-sombras`
- `/componentes` e as páginas `header`, `hero`, `controles`, `service-card`, `botoes`, `footer`
- `/regras/animacoes`, `/regras/acessibilidade`, `/regras/anti-padroes`, `/regras/pendencias`

## Estado atual e limitações conhecidas

O próprio site mantém a lista viva de dívidas em **`/regras/pendencias`** (arquivo: `app/(docs)/regras/pendencias/page.jsx`). Em resumo, o que já é conhecido:

- **`#223f99`** (azul do herói, do footer e do logotipo) aparece como hex solto e **não tem token** na escala `pv-blue-*`.
- **`slate-*`** é usado em bordas de card e inputs sem decisão sobre virar token ou permanecer neutro utilitário.
- No portal, cada serviço em `src/servicos/*` carrega o próprio `.css`, ainda não migrado para tokens e componentes.
- Os tokens shadcn (`--color-primary` e afins) só valem dentro de `.calc-root`; uma adoção global de shadcn exigiria redefini-los.

Limitações específicas deste repositório:

- Os itens em `components/demos/` são **réplicas visuais** feitas para a documentação, não a implementação usada em produção — divergências com o portal são possíveis e devem ser tratadas como bug da documentação.
- O guia descreve classes utilitárias que não existem aqui; a fonte de verdade da implementação continua sendo o repositório `semec-digital`.
- `legacy/` guarda o `index.html` original e um PDF de ~20 MB versionado no repositório. A remoção ou migração desses arquivos ainda depende de decisão do dono do repositório.
- Não há CI, testes automatizados nem verificação automática de contraste; as checagens de acessibilidade documentadas em `/regras/acessibilidade` são manuais.
