import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * ADR-013 exige, além do `@deprecated` no JSDoc, um aviso em desenvolvimento
 * durante as duas minors antes da remoção (TST-34b, #57): `digits` e o subpath
 * `@semec/ds/react/server` saem na 5.0.
 */

const env = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = env;
  vi.restoreAllMocks();
  vi.resetModules();
});

async function carregar(modo: "development" | "production") {
  vi.resetModules();
  process.env.NODE_ENV = modo;
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const validadores = await import("../src/lib/validators");
  const server = await import("../src/server");
  return { warn, validadores, server };
}

describe("depreciações da 4.1 (TST-34b)", () => {
  it("digits avisa uma vez em desenvolvimento e continua funcionando", async () => {
    const { warn, validadores } = await carregar("development");
    expect(validadores.digits("123.456-78")).toBe("12345678");
    expect(validadores.digits("9-9")).toBe("99");
    const avisos = warn.mock.calls.filter(([m]) => String(m).includes("digits()"));
    expect(avisos).toHaveLength(1);
    expect(String(avisos[0]![0])).toMatch(/sai na 5\.0/);
  });

  it("os validadores que usam dígitos por dentro não avisam", async () => {
    const { warn, validadores } = await carregar("development");
    expect(validadores.validateCPF("529.982.247-25")).toBe(true);
    expect(validadores.validateCNPJ("11.222.333/0001-81")).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  it("dsPackageRootResolve (@semec/ds/react/server) avisa uma vez em desenvolvimento", async () => {
    const { warn, server } = await carregar("development");
    const raiz = server.dsPackageRootResolve();
    server.dsPackageRootResolve();
    expect(raiz.split("\\").join("/")).toMatch(/\/packages\/react$/);
    const avisos = warn.mock.calls.filter(([m]) => String(m).includes("@semec/ds/react/server"));
    expect(avisos).toHaveLength(1);
    expect(String(avisos[0]![0])).toMatch(/sai na 5\.0/);
  });

  it("em produção nada avisa", async () => {
    const { warn, validadores, server } = await carregar("production");
    validadores.digits("1-2");
    server.dsPackageRootResolve();
    expect(warn).not.toHaveBeenCalled();
  });
});
