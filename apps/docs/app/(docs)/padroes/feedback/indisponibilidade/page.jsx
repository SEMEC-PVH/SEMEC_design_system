import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Indisponibilidade" };

export default function IndisponibilidadePage() {
  return (
    <PatternPage
      title="Indisponibilidade"
      component="Tela de indisponibilidade"
      subtitle="Comunicação de serviços ou funcionalidades temporariamente fora do ar."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Explicar que o serviço está indisponível e por quê, quando conhecido.",
            "Indicar quando o serviço deve voltar, se houver previsão.",
            "Oferecer alternativa quando existir (telefone, outro canal).",
            "Permitir tentar novamente quando a indisponibilidade for breve.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não mostrar erros técnicos sem explicação.",
            "Não deixar o usuário sem saber se o problema é dele ou do sistema.",
            "Não prometer prazos que não podem ser cumpridos.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Anunciar a indisponibilidade para leitores de tela.",
            "Garantir que a mensagem seja perceptível e clara.",
            "Oferecer canais alternativos acessíveis.",
          ],
        },
      ]}
      note="Indisponibilidade honesta preserva a confiança: informe, oriente e ofereça saída."
    />
  );
}