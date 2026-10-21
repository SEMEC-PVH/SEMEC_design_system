// Equipe do Design System da SEMEC: fonte única dos dados de quem somos.
// `directors` e `interns` alimentam a Vila SEMEC (`membrosDaVila`, na ordem
// em que o motor espera: índices, ginásios e museu dependem dela). `EQUIPE`
// é a lista completa da página da equipe, com quem aparece na Vila só como
// personagem avulso (Zé Carlos e Emily, sem batalha nem ginásio).
//
// retrato: busto do personagem em public/quem-somos/retratos/<retrato>.webp
// (e <retrato>-fala.webp, boca aberta), mostrado ao lado das falas na Vila.
// bio: descrição curta na lista da equipe. fala: apresentação em primeira
// pessoa na primeira conversa dentro do jogo. quest: personagem avulso que
// dá uma quest na Vila (fora das batalhas; ver components/quem-somos/quest.js).
export const directors = [
  {
    name: "Pedro Antônio Oliveira Leonel",
    role: "Diretor de Departamento",
    bio: "Engenheiro mecatrônico (UTFPR) e desenvolvedor full stack. Aplica tecnologia e dados à administração municipal, com experiência em IoT, automação e dashboards.",
    fala: "Sou engenheiro mecatrônico e desenvolvedor full stack. Gosto de levar código para o mundo real: IoT, automação e dados ajudando a prefeitura a decidir melhor.",
    linkedin: "https://www.linkedin.com/in/pedroantonioleonel",
    github: "https://github.com/pdrokbott",
    retrato: "pedro",
    quest: "ocarina",
    photo: "/quem-somos/retratos/pedro.webp",
  },
  {
    // Na Vila, é ele quem entrega a primeira linguagem (Diretoria), com o
    // boneco 3D de notebook aberto (components/quem-somos/scene/vinicius.js).
    // TODO: LinkedIn do Vinicius.
    name: "Vinicius Gava de Oliveira",
    role: "Diretor de Tecnologia",
    bio: "Engenheiro mecatrônico e diretor do Departamento de Tecnologia da SEMFAZ. Construiu a Vila SEMEC: o mapa 3D, as batalhas e as quests.",
    github: "https://github.com/VgavaBR123",
    retrato: "gava",
    photo: "/quem-somos/retratos/gava.webp",
  },
];

// O primeiro estagiário de cada área (pelo cargo, ver components/quem-somos/
// areas.js) é o líder do ginásio dela na Vila, a não ser que alguém da área
// tenha `chefe` (id do ginásio) explícito.
export const interns = [
  {
    name: "Rafael Ruggieri",
    role: "Dev Front-end",
    bio: "Desenvolvedor com foco em Next.js e React, orquestração de IA e arquitetura de software. Lema: “I just want to create”.",
    fala: "Eu só quero criar! Trabalho com Next.js e React e ando orquestrando IAs e pensando em arquitetura de software.",
    linkedin: "https://www.linkedin.com/in/rafaelruggieri",
    github: "https://github.com/Rug-gieri",
    retrato: "rafa",
    photo: "/quem-somos/retratos/rafa.webp",
  },
  {
    name: "Leonardo Seiji Nakayama",
    role: "Dev Back-end · Full Stack",
    bio: "Acadêmico de Ciência da Computação na UNIR e técnico em manutenção e suporte em informática. Desenvolve jogos com Godot e Java/LibGDX e projetos de sistemas distribuídos.",
    fala: "Estudo Ciência da Computação na UNIR. Nas horas vagas faço jogos com Godot e Java, então sim: eu sei como funciona um ginásio!",
    linkedin: "https://www.linkedin.com/in/leonardo-seiji-nakayama-b48a1b281",
    github: "https://github.com/LeonardoSeijiNakayama",
    retrato: "leo",
    photo: "/quem-somos/retratos/leo.webp",
  },
  {
    name: "Mariana Feitoza Barros",
    role: "Machine Learning e Dados",
    // Líder do ginásio bônus: o Laboratório de Machine Learning.
    chefe: "ml",
    bio: "Desenvolvedora de machine learning e software. Estuda Ciência da Computação na UNIR e começou no back-end pela Cubos Academy. Programa em C, C++, Java, JavaScript/TypeScript e SQL.",
    fala: "Curso Ciência da Computação e trabalho com back-end e machine learning. C, C++, Java, SQL... Ah, e eu adoro gatos!",
    linkedin: "https://www.linkedin.com/in/mariana-feitoza-barros-21ab58245/",
    github: "https://github.com/MariMeng",
    retrato: "mariana",
    photo: "/quem-somos/retratos/mariana.webp",
  },
  {
    // TODO: bio e fala do Thiago.
    name: "Thiago Nascimento",
    role: "DevOps / Infra",
    // Lidera o ginásio do Banco de Dados (no lugar do primeiro da área).
    chefe: "database",
    linkedin: "https://www.linkedin.com/in/thiago-nascimento-916290328/",
    retrato: "tiago",
    photo: "/quem-somos/retratos/tiago.webp",
  },
];

// TODO: nome completo, cargo, bio e links do Zé Carlos; cargo e bio da Emily
// (os textos abaixo vêm das fichas da Vila, components/quem-somos/fichas.js).
export const outros = [
  {
    name: "Zé Carlos",
    role: "Equipe SEMEC",
    bio: "Guardião da história do Design System: na Vila, é ele quem conta, em volta da fogueira, como tudo começou.",
    retrato: "ze-carlos",
    photo: "/quem-somos/retratos/ze-carlos.webp",
  },
  {
    name: "Emily Costa",
    role: "Equipe SEMEC",
    bio: "Cuida da comunicação: na Vila, desafia quem passa a montar campanhas acessíveis para a rede municipal.",
    linkedin: "https://www.linkedin.com/in/emily-costa-8b2706235/",
    retrato: "emily",
    photo: "/quem-somos/retratos/emily.webp",
  },
];

// O que a Vila recebe (não incluir `outros`: eles já são atores da cena).
export const membrosDaVila = [
  ...directors.map((m) => ({ ...m, group: "directors" })),
  ...interns.map((m) => ({ ...m, group: "interns" })),
];

// Link "TODO" (perfil ainda não informado, ex.: "https://linkedin.com/in/")
// não vira link nem botão, nos cards e na ficha.
export const linkValido = (url) => typeof url === "string" && !/\/in\/?$/.test(url);

// Página da equipe. `grupo`: "diretoria" | "desenvolvimento" | "comunicacao".
// `ficha`: id em FICHAS (boneco e mascote; o Vinicius usa a ficha "gava").
const GRUPO_DE = { "ze-carlos": "comunicacao", emily: "comunicacao" };
export const GRUPOS = [
  { id: "diretoria", rotulo: "Diretoria" },
  { id: "desenvolvimento", rotulo: "Desenvolvimento" },
  { id: "comunicacao", rotulo: "Conteúdo e comunicação" },
];
export const EQUIPE = [
  ...directors.map((m) => ({ ...m, grupo: "diretoria" })),
  ...interns.map((m) => ({ ...m, grupo: "desenvolvimento" })),
  ...outros.map((m) => ({ ...m, grupo: GRUPO_DE[m.retrato] })),
].map((m) => ({ ...m, ficha: m.retrato }));
