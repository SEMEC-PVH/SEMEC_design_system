import { notFound } from "next/navigation";
import ComponentDoc from "@/components/docs/ComponentDoc";
import { dsBySlug, dsComponents } from "semec-ds/skills";
import { BotoesExtras, BotaoDeIconeExtras, LinkExtras } from "@/components/demos/action-extras";
import {
  AlertDialogExtras,
  ComboboxExtras,
  DataTableExtras,
  DrawerExtras,
  DropdownMenuExtras,
  ErrorSummaryExtras,
  FileUploadExtras,
  SheetExtras,
  SidebarTriggerExtras,
} from "@/components/demos/kit-extras";

export function generateStaticParams() {
  return dsComponents.map((c) => ({ slug: c.slug }));
}

const EXTRAS = {
  botoes: <BotoesExtras />,
  "botao-de-icone": <BotaoDeIconeExtras />,
  link: <LinkExtras />,
  combobox: <ComboboxExtras />,
  "envio-de-arquivos": <FileUploadExtras />,
  sheet: <SheetExtras />,
  "tabela-de-dados": <DataTableExtras />,
  drawer: <DrawerExtras />,
  "dialogo-de-alerta": <AlertDialogExtras />,
  "gatilho-da-barra-lateral": <SidebarTriggerExtras />,
  "menu-suspenso": <DropdownMenuExtras />,
  "error-summary": <ErrorSummaryExtras />,
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
