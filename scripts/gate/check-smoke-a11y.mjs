import React from "react";
import ReactDOMServer from "react-dom/server";
import { JSDOM } from "jsdom";
import axe from "axe-core";
import * as ds from "../../packages/react/dist/react/index.js";
import { dsComponents } from "../../packages/react/manifest.js";

// Mocks/fixtures seguros para renderização smoke e a11y de cada componente do design system
export function getComponentElement(code) {
  switch (code) {
    case "accordion":
      return React.createElement(
        ds.Accordion,
        { type: "single", collapsible: true, defaultValue: "item-1" },
        React.createElement(
          ds.AccordionItem,
          { value: "item-1" },
          React.createElement(ds.AccordionTrigger, null, "Item 1"),
          React.createElement(ds.AccordionContent, null, "Conteúdo do item 1")
        )
      );

    case "alert":
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(
          ds.Alert,
          null,
          React.createElement(ds.AlertTitle, null, "Atenção"),
          React.createElement(ds.AlertDescription, null, "Mensagem informativa")
        ),
        React.createElement(
          ds.Alert,
          { variant: "destructive" },
          React.createElement(ds.AlertTitle, { as: "h2" }, "Pagamento recusado"),
          React.createElement(ds.AlertDescription, null, "Confira os dados.")
        ),
        React.createElement(
          ds.Alert,
          { variant: "warning", announce: "off" },
          React.createElement(ds.AlertDescription, null, "Aviso estático")
        )
      );

    case "alert-dialog":
      return React.createElement(
        ds.AlertDialog,
        { open: true },
        React.createElement(
          ds.AlertDialogContent,
          null,
          React.createElement(ds.AlertDialogHeader, null,
            React.createElement(ds.AlertDialogTitle, null, "Confirmar ação"),
            React.createElement(ds.AlertDialogDescription, null, "Deseja prosseguir?")
          ),
          React.createElement(ds.AlertDialogFooter, null,
            React.createElement(ds.AlertDialogCancel, null, "Cancelar"),
            React.createElement(ds.AlertDialogAction, null, "Confirmar")
          )
        )
      );

    case "avatar":
      return React.createElement(
        ds.Avatar,
        null,
        React.createElement(ds.AvatarFallback, null, "PV")
      );

    case "badge":
      return React.createElement(ds.Badge, null, "Em análise");

    case "breadcrumb":
      return React.createElement(ds.Breadcrumb, {
        items: [
          { label: "Início", href: "/" },
          { label: "Serviços", href: "/servicos" },
          { label: "ITBI", active: true },
        ],
      });

    case "button":
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(ds.Button, null, "Salvar"),
        React.createElement(ds.Button, { loading: true, loadingText: "Enviando…" }, "Enviar")
      );

    case "stepper":
      return React.createElement(ds.Stepper, {
        steps: [
          { label: "Dados do estudante" },
          { label: "Documentos", description: "RG e CPF" },
          { label: "Revisão e envio" },
        ],
        currentStep: 1,
        onStepClick: () => {},
      });

    case "password-input":
      return React.createElement(ds.PasswordInput, {
        "aria-label": "Senha",
        autoComplete: "current-password",
      });

    case "input-mask":
      return React.createElement(ds.InputMask, {
        "aria-label": "CPF",
        mask: "cpf",
        defaultValue: "12345678901",
      });

    case "calendar":
      return React.createElement(ds.Calendar);

    case "card":
      return React.createElement(
        ds.Card,
        null,
        React.createElement(ds.CardHeader, null, React.createElement(ds.CardTitle, { as: "h2" }, "Título do Card")),
        React.createElement(ds.CardContent, null, "Conteúdo do card.")
      );

    case "checkbox":
      return React.createElement(
        "label",
        { style: { display: "flex", gap: "8px", alignItems: "center" } },
        React.createElement(ds.Checkbox, { id: "check-1", "aria-label": "Termos de aceite" }),
        React.createElement("span", null, "Concordo com os termos")
      );

    case "combobox":
      return React.createElement(ds.Combobox, {
        options: [{ label: "Opção 1", value: "1" }],
        placeholder: "Selecione...",
        ariaLabel: "Opção",
      });

    case "data-table":
      return React.createElement(ds.DataTable, {
        caption: "Serviços",
        columns: [
          { header: "Nome", key: "name", sortable: true },
          { header: "Status", key: "status" },
        ],
        data: [{ name: "Serviço A", status: "Ativo" }],
        page: 1,
        pageCount: 2,
        onPageChange: () => {},
        labels: { previous: "Página anterior" },
      });

    case "date-picker":
      return React.createElement(ds.DatePicker, { "aria-label": "Data" });

    case "dialog":
      return React.createElement(
        ds.Dialog,
        { open: true },
        React.createElement(
          ds.DialogContent,
          null,
          React.createElement(ds.DialogHeader, null,
            React.createElement(ds.DialogTitle, null, "Diálogo"),
            React.createElement(ds.DialogDescription, null, "Descrição do diálogo")
          )
        )
      );

    case "drawer":
      return React.createElement(
        ds.Drawer,
        { open: true },
        React.createElement(
          ds.DrawerContent,
          null,
          React.createElement(ds.DrawerHeader, null,
            React.createElement(ds.DrawerTitle, null, "Painel lateral"),
            React.createElement(ds.DrawerDescription, null, "Descrição do painel")
          )
        )
      );

    case "dropdown-menu":
      return React.createElement(
        ds.DropdownMenu,
        { open: true },
        React.createElement(ds.DropdownMenuTrigger, { asChild: true }, React.createElement("button", null, "Opções")),
        React.createElement(
          ds.DropdownMenuContent,
          null,
          React.createElement(ds.DropdownMenuItem, null, "Ação 1")
        )
      );

    case "empty-state":
      return React.createElement(ds.EmptyState, {
        title: "Nenhum registro encontrado",
        description: "Tente ajustar os filtros de busca.",
      });

    case "error-state":
      return React.createElement(ds.ErrorState, {
        title: "Falha ao carregar dados",
        description: "Ocorreu um erro ao comunicar com o servidor.",
        onRetry: () => {},
      });

    case "error-summary":
      return React.createElement(ds.ErrorSummary, {
        title: "Erros encontrados no formulário",
        errors: [{ message: "O CPF é obrigatório", href: "#cpf" }],
      });

    case "file-upload":
      return React.createElement(ds.FileUpload, { label: "Anexo", "aria-label": "Anexo de arquivo" });

    case "form-field":
      return React.createElement(
        ds.FormField,
        { label: "CPF", htmlFor: "cpf-input" },
        React.createElement(ds.Input, { id: "cpf-input", placeholder: "000.000.000-00" })
      );

    case "header":
      return React.createElement(
        ds.Header,
        null,
        React.createElement(ds.HeaderBrand, {
          orgName: "SEMEC",
          serviceName: "Matrícula",
          logo: React.createElement("img", { src: "data:,", alt: "Prefeitura de Porto Velho" }),
        }),
        React.createElement(ds.HeaderNav, null,
          React.createElement(ds.HeaderNavLink, { href: "/" }, "Início")
        )
      );

    case "heading":
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(ds.Heading, { level: 1 }, "Requerimento"),
        React.createElement(ds.Heading, { level: 2 }, "Dados do estudante"),
        React.createElement(ds.Heading, { level: 3, size: 2 }, "Documentos")
      );

    case "footer":
      return React.createElement(
        ds.Footer,
        null,
        React.createElement(
          ds.FooterContent,
          null,
          React.createElement(
            ds.FooterSection,
            { title: "Serviços" },
            React.createElement(
              ds.FooterLinks,
              null,
              React.createElement(ds.FooterLink, { href: "/matricula" }, "Matrícula"),
              React.createElement(ds.FooterLink, { href: "/transporte" }, "Transporte escolar")
            )
          )
        ),
        React.createElement(ds.FooterBottom, null, React.createElement("p", null, "© 2026 SEMEC"))
      );

    case "skip-link":
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(ds.SkipLink, null),
        React.createElement("div", { id: "conteudo" }, "Conteúdo principal")
      );

    case "icon-button":
      return React.createElement(ds.IconButton, { "aria-label": "Fechar" }, "×");

    case "input":
      return React.createElement(ds.Input, { "aria-label": "Campo de texto", placeholder: "Digite..." });

    case "input-otp":
      return React.createElement(
        ds.InputOTP,
        { maxLength: 4, "aria-label": "Código OTP" },
        React.createElement(
          ds.InputOTPGroup,
          null,
          React.createElement(ds.InputOTPSlot, { index: 0 }),
          React.createElement(ds.InputOTPSlot, { index: 1 })
        )
      );

    case "label":
      return React.createElement(ds.Label, { htmlFor: "campo" }, "Rótulo do campo");

    case "link":
      return React.createElement(ds.Link, { href: "https://semec.portovelho.ro.gov.br" }, "Portal SEMEC");

    case "navigation-menu":
      return React.createElement(
        ds.NavigationMenu,
        null,
        React.createElement(
          ds.NavigationMenuList,
          null,
          React.createElement(
            ds.NavigationMenuItem,
            null,
            React.createElement(ds.NavigationMenuLink, { href: "/" }, "Início")
          )
        )
      );

    case "pagination":
      return React.createElement(ds.Pagination, {
        page: 1,
        pageCount: 5,
        onPageChange: () => {},
      });

    case "popover":
      return React.createElement(
        ds.Popover,
        { open: true },
        React.createElement(ds.PopoverTrigger, { asChild: true }, React.createElement("button", null, "Abrir")),
        React.createElement(ds.PopoverContent, { "aria-label": "Filtros" }, "Conteúdo do popover")
      );

    case "progress":
      return React.createElement(ds.Progress, { value: 60, "aria-label": "Progresso de envio" });

    case "radio-group":
      return React.createElement(
        ds.RadioGroup,
        { defaultValue: "opcao-1", "aria-label": "Grupo de opções" },
        React.createElement(
          "div",
          { style: { display: "flex", gap: "8px", alignItems: "center" } },
          React.createElement(ds.RadioGroupItem, { value: "opcao-1", id: "rg-1", "aria-label": "Opção 1" }),
          React.createElement("label", { htmlFor: "rg-1" }, "Opção 1")
        )
      );

    case "scroll-area":
      return React.createElement(
        ds.ScrollArea,
        { style: { height: "100px" } },
        React.createElement("div", null, "Linha 1"),
        React.createElement("div", null, "Linha 2")
      );

    case "select":
      return React.createElement(
        ds.Select,
        { defaultValue: "opt-1" },
        React.createElement(ds.SelectTrigger, { "aria-label": "Selecione uma opção" }, React.createElement(ds.SelectValue, null)),
        React.createElement(
          ds.SelectContent,
          null,
          React.createElement(ds.SelectItem, { value: "opt-1" }, "Opção 1")
        )
      );

    case "separator":
      return React.createElement(ds.Separator);

    case "sheet":
      return React.createElement(
        ds.Sheet,
        { open: true },
        React.createElement(
          ds.SheetContent,
          null,
          React.createElement(ds.SheetHeader, null,
            React.createElement(ds.SheetTitle, null, "Menu Lateral"),
            React.createElement(ds.SheetDescription, null, "Opções de navegação")
          )
        )
      );

    case "sidebar":
      return React.createElement(
        ds.SidebarProvider,
        null,
        React.createElement(
          ds.Sidebar,
          null,
          React.createElement(
            ds.SidebarContent,
            null,
            React.createElement(ds.SidebarGroup, null,
              React.createElement(ds.SidebarGroupLabel, null, "Módulos"),
              React.createElement(ds.SidebarMenu, null,
                React.createElement(ds.SidebarMenuItem, null,
                  React.createElement(ds.SidebarMenuButton, { asChild: true }, React.createElement("a", { href: "#" }, "Painel"))
                )
              )
            )
          )
        )
      );

    case "sidebar-trigger":
      return React.createElement(
        ds.SidebarProvider,
        null,
        React.createElement(ds.SidebarTrigger, { "aria-label": "Alternar barra lateral" })
      );

    case "skeleton":
      return React.createElement(ds.Skeleton, { className: "h-5 w-24" });

    case "slider":
      return React.createElement(ds.Slider, { defaultValue: [50], max: 100, step: 1, "aria-label": "Raio de busca em km" });

    case "spinner":
      return React.createElement(ds.Spinner, { label: "Carregando protocolos" });

    case "switch":
      return React.createElement(ds.Switch, { "aria-label": "Notificações por e-mail" });

    case "table":
      return React.createElement(
        ds.Table,
        null,
        React.createElement(
          ds.TableHeader,
          null,
          React.createElement(
            ds.TableRow,
            null,
            React.createElement(ds.TableHead, null, "Coluna 1")
          )
        ),
        React.createElement(
          ds.TableBody,
          null,
          React.createElement(
            ds.TableRow,
            null,
            React.createElement(ds.TableCell, null, "Dado 1")
          )
        )
      );

    case "tabs":
      return React.createElement(
        ds.Tabs,
        { defaultValue: "tab-1" },
        React.createElement(
          ds.TabsList,
          null,
          React.createElement(ds.TabsTrigger, { value: "tab-1" }, "Aba 1"),
          React.createElement(ds.TabsTrigger, { value: "tab-2" }, "Aba 2")
        ),
        React.createElement(ds.TabsContent, { value: "tab-1" }, "Conteúdo Aba 1"),
        React.createElement(ds.TabsContent, { value: "tab-2" }, "Conteúdo Aba 2")
      );

    case "textarea":
      return React.createElement(ds.Textarea, { "aria-label": "Observações", placeholder: "Observações..." });

    case "timeline":
      return React.createElement(
        ds.Timeline,
        null,
        React.createElement(
          ds.TimelineItem,
          null,
          React.createElement(
            ds.TimelineSeparator,
            null,
            React.createElement(ds.TimelineDot, { variant: "success", srLabel: "Concluído" }),
            React.createElement(ds.TimelineConnector)
          ),
          React.createElement(
            ds.TimelineContent,
            null,
            React.createElement(ds.TimelineTitle, null, "Protocolo aberto"),
            React.createElement(ds.TimelineDescription, null, "10/10/2026")
          )
        ),
        React.createElement(
          ds.TimelineItem,
          null,
          React.createElement(
            ds.TimelineSeparator,
            null,
            React.createElement(ds.TimelineDot, { srLabel: "Em andamento" })
          ),
          React.createElement(
            ds.TimelineContent,
            null,
            React.createElement(ds.TimelineTitle, null, "Em análise"),
            React.createElement(ds.TimelineDescription, null, "Aguardando parecer")
          )
        )
      );

    case "toast":
      return React.createElement(
        ds.ToastProvider,
        null,
        React.createElement(
          ds.Toast,
          { open: true },
          React.createElement(ds.ToastTitle, null, "Notificação"),
          React.createElement(ds.ToastDescription, null, "Arquivo salvo com sucesso")
        ),
        React.createElement(ds.Toaster, null)
      );

    case "toggle":
      return React.createElement(ds.Toggle, { "aria-label": "Negrito" }, "B");

    case "tooltip":
      return React.createElement(
        ds.TooltipProvider,
        null,
        React.createElement(
          ds.Tooltip,
          { open: true },
          React.createElement(ds.TooltipTrigger, { asChild: true }, React.createElement("button", null, "Ajuda")),
          React.createElement(ds.TooltipContent, null, "Informações adicionais")
        )
      );

    default:
      return null;
  }
}

export async function checkSmokeAndA11y() {
  console.log("▶ [4/5 e 5/5] Executando Smoke de Renderização e Varredura a11y (axe-core)...");

  const errors = [];
  let renderedCount = 0;
  let a11yScannedCount = 0;

  for (const comp of dsComponents) {
    const code = comp.code;
    let element = null;

    try {
      element = getComponentElement(code);
    } catch (err) {
      errors.push(`Falha ao instanciar elemento de '${code}': ${err.message}`);
      continue;
    }

    if (!element) {
      errors.push(`Componente '${code}' não possui elemento de teste configurado no smoke.`);
      continue;
    }

    let html = "";
    try {
      html = ReactDOMServer.renderToString(element);
      renderedCount++;
    } catch (err) {
      errors.push(`Falha ao renderizar componente '${code}': ${err.message}`);
      continue;
    }

    // Varredura de Acessibilidade com axe-core
    try {
      const dom = new JSDOM(`<!DOCTYPE html><html lang="pt-BR"><head><title>Smoke ${code}</title></head><body><main>${html}</main></body></html>`);
      const results = await axe.run(dom.window.document.body, {
        rules: {
          // Desabilita checagem de cor que depende de CSS/layout engine em JSDOM
          "color-contrast": { enabled: false },
        },
      });

      const severeViolations = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      );

      if (severeViolations.length > 0) {
        for (const viol of severeViolations) {
          errors.push(`Violação a11y [${viol.impact}] no componente '${code}': ${viol.help} (${viol.id})`);
        }
      } else {
        a11yScannedCount++;
      }
    } catch (err) {
      errors.push(`Erro durante verificação axe-core em '${code}': ${err.message}`);
    }
  }

  console.log(`  ✓ ${renderedCount}/${dsComponents.length} componentes renderizados com sucesso no smoke.`);
  console.log(`  ✓ ${a11yScannedCount}/${dsComponents.length} componentes aprovados na varredura a11y (zero serious/critical).`);

  if (errors.length > 0) {
    console.error("✖ Falha no Smoke ou na Varredura a11y:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    throw new Error(`Smoke / A11y falhou com ${errors.length} erro(s).`);
  }
}
