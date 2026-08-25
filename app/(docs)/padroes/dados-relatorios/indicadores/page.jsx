import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Indicadores" };

export default function IndicadoresPage() {
  return (
    <PatternPage
      title="Indicadores"
      component="Cartões de indicadores"
      subtitle="Números-chave que resumem o estado dos dados em um relance."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Exibir poucos indicadores relevantes, não todos os números possíveis.",
            "Rotular cada indicador com texto claro.",
            "Comparar com contexto quando útil (ex.: variação vs. período anterior).",
            "Manter os indicadores atualizados com os filtros aplicados.",
            "Explicar a fonte e o período dos dados.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não exibir indicadores sem rótulo ou sem contexto.",
            "Não sobrecarregar a tela com números sem hierarquia.",
            "Não mostrar indicadores desatualizados sem aviso.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Não transmitir o valor apenas por cor ou tamanho.",
            "Garantir que o texto do indicador seja legível e contrastado.",
            "Oferecer o dado em texto, não apenas em gráfico.",
          ],
        },
      ]}
      note="Indicadores respondem 'como estamos?'; gráficos respondem 'por quê?'."
    />
  );
}