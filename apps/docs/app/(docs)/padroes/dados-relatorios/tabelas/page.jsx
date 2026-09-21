import PatternPage from "@/components/ui/PatternPage";
import PreviewFrame from "@/components/docs/PreviewFrame";
import CodeBlock from "@/components/docs/CodeBlock";
import { TableAdvanced } from "@/components/demos/examples/table-advanced";
import { tableAdvancedUsage } from "@/components/demos/examples/table-advanced-data";

export const metadata = { title: "Tabelas" };

export default function TabelasPage() {
  return (
    <>
      <PatternPage
        title="Tabelas"
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
      <h2>Exemplo interativo — Tabela avançada [KIT SEM-504]</h2>
      <p>Ordenação, filtros (busca + status), paginação, seleção em lote, export CSV, EmptyState e Skeleton. Copie snippet.</p>
      <PreviewFrame>
        <div style={{ padding: "1rem" }}>
          <TableAdvanced />
        </div>
      </PreviewFrame>
      <CodeBlock code={tableAdvancedUsage} filename="TableAdvanced.jsx" prompt="Crie Tabela avançada com ordenação, filtros, paginação, seleção, EmptyState e Skeleton usando semec-ds-react" />
    </>
  );
}