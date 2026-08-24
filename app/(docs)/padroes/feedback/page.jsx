import Link from "next/link";
import Card from "@/components/ui/Card";

export const metadata = { title: "Padrões · Feedback ao usuário" };

const itens = [
  { href: "/padroes/feedback/carregamento", title: "Carregamento", desc: "Indicação de que uma ação está em andamento." },
  { href: "/padroes/feedback/sucesso", title: "Sucesso", desc: "Confirmação de que uma ação foi concluída." },
  { href: "/padroes/feedback/erro", title: "Erro", desc: "Comunicação de falhas e como resolvê-las." },
  { href: "/padroes/feedback/aviso", title: "Aviso", desc: "Alertas sobre situações que exigem atenção." },
  { href: "/padroes/feedback/confirmacao", title: "Confirmação", desc: "Pedido de confirmação antes de ações importantes." },
  { href: "/padroes/feedback/progresso", title: "Progresso", desc: "Indicação do andamento de tarefas longas." },
  { href: "/padroes/feedback/processamento", title: "Processamento", desc: "Estado de operações em segundo plano." },
  { href: "/padroes/feedback/indisponibilidade", title: "Indisponibilidade", desc: "Comunicação de serviços fora do ar." },
  { href: "/padroes/feedback/sessao-expirada", title: "Sessão expirada", desc: "Tratamento de sessões que terminam." },
];

export default function FeedbackPage() {
  return (
    <>
      <h1>Feedback ao usuário</h1>
      <p className="subtitle">
        Padrões de feedback · como comunicar o estado do sistema ao usuário em
        cada momento.
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