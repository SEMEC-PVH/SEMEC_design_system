// Andares do prédio da SEMFAZ (Secretaria Municipal de Economia) na Vila.
//
// Cada andar reúne uma área da secretaria; cada ZONA do andar é uma sala do
// escritório (um departamento com as divisões dele, ou uma unidade do
// gabinete). Os dados vêm de semfaz.json, gerado da API pública do Portal de
// Serviços (scripts/atualizar-semfaz.mjs). O último andar é a Galeria da
// Equipe (o museu do time do Design System, scene/museu/).

import SEMFAZ from "./semfaz.json";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const porCodigo = new Map(SEMFAZ.setores.map((s) => [s.codigo, s]));
const filhos = (codigo) => SEMFAZ.setores.filter((s) => s.pai === codigo);

// Setor e todos os descendentes, na ordem do organograma.
function comDescendentes(codigo) {
  const s = porCodigo.get(codigo);
  if (!s) return [];
  return [s, ...filhos(codigo).flatMap((f) => comDescendentes(f.codigo))];
}

// Caminho do setor até a secretaria ("Divisão X · Departamento Y · ...").
export function caminhoDoSetor(codigo) {
  const nomes = [];
  for (let s = porCodigo.get(codigo); s && s.pai; s = porCodigo.get(s.pai)) nomes.push(s.nome);
  return nomes;
}

// Pessoa de um setor, no formato do painel (QuadroMuseu): id = código do setor.
function pessoa(s) {
  const g = s.gestor;
  return {
    id: `semfaz-${s.codigo}`,
    codigo: s.codigo,
    setor: s.nome,
    nivel: s.nivel,
    nome: g.nome,
    cargo: g.funcao,
    bio: g.qualificacao,
    email: g.email ?? s.email,
    fotoUrl: g.foto ? `${basePath}${g.foto}` : null,
    caminho: caminhoDoSetor(s.codigo),
  };
}

// zona = { id, nome, codigo, pessoas: [...] } (setores sem chefia viram só
// placa: pessoas vazia, `semChefia` true).
function zona(nome, codigos) {
  const setores = codigos.flatMap(comDescendentes);
  return {
    id: `zona-${codigos[0]}`,
    nome,
    codigo: codigos[0],
    pessoas: setores.filter((s) => s.gestor).map(pessoa),
    semChefia: setores.filter((s) => !s.gestor).map((s) => s.nome),
  };
}

const exec = (codigo) => porCodigo.get(codigo)?.nome ?? codigo;
// Só a chefia de um setor (sem os descendentes).
function soChefia(codigo) {
  const s = porCodigo.get(codigo);
  return { id: `zona-${codigo}`, nome: s.nome, codigo, pessoas: s.gestor ? [pessoa(s)] : [], semChefia: [] };
}
// Secretaria executiva: a chefia numa zona e cada departamento (com as
// divisões) em outra.
const areaExecutiva = (codigo) => [soChefia(codigo), ...filhos(codigo).map((f) => zona(f.nome, [f.codigo]))];

// Ordem de baixo para cima. `cor`: token --pv-* de destaque do andar.
export const ANDARES = [
  {
    id: "terreo",
    numero: 0,
    rotulo: "Térreo",
    nome: "Gabinete",
    cor: "blue-700",
    recepcao: true, // porta para a rua e balcão de recepção
    zonas: [
      { ...soChefia("6"), nome: "Gabinete do Secretário" },
      soChefia("6.1"),
      soChefia("6.1.10"),
      zona("Assessoria Técnica (ASTEC)", ["6.1.1"]),
      zona("Assessoria de Controle Interno", ["6.1.13"]),
      zona("Conselho de Recursos Fiscais", ["6.1.8"]),
      zona(exec("6.1.3"), ["6.1.3"]),
    ],
  },
  { id: "receita", numero: 1, rotulo: "1º andar", nome: "Receita Municipal", cor: "green-700", zonas: areaExecutiva("6.1.5") },
  { id: "financas", numero: 2, rotulo: "2º andar", nome: "Finanças e Contabilidade", cor: "yellow-800", zonas: areaExecutiva("6.1.4") },
  { id: "orcamento", numero: 3, rotulo: "3º andar", nome: "Orçamento", cor: "red-700", zonas: areaExecutiva("6.1.12") },
  { id: "planejamento", numero: 4, rotulo: "4º andar", nome: "Planejamento", cor: "blue-600", zonas: areaExecutiva("6.1.9") },
  {
    id: "tecnologia",
    numero: 5,
    rotulo: "5º andar",
    nome: "Tecnologia e Administração",
    cor: "gray-700",
    // Sem ilha de gabinete: o centro é da Central de Operações (tema). A
    // ordem leva cada departamento à sua faixa (escritorio.js, PRIORIDADE):
    // Inovação no norte-oeste, Sistemas no norte-leste, Administrativo no
    // oeste e Tecnologia no leste, junto dos racks e da bancada de IoT.
    semIlha: true,
    zonas: [
      zona(exec("6.1.2"), ["6.1.2"]),
      zona(exec("6.1.11"), ["6.1.11"]),
      zona(exec("6.1.7"), ["6.1.7"]),
      zona(exec("6.1.6"), ["6.1.6"]),
    ],
  },
  { id: "galeria", numero: 6, rotulo: "6º andar", nome: "Galeria da Equipe", cor: "yellow-500", galeria: true, zonas: [] },
];

export const FONTE_SEMFAZ = { url: SEMFAZ.fonte, atualizadoEm: SEMFAZ.atualizadoEm };
export const andarPorId = (id) => ANDARES.find((a) => a.id === id) ?? null;
// Todas as pessoas dos escritórios (para o painel achar pelo id).
export const PESSOAS_SEMFAZ = ANDARES.flatMap((a) => a.zonas.flatMap((z) => z.pessoas));
