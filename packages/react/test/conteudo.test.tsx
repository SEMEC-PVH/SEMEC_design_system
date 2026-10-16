import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Heading,
  Label,
  Progress,
  ScrollArea,
  SectionHeader,
  SemecProvider,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
  Button,
} from "../src/index";
import { severeViolations } from "./axe";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Alert", () => {
  it("destructive é role=alert; default, success e warning são role=status", () => {
    render(
      <>
        <Alert variant="destructive">Erro</Alert>
        <Alert>Info</Alert>
        <Alert variant="success">Ok</Alert>
        <Alert variant="warning">Atenção</Alert>
      </>
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Erro");
    expect(screen.getAllByRole("status").map((s) => s.textContent)).toEqual(["Info", "Ok", "Atenção"]);
  });

  it("announce sobrescreve o padrão e role explícito vence announce", () => {
    render(
      <>
        <Alert announce="off" data-testid="off">
          Estático
        </Alert>
        <Alert variant="warning" announce="assertive">
          Urgente
        </Alert>
        <Alert announce="assertive" role="note" data-testid="note">
          Nota
        </Alert>
      </>
    );
    expect(screen.getByTestId("off")).not.toHaveAttribute("role");
    expect(screen.getByRole("alert")).toHaveTextContent("Urgente");
    expect(screen.getByTestId("note")).toHaveAttribute("role", "note");
  });

  it("ícone automático decorativo; AlertTitle é div por padrão e aceita as=h2", () => {
    const { container } = render(
      <Alert announce="off">
        <AlertTitle>Carnê indisponível</AlertTitle>
        <AlertDescription>O sistema volta às 14h.</AlertDescription>
      </Alert>
    );
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    render(<AlertTitle as="h2">Como funciona</AlertTitle>);
    expect(screen.getByRole("heading", { level: 2, name: "Como funciona" })).toBeInTheDocument();
  });

  it("todas as variantes: zero serious/critical", async () => {
    render(
      <main>
        {(["default", "success", "warning", "destructive"] as const).map((v) => (
          <Alert key={v} variant={v}>
            <AlertTitle>{v}</AlertTitle>
            <AlertDescription>Texto</AlertDescription>
          </Alert>
        ))}
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});

describe("ErrorState", () => {
  it("role=alert + aria-live=assertive, título h3 padrão e botão PT-BR \"Tentar novamente\"", async () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="Não foi possível carregar os protocolos"
        description="Verifique sua rede."
        onRetry={onRetry}
      />
    );
    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveAttribute("aria-live", "assertive");
    expect(within(alerta).getByRole("heading", { level: 3 })).toHaveTextContent(
      "Não foi possível carregar os protocolos"
    );
    await userEvent.setup().click(within(alerta).getByRole("button", { name: "Tentar novamente" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("retryLabel e titleAs sobrescrevem; action personalizada substitui o onRetry", () => {
    const { rerender } = render(<ErrorState title="Falha" onRetry={() => {}} retryLabel="Recarregar" titleAs="h2" />);
    expect(screen.getByRole("button", { name: "Recarregar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Falha" })).toBeInTheDocument();
    rerender(<ErrorState title="Falha" onRetry={() => {}} action={<Button>Voltar ao início</Button>} />);
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar ao início" })).toBeInTheDocument();
  });

  it("inline: título <p> (não entra no sumário de títulos), também role=alert", () => {
    render(<ErrorState variant="inline" title="Falha ao atualizar indicador" onRetry={() => {}} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByText("Falha ao atualizar indicador").tagName).toBe("P");
  });

  it("ícones decorativos (aria-hidden) e sem ação quando não há onRetry/action", () => {
    const { container } = render(<ErrorState title="Falha" />);
    for (const svg of container.querySelectorAll("svg")) {
      expect(svg.closest("[aria-hidden='true']")).not.toBeNull();
    }
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("default e inline: zero serious/critical", async () => {
    render(
      <main>
        <h1>Painel</h1>
        <h2>Seção</h2>
        <ErrorState title="Falha geral" onRetry={() => {}} />
        <ErrorState variant="inline" title="Falha parcial" onRetry={() => {}} />
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});

describe("EmptyState", () => {
  it("título h3 padrão, titleAs, descrição, ação e ícone decorativo", () => {
    const { container } = render(
      <EmptyState
        icon={<svg />}
        title="Nenhum protocolo encontrado"
        titleAs="h2"
        description="Ajuste os filtros."
        action={<Button>Abrir requerimento</Button>}
      />
    );
    expect(screen.getByRole("heading", { level: 2, name: "Nenhum protocolo encontrado" })).toBeInTheDocument();
    expect(screen.getByText("Ajuste os filtros.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir requerimento" })).toBeInTheDocument();
    expect(container.querySelector("svg")!.parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("sem titleAs usa h3; não é região viva (estado estático)", () => {
    render(<EmptyState title="Vazio" />);
    expect(screen.getByRole("heading", { level: 3, name: "Vazio" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("Progress", () => {
  it("role=progressbar com nome por aria-labelledby, valor e texto em %", () => {
    render(
      <>
        <p id="envio">Envio dos documentos: 60% concluído</p>
        <Progress value={60} aria-labelledby="envio" />
      </>
    );
    const barra = screen.getByRole("progressbar", { name: "Envio dos documentos: 60% concluído" });
    expect(barra).toHaveAttribute("aria-valuenow", "60");
    expect(barra).toHaveAttribute("aria-valuemin", "0");
    expect(barra).toHaveAttribute("aria-valuemax", "100");
    expect(barra).toHaveAttribute("aria-valuetext", "60%");
  });

  it("max diferente de 100 e indeterminado (value=null) sem aria-valuenow", () => {
    const { rerender } = render(<Progress value={3} max={4} aria-label="Etapas" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "75%");
    rerender(<Progress value={null} aria-label="Etapas" />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-state", "indeterminate");
  });

  it("o indicador acompanha o valor", () => {
    const { container } = render(<Progress value={25} aria-label="Envio" />);
    const indicador = container.querySelector("[data-state] > div") as HTMLElement;
    expect(indicador.style.transform).toBe("translateX(-75%)");
  });

  // TST-F2-06: o indicador usa `translateX(-${100 - (value || 0)}%)`
  // (progress.tsx) sem considerar `max`. Com max=4 e value=3, a barra mostra 3%
  // preenchido enquanto o leitor de tela anuncia 75% (aria-valuetext do Radix).
  it.fails("TST-F2-06: com max=4 e value=3 o indicador mostra 75% (translateX(-25%))", () => {
    const { container } = render(<Progress value={3} max={4} aria-label="Etapas" />);
    const indicador = container.querySelector("[data-state] > div") as HTMLElement;
    expect(indicador.style.transform).toBe("translateX(-25%)");
  });

  it("zero serious/critical", async () => {
    render(
      <main>
        <Progress value={60} aria-label="Envio" />
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});

describe("Skeleton", () => {
  it("é aria-hidden; o contêiner anuncia com aria-busy e texto sr-only", () => {
    render(
      <div aria-busy="true" data-testid="c">
        <p className="sr-only">Carregando protocolos…</p>
        <Skeleton className="h-4 w-3/4" data-testid="s" />
      </div>
    );
    expect(screen.getByTestId("s")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("s")).toHaveClass("bg-surface-sunken");
    expect(screen.getByTestId("c")).toHaveAttribute("aria-busy", "true");
  });
});

describe("Timeline", () => {
  function Linha() {
    return (
      <Timeline>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot variant="success" srLabel="Concluído" />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <TimelineTitle>Protocolo recebido</TimelineTitle>
            <TimelineDescription>12/08/2026 às 14:30</TimelineDescription>
          </TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot srLabel="Em andamento" />
          </TimelineSeparator>
          <TimelineContent>
            <TimelineTitle as="h3">Em análise</TimelineTitle>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    );
  }

  it("lista ordenada (ol/li), status em texto (srLabel) e conector aria-hidden", () => {
    const { container } = render(<Linha />);
    const lista = screen.getByRole("list");
    expect(lista.tagName).toBe("OL");
    const itens = within(lista).getAllByRole("listitem");
    expect(itens).toHaveLength(2);
    expect(itens[0]).toHaveTextContent("Concluído");
    expect(itens[1]).toHaveTextContent("Em andamento");
    expect(screen.getByText("Concluído")).toHaveClass("sr-only");
    expect(container.querySelector(".bg-border-strong")).toHaveAttribute("aria-hidden", "true");
  });

  it("TimelineTitle é div por padrão e aceita as; datas em dd/mm/aaaa ficam como vieram", () => {
    render(<Linha />);
    expect(screen.getByRole("heading", { level: 3, name: "Em análise" })).toBeInTheDocument();
    expect(screen.getByText("Protocolo recebido").tagName).toBe("DIV");
    expect(screen.getByText("12/08/2026 às 14:30")).toBeInTheDocument();
  });

  it("zero serious/critical", async () => {
    render(
      <main>
        <h1>Protocolo</h1>
        <h2>Andamento</h2>
        <Linha />
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});

/** Substitui `window.Image` para simular carga ou falha da foto (o jsdom não carrega imagens). */
function stubImagem(carrega: boolean) {
  class ImagemFalsa extends EventTarget {
    complete = false;
    naturalWidth = 0;
    referrerPolicy = "";
    crossOrigin: string | null = null;
    set src(_v: string) {
      setTimeout(() => {
        this.complete = true;
        this.naturalWidth = carrega ? 40 : 0;
        this.dispatchEvent(new Event(carrega ? "load" : "error"));
      }, 0);
    }
  }
  vi.stubGlobal("Image", ImagemFalsa);
}

describe("Avatar", () => {
  it("foto carregada: mostra a <img> com alt e esconde o fallback", async () => {
    stubImagem(true);
    render(
      <Avatar>
        <AvatarImage src="/foto.jpg" alt="João Silva" />
        <AvatarFallback>JS</AvatarFallback>
      </Avatar>
    );
    expect(await screen.findByRole("img", { name: "João Silva" })).toBeInTheDocument();
    expect(screen.queryByText("JS")).not.toBeInTheDocument();
  });

  it("foto com erro: cai no fallback com as iniciais", async () => {
    stubImagem(false);
    render(
      <Avatar>
        <AvatarImage src="/quebrada.jpg" alt="João Silva" />
        <AvatarFallback>JS</AvatarFallback>
      </Avatar>
    );
    await act(() => new Promise((r) => setTimeout(r, 10)));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("delayMs adia o fallback (evita piscar enquanto a foto carrega)", async () => {
    vi.useFakeTimers();
    try {
      render(
        <Avatar>
          <AvatarFallback delayMs={600}>JS</AvatarFallback>
        </Avatar>
      );
      expect(screen.queryByText("JS")).not.toBeInTheDocument();
      await act(async () => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.getByText("JS")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  // TST-F2-07: com a foto quebrada, o nome da pessoa (alt da AvatarImage) some
  // e o leitor de tela lê só "JS". O manifest promete "fallback automático
  // (iniciais)" e o exemplo não dá ao fallback um nome equivalente ao alt.
  it.fails("TST-F2-07: com a foto quebrada, o avatar continua anunciando \"João Silva\"", async () => {
    stubImagem(false);
    const { container } = render(
      <Avatar>
        <AvatarImage src="/quebrada.jpg" alt="João Silva" />
        <AvatarFallback>JS</AvatarFallback>
      </Avatar>
    );
    await act(() => new Promise((r) => setTimeout(r, 10)));
    expect(container).toHaveTextContent("João Silva");
  });

  it("fallback: zero serious/critical", async () => {
    render(
      <main>
        <Avatar>
          <AvatarFallback>JS</AvatarFallback>
        </Avatar>
      </main>
    );
    expect(await severeViolations()).toEqual([]);
  });
});

describe("Heading", () => {
  it("level define o elemento (padrão h2) e size só o visual", () => {
    const { rerender } = render(<Heading>Dados do estudante</Heading>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass("text-xl");
    rerender(
      <Heading level={3} size={2}>
        Documentos
      </Heading>
    );
    const h = screen.getByRole("heading", { level: 3, name: "Documentos" });
    expect(h).toHaveClass("text-xl");
    expect(h).not.toHaveClass("text-lg");
  });

  it("os seis níveis viram h1–h6 e o ref chega ao elemento", () => {
    const ref = React.createRef<HTMLHeadingElement>();
    render(
      <>
        {([1, 2, 3, 4, 5, 6] as const).map((n) => (
          <Heading key={n} level={n} ref={n === 1 ? ref : undefined}>
            Nível {n}
          </Heading>
        ))}
      </>
    );
    for (const n of [1, 2, 3, 4, 5, 6]) {
      expect(screen.getByRole("heading", { level: n, name: `Nível ${n}` })).toBeInTheDocument();
    }
    expect(ref.current?.tagName).toBe("H1");
  });
});

describe("Card e SectionHeader", () => {
  it("CardTitle é div por padrão e as escolhe o nível; SectionHeader usa h2 por padrão", () => {
    render(
      <>
        <Card>
          <CardHeader>
            <CardTitle>Sem título semântico</CardTitle>
            <CardTitle as="h2">IPTU 2026</CardTitle>
          </CardHeader>
          <CardContent>Parcela em dia.</CardContent>
        </Card>
        <SectionHeader title="Dados pessoais" description="Preencha tudo" />
        <SectionHeader title="Endereço" titleAs="h3" />
      </>
    );
    expect(screen.getByText("Sem título semântico").tagName).toBe("DIV");
    expect(screen.getByRole("heading", { level: 2, name: "IPTU 2026" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Dados pessoais" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Endereço" })).toBeInTheDocument();
  });
});

describe("Separator", () => {
  it("decorativo (padrão) é role=none; decorative={false} é separator com orientação", () => {
    render(
      <>
        <Separator data-testid="d" />
        <Separator decorative={false} orientation="vertical" />
      </>
    );
    expect(screen.getByTestId("d")).toHaveAttribute("role", "none");
    const s = screen.getByRole("separator");
    expect(s).toHaveAttribute("aria-orientation", "vertical");
    expect(s).toHaveClass("w-px");
  });
});

describe("Badge", () => {
  it("renderiza o texto (status em texto, não só cor) e aceita as variantes", () => {
    render(
      <>
        {(["default", "secondary", "outline", "success", "warning", "danger", "info"] as const).map((v) => (
          <Badge key={v} variant={v}>
            {v}
          </Badge>
        ))}
      </>
    );
    for (const v of ["default", "success", "danger", "info"]) expect(screen.getByText(v)).toBeInTheDocument();
  });
});

describe("Table", () => {
  it("caption nomeia; TableHead tem scope=col; aria-sort do consumidor é repassado", () => {
    render(
      <Table>
        <TableCaption>Serviços solicitados</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead aria-sort="ascending">Serviço</TableHead>
            <TableHead>Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>IPTU</TableCell>
            <TableCell>R$ 1.234,56</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const tabela = screen.getByRole("table", { name: "Serviços solicitados" });
    const [servico, valor] = within(tabela).getAllByRole("columnheader");
    expect(servico).toHaveAttribute("scope", "col");
    expect(servico).toHaveAttribute("aria-sort", "ascending");
    expect(valor).toHaveAttribute("scope", "col");
  });
});

describe("Label", () => {
  it("nomeia o controle por htmlFor e clicar foca o campo", async () => {
    render(
      <>
        <Label htmlFor="nome">Nome</Label>
        <input id="nome" />
      </>
    );
    await userEvent.setup().click(screen.getByText("Nome"));
    expect(screen.getByRole("textbox", { name: "Nome" })).toHaveFocus();
  });
});

describe("ScrollArea", () => {
  it("renderiza o conteúdo dentro da viewport rolável", () => {
    render(
      <ScrollArea className="h-48">
        <p>Conteúdo longo aqui</p>
      </ScrollArea>
    );
    const conteudo = screen.getByText("Conteúdo longo aqui");
    expect(conteudo.closest("[data-radix-scroll-area-viewport]")).not.toBeNull();
  });

  // TST-F2-09: com conteúdo só de texto (o caso do exemplo do manifest), a
  // viewport rola mas não é focável (sem tabindex). No Chromium, com a viewport
  // de 100px e 2096px de conteúdo, o axe acusa `scrollable-region-focusable`
  // (serious, WCAG 2.1.1). O jsdom não calcula rolagem, então o teste verifica a
  // causa: a viewport sem tabindex quando não há nada focável dentro.
  it("TST-F2-09: a viewport de texto puro entra no Tab (tabindex=0)", () => {
    render(
      <ScrollArea className="h-48">
        <p>Conteúdo longo aqui</p>
      </ScrollArea>
    );
    const viewport = screen.getByText("Conteúdo longo aqui").closest("[data-radix-scroll-area-viewport]");
    expect(viewport).toHaveAttribute("tabindex", "0");
  });
});

describe("SemecProvider", () => {
  it("renderiza os filhos sem wrapper e aplica o nonce aos <style> do Radix", async () => {
    const { container } = render(
      <SemecProvider nonce="abc123">
        <p>Filho</p>
      </SemecProvider>
    );
    expect(container.firstElementChild?.tagName).toBe("P");
    const { getNonce } = await import("get-nonce");
    expect(getNonce()).toBe("abc123");
  });
});
