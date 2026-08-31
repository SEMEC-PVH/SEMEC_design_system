import Link from "next/link";
import { protoCategories, protoComponents } from "@/lib/base-manifest";

export const metadata = { title: "Base (@semec/base) — Visão geral" };

export default function BaseIndexPage() {
  return (
    <>
      <h1>Base (@semec/base)</h1>
      <p className="subtitle">
        Camada genérica para sites futuros em React + Tailwind v4 + shadcn,
        versionada em <code>base/</code>. Protótipo: preview ao vivo, código e
        prompt copiável de cada componente.
      </p>

      {protoCategories.map((cat) => {
        const items = protoComponents.filter((c) => c.category === cat.key);
        return (
          <section key={cat.key}>
            <h3>{cat.label}</h3>
            <div className="demo-cards">
              {items.map((c) => (
                <Link key={c.slug} href={`/componentes/base/${c.slug}`} className="demo-card">
                  <div className="tag">{c.slug}</div>
                  <div className="title">{c.label}</div>
                  <p>{c.desc}</p>
                  <div className="foot">
                    <span className="go">Ver preview</span>
                    <span className="arrow" aria-hidden="true">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
