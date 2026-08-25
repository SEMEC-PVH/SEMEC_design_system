import Preview from "@/components/ui/Preview";
import DemoHeader from "@/components/demos/DemoHeader";

export const metadata = { title: "Componente Header" };

export default function HeaderPage() {
  return (
    <>
      <h1>Header</h1>
      <p className="subtitle">Topo do portal com marca, navegação e CTA.</p>

      <h3>Preview</h3>
      <Preview note="Fundo bg-white/95 backdrop-blur · marca font-display text-lg sm:text-xl font-extrabold text-[#223f99] · nav link hover:text-pv-green-600 · CTA rounded-full bg-pv-blue-900.">
        <DemoHeader />
      </Preview>
    </>
  );
}