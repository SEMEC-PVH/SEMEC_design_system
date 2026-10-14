# Exceções de acessibilidade conhecidas

**Estado atual.** Violações que o axe reporta em componentes do `@semec/ds` e que foram **aceitas** como exceção, com evidência de que o impacto real é nulo. Fora desta lista, qualquer violação serious ou critical reprova o PR (ADR-014).

Cada exceção tem data, quem decidiu, evidência e um critério de revisão. Exceção sem critério de revisão não entra aqui.

## EXC-01: `aria-hidden-focus` com Select ou DropdownMenu abertos (AUD-19)

| Campo | Valor |
|---|---|
| Regra do axe | `aria-hidden-focus` (serious) |
| Componentes | `Select` e `DropdownMenu`, **só enquanto abertos**. `Dialog` e `AlertDialog` não disparam. **`NavigationMenu` não está coberto:** ele também dispara a regra quando aberto, mas não prende o foco, então o impacto pode ser real; está em análise na onda 2 (#34) |
| Origem | Auditoria de 14/10/2026, achado AUD-19 (A11Y-06), em [auditoria/2026-10-14-auditoria-prototipos-antes-depois.md](auditoria/2026-10-14-auditoria-prototipos-antes-depois.md) |
| Decisão | **Aceita como exceção conhecida**, por decisão do usuário (mantenedor), em 14/10/2026. Issue: #33 |
| Revisão | Rever **a cada atualização de `@radix-ui/react-select` ou `@radix-ui/react-dropdown-menu`**: refazer a medição abaixo e retirar a exceção se a regra deixar de disparar ou se o Radix passar a usar `inert` |

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

### Como tratar em testes automatizados

Ao rodar o axe com Select ou DropdownMenu abertos, desative só a regra `aria-hidden-focus` nesse estado e registre o motivo (`EXC-01`). Não desative a regra globalmente.
