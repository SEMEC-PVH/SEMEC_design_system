import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Operações em lote" };

export default function OperacoesEmLotePage() {
  return (
    <PatternPage
      title="Operações em lote"
      subtitle="Ações aplicadas a vários registros selecionados de uma só vez."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Exigir seleção explícita antes de habilitar ações em lote.",
            "Mostrar quantos registros serão afetados.",
            "Confirmar antes de operações irreversíveis ou de grande impacto.",
            "Informar o resultado ao final (sucesso, falhas parciais).",
            "Permitir cancelar operações em andamento quando possível.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não aplicar ações em lote sem seleção visível.",
            "Não executar operações destrutivas sem confirmação.",
            "Não silenciar falhas parciais.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Anunciar o início e o fim da operação para leitores de tela.",
            "Garantir que a confirmação seja operável por teclado.",
            "Reportar falhas de forma acessível.",
          ],
        },
      ]}
      note="Operações em lote economizam tempo, mas exigem confiança: confirme e reporte."
    />
  );
}