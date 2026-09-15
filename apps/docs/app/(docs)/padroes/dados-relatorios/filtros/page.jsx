import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Filtros" };

export default function FiltrosPage() {
  return (
    <PatternPage
      title="Filtros"
      component="Painel de filtros"
      subtitle="Restrição dos dados exibidos por critérios selecionados pelo usuário."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Oferecer filtros para os critérios mais comuns de cada contexto.",
            "Mostrar os filtros ativos e permitir removê-los individualmente.",
            "Atualizar os resultados imediatamente ao aplicar um filtro.",
            "Combinar filtros com busca e ordenação sem conflito.",
            "Indicar quantos resultados restam após filtrar.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não esconder os filtros ativos do usuário.",
            "Não aplicar filtros sem feedback imediato.",
            "Não oferecer filtros que retornam sempre vazio sem orientação.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Associar cada filtro a um rótulo claro.",
            "Anunciar a mudança de resultados para leitores de tela.",
            "Garantir operação por teclado em todos os controles de filtro.",
          ],
        },
      ]}
      note="Filtros reduzem o ruído: o usuário vê apenas o que importa para a tarefa."
    />
  );
}