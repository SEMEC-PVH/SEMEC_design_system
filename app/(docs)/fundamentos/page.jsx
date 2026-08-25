import Link from "next/link";
import Card from "@/components/ui/Card";

export const metadata = { title: "Fundamentos" };

const itens = [
  {
    href: "/fundamentos/tipografia",
    title: "Tipografia",
    desc: "Famílias e escala renderizada dos títulos, corpo e microtexto.",
  },
  {
    href: "/fundamentos/cores",
    title: "Cores",
    desc: "Paletas pv-blue, pv-green, pv-yellow, neutros e papéis semânticos.",
  },
  {
    href: "/fundamentos/layout",
    title: "Layout",
    desc: "Container, grid de cards e regras de espaçamento.",
  },
  {
    href: "/fundamentos/raios-sombras",
    title: "Raios, bordas e sombras",
    desc: "Escala de raios e família de sombras institucional.",
  },
];

export default function FundamentosPage() {
  return (
    <>
      <h1>Fundamentos</h1>
      <p className="subtitle">
        Bases visuais que sustentam todas as interfaces — tipografia, cores,
        layout e acabamentos.
      </p>

      <Card>
        <h3>Índice de fundamentos</h3>
        <table>
          <tbody>
            <tr>
              <th>Fundamento</th>
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
      </Card>
    </>
  );
}