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
      <path d="M20 54h24" />
    </svg>
  );
}

export function ArtCores() {
  return (
    <svg width="56" height="56" {...base}>
      <circle cx="22" cy="38" r="12" />
      <circle cx="32" cy="26" r="12" />
      <circle cx="42" cy="38" r="12" />
    </svg>
  );
}

export function ArtLayout() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="10" y="10" width="44" height="44" rx="4" />
      <path d="M10 24h44" />
      <rect x="14" y="30" width="10" height="20" rx="2" />
      <rect x="28" y="30" width="22" height="20" rx="2" />
    </svg>
  );
}

export function ArtRaios() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="10" y="10" width="44" height="44" rx="8" />
      <rect x="21" y="21" width="22" height="22" rx="6" />
      <circle cx="32" cy="32" r="3" />
    </svg>
  );
}

export function ArtComponentes() {
  return (
    <svg width="56" height="56" {...base}>
      <rect x="14" y="14" width="36" height="10" rx="3" />
      <rect x="14" y="30" width="36" height="20" rx="4" />
      <circle cx="44" cy="40" r="3" />
      <path d="M14 44h18" />
    </svg>
  );
}

export function ArtAnimacoes() {
  return (
    <svg width="56" height="56" {...base}>
      <path d="M12 20l10 12-10 12" />
      <path d="M29 20l10 12-10 12" />
      <path d="M46 20l10 12-10 12" />
    </svg>
  );
}

export function ArtAcessibilidade() {
  return (
    <svg width="56" height="56" {...base}>
      <path d="M12 32c8-10 32-10 40 0-8 10-32 10-40 0Z" />
      <circle cx="32" cy="32" r="5" />
    </svg>
  );
}

export function ArtAntiPadroes() {
  return (
    <svg width="56" height="56" {...base}>
      <circle cx="32" cy="32" r="16" />
      <path d="M22 22l20 20" />
    </svg>
  );
}