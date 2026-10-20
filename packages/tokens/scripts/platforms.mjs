/**
 * Saídas de plataforma do @semec/ds-tokens, geradas pelo Style Dictionary 5
 * a partir do DTCG (o mesmo tokens.json publicado).
 *
 * - android/colors.xml e android/dimens.xml (nomes snake_case com prefixo semec_);
 * - ios/SemecTokens.swift (enum SemecTokens, membros camelCase);
 * - figma/tokens-studio.json (conjuntos L0 e L1, referências L1 → L0 preservadas).
 *
 * rem é convertido com 1rem = 16px; px vira dp (Android) ou pt (iOS) 1:1.
 */
import fs from "node:fs";
import path from "node:path";
import StyleDictionary from "style-dictionary";

export const REM = 16;
const HEADER = "Gerado de packages/react/tokens.css pelo @semec/ds-tokens (Style Dictionary 5). Não edite.";

const tokenName = (token) => token.path[token.path.length - 1];
const snake = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
const camel = (name) => name.toLowerCase().replace(/[^a-z0-9]+([a-z0-9])/g, (_, c) => c.toUpperCase());
const round = (n) => Number(n.toFixed(4));

/** {colorSpace, components, alpha} → canais 0–255 + alfa. */
export function rgba(value) {
  if (!value || value.colorSpace !== "srgb" || value.components?.length !== 3) {
    throw new Error(`Cor não suportada: ${JSON.stringify(value)}`);
  }
  const [r, g, b] = value.components.map((c) => Math.round(c * 255));
  return { r, g, b, a: value.alpha ?? 1 };
}

const hex2 = (n) => n.toString(16).padStart(2, "0").toUpperCase();

/** #RRGGBB, ou #RRGGBBAA quando há transparência (CSS / Tokens Studio). */
export function cssHex(value) {
  const { r, g, b, a } = rgba(value);
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(Math.round(a * 255)) : ""}`;
}

/** Android: #RRGGBB, ou #AARRGGBB quando há transparência. */
export function androidHex(value) {
  const { r, g, b, a } = rgba(value);
  return `#${a < 1 ? hex2(Math.round(a * 255)) : ""}${hex2(r)}${hex2(g)}${hex2(b)}`;
}

/** {value, unit} → px (rem × 16). */
export function px(value) {
  if (!value || !["px", "rem"].includes(value.unit)) throw new Error(`Dimensão não suportada: ${JSON.stringify(value)}`);
  return round(value.unit === "rem" ? value.value * REM : value.value);
}

const isFontSize = (token) => /^(pv-)?text-/.test(tokenName(token));

const hooks = {
  fileHeaders: { semec: () => [HEADER] },
  transforms: {
    "semec/name/snake": { type: "name", transform: (token) => `semec_${snake(tokenName(token))}` },
    "semec/name/camel": { type: "name", transform: (token) => camel(tokenName(token)) },
    "semec/color/android": {
      type: "value",
      filter: (token) => token.$type === "color",
      transform: (token) => androidHex(token.$value),
    },
    "semec/size/android": {
      type: "value",
      filter: (token) => token.$type === "dimension",
      transform: (token) => `${px(token.$value)}${isFontSize(token) ? "sp" : "dp"}`,
    },
  },
  formats: {
    "semec/ios-swift": ({ dictionary }) => swift(dictionary.allTokens),
    "semec/tokens-studio": ({ dictionary }) => JSON.stringify(tokensStudio(dictionary.allTokens), null, 2) + "\n",
  },
};

function swift(tokens) {
  const colors = tokens.filter((token) => token.$type === "color");
  const dimensions = tokens.filter((token) => token.$type === "dimension");
  const doc = (token) => `    /// \`--${tokenName(token)}\``;
  const channel = (n) => `${n} / 255`;
  const rgbaLine = (token) => {
    const { r, g, b, a } = rgba(token.$value);
    return `${doc(token)} (${cssHex(token.$value)})\n    public static let ${token.name} = RGBA(red: ${channel(r)}, green: ${channel(g)}, blue: ${channel(b)}, alpha: ${a})`;
  };
  return `// ${HEADER}
// Cores em sRGB (canais 0–255 / 255) e dimensões em pontos (1rem = ${REM}pt).

import Foundation
#if canImport(CoreGraphics)
import CoreGraphics
#endif
#if canImport(SwiftUI)
import SwiftUI
#endif
#if canImport(UIKit)
import UIKit
#endif

public enum SemecTokens {
  /// Cor sRGB com componentes de 0 a 1.
  public struct RGBA: Sendable, Hashable {
    public let red: Double
    public let green: Double
    public let blue: Double
    public let alpha: Double

    public init(red: Double, green: Double, blue: Double, alpha: Double) {
      self.red = red
      self.green = green
      self.blue = blue
      self.alpha = alpha
    }
  }

  /// Valores das cores (L0 e L1, já resolvidos).
  public enum ColorValues {
${colors.map(rgbaLine).join("\n")}
  }

#if canImport(SwiftUI)
  /// Cores SwiftUI.
  public enum Colors {
${colors.map((token) => `${doc(token)}\n    public static var ${token.name}: Color { ColorValues.${token.name}.color }`).join("\n")}
  }
#endif

#if canImport(UIKit)
  /// Cores UIKit.
  public enum UIColors {
${colors.map((token) => `${doc(token)}\n    public static var ${token.name}: UIColor { ColorValues.${token.name}.uiColor }`).join("\n")}
  }
#endif

  /// Dimensões em pontos: espaçamento, raios e tamanhos de texto.
  public enum Dimensions {
${dimensions.map((token) => `${doc(token)}\n    public static let ${token.name}: CGFloat = ${px(token.$value)}`).join("\n")}
  }
}

#if canImport(SwiftUI)
public extension SemecTokens.RGBA {
  var color: Color { Color(.sRGB, red: red, green: green, blue: blue, opacity: alpha) }
}
#endif

#if canImport(UIKit)
public extension SemecTokens.RGBA {
  var uiColor: UIColor { UIColor(red: red, green: green, blue: blue, alpha: alpha) }
}
#endif
`;
}

/** Tokens Studio (formato legado value/type), um conjunto por camada. */
function tokensStudio(tokens) {
  const out = { L0: {}, L1: {} };
  for (const token of tokens) {
    const [layer] = token.path;
    const name = tokenName(token);
    const original = token.original.$value;
    // Referência {L0.pv-gray-50} vira {pv-gray-50}: no Tokens Studio o caminho não inclui o conjunto.
    const ref = typeof original === "string" && /^\{[^}]+\}$/.test(original)
      ? `{${original.slice(1, -1).split(".").slice(1).join(".")}}`
      : null;
    const css = token.$extensions?.["br.gov.portovelho.semec"]?.css;
    const entry = studioEntry(token, name);
    if (!entry) continue;
    out[layer][name] = {
      value: ref ?? entry.value,
      type: entry.type,
      description: `--${name}${css ? `: ${css}` : ""}`,
    };
  }
  return { ...out, $themes: [], $metadata: { tokenSetOrder: ["L0", "L1"] } };
}

function studioEntry(token, name) {
  const value = token.$value;
  switch (token.$type) {
    case "color": return { type: "color", value: cssHex(value) };
    case "dimension": {
      const type = isFontSize(token) ? "fontSizes" : /radius/.test(name) ? "borderRadius" : "spacing";
      return { type, value: `${px(value)}px` };
    }
    case "number": return { type: "lineHeights", value: `${round(value * 100)}%` };
    case "fontWeight": return { type: "fontWeights", value: String(value) };
    case "fontFamily": return { type: "fontFamilies", value: Array.isArray(value) ? value[0] : value };
    case "shadow": return {
      type: "boxShadow",
      value: {
        x: `${px(value.offsetX)}px`, y: `${px(value.offsetY)}px`,
        blur: `${px(value.blur)}px`, spread: `${px(value.spread)}px`,
        color: cssHex(value.color), type: "dropShadow",
      },
    };
    case "duration": return { type: "other", value: `${value.value}${value.unit}` };
    case "cubicBezier": return { type: "other", value: `cubic-bezier(${value.join(", ")})` };
    default: throw new Error(`Tipo sem mapeamento no Tokens Studio: ${token.$type}`);
  }
}

export async function buildPlatforms(dtcg, dist) {
  const dir = (name) => `${path.join(dist, name).replaceAll("\\", "/")}/`;
  const sd = new StyleDictionary({
    tokens: structuredClone(dtcg),
    usesDtcg: true,
    hooks,
    log: { verbosity: "silent", warnings: "error" },
    platforms: {
      android: {
        transforms: ["semec/name/snake", "semec/color/android", "semec/size/android"],
        buildPath: dir("android"),
        files: [
          {
            destination: "colors.xml",
            format: "android/resources",
            filter: (token) => token.$type === "color",
            options: { fileHeader: "semec", outputReferences: true },
          },
          {
            destination: "dimens.xml",
            format: "android/resources",
            filter: (token) => token.$type === "dimension",
            options: { fileHeader: "semec", outputReferences: true },
          },
        ],
      },
      ios: {
        transforms: ["semec/name/camel"],
        buildPath: dir("ios"),
        files: [{ destination: "SemecTokens.swift", format: "semec/ios-swift" }],
      },
      figma: {
        transforms: [],
        buildPath: dir("figma"),
        files: [{ destination: "tokens-studio.json", format: "semec/tokens-studio" }],
      },
    },
  });
  await sd.buildAllPlatforms();
  // O template XML do Style Dictionary não termina em quebra de linha.
  for (const file of ["colors.xml", "dimens.xml"]) {
    const target = path.join(dist, "android", file);
    const xml = fs.readFileSync(target, "utf8");
    if (!xml.endsWith("\n")) fs.writeFileSync(target, `${xml}\n`);
  }
  const all = [...Object.values(dtcg.L0), ...Object.values(dtcg.L1)];
  const figma = JSON.parse(fs.readFileSync(path.join(dist, "figma", "tokens-studio.json"), "utf8"));
  return {
    colors: all.filter((token) => token.$type === "color").length,
    dimens: all.filter((token) => token.$type === "dimension").length,
    figma: Object.keys(figma.L0).length + Object.keys(figma.L1).length,
  };
}
