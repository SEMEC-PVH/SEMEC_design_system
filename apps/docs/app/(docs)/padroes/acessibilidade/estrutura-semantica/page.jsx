import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Estrutura semântica" };

export default function EstruturaSemanticaPage() {
  return (
    <PatternPage
      title="Estrutura semântica"
      subtitle="Uso de elementos HTML com significado correto para estrutura e conteúdo."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Usar landmarks (header, nav, main, footer) para as regiões da página.",
            "Hierarquizar títulos (h1 a h6) sem pular níveis.",
            "Usar listas para itens relacionados.",
            "Usar tabelas semânticas com th e scope para dados tabulares.",
            "Usar botões para ações e links para navegação.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar divs para tudo, perdendo o significado.",
            "Não usar títulos apenas pelo tamanho visual.",
            "Não usar links para ações que deveriam ser botões.",
          ],
        },
        {
          title: "Conformidade",
          items: [
            "Atender ao critério 1.3.1 da WCAG (Informação e relações).",
            "Atender ao critério 4.1.2 (Nome, função e valor).",
            "Validar a estrutura com ferramentas de auditoria.",
          ],
        },
      ]}
      note="Semântica é o alicerce: leitores de tela, busca e navegação dependem dela."
    />
  );
}