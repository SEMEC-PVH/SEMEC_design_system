/** Parser do contrato :root de tokens.css; falha ao encontrar valores não suportados. */
export const extension = "br.gov.portovelho.semec";

export function parseRoot(css) {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const roots = [...source.matchAll(/:root\s*\{([^{}]*)\}/g)];
  if (roots.length !== 1) throw new Error("tokens.css deve conter um único :root plano.");
  const declarations = {};
  for (const declaration of roots[0][1].split(";")) {
    const match = declaration.trim().match(/^(--[\w-]+)\s*:\s*(.+)$/s);
    if (!match) {
      if (declaration.trim() && !/^color-scheme\s*:/.test(declaration.trim())) {
        throw new Error(`Declaração não suportada: ${declaration}`);
      }
      continue;
    }
    const [, name, value] = match;
    if (Object.hasOwn(declarations, name)) throw new Error(`Token duplicado: ${name}`);
    declarations[name] = value.trim();
  }
  if (!Object.keys(declarations).length) throw new Error(":root sem tokens.");
  return declarations;
}

function dimension(value) {
  if (value === "0") return { value: 0, unit: "px" };
  const match = value.match(/^(-?\d*\.?\d+)(px|rem)$/);
  if (!match) throw new Error(`Dimensão não suportada: ${value}`);
  return { value: Number(match[1]), unit: match[2] };
}

function color(channels, alpha = 1) {
  if (channels.length !== 3 || channels.some((c) => !Number.isFinite(c) || c < 0 || c > 255)) {
    throw new Error(`Canais RGB inválidos: ${channels}`);
  }
  return { colorSpace: "srgb", components: channels.map((c) => c / 255), alpha };
}

function typedValue(name, value) {
  if (/^#[\da-f]{6}$/i.test(value)) {
    return ["color", color(value.slice(1).match(/../g).map((c) => parseInt(c, 16)))];
  }
  // Auxiliar CSS dos canais de sombra: exportado como cor sRGB, sem perder o CSS original.
  if (name.endsWith("-rgb") && /^\d+\s+\d+\s+\d+$/.test(value)) {
    return ["color", color(value.split(/\s+/).map(Number))];
  }
  if (name.startsWith("--elevation-")) {
    const match = value.match(/^(\S+) (\S+) (\S+)(?: (\S+))? rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/);
    if (value !== "none" && !match) throw new Error(`Sombra não suportada: ${value}`);
    return ["shadow", {
      color: match ? color(match.slice(5, 8).map(Number), Number(match[8])) : color([0, 0, 0], 0),
      offsetX: dimension(match?.[1] ?? "0"),
      offsetY: dimension(match?.[2] ?? "0"),
      blur: dimension(match?.[3] ?? "0"),
      spread: dimension(match?.[4] ?? "0"),
    }];
  }
  if (name.startsWith("--font-family-")) {
    return ["fontFamily", value.split(",").map((family) => family.trim().replace(/^["']|["']$/g, ""))];
  }
  if (/^--font-(regular|medium|semibold|bold)$/.test(name) && /^\d+$/.test(value)) {
    return ["fontWeight", Number(value)];
  }
  if (/^--(?:pv-)?leading-/.test(name) && /^\d*\.?\d+$/.test(value)) return ["number", Number(value)];
  const duration = value.match(/^(\d*\.?\d+)(ms|s)$/);
  if (duration) return ["duration", { value: Number(duration[1]), unit: duration[2] }];
  const easing = value.match(/^cubic-bezier\(([^)]+)\)$/);
  if (easing) {
    const points = easing[1].split(",").map(Number);
    if (points.length !== 4 || points.some((p) => !Number.isFinite(p)) || [points[0], points[2]].some((p) => p < 0 || p > 1)) {
      throw new Error(`Curva inválida: ${value}`);
    }
    return ["cubicBezier", points];
  }
  if (/^--(?:pv-)?(?:space|radius|text)-/.test(name)) return ["dimension", dimension(value)];
  throw new Error(`Tipo não suportado para ${name}: ${value}`);
}

export function tokenData(css) {
  const declarations = parseRoot(css);
  // Conforme o cabeçalho do CSS: estes quatro prefixos pv-* pertencem a L1.
  const layer = (name) => name.startsWith("--pv-") && !/^--pv-(text|leading|radius|duration)-/.test(name) ? "L0" : "L1";
  const resolved = {};
  function resolve(name, trail = []) {
    if (!Object.hasOwn(declarations, name)) throw new Error(`Referência ausente: ${name}`);
    if (trail.includes(name)) throw new Error(`Referência circular: ${[...trail, name].join(" → ")}`);
    if (Object.hasOwn(resolved, name)) return resolved[name];
    const value = declarations[name].replace(/var\((--[\w-]+)\)/g, (_, ref) => resolve(ref, [...trail, name]));
    if (value.includes("var(")) throw new Error(`Referência não suportada: ${name}`);
    return (resolved[name] = value);
  }
  const dtcg = { L0: {}, L1: {} };
  const tokens = {};
  const dsTokens = { colors: [], semantic: [], typography: [], spacing: [], radii: [], elevation: [], motion: [], values: {} };
  for (const [name, raw] of Object.entries(declarations)) {
    const value = resolve(name);
    const [type, typed] = typedValue(name, value);
    const ref = raw.match(/^var\((--[\w-]+)\)$/)?.[1];
    const key = name.slice(2);
    dtcg[layer(name)][key] = {
      $type: type,
      $value: ref ? `{${layer(ref)}.${ref.slice(2)}}` : typed,
      $extensions: { [extension]: { css: raw, resolved: value } },
    };
    tokens[key] = value;
    dsTokens.values[name] = value;
    if (layer(name) === "L1") dsTokens.semantic.push(name);
    if (type === "color" && layer(name) === "L0") dsTokens.colors.push(name);
    if (/^--(?:pv-)?(?:font|text|leading)-/.test(name) && type !== "color") dsTokens.typography.push(name);
    if (/^--space-/.test(name)) dsTokens.spacing.push(name);
    if (/^--(?:pv-)?radius-/.test(name)) dsTokens.radii.push(name);
    if (type === "shadow") dsTokens.elevation.push(name);
    if (["duration", "cubicBezier"].includes(type)) dsTokens.motion.push(name);
  }
  return { dtcg, tokens, dsTokens };
}
