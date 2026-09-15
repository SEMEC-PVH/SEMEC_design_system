import Link from "next/link";
import { dsCategories, dsComponents, dsPortal } from "@semec/ds-react/manifest";

export const metadata = { title: "Componentes · Visão geral" };

const sections = [
  {
    key: dsPortal.key,
    label: dsPortal.label,
    href: null,
    desc: dsPortal.desc,
    items: dsPortal.items.map((p) => ({ slug: p.slug, label: p.label, desc: p.desc })),
  },
  ...dsCategories.map((cat) => ({
    key: cat.key,
    label: cat.label,
    href: `/componentes/${cat.slug}`,
    desc: cat.desc,
    items: dsComponents.filter((c) => c.category === cat.key),
  })),
];

export default function ComponentesPage() {
  return (
    <>
      <h1>Componentes</h1>
      <p className="subtitle">
        Visão geral · cada componente tem página própria com preview, código e
        prompt copiável. Os componentes do sistema vivem em{" "}
        <code>packages/react/</code> (pacote <code>@semec/ds-react</code>); a{" "}
        <strong>{dsPortal.label}</strong> reúne a casca do portal, base para os
        componentes que o kit vai criar.
      </p>

      {sections.map((s) => (
        <section key={s.key}>
          <h3>
            {s.href ? (
              <Link href={s.href}>{s.label}</Link>
            ) : (
              s.label
            )}
          </h3>
          <table>
            <tbody>
              {s.items.map((c) => (
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
      ))}
    </>
  );
}