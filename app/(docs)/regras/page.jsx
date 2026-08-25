import Link from "next/link";
import Card from "@/components/ui/Card";

export const metadata = { title: "Regras" };

const itens = [
  {
    href: "/regras/animacoes",
    title: "Animações",
    desc: "Easing padrão, movimento e prefers-reduced-motion.",
  },
  {
    href: "/regras/acessibilidade",
    title: "Acessibilidade",
    desc: "Foco visível, contraste e semântica de landmarks.",
  },
  {
    href: "/regras/anti-padroes",
    title: "Anti-padrões",
    desc: "O que não fazer ao construir interfaces SEMEC.",
  },
  {
    href: "/regras/pendencias",
    title: "Pendências",
    desc: "Dívidas conhecidas e próximos passos do design system.",
  },
];

export default function RegrasPage() {
  return (
    <>
      <h1>Regras</h1>
      <p className="subtitle">
        Regras de uso que garantem consistência, acessibilidade e boas práticas
        nas interfaces.
      </p>

      <Card>
        <h3>Índice de regras</h3>
        <table>
          <tbody>
            <tr>
              <th>Regra</th>
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