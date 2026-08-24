import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Contraste de cores" };

export default function ContrasteDeCoresPage() {
  return (
    <PatternPage
      title="Contraste de cores"
      subtitle="Garantia de legibilidade do texto e dos elementos visuais sobre o fundo."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Manter contraste mínimo de 4,5:1 para texto normal (WCAG AA).",
            "Usar 3:1 para textos grandes e componentes de interface.",
            "Verificar o contraste de estados (hover, foco, desabilitado).",
            "Testar com ferramentas de verificação de contraste.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar cinza claro sobre branco para texto.",
            "Não confiar apenas na cor para transmitir informação.",
            "Não usar combinações de baixo contraste em elementos essenciais.",
          ],
        },
        {
          title: "Conformidade",
          items: [
            "Atender ao critério 1.4.3 da WCAG (Contraste mínimo).",
            "Atender ao critério 1.4.11 (Contraste de componentes não textuais).",
            "Documentar as combinações aprovadas no guia de cores.",
          ],
        },
      ]}
      note="Contraste é a base da legibilidade; sem ele, o conteúdo existe mas não é lido."
    />
  );
}