import PatternPage from "@/components/ui/PatternPage";

export const metadata = { title: "Exportação" };

export default function ExportacaoPage() {
  return (
    <PatternPage
      title="Exportação"
      subtitle="Geração de arquivos (CSV, XLSX, PDF) a partir dos dados exibidos."
      sections={[
        {
          title: "Boas práticas",
          items: [
            "Exportar os dados conforme filtros e ordenação atuais.",
            "Informar o formato do arquivo e o que será exportado.",
            "Indicar o progresso para exportações demoradas.",
            "Nomear o arquivo de forma descritiva (ex.: relatorio-2026-08.csv).",
            "Confirmar a conclusão e oferecer o download.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não exportar mais dados do que o usuário vê sem avisar.",
            "Não iniciar download sem feedback.",
            "Não exportar dados sensíveis sem permissão adequada.",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Anunciar o início e a conclusão da exportação.",
            "Garantir que o botão de exportação tenha rótulo claro.",
            "Oferecer alternativa acessível ao arquivo (ex.: dados na tela).",
          ],
        },
      ]}
      note="Exportação deve refletir exatamente o que o usuário está vendo."
    />
  );
}