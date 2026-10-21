// Galeria da Equipe (museu dentro da sede da SEMEC): quem está nas paredes.
//
// Nome, cargo, bio e links de quem está em `members` (page.jsx) vêm de lá,
// pelo `retrato`. Quem não está em `members` (Zé Carlos, Emily e Gava) fica
// em EXTRAS. A ordem de ORDEM é a dos slots de scene/museu/layout.js.
//
// Projetos: lista fixa, escolhida dos repositórios públicos de cada pessoa
// no GitHub (consulta de 2026-10-15). O Design System entra para todos.

export const ORDEM = ["pedro", "rafa", "leo", "mariana", "tiago", "ze-carlos", "emily", "gava"];

const DESIGN_SYSTEM = {
  nome: "SEMEC Design System",
  url: "https://github.com/SEMEC-PVH/SEMEC_design_system",
  descricao: "O kit de componentes acessíveis da SEMEC e esta Vila.",
  linguagem: "JavaScript",
};

const gh = (dono, nome, descricao, linguagem) => ({
  nome,
  url: `https://github.com/${dono}/${nome}`,
  descricao,
  linguagem,
});

export const PROJETOS = {
  pedro: [
    gh("pdrokbott", "thingsboard-ui-custom", "Interface personalizada da plataforma de IoT ThingsBoard.", "TypeScript"),
    gh("pdrokbott", "Estudos_Python", "Cadernos de estudo em Python.", "Jupyter Notebook"),
  ],
  rafa: [
    gh("Rug-gieri", "Timbag", "Projeto em TypeScript.", "TypeScript"),
    gh("Rug-gieri", "Infanto_modas_nextjs", "Loja de moda infantil feita com Next.js.", "TypeScript"),
    gh("Rug-gieri", "pagina-de-curriculo", "Página de currículo.", "HTML"),
  ],
  leo: [
    gh("LeonardoSeijiNakayama", "Synq", "Jogo de puzzles de lógica em Java/LibGDX, do projeto DACC Station (UNIR).", "Java"),
    gh("LeonardoSeijiNakayama", "Runners-High", "Jogo de corrida com obstáculos feito na Godot.", "GDScript"),
    gh("LeonardoSeijiNakayama", "Oka", "Metroidvania criado no curso de Game Development GameficaRO.", "GDScript"),
  ],
  mariana: [
    gh("MariMeng", "tess_exoplanet_jury", "Classificação de exoplanetas com dados do telescópio TESS.", "Python"),
    gh("MariMeng", "laboratorio-processamento-de-imagens", "Laboratório de processamento de imagens.", "Python"),
    gh("MariMeng", "advanced_algorithms", "Algoritmos avançados em C++.", "C++"),
  ],
  gava: [
    gh("VgavaBR123", "game-revisao-dataprev", "Jogo de revisão de conteúdo.", "HTML"),
    gh("VgavaBR123", "gava-skills", "Skills para agentes de IA.", "Python"),
    gh("VgavaBR123", "Portifolio_Smart_Print", "Portfólio da Smart Print.", "JavaScript"),
  ],
};

// TODO: LinkedIn e GitHub do Zé Carlos; GitHub da Emily; LinkedIn do Gava.
const EXTRAS = {
  "ze-carlos": {
    name: "Zé Carlos",
    role: "Equipe SEMEC",
    bio: "Contador de histórias da equipe: foi ele quem guardou como nasceu o Design System. Anda sempre com o Livro Sábio.",
  },
  emily: {
    name: "Emily Costa",
    role: "Equipe SEMEC",
    bio: "Cuida de como a SEMEC conversa com as pessoas: campanhas, posts e textos claros. Onde ela passa, o Microfone vai atrás.",
    linkedin: "https://www.linkedin.com/in/emily-costa-8b2706235/",
  },
  gava: {
    name: "Vinicius Gava de Oliveira",
    role: "Diretor de Tecnologia",
    bio: "Engenheiro mecatrônico e diretor do Departamento de Tecnologia da SEMFAZ. Construiu a Vila SEMEC: o mapa 3D, as batalhas e as quests. Lá fora, na porta da SEMEC, entrega a primeira linguagem de quem chega.",
    github: "https://github.com/VgavaBR123",
  },
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Lista na ordem dos slots: { id, nome, cargo, bio, linkedin, github,
// retratoUrl, projetos }. Placeholders ("Nome Sobrenome") não entram.
export function montarQuadros(members) {
  const porRetrato = new Map(members.filter((m) => m.retrato).map((m) => [m.retrato, m]));
  return ORDEM.map((id) => {
    const m = porRetrato.get(id) ?? EXTRAS[id];
    if (!m) return null;
    const linkedin = m.linkedin && !/linkedin\.com\/in\/?$/.test(m.linkedin) ? m.linkedin : null;
    return {
      id,
      nome: m.name,
      cargo: m.role,
      bio: m.bio ?? null,
      linkedin,
      github: m.github ?? null,
      retratoUrl: `${basePath}/quem-somos/retratos/${id}.webp`,
      projetos: [DESIGN_SYSTEM, ...(PROJETOS[id] ?? [])],
    };
  }).filter(Boolean);
}
