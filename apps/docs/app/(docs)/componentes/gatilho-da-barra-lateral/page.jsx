import SidebarTriggerDemo from "@/components/demos/SidebarTriggerDemo";

export const metadata = { title: "Gatilho da barra lateral" };

export default function SidebarTriggerPage() {
  return (
    <>
      <h1>Gatilho da barra lateral</h1>
      <p className="subtitle">
        Botão para colapsar/expandir a sidebar, com ícone que indica a ação
        disponível.
      </p>

      <h3>Demonstração</h3>
      <p>
        Clique no botão para alternar o estado da sidebar. O ícone muda para
        refletir a ação: fechar quando aberta, abrir quando fechada.
      </p>
      <div className="preview">
        <SidebarTriggerDemo />
      </div>

      <h3>Quando usar</h3>
      <p>
        Em layouts com sidebar colapsável, onde a pessoa precisa controlar a
        visibilidade do menu lateral.         Também em cabeçalhos ou barras de ferramentas que
        alternam a sidebar em dispositivos móveis.
      </p>

      <h3>Quando não usar</h3>
      <p>
        Quando a sidebar não pode ser colapsada (fixa sempre visível). Para
        navegação entre seções sem sidebar, use <code>NavigationMenu</code> ou{" "}
        <code>Tabs</code>.
      </p>

      <h3>Acessibilidade</h3>
      <ul>
        <li>
          O botão tem <code>aria-expanded</code> que reflete o estado atual da
          sidebar — leitores de tela anunciam &quot;menu expandido&quot; ou
          &quot;menu recolhido&quot;.
        </li>
        <li>
          O rótulo acessível muda entre &quot;Fechar menu&quot; e
          &quot;Abrir menu&quot;, podendo ser personalizado via{" "}
          <code>labelOpen</code> e <code>labelClosed</code>.
        </li>
        <li>
          O ícone é decorativo (<code>aria-hidden=&quot;true&quot;</code>) — a
          informação está no rótulo e no <code>aria-expanded</code>.
        </li>
        <li>
          Recebe foco visível por padrão (herda do <code>IconButton</code>),
          permitindo uso completo por teclado.
        </li>
      </ul>

      <h3>Uso</h3>
      <pre>
        <code>{`import { SidebarToggleButton } from "semec-ds/react";

<SidebarToggleButton
  open={sidebarOpen}
  onToggle={() => setSidebarOpen(v => !v)}
/>`}</code>
      </pre>
      <p>
        <code>open</code> controla qual ícone é exibido.{" "}
        <code>onToggle</code> é chamado ao clicar.{" "}
        <code>labelOpen</code>/<code>labelClosed</code> permitem rótulos
        acessíveis customizados.
      </p>
    </>
  );
}
