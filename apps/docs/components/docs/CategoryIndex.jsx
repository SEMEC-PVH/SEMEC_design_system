import Link from "next/link";
import { ProtoStyle } from "@/components/docs/ComponentDoc";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import { dsByCategory, dsCategories } from "semec-ds/skills";

export default function CategoryIndex({ catKey }) {
  const cat = dsCategories.find((k) => k.key === catKey);
  const items = dsByCategory(catKey);

  return (
    <>
      <ProtoStyle />
      <h1>{cat.label}</h1>
      <p className="subtitle">{cat.desc}</p>

      <div className="demo-cards">
        {items.map((c, i) => (
          <AnimateOnScroll key={c.slug} delay={i * 0.05}>
            <Link href={`/componentes/${c.slug}`} className="demo-card">
              <div className="tag">{c.code}</div>
              <div className="title">{c.label}</div>
              <p>{c.desc}</p>
              <div className="foot">
                <span className="go">Ver componente</span>
                <span className="arrow" aria-hidden="true">→</span>
              </div>
            </Link>
          </AnimateOnScroll>
        ))}
      </div>
    </>
  );
}
