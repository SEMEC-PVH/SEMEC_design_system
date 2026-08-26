import DemoHero from "@/components/demos/DemoHero";

export const metadata = { title: "Componente Hero" };

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
      <p style={{ fontSize: "0.8rem", color: "var(--pv-gray-500)", marginTop: "0.75rem" }}>
        Fundo bg-[#223f99] · eyebrow text-pv-yellow-500 · título
        font-display text-4xl sm:text-5xl font-bold text-white · subtítulo
        text-pv-blue-100.
      </p>

      <h3>Código</h3>
      <pre>
        <code>{`<section className="bg-[#223f99] px-6 py-10 text-white">
  <span className="text-pv-yellow-500">● Portal de Serviços</span>
  <h1 className="font-display text-4xl sm:text-5xl font-bold text-white">
    A Secretaria de Economia está mais perto de você.
  </h1>
  <p className="text-pv-blue-100">
    Formulários, informações, requerimentos, calculadoras e guias da SEMEC.
  </p>
</section>`}</code>
      </pre>
    </>
  );
}