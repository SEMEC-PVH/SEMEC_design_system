import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { afterAll, describe, expect, it } from "vitest";

import { dsComponents } from "../manifest.js";
// @ts-expect-error módulo JS do pipeline de artefatos, sem tipos
import { bumpVersion, changesetBump, pendingRelease, unreleasedNote } from "../scripts/release-status.mjs";

/**
 * Artefatos para IA e documentação (bateria de testes de 16/10/2026, onda 1,
 * épico #55): TST-04, TST-15, TST-18, TST-19, TST-30 a TST-33 e TST-35.
 *
 * Os artefatos do site (`apps/docs/public`) são lidos como estão no commit; a
 * CI confere que eles batem com o `build-artifacts.mjs` (deriva dos artefatos).
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const repoRoot = path.resolve(pkgRoot, "../..");
const publicDir = path.join(repoRoot, "apps/docs/public");

const ler = (...partes: string[]) => fs.readFileSync(path.join(...partes), "utf8");
const pkgJson = JSON.parse(ler(pkgRoot, "package.json")) as { name: string; homepage: string };
const homepage = pkgJson.homepage.replace(/\/?$/, "/");

const skill = ler(pkgRoot, "skills/semec-ds/SKILL.md");
const skillLite = ler(pkgRoot, "skills/semec-ds-lite/SKILL.md");

function secao(texto: string, titulo: string) {
  const inicio = texto.indexOf(titulo);
  if (inicio < 0) throw new Error(`Seção não encontrada: ${titulo}`);
  const resto = texto.slice(inicio + titulo.length);
  const fim = resto.search(/\n##{1,2} /);
  return fim < 0 ? resto : resto.slice(0, fim);
}

function blocoTsx(texto: string) {
  const m = /```tsx\n([\s\S]*?)```/.exec(texto);
  if (!m?.[1]) throw new Error("Bloco tsx não encontrado");
  return m[1];
}

// ---------------------------------------------------------------------------
// TST-04 (#51): uma composição só de Sidebar + Header, testada.
// ---------------------------------------------------------------------------
describe("SKILL — esqueleto com Sidebar (TST-04)", () => {
  // Lido dentro de cada teste: sem a seção, o teste falha (não a coleta).
  const codigo = () => blocoTsx(secao(skill, "### Esqueleto com Sidebar"));
  const tmpDir = fs.mkdtempSync(path.join(here, ".tmp-skill-"));
  afterAll(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  it("não oferece mais a alternativa 'antes do SidebarProvider ou no topo do SidebarInset'", () => {
    expect(skill).not.toMatch(/ficam antes do `SidebarProvider` ou no topo do `SidebarInset`/);
  });

  it("põe o SkipLink antes do SidebarProvider e o Header dentro do SidebarInset, antes do <main>", () => {
    const pos = (trecho: string) => {
      const i = codigo().indexOf(trecho);
      expect(i, trecho).toBeGreaterThanOrEqual(0);
      return i;
    };
    expect(pos("<SkipLink />")).toBeLessThan(pos("<SidebarProvider>"));
    expect(pos('<SidebarInset as="div">')).toBeLessThan(pos("<Header>"));
    expect(pos("</Header>")).toBeLessThan(pos('<main id="conteudo"'));
    expect(pos("</main>")).toBeLessThan(pos("</SidebarInset>"));
  });

  it("renderiza o bloco da SKILL: SkipLink é a 1ª parada, a marca é focável e o banner fica fora do main", async () => {
    // O bloco é compilado como está na SKILL, com o import do pacote apontado
    // para o código-fonte do kit.
    const arquivo = path.join(tmpDir, "painel.tsx");
    const fonte = codigo().replace(
      /from "@semec\/ds\/react";/,
      `from ${JSON.stringify(pathToFileURL(path.join(pkgRoot, "src/index.ts")).href)};`
    );
    fs.writeFileSync(arquivo, fonte, "utf8");
    const mod = (await import(/* @vite-ignore */ pathToFileURL(arquivo).href)) as Record<
      string,
      React.ComponentType
    >;
    const Painel = Object.values(mod).find((v) => typeof v === "function");
    expect(Painel).toBeDefined();
    render(React.createElement(Painel!));

    const user = userEvent.setup();
    await user.tab();
    expect(document.activeElement).toHaveTextContent("Pular para o conteúdo principal");

    const banner = screen.getByRole("banner");
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "conteudo");
    expect(main.contains(banner)).toBe(false);
    expect(banner.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // O Header está no SidebarInset (o irmão da Sidebar), não antes do provider.
    const nav = screen.getByRole("navigation", { name: "Menu lateral" });
    expect(nav.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const marca = within(banner).getAllByRole("link")[0]!;
    marca.focus();
    expect(marca).toHaveFocus();

    // Enter no SkipLink leva o foco ao <main id="conteudo">.
    (screen.getByText("Pular para o conteúdo principal").closest("a") as HTMLAnchorElement).focus();
    await user.keyboard("{Enter}");
    expect(main).toHaveFocus();
  });
});

// ---------------------------------------------------------------------------
// TST-18 (#55): links do llms.txt com o basePath do site.
// ---------------------------------------------------------------------------
describe("llms.txt e manifest.json do site — links (TST-18)", () => {
  const llms = ler(publicDir, "llms.txt");
  const manifest = JSON.parse(ler(publicDir, "manifest.json")) as {
    components: { slug: string; url: string; md: string }[];
  };

  it("o homepage do pacote inclui o basePath de produção", () => {
    expect(homepage).toMatch(/\/SEMEC_design_system\/$/);
  });

  it("nenhum link Markdown aponta para a raiz do domínio", () => {
    const alvos = [...llms.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]!);
    expect(alvos.length).toBeGreaterThan(dsComponents.length);
    for (const alvo of alvos) expect(alvo, alvo).toMatch(/^https:\/\//);
    expect(llms).not.toMatch(/\]\(\/componentes\//);
    expect(llms).not.toMatch(/`\/components\/[^`]+\.md`/);
  });

  it("cada componente aponta para a página e o .md com o basePath", () => {
    for (const c of dsComponents) {
      expect(llms).toContain(`](${homepage}componentes/${c.slug}/)`);
      expect(llms).toContain(`md: ${homepage}components/${c.slug}.md`);
    }
    for (const c of manifest.components) {
      expect(c.url).toBe(`${homepage}componentes/${c.slug}/`);
      expect(c.md).toBe(`${homepage}components/${c.slug}.md`);
    }
  });
});

// ---------------------------------------------------------------------------
// TST-19 (#55): install do manifest.json igual ao da SKILL.
// ---------------------------------------------------------------------------
describe("manifest.json — install (TST-19)", () => {
  const { install, tokens } = JSON.parse(ler(publicDir, "manifest.json")) as {
    install: Record<string, string>;
    tokens: { files: string[] };
  };
  const linhas = [
    '@import "tailwindcss";',
    '@import "@semec/ds/react/fonts.css";',
    '@import "@semec/ds/react/tokens.css";',
    '@source "../node_modules/@semec/ds/dist/react";',
  ];

  it("install.css tem as 4 linhas do CSS global, fonts.css antes do tokens.css", () => {
    expect(install.css?.split("\n")).toEqual(linhas);
  });

  it("nenhum campo manda importar CSS do kit em JS", () => {
    for (const [campo, valor] of Object.entries(install)) {
      expect(valor, campo).not.toMatch(/^import ["']@semec\/ds\/react\/[^"']+\.css["']/);
    }
    expect(install.tokens).toBe(linhas[2]);
    expect(install.fonts).toBe(linhas[1]);
    expect(install.source).toBe(linhas[3]);
  });

  it("preset é o @config do pv-preset, não o @source", () => {
    expect(install.preset).toBe('@config "@semec/ds/react/pv-preset";');
    expect(tokens.files).toContain("fonts.css");
  });

  it("a SKILL ensina as mesmas 4 linhas", () => {
    expect(skill).toContain(linhas.join("\n"));
  });
});

// ---------------------------------------------------------------------------
// TST-15 (#55): conteúdo do repositório à frente do npm é marcado.
// ---------------------------------------------------------------------------
describe("release-status — changesets pendentes (TST-15)", () => {
  const changeset = (bump: string, pkg = "@semec/ds") => `---\n"${pkg}": ${bump}\n---\n\nTexto.\n`;

  it("lê o bump do pacote no frontmatter do changeset", () => {
    expect(changesetBump(changeset("minor"), "@semec/ds")).toBe("minor");
    expect(changesetBump(changeset("patch", "@semec/docs"), "@semec/ds")).toBeNull();
    expect(changesetBump("sem frontmatter", "@semec/ds")).toBeNull();
  });

  it("calcula a próxima versão pelo maior bump", () => {
    expect(bumpVersion("4.0.1", "patch")).toBe("4.0.2");
    expect(bumpVersion("4.0.1", "minor")).toBe("4.1.0");
    expect(bumpVersion("4.0.1", "major")).toBe("5.0.0");
  });

  it("marca como não publicado só quando há changeset do pacote", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "changesets-"));
    try {
      fs.writeFileSync(path.join(dir, "README.md"), "# Changesets\n");
      fs.writeFileSync(path.join(dir, "config.json"), "{}");
      expect(pendingRelease({ changesetDir: dir, pkgName: "@semec/ds", version: "4.0.1" })).toBeNull();
      expect(unreleasedNote(null, "4.0.1", "@semec/ds")).toBeNull();

      fs.writeFileSync(path.join(dir, "a.md"), changeset("patch"));
      fs.writeFileSync(path.join(dir, "b.md"), changeset("minor"));
      fs.writeFileSync(path.join(dir, "c.md"), changeset("major", "@semec/docs"));
      const pend = pendingRelease({ changesetDir: dir, pkgName: "@semec/ds", version: "4.0.1" });
      expect(pend).toMatchObject({ count: 2, bump: "minor", nextVersion: "4.1.0" });
      const nota = unreleasedNote(pend, "4.0.1", "@semec/ds");
      expect(nota).toMatch(/^Não publicado/);
      expect(nota).toContain("@semec/ds@4.0.1");
      expect(nota).toContain("4.1.0");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    expect(pendingRelease({ changesetDir: path.join(os.tmpdir(), "nao-existe-xyz"), pkgName: "@semec/ds", version: "1.0.0" })).toBeNull();
  });

  it("as duas SKILLs têm o marcador do aviso de não publicado", () => {
    expect(skill).toContain("<!-- ds:release-status -->");
    expect(skillLite).toContain("<!-- ds:release-status -->");
  });

  it("o manifest.json do site tem o campo unreleased (objeto ou null)", () => {
    const m = JSON.parse(ler(publicDir, "manifest.json")) as { unreleased?: unknown };
    expect(m).toHaveProperty("unreleased");
    if (m.unreleased !== null) {
      expect(m.unreleased).toMatchObject({ note: expect.stringMatching(/^Não publicado/) });
    }
  });
});

// ---------------------------------------------------------------------------
// TST-30 e TST-31 (#55): exemplos em TS strict e contagem derivada.
// ---------------------------------------------------------------------------
describe("manifest.js — exemplos e contagens (TST-30, TST-31)", () => {
  const exemplos = [
    ["SKILL semec-ds", skill],
    ...dsComponents.map((c) => [`manifest ${c.code}`, c.usage] as const),
  ] as const;

  it("nenhum exemplo usa useRef(null) sem tipo (TS2339 em TS strict)", () => {
    for (const [nome, texto] of exemplos) {
      expect(texto, nome).not.toMatch(/useRef\(null\)/);
    }
  });

  it("parâmetros de callback do envio são tipados (TS7006)", () => {
    const uso = dsComponents.find((c) => c.code === "form-field")!.usage;
    expect(uso).not.toMatch(/const onSubmit = \((?:data|dados)\)/);
    expect(uso).toMatch(/const onSubmit = \((?:data|dados): \w+\)/);
  });

  it("os exemplos que usam React.* importam React", () => {
    for (const c of dsComponents) {
      if (/\bReact\.use/.test(c.usage)) {
        expect(c.usage, c.code).toMatch(/import \* as React from "react";/);
      }
    }
  });

  const porExtenso: Record<string, number> = {
    uma: 1, um: 1, duas: 2, dois: 2, três: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
  };

  it("'N variantes' na descrição bate com a lista de variant", () => {
    let conferidos = 0;
    for (const c of dsComponents) {
      const m = /\b(\p{L}+|\d+) variantes\b/iu.exec(c.desc);
      if (!m) continue;
      const n = porExtenso[m[1]!.toLowerCase()] ?? Number(m[1]);
      if (!Number.isFinite(n)) continue;
      const lista = c.variants?.find((v) => v.prop === "variant")?.values ?? "";
      expect(lista.split("·").length, c.code).toBe(n);
      conferidos++;
    }
    expect(conferidos).toBeGreaterThan(0);
  });

  it("as variantes do Button no manifest são as do buttonVariants (button.tsx)", () => {
    const fonte = ler(pkgRoot, "src/components/button.tsx");
    const bloco = /variant:\s*\{([\s\S]*?)\n\s{6}\},/.exec(fonte)?.[1] ?? "";
    const doFonte = [...bloco.matchAll(/^\s{8}(\w+):/gm)].map((m) => m[1]);
    const button = dsComponents.find((c) => c.code === "button")!;
    const doManifest = button.variants!.find((v) => v.prop === "variant")!.values.split(" · ");
    expect(doFonte.length).toBeGreaterThan(0);
    expect(doManifest).toEqual(doFonte);
  });
});

// ---------------------------------------------------------------------------
// TST-32, TST-33, TST-35 (#55) e integridade dos documentos.
// ---------------------------------------------------------------------------
describe("documentos do repositório (TST-32, TST-33, TST-35)", () => {
  it("AGENTS.md aponta para a skill renderizada, não para o template (TST-32)", () => {
    const agents = ler(repoRoot, "AGENTS.md");
    const lista = secao(agents, "## AI Artifact Sources");
    expect(lista).toContain("apps/docs/public/skills/semec-ds/SKILL.md");
    expect(lista).not.toMatch(/`packages\/react\/skills\/semec-ds\/SKILL\.md` — full agent skill/);
  });

  it("SKILL lite usa tokens semânticos no erro de servidor e documenta o preset lite (TST-33)", () => {
    const fora = skillLite.replace(/### L0 — Primitivos[\s\S]*?### L1/, "");
    expect(fora).not.toMatch(/--pv-red-(50|700)`\)/);
    expect(fora).not.toMatch(/fundo `--pv-red-50`/);
    expect(skillLite).toMatch(/--feedback-danger-surface/);
    expect(skillLite).toContain('@config "@semec/ds/lite/pv-preset"');
    expect(skillLite).not.toMatch(/"@semec\/ds": "\d+\.\d+\.\d+"/);
  });

  it("docs/objetivo.md tira a versão do package.json e não nega a regressão visual (TST-35)", () => {
    const objetivo = ler(repoRoot, "docs/objetivo.md");
    expect(objetivo).toMatch(/<!-- ds:release:start -->\nVersão no repositório \(`packages\/react\/package\.json`\): \*\*\d+\.\d+\.\d+\*\*\./);
    expect(objetivo).toContain("<!-- ds:release:end -->");
    expect(objetivo).not.toMatch(/versão publicada em 15\/10\/2026 é a \*\*3\.2\.0\*\*/);
    expect(objetivo).not.toMatch(/nem regressão visual/);
  });

  it.each([
    ["packages/react/README.md"],
    ["packages/react/skills/semec-ds/SKILL.md"],
    ["packages/react/skills/semec-ds-lite/SKILL.md"],
  ])("%s não tem seção de 2º nível duplicada", (rel) => {
    const titulos = [...ler(repoRoot, rel).matchAll(/^## .+$/gm)].map((m) => m[0]);
    expect(titulos.filter((t, i) => titulos.indexOf(t) !== i)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Pedidos dos corretores de componentes (onda 1): a doc acompanha a API nova.
// ---------------------------------------------------------------------------
describe("manifest e SKILL acompanham a API da onda 1", () => {
  const comp = (code: string) => dsComponents.find((c) => c.code === code)!;
  const tudo = (code: string) => JSON.stringify(comp(code));

  it("DataTable: rowLabel com onRowClick e sortBy como descrição (TST-27, TST-28)", () => {
    expect(tudo("data-table")).toMatch(/rowLabel/);
    expect(comp("data-table").usage).toMatch(/onRowClick=[\s\S]*rowLabel=/);
    expect(tudo("data-table")).toMatch(/aria-describedby/);
    expect(skill).toMatch(/rowLabel/);
    expect(skill).not.toMatch(/aria-label="Ordenar por/);
  });

  it("Toggle, ScrollArea, Avatar, NavigationMenu, Pagination e Heading descritos", () => {
    expect(comp("toggle").desc).toMatch(/tint/);
    expect(tudo("scroll-area")).toMatch(/viewportProps/);
    expect(tudo("scroll-area")).toMatch(/focusable/);
    expect(comp("avatar").desc).toMatch(/alt/);
    expect(tudo("navigation-menu")).toMatch(/navigationMenuLinkStyle/);
    expect(tudo("pagination")).toMatch(/aceita 0/);
    expect(comp("heading").desc).toMatch(/32px/);
  });
});
