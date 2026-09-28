import DemoControls from "@/components/demos/DemoControls";
import CodeBlock from "@/components/docs/CodeBlock";

export const metadata = { title: "Barra de controles" };

const CODE = `<div className="demo-controls -mt-12">
  <div role="tablist" aria-label="Categorias de serviços">
    <button role="tab" aria-selected="true">
      Todos <span className="count">40</span>
    </button>
    <button role="tab" aria-selected="false">
      Serviços <span className="count">18</span>
    </button>
  </div>
  <div className="search">
    <input
      type="search"
      placeholder="Buscar serviço ou informação…"
      className="focus:ring-pv-green-500/20"
    />
  </div>
  <div className="chips">
    <button className="bg-pv-blue-900 text-white">Todas</button>
    <button>IPTU</button>
  </div>
</div>`;

export default function ControlesPage() {
  return (
    <>
      <h1>Barra de controles</h1>
      <p className="subtitle">
        Tabs, busca e chips de filtro do catálogo de serviços.
      </p>

      <h3>Preview</h3>
      <div className="demo-frame">
        <DemoControls />
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Sobreposto ao herói com -mt-12 · aba ativa com indicador
        bg-pv-green-600 · foco de input focus:ring-pv-green-500/20 · chip ativo
        bg-pv-blue-900 text-white.
      </p>

      <h3>Código</h3>
      <CodeBlock code={CODE} filename="controles/page.jsx" />
    </>
  );
}