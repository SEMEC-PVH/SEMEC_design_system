import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Breadcrumb,
  Footer,
  FooterBottom,
  FooterContent,
  FooterLink,
  FooterLinks,
  FooterSection,
  Header,
  HeaderBrand,
  HeaderNav,
  HeaderNavLink,
  Link,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  SidebarToggleButton,
  SkipLink,
} from "../src/index";
import { severeViolations } from "./axe";

afterEach(() => {
  vi.restoreAllMocks();
});

const logo = <img src="/logo.svg" alt="Prefeitura de Porto Velho" />;

describe("Header", () => {
  it("é o landmark banner, com a marca linkando para \"/\" e o texto PT-BR \"ir para o início\"", () => {
    render(
      <Header>
        <HeaderBrand orgName="SEMEC" serviceName="Matrícula" logo={logo} />
      </Header>
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    const marca = screen.getByRole("link", { name: /ir para o início/ });
    expect(marca).toHaveAttribute("href", "/");
    expect(marca).toHaveAccessibleName(/^Prefeitura de Porto Velho.*Matrícula\s*— ir para o início$/);
  });

  // TST-F2-05 / TST-12 (#54): o separador "|" é aria-hidden; sem espaço em
  // texto entre `orgName` e `serviceName` o nome acessível juntava as palavras
  // ("…SEMECMatrícula— ir para o início", medido no Chromium via CDP).
  it("TST-F2-05: o nome da marca separa orgName, serviceName e o travessão", () => {
    render(<HeaderBrand orgName="SEMEC" serviceName="Matrícula" logo={logo} />);
    const marca = screen.getByRole("link");
    expect(marca).toHaveAccessibleName(/SEMEC\s+Matrícula/);
    expect(marca).toHaveAccessibleName(/^Prefeitura de Porto Velho\s+SEMEC\s+Matrícula\s+—\s+ir para o início$/);
  });

  // TST-10 (#54): a marca é alvo de toque; precisa de 44 px de altura no mobile.
  it("TST-10: o link da marca tem altura mínima de 44 px (min-h-11)", () => {
    render(<HeaderBrand orgName="SEMEC" serviceName="Matrícula" logo={logo} />);
    expect(screen.getByRole("link")).toHaveClass("min-h-11");
  });

  it("o separador \"|\" e o placeholder do logo ficam fora da árvore de acessibilidade", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<HeaderBrand orgName="SEMEC" serviceName="Matrícula" />);
    const marca = screen.getByRole("link");
    expect(marca).toHaveAccessibleName(/^SEMEC.*Matrícula\s*— ir para o início$/);
    expect(marca).not.toHaveAccessibleName(/\|/);
    expect(within(marca).getByText("|")).toHaveAttribute("aria-hidden", "true");
    expect(within(marca).getByText("Logo")).toHaveAttribute("aria-hidden", "true");
  });

  it("sem logo avisa no console em desenvolvimento; com logo, não", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { unmount } = render(<HeaderBrand />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain("HeaderBrand sem `logo`");
    unmount();
    warn.mockClear();
    render(<HeaderBrand logo={logo} />);
    expect(warn).not.toHaveBeenCalled();
  });

  it("href=\"\" renderiza a marca sem link; homeLabel sobrescreve o texto do link", () => {
    const { rerender } = render(<HeaderBrand href="" logo={logo} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    rerender(<HeaderBrand href="/inicio" homeLabel="voltar à página inicial" logo={logo} />);
    expect(screen.getByRole("link", { name: /voltar à página inicial$/ })).toHaveAttribute("href", "/inicio");
  });

  it("truncate liga o corte em uma linha; o padrão quebra linha", () => {
    const { rerender } = render(<HeaderBrand logo={logo} serviceName="Matrícula" />);
    const nome = () => screen.getByText("Matrícula").parentElement!;
    expect(nome()).toHaveClass("break-words");
    rerender(<HeaderBrand logo={logo} serviceName="Matrícula" truncate />);
    expect(nome()).toHaveClass("truncate");
  });

  it("HeaderNav é um <nav> rotulado e HeaderNavLink current marca aria-current=page com 44px", () => {
    render(
      <HeaderNav>
        <HeaderNavLink href="/prefeitura" current>
          Prefeitura
        </HeaderNavLink>
        <HeaderNavLink href="/servicos">Serviços</HeaderNavLink>
      </HeaderNav>
    );
    const nav = screen.getByRole("navigation", { name: "Principal" });
    expect(within(nav).getByRole("link", { name: "Prefeitura" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Serviços" })).not.toHaveAttribute("aria-current");
    expect(within(nav).getByRole("link", { name: "Serviços" })).toHaveClass("min-h-11");
  });

  it("HeaderNav aceita aria-label próprio", () => {
    render(<HeaderNav aria-label="Menu do servidor" />);
    expect(screen.getByRole("navigation", { name: "Menu do servidor" })).toBeInTheDocument();
  });

  it("composição completa: zero serious/critical", async () => {
    render(
      <>
        <Header>
          <HeaderBrand orgName="SEMEC" serviceName="Matrícula" logo={logo} />
          <HeaderNav>
            <HeaderNavLink href="/" current>
              Início
            </HeaderNavLink>
          </HeaderNav>
        </Header>
        <main>
          <h1>Matrícula</h1>
        </main>
      </>
    );
    expect(await severeViolations()).toEqual([]);
  });
});

describe("SkipLink", () => {
  it("texto PT-BR padrão, href #conteudo e é o 1º Tab da página", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SkipLink />
        <a href="/outro">Outro link</a>
        <main id="conteudo">Conteúdo</main>
      </>
    );
    const link = screen.getByRole("link", { name: "Pular para o conteúdo principal" });
    expect(link).toHaveAttribute("href", "#conteudo");
    await user.tab();
    expect(link).toHaveFocus();
  });

  it("oculto até o foco (sr-only + focus:not-sr-only) e com alvo de 44px no foco", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("sr-only", "focus:not-sr-only", "focus:min-h-11");
  });

  it("ativar leva o foco ao alvo e aplica tabindex=-1 se ele não for focável", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SkipLink />
        <main id="conteudo">Conteúdo</main>
      </>
    );
    await user.tab();
    await user.keyboard("{Enter}");
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(main).toHaveFocus();
  });

  it("não sobrescreve um tabindex que o alvo já tem", async () => {
    render(
      <>
        <SkipLink href="#principal">Ir ao conteúdo</SkipLink>
        <div id="principal" tabIndex={0}>
          Conteúdo
        </div>
      </>
    );
    await userEvent.setup().click(screen.getByRole("link", { name: "Ir ao conteúdo" }));
    expect(screen.getByText("Conteúdo")).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("Conteúdo")).toHaveFocus();
  });

  it("onClick do consumidor roda e pode cancelar o foco (preventDefault)", async () => {
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault());
    render(
      <>
        <SkipLink onClick={onClick} />
        <main id="conteudo">Conteúdo</main>
      </>
    );
    await userEvent.setup().click(screen.getByRole("link"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("main")).not.toHaveFocus();
  });

  it("alvo inexistente não lança erro", async () => {
    render(<SkipLink href="#nada" />);
    await expect(userEvent.setup().click(screen.getByRole("link"))).resolves.toBeUndefined();
  });
});

describe("Breadcrumb", () => {
  const itens = [
    { label: "Início", href: "/" },
    { label: "Serviços", href: "/servicos" },
    { label: "IPTU" },
  ];

  it("nav \"Trilha de navegação\" com lista ordenada e um item por nível", () => {
    render(<Breadcrumb items={itens} />);
    const nav = screen.getByRole("navigation", { name: "Trilha de navegação" });
    const lista = within(nav).getByRole("list");
    expect(lista.tagName).toBe("OL");
    expect(within(lista).getAllByRole("listitem")).toHaveLength(3);
  });

  it("o último item é texto com aria-current=page (sem link); os anteriores são links", () => {
    render(<Breadcrumb items={itens} />);
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Serviços" })).toHaveAttribute("href", "/servicos");
    expect(screen.queryByRole("link", { name: "IPTU" })).not.toBeInTheDocument();
    expect(screen.getByText("IPTU")).toHaveAttribute("aria-current", "page");
  });

  it("o último item com href também não vira link", () => {
    render(<Breadcrumb items={[{ label: "Início", href: "/" }, { label: "Atual", href: "/atual" }]} />);
    expect(screen.queryByRole("link", { name: "Atual" })).not.toBeInTheDocument();
  });

  it("separadores aria-hidden, um a menos que os itens", () => {
    const { container } = render(<Breadcrumb items={itens} />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(2);
    for (const s of svgs) expect(s).toHaveAttribute("aria-hidden", "true");
  });

  it("aria-label sobrescrevível; zero serious/critical", async () => {
    render(
      <main>
        <Breadcrumb aria-label="Você está em" items={itens} />
      </main>
    );
    expect(screen.getByRole("navigation", { name: "Você está em" })).toBeInTheDocument();
    expect(await severeViolations()).toEqual([]);
  });
});

describe("Link", () => {
  it("é um <a> sublinhado por padrão (WCAG 1.4.1) com variant primary", () => {
    render(<Link href="/iptu">guia do IPTU</Link>);
    const link = screen.getByRole("link", { name: "guia do IPTU" });
    expect(link).toHaveAttribute("href", "/iptu");
    expect(link).toHaveClass("underline", "text-primary");
  });

  it("underline={false} só sublinha no hover; variants mudam a cor", () => {
    const { rerender } = render(
      <Link href="/" underline={false}>
        Serviços
      </Link>
    );
    expect(screen.getByRole("link")).toHaveClass("no-underline", "hover:underline");
    rerender(
      <Link href="/" variant="onSurface">
        Serviços
      </Link>
    );
    expect(screen.getByRole("link")).toHaveClass("text-foreground", "underline");
    rerender(
      <Link href="/" variant="muted">
        Serviços
      </Link>
    );
    expect(screen.getByRole("link")).toHaveClass("text-muted-foreground");
  });

  it("repassa atributos (target/rel) e o ref; tem anel de foco visível", () => {
    const ref = React.createRef<HTMLAnchorElement>();
    render(
      <Link ref={ref} href="https://portovelho.ro.gov.br" target="_blank" rel="noreferrer">
        Portal
      </Link>
    );
    expect(ref.current).toHaveAttribute("target", "_blank");
    expect(ref.current).toHaveClass("focus-visible:ring-2");
  });
});

describe("Footer", () => {
  it("landmark contentinfo, seções com título h2 padrão e links em <li> com 44px", () => {
    render(
      <Footer>
        <FooterContent>
          <FooterSection title="Serviços">
            <FooterLinks>
              <FooterLink href="/matricula">Matrícula</FooterLink>
              {null}
              <FooterLink href="/transporte">Transporte escolar</FooterLink>
            </FooterLinks>
          </FooterSection>
        </FooterContent>
        <FooterBottom>
          <p>© 2026 Prefeitura de Porto Velho · SEMEC</p>
        </FooterBottom>
      </Footer>
    );
    const rodape = screen.getByRole("contentinfo");
    expect(within(rodape).getByRole("heading", { level: 2, name: "Serviços" })).toBeInTheDocument();
    const lista = within(rodape).getByRole("list");
    expect(within(lista).getAllByRole("listitem")).toHaveLength(2);
    const link = within(rodape).getByRole("link", { name: "Matrícula" });
    expect(link).toHaveClass("min-h-11", "underline");
  });

  it("titleAs troca o nível do título da seção", () => {
    render(<FooterSection title="Atendimento" titleAs="h3" />);
    expect(screen.getByRole("heading", { level: 3, name: "Atendimento" })).toBeInTheDocument();
  });

  it("zero serious/critical", async () => {
    render(
      <>
        <main>
          <h1>Página</h1>
        </main>
        <Footer>
          <FooterContent>
            <FooterSection title="Serviços">
              <FooterLinks>
                <FooterLink href="/matricula">Matrícula</FooterLink>
              </FooterLinks>
            </FooterSection>
          </FooterContent>
        </Footer>
      </>
    );
    expect(await severeViolations()).toEqual([]);
  });
});

describe("NavigationMenu", () => {
  function Menu(props: { "aria-label"?: string }) {
    return (
      <NavigationMenu {...props}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Serviços</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul>
                <li>
                  <NavigationMenuLink href="#iptu">IPTU</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#alvara">Alvará</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#inicio">Início</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
  }

  it("o <nav> se chama \"Menu principal\" por padrão (não \"Main\" do Radix) e aceita aria-label", () => {
    const { rerender } = render(<Menu />);
    expect(screen.getByRole("navigation", { name: "Menu principal" })).toBeInTheDocument();
    rerender(<Menu aria-label="Menu do servidor" />);
    expect(screen.getByRole("navigation", { name: "Menu do servidor" })).toBeInTheDocument();
  });

  it("gatilho de 44px com aria-expanded; Enter abre", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    const gatilho = screen.getByRole("button", { name: "Serviços" });
    expect(gatilho).toHaveClass("h-11");
    expect(gatilho).toHaveAttribute("aria-expanded", "false");
    gatilho.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(gatilho).toHaveAttribute("aria-expanded", "true"));
    expect(screen.getByRole("link", { name: "IPTU" })).toBeInTheDocument();
  });

  it("aberto: ArrowDown entra no conteúdo e Esc fecha devolvendo o foco ao gatilho", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    const gatilho = screen.getByRole("button", { name: "Serviços" });
    gatilho.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("link", { name: "IPTU" });
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(screen.getByRole("link", { name: "IPTU" })).toHaveFocus());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(gatilho).toHaveAttribute("aria-expanded", "false"));
    expect(gatilho).toHaveFocus();
  });

  it("aberto: Tab a partir do gatilho entra no conteúdo", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    const gatilho = screen.getByRole("button", { name: "Serviços" });
    gatilho.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("link", { name: "IPTU" });
    await user.tab();
    expect(screen.getByRole("link", { name: "IPTU" })).toHaveFocus();
  });
});

describe("SidebarToggleButton", () => {
  function Layout() {
    const [aberta, setAberta] = React.useState(false);
    return <SidebarToggleButton open={aberta} onToggle={() => setAberta(!aberta)} />;
  }

  it("controlado: \"Abrir menu\"/\"Fechar menu\" com aria-expanded; clique e Enter alternam", async () => {
    const user = userEvent.setup();
    render(<Layout />);
    const botao = screen.getByRole("button", { name: "Abrir menu" });
    expect(botao).toHaveAttribute("aria-expanded", "false");
    await user.click(botao);
    expect(screen.getByRole("button", { name: "Fechar menu" })).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveAttribute("aria-expanded", "false");
  });

  it("labelOpen/labelClosed e label fixo sobrescrevem; ícone decorativo", () => {
    const { rerender, container } = render(
      <SidebarToggleButton open labelOpen="Recolher navegação" labelClosed="Expandir navegação" />
    );
    expect(screen.getByRole("button", { name: "Recolher navegação" })).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    rerender(<SidebarToggleButton open={false} label="Menu" />);
    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  });

  it("zero serious/critical (aberto e fechado)", async () => {
    render(
      <main>
        <SidebarToggleButton open />
        <SidebarToggleButton open={false} />
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});
