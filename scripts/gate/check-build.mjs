import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { execSync } from "node:child_process";

const MAX_GZIP_KB = 150; // Teto generoso para evitar regressão de 900+ KB (SEM-747)

export async function checkMinimalBuild() {
  console.log(`▶ [3/5] Verificando build mínimo e teto de tamanho (teto: ${MAX_GZIP_KB} KB gzip)...`);

  const gateAppDir = path.resolve("gate-app");
  const distDir = path.resolve(gateAppDir, "dist");

  // Limpa build anterior se existir
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  // Executa vite build no app consumidor mínimo
  try {
    execSync("npx vite build gate-app", { stdio: "pipe" });
  } catch (error) {
    const stderr = error.stderr ? error.stderr.toString() : error.message;
    throw new Error(`Falha ao compilar app consumidor mínimo com vite: ${stderr}`);
  }

  // Localiza o bundle JS gerado
  const assetsDir = path.resolve(distDir, "assets");
  if (!fs.existsSync(assetsDir)) {
    throw new Error("Diretório de assets não foi gerado em gate-app/dist/assets.");
  }

  const files = fs.readdirSync(assetsDir);
  const jsFile = files.find((f) => f.endsWith(".js"));
  if (!jsFile) {
    throw new Error("Nenhum arquivo JS encontrado em gate-app/dist/assets.");
  }

  const jsPath = path.resolve(assetsDir, jsFile);
  const content = fs.readFileSync(jsPath);
  const gzipped = zlib.gzipSync(content);
  const rawKb = (content.length / 1024).toFixed(2);
  const gzipKb = (gzipped.length / 1024).toFixed(2);

  console.log(`  ✓ Bundle gerado: ${rawKb} KB (bruto) / ${gzipKb} KB (gzip).`);

  if (gzipped.length / 1024 > MAX_GZIP_KB) {
    throw new Error(
      `Bundle mínimo excedeu o teto de tamanho: ${gzipKb} KB gzip > ${MAX_GZIP_KB} KB. Possível regressão de tree-shaking / dependências embutidas (SEM-747).`
    );
  }
}
