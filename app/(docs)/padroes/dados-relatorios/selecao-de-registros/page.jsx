import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Seleção de registros" };

export default function SelecaoDeRegistrosPage() {
  return (
    <PatternPage
      title="Seleção de registros"
      subtitle="Marcação de itens de uma lista para aplicar ações em conjunto."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Oferecer checkbox em cada linha e um seletor no cabeçalho.",
            "Indicar quantos registros estão selecionados.",
            "Permitir selecionar todos os registros da página e, quando fizer sentido, de todas as páginas.",
            "Manter a seleção visível ao aplicar ações.",
            "Confirmar ações destrutivas sobre registros selecionados.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não esconder a seleção atual do usuário.",
            "Não aplicar ações a registros não selecionados.",
            "Não perder a seleção ao trocar de página sem aviso.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Associar cada checkbox ao registro correspondente.",
            "Anunciar a contagem de selecionados para leitores de tela.",
            "Garantir operação por teclado na seleção.",
          ],
        },
      ]}
      note="Seleção é o passo anterior a ações em lote; deve ser sempre visível e reversível."
    />
  );
}