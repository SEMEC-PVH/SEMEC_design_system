import { readFileSync } from "fs";
import { join } from "path";
import Link from "next/link";
import BasePreview from "@/components/demos/base-previews";
import CodeBlock from "@/components/docs/CodeBlock";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import { dsCategories, dsPrompt } from "semec-ds/skills";
import { dsPackageRootResolve } from "semec-ds/react/server";

export function ProtoStyle() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return (
    <>
      <link rel="stylesheet" href={`${basePath}/proto/proto.css`} />
    </>
  );
}

export default function ComponentDoc({ c, extra }) {
  const source = readFileSync(join(dsPackageRootResolve(), c.file), "utf8");
  const cat = dsCategories.find((k) => k.key === c.category);

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

      <AnimateOnScroll>
        <h3>Preview</h3>
        <BasePreview slug={c.code} />
      </AnimateOnScroll>

      {c.variants.length > 0 && (
        <AnimateOnScroll delay={0.1}>
          <h3>Variantes e composição</h3>
          <div className="table-scroll">
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
          </div>
        </AnimateOnScroll>
      )}

      <AnimateOnScroll delay={0.15}>
        <h3>Uso</h3>
        <CodeBlock code={c.usage} filename="semec-ds-react" prompt={dsPrompt(c)} />
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.2}>
        <h3>Fonte do componente</h3>
        <CodeBlock code={source} filename={c.file} prompt={dsPrompt(c)} />
      </AnimateOnScroll>
    </>
  );
}
