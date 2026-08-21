import Card from "@/components/ui/Card";
import Preview from "@/components/ui/Preview";
import DemoHero from "@/components/demos/DemoHero";

export const metadata = { title: "Componente Hero" };

export default function HeroPage() {
  return (
    <>
      <h1>Hero</h1>
      <p className="subtitle">
        Bloco de abertura com eyebrow, título, subtítulo e métricas.
      </p>

      <Card>
        <h3>Preview</h3>
        <Preview note="Fundo bg-[#223f99] · eyebrow text-pv-yellow-500 · título font-display text-4xl sm:text-5xl font-bold text-white · subtítulo text-pv-blue-100.">
          <DemoHero />
        </Preview>
      </Card>
    </>
  );
}