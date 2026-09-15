import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Navegação por teclado" };

export default function NavegacaoPorTecladoPage() {
  return (
    <PatternPage
      title="Navegação por teclado"
      subtitle="Garantia de que toda a interface possa ser operada sem mouse."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Garantir ordem lógica de tabulação (Tab/Shift+Tab).",
            "Permitir ativar todos os controles com Enter ou Espaço.",
            "Usar setas para navegar em menus, abas e listas.",
            "Oferecer atalhos para ações frequentes quando fizer sentido.",
            "Garantir que o foco não fique preso em modais ou diálogos.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não criar controles que só respondem a clique.",
            "Não usar tabindex positivo que quebra a ordem natural.",
            "Não esconder o foco ao navegar por teclado.",
          ],
        },
        {
          title: "Conformidade",
          items: [
            "Atender ao critério 2.1.1 da WCAG (Teclado).",
            "Atender ao critério 2.1.2 (Sem armadilha de teclado).",
            "Testar toda a interface apenas com teclado.",
          ],
        },
      ]}
      note="Se uma ação só funciona com mouse, ela não existe para parte dos usuários."
    />
  );
}