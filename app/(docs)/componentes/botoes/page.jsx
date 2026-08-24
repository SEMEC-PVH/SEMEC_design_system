import Card from "@/components/ui/Card";
import Buttons from "@/components/ui/Buttons";

export const metadata = { title: "Botões" };

export default function BotoesPage() {
  return (
    <>
      <h1>Botões</h1>
      <p className="subtitle">
        Variantes de ação: principal, destaque e link.
      </p>

      <Card>
        <h3>Preview</h3>
        <Buttons />
        <p style={{ fontSize: "0.8rem", color: "var(--pv-gray-600)", marginTop: "0.75rem" }}>
          Primário <code>bg-pv-blue-900 hover:bg-pv-blue-800</code> · destaque{" "}
          <code>bg-pv-green-600</code> · sempre{" "}
          <code>focus-visible:ring-2 focus-visible:ring-pv-green-800</code>.
        </p>
      </Card>
    </>
  );
}