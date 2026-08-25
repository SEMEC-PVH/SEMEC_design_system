import Link from "next/link";

export const metadata = { title: "Padrões · Navegação" };

const itens = [
  { href: "/padroes/navegacao/menu-principal", title: "Menu principal", desc: "Navegação primária de topo." },
  { href: "/padroes/navegacao/navegacao-lateral", title: "Navegação lateral", desc: "Menu de seções em coluna." },
  { href: "/padroes/navegacao/breadcrumbs", title: "Breadcrumbs", desc: "Trilha de localização hierárquica." },
  { href: "/padroes/navegacao/cabecalho", title: "Cabeçalho", desc: "Topo com marca, ações e busca." },
  { href: "/padroes/navegacao/rodape", title: "Rodapé", desc: "Links institucionais e complementares." },
  { href: "/padroes/navegacao/busca", title: "Busca", desc: "Localização de conteúdo por palavra-chave." },
  { href: "/padroes/navegacao/paginacao", title: "Paginação", desc: "Divisão de listas longas em páginas." },
  { href: "/padroes/navegacao/abas", title: "Abas", desc: "Alternância entre visões de um mesmo contexto." },
  { href: "/padroes/navegacao/indicacao-localizacao-atual", title: "Indicação da localização atual", desc: "Onde o usuário está na estrutura." },
];

export default function NavegacaoPage() {
  return (
    <>
      <h1>Navegação</h1>
      <p className="subtitle">
        Padrões de navegação · como o usuário se move e se orienta dentro da
        interface.
      </p>

      <h3>Índice de padrões</h3>
        <table>
          <tbody>
            <tr>
              <th>Padrão</th>
              <th>Descrição</th>
              <th></th>
            </tr>
            {itens.map((c) => (
              <tr key={c.href}>
                <td>
                  <Link href={c.href} style={{ color: "var(--pv-green-800)", fontWeight: 600 }}>
                    {c.title}
                  </Link>
                </td>
                <td>{c.desc}</td>
                <td style={{ textAlign: "right" }}>
                  <Link href={c.href} aria-label={`Abrir página de ${c.title}`}>
                    <span aria-hidden="true">→</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    </>
  );
}
