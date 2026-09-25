import ComboboxDemo from "@/components/demos/ComboboxDemo";

export const metadata = { title: "Combobox" };

export default function ComboboxPage() {
  return (
    <>
      <h1>Combobox</h1>
      <p className="subtitle">
        Campo com busca e lista filtrada.
      </p>

      <h3>Demonstração</h3>
      <p>
        Digite para filtrar as opções ou use as setas para navegar pela lista.
        Pressione Enter para selecionar e Esc para fechar.
      </p>
      <div className="preview">
        <ComboboxDemo />
      </div>

      <h3>Quando usar</h3>
      <p>
        Quando o usuário precisa escolher entre muitas opções e a busca por
        texto acelera a seleção. Útil para listas de documentos, categorias,
        países ou qualquer conjunto superior a uma dúzia de itens.
      </p>

      <h3>Quando não usar</h3>
      <p>
        Para poucas opções (até 5), um <code>Select</code> simples é mais rápido.
        Para valores que não existem na lista, use um campo de texto livre com{" "}
        <code>Input</code>.
      </p>

      <h3>Acessibilidade</h3>
      <ul>
        <li>
          Usa <code>role=&quot;combobox&quot;</code> e <code>aria-expanded</code> para
          indicar o estado aberto/fechado ao leitor de tela.
        </li>
        <li>
          A lista filtrada pode ser navegada com setas acima/abaixo, e Enter
          confirma a seleção.
        </li>
        <li>
          Esc fecha a lista e Tab move o foco para o próximo elemento.
        </li>
        <li>
          O valor selecionado é anunciado como live region para confirmar a
          escolha.
        </li>
      </ul>

      <h3>Uso</h3>
      <pre>
        <code>{`import { Combobox } from "semec-ds/react";

<Combobox
  options={[
    { value: "cnpj", label: "CNPJ" },
    { value: "cpf", label: "CPF" },
  ]}
  value={valor}
  onChange={setValor}
  placeholder="Selecione o documento"
/>`}</code>
      </pre>
      <p>
        <code>options</code> é um array de objetos com <code>value</code> e{" "}
        <code>label</code>. <code>value</code> é o valor controlado;{" "}
        <code>onChange</code> recebe o novo valor.
      </p>
    </>
  );
}
