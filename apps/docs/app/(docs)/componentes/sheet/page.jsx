import SheetDemo from "@/components/demos/SheetDemo";

export const metadata = { title: "Sheet" };

export default function SheetPage() {
  return (
    <>
      <h1>Sheet</h1>
      <p className="subtitle">
        Painel lateral modal com overlay. Variantes left/right/top/bottom.
      </p>

      <h3>Demonstração</h3>
      <p>
        Clique no botão para abrir o painel lateral com filtros. O overlay
        bloqueia a interação com o fundo.
      </p>
      <div className="preview">
        <SheetDemo />
      </div>

      <h3>Quando usar</h3>
      <p>
        Para painéis de filtros, configurações secundárias ou pré-visualização
        de conteúdo que não precisa de uma página dedicada. Bom para painéis
        laterais no desktop.
      </p>

      <h3>Quando não usar</h3>
      <p>
        Para confirmações perigosas, use <code>AlertDialog</code>. Para bottom
        sheets no mobile, use <code>Drawer</code>. Para fluxos primários, use
        uma página dedicada.
      </p>

      <h3>Acessibilidade</h3>
      <ul>
        <li>
          Baseado em Radix Dialog: <code>role=&quot;dialog&quot;</code> e{" "}
          <code>aria-modal</code>.
        </li>
        <li>Armadilha de foco e fechamento por Esc/overlay.</li>
        <li>
          <code>aria-labelledby</code> e{" "}
          <code>aria-describedby</code> via SheetTitle/SheetDescription.
        </li>
        <li>
          Botão de fechar com label <code>sr-only</code>.
        </li>
      </ul>

      <h3>Uso</h3>
      <pre>
        <code>{`import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose, Button } from "semec-ds/react";

<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Abrir filtros</Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Filtros</SheetTitle>
      <SheetDescription>Refine sua busca.</SheetDescription>
    </SheetHeader>
    <div className="p-6">Filtros aqui</div>
    <SheetFooter>
      <SheetClose asChild>
        <Button>Aplicar</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`}</code>
      </pre>
    </>
  );
}
