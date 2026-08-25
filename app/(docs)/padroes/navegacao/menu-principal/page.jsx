import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Menu principal" };

export default function MenuPrincipalPage() {
  return (
    <PatternPage
      title="Menu principal"
      component="Menu principal"
      subtitle="Navegação primária de topo que dá acesso às seções de maior nível da interface."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Manter no máximo 5 a 7 itens de primeiro nível; além disso, agrupar em submenus.",
            "Usar rótulos curtos, claros e previsíveis — o usuário deve adivinhar o destino.",
            "Marcar o item ativo com estado visual distinto (cor, peso ou sublinhado).",
            "Garantir que o menu seja acessível por teclado (Tab, Enter, setas nos submenus).",
            "Manter o menu fixo e consistente em todas as páginas do mesmo nível.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar rótulos criativos ou ambíguos que escondam o conteúdo.",
            "Não criar submenus com mais de dois níveis de profundidade.",
            "Não esconder itens importantes atrás de menus sem pista visual.",
            "Não mudar a ordem dos itens entre páginas.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Usar <nav> com aria-label para o menu principal.",
            "Expor submenus com aria-expanded e aria-controls.",
            "Garantir foco visível em cada item do menu.",
          ],
        },
      ]}
      note="O menu principal é o primeiro ponto de orientação do usuário; ele deve ser estável e previsível."
    />
  );
}
