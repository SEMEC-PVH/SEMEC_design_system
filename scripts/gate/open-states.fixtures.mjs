/**
 * Casos de "estado aberto" das camadas do `@semec/ds` (issue #34).
 *
 * Fonte única para:
 *   - o gate (`check-open-states.mjs`, roda contra `dist/` no Chromium headless);
 *   - a suíte Vitest (`packages/react/test/open-states.test.tsx`, roda contra `src/`).
 *
 * Cada caso renderiza a camada FECHADA, abre pelo caminho do usuário
 * (clique, teclado ou foco), confere que abriu e então roda o axe.
 *
 * Exceções: só a EXC-01 (docs/excecoes-acessibilidade.md) — `aria-hidden-focus`
 * desligada APENAS em Select e DropdownMenu abertos. Nenhum outro caso tem
 * regra desligada além de `color-contrast` (a página de teste não carrega o
 * CSS compilado; no jsdom nem há CSS calculado).
 */
import React from "react";

const h = React.createElement;

/** EXC-01: aria-hidden-focus com Select/DropdownMenu abertos (AUD-19). */
export const EXC_01_RULES = ["aria-hidden-focus"];

/** Regras sempre desligadas: dependem do CSS compilado, ausente nos testes. */
export const JSDOM_DISABLED_RULES = ["color-contrast"];

async function clickByRole(screen, user, role, name) {
  await user.click(screen.getByRole(role, { name }));
}

/**
 * @param {Record<string, any>} ds namespace do kit (`@semec/ds/react` ou `src/index.ts`)
 */
export function openStateCases(ds) {
  return [
    {
      code: "dialog",
      element: h(
        ds.Dialog,
        null,
        h(ds.DialogTrigger, null, "Abrir diálogo"),
        h(
          ds.DialogContent,
          null,
          h(
            ds.DialogHeader,
            null,
            h(ds.DialogTitle, null, "Editar dados"),
            h(ds.DialogDescription, null, "Altere os dados e salve.")
          )
        )
      ),
      open: ({ screen, user }) => clickByRole(screen, user, "button", "Abrir diálogo"),
      findOpen: ({ screen }) => screen.queryByRole("dialog"),
    },
    {
      code: "sheet",
      element: h(
        ds.Sheet,
        null,
        h(ds.SheetTrigger, null, "Abrir menu"),
        h(
          ds.SheetContent,
          null,
          h(
            ds.SheetHeader,
            null,
            h(ds.SheetTitle, null, "Menu lateral"),
            h(ds.SheetDescription, null, "Opções de navegação")
          )
        )
      ),
      open: ({ screen, user }) => clickByRole(screen, user, "button", "Abrir menu"),
      findOpen: ({ screen }) => screen.queryByRole("dialog"),
    },
    {
      code: "drawer",
      element: h(
        ds.Drawer,
        null,
        h(ds.DrawerTrigger, null, "Abrir painel"),
        h(
          ds.DrawerContent,
          null,
          h(
            ds.DrawerHeader,
            null,
            h(ds.DrawerTitle, null, "Painel"),
            h(ds.DrawerDescription, null, "Detalhes do registro")
          )
        )
      ),
      open: ({ screen, user }) => clickByRole(screen, user, "button", "Abrir painel"),
      findOpen: ({ screen }) => screen.queryByRole("dialog"),
    },
    {
      code: "alert-dialog",
      element: h(
        ds.AlertDialog,
        null,
        h(ds.AlertDialogTrigger, null, "Excluir registro"),
        h(
          ds.AlertDialogContent,
          null,
          h(
            ds.AlertDialogHeader,
            null,
            h(ds.AlertDialogTitle, null, "Excluir registro?"),
            h(ds.AlertDialogDescription, null, "Esta ação não pode ser desfeita.")
          ),
          h(
            ds.AlertDialogFooter,
            null,
            h(ds.AlertDialogCancel, null, "Cancelar"),
            h(ds.AlertDialogAction, null, "Excluir")
          )
        )
      ),
      open: ({ screen, user }) => clickByRole(screen, user, "button", "Excluir registro"),
      // Aceita os dois papéis: hoje o AlertDialog usa o Dialog do Radix
      // (role="dialog"); o padrão APG é role="alertdialog".
      findOpen: ({ screen }) => screen.queryByRole("alertdialog") ?? screen.queryByRole("dialog"),
    },
    {
      code: "popover",
      element: h(
        ds.Popover,
        null,
        h(ds.PopoverTrigger, null, "Mais filtros"),
        // Uso documentado no manifest: PopoverContent é role="dialog" e precisa de nome.
        h(ds.PopoverContent, { "aria-label": "Filtros" }, h("p", null, "Conteúdo do popover"))
      ),
      open: ({ screen, user }) => clickByRole(screen, user, "button", "Mais filtros"),
      findOpen: ({ screen }) => screen.queryByText("Conteúdo do popover"),
    },
    {
      code: "select",
      disableRules: EXC_01_RULES,
      element: h(
        ds.Select,
        null,
        h(ds.SelectTrigger, { "aria-label": "Município" }, h(ds.SelectValue, { placeholder: "Selecione" })),
        h(
          ds.SelectContent,
          null,
          h(ds.SelectItem, { value: "pvh" }, "Porto Velho"),
          h(ds.SelectItem, { value: "jpr" }, "Ji-Paraná")
        )
      ),
      open: async ({ screen, user }) => {
        screen.getByRole("combobox", { name: "Município" }).focus();
        await user.keyboard("{Enter}");
      },
      findOpen: ({ screen }) => screen.queryByRole("listbox"),
    },
    {
      code: "dropdown-menu",
      disableRules: EXC_01_RULES,
      element: h(
        ds.DropdownMenu,
        null,
        h(ds.DropdownMenuTrigger, null, "Opções"),
        h(
          ds.DropdownMenuContent,
          null,
          h(ds.DropdownMenuItem, null, "Editar"),
          h(ds.DropdownMenuItem, null, "Excluir")
        )
      ),
      open: async ({ screen, user }) => {
        screen.getByRole("button", { name: "Opções" }).focus();
        await user.keyboard("{Enter}");
      },
      findOpen: ({ screen }) => screen.queryByRole("menu"),
    },
    {
      code: "navigation-menu",
      element: h(
        ds.NavigationMenu,
        { "aria-label": "Principal" },
        h(
          ds.NavigationMenuList,
          null,
          h(
            ds.NavigationMenuItem,
            null,
            h(ds.NavigationMenuTrigger, null, "Serviços"),
            h(
              ds.NavigationMenuContent,
              null,
              h(
                "ul",
                null,
                h("li", null, h(ds.NavigationMenuLink, { href: "#matricula" }, "Matrícula")),
                h("li", null, h(ds.NavigationMenuLink, { href: "#transporte" }, "Transporte escolar"))
              )
            )
          ),
          h(ds.NavigationMenuItem, null, h(ds.NavigationMenuLink, { href: "#inicio" }, "Início"))
        )
      ),
      open: ({ screen, user }) => clickByRole(screen, user, "button", "Serviços"),
      findOpen: ({ screen }) => screen.queryByRole("link", { name: "Matrícula" }),
    },
    {
      code: "combobox",
      element: h(ds.Combobox, {
        ariaLabel: "Município",
        placeholder: "Selecione o município",
        options: [
          { value: "pvh", label: "Porto Velho" },
          { value: "jpr", label: "Ji-Paraná" },
        ],
      }),
      // O gatilho hoje é um <button>; o padrão APG é role="combobox". Aceita os dois.
      open: async ({ screen, user }) => {
        const trigger =
          screen.queryAllByRole("combobox")[0] ?? screen.getByRole("button", { name: "Município" });
        await user.click(trigger);
      },
      findOpen: ({ screen }) => screen.queryByRole("listbox"),
    },
    {
      code: "tooltip",
      element: h(
        ds.TooltipProvider,
        { delayDuration: 0 },
        h(
          ds.Tooltip,
          null,
          h(ds.TooltipTrigger, null, "Ajuda"),
          h(ds.TooltipContent, null, "Informações adicionais")
        )
      ),
      // Teclado: o tooltip abre no foco.
      open: async ({ user }) => {
        await user.tab();
      },
      findOpen: ({ screen }) => screen.queryByRole("tooltip"),
    },
  ];
}

/**
 * Renderiza, abre e audita um caso. Não lança: devolve o resultado para quem
 * chamou decidir (o gate agrega; o Vitest faz `expect`).
 *
 * @returns {Promise<{ opened: boolean, violations: Array<{id: string, impact: string, help: string, nodes: string[]}> }>}
 */
export async function runOpenStateCase(testCase, { render, screen, userEvent, axe, waitFor }) {
  const user = userEvent.setup();
  render(h("main", null, testCase.element));
  await testCase.open({ screen, user });

  let opened = false;
  try {
    await waitFor(() => {
      if (!testCase.findOpen({ screen })) throw new Error("camada não abriu");
    });
    opened = true;
  } catch {
    opened = false;
  }

  const rules = {};
  for (const id of [...JSDOM_DISABLED_RULES, ...(testCase.disableRules ?? [])]) {
    rules[id] = { enabled: false };
  }
  const results = await axe.run(document.body, { rules, resultTypes: ["violations"] });
  const violations = results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => n.target.join(" ")),
    }));

  return { opened, violations };
}
