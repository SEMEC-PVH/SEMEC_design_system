import Link from "next/link";

export const metadata = { title: "Componentes · Visão geral" };

const componentes = [
  {
    href: "/componentes/header",
    title: "Header",
    desc: "Topo com marca, navegação e CTA.",
  },
  {
    href: "/componentes/hero",
    title: "Hero",
    desc: "Bloco de abertura com eyebrow, título e métricas.",
  },
  {
    href: "/componentes/controles",
    title: "Barra de controles",
    desc: "Tabs, busca e chips de filtro do catálogo.",
  },
  {
    href: "/componentes/service-card",
    title: "ServiceCard",
    desc: "Card de serviço com tag, selo e hover.",
  },
  {
    href: "/componentes/botoes",
    title: "Botões",
    desc: "Primário, CTA de destaque e link.",
  },
  {
    href: "/componentes/footer",
    title: "Footer",
    desc: "Rodapé institucional com links e redes.",
  },
];

export default function ComponentesPage() {
  return (
    <>
      <h1>Componentes</h1>
      <p className="subtitle">
        Visão geral · cada componente tem uma página própria com preview e
        regras de uso.
      </p>

      <h3>Índice de componentes</h3>
        <table>
          <tbody>
            <tr>
              <th>Componente</th>
              <th>Descrição</th>
              <th></th>
            </tr>
            {componentes.map((c) => (
              <tr key={c.href}>
                <td>
                  <Link href={c.href} style={{ color: "var(--pv-green-800)", fontWeight: 600 }}>
                    {c.title}
                  </Link>
                </td>
                <td>{c.desc}</td>
                <td style={{ textAlign: "right" }}>
                  <Link href={c.href} aria-label={`Abrir página de ${c.title}`}>
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