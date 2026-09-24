import { dsCategories, dsComponents, dsPortal } from "semec-ds/skills";

export function breadcrumbsFor(pathname) {
  const crumbs = [{ label: "Início", href: "/" }];
  for (const item of navigation) {
    if (item.href && pathname === item.href) {
      return crumbs;
    }
    if (item.items) {
      const exact = item.items.find((s) => pathname === s.href);
      if (exact) {
        crumbs.push({ label: item.label, href: item.items[0]?.href });
        if (exact.sub) {
          const parent = item.items
            .filter((s) => !s.sub && exact.href.startsWith(s.href + "/"))
            .sort((a, b) => b.href.length - a.href.length)[0];
          if (parent) crumbs.push({ label: parent.label, href: parent.href });
        }
        crumbs.push({ label: exact.label, href: exact.href });
        return crumbs;
      }
      const category = item.items.find(
        (s) => !s.sub && pathname.startsWith(s.href + "/")
      );
      if (category) {
        const sub = item.items.find((s) => s.sub && pathname === s.href);
        crumbs.push({ label: item.label, href: item.items[0]?.href });
        crumbs.push({ label: category.label, href: category.href });
        if (sub) crumbs.push({ label: sub.label, href: sub.href });
        return crumbs;
      }
    }
  }
  return crumbs;
}

// Seção "Componentes" montada a partir do manifest: Estrutura de página
// (casca do portal, categoria principal) + as categorias oficiais do kit.
const componentesItems = [
  { href: "/componentes", label: "Visão geral" },
  { href: dsPortal.items[0].href, label: dsPortal.label },
  ...dsPortal.items.map((p) => ({ href: p.href, label: p.label, sub: true })),
  ...dsCategories.flatMap((cat) => [
    { href: `/componentes/${cat.slug}`, label: cat.label },
    ...dsComponents
      .filter((c) => c.category === cat.key)
      .map((c) => ({ href: `/componentes/${c.slug}`, label: c.label, sub: true })),
  ]),
];

export const navigation = [
  {
    key: "guia",
    label: "Guia",
    items: [
      { href: "/introducao", label: "Introdução" },
      { href: "/introducao/o-que-e-ds", label: "O que é DS?" },
      { href: "/introducao/para-quem", label: "Para quem é" },
      { href: "/introducao/requisitos", label: "Requisitos" },
      { href: "/fundamentos", label: "Fundamentos" },
      { href: "/fundamentos/tipografia", label: "Tipografia", sub: true },
      { href: "/fundamentos/cores", label: "Cores", sub: true },
      { href: "/fundamentos/layout", label: "Layout", sub: true },
      { href: "/fundamentos/raios-sombras", label: "Raios, bordas e sombras", sub: true },
      { href: "/fundamentos/animacoes", label: "Animações", sub: true },
    ],
  },
  {
    key: "componentes",
    label: "Componentes",
    items: componentesItems,
  },
  {
    key: "padroes",
    label: "Padrões",
    items: [
      { href: "/padroes", label: "Visão geral" },
      { href: "/padroes/navegacao", label: "Navegação" },
      { href: "/padroes/navegacao/menu-principal", label: "Menu principal", sub: true },
      { href: "/padroes/navegacao/navegacao-lateral", label: "Navegação lateral", sub: true },
      { href: "/padroes/navegacao/breadcrumbs", label: "Breadcrumbs", sub: true },
      { href: "/padroes/navegacao/cabecalho", label: "Cabeçalho", sub: true },
      { href: "/padroes/navegacao/rodape", label: "Rodapé", sub: true },
      { href: "/padroes/navegacao/busca", label: "Busca", sub: true },
      { href: "/padroes/navegacao/paginacao", label: "Paginação", sub: true },
      { href: "/padroes/navegacao/abas", label: "Abas", sub: true },
      { href: "/padroes/navegacao/indicacao-localizacao-atual", label: "Indicação da localização atual", sub: true },

      { href: "/padroes/formularios", label: "Formulários" },
      { href: "/padroes/formularios/campos-obrigatorios", label: "Campos obrigatórios", sub: true },
      { href: "/padroes/formularios/mascaras", label: "Máscaras", sub: true },
      { href: "/padroes/formularios/textos-de-ajuda", label: "Textos de ajuda", sub: true },
      { href: "/padroes/formularios/validacao", label: "Validação", sub: true },
      { href: "/padroes/formularios/mensagens-de-erro", label: "Mensagens de erro", sub: true },
      { href: "/padroes/formularios/agrupamento-de-informacoes", label: "Agrupamento de informações", sub: true },
      { href: "/padroes/formularios/etapas-de-preenchimento", label: "Etapas de preenchimento", sub: true },
      { href: "/padroes/formularios/confirmacao-de-envio", label: "Confirmação de envio", sub: true },
      { href: "/padroes/formularios/prevencao-de-perda-de-dados", label: "Prevenção de perda de dados", sub: true },

      { href: "/padroes/dados-relatorios", label: "Dados e relatórios" },
      { href: "/padroes/dados-relatorios/tabelas", label: "Tabelas", sub: true },
      { href: "/padroes/dados-relatorios/ordenacao", label: "Ordenação", sub: true },
      { href: "/padroes/dados-relatorios/filtros", label: "Filtros", sub: true },
      { href: "/padroes/dados-relatorios/pesquisa", label: "Pesquisa", sub: true },
      { href: "/padroes/dados-relatorios/paginacao", label: "Paginação", sub: true },
      { href: "/padroes/dados-relatorios/selecao-de-registros", label: "Seleção de registros", sub: true },
      { href: "/padroes/dados-relatorios/exportacao", label: "Exportação", sub: true },
      { href: "/padroes/dados-relatorios/operacoes-em-lote", label: "Operações em lote", sub: true },
      { href: "/padroes/dados-relatorios/indicadores", label: "Indicadores", sub: true },
      { href: "/padroes/dados-relatorios/graficos", label: "Gráficos", sub: true },
      { href: "/padroes/dados-relatorios/estados-sem-resultados", label: "Estados sem resultados", sub: true },

      { href: "/padroes/feedback", label: "Feedback ao usuário" },
      { href: "/padroes/feedback/carregamento", label: "Carregamento", sub: true },
      { href: "/padroes/feedback/sucesso", label: "Sucesso", sub: true },
      { href: "/padroes/feedback/erro", label: "Erro", sub: true },
      { href: "/padroes/feedback/aviso", label: "Aviso", sub: true },
      { href: "/padroes/feedback/confirmacao", label: "Confirmação", sub: true },
      { href: "/padroes/feedback/progresso", label: "Progresso", sub: true },
      { href: "/padroes/feedback/processamento", label: "Processamento", sub: true },
      { href: "/padroes/feedback/indisponibilidade", label: "Indisponibilidade", sub: true },
      { href: "/padroes/feedback/sessao-expirada", label: "Sessão expirada", sub: true },

      { href: "/padroes/acessibilidade", label: "Acessibilidade" },
      { href: "/padroes/acessibilidade/contraste-de-cores", label: "Contraste de cores", sub: true },
      { href: "/padroes/acessibilidade/navegacao-por-teclado", label: "Navegação por teclado", sub: true },
      { href: "/padroes/acessibilidade/foco-visivel", label: "Foco visível", sub: true },
      { href: "/padroes/acessibilidade/leitores-de-tela", label: "Leitores de tela", sub: true },
      { href: "/padroes/acessibilidade/textos-alternativos", label: "Textos alternativos", sub: true },
      { href: "/padroes/acessibilidade/estrutura-semantica", label: "Estrutura semântica", sub: true },
      { href: "/padroes/acessibilidade/tamanho-das-areas-clicaveis", label: "Tamanho das áreas clicáveis", sub: true },
      { href: "/padroes/acessibilidade/mensagens-de-erro-acessiveis", label: "Mensagens de erro acessíveis", sub: true },
      { href: "/padroes/acessibilidade/nao-uso-exclusivo-de-cores", label: "Não uso exclusivo de cores", sub: true },
      { href: "/padroes/acessibilidade/conformidade-wcag-nbr", label: "Conformidade WCAG e ABNT NBR 17225", sub: true },
      { href: "/padroes/anti-padroes", label: "Anti-padrões" },
    ],
  },
];