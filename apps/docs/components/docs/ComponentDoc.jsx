import { readFileSync } from "fs";
import { join } from "path";
import Link from "next/link";
import BasePreview from "@/components/demos/base-previews";
import CodeBlock from "@/components/docs/CodeBlock";
import { dsByCategory, dsCategories, dsPrompt } from "semec-ds/skills";
import { dsPackageRootResolve } from "semec-ds/react/server";

export function ProtoStyle() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/proto/proto.css" />
    </>
  );
}

export default function ComponentDoc({ c, extra }) {
  const source = readFileSync(join(dsPackageRootResolve(), c.file), "utf8");
  const cat = dsCategories.find((k) => k.key === c.category);
  const list = dsByCategory(c.category);
  const i = list.findIndex((x) => x.slug === c.slug);
  const prev = list[i - 1];
  const next = list[i + 1];

  return (
    <>
      <ProtoStyle />
      <h1>{c.label}</h1>
      <p className="subtitle">
        {c.desc}{" "}
        <span className="component-meta">
          No código: <code>{c.code}</code> — <code>{c.file}</code> ·{" "}
          <Link href={`/componentes/${cat.slug}`}>{cat.label}</Link>
        </span>
      </p>

      {extra}

      <h3>Preview</h3>
      <BasePreview slug={c.code} />

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
      <CodeBlock code={c.usage} filename="semec-ds-react" prompt={dsPrompt(c)} />

      <h3>Fonte do componente</h3>
      <CodeBlock code={source} filename={c.file} prompt={dsPrompt(c)} />

      <div className="doc-nav">
        {prev ? (
          <Link href={`/componentes/${prev.slug}`}>← {prev.label}</Link>
        ) : (
          <span />
        )}
        {next && <Link href={`/componentes/${next.slug}`}>{next.label} →</Link>}
      </div>
    </>
  );
}
