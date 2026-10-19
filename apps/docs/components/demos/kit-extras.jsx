/**
 * Prosas de decisão e a11y preservadas das páginas custom migradas
 * para o fluxo ComponentDoc (épico SEM-793).
 */

function Prose({ quandoUsar, quandoNaoUsar, a11y, children }) {
  return (
    <>
      <h3>Quando usar</h3>
      <p>{quandoUsar}</p>
      <h3>Quando não usar</h3>
      <p>{quandoNaoUsar}</p>
      <h3>Acessibilidade</h3>
      <ul>
        {a11y.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {children}
    </>
  );
}

export function ComboboxExtras() {
  return (
    <Prose
      quandoUsar="Quando o usuário precisa escolher entre muitas opções e a busca por texto acelera a seleção. Útil para listas de documentos, categorias, países ou qualquer conjunto superior a uma dúzia de itens."
      quandoNaoUsar="Para poucas opções (até 5), um Select simples é mais rápido. Para valores que não existem na lista, use um campo de texto livre com Input."
      a11y={[
        "Usa role=\"combobox\" e aria-expanded para indicar o estado aberto/fechado ao leitor de tela.",
        "A lista filtrada pode ser navegada com setas acima/abaixo, e Enter confirma a seleção.",
        "Esc fecha a lista e Tab move o foco para o próximo elemento.",
        "O valor selecionado é anunciado como live region para confirmar a escolha.",
      ]}
    >
      <p className="text-sm text-muted-foreground">
        <code>options</code> é um array de objetos <code>value</code> +{" "}
        <code>label</code>. <code>value</code> é o valor controlado;{" "}
        <code>onChange</code> recebe o novo valor.
      </p>
    </Prose>
  );
}

export function FileUploadExtras() {
  return (
    <Prose
      quandoUsar="Sempre que o usuário precisar enviar um ou mais arquivos: currículo, comprovante de residência, imagem de perfil, documento escaneado. O componente valida tipo e tamanho antes do envio, evitando idas e voltas ao servidor."
      quandoNaoUsar="Para upload de imagem apenas para visualização (crop, avatar), use um componente dedicado de upload de imagem. Para upload de vários arquivos com progresso individual e fila, considere um componente mais especializado."
      a11y={[
        "O input nativo está acessível via sr-only e pode ser acionado por Enter ou Espaço quando o invólucro recebe foco.",
        "A mensagem de erro usa role=\"alert\" para ser anunciada imediatamente pelo leitor de tela.",
        "O estado de arraste é sinalizado visualmente, mas a ação de clique sempre está disponível como alternativa.",
        "Cada arquivo na lista exibe nome e tamanho em texto, sem depender de ícones.",
      ]}
    >
      <h3>Props</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Tipo</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>accept</code></td>
              <td><code>string</code></td>
              <td>Tipos aceitos (ex.: <code>.pdf,image/*</code>).</td>
            </tr>
            <tr>
              <td><code>maxSize</code></td>
              <td><code>number</code></td>
              <td>Limite em bytes. Excede → erro.</td>
            </tr>
            <tr>
              <td><code>label</code></td>
              <td><code>string</code></td>
              <td>Rótulo acima da área de arraste.</td>
            </tr>
            <tr>
              <td><code>hint</code></td>
              <td><code>string</code></td>
              <td>Texto auxiliar abaixo da área.</td>
            </tr>
            <tr>
              <td><code>error</code></td>
              <td><code>string</code></td>
              <td>Mensagem de erro controlada externamente.</td>
            </tr>
            <tr>
              <td><code>onChange</code></td>
              <td><code>(files: File[]) =&gt; void</code></td>
              <td>Callback quando os arquivos mudam.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Prose>
  );
}

export function SheetExtras() {
  return (
    <Prose
      quandoUsar="Para painéis de filtros, configurações secundárias ou pré-visualização de conteúdo que não precisa de uma página dedicada. Bom para painéis laterais no desktop."
      quandoNaoUsar="Para confirmações perigosas, use AlertDialog. Para bottom sheets no mobile, use Drawer. Para fluxos primários, use uma página dedicada."
      a11y={[
        "Baseado em Radix Dialog: role=\"dialog\" e aria-modal.",
        "Armadilha de foco e fechamento por Esc/overlay.",
        "aria-labelledby e aria-describedby via SheetTitle/SheetDescription.",
        "Botão de fechar com label sr-only.",
      ]}
    />
  );
}

export function DataTableExtras() {
  return (
    <Prose
      quandoUsar="Para exibir listas de dados tabulares com ordenação e paginação. Ideal para listas de registros, relatórios e resultados de busca."
      quandoNaoUsar="Para dados simples sem necessidade de ordenação, use Table. Para listas com muitas colunas ou filtros avançados, considere um componente dedicado."
      a11y={[
        "Tabela semântica com role=\"table\" e headers com scope=\"col\".",
        "Paginação com role=\"navigation\" e aria-label=\"Paginação\".",
        "Colunas ordenáveis indicam direção com aria-sort.",
      ]}
    />
  );
}

export function DrawerExtras() {
  return (
    <Prose
      quandoUsar="Para exibir detalhes, configurações ou formulários complementares sem tirar o usuário da página atual. Ideal quando o conteúdo não precisa de uma página inteira, mas também não cabe em um Tooltip ou Popover."
      quandoNaoUsar="Para mensagens de confirmação simples, use AlertDialog. Para conteúdo que deve ocupar toda a tela (formulário principal), use uma rota dedicada. Para informações extremamente breves, use Tooltip."
      a11y={[
        "Construído sobre @radix-ui/react-dialog, que gerencia role=\"dialog\" e aria-modal automaticamente.",
        "Foco é capturado dentro do painel (focus trap) e retorna ao trigger ao fechar.",
        "Pode ser fechado com Esc ou clicando no overlay.",
        "Título e descrição vinculados via aria-labelledby e aria-describedby.",
      ]}
    >
      <p className="text-sm text-muted-foreground">
        <code>DrawerContent</code> aceita <code>side</code> com padrão{" "}
        <code>&quot;bottom&quot;</code> (também: top, left, right).
      </p>
    </Prose>
  );
}

export function AlertDialogExtras() {
  return (
    <Prose
      quandoUsar="Sempre que uma ação for irreversível ou tiver impacto significativo — exclusão de registro, cancelamento de processo, envio definitivo. O diálogo impede que a ação aconteça por acidente."
      quandoNaoUsar="Para ações reversíveis ou de baixo impacto (confirmar uma edição simples), use feedback inline ou um Dialog comum. Para erros que já aconteceram, use Alert."
      a11y={[
        "O Radix AlertDialog define role=\"alertdialog\" automaticamente.",
        "O foco é capturado dentro do diálogo e não pode sair até fechar (focus trap).",
        "Esc fecha o diálogo e retorna o foco ao elemento que o abriu.",
        "O overlay clicável também fecha o diálogo.",
        "AlertDialogTitle e AlertDialogDescription vinculados via aria-labelledby e aria-describedby.",
      ]}
    >
      <p className="text-sm text-muted-foreground">
        <code>AlertDialogAction</code> confirma; <code>AlertDialogCancel</code>{" "}
        fecha sem executar. Ambos acionam o fechamento do Radix.
      </p>
    </Prose>
  );
}

export function SidebarTriggerExtras() {
  return (
    <Prose
      quandoUsar="Em layouts com sidebar colapsável, onde a pessoa precisa controlar a visibilidade do menu lateral. Também em cabeçalhos ou barras de ferramentas que alternam a sidebar em dispositivos móveis."
      quandoNaoUsar="Quando a sidebar não pode ser colapsada (fixa sempre visível). Para navegação entre seções sem sidebar, use NavigationMenu ou Tabs."
      a11y={[
        "aria-expanded reflete o estado — leitores anunciam \"menu expandido\"/\"menu recolhido\".",
        "Rótulo acessível muda entre \"Fechar menu\"/\"Abrir menu\" (labelOpen/labelClosed).",
        "Ícone decorativo (aria-hidden); a informação está no rótulo e no aria-expanded.",
        "Recebe foco visível por padrão (herda do IconButton).",
      ]}
    >
      <p className="text-sm text-muted-foreground">
        <code>open</code> controla o ícone; <code>onToggle</code> é chamado ao
        clicar.
      </p>
    </Prose>
  );
}

export function DropdownMenuExtras() {
  return (
    <Prose
      quandoUsar="Para ações secundárias ou contextuais de um elemento, como editar, duplicar ou excluir um item. Quando o número de opções não justifica uma barra de ferramentas visível, o menu suspenso mantém a interface limpa."
      quandoNaoUsar="Para navegação principal entre páginas, use NavigationMenu ou Tabs. Para ações destrutivas que exigem confirmação, combine com AlertDialog. Para seleção de um valor de formulário, use Select ou Combobox."
      a11y={[
        "Trigger funciona com Enter, Espaço e setas — foco vai para o primeiro item.",
        "Setas cima/baixo navegam; seta direita em item com sub-menu o abre; Esc fecha e retorna o foco ao trigger.",
        "Itens desabilitados ficam focáveis mas não acionáveis.",
        "Menu fecha ao clicar fora ou Esc.",
        "Radix UI gerencia aria-expanded, role=\"menu\" e role=\"menuitem\" automaticamente.",
      ]}
    />
  );
}

export function FormFieldExtras() {
  return (
    <Prose
      quandoUsar="Para estruturar todo campo interativo de formulário (Input, Textarea, Select, Combobox, DatePicker, Checkbox, RadioGroup, Switch, FileUpload, InputOTP, Slider). Ele garante que rótulo, indicador obrigatório (*), texto de apoio e mensagem de erro estejam na ordem semântica correta e ligados via acessibilidade sem esforço manual."
      quandoNaoUsar="Para botões de ação isolados ou links de navegação avulsos fora do contexto de campo rotulável. Não use FormField para exibir alertas globais de página — para isso utilize Alert, ErrorSummary ou ErrorState."
      a11y={[
        "Associação semântica completa: id, label (htmlFor / aria-labelledby), hint e error (aria-describedby) e aria-invalid chegam automaticamente ao controle filho.",
        "Três padrões de erro: 1. Erro inline no campo (via prop error, anunciado ao focar o campo); 2. Resumo consolidado no topo via ErrorSummary (com foco automático e links âncora para os campos); 3. Erro de submissão do servidor (Alert destructive no topo ou campos específicos).",
        "role=\"alert\": por padrão a mensagem inline não usa role=\"alert\" para não poluir ou interromper leitores de tela quando há múltiplos campos inválidos (o resumo assume o anúncio imediato, AUD-22). Em campos avulsos, pode ser ativado com errorRole=\"alert\".",
        "Contraste da mensagem de erro: utiliza var(--feedback-danger) / --pv-red-700 (#b91c1c), garantindo 5,98:1 sobre fundo branco (superando o critério WCAG AA de 4.5:1).",
        "Legenda auxiliar de ação / download: botões de envio que geram efeitos secundários (ex.: download de PDF ou envio assíncrono) devem conter legenda explicativa complementar abaixo do botão (ex.: text-xs text-muted-foreground) associada ao botão ou visualmente orientada.",
      ]}
    >
      <h3>Padrão Canônico com React Hook Form e Zod</h3>
      <p className="text-sm text-muted-foreground">
        O <code>FormField</code> integra-se de forma transparente com <code>react-hook-form</code> tanto via <code>register</code> quanto via <code>Controller</code>, recebendo a mensagem de erro direto de <code>errors[field]?.message</code>:
      </p>
    </Prose>
  );
}

export function ErrorSummaryExtras() {
  return (
    <Prose
      quandoUsar="Sempre que um formulário puder falhar em mais de um campo. Em formulário longo, é o que permite descobrir o que deu errado sem percorrer a página inteira."
      quandoNaoUsar="Em formulário de campo único, a mensagem junto ao campo basta — o resumo só acrescenta um passo. Para erro que não é de validação (falha de rede), use Alert."
      a11y={[
        "role=\"alert\" anuncia o bloco assim que ele aparece.",
        "O resumo recebe o foco — não o primeiro campo. Quem chega ouve quantos erros existem antes de decidir para onde ir.",
        "Cada item é link para o campo que o causou; o foco vai para o controle mesmo quando o id está no invólucro.",
        "Erro nunca é sinalizado só por cor: há texto, borda mais espessa e sublinhado no link.",
        "Resumo vazio não é renderizado (role=\"alert\" sem conteúdo anuncia o nada).",
        "Atende aos critérios 3.3.1 e 3.3.3 da WCAG (ver padrão de mensagens de erro acessíveis).",
      ]}
    >
      <p className="text-sm text-muted-foreground">
        <code>id</code> é o do campo. <code>focusKey</code> muda a cada envio
        inválido e é o único gatilho de foco: o resumo refoca quando a pessoa
        tenta de novo, mas não quando some e volta enquanto ela digita.
      </p>
    </Prose>
  );
}

export function ErrorStateExtras() {
  return (
    <Prose
      quandoUsar="Quando uma seção ou página inteira falhar ao carregar dados remotos (erro 500, timeout 504, erro de rede ou falha de sincronização) e existir uma possibilidade de recuperação pelo próprio usuário (ex.: tentar novamente)."
      quandoNaoUsar="Para validação de campos de formulário (use FormField e ErrorSummary). Para avisos flutuantes temporários (use Toast). Para estados normais em que a busca simplesmente não retornou registros (use EmptyState)."
      a11y={[
        "Usa role=\"alert\" e aria-live=\"assertive\" para anunciar imediatamente a falha aos leitores de tela.",
        "O ícone decorativo possui aria-hidden=\"true\" para não poluir a leitura.",
        "Não depende apenas de cor: conta com título explícito, ícone de alerta e mensagem textual clara com instrução de como proceder.",
        "Ação de recuperação (onRetry ou action) é sempre um botão ou elemento focável e acionável por teclado (Enter/Espaço).",
      ]}
    >
      <h3>Props</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Tipo</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>title</code></td>
              <td><code>string</code></td>
              <td>Título principal descrevendo a falha de forma clara e direta.</td>
            </tr>
            <tr>
              <td><code>description</code></td>
              <td><code>string</code></td>
              <td>Explicação complementar da causa e orientação de ação para o usuário.</td>
            </tr>
            <tr>
              <td><code>onRetry</code></td>
              <td><code>() =&gt; void</code></td>
              <td>Callback disparado ao clicar no botão de tentar novamente.</td>
            </tr>
            <tr>
              <td><code>retryLabel</code></td>
              <td><code>string</code></td>
              <td>Texto do botão de tentar novamente (padrão: &quot;Tentar novamente&quot;).</td>
            </tr>
            <tr>
              <td><code>variant</code></td>
              <td><code>&quot;default&quot; | &quot;inline&quot;</code></td>
              <td><code>default</code> para páginas ou blocos principais; <code>inline</code> para cards e tabelas.</td>
            </tr>
            <tr>
              <td><code>icon</code></td>
              <td><code>ReactNode</code></td>
              <td>Ícone customizado opcional. Por padrão exibe AlertCircle.</td>
            </tr>
            <tr>
              <td><code>action</code></td>
              <td><code>ReactNode</code></td>
              <td>Elemento ou botão de ação customizado em substituição ao botão padrão de retry.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Prose>
  );
}

