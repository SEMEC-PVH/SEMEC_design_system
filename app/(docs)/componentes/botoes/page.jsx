import ComponentDoc, { ProtoStyle } from "@/components/docs/ComponentDoc";
import { dsBySlug } from "@/lib/base-manifest";

export const metadata = { title: "Botões" };

const portalPattern = `<div className="flex gap-4">
  <button className="bg-pv-blue-900 hover:bg-pv-blue-800 text-white focus-visible:ring-2 focus-visible:ring-pv-green-800">
    Ação principal
  </button>
  <button className="bg-pv-green-600 text-white focus-visible:ring-2 focus-visible:ring-pv-green-800">
    CTA de destaque
  </button>
  <button className="text-pv-blue-900 underline">Link de nav</button>
</div>`;

export default function BotoesPage() {
  const c = dsBySlug["botoes"];
  return (
    <ComponentDoc
      c={c}
      extra={
        <>
          <h3>Padrão atual no portal</h3>
          <p style={{ fontSize: "0.9rem" }}>
            O portal SEMEC Digital usa cores literais por classe; nota QA-01: a
            escolha entre o azul institucional e o <code>--pv-blue-hero</code>{" "}
            ainda não está decidida. Em sites novos, prefira o componente{" "}
            <code>Button</code>.
          </p>
          <pre>
            <code>{portalPattern}</code>
          </pre>
        </>
      }
    />
  );
}
