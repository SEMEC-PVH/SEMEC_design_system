import Preview from "@/components/ui/Preview";
import DemoControls from "@/components/demos/DemoControls";

export const metadata = { title: "Barra de controles" };

export default function ControlesPage() {
  return (
    <>
      <h1>Barra de controles</h1>
      <p className="subtitle">
        Tabs, busca e chips de filtro do catálogo de serviços.
      </p>

      <h3>Preview</h3>
      <Preview note="Sobreposto ao herói com -mt-12 · aba ativa com indicador bg-pv-green-600 · foco de input focus:ring-pv-green-500/20 · chip ativo bg-pv-blue-900 text-white.">
        <DemoControls />
      </Preview>
    </>
  );
}