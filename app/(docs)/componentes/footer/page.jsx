import Preview from "@/components/ui/Preview";
import DemoFooter from "@/components/demos/DemoFooter";

export const metadata = { title: "Componente Footer" };

export default function FooterPage() {
  return (
    <>
      <h1>Footer</h1>
      <p className="subtitle">
        Rodapé institucional com descrição, redes e links.
      </p>

      <h3>Preview</h3>
      <Preview note="Fundo bg-[#223f99] text-white · texto secundário text-white/80 · links hover:text-yellow-400 · ícones bg-white/10.">
        <DemoFooter />
      </Preview>
    </>
  );
}