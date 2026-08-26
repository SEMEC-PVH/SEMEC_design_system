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
      <div className="demo-frame">
        <DemoFooter />
      </div>
      <p style={{ fontSize: "0.8rem", color: "var(--pv-gray-500)", marginTop: "0.75rem" }}>
        Fundo bg-[#223f99] text-white · texto secundário text-white/80 · links
        hover:text-yellow-400 · ícones bg-white/10.
      </p>

      <h3>Código</h3>
      <pre>
        <code>{`<footer className="bg-[#223f99] text-white">
  <div className="font-bold">SEMEC DIGITAL</div>
  <p className="text-white/80">
    Serviços e informações da Secretaria Municipal de Economia em uma
    experiência digital mais clara, direta e acessível.
  </p>
  <div className="social">
    <a href="#" className="bg-white/10" aria-label="Facebook">f</a>
    <a href="#" className="bg-white/10" aria-label="Instagram">◎</a>
    <a href="#" className="bg-white/10" aria-label="YouTube">▶</a>
  </div>
  <p className="text-white/80">
    <a href="#" className="hover:text-yellow-400">Política de Privacidade</a> ·{" "}
    <a href="#" className="hover:text-yellow-400">Termos de Uso</a>
  </p>
</footer>`}</code>
      </pre>
    </>
  );
}