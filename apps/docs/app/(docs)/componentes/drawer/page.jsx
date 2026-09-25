import DrawerDemo from "@/components/demos/DrawerDemo";

export const metadata = { title: "Drawer" };

export default function DrawerPage() {
  return (
    <>
      <h1>Drawer</h1>
      <p className="subtitle">
        Painel deslizante de qualquer lado da tela.
      </p>

      <h3>Demonstração</h3>
      <p>
        Clique no botão abaixo para abrir o painel lateral. Ele pode ser fechado
        pelo botão de fechar, clicando fora ou pressionando Esc.
      </p>
      <div className="preview">
        <DrawerDemo />
      </div>

      <h3>Quando usar</h3>
      <p>
        Para exibir detalhes, configurações ou formulários complementares sem
        tirar o usuário da página atual. É ideal quando o conteúdo não precisa
        de uma página inteira, mas também não cabe em um{" "}
        <code>Tooltip</code> ou <code>Popover</code>.
      </p>

      <h3>Quando não usar</h3>
      <p>
        Para mensagens de confirmação simples — use <code>AlertDialog</code>.
        Para conteúdo que deve ocupar toda a tela, como um formulário
        principal — use uma rota dedicada. Para informações extremamente
        breves, como uma dica — use <code>Tooltip</code>.
      </p>

      <h3>Acessibilidade</h3>
      <ul>
        <li>
          Construído sobre <code>@radix-ui/react-dialog</code>, que gerencia{" "}
          <code>role=&quot;dialog&quot;</code> e <code>aria-modal</code>{" "}
          automaticamente.
        </li>
        <li>
          Foco é capturado dentro do painel (focus trap) e retorna ao trigger
          ao fechar.
        </li>
        <li>
          Pode ser fechado com <code>Esc</code> ou clicando no overlay.
        </li>
        <li>
          Título e descrição são vinculados via <code>aria-labelledby</code> e{" "}
          <code>aria-describedby</code>.
        </li>
      </ul>

      <h3>Uso</h3>
      <pre>
        <code>{`<Drawer>
  <DrawerTrigger asChild>
    <Button>Abrir painel</Button>
  </DrawerTrigger>
  <DrawerContent side="right">
    <DrawerHeader>
      <DrawerTitle>Detalhes</DrawerTitle>
      <DrawerDescription>Informações do protocolo.</DrawerDescription>
    </DrawerHeader>
    <div className="p-6">Conteúdo aqui</div>
    <DrawerFooter>
      <DrawerClose asChild>
        <Button variant="outline">Fechar</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`}</code>
      </pre>

      <h3>Props</h3>
      <p>
        <code>Drawer</code> aceita as mesmas props do{" "}
        <code>Dialog.Root</code> do Radix. <code>DrawerContent</code> aceita a
        prop <code>side</code> (<code>&quot;top&quot;</code>,{" "}
        <code>&quot;bottom&quot;</code>, <code>&quot;left&quot;</code>,{" "}
        <code>&quot;right&quot;</code>), com padrão{" "}
        <code>&quot;bottom&quot;</code>.
      </p>
    </>
  );
}
