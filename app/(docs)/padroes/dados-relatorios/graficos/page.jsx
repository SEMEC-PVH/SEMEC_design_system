import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Gráficos" };

export default function GraficosPage() {
  return (
    <PatternPage
      title="Gráficos"
      subtitle="Visualização de tendências, distribuições e comparações de dados."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Escolher o tipo de gráfico adequado ao dado (barras, linha, pizza).",
            "Rotular eixos, séries e valores com clareza.",
            "Usar cores consistentes com a paleta do sistema.",
            "Oferecer os dados em texto ou tabela como alternativa.",
            "Manter os gráficos atualizados com os filtros aplicados.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar gráficos 3D ou decorativos que distorcem a leitura.",
            "Não depender apenas de cor para distinguir séries.",
            "Não exibir gráficos sem título ou sem contexto.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Fornecer alternativa textual (tabela ou resumo) para cada gráfico.",
            "Não usar cor como único diferenciador de séries.",
            "Garantir contraste das cores usadas no gráfico.",
          ],
        },
      ]}
      note="Gráfico bom comunica; gráfico decorativo confunde. Sempre ofereça os dados em texto."
    />
  );
}