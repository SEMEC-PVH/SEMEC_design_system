import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Cabeçalho" };

export default function CabecalhoPage() {
  return (
    <PatternPage
      title="Cabeçalho"
      component="Cabeçalho"
      subtitle="Topo da página com marca, navegação principal e ações contextuais."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Manter a marca no canto superior esquerdo, sempre clicável para a home.",
            "Agrupar ações primárias (busca, login, idioma) de forma consistente.",
            "Manter o cabeçalho fixo em telas longas, sem roubar espaço excessivo.",
            "Reduzir a altura do cabeçalho em telas pequenas.",
            "Garantir contraste adequado entre o fundo do cabeçalho e o conteúdo.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não sobrecarregar o cabeçalho com ações secundárias.",
            "Não usar a marca com link quebrado ou sem destino.",
            "Não esconder a busca em telas pequenas sem alternativa clara.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Usar <header> como landmark.",
            "Garantir que o link da marca tenha texto alternativo adequado.",
            "Manter ordem lógica de foco: marca, navegação, ações.",
          ],
        },
      ]}
      note="O cabeçalho é o elemento mais repetido da interface; qualquer mudança nele afeta todas as páginas."
    />
  );
}
