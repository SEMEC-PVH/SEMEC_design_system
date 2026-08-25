import Link from "next/link";

export const metadata = { title: "Padrões" };

const itens = [
  {
    href: "/padroes/navegacao",
    title: "Navegação",
    desc: "Como o usuário se move e se orienta dentro da interface.",
  },
  {
    href: "/padroes/formularios",
    title: "Formulários",
    desc: "Coleta de dados de forma clara, segura e sem fricção.",
  },
  {
    href: "/padroes/dados-relatorios",
    title: "Dados e relatórios",
    desc: "Apresentação, exploração e ação sobre conjuntos de dados.",
  },
  {
    href: "/padroes/feedback",
    title: "Feedback ao usuário",
    desc: "Como comunicar o estado do sistema em cada momento.",
  },
  {
    href: "/padroes/acessibilidade",
    title: "Acessibilidade",
    desc: "Padrões para interfaces acessíveis e inclusivas.",
  },
];

export default function PadroesPage() {
  return (
    <>
      <h1>Padrões</h1>
      <p className="subtitle">
        Padrões de interface para navegação, formulários, dados, feedback e
        acessibilidade.
      </p>

      <h3>Índice de padrões</h3>
        <table>
          <tbody>
            <tr>
              <th>Padrão</th>
              <th>Descrição</th>
              <th></th>
            </tr>
            {itens.map((c) => (
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