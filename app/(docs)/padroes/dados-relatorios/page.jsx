import Link from "next/link";
import Card from "@/components/ui/Card";

export const metadata = { title: "Padrões · Dados e relatórios" };

const itens = [
  { href: "/padroes/dados-relatorios/tabelas", title: "Tabelas", desc: "Exibição estruturada de dados em linhas e colunas." },
  { href: "/padroes/dados-relatorios/ordenacao", title: "Ordenação", desc: "Reorganização dos dados por coluna." },
  { href: "/padroes/dados-relatorios/filtros", title: "Filtros", desc: "Restrição dos dados exibidos por critérios." },
  { href: "/padroes/dados-relatorios/pesquisa", title: "Pesquisa", desc: "Localização de registros por texto." },
  { href: "/padroes/dados-relatorios/paginacao", title: "Paginação", desc: "Divisão de grandes conjuntos de dados." },
  { href: "/padroes/dados-relatorios/selecao-de-registros", title: "Seleção de registros", desc: "Marcação de itens para ações em conjunto." },
  { href: "/padroes/dados-relatorios/exportacao", title: "Exportação", desc: "Geração de arquivos a partir dos dados exibidos." },
  { href: "/padroes/dados-relatorios/operacoes-em-lote", title: "Operações em lote", desc: "Ações aplicadas a vários registros de uma vez." },
  { href: "/padroes/dados-relatorios/indicadores", title: "Indicadores", desc: "Números-chave que resumem o estado dos dados." },
  { href: "/padroes/dados-relatorios/graficos", title: "Gráficos", desc: "Visualização de tendências e comparações." },
  { href: "/padroes/dados-relatorios/estados-sem-resultados", title: "Estados sem resultados", desc: "Como apresentar listas e buscas vazias." },
];

export default function DadosRelatoriosPage() {
  return (
    <>
      <h1>Dados e relatórios</h1>
      <p className="subtitle">
        Padrões de dados e relatórios · como apresentar, explorar e agir sobre
        conjuntos de dados.
      </p>

      <Card>
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
      </Card>
    </>
  );
}