import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Não uso exclusivo de cores" };

export default function NaoUsoExclusivoDeCoresPage() {
  return (
    <PatternPage
      title="Não uso exclusivo de cores"
      subtitle="Informação transmitida por mais de um canal, além da cor."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Combinar cor com texto, ícone ou padrão para transmitir estado.",
            "Usar texto além da cor em mensagens de sucesso, erro e aviso.",
            "Diferenciar séries de gráficos por padrão ou rótulo, não só por cor.",
            "Verificar a interface em escala de cinza.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar apenas vermelho/verde para indicar erro/sucesso.",
            "Não usar apenas cor para destacar o item ativo.",
            "Não diferenciar campos obrigatórios só pela cor.",
          ],
        },
        {
          title: "Conformidade",
          items: [
            "Atender ao critério 1.4.1 da WCAG (Uso de cor).",
            "Atender ao critério 1.4.3 (Contraste mínimo).",
            "Testar a interface em escala de cinza.",
          ],
        },
      ]}
      note="Cerca de 8% dos homens têm daltonismo; cor nunca deve ser o único canal de informação."
    />
  );
}