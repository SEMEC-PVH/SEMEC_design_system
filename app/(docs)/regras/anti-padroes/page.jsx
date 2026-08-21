import Card from "@/components/ui/Card";

export const metadata = { title: "Anti-padrões" };

export default function AntiPadroesPage() {
  return (
    <>
      <h1>Anti-padrões</h1>
      <p className="subtitle">O que não fazer ao construir interfaces SEMEC.</p>

      <Card>
        <ol>
          <li>
            Não usar <code>font-press-start</code> fora do logotipo.
          </li>
          <li>
            Não usar hex solto de cor — sempre token <code>pv-*</code>.
          </li>
          <li>
            Não criar sombra com preto puro — usar a família{" "}
            <code>rgba(15,35,56,…)</code>.
          </li>
          <li>
            Não inventar raio novo — usar os valores da seção de raios.
          </li>
          <li>
            Não criar CSS local por serviço para o que já tem token ou
            componente.
          </li>
          <li>
            Não usar <code>slate</code> para cor de marca — marca é sempre{" "}
            <code>pv-*</code>.
          </li>
          <li>
            Não quebrar o grid de cards (1/2/3 colunas) sem motivo.
          </li>
        </ol>
      </Card>
    </>
  );
}