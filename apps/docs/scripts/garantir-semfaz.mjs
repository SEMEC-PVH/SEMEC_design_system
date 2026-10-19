// Garante o components/quem-somos/predio/semfaz.json antes do dev/build.
// Os dados reais da SEMFAZ (nomes, qualificações e fotos de servidores)
// não vão para o git, porque o repositório é público. Quem não rodou
// scripts/atualizar-semfaz.mjs recebe uma cópia do semfaz.exemplo.json,
// com a mesma estrutura de setores e chefias fictícias.
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pasta = join(dirname(fileURLToPath(import.meta.url)), "../components/quem-somos/predio");
const real = join(pasta, "semfaz.json");

if (!existsSync(real)) {
  copyFileSync(join(pasta, "semfaz.exemplo.json"), real);
  console.log("garantir-semfaz: semfaz.json criado a partir do exemplo (dados fictícios).");
}
