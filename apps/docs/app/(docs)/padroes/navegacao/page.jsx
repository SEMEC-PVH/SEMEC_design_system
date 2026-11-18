import Link from "next/link";

export const metadata = { title: "Padrões · Navegação" };

const itens = [
  {
    href: "/padroes/navegacao/menu-principal",
    title: "Menu principal e global",
    desc: "Navegação primária de topo para seções estratégicas do portal.",
    component: { label: "Menu de navegação", href: "/componentes/menu-de-navegacao", code: "NavigationMenu" },
  },
  {
    href: "/padroes/navegacao/navegacao-lateral",
    title: "Navegação lateral em painéis",
    desc: "Menu de seções hierárquicas em coluna para sistemas e cascas internas.",
    component: { label: "Barra lateral", href: "/componentes/barra-lateral", code: "Sidebar" },
  },
  {
    href: "/padroes/navegacao/breadcrumbs",
    title: "Trilhas de localização (Breadcrumbs)",
    desc: "Indicação da posição do usuário em estruturas com 3 ou mais níveis.",
    component: { label: "Trilha de navegação", href: "/componentes/trilha-de-navegacao", code: "Breadcrumb" },
  },
  {
    href: "/padroes/navegacao/cabecalho",
    title: "Cabeçalho institucional",
    desc: "Topo com marca oficial, atalhos de navegação e busca.",
    component: { label: "Cabeçalho", href: "/componentes/cabecalho", code: "Header" },
  },
  {
    href: "/padroes/navegacao/rodape",
    title: "Rodapé institucional",
    desc: "Encerramento de página com links obrigatórios, contato e transparência.",
    component: { label: "Rodapé", href: "/componentes/rodape", code: "Footer" },
  },
  {
    href: "/padroes/navegacao/busca",
    title: "Busca de conteúdo e serviços",
    desc: "Localização rápida de serviços e normas por palavra-chave.",
    component: { label: "Campo de texto", href: "/componentes/campo-de-texto", code: "Input" },
  },
  {
    href: "/padroes/navegacao/paginacao",
    title: "Paginação de listas e tabelas",
    desc: "Divisão de listas longas em páginas navegáveis com foco estável.",
    component: { label: "Paginação", href: "/componentes/paginacao", code: "Pagination" },
  },
  {
    href: "/padroes/navegacao/abas",
    title: "Abas em mesmo contexto",
    desc: "Alternância entre diferentes visões sem perda de estado.",
    component: { label: "Abas", href: "/componentes/abas", code: "Tabs" },
  },
  {
    href: "/padroes/navegacao/indicacao-localizacao-atual",
    title: "Indicação de localização atual",
    desc: "Orientação visual e auditiva (aria-current) sobre onde o cidadão está.",
    component: { label: "Etapas", href: "/componentes/etapas", code: "Stepper" },
  },
];

export default function NavegacaoPage() {
  return (
    <>
      <h1>Navegação</h1>
      <p className="subtitle">
        Padrões de navegação · como o usuário se move e se orienta dentro da
        interface.
      </p>

      <h3>Índice de padrões</h3>
        <table>
          <tbody>
            <tr>
              <th>Padrão UX</th>
              <th>Descrição & Diretriz</th>
              <th>Componente do Kit</th>
              <th></th>
            </tr>
            {itens.map((c) => (
              <tr key={c.href}>
                <td>
                  <Link href={c.href} className="font-semibold">
                    {c.title}
                  </Link>
                </td>
                <td>{c.desc}</td>
                <td>
                  {c.component ? (
                    <Link
                      href={c.component.href}
                      className="inline-flex items-center gap-1 text-xs text-primary underline"
                    >
                      <code>&lt;{c.component.code} /&gt;</code>
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={{ textAlign: "right" }}>
                  <Link href={c.href} aria-label={`Abrir diretriz de ${c.title}`}>
                    <span aria-hidden="true">→</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    </>
  );
}
