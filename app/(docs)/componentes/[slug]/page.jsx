import { notFound } from "next/navigation";
import ComponentDoc from "@/components/docs/ComponentDoc";
import { dsBySlug, dsComponents } from "@/lib/base-manifest";

export function generateStaticParams() {
  return dsComponents.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = dsBySlug[slug];
  return { title: c ? c.label : "Componentes" };
}

export default async function ComponentePage({ params }) {
  const { slug } = await params;
  const c = dsBySlug[slug];
  if (!c) notFound();
  return <ComponentDoc c={c} />;
}
