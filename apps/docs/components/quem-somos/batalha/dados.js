// Dados das batalhas da Vila SEMEC.
//
// Inspirado em RPGs de monstrinhos, mas com termos próprios: o jogador
// escolhe uma LINGUAGEM inicial, enfrenta os GINÁSIOS (os prédios da vila) e
// ganha uma STACK em cada um. Com as três stacks vira Full Stack e enfrenta a
// Diretoria. Cada golpe tem uma linha que ensina o conceito — quem joga não
// precisa saber programar.

// ---- Tipos --------------------------------------------------------------------
// Ciclo de vantagens: Front-End > Back-End > Dados > Front-End.
// "basico" é neutro: não tem vantagem nem desvantagem.
export const TIPOS = {
  front: { nome: "Front-End", sigla: "FRONT" },
  back: { nome: "Back-End", sigla: "BACK" },
  dados: { nome: "Dados", sigla: "DADOS" },
  basico: { nome: "Básico", sigla: "BÁSICO" },
};

export const VANTAGEM = {
  front: "back",
  back: "dados",
  dados: "front",
};

// Por que um tipo vence o outro — mostrado na tela de tipos e na batalha.
export const MOTIVO_VANTAGEM = {
  front: "Front-End vence Back-End: quem vê a tela primeiro é o usuário — e o servidor só fica sabendo depois.",
  back: "Back-End vence Dados: é o servidor que decide o que entra e o que sai do banco.",
  dados: "Dados vence Front-End: sem dados, a tela mais bonita do mundo fica vazia.",
};

// Multiplicador de dano do tipo do golpe contra o tipo do alvo. Mais suave
// que 2× / 0,5×: com uma linguagem só, desvantagem dobrada virava parede
// (simulação: 0–8% de vitória). Assim o tipo pesa, mas não decide sozinho.
export const MULT_VANTAGEM = 1.5;
export const MULT_DESVANTAGEM = 0.75;

export function multiplicadorTipo(tipoGolpe, tipoAlvo) {
  if (tipoGolpe === "basico" || tipoAlvo === "basico") return 1;
  if (VANTAGEM[tipoGolpe] === tipoAlvo) return MULT_VANTAGEM;
  if (VANTAGEM[tipoAlvo] === tipoGolpe) return MULT_DESVANTAGEM;
  return 1;
}

// ---- Golpes -------------------------------------------------------------------
// poder: dano base (0 = golpe de efeito). precisao: 0–100.
// efeito: { alvo: "eu" | "oponente", stat: "atk" | "def", estagios: ±n }
// prioridade: golpes com prioridade maior agem primeiro no turno.
export const GOLPES = {
  // Básicos (todo mundo entende)
  consoleLog: {
    nome: "console.log",
    tipo: "basico",
    poder: 40,
    precisao: 100,
    descricao: "Mostra no console o que está acontecendo. É o primeiro golpe de todo dev.",
  },
  print: {
    nome: "print()",
    tipo: "basico",
    poder: 40,
    precisao: 100,
    descricao: "Escreve uma mensagem na tela. Em Python, o “Olá, mundo” começa aqui.",
  },
  println: {
    nome: "System.out.println",
    tipo: "basico",
    poder: 40,
    precisao: 100,
    descricao: "O jeito Java de dizer “olá”: comprido, mas nunca falha.",
  },
  arrowFunction: {
    nome: "Arrow Function",
    tipo: "basico",
    poder: 45,
    precisao: 100,
    prioridade: 1,
    descricao: "Uma função curtinha: () => ataque. Tão rápida que age primeiro.",
  },

  // JavaScript / TypeScript (Front-End)
  dom: {
    nome: "Manipular o DOM",
    tipo: "front",
    poder: 60,
    precisao: 100,
    descricao: "Muda a página na hora, sem recarregar. O DOM é a “árvore” de elementos da tela.",
  },
  promise: {
    nome: "Promise",
    tipo: "front",
    poder: 80,
    precisao: 80,
    descricao: "Promete o resultado para depois… e às vezes não cumpre (pode errar).",
  },
  tipagem: {
    nome: "Tipagem Estática",
    tipo: "basico",
    poder: 0,
    precisao: 100,
    efeito: { alvo: "eu", stat: "def", estagios: 1 },
    descricao: "Avisa os erros antes de rodar. Aumenta a sua defesa.",
  },
  generics: {
    nome: "Generics",
    tipo: "front",
    poder: 90,
    precisao: 90,
    descricao: "Um código que serve para qualquer tipo: <T>. Golpe forte e versátil.",
  },

  fetch: {
    nome: "fetch()",
    tipo: "back",
    poder: 75,
    precisao: 100,
    descricao: "Pede dados ao servidor. Golpe de Back-End que o JavaScript aprendeu (bom contra Dados).",
  },

  // Python / Anaconda (Dados)
  listComprehension: {
    nome: "List Comprehension",
    tipo: "dados",
    poder: 60,
    precisao: 100,
    descricao: "Monta uma lista inteira em uma linha só. Elegante e certeiro.",
  },
  dataFrame: {
    nome: "DataFrame",
    tipo: "dados",
    poder: 80,
    precisao: 80,
    descricao: "Uma tabela poderosa (do Pandas) que analisa milhares de linhas de uma vez.",
  },
  indentacao: {
    nome: "Indentação",
    tipo: "basico",
    poder: 0,
    precisao: 100,
    efeito: { alvo: "eu", stat: "def", estagios: 1 },
    descricao: "Em Python, os espaços no começo da linha organizam o código. Aumenta a sua defesa.",
  },
  machineLearning: {
    nome: "Machine Learning",
    tipo: "dados",
    poder: 90,
    precisao: 90,
    descricao: "O programa aprende com os dados em vez de seguir só regras escritas à mão.",
  },

  streamlit: {
    nome: "Streamlit",
    tipo: "front",
    poder: 75,
    precisao: 100,
    descricao: "Cria uma tela web com poucas linhas de Python. Golpe de Front-End (bom contra Back-End).",
  },

  // Java / Kotlin (Back-End)
  orientacaoObjetos: {
    nome: "Orientação a Objetos",
    tipo: "back",
    poder: 60,
    precisao: 100,
    descricao: "Organiza o código em “objetos” com dados e ações. Sólido como uma classe.",
  },
  garbageCollector: {
    nome: "Garbage Collector",
    tipo: "back",
    poder: 80,
    precisao: 80,
    descricao: "Limpa a memória que ninguém usa mais… e às vezes limpa o adversário junto.",
  },
  tryCatch: {
    nome: "Try/Catch",
    tipo: "basico",
    poder: 0,
    precisao: 100,
    efeito: { alvo: "eu", stat: "def", estagios: 1 },
    descricao: "Tenta; se der erro, captura e segue em frente. Aumenta a sua defesa.",
  },
  coroutines: {
    nome: "Coroutines",
    tipo: "back",
    poder: 90,
    precisao: 90,
    descricao: "Faz várias tarefas ao mesmo tempo sem travar. Golpe forte do Kotlin.",
  },

  jdbc: {
    nome: "JDBC",
    tipo: "dados",
    poder: 75,
    precisao: 100,
    descricao: "Conecta o Java ao banco de dados. Golpe de Dados (bom contra Front-End).",
  },

  // Adversários — Ginásio Front-End
  flexbox: {
    nome: "Flexbox",
    tipo: "front",
    poder: 55,
    precisao: 100,
    descricao: "Alinha tudo na linha certinha. Centralizar uma div nunca foi tão fácil.",
  },
  importante: {
    nome: "!important",
    tipo: "front",
    poder: 0,
    precisao: 100,
    efeito: { alvo: "eu", stat: "atk", estagios: 1 },
    descricao: "Força o estilo a vencer qualquer outro. Aumenta o ataque (e a bagunça).",
  },
  useState: {
    nome: "useState",
    tipo: "front",
    poder: 60,
    precisao: 100,
    descricao: "Guarda um valor que, quando muda, atualiza a tela sozinho.",
  },
  rerender: {
    nome: "Re-render",
    tipo: "front",
    poder: 75,
    precisao: 85,
    descricao: "Desenha a tela de novo. E de novo. E de novo…",
  },

  // Adversários — Ginásio Back-End
  echo: {
    nome: "echo",
    tipo: "basico",
    poder: 40,
    precisao: 100,
    descricao: "O PHP responde direto para a página. Simples e eficiente.",
  },
  sessao: {
    nome: "$_SESSION",
    tipo: "back",
    poder: 55,
    precisao: 100,
    descricao: "Lembra quem você é entre uma página e outra.",
  },
  eventLoop: {
    nome: "Event Loop",
    tipo: "back",
    poder: 65,
    precisao: 100,
    descricao: "Atende um pedido de cada vez, mas tão rápido que parece tudo junto.",
  },
  npmInstall: {
    nome: "npm install",
    tipo: "basico",
    poder: 0,
    precisao: 100,
    efeito: { alvo: "eu", stat: "atk", estagios: 1 },
    descricao: "Baixa 1.500 pacotes para resolver um problema. Aumenta o ataque.",
  },

  // Adversários — Ginásio de Dados
  select: {
    nome: "SELECT *",
    tipo: "dados",
    poder: 60,
    precisao: 100,
    descricao: "Busca todas as colunas da tabela. Prático… mas pesado.",
  },
  join: {
    nome: "JOIN",
    tipo: "dados",
    poder: 75,
    precisao: 90,
    descricao: "Junta duas tabelas pelo que elas têm em comum.",
  },
  indice: {
    nome: "Índice",
    tipo: "basico",
    poder: 0,
    precisao: 100,
    efeito: { alvo: "eu", stat: "def", estagios: 1 },
    descricao: "Como o índice de um livro: acha tudo mais rápido. Aumenta a defesa.",
  },
  documento: {
    nome: "Documento JSON",
    tipo: "dados",
    poder: 65,
    precisao: 100,
    descricao: "Guarda os dados como documentos flexíveis, sem tabela fixa.",
  },

  // Laboratório de Machine Learning (ginásio bônus)
  dropna: {
    nome: "dropna()",
    tipo: "dados",
    poder: 60,
    precisao: 100,
    descricao: "Joga fora as linhas vazias da tabela. Dado sujo vira modelo ruim.",
  },
  groupby: {
    nome: "groupby()",
    tipo: "dados",
    poder: 0,
    precisao: 100,
    efeito: { alvo: "eu", stat: "atk", estagios: 1 },
    descricao: "Agrupa os dados por categoria e resume tudo de uma vez. Aumenta o ataque.",
  },
  arvoreDecisao: {
    nome: "Árvore de Decisão",
    tipo: "dados",
    poder: 75,
    precisao: 95,
    descricao: "Faz uma pergunta por galho até chegar na resposta. Fácil de explicar para qualquer um.",
  },
  validacaoCruzada: {
    nome: "Validação Cruzada",
    tipo: "basico",
    poder: 0,
    precisao: 100,
    efeito: { alvo: "eu", stat: "def", estagios: 1 },
    descricao: "Testa o modelo em pedaços diferentes dos dados para não se enganar. Aumenta a defesa.",
  },
  gradiente: {
    nome: "Descida do Gradiente",
    tipo: "back",
    poder: 85,
    precisao: 90,
    descricao: "Ajusta os pesos da rede passo a passo, sempre na direção que diminui o erro.",
  },
  treinoGpu: {
    nome: "Treino na GPU",
    tipo: "back",
    poder: 60,
    precisao: 100,
    prioridade: 1,
    descricao: "A placa de vídeo faz milhares de contas ao mesmo tempo. Tão rápido que age primeiro.",
  },
  overfitting: {
    nome: "Overfitting",
    tipo: "basico",
    poder: 0,
    precisao: 100,
    efeito: { alvo: "oponente", stat: "atk", estagios: -1 },
    descricao: "Decorou as respostas do treino e erra no mundo real. Diminui o ataque do oponente.",
  },

  // Diretoria (final)
  prototipo: {
    nome: "Protótipo",
    tipo: "front",
    poder: 75,
    precisao: 95,
    descricao: "Mostra como vai ficar antes de alguém escrever uma linha de código.",
  },
  procv: {
    nome: "PROCV",
    tipo: "dados",
    poder: 80,
    precisao: 90,
    descricao: "A fórmula mais famosa da planilha: procura um valor e traz o resto da linha.",
  },
  legado: {
    nome: "Código Legado",
    tipo: "back",
    poder: 85,
    precisao: 85,
    descricao: "Roda há 40 anos e ninguém tem coragem de mexer.",
  },
  reuniao: {
    nome: "Reunião de Alinhamento",
    tipo: "basico",
    poder: 0,
    precisao: 100,
    efeito: { alvo: "oponente", stat: "atk", estagios: -1 },
    descricao: "Uma reunião que podia ser um e-mail. Diminui o ataque do oponente.",
  },
};

// ---- Linguagens (as "criaturas") ----------------------------------------------
// base: atributos no nível 1. golpes: aprendidos até o nível indicado.
// evolui: { para, nivel } — vira outra linguagem ao atingir o nível.
// sigla: monograma do "retrato" (sem logos de marca).
export const LINGUAGENS = {
  javascript: {
    nome: "JavaScript",
    sigla: "JS",
    tipo: "front",
    base: { hp: 44, atk: 52, def: 43, spd: 65 },
    golpes: [["consoleLog", 1], ["dom", 1], ["fetch", 1], ["promise", 1]],
    evolui: { para: "typescript", nivel: 8 },
    bio: "Roda em todo navegador e dá vida à tela. Rápido e cheio de truques.",
  },
  typescript: {
    nome: "TypeScript",
    sigla: "TS",
    tipo: "front",
    base: { hp: 58, atk: 64, def: 58, spd: 80 },
    golpes: [["arrowFunction", 1], ["fetch", 1], ["tipagem", 1], ["generics", 1]],
    bio: "JavaScript que aprendeu a avisar os erros antes de acontecerem.",
  },
  python: {
    nome: "Python",
    sigla: "Py",
    tipo: "dados",
    base: { hp: 48, atk: 49, def: 49, spd: 45 },
    golpes: [["print", 1], ["listComprehension", 1], ["streamlit", 1], ["dataFrame", 1]],
    evolui: { para: "anaconda", nivel: 8 },
    bio: "Fácil de ler, ótimo com dados. A linguagem favorita de quem está começando.",
  },
  anaconda: {
    nome: "Anaconda",
    sigla: "An",
    tipo: "dados",
    base: { hp: 62, atk: 62, def: 63, spd: 60 },
    golpes: [["streamlit", 1], ["indentacao", 1], ["dataFrame", 1], ["machineLearning", 1]],
    bio: "Python com tudo de ciência de dados já incluído. Uma cobra bem maior.",
  },
  java: {
    nome: "Java",
    sigla: "Jv",
    tipo: "back",
    base: { hp: 46, atk: 48, def: 54, spd: 43 },
    golpes: [["println", 1], ["orientacaoObjetos", 1], ["jdbc", 1], ["garbageCollector", 1]],
    evolui: { para: "kotlin", nivel: 8 },
    bio: "Robusto e confiável, roda os sistemas grandes. Escreve muito, quebra pouco.",
  },
  kotlin: {
    nome: "Kotlin",
    sigla: "Kt",
    tipo: "back",
    base: { hp: 60, atk: 63, def: 66, spd: 58 },
    golpes: [["jdbc", 1], ["tryCatch", 1], ["garbageCollector", 1], ["coroutines", 1]],
    bio: "O Java moderno: faz o mesmo com metade das linhas.",
  },

  // Adversários
  css: {
    nome: "CSS",
    sigla: "CSS",
    tipo: "front",
    base: { hp: 40, atk: 45, def: 40, spd: 50 },
    golpes: [["flexbox", 1], ["importante", 1]],
    bio: "Deixa tudo bonito. Às vezes deixa tudo no lugar errado.",
  },
  react: {
    nome: "React",
    sigla: "Re",
    tipo: "front",
    base: { hp: 50, atk: 52, def: 46, spd: 55 },
    golpes: [["useState", 1], ["rerender", 1], ["consoleLog", 1]],
    bio: "Monta a tela em pedacinhos reutilizáveis chamados componentes.",
  },
  php: {
    nome: "PHP",
    sigla: "PHP",
    tipo: "back",
    base: { hp: 52, atk: 52, def: 50, spd: 45 },
    golpes: [["echo", 1], ["sessao", 1]],
    bio: "Veterano da web. Roda boa parte dos sites do mundo até hoje.",
  },
  node: {
    nome: "Node.js",
    sigla: "No",
    tipo: "back",
    base: { hp: 56, atk: 58, def: 50, spd: 60 },
    golpes: [["eventLoop", 1], ["npmInstall", 1], ["consoleLog", 1]],
    bio: "JavaScript fora do navegador, rodando no servidor.",
  },
  sql: {
    nome: "SQL",
    sigla: "SQL",
    tipo: "dados",
    base: { hp: 60, atk: 56, def: 60, spd: 45 },
    golpes: [["select", 1], ["indice", 1], ["join", 1]],
    bio: "A língua dos bancos de dados há mais de 50 anos.",
  },
  mongodb: {
    nome: "MongoDB",
    sigla: "Mo",
    tipo: "dados",
    base: { hp: 62, atk: 60, def: 56, spd: 55 },
    golpes: [["documento", 1], ["select", 1], ["indice", 1]],
    bio: "Banco de dados de documentos: guarda tudo sem tabela fixa.",
  },
  pandas: {
    nome: "Pandas",
    sigla: "Pd",
    tipo: "dados",
    base: { hp: 62, atk: 58, def: 60, spd: 50 },
    golpes: [["dropna", 1], ["groupby", 1], ["dataFrame", 1]],
    bio: "Biblioteca de Python que transforma planilhas em tabelas que o código entende. Limpa tudo antes do treino.",
  },
  sklearn: {
    nome: "Scikit-learn",
    sigla: "Sk",
    tipo: "dados",
    base: { hp: 64, atk: 62, def: 60, spd: 56 },
    golpes: [["arvoreDecisao", 1], ["validacaoCruzada", 1], ["machineLearning", 1]],
    bio: "A caixa de ferramentas do Machine Learning clássico: árvores, regressões e agrupamentos.",
  },
  pytorch: {
    nome: "PyTorch",
    sigla: "PT",
    tipo: "back",
    base: { hp: 70, atk: 68, def: 62, spd: 58 },
    golpes: [["gradiente", 1], ["treinoGpu", 1], ["overfitting", 1]],
    bio: "Monta e treina redes neurais — a base de quase toda IA moderna.",
  },
  figma: {
    nome: "Figma",
    sigla: "Fg",
    tipo: "front",
    base: { hp: 66, atk: 64, def: 60, spd: 66 },
    golpes: [["prototipo", 1], ["reuniao", 1], ["flexbox", 1]],
    bio: "Onde as telas nascem antes de virar código.",
  },
  excel: {
    nome: "Planilha",
    sigla: "Xl",
    tipo: "dados",
    base: { hp: 70, atk: 64, def: 64, spd: 50 },
    golpes: [["procv", 1], ["reuniao", 1], ["select", 1]],
    bio: "O banco de dados mais usado do mundo (mesmo sem ser um).",
  },
  cobol: {
    nome: "COBOL",
    sigla: "CB",
    tipo: "back",
    base: { hp: 76, atk: 68, def: 70, spd: 40 },
    golpes: [["legado", 1], ["reuniao", 1], ["println", 1]],
    bio: "Criado em 1959 e ainda processa sistemas de governo. Respeite o ancião.",
  },
};

export const INICIAIS = ["python", "javascript", "java"];

// ---- Itens ----------------------------------------------------------------------
export const ITENS = {
  cafe: {
    nome: "Café",
    cura: 25,
    descricao: "Recupera 25 de vida. Todo bug fica menor depois de um café.",
  },
  stackOverflow: {
    nome: "Pergunta no Stack Overflow",
    cura: 999,
    descricao: "Alguém já teve exatamente o seu problema. Recupera toda a vida.",
  },
};

export const ITENS_POR_BATALHA = { cafe: 3, stackOverflow: 1 };

// ---- Chefes (ginásios e Diretoria) ----------------------------------------------
// area: casa com AREA_SPOTS da vila (frontend, backend, database, ml, diretoria).
// stack: insígnia ganha ao vencer. requer: chefe que precisa estar vencido.
// bonus: ginásio opcional, fora da trilha do Full Stack.
export const CHEFES = [
  {
    id: "frontend",
    area: "frontend",
    ginasio: "Ginásio Front-End",
    titulo: "Líder do Ginásio Front-End",
    stack: { id: "front", nome: "Front-End Stack" },
    time: [["css", 3], ["react", 4]],
    falaInicio: "Bem-vindo(a) ao Front-End! Aqui tudo o que a população vê na tela passa por nós. Mostre o que sabe!",
    falaDerrota: "Tela linda, código limpo… você mereceu a Front-End Stack!",
    dica: "Os golpes Front-End são fortes contra o Back-End e fracos contra Dados.",
  },
  {
    id: "backend",
    area: "backend",
    ginasio: "Ginásio Back-End",
    titulo: "Líder do Ginásio Back-End",
    requer: "frontend",
    stack: { id: "back", nome: "Back-End Stack" },
    time: [["php", 5], ["node", 6]],
    falaInicio: "Por trás de cada botão existe um servidor trabalhando. Vamos ver se você aguenta a carga!",
    falaDerrota: "Servidor no ar, resposta em 200 ms. A Back-End Stack é sua!",
    dica: "Back-End é forte contra Dados e fraco contra Front-End.",
  },
  {
    id: "database",
    area: "database",
    ginasio: "Ginásio de Dados",
    titulo: "Líder do Ginásio de Dados",
    requer: "backend",
    stack: { id: "dados", nome: "Data Stack" },
    time: [["sql", 8], ["mongodb", 9]],
    falaInicio: "Os dados da rede municipal são guardados aqui — com segurança e LGPD. Prepare a sua consulta!",
    falaDerrota: "Consulta otimizada! Leve a Data Stack. Agora você está pronto(a) para a Diretoria.",
    dica: "Dados é forte contra Front-End e fraco contra Back-End.",
  },
  {
    // Ginásio BÔNUS: opcional, não conta para o Full Stack (a Diretoria
    // continua exigindo só o de Dados). Dá a Stack de IA.
    id: "ml",
    area: "ml",
    bonus: true,
    ginasio: "Laboratório de Machine Learning",
    titulo: "Líder do Laboratório de Machine Learning",
    requer: "database",
    stack: { id: "ia", nome: "IA Stack" },
    time: [["pandas", 10], ["sklearn", 11], ["pytorch", 12]],
    falaInicio: "Aqui os dados viram previsões! Primeiro a gente limpa, depois treina, depois testa. Vamos ver se o seu modelo aprende rápido!",
    falaDerrota: "Acurácia lá em cima e sem overfitting! A IA Stack é sua.",
    dica: "Pandas e Scikit-learn são Dados (fracos contra Back-End); o PyTorch é Back-End (fraco contra Front-End).",
  },
  {
    id: "diretoria",
    area: "diretoria",
    ginasio: "Diretoria da SEMEC",
    titulo: "Diretoria",
    requer: "database",
    stack: { id: "full", nome: "Full Stack" },
    time: [["figma", 10], ["excel", 11], ["cobol", 12]],
    falaInicio: "Três stacks! Poucos chegam até aqui. A Diretoria aceita o seu desafio — com uma reunião de alinhamento.",
    falaDerrota: "Front, Back e Dados: agora você é FULL STACK! Bem-vindo(a) ao time da SEMEC.",
    dica: "A Diretoria usa os três tipos. Troque de golpe conforme o adversário.",
  },
];
