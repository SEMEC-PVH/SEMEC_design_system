import PatternPage from "@/components/ui/PatternPage";
import PreviewFrame from "@/components/docs/PreviewFrame";
import CodeBlock from "@/components/docs/CodeBlock";
import { FormAdvanced, formAdvancedUsage } from "@/components/demos/examples/form-advanced";

export const metadata = { title: "Máscaras" };

export default function MascarasPage() {
  return (
    <>
      <PatternPage
        title="Máscaras"
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
      <h2>Exemplo — máscaras CPF/CNPJ/CEP/moeda</h2>
      <p>Mesmo formulário da página Validação — altere tipo PF/PJ para ver CPF↔CNPJ, CEP e moeda em tempo real.</p>
      <PreviewFrame>
        <div style={{ padding: "1rem" }}>
          <FormAdvanced />
        </div>
      </PreviewFrame>
      <CodeBlock code={formAdvancedUsage} filename="FormAdvanced.jsx" prompt="Crie campos com máscara CPF CNPJ CEP moeda usando @semec/ds-react — Input com inputMode numeric e formatação ao digitar" />
    </>
  );
}
