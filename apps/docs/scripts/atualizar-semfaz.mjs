// Atualiza os dados da SEMFAZ (Secretaria Municipal de Economia) usados nos
// andares do prédio da Vila: estrutura de setores, chefias, funções,
// qualificações e fotos, a partir da API pública do Portal de Serviços da
// Prefeitura de Porto Velho (a mesma da página "Equipe" da secretaria).
//
// Uso (em apps/docs):  node scripts/atualizar-semfaz.mjs
//
// Gera components/quem-somos/predio/semfaz.json e as fotos em
// public/quem-somos/semfaz/<slug>.webp. Não guarda matrícula nem ids
// internos do portal: só o que a página pública mostra.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SECRETARIA = "ZWjR7BErm0wMvbmOeYAlO1nqVyD42o";
const PORTAL = "https://servicos.portovelho.ro.gov.br";
const PAGINA = `${PORTAL}/secretaria/${SECRETARIA}/equipe`;
const API = `${PORTAL}/api/v1/publica/equipe/${SECRETARIA}`;
const FOTO_PX = 256;

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const saidaJson = join(raiz, "components/quem-somos/predio/semfaz.json");
const pastaFotos = join(raiz, "public/quem-somos/semfaz");

const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Textos do portal às vezes vêm com espaços duplos e ponto final sobrando.
const limpo = (s) => (s ? s.replace(/\s+/g, " ").trim() : null);

let sharp;
try {
  ({ default: sharp } = await import("sharp"));
} catch {
  console.error("Precisa do pacote sharp (vem com o Next.js) para converter as fotos.");
  process.exit(1);
}

const resposta = await fetch(API);
if (!resposta.ok) throw new Error(`API respondeu ${resposta.status}`);
const arvore = await resposta.json();

await mkdir(pastaFotos, { recursive: true });
const setores = [];

async function visitar(no, pai, nivel) {
  const ativos = (no.gestores ?? []).filter((g) => g.pivot?.ativo !== false && !g.pivot?.data_exoneracao);
  const g = ativos[0];
  let gestor = null;
  if (g) {
    let foto = null;
    if (g.links) {
      const img = await fetch(`${PORTAL}${g.links}`);
      if (img.ok) {
        const nome = `${slug(g.nome)}.webp`;
        const buf = Buffer.from(await img.arrayBuffer());
        await sharp(buf).resize(FOTO_PX, FOTO_PX, { fit: "cover", withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(pastaFotos, nome));
        foto = `/quem-somos/semfaz/${nome}`;
      }
    }
    gestor = {
      nome: limpo(g.nome),
      funcao: limpo(g.pivot?.funcao),
      qualificacao: limpo(g.qualificacao),
      email: limpo(g.email_institucional),
      nomeacao: g.pivot?.data_nomeacao ?? null,
      foto,
    };
  }
  setores.push({
    codigo: String(no.codigo),
    nome: limpo(no.label),
    pai,
    nivel,
    email: limpo(no.email_do_setor),
    atribuicao: limpo(no.atribuicao),
    gestor,
  });
  for (const filho of no.children ?? []) await visitar(filho, String(no.codigo), nivel + 1);
}

for (const no of arvore) await visitar(no, null, 0);

const dados = {
  fonte: PAGINA,
  atualizadoEm: new Date().toISOString().slice(0, 10),
  setores,
};
await mkdir(dirname(saidaJson), { recursive: true });
await writeFile(saidaJson, `${JSON.stringify(dados, null, 2)}\n`);
console.log(`${setores.length} setores, ${setores.filter((s) => s.gestor).length} chefias, ${setores.filter((s) => s.gestor?.foto).length} fotos.`);
