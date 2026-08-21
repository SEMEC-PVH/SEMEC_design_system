import Card from "@/components/ui/Card";
import DemoCard from "@/components/demos/DemoCard";

export const metadata = { title: "Componente ServiceCard" };

export default function ServiceCardPage() {
  return (
    <>
      <h1>ServiceCard</h1>
      <p className="subtitle">
        Card de serviço com tag, selo de novidade e estado &quot;em breve&quot;.
      </p>

      <Card>
        <h3>Preview</h3>
        <div className="demo-cards">
          <DemoCard
            tag="IPTU"
            badge="Novo"
            title="Restituição de IPTU"
            description="Solicite a restituição de valores pagos a maior no IPTU."
            go="Acessar serviço"
          />
          <DemoCard
            tag="ITBI"
            green
            title="Declaração de ITBI Rural"
            description="Declare a transmissão de imóvel rural e gere o documento."
          />
          <DemoCard
            tag="Taxas"
            title="Em breve"
            description="Este serviço ainda não está disponível online."
            go="Em breve"
            soon
          />
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--pv-gray-500)", marginTop: "0.75rem" }}>
          Card: <code>rounded-2xl border border-slate-200/80 bg-white p-6</code>{" "}
          · hover <code>-translate-y-1</code> + sombra · selo{" "}
          <code>bg-pv-yellow-500 text-pv-blue-950</code> · seta{" "}
          <code>bg-pv-green-50</code> → hover{" "}
          <code>bg-pv-green-600 text-white</code> · &quot;Em breve&quot;{" "}
          <code>border-dashed</code>.
        </p>
      </Card>
    </>
  );
}