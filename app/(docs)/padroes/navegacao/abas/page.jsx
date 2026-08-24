import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Abas" };

export default function AbasPage() {
  return (
    <PatternPage
      title="Abas"
      subtitle="Alternância entre visões de um mesmo contexto sem trocar de página."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Usar abas para conteúdo mutuamente exclusivo do mesmo contexto.",
            "Manter rótulos curtos e descritivos.",
            "Indicar claramente a aba ativa com estado visual distinto.",
            "Preservar o estado de cada aba ao alternar entre elas.",
            "Limitar o número de abas para evitar sobrecarga visual.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar abas para conteúdo que deveria estar em páginas separadas.",
            "Não usar abas para ações (isso é papel de botões).",
            "Não esconder conteúdo importante atrás de abas sem pista.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Usar o padrão de abas com role=\"tablist\", role=\"tab\" e role=\"tabpanel\".",
            "Gerenciar foco com setas entre as abas.",
            "Associar cada aba ao painel com aria-controls e aria-selected.",
          ],
        },
      ]}
      note="Abas organizam, não escondem: o usuário deve perceber que há mais conteúdo disponível."
    />
  );
}
