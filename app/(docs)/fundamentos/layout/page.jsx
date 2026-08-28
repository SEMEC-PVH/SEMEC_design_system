import DemoCard from "@/components/demos/DemoCard";
import Card from "@/components/ui/Card";

export const metadata = { title: "Layout" };

export default function LayoutPage() {
  return (
    <>
      <h1>Layout</h1>
      <p className="subtitle">
        Container, grid e regras de espaçamento da página.
      </p>

      <Card>
        <h3>Container &amp; Grid</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--pv-gray-500)", marginBottom: "0.75rem" }}>
          Container de produto <code>var(--container-max)</code> (1200px) ·
          coluna do guia <code>var(--container-docs)</code> (48rem) · medida
          de leitura <code>var(--measure)</code> (72ch) para texto corrido ·
          padding lateral <code>24px</code> (16px em telas &lt;640px) ·
          centralizado <code>mx-auto</code>. Grid de cards:{" "}
          <code>grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3</code>.
        </p>
        <p className="note">
          O limite de <code>1200px</code> vale para as páginas de serviço. O
          guia de documentação usa a coluna mais estreita de{" "}
          <code>48rem</code> — leitura confortável de manuais não pede o mesmo
          teto de um portal — e limita o texto corrido a <code>72ch</code>.
        </p>
        <div className="demo-cards">
          <DemoCard
            tag="IPTU"
            title="Card exemplo"
            description="1 coluna no mobile, 2 em sm, 3 em lg."
          />
          <DemoCard
            tag="ITBI"
            green
            title="Card exemplo"
            description="Gap uniforme de 1.25rem (gap-5)."
          />
          <DemoCard
            tag="Taxas"
            title="Card exemplo"
            description="Espaço interno de card: p-6."
          />
        </div>
      </Card>
    </>
  );
}
