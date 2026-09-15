import Link from "next/link";

export const metadata = { title: "Padrões · Formulários" };

const itens = [
  { href: "/padroes/formularios/campos-obrigatorios", title: "Campos obrigatórios", desc: "Como indicar o que é necessário preencher." },
  { href: "/padroes/formularios/mascaras", title: "Máscaras", desc: "Formatação automática de entrada (CPF, telefone, datas)." },
  { href: "/padroes/formularios/textos-de-ajuda", title: "Textos de ajuda", desc: "Orientação sobre o que preencher em cada campo." },
  { href: "/padroes/formularios/validacao", title: "Validação", desc: "Verificação de dados no momento certo." },
  { href: "/padroes/formularios/mensagens-de-erro", title: "Mensagens de erro", desc: "Como comunicar o que deu errado e como corrigir." },
  { href: "/padroes/formularios/agrupamento-de-informacoes", title: "Agrupamento de informações", desc: "Organização lógica dos campos em seções." },
  { href: "/padroes/formularios/etapas-de-preenchimento", title: "Etapas de preenchimento", desc: "Divisão de formulários longos em passos." },
  { href: "/padroes/formularios/confirmacao-de-envio", title: "Confirmação de envio", desc: "Feedback após o envio bem-sucedido." },
  { href: "/padroes/formularios/prevencao-de-perda-de-dados", title: "Prevenção de perda de dados", desc: "Proteção do que o usuário digitou." },
];

export default function FormulariosPage() {
  return (
    <>
      <h1>Formulários</h1>
      <p className="subtitle">
        Padrões de formulários · como coletar dados de forma clara, segura e
        sem fricção.
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
