import fs from "node:fs";
import path from "node:path";
import { dsComponents } from "../../packages/react/manifest.js";

export async function checkExportsContract() {
  console.log("▶ [1/5] Verificando contrato de exports (manifest.js vs src/index.ts e dist)...");

  const indexPath = path.resolve("packages/react/src/index.ts");
  const indexContent = fs.readFileSync(indexPath, "utf8");

  const exportedFiles = new Set(
    indexContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("export * from"))
      .map((line) => {
        const match = line.match(/export \* from ["']\.\/(.+)["'];/);
        return match ? match[1] : null;
      })
      .filter(Boolean)
  );

  const manifestComponentFiles = new Set(
    dsComponents.map((c) =>
      c.file.replace(/^src\//, "").replace(/\.tsx?$/, "")
    )
  );

  const errors = [];

  // 1. Cada componente documentado no manifest deve existir no index.ts
  for (const compPath of manifestComponentFiles) {
    if (!exportedFiles.has(compPath)) {
      errors.push(`Componente catalogado no manifest '${compPath}' não está exportado em packages/react/src/index.ts`);
    }
  }

  // 2. Cada export de components/ no index.ts deve ter arquivo físico correspondente
  for (const exp of exportedFiles) {
    const tsxPath = path.resolve("packages/react/src", `${exp}.tsx`);
    const tsPath = path.resolve("packages/react/src", `${exp}.ts`);
    if (!fs.existsSync(tsxPath) && !fs.existsSync(tsPath)) {
      errors.push(`Arquivo exportado em src/index.ts não existe no disco: ${exp}`);
    }
  }

  // 3. Import do bundle compilado para garantir zero undefined exports
  const distPath = path.resolve("packages/react/dist/react/index.js");
  if (!fs.existsSync(distPath)) {
    errors.push(`Arquivo compilado dist/react/index.js não encontrado. Execute 'npm run build:ds' primeiro.`);
  } else {
    const distModule = await import(`file://${distPath.replace(/\\/g, "/")}`);
    const exportedKeys = Object.keys(distModule);

    if (exportedKeys.length === 0) {
      errors.push("dist/react/index.js não exporta nenhum símbolo.");
    }

    for (const [key, value] of Object.entries(distModule)) {
      if (value === undefined) {
        errors.push(`Símbolo exportado '${key}' em dist/react/index.js é undefined.`);
      }
    }
    console.log(`  ✓ ${exportedKeys.length} símbolos exportados em dist/react/index.js verificados (zero undefined).`);
  }

  if (errors.length > 0) {
    console.error("✖ Falha no contrato de exports:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    throw new Error(`Contrato de exports falhou com ${errors.length} erro(s).`);
  }

  console.log(`  ✓ Todos os ${manifestComponentFiles.size} componentes do manifest estão alinhados com src/index.ts.`);
}
