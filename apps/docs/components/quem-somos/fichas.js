// Fichas da Vila SEMEC: abertas ao clicar num personagem ou mascote no mapa
// 3D (evento onInspect do motor). `imagem` é o nome do arquivo em
// public/quem-somos/fichas/ (boneco vinil, 2:3 vertical) e `alt`, o texto
// alternativo dela. Personagens apontam para o próprio mascote (`mascote`);
// mascotes, para o dono (`dono`).
export const FICHAS = {
  pedro: {
    tipo: "personagem",
    nome: "Pedro",
    nomeCompleto: "Pedro Antônio Oliveira Leonel",
    subtitulo: "Diretor de Departamento",
    descricao:
      "Engenheiro mecatrônico e desenvolvedor full stack. Gosta de levar código para o mundo real: IoT, automação e dados ajudando a prefeitura a decidir melhor. Quando a música toca, ninguém segura a dança.",
    imagem: "pedro.webp",
    alt: "Boneco do Pedro",
    mascote: "ocarina",
  },
  rafa: {
    tipo: "personagem",
    nome: "Rafa",
    nomeCompleto: "Rafael Ruggieri",
    subtitulo: "Dev Front-end",
    descricao:
      "Trabalha com Next.js e React, orquestra IAs e pensa em arquitetura de software. O lema dele resume tudo: “I just want to create”.",
    imagem: "rafa.webp",
    alt: "Boneco do Rafa",
    mascote: "waffle",
  },
  leo: {
    tipo: "personagem",
    nome: "Leo",
    nomeCompleto: "Leonardo Seiji Nakayama",
    subtitulo: "Dev Back-end · Full Stack",
    descricao:
      "Estuda Ciência da Computação na UNIR e, nas horas vagas, faz jogos com Godot e Java. Ou seja: ele sabe muito bem como funciona um ginásio.",
    imagem: "leo.webp",
    alt: "Boneco do Leo",
    mascote: "samurai",
  },
  tiago: {
    tipo: "personagem",
    nome: "Thiago",
    nomeCompleto: "Thiago Nascimento",
    subtitulo: "DevOps / Infra",
    descricao:
      "De cabelo cacheado e óculos redondos, não larga o coelhinho de pelúcia, que pula ao lado dele na porta do ginásio. Se alguém pergunta qual é a boa, ele já responde: “É esse que é o negócio”.",
    imagem: "tiago.webp",
    alt: "Boneco do Thiago",
    mascote: "coelho",
  },
  samurai: {
    tipo: "mascote",
    nome: "Bolinho Samurai",
    subtitulo: "Mascote do Leo",
    descricao:
      "Um onigiri com alma de guerreiro. Passa o dia no tai chi, bem zen, até sacar a katana num golpe só.",
    imagem: "samurai.webp",
    alt: "Boneco do Bolinho Samurai, o onigiri samurai do Leo",
    dono: "leo",
  },
  coelho: {
    tipo: "mascote",
    nome: "Coelhinho",
    subtitulo: "Mascote do Thiago",
    descricao:
      "Coelhinho de pelúcia que não para quieto: dá pulinhos pelo jardim e, quando se empolga, solta um mortal.",
    imagem: "coelho.webp",
    alt: "Boneco do Coelhinho de pelúcia do Thiago",
    dono: "tiago",
  },
  waffle: {
    tipo: "mascote",
    nome: "Waffle",
    subtitulo: "Mascote do Rafa",
    descricao:
      "Crocante por fora, dançarino por dentro. Ginga, dança twist e dá giros sem perder nenhum quadradinho.",
    imagem: "waffle.webp",
    alt: "Boneco do Waffle, mascote do Rafa",
    dono: "rafa",
  },
  mariana: {
    tipo: "personagem",
    nome: "Mariana",
    nomeCompleto: "Mariana Feitoza Barros",
    subtitulo: "Machine Learning e Dados",
    descricao:
      "Estuda Ciência da Computação e trabalha com back-end e machine learning. Programa em C, C++, Java, TypeScript e SQL, e adora gatos.",
    imagem: "mariana.webp",
    alt: "Boneco da Mariana",
    mascote: "rena",
  },
  rena: {
    tipo: "mascote",
    nome: "Rena",
    subtitulo: "Mascote da Mariana",
    descricao:
      "Uma renazinha tímida de chapéu cor-de-rosa. Quando fica feliz, sai pulando de um lado para o outro; quando fica sem graça, vira de costas e se encolhe.",
    imagem: "rena.webp",
    alt: "Boneco da Rena de chapéu cor-de-rosa, mascote da Mariana",
    dono: "mariana",
  },
  ocarina: {
    tipo: "mascote",
    nome: "Ocarina",
    subtitulo: "Mascote do Pedro",
    descricao:
      "Uma ocarina azul que flutua em órbita enquanto o Pedro dança, soltando notas musicais pelo caminho.",
    imagem: "ocarina.webp",
    alt: "Boneco da Ocarina azul do Pedro",
    dono: "pedro",
  },
  // TODO: confirmar nome completo, cargo e bio do Zé Carlos
  "ze-carlos": {
    tipo: "personagem",
    nome: "Zé Carlos",
    nomeCompleto: "Zé Carlos",
    subtitulo: "Equipe SEMEC",
    descricao:
      "Cabelo grisalho, sorriso de canto e camiseta azul-marinho. Passeia pelo gramado ao sul da SEMFAZ sem pressa, sempre com o livro de estimação ao lado.",
    imagem: "ze-carlos.webp",
    alt: "Boneco do Zé Carlos",
    mascote: "livro",
  },
  emily: {
    tipo: "personagem",
    nome: "Emily",
    nomeCompleto: "Emily Costa",
    subtitulo: "Jornalista · Assessora de comunicação",
    descricao:
      "Dos cachos castanhos e da blusa de bolinhas, anima a praça do Front-End. Onde ela passa, o microfone vai atrás, pronto para cantar.",
    imagem: "emily.webp",
    alt: "Boneco da Emily",
    mascote: "microfone",
  },
  gava: {
    tipo: "personagem",
    nome: "Vinicius",
    nomeCompleto: "Vinicius Gava de Oliveira",
    subtitulo: "Diretor de Tecnologia",
    descricao:
      "Engenheiro mecatrônico e diretor do Departamento de Tecnologia da SEMFAZ. Construiu a Vila SEMEC: o mapa 3D, as batalhas e as quests. Na porta da SEMEC, de notebook aberto, é quem entrega a sua primeira linguagem de programação.",
    imagem: "gava.webp",
    alt: "Boneco do Vinicius",
  },
  livro: {
    tipo: "mascote",
    nome: "Livro Sábio",
    subtitulo: "Mascote do Zé Carlos",
    descricao:
      "Um livro antigo de capa de couro e sobrancelhas grisalhas. Concorda com a cabeça como quem já leu de tudo e, quando se empolga, dá uma cambalhota.",
    imagem: "livro.webp",
    alt: "Boneco do Livro Sábio de capa de couro marrom, mascote do Zé Carlos",
    dono: "ze-carlos",
  },
  microfone: {
    tipo: "mascote",
    nome: "Microfone",
    subtitulo: "Mascote da Emily",
    descricao:
      "Um microfone roxinho de lacinho rosa, meio tímido, que não larga a sua nota musical dourada. Fica vermelho quando aplaudem, mas canta junto com a Emily e fecha o show com um giro.",
    imagem: "microfone.webp",
    alt: "Boneco de um microfone roxo com lacinho rosa segurando uma nota musical dourada, mascote da Emily",
    dono: "emily",
  },
};

export const ehFicha = (id) => typeof id === "string" && Object.hasOwn(FICHAS, id);
