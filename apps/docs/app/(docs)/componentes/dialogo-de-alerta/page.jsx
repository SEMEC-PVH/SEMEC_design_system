import AlertDialogDemo from "@/components/demos/AlertDialogDemo";

export const metadata = { title: "Diálogo de alerta" };

export default function AlertDialogPage() {
  return (
    <>
      <h1>Diálogo de alerta</h1>
      <p className="subtitle">
        Confirmação perigosa. Força decisão (ação/cancelar) antes de prosseguir.
      </p>

      <h3>Demonstração</h3>
      <p>
        Clique no botão destrutivo para abrir o diálogo. A ação só será executada
        se a pessoa confirmar. O foco fica preso dentro do diálogo até que ele
        seja fechado.
      </p>
      <div className="preview">
        <AlertDialogDemo />
      </div>

      <h3>Quando usar</h3>
      <p>
        Sempre que uma ação for irreversível ou tiver impacto significativo —
        exclusão de registro, cancelamento de processo, envio definitivo. O
        diálogo impede que a ação aconteça por acidente.
      </p>

      <h3>Quando não usar</h3>
      <p>
        Para ações reversíveis ou de baixo impacto, como confirmar uma edição
        simples. Use <code>ConfirmDialog</code> ou um feedback inline. Para
        erros que já aconteceram, use <code>Alert</code>.
      </p>

      <h3>Acessibilidade</h3>
      <ul>
        <li>
          O Radix <code>AlertDialog</code> define{" "}
          <code>role=&quot;alertdialog&quot;</code> automaticamente, anunciando
          o conteúdo para leitores de tela.
        </li>
        <li>
          O foco é capturado dentro do diálogo e não pode sair até que ele seja
          fechado (focus trap).
        </li>
        <li>
          Pressionar <kbd>Esc</kbd> fecha o diálogo e retorna o foco ao
          elemento que o abriu.
        </li>
        <li>
          O overlay ao fundo é clicável e também fecha o diálogo.
        </li>
        <li>
          <code>AlertDialogTitle</code> e <code>AlertDialogDescription</code>{" "}
          são vinculados via <code>aria-labelledby</code> e{" "}
          <code>aria-describedby</code>.
        </li>
      </ul>

      <h3>Uso</h3>
      <pre>
        <code>{`<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Excluir</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir item?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta ação não pode ser desfeita.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction>Excluir</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}</code>
      </pre>
      <p>
        <code>AlertDialogAction</code> é o botão de confirmação.{" "}
        <code>AlertDialogCancel</code> fecha o diálogo sem executar a ação. Ambos
        são internamente fechamentos do Radix — qualquer um pode acionar o
        fechamento.
      </p>
    </>
  );
}
