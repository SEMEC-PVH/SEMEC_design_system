import ErrorSummaryDemo from "@/components/demos/ErrorSummaryDemo";

export const metadata = { title: "ErrorSummary" };

export default function ErrorSummaryPage() {
  return (
    <>
      <h1>ErrorSummary</h1>
      <p className="subtitle">
        Resumo dos erros de um formulário, no topo, com link para cada campo.
      </p>

      <h3>Demonstração</h3>
      <p>
        Envie o formulário vazio e navegue só pelo teclado. O resumo recebe o
        foco, anuncia os erros e leva a cada campo por Enter.
      </p>
      <div className="preview">
        <ErrorSummaryDemo />
      </div>

      <h3>Quando usar</h3>
      <p>
        Sempre que um formulário puder falhar em mais de um campo. Em
        formulário longo, é o que permite descobrir o que deu errado sem
        percorrer a página inteira.
      </p>

      <h3>Quando não usar</h3>
      <p>
        Em formulário de campo único, a mensagem junto ao campo basta — o
        resumo só acrescenta um passo. Para erro que não é de validação,
        como falha de rede, use <code>Alert</code>.
      </p>

      <h3>Acessibilidade</h3>
      <ul>
        <li>
          <code>role=&quot;alert&quot;</code> faz o leitor de tela anunciar o
          bloco assim que ele aparece.
        </li>
        <li>
          O resumo recebe o foco — não o primeiro campo. Quem chega ouve
          quantos erros existem antes de decidir para onde ir; ir direto ao
          campo esconderia os demais.
        </li>
        <li>
          Cada item é link para o campo que o causou, e o foco vai para o
          controle mesmo quando o <code>id</code> está no invólucro.
        </li>
        <li>
          Erro nunca é sinalizado só por cor: há texto, borda mais espessa e
          sublinhado no link.
        </li>
        <li>
          Resumo vazio não é renderizado. Um <code>role=&quot;alert&quot;</code>{" "}
          sem conteúdo faz o leitor anunciar o nada.
        </li>
        <li>
          Atende aos critérios 3.3.1 e 3.3.3 da WCAG, que a página de{" "}
          <a href="/padroes/acessibilidade/mensagens-de-erro-acessiveis">
            mensagens de erro acessíveis
          </a>{" "}
          já exigia.
        </li>
      </ul>

      <h3>Uso</h3>
      <pre>
        <code>{`<ErrorSummary
  errors={[
    { id: "cpf", message: "O CPF precisa ter 11 dígitos." },
    { id: "email", message: "O e-mail precisa conter @." },
  ]}
  focusKey={tentativa}
/>`}</code>
      </pre>
      <p>
        <code>id</code> é o do campo. <code>focusKey</code> muda a cada envio,
        para que o resumo refoque quando a pessoa tenta de novo e a lista de
        erros é a mesma.
      </p>

      <h3>Sobre a implementação</h3>
      <p>
        É o primeiro componente escrito inteiramente sobre a camada semântica
        de <code>tokens.css</code> — nenhum hex, nenhum valor solto. Quando o
        azul institucional (QA-01) e o vermelho de erro (QA-07) forem
        decididos, este componente acompanha sem ser tocado.
      </p>
    </>
  );
}
