import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Máscaras" };

export default function MascarasPage() {
  return (
    <PatternPage
      title="Máscaras"
      component="Campos com máscara"
      subtitle="Formatação automática da entrada para padrões conhecidos (CPF, telefone, datas, CEP)."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Aplicar máscara apenas a formatos bem conhecidos e estáveis.",
            "Permitir que o usuário digite apenas números e a máscara formate sozinha.",
            "Manter a máscara visível enquanto o usuário digita.",
            "Aceitar a entrada mesmo sem a máscara (ex.: colar um CPF sem pontuação).",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar máscara que impeça o usuário de corrigir o valor.",
            "Não aplicar máscara a campos de formato livre.",
            "Não bloquear caracteres sem explicar o formato esperado.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Garantir que o valor formatado seja legível por leitores de tela.",
            "Fornecer placeholder ou rótulo indicando o formato esperado.",
            "Não depender da máscara para validar — validar o valor real.",
          ],
        },
      ]}
      note="Máscara facilita a entrada, mas nunca deve esconder o valor real digitado."
    />
  );
}
