import Link from "next/link";
import Card from "@/components/ui/Card";

export const metadata = { title: "Padrões · Acessibilidade" };

const itens = [
  { href: "/padroes/acessibilidade/contraste-de-cores", title: "Contraste de cores", desc: "Legibilidade do texto sobre o fundo." },
  { href: "/padroes/acessibilidade/navegacao-por-teclado", title: "Navegação por teclado", desc: "Operação completa sem mouse." },
  { href: "/padroes/acessibilidade/foco-visivel", title: "Foco visível", desc: "Indicação clara do elemento ativo." },
  { href: "/padroes/acessibilidade/leitores-de-tela", title: "Leitores de tela", desc: "Compatibilidade com tecnologias assistivas." },
  { href: "/padroes/acessibilidade/textos-alternativos", title: "Textos alternativos", desc: "Descrição de imagens e ícones." },
  { href: "/padroes/acessibilidade/estrutura-semantica", title: "Estrutura semântica", desc: "HTML com significado correto." },
  { href: "/padroes/acessibilidade/tamanho-das-areas-clicaveis", title: "Tamanho das áreas clicáveis", desc: "Alvos de toque e clique adequados." },
  { href: "/padroes/acessibilidade/mensagens-de-erro-acessiveis", title: "Mensagens de erro acessíveis", desc: "Erros perceptíveis e compreensíveis." },
  { href: "/padroes/acessibilidade/nao-uso-exclusivo-de-cores", title: "Não uso exclusivo de cores", desc: "Informação transmitida por mais de um canal." },
  { href: "/padroes/acessibilidade/conformidade-wcag-nbr", title: "Conformidade WCAG e ABNT NBR 17225", desc: "Normas que regem a acessibilidade." },
];

export default function AcessibilidadePage() {
  return (
    <>
      <h1>Acessibilidade</h1>
      <p className="subtitle">
        Padrões de acessibilidade · requisitos para que as interfaces SEMEC
        sejam utilizáveis por todas as pessoas.
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