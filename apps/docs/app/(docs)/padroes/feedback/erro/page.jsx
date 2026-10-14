import PatternPage from "@/components/ui/PatternPage";
import PatternDemo from "@/components/docs/PatternDemo";
import { ErroDemo } from "@/components/demos/patterns/feedback/erro";

export const metadata = { title: "Erro" };

export default function ErroPage() {
  return (
    <PatternPage
      title="Erro"
      subtitle="Comunicação de falhas do sistema ou de ações do usuário."
      sections={[
        {
          title: "Guia de decisão — Qual estado de tela usar?",
          items: [
            "Carregando (Skeleton / Spinner): Use Skeleton ao carregar blocos ou páginas inteiras onde o formato do layout futuro já é conhecido; use Spinner para ações pontuais acionadas pelo usuário (botões salvando, envios). Não use Spinner ocupando a tela inteira se a estrutura da página puder ser antecipada com Skeleton.",
            "Vazio (EmptyState): Use quando a requisição foi bem-sucedida (status 200), mas não há registros a exibir (busca sem resultados, tabela nova sem dados, filtros sem correspondência). Deve orientar a ação positiva (limpar filtros, criar primeiro item). Nunca use estado de erro para listas legitimamente vazias.",
            "Erro de Carregamento (ErrorState): Use quando a requisição falhar (erro 500, timeout 504, rede offline) e houver possibilidade de recuperação pelo usuário via onRetry. Apresente mensagem clara em linguagem humana e botão de ação.",
            "Erro de Formulário (FormField + ErrorSummary): Use para validação de dados de entrada do usuário antes ou após submissão. Indique o campo exato e agregue no ErrorSummary se houver múltiplos erros.",
            "Aviso Contextual (Alert): Use para comunicar problemas não impeditivos ou avisos de sistema que não impedem a continuidade do fluxo.",
            "Sem permissão (403): Apresente mensagem clara informando que o perfil não possui acesso ao recurso, oferecendo botão para voltar ou solicitar acesso ao gestor.",
          ],
        },
        {
          title: "Boas práticas",
          items: [
            "Explicar o que aconteceu em linguagem simples, sem termos técnicos indecifráveis para o cidadão.",
            "Indicar como resolver ou o que tentar em seguida.",
            "Oferecer sempre ação de recuperação quando possível (tentar novamente, voltar ao início, contatar suporte).",
            "Evitar culpar o usuário pela falha.",
          ],
        },
        {
          title: "Anti-padrões",
          items: [
            "Não usar mensagens técnicas ou códigos HTTP puros sem explicação humana (ex.: apenas 'Erro 500').",
            "Não mostrar erros genéricos sem contexto ou ação de retorno.",
            "Não deixar o usuário sem caminho de recuperação ou travado em tela em branco.",
            "Não usar estilo de erro vermelho para situações comuns de busca sem resultados (use EmptyState).",
          ],
        },
        {
          title: "Acessibilidade",
          items: [
            "Anunciar o erro para leitores de tela com role=\"alert\" e aria-live=\"assertive\".",
            "Garantir contraste mínimo WCAG AA (4.5:1 para texto normal) e não usar exclusivamente a cor vermelha para transmitir o significado do erro.",
            "Manter o foco em local útil após o erro (ou direcionar para a mensagem de recuperação).",
          ],
        },
      ]}
      note="Erro bom diz o que aconteceu, por quê e como seguir; erro ruim apenas bloqueia."
    >
      <PatternDemo id="feedback/erro">
        <ErroDemo />
      </PatternDemo>
    </PatternPage>
  );
}