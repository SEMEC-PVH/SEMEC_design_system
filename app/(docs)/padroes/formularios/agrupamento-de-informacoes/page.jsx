import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Agrupamento de informações" };

export default function AgrupamentoDeInformacoesPage() {
  return (
    <PatternPage
      title="Agrupamento de informações"
      component="Agrupamento de seções"
      subtitle="Organização lógica dos campos em seções para facilitar o preenchimento."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Agrupar campos relacionados (dados pessoais, endereço, contato).",
            "Usar títulos de seção claros para cada grupo.",
            "Ordenar os grupos em uma sequência lógica de preenchimento.",
            "Manter grupos curtos para não sobrecarregar a atenção.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não misturar campos não relacionados no mesmo grupo.",
            "Não criar grupos sem título ou sem sentido claro.",
            "Não espalhar campos relacionados por seções distantes.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Usar <fieldset> e <legend> para agrupar campos relacionados.",
            "Garantir que a estrutura de títulos seja lógica.",
            "Manter ordem de tabulação coerente com a ordem visual.",
          ],
        },
      ]}
      note="Agrupamento reduz carga cognitiva: o usuário entende o que vem a seguir."
    />
  );
}
