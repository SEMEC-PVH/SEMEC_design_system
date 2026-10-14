# Exceções de acessibilidade conhecidas

**Estado atual.** Violações que o axe reporta em componentes do `@semec/ds` e que foram **aceitas** como exceção, com evidência de que o impacto real é nulo. Fora desta lista, qualquer violação serious ou critical reprova o PR (ADR-014).

Cada exceção tem data, quem decidiu, evidência e um critério de revisão. Exceção sem critério de revisão não entra aqui.

## EXC-01: `aria-hidden-focus` com Select ou DropdownMenu abertos (AUD-19)

| Campo | Valor |
|---|---|
| Regra do axe | `aria-hidden-focus` (serious) |
| Componentes | `Select` e `DropdownMenu`, **só enquanto abertos**. `Dialog` e `AlertDialog` não disparam. `NavigationMenu` aberto também está coberto, por **outra causa** (sentinela de foco do Radix), analisada na onda 2 (#34): ver [NavigationMenu](#navigationmenu-sentinela-de-foco-do-radix-34) |
| Origem | Auditoria de 14/10/2026, achado AUD-19 (A11Y-06), em [auditoria/2026-10-14-auditoria-prototipos-antes-depois.md](auditoria/2026-10-14-auditoria-prototipos-antes-depois.md) |
| Decisão | **Aceita como exceção conhecida**, por decisão do usuário (mantenedor), em 14/10/2026. Issue: #33 |
| Revisão | Rever **a cada atualização de `@radix-ui/react-select`, `@radix-ui/react-dropdown-menu` ou `@radix-ui/react-navigation-menu`**: refazer a medição abaixo e retirar a exceção se a regra deixar de disparar ou se o Radix passar a usar `inert` |

### Causa

Ao abrir, o Radix chama `hideOthers` (pacote `aria-hidden`), que marca os irmãos da camada flutuante (por exemplo `#root`) com `aria-hidden="true"`, **sem** `inert`. O axe vê elementos focáveis dentro de uma árvore `aria-hidden` e acusa a regra.

### Por que o impacto real é nulo

Enquanto o menu ou o listbox está aberto:

- o foco fica preso na camada aberta: `Tab` não sai do listbox ou do menu; `Esc` fecha e devolve o foco ao gatilho;
- o `body` recebe `pointer-events: none`, então nada atrás pode ser clicado;
- ao fechar, o `aria-hidden` é removido.

Nenhum usuário de teclado ou de leitor de tela alcança um elemento focável escondido. A violação é formal: existe no DOM durante a abertura, mas não pode ser alcançada.

### Evidência (verificação de 14/10/2026)

Medição com axe-core + Chrome headless (lab da auditoria, `medir.mjs`), `@radix-ui/react-select` 2.4.1 instalado pelo npm do `@semec/ds` 3.0.0:

- `axeSelect` e `axeMenu`: `aria-hidden-focus` em `#root`, com `rootInert: false`;
- `selectAposTab`: depois de `Tab`, o foco continua no listbox (valor "Porto Velho");
- `axeDialog`: sem a regra (o Dialog usa outra estratégia de isolamento);
- telas afetadas: requerimento (Select aberto) e painel (DropdownMenu aberto). Com as camadas fechadas, as duas telas não têm violação serious de origem do kit nesta regra.

### O que **não** fazer

Não "corrija" isso no consumidor removendo `aria-hidden` à mão, aplicando `inert` por fora ou tirando o foco do gatilho: isso quebra o isolamento que o Radix garante. Se for corrigir, a correção vai no kit (aplicar `inert` aos irmãos ou atualizar o Radix) e precisa da medição acima repetida.

### NavigationMenu: sentinela de foco do Radix (#34)

**Causa diferente da do Select/DropdownMenu.** O `NavigationMenu` não chama `hideOthers` e não prende o foco. Com um item aberto, o `NavigationMenuTrigger` do Radix (`@radix-ui/react-navigation-menu` 1.2.22, `dist/index.mjs`, componente `NavigationMenuTrigger`) renderiza logo depois do gatilho um `<span aria-hidden="true" tabindex="0">` visualmente oculto, o *focus proxy*. É ele, e só ele, que o axe acusa (1 nó, `span:nth-child(2)` dentro do `<li>` do item aberto). Nada da página fica `aria-hidden`.

**Por que o impacto real é nulo.** O sentinela existe para que `Tab` alcance o conteúdo, que o Radix renderiza no viewport, longe do gatilho no DOM. No `onFocus` ele move o foco **na mesma hora** para o primeiro link do conteúdo (vindo do gatilho) ou para o último (vindo de depois, com `Shift+Tab`). O foco nunca repousa nele: nenhum leitor de tela tem tempo de anunciar o sentinela, e o usuário cai sempre num link real com nome.

**Por que não corrigimos no kit.** As saídas possíveis pioram a acessibilidade: tirar o `aria-hidden` expõe um elemento focável sem nome; `tabindex="-1"` ou `inert` no sentinela tira o conteúdo do submenu da ordem de `Tab` (o Radix remove os links do conteúdo da ordem de tabulação e depende do sentinela para entrar); reimplementar a entrada por `Tab` duplicaria a lógica interna do Radix e quebraria a cada atualização. A correção certa é no Radix.

**Evidência (14/10/2026, onda 2).** Chromium headless (Playwright) + axe-core, página com `NavigationMenu` de dois itens (`Serviços` com 2 links, `Ajuda` com 1) importado de `packages/react/dist/react`:

- fechado: axe sem violações;
- aberto (`Enter` no gatilho): só `aria-hidden-focus` (serious), 1 nó, o `span` sentinela; nenhum outro elemento `aria-hidden` focável;
- `Tab` a partir do gatilho aberto: `IPTU` → `Alvará` → `Ajuda` → link seguinte da página. Nenhuma parada no sentinela (`activeElement` nunca fica nele);
- `Shift+Tab` a partir do gatilho `Ajuda` com `Serviços` aberto: cai em `Alvará` (último link do conteúdo); `Shift+Tab` no primeiro link volta ao gatilho;
- um ouvinte `focusin` registra o sentinela recebendo foco de forma transitória (5 vezes na sequência acima), sempre seguido do foco num link real no mesmo ciclo;
- `ArrowDown` no gatilho aberto entra no primeiro link; `Esc` fecha e devolve o foco ao gatilho (`aria-expanded="false"`).

**Revisão.** Refazer a medição a cada atualização de `@radix-ui/react-navigation-menu` e retirar o NavigationMenu desta exceção se o sentinela deixar de ser `aria-hidden` focável.

### Como tratar em testes automatizados

Ao rodar o axe com Select, DropdownMenu ou NavigationMenu abertos, desative só a regra `aria-hidden-focus` nesse estado e registre o motivo (`EXC-01`). Não desative a regra globalmente.
