import DemoCard from "@/components/demos/DemoCard";
import CodeBlock from "@/components/docs/CodeBlock";

export const metadata = { title: "Componente ServiceCard" };

const CODE = `<article className="bg-white rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
  <span className="tag">IPTU</span>
  <span className="badge bg-warning-surface text-warning">Novo</span>
  <h3 className="font-bold text-text-brand">Restituição de IPTU</h3>
  <p>Solicite a restituição de valores pagos a maior no IPTU.</p>
  <div className="foot">
    <span>Acessar serviço</span>
    <span className="bg-success-surface text-success hover:bg-success hover:text-text-on-brand">→</span>
  </div>
</article>`;

export default function ServiceCardPage() {
  return (
    <>
      <h1>ServiceCard</h1>
      <p className="subtitle">
        Card de serviço com tag, selo de novidade e estado &quot;em breve&quot;.
      </p>

      <h3>Preview</h3>
      <div className="demo-frame">
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
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Card: <code>bg-white rounded-2xl p-6</code> sem borda, sombra{" "}
        <code>0 4px 16px rgba(0,0,0,0.12)</code> · hover whisper{" "}
        <code>0 8px 24px rgba(0,0,0,0.16)</code> · selo{" "}
        <code>bg-warning-surface text-warning</code> · seta{" "}
        <code>bg-success-surface text-success</code> → hover{" "}
        <code>bg-success text-text-on-brand</code> · &quot;Em breve&quot;{" "}
        <code>bg-#efefef</code>.
      </p>

      <h3>Código</h3>
      <CodeBlock code={CODE} filename="service-card/page.jsx" />
    </>
  );
}