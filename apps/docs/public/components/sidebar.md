---
title: "Barra lateral"
code: "sidebar"
slug: "sidebar"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/sidebar.tsx"
category: "navegacao"
variants: "side: left · right · variant: sidebar · floating · inset · collapsible: offcanvas · icon · none · as (Sidebar): nav (padrão) · aside · div · labels (Sidebar): navigation ('Menu lateral') · mobileTitle ('Menu de navegação') · close ('Fechar menu') · as (SidebarInset): main (padrão) · div · section · label (SidebarTrigger): padrão 'Alternar barra lateral' · SidebarMenuButton: isActive (aria-current=page) · tooltip (string ou props do TooltipContent) · asChild · a11y: landmark nav/aside com aria-label · gaveta mobile com focus trap, Esc e retorno de foco · aria-expanded/aria-controls no gatilho · aria-current=page no item ativo · alvos de 44px · barra offcanvas recolhida fica inert · composição: SidebarProvider · Sidebar · SidebarTrigger · SidebarInset · SidebarHeader · SidebarContent · SidebarFooter · SidebarGroup · SidebarGroupLabel · SidebarGroupContent · SidebarMenu · SidebarMenuItem · SidebarMenuButton · SidebarMenuSub · SidebarMenuSubItem · SidebarMenuSubButton · SidebarSeparator · SidebarRail"
---

# Barra lateral — `sidebar`

> Shell completo: SidebarProvider + Sidebar + Header/Content/Footer + grupos, menus, colapso e mobile. Abaixo de 768px (48rem, via `matchMedia`) a Sidebar vira gaveta modal (Radix Dialog): foco preso, Esc fecha, conteúdo de trás inerte, foco volta a quem abriu e botão visível "Fechar menu" (44×44). No desktop renderiza um landmark `<nav aria-label="Menu lateral">`. `SidebarMenuButton isActive` gera `aria-current="page"`; `tooltip` aparece só no modo recolhido (`collapsible="icon"`). `SidebarTrigger` (44×44) expõe `aria-expanded` e `aria-controls`.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/sidebar.tsx) | **Categoria:** Navegação | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/sidebar/

## Variantes

- **side**: left · right
- **variant**: sidebar · floating · inset
- **collapsible**: offcanvas · icon · none
- **as (Sidebar)**: nav (padrão) · aside · div
- **labels (Sidebar)**: navigation ("Menu lateral") · mobileTitle ("Menu de navegação") · close ("Fechar menu")
- **as (SidebarInset)**: main (padrão) · div · section
- **label (SidebarTrigger)**: padrão "Alternar barra lateral"
- **SidebarMenuButton**: isActive (aria-current=page) · tooltip (string ou props do TooltipContent) · asChild
- **a11y**: landmark nav/aside com aria-label · gaveta mobile com focus trap, Esc e retorno de foco · aria-expanded/aria-controls no gatilho · aria-current=page no item ativo · alvos de 44px · barra offcanvas recolhida fica inert
- **composição**: SidebarProvider · Sidebar · SidebarTrigger · SidebarInset · SidebarHeader · SidebarContent · SidebarFooter · SidebarGroup · SidebarGroupLabel · SidebarGroupContent · SidebarMenu · SidebarMenuItem · SidebarMenuButton · SidebarMenuSub · SidebarMenuSubItem · SidebarMenuSubButton · SidebarSeparator · SidebarRail

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao. A receita de formulário (React Hook Form + Zod + FormField + ErrorSummary) usa ainda react-hook-form e @hookform/resolvers, opcionais e fora do kit: npm install react-hook-form @hookform/resolvers@^5 zod@^4.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

No CSS global do app (src/index.css no Vite, app/globals.css no Next.js), nunca via import em JS: o tokens.css tem @theme inline e @utility, que só o Tailwind processa. fonts.css antes do tokens.css. O caminho do @source é relativo ao arquivo CSS (src/app/globals.css usa ../../node_modules/...).

> Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (patch) que ainda não estão no npm. O @semec/ds@4.4.1 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.4.2. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SkipLink, Header, HeaderBrand, Heading } from "@semec/ds/react";
import { LayoutDashboard } from "lucide-react";

<SidebarProvider>
  <Sidebar>
    <SidebarHeader>Logo</SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive>Dashboard</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>Protocolos</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>Footer</SidebarFooter>
  </Sidebar>
  {/* SidebarInset renderiza <main> por padrão: não aninhe outro <main> dentro dele.
      Se o layout já tem o próprio <main>, use <SidebarInset as="div">. */}
  <SidebarInset>
    <SidebarTrigger />
    <div className="p-4">Conteúdo</div>
  </SidebarInset>
</SidebarProvider>

// Painel com Header (composição única, TST-04): SkipLink antes do SidebarProvider,
// Header dentro do SidebarInset (as="div") e o <main> depois do Header.
// Header antes do provider fica sob a Sidebar fixa (marca focada sem aparecer).
<>
  <SkipLink />
  <SidebarProvider>
    <Sidebar>{/* … */}</Sidebar>
    <SidebarInset as="div">
      <Header>
        {/* Gatilho e marca num grupo à esquerda (o Header é justify-between) */}
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger />
          <HeaderBrand orgName="SEMEC" href="/" logo={<img src="/marca.svg" alt="Prefeitura de Porto Velho" />} serviceName="Gestão de protocolos" />
        </div>
      </Header>
      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-[75rem] px-4 py-8">
        <Heading level={1}>Protocolos</Heading>
      </main>
    </SidebarInset>
  </SidebarProvider>
</>

// Item ativo com link (aria-current="page" vem de isActive) e tooltip no modo recolhido
<Sidebar collapsible="icon" labels={{ navigation: "Menu do servidor" }}>
  <SidebarContent>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive tooltip="Painel">
          <a href="/painel"><LayoutDashboard aria-hidden="true" /><span>Painel</span></a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarContent>
</Sidebar>
```

## Prompt para IA

```text
Use o componente `Sidebar` (Barra lateral) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Shell completo: SidebarProvider + Sidebar + Header/Content/Footer + grupos, menus, colapso e mobile. Abaixo de 768px (48rem, via `matchMedia`) a Sidebar vira gaveta modal (Radix Dialog): foco preso, Esc fecha, conteúdo de trás inerte, foco volta a quem abriu e botão visível "Fechar menu" (44×44). No desktop renderiza um landmark `<nav aria-label="Menu lateral">`. `SidebarMenuButton isActive` gera `aria-current="page"`; `tooltip` aparece só no modo recolhido (`collapsible="icon"`). `SidebarTrigger` (44×44) expõe `aria-expanded` e `aria-controls`. API e variantes: side: left · right · variant: sidebar · floating · inset · collapsible: offcanvas · icon · none · as (Sidebar): nav (padrão) · aside · div · labels (Sidebar): navigation ("Menu lateral") · mobileTitle ("Menu de navegação") · close ("Fechar menu") · as (SidebarInset): main (padrão) · div · section · label (SidebarTrigger): padrão "Alternar barra lateral" · SidebarMenuButton: isActive (aria-current=page) · tooltip (string ou props do TooltipContent) · asChild · a11y: landmark nav/aside com aria-label · gaveta mobile com focus trap, Esc e retorno de foco · aria-expanded/aria-controls no gatilho · aria-current=page no item ativo · alvos de 44px · barra offcanvas recolhida fica inert · composição: SidebarProvider · Sidebar · SidebarTrigger · SidebarInset · SidebarHeader · SidebarContent · SidebarFooter · SidebarGroup · SidebarGroupLabel · SidebarGroupContent · SidebarMenu · SidebarMenuItem · SidebarMenuButton · SidebarMenuSub · SidebarMenuSubItem · SidebarMenuSubButton · SidebarSeparator · SidebarRail. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Slot } from "@radix-ui/react-slot";
import { PanelLeft, X } from "lucide-react";

import { cn } from "../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
/** 44px do botão recolhido + 2 × 8px do padding do grupo (AUD-10). */
const SIDEBAR_WIDTH_ICON = "3.75rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

/**
 * Breakpoint único da Sidebar (AUD-33): abaixo de 48rem (768px) vira gaveta.
 * É o complemento exato do `md:` do Tailwind, que a versão desktop usa
 * (`hidden md:block`), então nunca há faixa sem nenhuma das duas.
 */
const SIDEBAR_MOBILE_QUERY = "not all and (min-width: 48rem)";

function subscribeMobileQuery(onChange: () => void) {
  const mql = window.matchMedia(SIDEBAR_MOBILE_QUERY);
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }
  // Safari < 14
  mql.addListener(onChange);
  return () => mql.removeListener(onChange);
}

function getMobileQuerySnapshot() {
  return window.matchMedia(SIDEBAR_MOBILE_QUERY).matches;
}

function getMobileQueryServerSnapshot() {
  return false;
}

/** `matchMedia` com listener; no servidor (SSR) responde `false` (desktop). */
function useSidebarIsMobile() {
  return React.useSyncExternalStore(
    subscribeMobileQuery,
    getMobileQuerySnapshot,
    getMobileQueryServerSnapshot
  );
}

type SidebarContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
  toggleSidebar: () => void;
  mobileTriggerRef: React.RefObject<HTMLButtonElement | null>;
  mobilePanelRef: React.RefObject<HTMLDivElement | null>;
  /** `id` gerado para o painel da Sidebar (quando ela não recebe `id`). */
  panelId: string;
  /** `id` do painel montado no momento (alvo do `aria-controls` do `SidebarTrigger`); `null` sem Sidebar. */
  controlsId: string | null;
  setPanelId: (id: string | null) => void;
  /** Wrapper do provider: destino do portal da gaveta (herda as variáveis `--sidebar-*`). */
  portalContainer: HTMLElement | null;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

const defaultSidebarContext: SidebarContext = {
  state: "expanded",
  open: true,
  setOpen: () => {},
  openMobile: false,
  setOpenMobile: () => {},
  isMobile: false,
  toggleSidebar: () => {},
  mobileTriggerRef: { current: null },
  mobilePanelRef: { current: null },
  panelId: "",
  controlsId: null,
  setPanelId: () => {},
  portalContainer: null,
};

function useSidebar() {
  return React.useContext(SidebarContext) ?? defaultSidebarContext;
}

export interface SidebarProviderProps extends React.ComponentProps<"div"> {
  /** Estado inicial (não controlado) da Sidebar desktop. Padrão: `true`. */
  defaultOpen?: boolean;
  /** Estado controlado da Sidebar desktop. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SidebarProvider = React.forwardRef<HTMLDivElement, SidebarProviderProps>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useSidebarIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);
    const mobileTriggerRef = React.useRef<HTMLButtonElement | null>(null);
    const mobilePanelRef = React.useRef<HTMLDivElement | null>(null);
    const [portalContainer, setPortalContainer] =
      React.useState<HTMLDivElement | null>(null);
    const generatedId = React.useId();
    const panelId = `sidebar-${generatedId.replace(/:/g, "")}`;
    const [controlsId, setPanelId] = React.useState<string | null>(null);

    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setOpenProp, open]
    );

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((prev) => !prev)
        : setOpen((prev) => !prev);
    }, [isMobile, setOpen]);

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    // Ao sair do modo gaveta (ex.: girar o tablet), fecha a gaveta para ela
    // não reabrir sozinha na próxima vez que a tela estreitar.
    React.useEffect(() => {
      if (!isMobile) setOpenMobile(false);
    }, [isMobile]);

    const wrapperRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        setPortalContainer(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    const state = open ? "expanded" : "collapsed";

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
        mobileTriggerRef,
        mobilePanelRef,
        panelId,
        controlsId,
        setPanelId,
        portalContainer,
      }),
      [
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
        panelId,
        controlsId,
        portalContainer,
      ]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className
            )}
            ref={wrapperRef}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = "SidebarProvider";

/** Textos embutidos na Sidebar (AUD-31). Todos têm padrão em PT-BR. */
export interface SidebarLabels {
  /** Nome do landmark (`<nav>`/`<aside>`), no desktop e dentro da gaveta. Padrão: "Menu lateral". */
  navigation: string;
  /** Título acessível (sr-only) da gaveta mobile. Padrão: "Menu de navegação". */
  mobileTitle: string;
  /** Nome do botão visível que fecha a gaveta mobile. Padrão: "Fechar menu". */
  close: string;
}

const defaultSidebarLabels: SidebarLabels = {
  navigation: "Menu lateral",
  mobileTitle: "Menu de navegação",
  close: "Fechar menu",
};

export interface SidebarProps extends React.ComponentProps<"div"> {
  /** Impede interação e foco no painel, também no React 18. */
  inert?: boolean;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  /**
   * Elemento do landmark que envolve o conteúdo. Padrão: `"nav"`.
   * Use `"aside"` quando a barra não for de navegação, ou `"div"` quando você
   * já tiver um `<nav>` próprio dentro dela (evita landmark duplicado).
   */
  as?: "nav" | "aside" | "div";
  /** Sobrescreve os textos embutidos. `aria-label` direto também vale para o landmark. */
  labels?: Partial<SidebarLabels>;
}

const mobileFocusableFallback =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      as: Landmark = "nav",
      labels,
      className,
      children,
      id: idProp,
      "aria-label": ariaLabelProp,
      inert: inertProp,
      ...props
    },
    ref
  ) => {
    const {
      isMobile,
      state,
      openMobile,
      setOpenMobile,
      mobileTriggerRef,
      mobilePanelRef,
      panelId,
      setPanelId,
      portalContainer,
    } = useSidebar();
    const l = { ...defaultSidebarLabels, ...labels };
    const landmarkLabel =
      Landmark === "div" ? undefined : ariaLabelProp ?? l.navigation;
    const restoreFocusRef = React.useRef<HTMLElement | null>(null);
    const inertPanelRef = React.useRef<HTMLDivElement | null>(null);
    const hiddenOffcanvas = !isMobile && state === "collapsed" && collapsible === "offcanvas";
    // React 18 descarta `inert` booleano no JSX. O ref aplica a propriedade
    // antes do foco e reaplica quando o estado muda ou o painel é remontado.
    const panelRef = React.useCallback((node: HTMLDivElement | null) => {
      inertPanelRef.current = node;
      if (node) node.inert = Boolean(inertProp ?? hiddenOffcanvas);
      if (isMobile) mobilePanelRef.current = node;
      if (isMobile || collapsible === "none") {
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }
    }, [inertProp, hiddenOffcanvas, isMobile, collapsible, mobilePanelRef, ref]);
    // O Radix pode manter o ref composto estável quando a prop muda.
    React.useEffect(() => {
      if (inertPanelRef.current) {
        inertPanelRef.current.inert = Boolean(inertProp ?? hiddenOffcanvas);
      }
    }, [inertProp, hiddenOffcanvas]);

    const id = idProp ?? (panelId || undefined);

    // Registra o painel montado para o `aria-controls` do SidebarTrigger.
    React.useEffect(() => {
      if (!id) return;
      setPanelId(id);
      return () => setPanelId(null);
    }, [id, setPanelId]);

    if (collapsible === "none") {
      return (
        <Landmark
          ref={panelRef}
          id={id}
          aria-label={landmarkLabel}
          data-sidebar="sidebar"
          className={cn(
            "flex h-full w-[var(--sidebar-width)] min-w-0 flex-col bg-sidebar text-sidebar-foreground",
            className
          )}
          {...props}
        >
          {children}
        </Landmark>
      );
    }

    if (isMobile) {
      // Gaveta mobile sobre o Radix Dialog (AUD-09): foco preso, Esc fecha,
      // conteúdo de trás inerte (aria-hidden + scroll travado) e o foco
      // volta para quem abriu.
      return (
        <DialogPrimitive.Root open={openMobile} onOpenChange={setOpenMobile}>
          <DialogPrimitive.Portal container={portalContainer ?? undefined}>
            <DialogPrimitive.Overlay
              data-sidebar="overlay"
              className="fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            />
            <DialogPrimitive.Content
              ref={panelRef}
              id={id}
              aria-describedby={undefined}
              data-sidebar="sidebar"
              data-mobile="true"
              data-side={side}
              onOpenAutoFocus={(event) => {
                const active = document.activeElement;
                restoreFocusRef.current =
                  active instanceof HTMLElement && active !== document.body
                    ? active
                    : null;
                // Foco inicial no primeiro item do menu, não no botão de fechar.
                const first = mobilePanelRef.current
                  ?.querySelector('[data-sidebar="sidebar-body"]')
                  ?.querySelector<HTMLElement>(mobileFocusableFallback);
                if (first) {
                  event.preventDefault();
                  first.focus();
                }
              }}
              onCloseAutoFocus={(event) => {
                // Sem DialogTrigger, o Radix não sabe para onde devolver o foco.
                event.preventDefault();
                const previous = restoreFocusRef.current;
                const target =
                  previous && previous.isConnected
                    ? previous
                    : mobileTriggerRef.current;
                restoreFocusRef.current = null;
                target?.focus();
              }}
              className={cn(
                "fixed inset-y-0 z-50 flex h-svh w-[var(--sidebar-width-mobile)] flex-col bg-sidebar p-0 text-sidebar-foreground shadow-elevation-3 outline-none duration-base ease-standard data-[state=open]:animate-in data-[state=closed]:animate-out",
                side === "left"
                  ? "left-0 border-r border-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
                  : "right-0 border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
                className
              )}
              {...props}
            >
              <DialogPrimitive.Title className="sr-only">
                {l.mobileTitle}
              </DialogPrimitive.Title>
              <div
                className={cn(
                  "flex shrink-0 p-2",
                  side === "left" ? "justify-end" : "justify-start"
                )}
              >
                <DialogPrimitive.Close
                  data-sidebar="close"
                  className="inline-flex size-11 items-center justify-center rounded-md text-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <X className="size-5" aria-hidden="true" />
                  <span className="sr-only">{l.close}</span>
                </DialogPrimitive.Close>
              </div>
              <Landmark
                aria-label={landmarkLabel}
                data-sidebar="sidebar-body"
                className="flex min-h-0 min-w-0 flex-1 flex-col"
              >
                {children}
              </Landmark>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      );
    }

    // Recolhida em `offcanvas`, a barra fica fora da tela: sai da ordem de
    // Tab e da árvore de acessibilidade até ser reaberta.

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        <div
          className={cn(
            "duration-base ease-standard relative h-svh w-[var(--sidebar-width)] bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_var(--space-4))]"
              : "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]"
          )}
        />
        <Landmark
          id={id}
          aria-label={landmarkLabel}
          ref={panelRef}
          className={cn(
            "duration-base ease-standard fixed inset-y-0 z-10 hidden h-svh w-[var(--sidebar-width)] transition-[left,right,width] ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_var(--space-4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)] group-data-[side=left]:border-r group-data-[side=right]:border-l border-border",
            className
          )}
          {...(props as React.HTMLAttributes<HTMLElement>)}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full min-w-0 flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-border group-data-[variant=floating]:shadow-elevation-1"
          >
            {children}
          </div>
        </Landmark>
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

export interface SidebarTriggerProps extends React.ComponentProps<"button"> {
  /** Nome acessível do gatilho. Padrão: "Alternar barra lateral". O estado vai em `aria-expanded`. */
  label?: string;
}

const SidebarTrigger = React.forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  ({ className, onClick, label = "Alternar barra lateral", ...props }, ref) => {
    const { toggleSidebar, mobileTriggerRef, isMobile, open, openMobile, controlsId } =
      useSidebar();
    const expanded = isMobile ? openMobile : open;
    // Na gaveta fechada o painel não existe no DOM; só aponta quando existe.
    const controls =
      controlsId && (!isMobile || openMobile) ? controlsId : undefined;

    return (
      <button
        ref={(node) => {
          mobileTriggerRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        type="button"
        data-sidebar="trigger"
        aria-expanded={expanded}
        aria-controls={controls}
        className={cn(
          "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-5",
          className
        )}
        onClick={(event) => {
          onClick?.(event);
          toggleSidebar();
        }}
        {...props}
      >
        <PanelLeft aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </button>
    );
  }
);
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Alternar barra lateral"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Alternar barra lateral"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  );
});
SidebarRail.displayName = "SidebarRail";

export interface SidebarInsetProps extends React.ComponentProps<"main"> {
  /**
   * Elemento renderizado. Padrão: `"main"` (compatível com versões anteriores).
   * Use `"div"` (ou `"section"`) quando o layout já tiver o seu próprio `<main>`,
   * para não aninhar dois landmarks `main`.
   */
  as?: "main" | "div" | "section";
}

const SidebarInset = React.forwardRef<HTMLDivElement, SidebarInsetProps>(
  ({ as: Comp = "main", className, ...props }, ref) => (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(
        "relative flex min-h-svh min-w-0 flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-lg md:peer-data-[variant=inset]:shadow-elevation-1",
        className
      )}
      {...props}
    />
  )
);
SidebarInset.displayName = "SidebarInset";

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="header"
    className={cn("flex flex-col gap-2 p-2", className)}
    {...props}
  />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="footer"
    className={cn("flex flex-col gap-2 p-2", className)}
    {...props}
  />
));
SidebarFooter.displayName = "SidebarFooter";

const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="separator"
    className={cn("mx-2 w-auto bg-border h-px", className)}
    {...props}
  />
));
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="content"
    className={cn(
      "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
      className
    )}
    {...props}
  />
));
SidebarContent.displayName = "SidebarContent";

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
});
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "duration-base ease-standard flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none focus-visible:outline-hidden ring-sidebar-ring transition-[margin,opacity] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
});
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
));
SidebarMenuItem.displayName = "SidebarMenuItem";


export interface SidebarMenuButtonProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
  /** Item da página atual: aplica o estilo ativo e `aria-current="page"`. */
  isActive?: boolean;
  /**
   * Tooltip exibido só no modo recolhido (`collapsible="icon"`), à direita do
   * botão. Texto, ou props do `TooltipContent` (ex.: `{ children, side }`).
   */
  tooltip?:
    | string
    | React.ComponentProps<"div">
    | React.ComponentPropsWithoutRef<typeof TooltipContent>;
}

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(
  (
    {
      asChild = false,
      isActive = false,
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const insideProvider = React.useContext(SidebarContext) !== null;
    const { isMobile, state } = useSidebar();
    const [tooltipOpen, setTooltipOpen] = React.useState(false);
    const Comp = asChild ? Slot : "button";

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-active={isActive}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "peer/menu-button flex min-h-11 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none focus-visible:outline-hidden ring-sidebar-ring transition-[width,height,padding] duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground data-[state=open]:hover:bg-accent data-[state=open]:hover:text-accent-foreground",
          "group-data-[collapsible=icon]:!size-11 group-data-[collapsible=icon]:!p-3.5 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
          className
        )}
        {...props}
      />
    );

    // Fora de um SidebarProvider não há modo recolhido (nem TooltipProvider).
    if (!tooltip || !insideProvider) {
      return button;
    }

    const tooltipProps = (
      typeof tooltip === "string" ? { children: tooltip } : tooltip
    ) as React.ComponentPropsWithoutRef<typeof TooltipContent>;
    const showTooltip = state === "collapsed" && !isMobile;

    // Sempre envolvido no Tooltip (controlado) para não remontar o botão —
    // e perder o foco — quando a barra recolhe ou expande.
    return (
      <Tooltip open={showTooltip && tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" align="center" {...tooltipProps} />
      </Tooltip>
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";


const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-border px-2.5 py-0.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
));
SidebarMenuSub.displayName = "SidebarMenuSub";

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />);
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";


export interface SidebarMenuSubButtonProps extends React.ComponentProps<"a"> {
  asChild?: boolean;
  size?: "sm" | "md";
  /** Subitem da página atual: aplica o estilo ativo e `aria-current="page"`. */
  isActive?: boolean;
}

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  SidebarMenuSubButtonProps
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-h-11 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none focus-visible:outline-hidden ring-sidebar-ring hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
