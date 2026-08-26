/**
 * Tira a barra final da rota.
 *
 * O projeto exporta com `trailingSlash: true` (ver `next.config.mjs`), de
 * modo que `usePathname()` devolve `/componentes/botoes/` enquanto a
 * navegação declara `/componentes/botoes`. Sem normalizar, nenhuma
 * comparação exata casa.
 *
 * A regra antiga escondia isso: ela comparava por prefixo, e
 * `/componentes/botoes/` começa com `/componentes/botoes/` — a página
 * casava consigo mesma por acidente, e de quebra casava com o índice
 * `/componentes`. Era a mesma linha produzindo o acerto e o erro.
 */
const normalizar = (caminho) =>
  caminho.length > 1 && caminho.endsWith("/") ? caminho.slice(0, -1) : caminho;

/** `href` é ancestral de `pathname`, e não ele mesmo. */
const ehAncestral = (href, pathname) => pathname.startsWith(href + "/");

/** A categoria de uma subpágina: a entrada de primeiro nível que a contém. */
const categoriaDe = (grupo, href) =>
  grupo.items
    .filter((s) => !s.sub && ehAncestral(s.href, href))
    // Havendo mais de uma candidata, vence a mais específica.
    .sort((a, b) => b.href.length - a.href.length)[0];

/**
 * Trilha de navegação da rota.
 *
 * A correspondência **exata** tem prioridade sobre o prefixo. Sem isso,
 * uma entrada de índice como `/componentes` engolia todas as páginas
 * abaixo dela: `/componentes/botoes` exibia "Componentes > Visão geral"
 * em vez de "Componentes > Botões". Prefixo só decide quando não há
 * entrada exata — caso de página que existe mas não está na navegação.
 */
export function breadcrumbsFor(rota) {
  const pathname = normalizar(rota);
  const crumbs = [{ label: "Início", href: "/" }];

  for (const item of navigation) {
    if (item.href && pathname === item.href) {
      return crumbs;
    }
    if (!item.items) continue;

    const exato = item.items.find((s) => s.href === pathname);
    if (exato) {
      // O rótulo do grupo aponta para a primeira entrada, que é o índice
      // da seção — assim a trilha inteira é navegável.
      crumbs.push({ label: item.label, href: item.items[0]?.href });
      // Subpágina carrega também a categoria que a contém.
      if (exato.sub) {
        const categoria = categoriaDe(item, exato.href);
        if (categoria) {
          crumbs.push({ label: categoria.label, href: categoria.href });
        }
      }
      crumbs.push({ label: exato.label, href: exato.href });
      return crumbs;
    }

    // Sem entrada exata: a rota está sob uma categoria conhecida, mas não
    // é listada na navegação. A trilha para na categoria.
    const categoria = item.items.find(
      (s) => !s.sub && ehAncestral(s.href, pathname)
    );
    if (categoria) {
      crumbs.push({ label: item.label, href: item.items[0]?.href });
      crumbs.push({ label: categoria.label, href: categoria.href });
      return crumbs;
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
      { href: "/fundamentos", label: "Visão geral" },
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
      { href: "/componentes/error-summary", label: "ErrorSummary" },
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
      { href: "/regras", label: "Visão geral" },
      { href: "/regras/animacoes", label: "Animações" },
      { href: "/regras/acessibilidade", label: "Acessibilidade" },
      { href: "/regras/anti-padroes", label: "Anti-padrões" },
      { href: "/regras/pendencias", label: "Pendências" },
    ],
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
    ],
  },
];

/**
 * Hrefs que são categoria de verdade — têm subpáginas (`sub: true`) um
 * nível abaixo. Calculado uma vez, no carregamento do módulo.
 *
 * A distinção importa: `/padroes/navegacao` é categoria e deve continuar
 * destacada enquanto se navega em `/padroes/navegacao/abas`. Já
 * `/componentes` é um índice cujos vizinhos estão no mesmo nível — marcá-lo
 * como ativo em `/componentes/botoes` acende dois itens ao mesmo tempo.
 */
const comSubpaginas = new Set(
  navigation.flatMap((grupo) =>
    (grupo.items ?? [])
      // Entrada ancorada (`/fundamentos/cores#cor-blue`) é seção da mesma
      // página, não subpágina: não cria relação de caminho e ficaria com
      // `/fundamentos` como falso pai.
      .filter((item) => item.sub && !item.href.includes("#"))
      .map((item) => item.href.slice(0, item.href.lastIndexOf("/")))
      .filter(Boolean)
  )
);

/**
 * Estado de uma entrada da navegação diante da rota atual.
 *
 * - `"current"` — é a página aberta. Só ela recebe `aria-current="page"`.
 * - `"ancestor"` — é a categoria que contém a página aberta.
 * - `"section"` — é uma âncora dentro da página aberta.
 * - `null` — nenhum dos anteriores.
 *
 * Os três primeiros recebem destaque visual; só `"current"` se anuncia
 * como página atual. A distinção existe porque a página `/fundamentos/cores`
 * tem seis âncoras na navegação: tratá-las como atuais poria
 * `aria-current="page"` em sete elementos de uma vez, e um leitor de tela
 * anunciaria sete páginas atuais.
 */
export function navState(rota, href) {
  const pathname = normalizar(rota);
  const [caminho, ancora] = href.split("#");
  if (ancora) return pathname === normalizar(caminho) ? "section" : null;

  const alvo = normalizar(href);
  if (pathname === alvo) return "current";
  if (comSubpaginas.has(alvo) && ehAncestral(alvo, pathname)) return "ancestor";
  return null;
}
