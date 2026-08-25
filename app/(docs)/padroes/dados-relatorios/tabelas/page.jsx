import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Tabelas" };

export default function TabelasPage() {
  return (
    <PatternPage
      title="Tabelas"
      component="Tabela de dados"
      subtitle="Exibição estruturada de dados em linhas e colunas para leitura e comparação."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Usar cabeçalhos de coluna claros e descritivos.",
            "Alinhar números à direita e textos à esquerda.",
            "Manter linhas com altura consistente e zebra sutil para leitura.",
            "Permitir rolagem horizontal em telas pequenas sem perder o cabeçalho.",
            "Exibir apenas as colunas necessárias para a tarefa.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não sobrecarregar a tabela com colunas desnecessárias.",
            "Não usar tabelas para layout de página.",
            "Não truncar conteúdo importante sem forma de expandir.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Usar <table> semântico com <th> e scope.",
            "Fornecer caption ou resumo da tabela.",
            "Garantir contraste entre linhas e fundo.",
          ],
        },
      ]}
      note="Tabelas são para comparar e localizar; combine com ordenação e filtros para escalar."
    />
  );
}