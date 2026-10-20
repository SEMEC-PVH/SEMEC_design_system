import QuemSomos from "@/components/quem-somos/equipe/QuemSomos";

export const metadata = { title: "Quem Somos" };

// Primeiro a página da equipe; a Vila SEMEC 3D só carrega ao clicar em
// "Jogar na Vila SEMEC" (ou em /quem-somos#vila). Ver QuemSomos.jsx.
export default function QuemSomosPage() {
  return (
    <div className="no-toc">
      <QuemSomos />
    </div>
  );
}
