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
          Card: <code>bg-white rounded-2xl p-6</code> sem borda, sombra{" "}
          <code>0 4px 16px rgba(0,0,0,0.12)</code> · hover whisper{" "}
          <code>0 8px 24px rgba(0,0,0,0.16)</code> · selo{" "}
          <code>bg-pv-yellow-500 text-pv-blue-950</code> · seta{" "}
          <code>bg-pv-green-50</code> → hover{" "}
          <code>bg-pv-green-600 text-white</code> · &quot;Em breve&quot;{" "}
          <code>bg-#efefef</code>.
        </p>
      </Card>
    </>
  );
}