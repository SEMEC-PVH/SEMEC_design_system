import Link from "next/link";
import { ProtoStyle } from "@/components/docs/ComponentDoc";
import { dsByCategory, dsCategories } from "@semec/ds-react/manifest";

export default function CategoryIndex({ catKey }) {
  const cat = dsCategories.find((k) => k.key === catKey);
  const items = dsByCategory(catKey);

  return (
    <>
      <ProtoStyle />
      <h1>{cat.label}</h1>
      <p className="subtitle">{cat.desc}</p>

      <div className="demo-cards">
        {items.map((c) => (
          <Link key={c.slug} href={`/componentes/${c.slug}`} className="demo-card">
            <div className="tag">{c.code}</div>
            <div className="title">{c.label}</div>
            <p>{c.desc}</p>
            <div className="foot">
              <span className="go">Ver componente</span>
              <span className="arrow" aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
