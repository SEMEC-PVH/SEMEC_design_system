import Link from "next/link";
import { dsCategories, dsComponents } from "@/lib/base-manifest";

export const metadata = { title: "Componentes · Visão geral" };

const portal = [
  { href: "/componentes/header", title: "Header", desc: "Topo com marca, navegação e CTA." },
  { href: "/componentes/hero", title: "Hero", desc: "Bloco de abertura com eyebrow, título e métricas." },
  { href: "/componentes/controles", title: "Barra de controles", desc: "Tabs, busca e chips de filtro do catálogo." },
  { href: "/componentes/service-card", title: "ServiceCard", desc: "Card de serviço com tag, selo e hover." },
  { href: "/componentes/error-summary", title: "ErrorSummary", desc: "Resumo de erros de formulário acessível." },
  { href: "/componentes/footer", title: "Footer", desc: "Rodapé institucional com links e redes." },
];

export default function ComponentesPage() {
  return (
    <>
      <h1>Componentes</h1>
      <p className="subtitle">
        Visão geral · cada componente tem página própria com preview, código e
        prompt copiável. Os componentes do sistema vivem em{" "}
        <code>base/</code> (kit <code>@semec/base</code>).
      </p>

      {dsCategories.map((cat) => {
        const items = dsComponents.filter((c) => c.category === cat.key);
        return (
          <section key={cat.key}>
            <h3>
              <Link href={`/componentes/${cat.slug}`}>{cat.label}</Link>
            </h3>
            <table>
              <tbody>
                {items.map((c) => (
                  <tr key={c.slug}>
                    <td>
                      <Link
                        href={`/componentes/${c.slug}`}
                        style={{ color: "var(--pv-green-800)", fontWeight: 600 }}
                      >
                        {c.label}
                      </Link>
                    </td>
                    <td>{c.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}

      <h3>Páginas do portal</h3>
      <table>
        <tbody>
          {portal.map((c) => (
            <tr key={c.href}>
              <td>
                <Link
                  href={c.href}
                  style={{ color: "var(--pv-green-800)", fontWeight: 600 }}
                >
                  {c.title}
                </Link>
              </td>
              <td>{c.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
