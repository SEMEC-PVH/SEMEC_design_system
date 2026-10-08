import JornadaCliente from "@/components/quem-somos/batalha/JornadaCliente";

// Protótipo das batalhas da Vila SEMEC. Depois de validado, as batalhas
// passam a ser iniciadas pelos líderes de ginásio dentro do mapa 3D.
export const metadata = {
  title: "Batalhas da Vila SEMEC (protótipo)",
  robots: { index: false, follow: false },
};

export default function BatalhaPage() {
  return (
    <div className="no-toc">
      <h1>Batalhas da Vila SEMEC</h1>
      <p className="subtitle">
        Protótipo: escolha uma linguagem de programação, vença os ginásios
        Front-End, Back-End e Dados e conquiste as Stacks para virar Full Stack.
      </p>
      <JornadaCliente />
    </div>
  );
}
