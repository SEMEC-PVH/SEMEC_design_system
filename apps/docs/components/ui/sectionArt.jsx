/**
 * Arte dos cards de seção da página inicial.
 *
 * São desenhos decorativos de 52px, não o sistema de ícones de 16/20/24px
 * que a especificação descreve — por isso o traço aqui é 3px, e não 2px.
 * Camadas diferentes, regras diferentes.
 *
 * As classes `art__*` existem para a animação de hover, definida em
 * `globals.css`. Elemento sem classe é elemento que não se move: a
 * moldura fica parada e só a parte que carrega o conceito anima.
 */

const base = {
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function ArtTipografia() {
  return (
    <svg width="56" height="56" {...base}>
      <path d="M16 20h32" />
      <path d="M32 20v30" />
      {/* a base se alarga, como a serifa de um tipo com peso maior */}
      <path className="art__serifa" d="M20 54h24" />
    </svg>
  );
}

export function ArtCores() {
  return (
    <svg width="56" height="56" {...base}>
      {/* os três se afastam, revelando a mistura que estava sobreposta */}
      <circle className="art__cor art__cor--esq" cx="22" cy="38" r="12" />
      <circle className="art__cor art__cor--topo" cx="32" cy="26" r="12" />
      <circle className="art__cor art__cor--dir" cx="42" cy="38" r="12" />
    </svg>
  );
}

export function ArtLayout() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="10" y="10" width="44" height="44" rx="4" />
      <path d="M10 24h44" />
      {/* as colunas assentam no lugar, uma depois da outra */}
      <rect className="art__bloco art__bloco--a" x="14" y="30" width="10" height="20" rx="2" />
      <rect className="art__bloco art__bloco--b" x="28" y="30" width="22" height="20" rx="2" />
    </svg>
  );
}

export function ArtRaios() {
  return (
    <svg width="56" height="56" {...base}>
      {/* o próprio raio de borda cresce — o desenho demonstra o token */}
      <rect className="art__raio art__raio--externo" x="10" y="10" width="44" height="44" />
      <rect className="art__raio art__raio--interno" x="21" y="21" width="22" height="22" />
      <circle cx="32" cy="32" r="3" />
    </svg>
  );
}

export function ArtHeader() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="10" y="10" width="44" height="44" rx="6" />
      <path d="M16 17h14" />
      <rect x="40" y="14" width="8" height="6" rx="2" />
      <path d="M16 26h32" />
      <path d="M16 33h32" />
      <path d="M16 40h16" />
      {/* o CTA se adianta: é o convite da ação */}
      <rect className="art__cta" x="36" y="38" width="12" height="8" rx="2" />
    </svg>
  );
}

export function ArtHero() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="10" y="10" width="44" height="44" rx="6" />
      <path d="M16 20h14" />
      {/* o título se alonga, como um hero que se expande */}
      <path className="art__hero-line" d="M16 28h32" />
      <path d="M16 35h24" />
      <circle className="art__ponto" cx="20" cy="45" r="3" />
      <path d="M27 45h17" />
    </svg>
  );
}

export function ArtControles() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="10" y="10" width="44" height="44" rx="6" />
      {/* os chips são ativados em sequência, como tabs sendo percorridas */}
      <rect className="art__chip art__chip--a" x="12" y="16" width="16" height="9" rx="4.5" />
      <rect className="art__chip art__chip--b" x="31" y="16" width="16" height="9" rx="4.5" />
      <rect x="12" y="30" width="40" height="9" rx="4.5" />
      <path d="M12 44h24" />
    </svg>
  );
}

export function ArtServiceCard() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="10" y="10" width="44" height="44" rx="6" />
      {/* a tag levanta: é o selo que distingue o serviço */}
      <rect className="art__tag" x="14" y="16" width="18" height="9" rx="4.5" />
      <path d="M14 31h32" />
      <path d="M14 38h26" />
      <rect x="14" y="45" width="11" height="6" rx="3" />
      <circle className="art__ponto" cx="46" cy="48" r="3" />
    </svg>
  );
}

export function ArtBotoes() {
  return (
    <svg width="56" height="56" {...base}>
      {/* o primário responde ao foco antes dos demais */}
      <rect className="art__btn" x="12" y="12" width="32" height="10" rx="5" />
      <rect x="12" y="26" width="32" height="10" rx="5" />
      <path d="M12 41h20" />
    </svg>
  );
}

export function ArtErrorSummary() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="10" y="10" width="44" height="44" rx="6" />
      {/* o primeiro alerta pulsa: é o que anuncia o problema */}
      <circle className="art__erro" cx="18" cy="20" r="4" />
      <path d="M26 21h22" />
      <circle cx="18" cy="34" r="4" />
      <path d="M26 35h16" />
      <circle cx="18" cy="46" r="4" />
      <path d="M26 47h22" />
    </svg>
  );
}

export function ArtFooter() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="10" y="10" width="44" height="44" rx="6" />
      {/* as colunas de links assentam uma a uma */}
      <rect className="art__col art__col--a" x="14" y="18" width="9" height="22" rx="2" />
      <rect className="art__col art__col--b" x="27" y="18" width="9" height="16" rx="2" />
      <rect className="art__col art__col--c" x="40" y="18" width="9" height="12" rx="2" />
      <path d="M14 46h36" />
    </svg>
  );
}

export function ArtNavegacao() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="10" y="10" width="44" height="44" rx="6" />
      {/* o caminho se percorre: cada nó destaca por vez */}
      <path d="M16 16l16 12 16 12" />
      <circle className="art__no art__no--a" cx="16" cy="16" r="4" />
      <circle className="art__no art__no--b" cx="32" cy="28" r="4" />
      <circle className="art__no art__no--c" cx="48" cy="40" r="4" />
    </svg>
  );
}

export function ArtFormularios() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="10" y="10" width="44" height="44" rx="6" />
      <rect x="12" y="16" width="40" height="9" rx="4.5" />
      {/* o campo do meio recebe o foco */}
      <rect className="art__campo" x="12" y="29" width="40" height="9" rx="4.5" />
      <rect x="12" y="42" width="40" height="9" rx="4.5" />
    </svg>
  );
}

export function ArtDados() {
  return (
    <svg width="56" height="56" {...base}>
      <path d="M12 46V12" />
      <path d="M12 46h40" />
      {/* as barras crescem do chão, uma de cada vez */}
      <rect className="art__barra art__barra--a" x="18" y="28" width="7" height="18" rx="1.5" />
      <rect className="art__barra art__barra--b" x="29" y="20" width="7" height="26" rx="1.5" />
      <rect className="art__barra art__barra--c" x="40" y="32" width="7" height="14" rx="1.5" />
    </svg>
  );
}

export function ArtFeedback() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="10" y="10" width="44" height="44" rx="6" />
      {/* o ponto de status pulsa: é o estado do sistema falando */}
      <circle className="art__status" cx="18" cy="20" r="4" />
      <path d="M27 20h21" />
      <circle cx="18" cy="34" r="4" />
      <path d="M27 34h15" />
      <circle cx="18" cy="46" r="4" />
      <path d="M27 46h21" />
    </svg>
  );
}

export function ArtAcessibilidadePadroes() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="10" y="10" width="44" height="44" rx="6" />
      <circle className="art__cabeca" cx="32" cy="18" r="5" />
      <path d="M32 24c-7 3-10 9-10 15" />
      <path d="M32 24c7 3 10 9 10 15" />
      {/* o eixo central sobe: a pessoa se ergue no espaço */}
      <path className="art__eixo" d="M32 30v16" />
    </svg>
  );
}

export function ArtAnimacoes() {
  return (
    <svg width="56" height="56" {...base}>
      {/* as três avançam em sequência: o próprio conceito de stagger */}
      <path className="art__seta art__seta--1" d="M12 20l10 12-10 12" />
      <path className="art__seta art__seta--2" d="M29 20l10 12-10 12" />
      <path className="art__seta art__seta--3" d="M46 20l10 12-10 12" />
    </svg>
  );
}

export function ArtAcessibilidade() {
  return (
    <svg width="56" height="56" {...base}>
      <path d="M12 32c8-10 32-10 40 0-8 10-32 10-40 0Z" />
      {/* a pupila percorre e volta: o olho que revisa a interface */}
      <circle className="art__pupila" cx="32" cy="32" r="5" />
    </svg>
  );
}

export function ArtAntiPadroes() {
  return (
    <svg width="56" height="56" {...base}>
      <circle cx="32" cy="32" r="16" />
      {/* o traço de proibido se desenha, em vez de já estar lá */}
      <path className="art__corte" pathLength="1" d="M22 22l20 20" />
    </svg>
  );
}

export function ArtPendencias() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="10" y="10" width="44" height="44" rx="6" />
      <path d="M15 17h10" />
      <path d="M29 18h20" />
      <path d="M15 29h10" />
      {/* a pendência se risca: de item aberto a item resolvido */}
      <path className="art__pendencia" pathLength="1" d="M29 30h20" />
      <path d="M15 41h10" />
      <path d="M29 42h14" />
    </svg>
  );
}