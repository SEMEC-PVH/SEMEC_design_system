import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Breadcrumbs" };

export default function BreadcrumbsPage() {
  return (
    <PatternPage
      title="Breadcrumbs"
      component="Breadcrumbs"
      subtitle="Trilha que mostra a posição do usuário na hierarquia e permite voltar a níveis superiores."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Começar sempre pela raiz (ex.: Início) e terminar na página atual.",
            "Marcar o último item como a página atual, sem link.",
            "Usar separadores simples (› ou /) entre os níveis.",
            "Manter cada nível intermediário clicável para voltar.",
            "Usar breadcrumbs em estruturas com 3 ou mais níveis de profundidade.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar breadcrumbs em páginas de primeiro nível (sem hierarquia).",
            "Não duplicar o menu principal como breadcrumb.",
            "Não truncar níveis intermediários sem forma de acessá-los.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Envolver a trilha em <nav> com aria-label.",
            "Marcar a página atual com aria-current=\"page\".",
            "Garantir que os links tenham alvo de foco visível.",
          ],
        },
      ]}
      note="Breadcrumbs complementam a navegação; não substituem o menu principal nem a indicação de localização."
    />
  );
}
