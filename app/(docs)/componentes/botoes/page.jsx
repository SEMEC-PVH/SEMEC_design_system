import Buttons from "@/components/ui/Buttons";

export const metadata = { title: "Botões" };

export default function BotoesPage() {
  return (
    <>
      <h1>Botões</h1>
      <p className="subtitle">
        Variantes de ação: principal, destaque e link.
      </p>

      <h3>Preview</h3>
      <div className="demo-frame">
        <Buttons />
      </div>
      <p style={{ fontSize: "0.8rem", color: "var(--pv-gray-600)", marginTop: "0.75rem" }}>
        Primário <code>bg-pv-blue-900 hover:bg-pv-blue-800</code> · destaque{" "}
        <code>bg-pv-green-600</code> · sempre{" "}
        <code>focus-visible:ring-2 focus-visible:ring-pv-green-800</code>.
      </p>

      <h3>Código</h3>
      <pre>
        <code>{`<div className="flex gap-4">
  <button className="bg-pv-blue-900 hover:bg-pv-blue-800 text-white focus-visible:ring-2 focus-visible:ring-pv-green-800">
    Ação principal
  </button>
  <button className="bg-pv-green-600 text-white focus-visible:ring-2 focus-visible:ring-pv-green-800">
    CTA de destaque
  </button>
  <button className="text-pv-blue-900 underline">Link de nav</button>
</div>`}</code>
      </pre>
    </>
  );
}