import DemoHero from "@/components/demos/DemoHero";
import CodeBlock from "@/components/docs/CodeBlock";

export const metadata = { title: "Componente Hero" };

const CODE = `<section className="bg-brand-hero px-6 py-10 text-text-on-brand">
  <span className="font-semibold text-text-on-brand">● Portal de Serviços</span>
  <h1 className="text-3xl sm:text-display font-bold text-text-on-brand">
    A Secretaria de Economia está mais perto de você.
  </h1>
  <p className="text-text-on-brand">
    Formulários, informações, requerimentos, calculadoras e guias da SEMEC.
  </p>
</section>`;

export default function HeroPage() {
  return (
    <>
      <h1>Hero</h1>
      <p className="subtitle">
        Bloco de abertura com eyebrow, título, subtítulo e métricas.
      </p>

      <h3>Preview</h3>
      <div className="demo-frame">
        <DemoHero />
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Fundo bg-brand-hero · eyebrow, título (text-3xl sm:text-display
        font-bold) e subtítulo em text-text-on-brand. O amarelo e o azul-claro
        do protótipo são do CSS do site, sem token no kit.
      </p>

      <h3>Código</h3>
      <CodeBlock code={CODE} filename="hero/page.jsx" />
    </>
  );
}