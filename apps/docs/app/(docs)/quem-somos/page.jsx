import Link from "next/link";

export const metadata = { title: "Quem Somos" };

const directors = [
  {
    name: "Nome Sobrenome",
    role: "Diretor(a) de Tecnologia",
    linkedin: "https://linkedin.com/in/",
    photo: null,
  },
  {
    name: "Nome Sobrenome",
    role: "Diretor(a) de Design",
    linkedin: "https://linkedin.com/in/",
    photo: null,
  },
];

const interns = [
  {
    name: "Nome Sobrenome",
    role: "Dev Front-end",
    linkedin: "https://linkedin.com/in/",
    photo: null,
  },
  {
    name: "Nome Sobrenome",
    role: "Dev Back-end",
    linkedin: "https://linkedin.com/in/",
    photo: null,
  },
  {
    name: "Nome Sobrenome",
    role: "Design UI/UX",
    linkedin: "https://linkedin.com/in/",
    photo: null,
  },
  {
    name: "Nome Sobrenome",
    role: "DevOps / Infra",
    linkedin: "https://linkedin.com/in/",
    photo: null,
  },
];

function Avatar({ src, name, size }) {
  if (src) {
    return (
      <img src={src} alt={`Foto de ${name}`} className={`team-avatar team-avatar--${size}`} />
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
      </div>
    </div>
  );
}

export default function QuemSomosPage() {
  return (
    <>
      <h1>Quem Somos</h1>
      <p className="subtitle">
        Somos o time de tecnologia e design por trás do Design System da
        SEMEC Porto Velho. Construímos e mantemos essas ferramentas para
        garantir experiências digitais consistentes e acessíveis para a
        população.
      </p>

      <section className="team-section">
        <h2 className="team-section-title">Diretores</h2>
        <div className="team-grid team-grid--directors">
          {directors.map((member) => (
            <TeamCard key={member.name} member={member} size="lg" />
          ))}
        </div>
      </section>

      <section className="team-section">
        <h2 className="team-section-title">Estagiários</h2>
        <div className="team-grid team-grid--interns">
          {interns.map((member) => (
            <TeamCard key={member.name} member={member} size="md" />
          ))}
        </div>
      </section>
    </>
  );
}
