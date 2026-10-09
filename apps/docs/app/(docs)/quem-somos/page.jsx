import Image from "next/image";
import VilaSemec from "@/components/quem-somos/VilaSemec";

export const metadata = { title: "Quem Somos" };

// retrato: busto do personagem em public/quem-somos/retratos/<retrato>.webp
// (e <retrato>-fala.webp, boca aberta), mostrado ao lado das falas na Vila.
// bio: descrição curta na lista da equipe. fala: apresentação em primeira
// pessoa na primeira conversa dentro do jogo. quest: personagem avulso que
// dá uma quest na Vila (fora das batalhas; ver components/quem-somos/quest.js).
const directors = [
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
    name: "Nome Sobrenome",
    role: "Diretor(a) de Design",
    linkedin: "https://linkedin.com/in/",
    photo: null,
  },
];

// O primeiro estagiário de cada área (pelo cargo, ver components/quem-somos/
// areas.js) é o líder do ginásio dela na Vila, a não ser que alguém da área
// tenha `chefe` (id do ginásio) explícito.
const interns = [
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
    bio: "Estudante de Ciência da Computação, desenvolvedora back-end e de machine learning. Programa em C, C++, Java, JavaScript/TypeScript e SQL.",
    fala: "Curso Ciência da Computação e trabalho com back-end e machine learning. C, C++, Java, SQL... Ah, e eu adoro gatos!",
    linkedin: "https://www.linkedin.com/in/mariana-feitoza-barros-21ab58245/",
    github: "https://github.com/MariMeng",
    retrato: "mariana",
    photo: "/quem-somos/retratos/mariana.webp",
  },
  {
    name: "Nome Sobrenome",
    role: "Design UI/UX",
    linkedin: "https://linkedin.com/in/",
    photo: null,
  },
  {
    // TODO: nome completo, bio, fala e LinkedIn do Tiago.
    name: "Tiago",
    role: "DevOps / Infra",
    linkedin: "https://linkedin.com/in/",
    // Lidera o ginásio do Banco de Dados (no lugar do primeiro da área).
    chefe: "database",
    retrato: "tiago",
    photo: "/quem-somos/retratos/tiago.webp",
  },
];

function Avatar({ src, name, size }) {
  if (src) {
    const px = size === "lg" ? 120 : 80;
    return (
      // images.unoptimized: o next/image não prefixa o basePath sozinho.
      <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}${src}`} alt={`Foto de ${name}`} width={px} height={px} className={`team-avatar team-avatar--${size}`} />
    );
  }
  return (
    <div className={`team-avatar team-avatar--${size} team-avatar--placeholder`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

function TeamCard({ member, size = "md" }) {
  return (
    <div className={`team-card team-card--${size}`}>
      <Avatar src={member.photo} name={member.name} size={size} />
      <div className="team-card-info">
        <h3 className="team-card-name">{member.name}</h3>
        <p className="team-card-role">{member.role}</p>
        {member.bio && <p className="team-card-bio">{member.bio}</p>}
        <div className="team-card-links">
        {member.linkedin && (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="team-card-linkedin"
            aria-label={`LinkedIn de ${member.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span>LinkedIn</span>
          </a>
        )}
        {member.github && (
          <a
            href={member.github}
            target="_blank"
            rel="noopener noreferrer"
            className="team-card-linkedin"
            aria-label={`GitHub de ${member.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
              <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .3"/>
            </svg>
            <span>GitHub</span>
          </a>
        )}
        </div>
      </div>
    </div>
  );
}

const members = [
  ...directors.map((m) => ({ ...m, group: "directors" })),
  ...interns.map((m) => ({ ...m, group: "interns" })),
];

export default function QuemSomosPage() {
  return (
    <div className="no-toc quem-somos-wrapper">
      <VilaSemec members={members} />

      <section id="equipe" className="quem-somos-lista" aria-labelledby="equipe-titulo">
        <h2 id="equipe-titulo" className="team-section-title">Equipe</h2>
        <p className="subtitle">
          Somos o time de tecnologia e design por trás do Design System da
          SEMEC Porto Velho. Construímos e mantemos essas ferramentas para
          garantir experiências digitais consistentes e acessíveis para a
          população.
        </p>

        <div className="team-section">
          <div className="team-grid team-grid--directors">
            {directors.map((member, i) => (
              <TeamCard key={`d-${i}`} member={member} size="lg" />
            ))}
          </div>
        </div>

        <div className="team-section">
          <div className="team-grid team-grid--interns">
            {interns.map((member, i) => (
              <TeamCard key={`i-${i}`} member={member} size="md" />
            ))}
          </div>
        </div>

        <div className="quem-somos-bg" aria-hidden="true">
          <Image src="/PortoVelhoPintura.svg" alt="" width={1536} height={1024} />
        </div>
      </section>
    </div>
  );
}
