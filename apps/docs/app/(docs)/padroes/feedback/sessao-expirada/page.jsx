import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Sessão expirada" };

export default function SessaoExpiradaPage() {
  return (
    <PatternPage
      title="Sessão expirada"
      component="Tela de sessão expirada"
      subtitle="Tratamento de sessões que terminam por inatividade ou tempo limite."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Avisar antes de expirar a sessão, quando possível.",
            "Explicar o que aconteceu e por quê.",
            "Oferecer caminho claro para voltar a entrar.",
            "Preservar o trabalho do usuário quando possível.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não expirar a sessão sem aviso, descartando o trabalho.",
            "Não redirecionar para o login sem explicar o motivo.",
            "Não perder dados não salvos sem aviso.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Anunciar a expiração para leitores de tela.",
            "Garantir que o caminho de reautenticação seja acessível.",
            "Manter o foco em local útil após a expiração.",
          ],
        },
      ]}
      note="Expiração de sessão deve ser previsível e preservar o trabalho do usuário."
    />
  );
}