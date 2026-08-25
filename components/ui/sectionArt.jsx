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

export function ArtComponentes() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="14" y="14" width="36" height="10" rx="3" />
      <rect x="14" y="30" width="36" height="20" rx="4" />
      {/* o controle responde, como responderia ao toque */}
      <circle className="art__ponto" cx="44" cy="40" r="3" />
      <path d="M14 44h18" />
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
