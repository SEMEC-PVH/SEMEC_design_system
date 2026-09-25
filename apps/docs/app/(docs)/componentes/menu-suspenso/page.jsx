import DropdownMenuDemo from "@/components/demos/DropdownMenuDemo";

export const metadata = { title: "Menu suspenso" };

export default function DropdownMenuPage() {
  return (
    <>
      <h1>Menu suspenso</h1>
      <p className="subtitle">
        Menu flutuante com itens, checkbox, radio, sub-menus e separadores.
      </p>

      <h3>Demonstração</h3>
      <p>
        Clique no botão de três pontos para abrir o menu. Navegue pelas opções
        usando o teclado (setas, Enter, Esc).
      </p>
      <div className="preview">
        <DropdownMenuDemo />
      </div>

      <h3>Quando usar</h3>
      <p>
        Para ações secundárias ou contextuais de um elemento, como editar,
        duplicar ou excluir um item. Quando o número de opções não justifica uma
        barra de ferramentas visível, o menu suspenso mantém a interface limpa.
      </p>

      <h3>Quando não usar</h3>
      <p>
        Para navegação principal entre páginas — use <code>NavigationMenu</code>{" "}
        ou <code>Tabs</code>. Para ações destrutivas que exigem confirmação,
        combine com <code>AlertDialog</code>. Para seleção de um valor de
        formulário, use <code>Select</code> ou <code>Combobox</code>.
      </p>

      <h3>Acessibilidade</h3>
      <ul>
        <li>
          O trigger funciona com Enter, Espaço e setas — o menu abre e o foco
          vai para o primeiro item.
        </li>
        <li>
          Setas para cima/baixo navegam entre itens; seta direita em item com
          sub-menu o abre; Esc fecha o menu e retorna o foco ao trigger.
        </li>
        <li>
          Itens desabilitados ficam focáveis mas não acionáveis, mantendo a
          previsibilidade da navegação por teclado.
        </li>
        <li>
          O menu fecha automaticamente ao clicar fora ou pressionar Esc.
        </li>
        <li>
          Implementado sobre Radix UI — gerencia           <code>aria-expanded</code>,{" "}
          <code>role=&quot;menu&quot;</code> e{" "}
          <code>role=&quot;menuitem&quot;</code> automaticamente.
        </li>
      </ul>

      <h3>Uso</h3>
      <pre>
        <code>{`import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "semec-ds/react";
import { Button } from "semec-ds/react";
import { MoreHorizontal } from "lucide-react";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Editar</DropdownMenuItem>
    <DropdownMenuItem>Duplicar</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}</code>
      </pre>
    </>
  );
}
