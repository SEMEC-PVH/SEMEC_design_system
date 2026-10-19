/**
 * Telas de consumidor para as conferências de LAYOUT (layout.spec.mjs): o que
 * a validação da 4.2.0 como consumidor achou em telas reais (Next e Vite) e
 * que só aparece com o CSS do kit aplicado e o navegador calculando a página.
 * Nada aqui vira print: o spec mede (rolagem, alvo, fonte, entrelinha).
 *
 * Cada fábrica recebe o namespace do kit (`ds`) e devolve um elemento React.
 */
import React from "react";

const h = React.createElement;

export const layoutCases = {
  // NEXT42-02 / V42-VITE-01: 4 links curtos no HeaderNav estouravam 320 px.
  "header-4-links": (ds) =>
    h(
      ds.Header,
      null,
      h(ds.HeaderBrand, { logo: h("span", { className: "text-sm font-bold" }, "PVH"), serviceName: "Portal" }),
      h(
        ds.HeaderNav,
        null,
        h(ds.HeaderNavLink, { href: "#inicio", current: true }, "Início"),
        h(ds.HeaderNavLink, { href: "#protocolos" }, "Protocolos"),
        h(ds.HeaderNavLink, { href: "#requerimento" }, "Requerimento"),
        h(ds.HeaderNavLink, { href: "#painel" }, "Painel")
      )
    ),

  // NEXT42-05: FooterLink de texto curto ("IPTU") ficava com 29×44.
  "footer-link-curto": (ds) =>
    h(
      ds.Footer,
      null,
      h(
        ds.FooterContent,
        null,
        h(ds.FooterSection, { title: "Serviços" }, h(ds.FooterLinks, null, h(ds.FooterLink, { href: "#iptu" }, "IPTU")))
      )
    ),

  // V42-VITE-03: exemplo da doc (`NavigationMenuContent className="p-2"`) quebrava cada link em 2 linhas.
  "navigation-menu-painel": (ds) =>
    h(
      ds.NavigationMenu,
      null,
      h(
        ds.NavigationMenuList,
        null,
        h(
          ds.NavigationMenuItem,
          null,
          h(ds.NavigationMenuTrigger, null, "Serviços"),
          h(
            ds.NavigationMenuContent,
            { className: "p-2" },
            h(ds.NavigationMenuLink, { href: "#iptu" }, "IPTU"),
            h(ds.NavigationMenuLink, { href: "#alvara" }, "Alvará de funcionamento"),
            h(ds.NavigationMenuLink, { href: "#certidao" }, "Certidão negativa")
          )
        )
      )
    ),

  // NAV-01: campos de digitação com 14 px fazem o iOS Safari ampliar a página no foco.
  "campos-digitacao": (ds) =>
    h(
      "div",
      { className: "flex max-w-md flex-col gap-4" },
      h(ds.Input, { id: "c-input", "aria-label": "Nome" }),
      h(ds.Textarea, { id: "c-textarea", "aria-label": "Observações" }),
      h(ds.InputMask, { id: "c-mask", "aria-label": "CPF", mask: "cpf" }),
      h(ds.PasswordInput, { id: "c-senha", "aria-label": "Senha" }),
      h(ds.DatePicker, { id: "c-data", "aria-label": "Data de nascimento" }),
      h(ds.Combobox, {
        "aria-label": "Município",
        options: [
          { value: "pvh", label: "Porto Velho" },
          { value: "ari", label: "Ariquemes" },
        ],
      })
    ),

  // V42-VITE-05: com a tabela mais larga que a tela, a caption ficava dentro da área rolável e saía cortada.
  "data-table-larga": (ds) =>
    h(ds.DataTable, {
      caption: "Protocolos abertos em 2026",
      columns: ["numero", "assunto", "requerente", "secretaria", "situacao", "abertura"].map((key) => ({
        key,
        header: key.charAt(0).toUpperCase() + key.slice(1),
      })),
      data: [
        {
          numero: "2026/000123",
          assunto: "Segunda via de carnê de IPTU",
          requerente: "Maria da Silva Souza",
          secretaria: "Secretaria Municipal de Fazenda",
          situacao: "Em análise",
          abertura: "16/10/2026",
        },
      ],
    }),

  // NEXT42-07: títulos internos com leading-none colavam as linhas ao quebrar.
  "titulos-longos": (ds) =>
    h(
      "div",
      { className: "flex max-w-xs flex-col gap-4" },
      h(
        ds.Card,
        null,
        h(ds.CardHeader, null, h(ds.CardTitle, { id: "t-card" }, "Resumo dos requerimentos de matrícula enviados neste ano letivo"))
      ),
      h(
        ds.Alert,
        null,
        h(ds.AlertTitle, { id: "t-alert" }, "Prazo de rematrícula prorrogado até o fim do mês para todas as escolas"),
        h(ds.AlertDescription, null, "Confira os documentos.")
      )
    ),
};
