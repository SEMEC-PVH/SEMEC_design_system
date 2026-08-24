export function breadcrumbsFor(pathname) {
  const crumbs = [{ label: "Início", href: "/" }];
  for (const item of navigation) {
    if (item.href && pathname === item.href) {
      return crumbs;
    }
    if (item.items) {
      const match = item.items.find(
        (s) => pathname === s.href || pathname.startsWith(s.href + "/")
      );
      if (match) {
        crumbs.push({ label: item.label });
        crumbs.push({ label: match.label, href: match.href });
        return crumbs;
      }
    }
  }
  return crumbs;
}

export const navigation = [
  { href: "/", label: "Introdução" },
  {
    key: "fundamentos",
    label: "Fundamentos",
    items: [
      { href: "/fundamentos/tipografia", label: "Tipografia" },
      { href: "/fundamentos/cores", label: "Cores" },
      { href: "/fundamentos/layout", label: "Layout" },
      { href: "/fundamentos/raios-sombras", label: "Raios, bordas e sombras" },
    ],
  },
  {
    key: "componentes",
    label: "Componentes",
    items: [
      { href: "/componentes", label: "Visão geral" },
      { href: "/componentes/header", label: "Header" },
      { href: "/componentes/hero", label: "Hero" },
      { href: "/componentes/controles", label: "Barra de controles" },
      { href: "/componentes/service-card", label: "ServiceCard" },
      { href: "/componentes/botoes", label: "Botões" },
      { href: "/componentes/footer", label: "Footer" },
    ],
  },
  {
    key: "cores",
    label: "Categorias de cor",
    items: [
      { href: "/fundamentos/cores#cor-blue", label: "pv-blue", sub: true },
      { href: "/fundamentos/cores#cor-green", label: "pv-green", sub: true },
      { href: "/fundamentos/cores#cor-yellow", label: "pv-yellow", sub: true },
      { href: "/fundamentos/cores#cor-gray", label: "pv-gray", sub: true },
      {
        href: "/fundamentos/cores#cor-sistema",
        label: "Cores de sistema",
        sub: true,
      },
      {
        href: "/fundamentos/cores#cor-semantica",
        label: "Papéis semânticos",
        sub: true,
      },
    ],
  },
  {
    key: "regras",
    label: "Regras",
    items: [
      { href: "/regras/animacoes", label: "Animações" },
      { href: "/regras/acessibilidade", label: "Acessibilidade" },
      { href: "/regras/anti-padroes", label: "Anti-padrões" },
      { href: "/regras/pendencias", label: "Pendências" },
    ],
  },
];