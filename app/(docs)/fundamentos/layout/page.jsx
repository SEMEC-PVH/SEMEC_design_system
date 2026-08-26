import Card from "@/components/ui/Card";
import DemoCard from "@/components/demos/DemoCard";

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
          Container <code>max-w-6xl</code> (72rem) · padding <code>px-4</code> ·{" "}
          centralizado <code>mx-auto</code>. Grid de cards:{" "}
          <code>grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3</code>.
        </p>
        <p className="note">
          O limite de <code>72rem</code> vale para as interfaces construídas
          com o sistema (portal). Este guia de documentação usa largura fluida
          para leitura e não segue esse limite.
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