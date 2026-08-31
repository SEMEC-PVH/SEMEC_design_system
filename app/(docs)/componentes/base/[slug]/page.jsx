import { readFileSync } from "fs";
import { join } from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import BasePreview from "@/components/demos/base-previews";
import CodeBlock from "@/components/docs/CodeBlock";
import { protoBySlug, protoComponents, protoPrompt } from "@/lib/base-manifest";

export function generateStaticParams() {
  return protoComponents.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = protoBySlug[slug];
  return { title: c ? `Base — ${c.label}` : "Base" };
}

export default async function BaseComponentPage({ params }) {
  const { slug } = await params;
  const c = protoBySlug[slug];
  if (!c) notFound();

  const source = readFileSync(join(process.cwd(), c.file), "utf8");
  const idx = protoComponents.findIndex((x) => x.slug === c.slug);
  const prev = protoComponents[idx - 1];
  const next = protoComponents[idx + 1];

  return (
    <>
      <h1>{c.label}</h1>
      <p className="subtitle">{c.desc}</p>

      <h3>Preview</h3>
      <BasePreview slug={c.slug} />

      {c.variants.length > 0 && (
        <>
          <h3>Variantes e composição</h3>
          <table>
            <thead>
              <tr>
                <th>Prop / grupo</th>
                <th>Valores</th>
              </tr>
            </thead>
            <tbody>
              {c.variants.map((v) => (
                <tr key={v.prop}>
                  <td>
                    <code>{v.prop}</code>
                  </td>
                  <td>{v.values}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h3>Uso</h3>
      <CodeBlock code={c.usage} filename="@semec/base" prompt={protoPrompt(c)} />

      <h3>Fonte do componente</h3>
      <CodeBlock
        code={source}
        filename={c.file}
        prompt={protoPrompt(c)}
      />

      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginTop: "2rem" }}>
        {prev ? (
          <Link href={`/componentes/base/${prev.slug}`}>← {prev.label}</Link>
        ) : (
          <span />
        )}
        {next && <Link href={`/componentes/base/${next.slug}`}>{next.label} →</Link>}
      </div>
    </>
  );
}
