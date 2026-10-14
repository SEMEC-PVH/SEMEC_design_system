import fs from "node:fs";
import path from "node:path";

export async function checkTokens() {
  console.log("▶ [2/5] Verificando integridade dos tokens CSS e @theme...");

  const tokensPath = path.resolve("packages/react/tokens.css");
  if (!fs.existsSync(tokensPath)) {
    throw new Error("Arquivo packages/react/tokens.css não encontrado.");
  }

  const tokensCss = fs.readFileSync(tokensPath, "utf8");

  // Coleta todas as variáveis CSS definidas em :root
  const definedVars = new Set();
  const rootVarMatches = tokensCss.matchAll(/--([a-zA-Z0-9_-]+)\s*:/g);
  for (const match of rootVarMatches) {
    definedVars.add(`--${match[1]}`);
  }

  // Coleta todas as variáveis usadas via var(--...) dentro de tokens.css
  const errors = [];
  const usedVarMatches = tokensCss.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g);
  for (const match of usedVarMatches) {
    const varName = match[1];
    // Variáveis que começam com --tw- ou --radix- são providas em runtime/dinâmicas
    if (varName.startsWith("--tw-") || varName.startsWith("--radix-") || varName === "--spacing") {
      continue;
    }
    if (!definedVars.has(varName)) {
      errors.push(`tokens.css usa var(${varName}), mas ${varName} não está declarada no :root ou @theme`);
    }
  }

  // Verifica que tokens críticos de bugs passados (SEM-743, SEM-781, etc.) estão no @theme inline
  const requiredThemeProps = [
    "--color-background",
    "--color-foreground",
    "--color-surface",
    "--color-surface-alt",
    "--color-border",
    "--color-border-strong",
    "--color-primary",
    "--color-destructive",
    "--color-destructive-surface",
    "--color-primary-hover",
    "--color-primary-active",
    "--color-success",
    "--color-warning",
    "--color-info",
    "--color-sidebar",
    "--shadow-elevation-1",
    "--shadow-elevation-2",
    "--shadow-elevation-3",
    "--radius-md",
  ];

  for (const prop of requiredThemeProps) {
    if (!tokensCss.includes(prop)) {
      errors.push(`@theme em tokens.css está faltando a declaração obrigatória: ${prop}`);
    }
  }

  // Verifica se border-color padrão está presente no @layer base (correção SEM-781)
  if (!tokensCss.includes("@layer base") || !tokensCss.includes("border-color")) {
    errors.push("tokens.css está faltando a definição de border-color padrão em @layer base (regressão SEM-781)");
  }

  // Verifica se prefers-reduced-motion está presente (correção SEM-784)
  if (!tokensCss.includes("prefers-reduced-motion")) {
    errors.push("tokens.css não contém regra para prefers-reduced-motion (regressão SEM-784)");
  }

  if (errors.length > 0) {
    console.error("✖ Falha na validação de tokens CSS:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    throw new Error(`Validação de tokens falhou com ${errors.length} erro(s).`);
  }

  console.log(`  ✓ ${definedVars.size} variáveis CSS e propriedades @theme validadas com sucesso.`);
}
