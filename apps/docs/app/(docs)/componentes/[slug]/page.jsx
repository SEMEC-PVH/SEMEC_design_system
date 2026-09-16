import { notFound } from "next/navigation";
import ComponentDoc from "@/components/docs/ComponentDoc";
import { dsBySlug, dsComponents } from "@semec/ds-react/manifest";
import { BotoesExtras, BotaoDeIconeExtras, LinkExtras } from "@/components/demos/action-extras";

export function generateStaticParams() {
  return dsComponents.map((c) => ({ slug: c.slug }));
}

const EXTRAS = {
  botoes: <BotoesExtras />,
  "botao-de-icone": <BotaoDeIconeExtras />,
  link: <LinkExtras />,
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = dsBySlug[slug];
  return { title: c ? c.label : "Componentes" };
}

export default async function ComponentePage({ params }) {
  const { slug } = await params;
  const c = dsBySlug[slug];
  if (!c) notFound();
  return <ComponentDoc c={c} extra={EXTRAS[slug]} />;
}
