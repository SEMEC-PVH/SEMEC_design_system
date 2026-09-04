import PatternPage from "@/components/ui/PatternPage";
import PreviewFrame from "@/components/docs/PreviewFrame";
import CodeBlock from "@/components/docs/CodeBlock";
import { FormAdvanced, formAdvancedUsage } from "@/components/demos/examples/form-advanced";

export const metadata = { title: "Validação" };

export default function ValidacaoPage() {
  return (
    <>
      <PatternPage
        title="Validação"
        subtitle="Verificação dos dados no momento certo para evitar erros e retrabalho."
        sections={[
          {
            title: "Boas práticas",
            items: [
              "Validar em tempo real (ao sair do campo) para feedback imediato.",
              "Validar novamente no envio para garantir consistência.",
              "Validar no servidor — a validação no cliente é conveniência, não segurança.",
              "Explicar claramente o que está errado e como corrigir.",
            ],
          },
          {
            title: "Anti-padrões",
            items: [
              "Não validar apenas no envio, obrigando o usuário a adivinhar o erro.",
              "Não bloquear o envio sem explicar o motivo.",
              "Não validar com regras inconsistentes entre cliente e servidor.",
            ],
          },
          {
            title: "Acessibilidade",
            items: [
              "Anunciar erros de validação para leitores de tela (aria-live).",
              "Associar a mensagem de erro ao campo correspondente.",
              "Garantir que o foco vá para o primeiro campo com erro.",
            ],
          },
        ]}
        note="Validação boa previne erro; validação ruim apenas o descobre tarde demais."
      />
      <h2>Exemplo interativo — Formulário com validação a11y [KIT SEM-505]</h2>
      <p>Máscaras CPF/CNPJ/CEP/moeda, validação onBlur + onSubmit, ErrorSummary com links para campos, anúncio aria-live. Copie snippet.</p>
      <PreviewFrame>
        <div style={{ padding: "1rem" }}>
          <FormAdvanced />
        </div>
      </PreviewFrame>
      <CodeBlock code={formAdvancedUsage} filename="FormAdvanced.jsx" prompt="Crie formulário com máscara CPF/CNPJ/CEP/moeda e validação a11y usando @semec/base (FormField + ErrorSummary + aria-live)" />
    </>
  );
}
