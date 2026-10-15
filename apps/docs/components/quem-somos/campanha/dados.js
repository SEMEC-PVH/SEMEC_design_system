// Mini game "Campanha da SEMEC" (quest da Emily): em cada rodada a Emily traz
// um briefing e o jogador monta o post da campanha em 5 escolhas. Cada opção
// vale 0, 1 ou 2 pontos e traz o porquê (mostrado no resultado).
//
// RODADAS[i] = { id, titulo, briefing, imagem, alcanceBase, passos }
//   passos[j] = { id, pergunta, opcoes: [{ texto, pontos, porque, ...extras }] }
//   extras por passo:
//     "titulo"  → `texto` é o título do post
//     "arte"    → `layout`: "destaque" | "apagado" | "texto" (como o post é
//                 desenhado no resultado)
//     "alt"     → `texto` é a descrição da imagem
//
// Pontuação: até 10 por rodada; estrelas() converte em 1–3. Vence a quest
// quem somar pelo menos ESTRELAS_PARA_VENCER nas 3 rodadas.

export const PASSOS = ["publico", "canal", "titulo", "arte", "alt"];
export const MAX_PONTOS = 10;
export const ESTRELAS_PARA_VENCER = 6;

export const estrelas = (pontos) => (pontos >= 9 ? 3 : pontos >= 6 ? 2 : 1);

// Engajamento do post no resultado (curtidas, comentários, compartilhamentos),
// determinístico pela pontuação.
export function engajamento(rodada, pontos) {
  const k = 0.15 + (pontos / MAX_PONTOS) ** 2 * 0.85;
  const curtidas = Math.round(rodada.alcanceBase * k);
  return { curtidas, comentarios: Math.round(curtidas * 0.07), compartilhamentos: Math.round(curtidas * 0.04) };
}

const ARTE = (titulo) => ({
  id: "arte",
  pergunta: "Como fica a arte do post?",
  opcoes: [
    {
      texto: "Foto com o título grande, em letra escura sobre faixa clara",
      layout: "destaque",
      pontos: 2,
      porque: "Contraste alto e título grande: dá para ler até na tela pequena do celular, no sol.",
    },
    {
      texto: "Foto com o título pequeno, em cinza-claro por cima da imagem",
      layout: "apagado",
      pontos: 0,
      porque: "Texto claro em cima da foto some: o contraste fica bem abaixo de 4,5:1 e ninguém lê.",
    },
    {
      texto: `Só texto: um parágrafo explicando "${titulo}"`,
      layout: "texto",
      pontos: 1,
      porque: "Dá para ler, mas sem imagem o post passa batido no meio do feed.",
    },
  ],
});

export const RODADAS = [
  {
    id: "matricula",
    titulo: "Matrículas abertas",
    briefing:
      "As matrículas da rede municipal abriram e vão até sexta. A gente quer que as famílias façam pelo app, sem fila na escola.",
    imagem: "matricula",
    alcanceBase: 2400,
    passos: [
      {
        id: "publico",
        pergunta: "Para quem é essa campanha?",
        opcoes: [
          { texto: "Professores da rede", pontos: 0, porque: "Quem matricula são as famílias, não os professores." },
          { texto: "Pais, mães e responsáveis", pontos: 2, porque: "Isso! São eles que fazem a matrícula das crianças." },
          { texto: "Todo mundo da cidade", pontos: 1, porque: "Funciona, mas falar com todo mundo é falar com ninguém: mire em quem decide." },
        ],
      },
      {
        id: "canal",
        pergunta: "Por onde a mensagem chega melhor?",
        opcoes: [
          { texto: "Grupos de WhatsApp das escolas", pontos: 2, porque: "É onde as famílias já recebem os avisos da escola." },
          { texto: "Diário Oficial", pontos: 0, porque: "Precisa publicar lá, mas quase nenhuma família lê o Diário Oficial." },
          { texto: "Um outdoor no centro", pontos: 1, porque: "Aparece, mas não tem link para o app e só quem passa no centro vê." },
        ],
      },
      {
        id: "titulo",
        pergunta: "Qual título vai no post?",
        opcoes: [
          {
            texto: "Fica facultado ao responsável legal efetivar a matrícula mediante requerimento",
            pontos: 0,
            porque: "Burocratês: as pessoas não entendem e desistem de ler.",
          },
          { texto: "Matrícula aberta! Faça pelo app até sexta", pontos: 2, porque: "Linguagem simples: diz o que é, como e até quando." },
          { texto: "ATENÇÃO!!! MATRÍCULAS!!!", pontos: 1, porque: "Chama atenção, mas não diz como nem até quando — e caixa-alta parece grito." },
        ],
      },
      ARTE("matrícula aberta"),
      {
        id: "alt",
        pergunta: "Qual descrição da imagem para quem usa leitor de tela?",
        opcoes: [
          { texto: "imagem.png", pontos: 0, porque: "O leitor de tela lê \"imagem ponto png\": não ajuda ninguém." },
          {
            texto: "Mãe e filho sorrindo na frente da escola, com o celular aberto no app de matrícula",
            pontos: 2,
            porque: "Descreve o que importa na imagem, em uma frase.",
          },
          { texto: "Foto", pontos: 1, porque: "Melhor que nada, mas não conta o que a foto mostra." },
        ],
      },
    ],
  },
  {
    id: "vacina",
    titulo: "Vacinação nas escolas",
    briefing:
      "Na semana que vem, as equipes de saúde vão vacinar as crianças dentro das escolas. As famílias precisam mandar a carteirinha de vacinação na mochila.",
    imagem: "vacina",
    alcanceBase: 3100,
    passos: [
      {
        id: "publico",
        pergunta: "Quem precisa agir para dar certo?",
        opcoes: [
          { texto: "As crianças", pontos: 1, porque: "Elas são vacinadas, mas quem coloca a carteirinha na mochila são os adultos." },
          { texto: "Os diretores das escolas", pontos: 0, porque: "Eles já sabem: a mensagem precisa chegar em casa." },
          { texto: "As famílias", pontos: 2, porque: "Isso! São elas que separam a carteirinha e autorizam." },
        ],
      },
      {
        id: "canal",
        pergunta: "Qual canal usar?",
        opcoes: [
          { texto: "Bilhete na agenda e WhatsApp da escola", pontos: 2, porque: "Chega nas famílias pelos dois caminhos que elas mais olham." },
          { texto: "Só no site da prefeitura", pontos: 0, porque: "Pouca gente entra no site sem motivo." },
          { texto: "Rádio local", pontos: 1, porque: "Alcança muita gente, mas sem lembrar da carteirinha na hora de arrumar a mochila." },
        ],
      },
      {
        id: "titulo",
        pergunta: "Qual título vai no post?",
        opcoes: [
          { texto: "Semana que vem tem vacina na escola: mande a carteirinha!", pontos: 2, porque: "Diz quando, onde e o que fazer." },
          { texto: "Campanha de imunização no âmbito escolar", pontos: 0, porque: "Palavras difíceis e nenhuma ação clara." },
          { texto: "Vacina é vida 💉", pontos: 1, porque: "Bonito, mas não avisa da carteirinha nem da data." },
        ],
      },
      ARTE("vacinação na escola"),
      {
        id: "alt",
        pergunta: "Qual descrição da imagem para quem usa leitor de tela?",
        opcoes: [
          {
            texto: "Menina sorridente mostrando a carteirinha de vacinação e o curativo no braço, com a enfermeira fazendo joinha",
            pontos: 2,
            porque: "Conta quem está na imagem e o detalhe importante: a carteirinha.",
          },
          { texto: "Vacina", pontos: 1, porque: "Curta demais: fala o tema, não a imagem." },
          { texto: "Clique aqui", pontos: 0, porque: "Isso não é descrição; é texto de botão." },
        ],
      },
    ],
  },
  {
    id: "robotica",
    titulo: "Olimpíada de robótica",
    briefing:
      "Vai ter a 1ª Olimpíada de Robótica das escolas municipais! As inscrições dos times são feitas pelos próprios alunos, até o fim do mês.",
    imagem: "robotica",
    alcanceBase: 4200,
    passos: [
      {
        id: "publico",
        pergunta: "Para quem é essa campanha?",
        opcoes: [
          { texto: "Alunos do 6º ao 9º ano", pontos: 2, porque: "São eles que montam os times e se inscrevem." },
          { texto: "Empresas de tecnologia", pontos: 0, porque: "Podem até patrocinar, mas não são o público da inscrição." },
          { texto: "Famílias dos alunos", pontos: 1, porque: "Ajudam a incentivar, mas a decisão de se inscrever é dos alunos." },
        ],
      },
      {
        id: "canal",
        pergunta: "Qual canal usar?",
        opcoes: [
          { texto: "E-mail para as secretarias", pontos: 0, porque: "Fica preso na caixa de entrada e não chega na turma." },
          { texto: "Instagram da SEMEC e cartaz nas salas", pontos: 2, porque: "Onde os alunos estão: no celular e na escola." },
          { texto: "Jornal impresso", pontos: 1, porque: "Prestígio, mas pouquíssimos alunos leem jornal." },
        ],
      },
      {
        id: "titulo",
        pergunta: "Qual título vai no post?",
        opcoes: [
          { texto: "Edital nº 12/2026 – Olimpíada Municipal de Robótica", pontos: 0, porque: "Parece documento, não convite. Ninguém se anima." },
          { texto: "Robôs, partiu? Monte seu time e inscreva-se até o fim do mês!", pontos: 2, porque: "Convida, fala a língua deles e diz o prazo." },
          { texto: "Olimpíada de Robótica 2026", pontos: 1, porque: "Claro, mas não diz o que fazer nem até quando." },
        ],
      },
      ARTE("olimpíada de robótica"),
      {
        id: "alt",
        pergunta: "Qual descrição da imagem para quem usa leitor de tela?",
        opcoes: [
          { texto: "Robô", pontos: 1, porque: "Diz o principal, mas deixa de fora o time de alunos." },
          {
            texto: "Três alunos comemorando ao lado do robô que montaram, numa mesa cheia de peças",
            pontos: 2,
            porque: "Mostra a cena e o clima: dá vontade de participar.",
          },
          { texto: "IMG_2026_04_robotica_final_v3.jpg", pontos: 0, porque: "Nome de arquivo não é descrição." },
        ],
      },
    ],
  },
];
