import Card from "@/components/ui/Card";

export const metadata = { title: "Termos de uso" };

export default function TermosDeUsoPage() {
  return (
    <>
      <h1>Termos de uso do site</h1>
      <p className="subtitle">
        Condições de uso do guia visual do Design System da SEMEC Porto Velho.
      </p>

      <Card>
        <h3>Aceitação dos termos</h3>
        <p>
          Ao acessar este site, você concorda com os termos de uso descritos
          abaixo. Se não concordar com algum ponto, recomendamos que não
          utilize o conteúdo disponibilizado.
        </p>
      </Card>

      <Card>
        <h3>Uso do conteúdo</h3>
        <p>
          Este site é um guia visual de referência do Design System da SEMEC.
          Ele documenta fundamentos de tipografia, cores, layout e componentes,
          e não constitui uma biblioteca de componentes pronta para uso em
          outros projetos. O conteúdo pode ser consultado livremente para fins
          de referência e capacitação interna.
        </p>
      </Card>

      <Card>
        <h3>Propriedade intelectual</h3>
        <p>
          As marcas, logotipos e elementos visuais apresentados pertencem à
          Secretaria Municipal de Educação (SEMEC) e à Prefeitura de Porto
          Velho. A reprodução do conteúdo deve preservar a identidade
          institucional e não pode ser feita para fins comerciais sem
          autorização.
        </p>
      </Card>

      <Card>
        <h3>Isenção de responsabilidade</h3>
        <p>
          O conteúdo é disponibilizado "como está", com caráter informativo.
          A SEMEC não se responsabiliza por decisões tomadas com base nas
          informações aqui apresentadas.
        </p>
      </Card>
    </>
  );
}