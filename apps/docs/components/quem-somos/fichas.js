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
  // TODO: confirmar a bio do Tiago (cargo igual ao de page.jsx)
  tiago: {
    tipo: "personagem",
    nome: "Tiago",
    nomeCompleto: "Tiago",
    subtitulo: "DevOps / Infra",
    descricao:
      "De cabelo cacheado e óculos redondos, não larga o coelhinho de pelúcia, que pula ao lado dele na porta do ginásio. Se alguém pergunta qual é a boa, ele já responde: “É esse que é o negócio”.",
    imagem: "tiago.webp",
    alt: "Boneco do Tiago",
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
    subtitulo: "Mascote do Tiago",
    descricao:
      "Coelhinho de pelúcia que não para quieto: dá pulinhos pelo jardim e, quando se empolga, solta um mortal.",
    imagem: "coelho.webp",
    alt: "Boneco do Coelhinho de pelúcia do Tiago",
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
};

export const ehFicha = (id) => typeof id === "string" && Object.hasOwn(FICHAS, id);
