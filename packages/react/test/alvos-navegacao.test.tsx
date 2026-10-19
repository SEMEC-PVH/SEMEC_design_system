import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";

import { Breadcrumb, Link } from "../src/index";

/**
 * TST-10 (#55): alvos de toque de 44 px no mobile para os links do Breadcrumb e
 * para o Link isolado (tel/mailto). O jsdom não tem layout, então o teste trava
 * as classes que garantem o alvo; a medida real em 390/320 px é feita no
 * Chromium (ver commit). Tudo atrás de `max-sm:` para não mudar o desktop.
 */

const classes = (el: Element) => el.className.split(/\s+/);

describe("Breadcrumb: alvo de toque (TST-10)", () => {
  it("os links da trilha têm min-h-11 e largura mínima de 44 px só abaixo de sm", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Início", href: "/" },
          { label: "Serviços", href: "/servicos" },
          { label: "Matrícula" },
        ]}
      />
    );
    for (const nome of ["Início", "Serviços"]) {
      const link = screen.getByRole("link", { name: nome });
      const c = classes(link);
      expect(c).toEqual(expect.arrayContaining(["relative", "inline-flex", "items-center", "max-sm:min-h-11"]));
      expect(c).toEqual(expect.arrayContaining(["max-sm:after:absolute", "max-sm:after:min-w-11"]));
      // Nada de alvo inflado fora do mobile.
      expect(c).not.toContain("min-h-11");
      expect(c.filter((x) => x.startsWith("after:"))).toEqual([]);
    }
    // O item atual não é link e não ganha alvo.
    expect(screen.getByText("Matrícula")).not.toHaveClass("max-sm:min-h-11");
  });
});

describe("Link: alvo de toque (TST-10)", () => {
  it("um ::after de no mínimo 44×44 centralizado amplia o toque abaixo de sm sem mudar a altura da linha", () => {
    render(
      <p>
        Ligue <Link href="tel:+556939011234">(69) 3901-1234</Link>
      </p>
    );
    const link = screen.getByRole("link", { name: "(69) 3901-1234" });
    const c = classes(link);
    expect(c).toContain("relative");
    expect(c).toEqual(
      expect.arrayContaining([
        "max-sm:after:absolute",
        "max-sm:after:min-h-11",
        "max-sm:after:min-w-11",
        "max-sm:after:top-1/2",
        "max-sm:after:left-1/2",
        "max-sm:after:-translate-x-1/2",
        "max-sm:after:-translate-y-1/2",
      ])
    );
    // A caixa do próprio link não cresce (não muda a linha do parágrafo).
    expect(c.some((x) => /(^|:)min-h-11$/.test(x) && !x.includes("after:"))).toBe(false);
  });

  it("o className do consumidor continua mesclado", () => {
    render(
      <Link href="mailto:atendimento@exemplo.gov.br" className="text-base">
        atendimento@exemplo.gov.br
      </Link>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveClass("text-base", "max-sm:after:min-h-11");
    expect(link).not.toHaveClass("text-sm");
  });

  it("encaminha o ref", () => {
    const ref = React.createRef<HTMLAnchorElement>();
    render(<Link ref={ref} href="/" />);
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });
});
