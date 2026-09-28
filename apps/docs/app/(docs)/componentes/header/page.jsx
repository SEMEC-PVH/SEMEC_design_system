import DemoHeader from "@/components/demos/DemoHeader";
import CodeBlock from "@/components/docs/CodeBlock";

export const metadata = { title: "Componente Header" };

const CODE = `<header className="bg-white/95 backdrop-blur">
  <div className="brand">
    <span className="logo" aria-hidden="true" />
    <span className="font-display text-lg sm:text-xl font-extrabold text-[#223f99]">
      SEMEC DIGITAL
    </span>
  </div>
  <nav className="flex items-center gap-5">
    <a href="#" className="hover:text-pv-green-600">Sobre a SEMEC</a>
    <a href="#" className="rounded-full bg-pv-blue-900 px-6 py-2 text-white">
      Fale Conosco
    </a>
  </nav>
</header>`;

export default function HeaderPage() {
  return (
    <>
      <h1>Header</h1>
      <p className="subtitle">Topo do portal com marca, navegação e CTA.</p>

      <h3>Preview</h3>
      <div className="demo-frame">
        <DemoHeader />
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Fundo bg-white/95 backdrop-blur · marca font-display text-lg sm:text-xl
        font-extrabold text-[#223f99] · nav link hover:text-pv-green-600 · CTA
        rounded-full bg-pv-blue-900.
      </p>

      <h3>Código</h3>
      <CodeBlock code={CODE} filename="header/page.jsx" />
    </>
  );
}