import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Campos obrigatórios" };

export default function CamposObrigatoriosPage() {
  return (
    <PatternPage
      title="Campos obrigatórios"
      component="Indicação de campos obrigatórios"
      subtitle="Como indicar, de forma clara e consistente, quais campos precisam ser preenchidos."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Marcar campos obrigatórios com asterisco (*) e explicar a convenção no início do formulário.",
            "Usar a mesma marcação em todos os formulários do sistema.",
            "Evitar marcar quase todos os campos como obrigatórios — questione a necessidade.",
            "Combinar o asterisco com texto (ex.: 'Obrigatório') quando houver dúvida.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar apenas cor para indicar obrigatoriedade.",
            "Não marcar campos opcionais com asterisco.",
            "Não omitir a legenda explicando o significado do asterisco.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Não depender só do asterisco — usar também o atributo required e aria-required.",
            "Garantir que leitores de tela anunciem a obrigatoriedade.",
            "Manter contraste adequado da marcação.",
          ],
        },
      ]}
      note="A obrigatoriedade deve ser perceptível antes do envio, não apenas após o erro."
    />
  );
}
