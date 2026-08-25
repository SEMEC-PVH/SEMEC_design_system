export const metadata = { title: "Pendências" };

export default function PendenciasPage() {
  return (
    <>
      <h1>Pendências / dívidas</h1>
      <p className="subtitle">
        Itens conhecidos a resolver na evolução do design system.
      </p>

      <ul>
        <li>
          <code>#223f99</code> (azul do herói, footer e logotipo) é usado como
          hex solto e <strong>não tem token</strong>. Criar{" "}
          <code>pv-blue-*</code> e migrar.
        </li>
        <li>
          <code>slate-*</code> é usado para bordas de card e inputs; decidir
          se vira token ou permanece como neutro utilitário.
        </li>
        <li>
          Cada serviço em <code>src/servicos/*</code> tem <code>.css</code>{" "}
          próprio; migrar para tokens e componentes gradualmente.
        </li>
        <li>
          Tokens shadcn (<code>--color-primary</code> etc.) só funcionam
          dentro de <code>.calc-root</code>; se o portal adotar shadcn
          globalmente, redefinir.
        </li>
      </ul>
    </>
  );
}