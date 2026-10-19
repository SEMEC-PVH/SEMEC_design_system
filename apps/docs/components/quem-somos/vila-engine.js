// Vila SEMEC — motor 3D da página Quem Somos.
//
// three.js puro, sem React: o componente VilaSemec importa este módulo
// sob demanda (import dinâmico), então o three não entra no bundle das
// outras páginas. As cores vêm dos tokens `--pv-*` lidos do CSS em tempo
// de execução — nenhum hex no código.
//
// Mapa em grade (estilo RPG clássico): cada tile tem 1 unidade. O jogador
// anda de tile em tile; árvores, água, casas, placas e pessoas bloqueiam.

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { std } from "./buildings/shared";
import { buildBackEnd } from "./buildings/backend";
import { buildDatabase } from "./buildings/database";
import { buildML } from "./buildings/ml";
import { createChibiKit } from "./scene/chibi";
import { buildSemec } from "./buildings/semec";
import { createLighting } from "./scene/lighting";
import { buildFences, buildSigns, buildStreetProps, LAMP_SOUTH_OFFSET } from "./scene/props";
import { createDayNight, formatClock } from "./scene/daynight";
import { createNightLights } from "./scene/nightlights";
import { createCutscene } from "./scene/cutscene";
import { createPedro } from "./scene/pedro";
import { createVinicius } from "./scene/vinicius";
import { createOcarinaHideout, createQuestMarker } from "./scene/quest";
import { createColetaveis } from "./scene/coleta";
import { createHistoria } from "./scene/historia";
import { createSentado } from "./scene/sentar";
import { urlInsignia } from "./insignias";
import { QUESTS_COLETA, localDoItem } from "./quests-coleta";
import { createEpocas } from "./scene/epocas";
import { createWalkers, WALKER_IDS } from "./scene/walkers";
import { buildVegetation } from "./scene/vegetation";
import { buildGround } from "./scene/ground";
import { areaOf } from "./areas";
import { ehLeve, arquivoLeve } from "./scene/qualidade";
import { createMuseu } from "./scene/museu";
import { createEscritorio } from "./predio/escritorio";
import { createPista } from "./scene/pista";
import { ANDARES, andarPorId } from "./predio/andares";

const W = 30;
const H = 24;

const GRASS = 0;
const PATH = 1;
const WATER = 2;
const TALL = 3;
const FLOWER = 4;
const TREE = 5;
const FENCE = 6;
const BUILDING = 7;
const SIGN = 8;
const PROP = 9; // mobiliário urbano (poste, banco, lixeira, bicicletário)

const WALKABLE = new Set([GRASS, PATH, TALL, FLOWER]);

const DIRS = {
  up: { dx: 0, dy: -1, rot: Math.PI },
  down: { dx: 0, dy: 1, rot: 0 },
  left: { dx: -1, dy: 0, rot: -Math.PI / 2 },
  right: { dx: 1, dy: 0, rot: Math.PI / 2 },
};
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };

const STEP_WALK = 0.26;
const STEP_RUN = 0.15;
// Bicicleta (tecla B): passo mais curto e uma volta do pedivela (o clipe
// `pedalando`) a cada BIKE_TILES_POR_VOLTA tiles. Sinais do giro de rodas e
// pedivela em X local (nós da bicicleta dentro do GLB do jogador).
const STEP_BIKE = 0.11;
// Onde se conquista a bicicleta (um dos bicicletários de PROPS).
const BICICLETARIO = { x: 18, y: 15 };
const BIKE_TILES_POR_VOLTA = 3;
const RODA_SINAL = 1;
const PEDIVELA_SINAL = 1;
// Giro a pé: o yaw visual persegue o lógico (player.dir) por amortecimento
// exponencial; 16/s fecha ~95% de 90° em 0,2 s. Também é ele que alinha o
// jogador ao cardinal depois de descer da bicicleta.
const GIRO_TAXA = 16;
// Teto da velocidade angular do giro amortecido (rad/s): sem ele o 1º quadro
// de uma meia-volta já cobriria metade dela (num PC lento, um estalo). Com
// 11 rad/s, 90° levam ~0,2 s e 180° ~0,32 s.
const GIRO_MAX = 11;
// Montado, a bicicleta anda em direção livre (ver "Direção livre"): posição
// contínua e um rumo (yaw) contínuo; a grade só é consultada para colisão e
// para dizer em que tile o jogador está.
// Inclinação (roll) para dentro da curva: tan(roll) ≈ v·ω/g, aqui linear
// em velocidade (tiles/s) × velocidade angular do rumo (rad/s); ~17° no
// máximo. Na velocidade máxima, virando a 2,6 rad/s, dá ~0,3 (satura).
const INCLINA_MAX = 0.3;
const INCLINA_K = 0.0125;
const INCLINA_TAXA = 10;
// Guidão (nó `Garfo`, Y local, + = esquerda do ciclista) e o peso das clips
// `pedalando_esq`/`pedalando_dir`: pela velocidade angular do rumo (o
// esterço). Devagar o rumo gira mais rápido, então o guidão vira mais.
const GUIDAO_MAX = 0.35;
const GUIDAO_K = 0.09;
const GUIDAO_TAXA = 12;
// Embalo: de parado à velocidade máxima em ~0,3 s (aceleração constante);
// sem setas, roda livre e freio: da máxima a parado em ~0,4 s.
const BIKE_EMBALO = 0.3;
const BIKE_FREIO = 0.4;
// Velocidade máxima: a mesma da bicicleta na grade (1 tile a cada STEP_BIKE,
// ~9,1 tiles/s), para a pista e as medalhas continuarem na mesma escala.
const BIKE_VMAX = 1 / STEP_BIKE;
// Taxa de giro do rumo (rad/s): parado/devagar vira rápido, na máxima vira
// devagar (raio ~3,5 tiles: curvas abertas; para fechar mais, solte a seta
// e deixe a bicicleta perder embalo).
const BIKE_GIRO_LENTO = 4.5;
const BIKE_GIRO_RAPIDO = 2.6;
// Alvo mais de ~120° fora do rumo (seta contrária): não gira no lugar, freia
// até 35% da máxima e faz um U largo.
const BIKE_U = 2.1;
const BIKE_U_VEL = 0.35;
// Colisão: círculo contra os tiles não andáveis, com subpassos de no máximo
// 0,2 tile (nenhum tile atravessado fica sem ser visto). Batendo na parede a
// bicicleta perde embalo (de frente; raspando de lado, pouco) e desliza junto.
const BIKE_RAIO = 0.28;
const BIKE_SUBPASSO = 0.2;
const BIKE_ATRITO_PAREDE = 20;
const BIKE_RASPA = 0.4;
// Toque curto numa seta (api.press e solta antes do quadro seguinte): vale
// como segurada por esse tempo (vira ~40° ou anda ~0,7 tile).
const BIKE_TOQUE = 0.15;
// Descendo: o jogador assenta no centro do tile a essa velocidade (tiles/s).
const BIKE_ASSENTA_VEL = 3;
// Crossfade para `bike_parado` (pé no chão) ao parar, e de volta ao sair.
const BIKE_PARADO_ENTRA = 6;
const BIKE_PARADO_SAI = 14;
// Parado, o pedivela vai estacionar no ângulo da `bike_parado` a pelo menos
// 35% da cadência cheia (meia volta, o pior caso, em ~0,45 s).
const BIKE_ESTACIONA = 0.35;
// Ciclo da clip `andando` = 2 passos ≈ 0,68 m na escala do modelo.
const WALK_CYCLE_STRIDE = 0.68;
// Teto de aceleração da clip: acima disso a perna vira borrão (o pé desliza um pouco).
const WALK_MAX_TIMESCALE = 2.6;
// Andando sozinho (porta, elevador) por menos de 1 s: um pouco mais rápido,
// ainda com o pé no chão (clip ≈ 0,58 m/s em 1x).
const WALK_AUTO_TIMESCALE = 3;
const TURN_LOCK = 0.09;
const IDLE_BEFORE_CODING = 2.2;
// Distância da câmera no modo vitrine (tela de título).
const ATTRACT_ZOOM = 1.75;
// Zoom do jogador (roda do mouse, + e -): multiplica a distância da câmera.
const ZOOM_MIN = 0.55;
const ZOOM_MAX = 1.6;

const BUILDINGS = [
  { id: "semec", kind: "semec", x: 3, y: 3, w: 6, h: 4, label: "SEMFAZ" },
  // Bairro de tecnologia: Front-End e Back-End lado a lado ao sul da rua
  // principal. O Banco de Dados (torre alta) fica ao norte, encostado na
  // floresta: prédio alto com chão andável atrás esconde o jogador da câmera.
  { id: "frontend", kind: "frontend", x: 16, y: 11, w: 5, h: 4, label: "FRONT-END" },
  { id: "backend", kind: "backend", x: 22, y: 11, w: 5, h: 4, label: "BACK-END" },
  { id: "database", kind: "database", x: 11, y: 2, w: 4, h: 4, label: "BANCO DE DADOS" },
  // Laboratório de Machine Learning (4º ginásio, da Mariana), na beira do
  // rio, ao lado do Banco de Dados; árvores atrás pelo mesmo motivo.
  { id: "ml", kind: "ml", x: 16, y: 3, w: 4, h: 3, label: "MACHINE LEARNING" },
];

const SIGNS = [
  { id: "boas-vindas", x: 16, y: 20 },
  { id: "diretoria", x: 3, y: 7 },
  { id: "rio", x: 19, y: 7 },
  { id: "front-end", x: 20, y: 15 },
  { id: "back-end", x: 26, y: 15 },
  { id: "banco-de-dados", x: 15, y: 7 },
  { id: "machine-learning", x: 16, y: 6 },
];

// Mobiliário urbano (scene/props.js): cada item ocupa um tile PROP, não
// andável. Nunca sobre caminho nem na frente de porta, placa ou NPC.
// dir = para onde o banco "olha".
const PROPS = [
  { kind: "lamp", x: 5, y: 9 },
  { kind: "lamp", x: 10, y: 9 },
  { kind: "lamp", x: 17, y: 7 },
  { kind: "lamp", x: 24, y: 7 },
  { kind: "lamp", x: 13, y: 13 },
  { kind: "lamp", x: 13, y: 17 },
  { kind: "lamp", x: 16, y: 17 },
  { kind: "lamp", x: 21, y: 17 },
  { kind: "lamp", x: 27, y: 17 },
  { kind: "planter", x: 13, y: 9 },
  { kind: "bin", x: 13, y: 10 },
  { kind: "bench", x: 13, y: 11, dir: "right" },
  { kind: "planter", x: 13, y: 15 },
  { kind: "bench", x: 16, y: 18, dir: "left" },
  { kind: "bin", x: 16, y: 19 },
  { kind: "bench", x: 25, y: 17, dir: "down" },
  { kind: "bin", x: 26, y: 17 },
  { kind: "bikes", x: 18, y: 15 },
  { kind: "bikes", x: 24, y: 15 },
];

// Diretoria na porta da SEMEC; estagiários na frente do prédio da sua área
// (pelo cargo). Quem não casar com nenhuma área usa um ponto genérico.
// O Pedro (3D, quest da ocarina) fica à esquerda da porta, em QUEST_SPOT.
const DIRECTOR_SPOTS = [
  { x: 7, y: 7, dir: "down" },
  { x: 10, y: 6, dir: "down" },
  { x: 4, y: 7, dir: "down" },
];
const QUEST_SPOT = { x: 5, y: 7, dir: "down" };
// Onde a ocarina do Pedro caiu: mato alto do parque a sudeste, longe da SEMEC.
const OCARINA_SPOT = { x: 25, y: 19 };
// Distância (em tiles) em que o painel da quest aparece ao chegar perto do Pedro.
const QUEST_NEAR = 3;
// Cena da ocarina, futuro "festa": onde o time se junta, em volta da estátua
// do Design System (scene/epocas.js, tile 7,10).
const FESTA_SPOTS = [
  [6, 9], [8, 9], [6, 11], [8, 11], [4, 10], [9, 10], [3, 9], [9, 9],
];
// Roda de história do Zé Carlos (cenas.js, cenaHistoria): fogueira no canto
// entre os tiles (6,11)–(7,12), no gramado livre ao lado do passeio dele (sem
// flores dentro da roda); o acampamento e os assentos ficam em
// scene/historia.js.
const FOGO_TILE = [6, 11];
// Aprendizes do Laboratório de ML (batalha/dados.js, TREINADORES): eram
// chibis de jaleco na frente do laboratório, com batalhas opcionais antes da
// Mariana. Saíram do mapa a pedido (só ficam bonecos de gente do time, em 3D);
// os dados e as batalhas continuam em dados.js, para voltarem com um boneco
// próprio: { id: "aprendiz-numpy", x: 16, y: 7, dir: "down" },
// { id: "aprendiz-seaborn", x: 21, y: 6, dir: "left" }.
const TREINADORES_VILA = [];
const AREA_SPOTS = {
  frontend: [
    { x: 16, y: 15, dir: "down" },
    { x: 19, y: 15, dir: "down" },
    { x: 21, y: 13, dir: "left" },
  ],
  backend: [
    { x: 22, y: 15, dir: "down" },
    { x: 25, y: 15, dir: "down" },
    { x: 27, y: 13, dir: "left" },
  ],
  database: [
    { x: 11, y: 6, dir: "down" },
    { x: 15, y: 5, dir: "left" },
    { x: 10, y: 4, dir: "right" },
  ],
  // Porta do laboratório de Machine Learning (4º ginásio).
  ml: [{ x: 18, y: 6, dir: "down" }],
  generic: [
    { x: 21, y: 7, dir: "up" },
    { x: 11, y: 20, dir: "right" },
    { x: 6, y: 12, dir: "down" },
    { x: 23, y: 19, dir: "up" },
  ],
};

const START = { x: 14, y: 20, dir: "up" };

// Prédio da SEMFAZ: a porta fica no alto da escada, no tile (6,6); quem sobe
// de (6,7) entra no térreo. Cada andar (predio/andares.js) tem cena própria.
const SEMEC_PORTA = { x: 6, y: 6 };
const SEMEC_FRENTE = { x: 6, y: 7 };
// Transição de entrada/saída: anda até a porta enquanto a íris fecha, troca
// de cena no escuro e entra andando enquanto ela abre (a íris é da interface,
// com as mesmas durações: .vila-iris no globals.css).
const TRANSICAO = { fechar: 0.7, escuro: 0.3, abrir: 0.7 };
const TRANSICAO_RAPIDA = { fechar: 0.2, escuro: 0.1, abrir: 0.2 };
// Elevador, em etapas (segundos), toda no 3D. Ida, no andar de origem: o
// display pisca chamando, "ding" e as portas abrem, o jogador entra andando
// na cabine, vira de frente e as portas fecham com a câmera chegando perto;
// na partida a câmera desliza na vertical no sentido da viagem (sobe ao
// subir) e a tela escurece (.vila-elevador no globals.css: só uma cor
// sólida, ELEVADOR_ESCURECER) enquanto o display conta os andares. A cena
// troca no escuro. Volta, no destino: a câmera chega do sentido oposto e
// assenta com a tela clareando, o display termina a contagem, "ding", as
// portas abrem e ele sai andando de frente (tracarSaida); as portas fecham
// atrás assim que ele passa do vão, e o controle volta quando ele para.
// Duração 0 em "entrar"/"sair": pela distância, no passo de ELEVADOR_VEL;
// em "partir"/"chegar": por andares (deslizeDoElevador). As
// portas levam ELEVADOR_PORTA para abrir: "abrir" é só a espera até o
// jogador começar a andar. Na chegada, ela dura até o vão passar de ~80%
// (ele arranca devagar e cruza a porta já toda aberta).
const ELEVADOR_IDA = [
  ["chamar", 0.2],
  ["abrir", 0.24],
  ["entrar", 0],
  ["virar", 0.28],
  ["fechar", 0.34],
  ["partir", 0],
];
const ELEVADOR_VOLTA = [
  ["chegar", 0],
  ["ding", 0.1],
  ["abrir", 0.3],
  ["sair", 0],
];
const ELEVADOR_PORTA = 0.42;
// Movimento reduzido: sem pisca, sem giro animado, sem deslize nem
// contagem: um corte curto no escuro.
const ELEVADOR_IDA_RAPIDA = [
  ["chamar", 0],
  ["abrir", 0.12],
  ["entrar", 0.2],
  ["virar", 0],
  ["fechar", 0.12],
  ["partir", 0.1],
];
const ELEVADOR_VOLTA_RAPIDA = [
  ["chegar", 0.08],
  ["ding", 0],
  ["abrir", 0.12],
  ["sair", 0.2],
];
const ELEVADOR_FECHA_ATRAS = 0.55;
// Passo de quem entra/sai da cabine (m/s): a clip de caminhada acompanha
// (walkTimeScale, até WALK_AUTO_TIMESCALE), sem o pé deslizar.
const ELEVADOR_VEL = 1.75;
// Saída da cabine: arranque e parada (s) com a velocidade subindo e
// descendo em cosseno (a clip acompanha, sem o pé deslizar); as portas
// fecham atrás quando ele passa ELEVADOR_VAO_LIVRE (m) à frente da cabine.
const SAIDA_RAMPA = 0.3;
const ELEVADOR_VAO_LIVRE = 0.95;
// Pré-carregamento do andar de destino durante a viagem: espera pelos GLBs
// (ms, desde o clique), orçamento por quadro para subir texturas (ms) e o
// máximo (s) que a troca espera no escuro pelo destino pronto.
const PREPARO_CARGAS_MAX = 2500;
const PREPARO_TEXTURAS_MS = 6;
const PREPARO_ESPERA_MAX = 1.6;
// Escurecer da tela (igual ao .vila-elevador[data-fase="fechar"]) e o
// instante parado no escuro antes de trocar de cena.
const ELEVADOR_ESCURECER = 0.24;
const ELEVADOR_ESCURO = 0.06;
// Clarear no destino (.vila-elevador[data-fase="abrir"]) cabe em "chegar".
const ELEVADOR_CLAREAR = 0.3;
// Deslize vertical da câmera (unidades do mundo) e a duração da partida e
// da chegada: um pouco mais por andar, até +0,35 s em cada.
const ELEVADOR_DESLIZE = 1.1;
const deslizeDoElevador = (andares) => {
  const extra = Math.min(0.35, 0.07 * Math.max(0, andares - 1));
  return { partir: 0.12 + ELEVADOR_ESCURECER + ELEVADOR_ESCURO + extra, chegar: ELEVADOR_CLAREAR + 0.06 + extra };
};
// Câmera mais perto (fração da distância normal) com o jogador na cabine.
const ELEVADOR_ZOOM = 0.62;
// Câmera dentro do prédio: a mesma distância da Vila.
const MUSEU_ZOOM = 1;
// Corrida na pista (scene/pista): contagem de 3 bipes, 1 s cada, e o verde.
const CORRIDA_BIPE = 1;
const CORRIDA_CONTAGEM = 3;
// Câmera na pista: mais afastada (o `zoom` da pista, ou PISTA_ZOOM) e
// adiantada na direção do movimento (a bicicleta anda ~9 tiles/s: sem isso
// a curva chega antes de aparecer). PISTA_FRENTE_S: quantos segundos de velocidade ela adianta,
// até PISTA_FRENTE_MAX tiles; PISTA_FRENTE_TAXA amortece a direção (1/s),
// devagar o bastante para não sacudir nas curvas.
const PISTA_ZOOM = 1.3;
const PISTA_FRENTE_S = 0.28;
const PISTA_FRENTE_MAX = 2.2;
const PISTA_FRENTE_TAXA = 2.5;
// Volta da pista para a Vila: ao lado do bicicletário, de frente para ele
// (o 1º tile andável na ordem; a calçada ao sul vem primeiro).
const VOLTA_DA_PISTA = [
  { dx: 0, dy: 1, dir: "up" },
  { dx: -1, dy: 0, dir: "right" },
  { dx: 1, dy: 0, dir: "left" },
  { dx: 0, dy: -1, dir: "down" },
];

function buildMap() {
  const g = Array.from({ length: H }, () => Array(W).fill(GRASS));
  const rect = (x0, y0, x1, y1, t) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = t;
  };

  // Borda de floresta.
  rect(0, 0, W - 1, 1, TREE);
  rect(0, H - 2, W - 1, H - 1, TREE);
  rect(0, 0, 1, H - 1, TREE);
  rect(W - 2, 0, W - 1, H - 1, TREE);

  // Rio Madeira (lago com cantos arredondados).
  rect(20, 2, 27, 6, WATER);
  for (const [x, y] of [[20, 2], [20, 6], [27, 6], [21, 6]]) g[y][x] = GRASS;

  // Mato alto, flores e árvores soltas.
  rect(16, 2, 19, 2, TREE); // atrás do laboratório de ML (x16–19, y3–5)
  // Praça do Front-End (x 17–20, y 17–20): grama baixa para o Rafa e o waffle
  // passearem sem o capim esconder os dois (scene/walkers.js).
  for (const [x, y] of [[18, 18], [19, 19]]) g[y][x] = FLOWER;
  rect(2, 10, 4, 13, TALL);
  for (const [x, y] of [[12, 18], [13, 19], [8, 10], [9, 11], [25, 9], [26, 9], [3, 20], [4, 20]]) g[y][x] = FLOWER;
  for (const [x, y] of [[11, 10], [12, 12], [25, 8], [27, 19], [2, 18], [2, 19], [27, 10], [8, 2], [9, 2], [16, 8]]) g[y][x] = TREE;

  // Jardim cercado com flores.
  rect(4, 15, 9, 20, FLOWER);
  rect(3, 14, 10, 14, FENCE);
  rect(3, 21, 10, 21, FENCE);
  rect(3, 14, 3, 21, FENCE);
  rect(10, 14, 10, 21, FENCE);
  g[16][10] = PATH; // portão
  rect(5, 16, 8, 19, GRASS);
  for (const [x, y] of [[6, 17], [7, 18]]) g[y][x] = FLOWER;

  // Caminhos.
  rect(3, 8, 26, 8, PATH);
  rect(6, 7, 6, 7, PATH);
  rect(14, 8, 15, 21, PATH);
  rect(11, 16, 26, 16, PATH);
  rect(17, 15, 17, 15, PATH); // porta do Front-End
  rect(23, 15, 23, 15, PATH); // porta do Back-End (entrada à esquerda do centro)
  rect(12, 6, 13, 7, PATH); // portão do Banco de Dados
  // Parque no canto sudeste.
  rect(22, 18, 26, 20, TALL);
  for (const [x, y] of [[22, 17], [23, 17], [24, 17], [21, 20]]) g[y][x] = FLOWER;
  // Árvores atrás do Front-End e do Back-End: ali o jogador sumiria atrás
  // dos prédios na câmera alta.
  rect(16, 9, 27, 10, TREE);
  // Idem atrás da torre de vidro da SEMEC (buildings/semec.js).
  rect(3, 2, 7, 2, TREE);

  for (const b of BUILDINGS) rect(b.x, b.y, b.x + b.w - 1, b.y + b.h - 1, BUILDING);
  for (const s of SIGNS) g[s.y][s.x] = SIGN;
  for (const p of PROPS) g[p.y][p.x] = PROP;
  return g;
}

// PRNG determinístico: a vila é sempre igual.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const pv = (name) => {
    const v = cs.getPropertyValue(`--pv-${name}`).trim();
    return v ? new THREE.Color(v) : new THREE.Color().setHSL(0, 0, 0.5);
  };
  const mix = (a, b, t) => a.clone().lerp(b, t);
  const white = pv("white");
  const p = {
    white,
    black: pv("black"),
    leaves: pv("green-700"),
    woodLight: mix(pv("yellow-800"), pv("yellow-400"), 0.35),
    wall: pv("gray-50"),
    marker: pv("yellow-500"),
    markerLeader: pv("blue-600"),
    markerDone: pv("green-600"),
    skin: mix(mix(pv("yellow-400"), pv("red-200"), 0.55), white, 0.25),
    hair: mix(pv("gray-900"), pv("yellow-800"), 0.45),
    eye: pv("gray-950"),
    pants: pv("gray-700"),
    shirtsDirectors: [pv("blue-700"), pv("blue-900"), pv("blue-600")],
    shirtsInterns: [pv("green-600"), pv("red-600"), pv("yellow-500"), pv("blue-500"), pv("gray-600"), pv("red-400")],
    // Prédio Front-End (referência: estúdio de vidro com acento azul-marinho).
    navy: pv("blue-900"),
    slabTop: pv("gray-200"),
    interior: mix(pv("yellow-400"), white, 0.5),
    interiorFloor: mix(mix(pv("yellow-400"), pv("yellow-800"), 0.25), white, 0.45),
    glass: mix(pv("blue-200"), white, 0.2),
    lamp: mix(pv("yellow-400"), white, 0.85),
    gravel: pv("gray-300"),
    screen: pv("blue-600"),
    screenAccent: [pv("blue-300"), pv("yellow-500"), pv("green-500"), white],
    font: getComputedStyle(document.body).fontFamily || "sans-serif",
    pv,
    mix,
  };
  return p;
}

const tileToWorld = (x, y) => new THREE.Vector3(x - W / 2 + 0.5, 0, y - H / 2 + 0.5);

function makeLabelTexture(text, bg, fg, font) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg.getStyle();
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 24);
  ctx.fill();
  ctx.fillStyle = fg.getStyle();
  // Reduz a fonte até o texto caber (rótulos longos, ex.: "BANCO DE DADOS").
  let size = 64;
  do {
    ctx.font = `700 ${size}px ${font}`;
    size -= 2;
  } while (ctx.measureText(text).width > 456 && size > 24);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 68);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function shadowed(obj) {
  obj.traverse((o) => {
    if (o.isMesh && !o.userData.noShadow) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return obj;
}

// Tela de computador: barra de título + blocos de interface.
function makeScreenTexture(pal, seed) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 80;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = pal.screen.getStyle();
  ctx.fillRect(0, 0, 128, 80);
  ctx.fillStyle = pal.white.getStyle();
  ctx.fillRect(0, 0, 128, 12);
  const blocks = [
    [8, 20, 52, 22],
    [66, 20, 54, 22],
    [8, 48, 34, 24],
    [48, 48, 34, 24],
    [88, 48, 32, 24],
  ];
  blocks.forEach(([x, y, w, h], i) => {
    ctx.fillStyle = pal.screenAccent[(i + seed) % pal.screenAccent.length].getStyle();
    ctx.fillRect(x, y, w, h);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Prédio Front-End: volume superior em balanço com vidro contornando a
// quina, lâmina azul-marinho na lateral, marquise sobre a entrada e
// interior iluminado (mesas e monitores) visível pelo vidro.
// Coordenadas locais: centro do footprint na origem, fachada em +z.
function buildFrontEnd(group, b, { pal, track, unitBox, lite }) {
  const hw = b.w / 2 - 0.05;
  const hd = b.h / 2 - 0.05;
  const mats = {
    white: track(std(pal.wall)),
    slabTop: track(std(pal.slabTop)),
    navy: track(std(pal.navy)),
    interior: track(std(pal.interior, { emissive: pal.interior, emissiveIntensity: 0.45 })),
    floor: track(std(pal.interiorFloor, { emissive: pal.interiorFloor, emissiveIntensity: 0.35 })),
    glass: track(std(pal.glass, { roughness: 0.08, transparent: true, opacity: 0.2, depthWrite: false })),
    lampHousing: track(std(pal.slabTop, { roughness: 0.5 })),
    mullion: track(std(pal.white, { roughness: 0.4 })),
    lamp: track(new THREE.MeshBasicMaterial({ color: pal.lamp })),
    gravel: track(std(pal.gravel)),
    leaves: track(std(pal.leaves, { flatShading: true })),
    bezel: track(std(pal.eye, { roughness: 0.4 })),
    shelf: track(std(pal.woodLight)),
  };

  // Caixa a partir dos limites (x0..x1, y0..y1, z0..z1).
  const box = (mat, x0, x1, y0, y1, z0, z1, opts = {}) => {
    const m = new THREE.Mesh(unitBox, mat);
    m.scale.set(x1 - x0, y1 - y0, z1 - z0);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    if (opts.noShadow) m.userData.noShadow = true;
    group.add(m);
    return m;
  };

  // Vidro com caixilhos verticais finos (ao longo de x ou de z).
  const glazing = (axis, from, to, fixed, y0, y1, spacing) => {
    const t = 0.02;
    if (axis === "x") box(mats.glass, from, to, y0, y1, fixed - t, fixed + t, { noShadow: true });
    else box(mats.glass, fixed - t, fixed + t, y0, y1, from, to, { noShadow: true });
    const n = Math.max(1, Math.round((to - from) / spacing));
    for (let i = 0; i <= n; i++) {
      const p = from + ((to - from) * i) / n;
      if (axis === "x") box(mats.mullion, p - 0.02, p + 0.02, y0, y1, fixed - 0.03, fixed + 0.03);
      else box(mats.mullion, fixed - 0.03, fixed + 0.03, y0, y1, p - 0.02, p + 0.02);
    }
  };

  const groundTop = 1.0;
  const slabTop = 1.28;
  const roofBottom = 2.25;
  const roofTop = 2.43;
  const bladeX0 = hw - 0.5;
  // Balanço discreto: com a câmera alta, um recuo grande esconderia o térreo.
  const upperFront = hd - 0.2; // fachada de vidro do andar de cima
  const groundFront = upperFront - 0.18; // fachada do térreo, levemente recuada

  // ---- Térreo ------------------------------------------------------------------
  box(mats.white, -hw + 0.1, bladeX0, 0, groundTop, -hd + 0.1, groundFront - 1.05); // bloco dos fundos
  box(mats.floor, -hw + 0.1, bladeX0, 0, 0.04, groundFront - 1.05, groundFront); // piso
  box(mats.interior, -hw + 0.15, bladeX0, 0.04, groundTop, groundFront - 1.08, groundFront - 1.02); // parede iluminada
  box(mats.white, -hw + 0.1, -hw + 0.22, 0, groundTop, groundFront - 1.05, groundFront); // lateral esquerda
  // Balcão de recepção com monitor.
  box(mats.white, -0.55, 0.35, 0.04, 0.42, groundFront - 0.75, groundFront - 0.5);
  box(mats.bezel, -0.3, 0.02, 0.44, 0.64, groundFront - 0.66, groundFront - 0.63);
  const lobbyScreen = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.28, 0.17)),
    track(new THREE.MeshBasicMaterial({ map: track(makeScreenTexture(pal, 7)) }))
  );
  lobbyScreen.position.set(-0.14, 0.54, groundFront - 0.625);
  group.add(lobbyScreen);
  // Pilar azul-marinho e vidro da entrada.
  const pillarX0 = -hw + 0.22;
  const pillarX1 = pillarX0 + 0.6;
  box(mats.navy, pillarX0, pillarX1, 0, groundTop, groundFront - 0.35, groundFront + 0.08);
  glazing("x", pillarX1, bladeX0, groundFront, 0.04, groundTop, 0.55);
  // Marquise com luzes embutidas.
  const doorX0 = pillarX1;
  const doorX1 = pillarX1 + 1.75;
  box(mats.navy, doorX0 - 0.05, doorX1, 0.9, 0.99, groundFront, groundFront + 0.45);
  for (const lx of [doorX0 + 0.35, (doorX0 + doorX1) / 2, doorX1 - 0.35]) {
    box(mats.lamp, lx - 0.04, lx + 0.04, 0.885, 0.9, groundFront + 0.25, groundFront + 0.33, { noShadow: true });
  }
  // Hall à direita da entrada: escada subindo e luminárias pendentes.
  const stairX0 = doorX1 + 0.12;
  const stairX1 = bladeX0 - 0.08;
  const steps = 7;
  for (let i = 0; i < steps; i++) {
    const sx0 = stairX0 + ((stairX1 - stairX0) * i) / steps;
    box(mats.white, sx0, stairX1, 0.04, 0.04 + (0.9 * (i + 1)) / steps, groundFront - 0.85, groundFront - 0.45);
  }
  for (const px of [stairX0 + 0.12, (stairX0 + stairX1) / 2, stairX1 - 0.12]) {
    box(mats.lampHousing, px - 0.008, px + 0.008, 0.62, groundTop, groundFront - 0.22, groundFront - 0.2, { noShadow: true });
    box(mats.lamp, px - 0.025, px + 0.025, 0.55, 0.62, groundFront - 0.235, groundFront - 0.185, { noShadow: true });
  }

  // Degrau de entrada.
  box(mats.white, doorX0 - 0.05, doorX1, 0, 0.06, groundFront, groundFront + 0.55);

  // ---- Laje do andar de cima (faixa branca grossa) ------------------------------
  box(mats.white, -hw, bladeX0, groundTop, slabTop, -hd + 0.05, upperFront + 0.06);
  // Faixa azul-marinho sob o vidro da direita.
  // Fica 5 mm à frente da laje e 4 mm abaixo do topo dela: coplanar, as duas
  // superfícies brigavam na renderização (z-fighting) e a faixa saltava do vidro.
  box(mats.navy, bladeX0 - 1.35, bladeX0, groundTop, slabTop - 0.004, upperFront - 0.1, upperFront + 0.065);

  // ---- Andar de cima: escritório ------------------------------------------------
  box(mats.interior, -hw + 0.1, bladeX0, slabTop, roofBottom, -hd + 0.1, -hd + 0.2); // parede do fundo
  // Estante no fundo.
  box(mats.shelf, -0.4, 0.9, slabTop, slabTop + 0.55, -hd + 0.2, -hd + 0.38);
  // Duas fileiras de mesas com monitores virados para a fachada.
  box(mats.floor, -hw + 0.08, bladeX0, slabTop, slabTop + 0.01, -hd + 0.2, upperFront - 0.03, { noShadow: true });
  // Bancada colada ao vidro com os monitores virados para fora: com a
  // câmera alta, só ~0,4 m do interior aparece através do vidro.
  const deskZ = upperFront - 0.32;
  box(mats.white, -hw + 0.35, bladeX0 - 0.25, slabTop + 0.3, slabTop + 0.34, deskZ - 0.14, deskZ + 0.14);
  let screenSeed = 0;
  for (let sx = -hw + 0.75; sx < bladeX0 - 0.4; sx += 0.85) {
    box(mats.bezel, sx - 0.21, sx + 0.21, slabTop + 0.36, slabTop + 0.64, deskZ - 0.03, deskZ);
    const screen = new THREE.Mesh(
      track(new THREE.PlaneGeometry(0.38, 0.24)),
      track(new THREE.MeshBasicMaterial({ map: track(makeScreenTexture(pal, screenSeed++)) }))
    );
    screen.position.set(sx, slabTop + 0.5, deskZ + 0.005);
    group.add(screen);
    // Cadeira atrás da bancada.
    box(mats.navy, sx - 0.09, sx + 0.09, slabTop + 0.16, slabTop + 0.2, deskZ - 0.45, deskZ - 0.27);
    box(mats.navy, sx - 0.09, sx + 0.09, slabTop + 0.2, slabTop + 0.42, deskZ - 0.49, deskZ - 0.45);
  }
  // Luminárias lineares no teto, perto do vidro para aparecerem na câmera.
  for (const [lx0, lx1] of [[-hw + 0.35, -0.2], [0.25, bladeX0 - 0.35]]) {
    box(mats.lampHousing, lx0, lx1, roofBottom - 0.07, roofBottom - 0.02, upperFront - 0.24, upperFront - 0.14, { noShadow: true });
    box(mats.lamp, lx0 + 0.02, lx1 - 0.02, roofBottom - 0.075, roofBottom - 0.07, upperFront - 0.23, upperFront - 0.15, { noShadow: true });
  }
  // Vidro contornando a quina: fachada + lateral esquerda.
  glazing("x", -hw + 0.05, bladeX0, upperFront, slabTop, roofBottom, 0.6);
  glazing("z", -hd + 0.15, upperFront, -hw + 0.05, slabTop, roofBottom, 0.6);

  // ---- Cobertura com platibanda ----------------------------------------------
  box(mats.white, -hw - 0.05, bladeX0 + 0.02, roofBottom, roofTop, -hd, upperFront + 0.1);
  box(mats.slabTop, -hw + 0.12, bladeX0 - 0.12, roofTop, roofTop + 0.005, -hd + 0.15, upperFront - 0.05, { noShadow: true });
  // Borda elevada (platibanda) em volta da cobertura.
  const rimTop = roofTop + 0.08;
  box(mats.white, -hw - 0.05, bladeX0 + 0.02, roofTop, rimTop, upperFront - 0.02, upperFront + 0.1);
  box(mats.white, -hw - 0.05, bladeX0 + 0.02, roofTop, rimTop, -hd, -hd + 0.12);
  box(mats.white, -hw - 0.05, -hw + 0.07, roofTop, rimTop, -hd, upperFront + 0.1);

  // ---- Lâmina azul-marinho na lateral, passando do telhado -------------------
  box(mats.white, bladeX0, hw, 0, groundTop, -hd + 0.1, groundFront + 0.2); // base branca do térreo
  box(mats.navy, bladeX0, hw - 0.05, groundTop, roofTop + 0.35, -hd + 0.35, upperFront + 0.08);
  box(mats.white, bladeX0 - 0.03, hw, roofTop + 0.35, roofTop + 0.43, -hd + 0.3, upperFront + 0.13);
  box(mats.white, bladeX0 + 0.1, hw, 0, roofTop + 0.15, -hd + 0.05, -hd + 0.35); // volume branco dos fundos

  // ---- Jardineiras com arbustos facetados ------------------------------------
  const pointy = track(new THREE.OctahedronGeometry(0.13, 0));
  const round = track(new THREE.IcosahedronGeometry(0.1, 0));
  const shrub = (geo, x, z, sy) => {
    const m = new THREE.Mesh(geo, mats.leaves);
    m.position.set(x, 0.12 + 0.1 * sy, z);
    m.scale.set(1, sy, 1);
    group.add(m);
    return m;
  };
  const planter = (x0, x1, z0, z1) => {
    box(mats.white, x0, x1, 0, 0.12, z0, z1);
    box(mats.gravel, x0 + 0.04, x1 - 0.04, 0.12, 0.125, z0 + 0.04, z1 - 0.04, { noShadow: true });
  };
  planter(-hw, pillarX0 + 0.05, groundFront - 0.1, hd);
  shrub(pointy, -hw + 0.18, hd - 0.45, 2.6);
  shrub(pointy, -hw + 0.42, hd - 0.62, 1.8);
  shrub(round, -hw + 0.2, hd - 0.18, 1.1);
  shrub(round, -hw + 0.45, hd - 0.2, 0.9);
  planter(doorX1 + 0.1, hw, groundFront + 0.15, hd);
  shrub(pointy, hw - 0.25, groundFront + 0.38, 2.4);
  shrub(pointy, doorX1 + 0.3, groundFront + 0.4, 1.6);
  shrub(round, doorX1 + 0.45, hd - 0.2, 1.2);
  shrub(round, doorX1 + 0.75, hd - 0.18, 1);
  shrub(round, hw - 0.2, hd - 0.18, 1);
  shrub(round, hw - 0.45, hd - 0.15, 0.8);

  // Luz quente interna (sem sombra, alcance curto). Nos níveis leves fica de
  // fora: cada luz pontual pesa em todos os pixels da cena.
  if (!lite) {
    const warm = new THREE.PointLight(pal.lamp, 2.5, 3.5, 2);
    warm.position.set(0, slabTop + 0.5, 0);
    group.add(warm);
  }

  return { labelPos: new THREE.Vector3(-0.35, (groundTop + slabTop) / 2, upperFront + 0.07), labelBg: pal.navy };
}

export function createVila(host, options) {
  const {
    members = [],
    // Índices (em members) dos líderes de ginásio e da Diretoria: balão com
    // estrela em vez do "!" (areas.js decide quem são).
    leaders = new Set(),
    reducedMotion = false,
    modelUrl,
    // GLB do jogador, ao lado de modelUrl ("jogador-homem.glb" |
    // "jogador-mulher.glb" | "gava.glb"); trocável depois com setJogador().
    playerModel = "gava.glb",
    // Subiu (true) ou desceu (false) da bicicleta.
    onBicicleta = () => {},
    // Já conquistou a bicicleta (minigame da oficina)? Sem ela, B não monta.
    bicicletaLiberada = false,
    // Preparo da Vila antes de jogar ({ fase, progresso 0..1 }): ver
    // "Preparo da Vila" e api.preparar().
    onPreparo = () => {},
    // Nasce com a tela de carregamento por cima (ver setCarregando).
    carregando = false,
    // Som (som/sfx.js): onSom(nome, opts) a cada passo (pelo chão), catraca
    // da bicicleta, porta e elevador. A UI decide se toca.
    onSom = () => {},
    // Nível gráfico (scene/qualidade.js): "high" | "medium" | "low" | "minimal".
    // Sombras, antialias e resolução seguem o nível; nos dois mais baixos a
    // cena já nasce com modelos e vegetação leves. `autoQuality`: pode descer
    // de nível sozinho se o quadro ficar lento (onQualityDrop avisa).
    quality = "medium",
    autoQuality = true,
    onQualityDrop = () => {},
    onInteract = () => {},
    onFacing = () => {},
    // Ficha de um personagem 3D ou mascote ({ id }): clique nele ou conversa de
    // frente pelo teclado. id: "pedro" | "leo" | "tiago" | "rafa" (pessoas) ou
    // "samurai" | "coelho" | "waffle" (mascotes); "ocarina" fica a cargo da UI.
    onInspect = () => {},
    onReady = () => {},
    onClock = () => {},
    // Fala de uma cena ({ title, text }); a cena espera continueCutscene().
    onCutsceneSay = () => {},
    // Quest da ocarina: perto do Pedro (true/false) e ocarina encontrada.
    onQuestNear = () => {},
    onQuestFind = () => {},
    // Quests de coleta (quests-coleta.js): pisou num item ({ quest, item }) e
    // chegou perto de quem dá a quest ({ quest, perto }). Vale também dentro
    // do prédio: itens com `local` de um andar e quest com `local` (o Rafa da
    // Galeria), cujo "perto" só acontece naquele interior.
    onColeta = () => {},
    onColetaPerto = () => {},
    // Efeito visual de uma cena, feito na interface: { efeito: "sepia", on }
    // ou { efeito: "relogio", on, sentido }.
    onCutsceneEfeito = () => {},
    // Galeria da Equipe: quadros na ordem dos slots (museu-dados.js), troca de
    // lugar ({ local: "vila" | id do andar }), fases da íris ({ fase: "fechar" |
    // "abrir", para }) e quadro em foco pelo jogo ({ id }).
    quadrosMuseu = [],
    onLocal = () => {},
    onTransicao = () => {},
    onQuadro = () => {},
    // Prédio da SEMFAZ: o jogador chamou o elevador ({ andar: id atual }).
    onElevador = () => {},
    // Objeto que ensina num andar ({ id, titulo, texto }): Espaço de frente.
    onInfo = () => {},
    // Corrida de bicicleta na pista (scene/pista): { tipo: "entrou" | "saiu" |
    // "contagem" (n 3..1) | "largada" (inicio) | "checkpoint" (i, total, volta,
    // tempo) | "volta" (volta, voltas, tempo) | "chegada" (tempo) }. "entrou"
    // e "contagem" levam também voltas e total (checkpoints por volta, com a
    // chegada); checkpoint.i é o índice dentro da volta e checkpoint.volta a
    // volta atual (1-based); volta.volta é a que acabou de fechar; `tempo` em
    // milissegundos de jogo. Ver "Corrida na pista" e api.corrida.
    onCorrida = () => {},
  } = options;

  const map = buildMap();
  const pal = readPalette();
  const rand = mulberry32(20261008);
  const disposables = [];
  const track = (x) => {
    disposables.push(x);
    return x;
  };

  // ---- Renderer, cena, câmera ---------------------------------------------
  const lite = ehLeve(quality);
  // Antialias só nos níveis altos: em vídeo integrado o MSAA custa caro.
  const renderer = new THREE.WebGLRenderer({
    antialias: !lite,
    powerPreference: "high-performance",
  });
  // Sem a checagem de erro de cada shader (getShaderInfoLog no 1º uso): ela
  // obriga o navegador a terminar a compilação na hora, travando o quadro
  // (no Windows/ANGLE, segundos somados com ~140 programas).
  renderer.debug.checkShaderErrors = false;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // near 0,5 (câmera fica a ~14 u do chão): mais precisão de profundidade
  // para a oclusão de ambiente, sem cortar nada.
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 120);
  const CAM_OFFSET = new THREE.Vector3(0, 10.5, 9);
  const camTarget = new THREE.Vector3();

  // Tone mapping, sombras, sol, hemisfério, névoa e pós-processamento:
  // scene/lighting.js (pixel ratio também, conforme o nível de qualidade).
  // Ciclo dia/noite acelerado (parado de manhã com prefers-reduced-motion).
  const dayNight = createDayNight({ pal, reducedMotion });
  const lighting = createLighting({
    renderer,
    scene,
    camera,
    pal,
    track,
    dayNight,
    quality,
    autoDrop: autoQuality,
    onQualityDrop,
  });

  // ---- Chão -----------------------------------------------------------------
  const unitBox = track(new THREE.BoxGeometry(1, 1, 1));
  const v = new THREE.Vector3();

  // Terreno contínuo, calçadas com meio-fio e lago (scene/ground.js).
  const groundFx = buildGround({
    lite,
    scene,
    map,
    pal,
    track,
    W,
    H,
    unitBox,
    tiles: { PATH, WATER, TALL, FLOWER, TREE, BUILDING },
  });
  // Mantém a sequência do PRNG igual à do chão antigo (1 sorteio por tile
  // de terra): o resto da vila (árvores, flores, NPCs) não muda de lugar.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (map[y][x] !== WATER) rand();

  // ---- Árvores, mato alto e flores (scene/vegetation.js) -------------------
  // Copa redonda, coníferas na borda, açaizeiros perto do rio, ipês de
  // destaque, arbustos e pedras só em tiles de árvore e no anel externo.
  const veg = buildVegetation({
    lite,
    scene,
    map,
    pal,
    track,
    tileToWorld,
    W,
    H,
    tiles: { TREE, TALL, FLOWER, WATER, FENCE, BUILDING },
    reducedMotion,
  });

  // ---- Cercas -----------------------------------------------------------------
  // Cerca branca de ripas com mureta e pilares no portão (scene/props.js).
  const fenceTiles = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (map[y][x] === FENCE) fenceTiles.push([x, y]);
  buildFences(scene, { pal, track, unitBox }, {
    tiles: fenceTiles,
    isFence: (x, y) => map[y]?.[x] === FENCE,
    // Portão = caminho encostado na cerca.
    isGate: (x, y) => map[y]?.[x] === PATH,
    tileToWorld,
  });

  // ---- Prédios -------------------------------------------------------------
  // Animações por quadro dos prédios (luzes, ventoinhas). Desligadas com
  // prefers-reduced-motion.
  const frameUpdaters = [];
  const buildCtx = {
    lite,
    pal,
    track,
    unitBox,
    reducedMotion,
    onFrame: (fn) => {
      if (!reducedMotion) frameUpdaters.push(fn);
    },
  };
  const BUILDERS = {
    frontend: (group, b) => buildFrontEnd(group, b, buildCtx),
    backend: (group, b) => buildBackEnd(group, b, buildCtx),
    database: (group, b) => buildDatabase(group, b, buildCtx),
    ml: (group, b) => buildML(group, b, buildCtx),
    semec: (group, b) => buildSemec(group, b, buildCtx),
  };

  const buildingGroups = new Map(); // id → grupo (épocas da cena da ocarina)
  for (const b of BUILDINGS) {
    const group = new THREE.Group();
    buildingGroups.set(b.id, group);
    group.position.set(b.x + b.w / 2 - W / 2, 0, b.y + b.h / 2 - H / 2);
    const { labelPos, labelBg } = BUILDERS[b.kind](group, b);
    if (b.label) {
      const tex = track(makeLabelTexture(b.label, labelBg, pal.white, pal.font));
      const plate = new THREE.Mesh(track(new THREE.PlaneGeometry(1.2, 0.3)), track(new THREE.MeshBasicMaterial({ map: tex })));
      plate.position.copy(labelPos);
      group.add(plate);
    }
    scene.add(shadowed(group));
  }

  // ---- Placas -----------------------------------------------------------------
  // Totens com moldura grafite e face na cor da área + mobiliário urbano
  // (postes, bancos, lixeiras, bicicletários), tudo instanciado.
  buildSigns(scene, buildCtx, { signs: SIGNS, tileToWorld });
  buildStreetProps(scene, buildCtx, { props: PROPS, tileToWorld });

  // ---- NPCs (o time) --------------------------------------------------------
  const occupied = new Map(); // "x,y" -> npc
  const npcs = [];
  // Bonecos chibi (scene/chibi.js): geometria compartilhada, visual por índice.
  // Também usado pelo jogador provisório enquanto o GLB carrega.
  const { makeChibi, makeMarker, setMarkerDone } = createChibiKit({ pal, track });
  // Alto o bastante para não encostar nos cachos/coque vistos da câmera.
  const MARKER_Y = 1.53;
  // Inclinação do balão para encarar a câmera (alta, ao sul).
  const MARKER_TILT = -0.55;
  let di = 0;
  let ii = 0;
  const areaUsed = {};
  const takeSpot = (area) => {
    const i = areaUsed[area] ?? 0;
    areaUsed[area] = i + 1;
    return AREA_SPOTS[area][i];
  };
  // Líderes escolhem primeiro: ficam no ponto principal da área (porta).
  const spotOf = new Map();
  const byLeaderFirst = members.map((m, i) => i).sort((a, b) => leaders.has(b) - leaders.has(a));
  for (const index of byLeaderFirst) {
    const member = members[index];
    if (member.group === "directors") continue;
    // Quem lidera um ginásio com área própria (o de ML) fica na porta dele.
    const area = member.chefe && AREA_SPOTS[member.chefe] ? member.chefe : areaOf(member.role);
    spotOf.set(index, takeSpot(area) || takeSpot("generic"));
  }
  // Quem tem boneco 3D (scene/walkers.js), líder ou não: o chibi vira âncora
  // invisível (tile, balão, conversa e cenas) e o 3D fica no lugar dele.
  const anchors = new Map(); // id do boneco 3D → fig do chibi
  let viniciusFig = null; // chibi da Diretoria que leva o 3D do Vinicius
  // Quem dá quest (o Pedro) não vira chibi: é o NPC 3D de scene/pedro.js.
  const questIndex = members.findIndex((m) => m.quest);
  members.forEach((member, index) => {
    if (member.quest) return;
    const isDirector = member.group === "directors";
    const spot = isDirector ? DIRECTOR_SPOTS[di++] : spotOf.get(index);
    if (!spot) return;
    if (!isDirector) ii++;
    const shirts = isDirector ? pal.shirtsDirectors : pal.shirtsInterns;
    const shirt = shirts[(isDirector ? di - 1 : ii - 1) % shirts.length];
    const fig = makeChibi({ shirt, eye: pal.eye, variant: npcs.length + 1, director: isDirector });
    fig.position.copy(tileToWorld(spot.x, spot.y));
    fig.rotation.y = DIRS[spot.dir].rot;
    const leader = leaders.has(index);
    const boneco = modelUrl && WALKER_IDS.has(member.retrato) ? member.retrato : null;
    // O Vinicius (retrato "gava") tem boneco 3D próprio (scene/vinicius.js),
    // preso dentro do chibi escondido.
    const ehVinicius = modelUrl && member.retrato === "gava";
    if (boneco || ehVinicius) {
      fig.traverse((o) => {
        if (o.isMesh) o.visible = false; // continua no raycast do clique
      });
      anchors.set(boneco, fig);
    }
    const marker = makeMarker({ leader });
    // O 3D é mais baixo que o chibi: balão um pouco mais perto da cabeça.
    const markerY = boneco || ehVinicius ? MARKER_Y - 0.12 : MARKER_Y;
    marker.position.y = markerY;
    // Balão sempre de frente para a câmera, qualquer que seja a direção do NPC.
    marker.rotation.set(MARKER_TILT, -fig.rotation.y, 0);
    fig.add(marker);
    fig.traverse((o) => (o.userData.npcIndex = npcs.length));
    scene.add(fig);
    const npc = { index, member, x: spot.x, y: spot.y, dir: spot.dir, fig, marker, markerY, boneco, talked: false, leader, beaten: false, phase: rand() * 6 };
    npcs.push(npc);
    occupied.set(`${spot.x},${spot.y}`, npc);
    if (ehVinicius) viniciusFig = fig;
  });
  // Aprendizes (depois dos membros: as cenas que reúnem o time usam os
  // primeiros da lista). `index` null: não são da equipe; a conversa sai como
  // onInteract({ type: "treinador", id }).
  for (const t of TREINADORES_VILA) {
    const fig = makeChibi({ shirt: pal.white, eye: pal.eye, variant: npcs.length + 3 });
    fig.position.copy(tileToWorld(t.x, t.y));
    fig.rotation.y = DIRS[t.dir].rot;
    const marker = makeMarker({ leader: false });
    marker.position.y = MARKER_Y;
    marker.rotation.set(MARKER_TILT, -fig.rotation.y, 0);
    fig.add(marker);
    fig.traverse((o) => (o.userData.npcIndex = npcs.length));
    scene.add(fig);
    const npc = { index: null, treinador: t.id, x: t.x, y: t.y, dir: t.dir, fig, marker, markerY: MARKER_Y, talked: false, leader: false, beaten: false, phase: rand() * 6 };
    npcs.push(npc);
    occupied.set(`${t.x},${t.y}`, npc);
  }

  // ---- Luzes da noite (postes, janelas, vaga-lumes) -------------------------
  // Criado depois de toda a cena: recolhe os materiais emissivos já montados.
  const lampSpots = PROPS.filter((p) => p.kind === "lamp").map((p) => {
    const w = tileToWorld(p.x, p.y);
    w.z += LAMP_SOUTH_OFFSET;
    return w;
  });
  const glowSpots = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if ((map[y][x] === TALL || map[y][x] === FLOWER) && (x + y) % 2 === 0) glowSpots.push(tileToWorld(x, y));
  const nightLights = createNightLights({ scene, pal, track, lamps: lampSpots, glowSpots, reducedMotion });
  let lastClock = "";

  // ---- Jogador ----------------------------------------------------------------
  const player = {
    x: START.x,
    y: START.y,
    dir: START.dir,
    root: new THREE.Group(),
    body: null,
    move: null,
    path: [],
    pending: null,
    turnLock: 0,
    tap: null, // direção de um toque curto (api.press), vale um passo
    idle: 0,
    run: false,
  };
  player.root.position.copy(tileToWorld(player.x, player.y));
  player.root.rotation.y = DIRS[player.dir].rot;
  // root (posição e yaw lógicos, a câmera segue) → giro (diferença do yaw
  // visual para o lógico) → inclina (roll da bicicleta, em Z = eixo da frente)
  // → body. O que é só visual fica nos grupos de dentro: a lógica, as
  // transições e o sentar continuam lendo/escrevendo o root como antes.
  player.giro = new THREE.Group();
  player.inclina = new THREE.Group();
  player.root.add(player.giro);
  player.giro.add(player.inclina);
  const placeholder = makeChibi({ shirt: pal.white, pants: pal.pants, skin: pal.skin, hair: pal.hair, eye: pal.eye });
  player.inclina.add(placeholder);
  player.body = placeholder;
  scene.add(player.root);

  // Sombra de contato redonda sob o jogador (o rig não projeta bem nos pés).
  const blob = new THREE.Mesh(
    track(new THREE.CircleGeometry(0.3, 20)),
    track(new THREE.MeshBasicMaterial({ color: pal.black, transparent: true, opacity: 0.18, depthWrite: false }))
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.01;
  player.giro.add(blob);

  // Personagem animado: anda de notebook guardado; parado, abre e programa.
  let mixer = null;
  let actions = null;
  let laptop = null;
  let laptopLid = null;
  let laptopPose = null; // pose do notebook aberto, mantida durante a `digitando`
  let coding = false;
  let walking = false;
  let walkStride = WALK_CYCLE_STRIDE;
  let walkCycle = 1;
  let disposed = false;

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  // Conta toda carga de GLB da Vila (jogador, Pedro, duplas, Vinicius,
  // ocarina…): o preparo da Vila espera todas antes de compilar.
  const cargasVila = { total: 0, feitas: 0 };
  const loadAsyncOriginal = loader.loadAsync.bind(loader);
  loader.loadAsync = (...args) => {
    const p = loadAsyncOriginal(...args);
    cargasVila.total++;
    const conta = () => {
      cargasVila.feitas++;
    };
    p.then(conta, conta);
    return p;
  };

  // Pedro: NPC 3D parado na frente da SEMEC com a quest da ocarina
  // (scene/pedro.js); a ocarina fica escondida no mato (scene/quest.js).
  let questEtapa = "nova";
  let questNear = false;
  const questMarker = createQuestMarker({ pal, track, reducedMotion });
  const pedro =
    modelUrl && questIndex >= 0
      ? createPedro({
          scene,
          loader,
          url: modelUrl.replace(/gava\.glb$/, arquivoLeve("pedro.glb", lite)),
          tileToWorld,
          spot: { ...QUEST_SPOT, rot: DIRS[QUEST_SPOT.dir].rot },
          index: questIndex,
          marker: questMarker.object,
          occupied,
          shadowColor: pal.black,
          reducedMotion,
          isPaused: () => paused || cutscene.active,
        })
      : null;
  const vinicius = viniciusFig
    ? createVinicius({
        fig: viniciusFig,
        loader,
        url: modelUrl.replace(/gava\.glb$/, arquivoLeve("gava.glb", lite)),
        shadowColor: pal.black,
        reducedMotion,
      })
    : null;
  const ocarina = pedro
    ? createOcarinaHideout({
        scene,
        loader,
        url: modelUrl.replace(/gava\.glb$/, arquivoLeve("ocarina.glb", lite)),
        pos: tileToWorld(OCARINA_SPOT.x, OCARINA_SPOT.y),
        pal,
        track,
        reducedMotion,
      })
    : null;
  // Duplas dono + mascote passeando (Leo + samurai, Tiago + coelho): scene/walkers.js.
  const walkers = modelUrl
    ? createWalkers({
        scene,
        loader,
        baseUrl: modelUrl.replace(/gava\.glb$/, ""),
        lite,
        tileToWorld,
        // Montado, também não entra num tile em que a bicicleta encosta.
        isFree: (x, y) => passable(x, y) && !(player.x === x && player.y === y) && !bikeEncosta(x, y),
        occupied,
        shadowColor: pal.black,
        slashColor: pal.white,
        bubble: { bg: pal.white, fg: pal.eye, font: pal.font },
        anchors,
        reducedMotion,
        isPaused: () => paused || cutscene.active,
      })
    : [];
  // Quests de coleta: itens no mapa (scene/coleta.js) e o cristal de quest
  // sobre quem dá cada uma (Zé Carlos, Emily; o Rafa da Galeria). Aqui só os
  // itens da Vila (localDoItem); os dos andares nascem com o interior
  // (ligarColetaInterior). Quest com `local` (a do Rafa, dada na Galeria):
  // o cristal NÃO vai no walker da Vila (o Rafa de lá é o líder do ginásio);
  // fica guardado e é pendurado na pessoa do interior quando ele é criado.
  // Tipo do item: `tipoItem` da quest ("bug"), senão o de antes.
  const tipoDoItem = (q) => q.tipoItem ?? (q.id === "paginas" ? "pagina" : "nota");
  const estadosColeta = new Map(); // questId → { etapa, itens } (setColeta)
  const coletaveis = createColetaveis({ scene, pal, track, tileToWorld, reducedMotion });
  const questsColeta = Object.values(QUESTS_COLETA).map((q) => {
    coletaveis.add(q.id, q.itens.filter((i) => localDoItem(i) === "vila"), tipoDoItem(q));
    const walker = q.local ? null : (walkers.find((w) => w.id === q.npc) ?? null);
    const marker = createQuestMarker({ pal, track, reducedMotion });
    marker.object.userData.baseY = 1.42;
    marker.object.position.y = 1.42;
    walker?.owner.root.add(marker.object);
    return { quest: q, walker, marker, perto: false };
  });
  const tileOf = (pos) => ({ x: Math.floor(pos.x + W / 2), y: Math.floor(pos.z + H / 2) });

  // Carrega (ou troca) o boneco do jogador. O Gava traz `entrada`/`digitando`
  // (notebook); os jogadores novos trazem só `parado` e `andando` (sem
  // programar parado). Uma troca no meio de outra carga vale a mais nova.
  let jogadorPedido = 0;
  let jogadorPronto = !modelUrl; // o boneco atual já montou (ou falhou)
  function carregarJogador(arquivo) {
    if (!modelUrl) return;
    const pedido = ++jogadorPedido;
    jogadorPronto = false;
    loader
      .loadAsync(modelUrl.replace(/gava\.glb$/, arquivoLeve(arquivo, lite)))
      .then((gltf) => {
        if (disposed || pedido !== jogadorPedido) return;
        if (coding) stopCoding();
        // Perdeu a bicicleta montado (o boneco novo chega sem ela montada):
        // volta à grade, como ao descer.
        if (bike.on) {
          onBicicleta(false);
          bike.on = false;
          voltarAGrade();
        }
        if (sentados.has(player.body)) sentados.delete(player.body);
        mixer?.stopAllAction();
        mixer = null;
        actions = null;
        laptop = null;
        laptopLid = null;
        walking = false;
        walkCycle = 1;
        const model = gltf.scene;
        // A bicicleta (jogadores novos) fica fora da medida da altura.
        const bicicleta = model.getObjectByName("Bicicleta");
        const paiBike = bicicleta?.parent;
        bicicleta?.removeFromParent();
        const box = new THREE.Box3().setFromObject(model);
        paiBike?.add(bicicleta);
        const size = box.getSize(new THREE.Vector3());
        const k = 0.98 / size.y;
        walkStride = WALK_CYCLE_STRIDE * k;
        model.scale.setScalar(k);
        model.position.y = -box.min.y * k;
        const wrap = new THREE.Group();
        wrap.add(shadowed(model));
        const antigo = player.body;
        player.inclina.remove(antigo);
        if (antigo !== placeholder) descartarJogador(antigo);
        player.inclina.add(wrap);
        player.body = wrap;
        laptop = model.getObjectByName("Laptop");
        laptopLid = model.getObjectByName("LaptopLid");
        prepararBike(model, bicicleta);
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          const clip = (n) => gltf.animations.find((a) => a.name === n);
          const entrada = clip("entrada");
          const digitando = clip("digitando");
          const andando = clip("andando");
          const parado = clip("parado");
          if (!(entrada && digitando) && parado) {
            // Jogador novo: `parado` em loop é a pose de descanso.
            actions = { parado: mixer.clipAction(parado) };
            actions.pose = actions.parado;
            if (clip("pedalando")) actions.pedalando = mixer.clipAction(clip("pedalando"));
            // Opcionais (GLB novo): curva para cada lado e parado com o pé no chão.
            if (clip("pedalando_esq")) actions.pedalandoEsq = mixer.clipAction(clip("pedalando_esq"));
            if (clip("pedalando_dir")) actions.pedalandoDir = mixer.clipAction(clip("pedalando_dir"));
            if (clip("bike_parado")) actions.bikeParado = mixer.clipAction(clip("bike_parado"));
            // O guidão já vem nas clips de curva? Então o peso delas o esterça;
            // senão, o código gira o `Garfo` (ver girarBike).
            bike.garfoNaClip = ["pedalando", "pedalando_esq", "pedalando_dir"].some((n) =>
              clip(n)?.tracks.some((tr) => tr.name.startsWith("Garfo."))
            );
            if (andando) {
              actions.andando = mixer.clipAction(andando);
              walkCycle = andando.duration;
            }
          } else if (entrada && digitando) {
            actions = { entrada: mixer.clipAction(entrada), digitando: mixer.clipAction(digitando) };
            actions.pose = actions.entrada;
            if (andando) {
              actions.andando = mixer.clipAction(andando);
              walkCycle = andando.duration;
            }
            actions.entrada.setLoop(THREE.LoopOnce, 1);
            actions.entrada.clampWhenFinished = true;
            mixer.addEventListener("finished", (e) => {
              if (e.action === actions.entrada && coding) {
                // A `digitando` não anima escala/rotação do notebook nem a
                // tampa: sem isso, ao sair da `entrada` eles voltariam ao
                // repouso (escala 0,001, tampa fechada). Guarda a pose final.
                laptopPose = [laptop, laptopLid]
                  .filter(Boolean)
                  .map((o) => ({ o, s: o.scale.clone(), q: o.quaternion.clone() }));
                actions.digitando.reset().play();
                actions.digitando.crossFadeFrom(actions.entrada, 0.15, false);
              }
            });
          }
        }
        stopCoding();
        jogadorPronto = true;
      })
      .catch(() => {
        // Sem o modelo, o bonequinho provisório (ou o boneco anterior) continua.
        if (pedido === jogadorPedido) jogadorPronto = true;
      });
  }
  // Boneco trocado: libera malhas, materiais e texturas do anterior.
  function descartarJogador(obj) {
    obj.traverse((o) => {
      o.geometry?.dispose();
      for (const m of [].concat(o.material ?? [])) {
        for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
        m.dispose();
      }
    });
  }
  carregarJogador(playerModel);

  // ---- Bicicleta --------------------------------------------------------------
  // Os GLBs dos jogadores novos trazem o nó `Bicicleta` (rodas, pedivela e
  // pedais com origem no eixo, girando em X local) e o clipe `pedalando` (uma
  // volta do pedivela). Rodas giram pela distância andada; o pedivela segue o
  // tempo do clipe; os pedais contra-giram para ficarem nivelados.
  // Pilotagem (ver "Direção livre"): `rumo` é o yaw contínuo (o do root),
  // `spd` a velocidade (tiles/s), `omega` a velocidade angular do rumo no
  // quadro (rad/s), `vel` o embalo (spd / BIKE_VMAX: 0 parado … 1 cadência
  // cheia), `guidao` o esterço atual (rad), `paradoPeso` o peso da
  // `bike_parado`. `toque`: setas de um toque curto (direção → segundos que
  // ainda valem). `pneu`: distância desde o último som de pneu. `rota`: os
  // tiles do caminho do clique (player.path) e `virar`: a direção para onde
  // virar parado no fim dele (alvo do clique).
  const bike = {
    on: false,
    node: null,
    rodas: [],
    pedivela: null,
    pedais: [],
    garfo: null,
    garfoY0: 0,
    garfoNaClip: false,
    raio: 0.1,
    ultimo: new THREE.Vector3(),
    vel: 0,
    guidao: 0,
    paradoPeso: 0,
    rumo: 0,
    spd: 0,
    omega: 0,
    pedalando: false,
    toque: new Map(),
    pneu: 0,
    rota: null,
    rotaDe: null,
    rotaI: 0,
    rotaPreso: 0,
    virar: null,
  };
  function prepararBike(model, bicicleta) {
    bike.node = bicicleta ?? null;
    bike.rodas = ["RodaDianteira", "RodaTraseira"].map((n) => model.getObjectByName(n)).filter(Boolean);
    bike.pedivela = model.getObjectByName("Pedivela") ?? null;
    bike.pedais = ["PedalEsq", "PedalDir"].map((n) => model.getObjectByName(n)).filter(Boolean);
    // Só rotation: o meshopt pôs escala nos nós da bicicleta.
    bike.garfo = model.getObjectByName("Garfo") ?? null;
    bike.garfoY0 = bike.garfo?.rotation.y ?? 0;
    bike.garfoNaClip = false;
    if (!bicicleta) return;
    bicicleta.visible = false;
    // Raio da roda já na escala do jogo (o modelo acabou de ser escalado).
    model.updateMatrixWorld(true);
    if (bike.rodas[0]) bike.raio = new THREE.Box3().setFromObject(bike.rodas[0]).getSize(new THREE.Vector3()).y / 2 || 0.1;
  }
  let bikeLiberada = bicicletaLiberada;
  const temBike = () => Boolean(bikeLiberada && bike.node && actions?.pedalando);
  // Zera a pilotagem (montar, teleportes da pista): parado, sem setas de
  // toque, sem caminho de clique.
  function zerarPilotagem() {
    bike.spd = 0;
    bike.vel = 0;
    bike.omega = 0;
    bike.pedalando = false;
    bike.toque.clear();
    bike.pneu = 0.7;
    bike.rota = null;
    bike.rotaDe = null;
    bike.virar = null;
    tilesNoQuadro.length = 0;
  }
  // `forcar`: a entrada na pista monta no escuro da íris (com a transição
  // ainda ativa); na pista vale montar, nos prédios não.
  function montar(forcar = false) {
    if (bike.on || !temBike()) return false;
    if (!forcar && ((noPredio() && !naPista()) || cutscene.active || transicao || foco)) return false;
    if (coding) stopCoding();
    bike.on = true;
    bike.node.visible = true;
    walking = false;
    actions.andando?.stop();
    actions.pose.stop();
    // Passo a pé pela metade: a bicicleta parte de onde o jogador está (a
    // posição agora é contínua) e o tile passa a ser o que está sob ele.
    if (player.move) {
      player.move = null;
      const o = origemDaGrade();
      player.x = Math.floor(player.root.position.x - o.x);
      player.y = Math.floor(player.root.position.z - o.z);
      if (player.body) {
        player.body.position.y = 0;
        player.body.rotation.z = 0;
      }
    }
    assento = null;
    // Rumo inicial = o yaw que está na tela (o giro a pé pode estar no meio).
    bike.rumo = player.root.rotation.y + player.giro.rotation.y;
    player.root.rotation.y = bike.rumo;
    player.giro.rotation.y = 0;
    yawVisual = bike.rumo;
    zerarPilotagem();
    // Todas as clips da bicicleta tocam juntas e o peso de cada uma sai de
    // pesarBike (sem crossFade: ele brigaria com os pesos manuais). Parado na
    // largada: a cadência começa em 0 (timeScale 0 congela o pedivela).
    bike.guidao = 0;
    bike.paradoPeso = actions.bikeParado ? 1 : 0;
    for (const a of clipsBike()) {
      a.reset().play();
      a.timeScale = 0;
    }
    if (actions.bikeParado) actions.bikeParado.timeScale = reducedMotion ? 0 : 1;
    pesarBike();
    mixer.update(0);
    bike.ultimo.copy(player.root.position);
    onBicicleta(true);
    return true;
  }
  function desmontar() {
    if (!bike.on) return;
    bike.on = false;
    bike.node.visible = false;
    for (const a of clipsBike()) a.stop();
    walking = false;
    voltarAGrade();
    bike.guidao = 0;
    if (bike.garfo && !bike.garfoNaClip) bike.garfo.rotation.y = bike.garfoY0;
    playPose();
    mixer.update(0);
    onBicicleta(false);
  }
  // Descendo (ou perdendo a bicicleta): de volta à grade. O yaw lógico vira
  // o cardinal de player.dir e o visual parte do rumo (giroVisual alinha);
  // a posição assenta no centro do tile (numa transição, quem move o jogador
  // é ela; numa cena, vai direto).
  function voltarAGrade() {
    player.root.rotation.y = DIRS[player.dir].rot;
    yawVisual = bike.rumo;
    player.giro.rotation.y = difAngulo(yawVisual, player.root.rotation.y);
    player.inclina.rotation.z = 0;
    zerarPilotagem();
    if (transicao) return;
    // O tile sob o jogador (ou, se ocupado, o vizinho andável mais perto).
    const pos = player.root.position;
    let melhor = null;
    let dMelhor = Infinity;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = player.x + dx;
        const y = player.y + dy;
        if (!dentro(x, y) || !podeAndar(x, y)) continue;
        const d = paraMundo(x, y).distanceTo(pos) - (dx || dy ? 0 : 1);
        if (d < dMelhor) {
          dMelhor = d;
          melhor = { x, y };
        }
      }
    }
    if (melhor) {
      player.x = melhor.x;
      player.y = melhor.y;
    }
    const ate = paraMundo(player.x, player.y);
    const d = ate.distanceTo(pos);
    if (reducedMotion || cutscene.active || d < 1e-3) {
      pos.copy(ate);
      assento = null;
    } else assento = { de: pos.clone(), ate, t: 0, dur: THREE.MathUtils.clamp(d / BIKE_ASSENTA_VEL, 0.08, 0.25) };
    reportFacing();
  }
  const clipsBike = () => [actions.pedalando, actions.pedalandoEsq, actions.pedalandoDir, actions.bikeParado].filter(Boolean);

  // Pesos: pedalando ↔ curva (esq/dir pela fração do esterço) e, por cima,
  // pedalando ↔ bike_parado. Somam 1 (abaixo disso o mixer misturaria a pose
  // de repouso do rig). As de curva andam no mesmo tempo da `pedalando`.
  function pesarBike() {
    const s = THREE.MathUtils.clamp(bike.guidao / GUIDAO_MAX, -1, 1);
    const p = actions.bikeParado ? bike.paradoPeso : 0;
    const esq = actions.pedalandoEsq ? Math.max(s, 0) : 0;
    const dir = actions.pedalandoDir ? Math.max(-s, 0) : 0;
    actions.pedalando.setEffectiveWeight((1 - p) * (1 - esq - dir));
    actions.pedalandoEsq?.setEffectiveWeight((1 - p) * esq);
    actions.pedalandoDir?.setEffectiveWeight((1 - p) * dir);
    actions.bikeParado?.setEffectiveWeight(p);
    const base = actions.pedalando;
    for (const a of [actions.pedalandoEsq, actions.pedalandoDir]) {
      if (!a) continue;
      a.time = base.time;
      a.timeScale = base.timeScale;
    }
  }

  // Antes do mixer, a cada quadro montado (depois de pedalarLivre): cadência
  // pela velocidade, pé no chão parado, guidão e inclinação pela velocidade
  // angular do rumo, pesos das clips.
  function pilotarBike(dt) {
    const andando = bike.spd > 0.05;
    bike.vel = Math.min(bike.spd / BIKE_VMAX, 1);
    // Pé no chão só depois de parar; ao sair, larga rápido.
    const paradoAlvo = andando ? 0 : 1;
    const taxaParado = paradoAlvo ? BIKE_PARADO_ENTRA : BIKE_PARADO_SAI;
    bike.paradoPeso = reducedMotion
      ? paradoAlvo
      : bike.paradoPeso + (paradoAlvo - bike.paradoPeso) * (1 - Math.exp(-dt * taxaParado));
    const guidaoAlvo = reducedMotion ? 0 : THREE.MathUtils.clamp(bike.omega * GUIDAO_K, -GUIDAO_MAX, GUIDAO_MAX);
    bike.guidao += (guidaoAlvo - bike.guidao) * (1 - Math.exp(-dt * GUIDAO_TAXA));
    // Roll para dentro da curva; em Z local (frente = +Z), negativo inclina
    // para a esquerda do ciclista, que é o lado de um yaw crescente. Parado
    // não inclina; movimento reduzido, nunca.
    const rollAlvo = reducedMotion ? 0 : THREE.MathUtils.clamp(-bike.omega * bike.spd * INCLINA_K, -INCLINA_MAX, INCLINA_MAX);
    player.inclina.rotation.z += (rollAlvo - player.inclina.rotation.z) * (reducedMotion ? 1 : 1 - Math.exp(-dt * INCLINA_TAXA));
    // Uma volta do pedivela a cada BIKE_TILES_POR_VOLTA tiles na cadência cheia.
    const p = actions.pedalando;
    const dur = p.getClip().duration;
    const cheia = dur / (STEP_BIKE * BIKE_TILES_POR_VOLTA);
    p.timeScale = cheia * bike.vel;
    // A `bike_parado` foi feita com o pedivela em 0 (pedal direito na frente,
    // pé esquerdo no chão): parado, o pedivela vai até a volta inteira mais
    // perto (para a frente ou, se for mais curto, para trás, como quem ajeita
    // o pedal) e estaciona em t = 0, senão o pé direito sai do pedal. Voltando
    // a pedalar, a fase recomeça daí e pedal e pé casam. Sem `bike_parado`,
    // só congela onde parou.
    if (actions.bikeParado && !andando) {
      const fase = ((p.time % dur) + dur) % dur;
      const frente = fase > dur / 2;
      const falta = frente ? dur - fase : fase;
      const giro = Math.max(cheia * bike.vel, cheia * BIKE_ESTACIONA);
      if (reducedMotion || falta <= giro * dt + 1e-4) {
        p.time = 0;
        p.timeScale = 0;
      } else p.timeScale = frente ? giro : -giro;
    }
    pesarBike();
  }

  // Depois do mixer, a cada quadro: rodas pela distância, pedivela pelo clipe
  // (com a cadência a 0 ele congela no ângulo em que parou), guidão.
  function girarBike() {
    const dist = player.root.position.distanceTo(bike.ultimo);
    bike.ultimo.copy(player.root.position);
    for (const roda of bike.rodas) roda.rotation.x += (RODA_SINAL * dist) / bike.raio;
    if (bike.garfo && !bike.garfoNaClip) bike.garfo.rotation.y = bike.garfoY0 + bike.guidao;
    if (!bike.pedivela) return;
    const p = actions.pedalando;
    const a = PEDIVELA_SINAL * 2 * Math.PI * (p.time / p.getClip().duration);
    bike.pedivela.rotation.x = a;
    for (const pedal of bike.pedais) pedal.rotation.x = -a;
  }

  // ---- Direção livre (bicicleta) ------------------------------------------------
  // Montado, o jogador sai da grade: a posição do root é contínua e o rumo
  // (root.rotation.y) também. A cada quadro (pedalarLivre):
  //   1. alvo de rumo = soma dos vetores das setas seguradas (duas setas =
  //      diagonal; opostas se anulam) ou o próximo tile do caminho do clique;
  //   2. o rumo gira até o alvo a no máximo BIKE_GIRO_LENTO…_RAPIDO rad/s
  //      (mais lento quanto mais rápido); alvo quase atrás: freia e faz um U;
  //   3. a velocidade acelera até BIKE_VMAX em BIKE_EMBALO s e, sem setas,
  //      freia sozinha em BIKE_FREIO s;
  //   4. anda em subpassos de BIKE_SUBPASSO, cada um resolvendo a colisão de
  //      um círculo (BIKE_RAIO) contra os tiles não andáveis (desliza na
  //      parede); cada tile novo sob o centro passa por pisouTile.
  // A grade continua valendo para o resto do jogo: player.x/y = tile sob o
  // centro, player.dir = cardinal mais perto do rumo (com histerese), e
  // reportFacing/interact (Espaço) usam os dois como sempre. Coordenadas
  // contínuas de tile: o tile (x, y) cobre [x, x + 1) × [y, y + 1).
  const gradeO = new THREE.Vector3();
  function origemDaGrade() {
    gradeO.copy(paraMundo(0, 0));
    gradeO.x -= 0.5;
    gradeO.z -= 0.5;
    return gradeO;
  }
  const bloqueado = (x, y) => !dentro(x, y) || !podeAndar(x, y);
  // Tiles atravessados neste quadro (a corrida confere cada um: num quadro
  // lento a bicicleta não "pula" um checkpoint).
  const tilesNoQuadro = [];
  // Círculo do jogador montado tocando o tile (x, y)? (Os walkers não entram
  // num tile em que a bicicleta já está encostada.)
  function bikeEncosta(x, y) {
    if (!bike.on) return false;
    const o = origemDaGrade();
    const px = player.root.position.x - o.x;
    const py = player.root.position.z - o.z;
    const dx = px - THREE.MathUtils.clamp(px, x, x + 1);
    const dy = py - THREE.MathUtils.clamp(py, y, y + 1);
    return dx * dx + dy * dy < (BIKE_RAIO + 0.05) ** 2;
  }

  // Empurra o círculo (p em coordenadas de tile) para fora dos tiles
  // bloqueados em volta; devolve a normal média do contato (ou null).
  // Na pista, perto do asfalto, quem limita é o corredor contínuo
  // (interior.corredor: distância à linha central até `raio`), não a
  // escadinha dos tiles: os tiles que ele cobre não bloqueiam e o centro é
  // puxado de volta para dentro do raio. Encostando no box (a abertura do
  // muro), vale só a grade, para dar para entrar e sair.
  const nContato = { x: 0, y: 0 };
  function colidir(p) {
    const cor = naPista() ? interior?.corredor : null;
    let nx = 0;
    let ny = 0;
    let tocou = false;
    for (let it = 0; it < 3; it++) {
      let mexeu = false;
      const x0 = Math.floor(p.x - BIKE_RAIO);
      const x1 = Math.floor(p.x + BIKE_RAIO);
      const y0 = Math.floor(p.y - BIKE_RAIO);
      const y1 = Math.floor(p.y + BIKE_RAIO);
      let noBox = false;
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          if (cor?.box(tx, ty)) noBox = true;
          if (!bloqueado(tx, ty) || cor?.cobre(tx, ty)) continue;
          const dx = p.x - THREE.MathUtils.clamp(p.x, tx, tx + 1);
          const dy = p.y - THREE.MathUtils.clamp(p.y, ty, ty + 1);
          const d2 = dx * dx + dy * dy;
          if (d2 >= BIKE_RAIO * BIKE_RAIO) continue;
          let ux;
          let uy;
          let empurra;
          if (d2 > 1e-12) {
            const d = Math.sqrt(d2);
            ux = dx / d;
            uy = dy / d;
            empurra = BIKE_RAIO - d;
          } else {
            // Centro dentro do tile (alguém entrou nele): sai pelo lado mais perto.
            const lados = [
              [p.x - tx, -1, 0],
              [tx + 1 - p.x, 1, 0],
              [p.y - ty, 0, -1],
              [ty + 1 - p.y, 0, 1],
            ].sort((a, b) => a[0] - b[0]);
            [empurra, ux, uy] = lados[0];
            empurra += BIKE_RAIO;
          }
          p.x += ux * empurra;
          p.y += uy * empurra;
          nx += ux;
          ny += uy;
          tocou = mexeu = true;
        }
      }
      const q = cor && !noBox ? cor.perto(p.x, p.y) : null;
      if (q && q.d > cor.raio) {
        const empurra = q.d - cor.raio;
        p.x -= q.nx * empurra;
        p.y -= q.ny * empurra;
        nx -= q.nx;
        ny -= q.ny;
        tocou = mexeu = true;
      }
      if (!mexeu) break;
    }
    if (!tocou) return null;
    const l = Math.hypot(nx, ny) || 1;
    nContato.x = nx / l;
    nContato.y = ny / l;
    return nContato;
  }

  // Cardinal mais perto de um yaw.
  function cardinalDe(yaw) {
    let melhor = "down";
    let dMelhor = Infinity;
    for (const [k, d] of Object.entries(DIRS)) {
      const e = Math.abs(difAngulo(yaw, d.rot));
      if (e < dMelhor) {
        dMelhor = e;
        melhor = k;
      }
    }
    return melhor;
  }

  // O centro entrou no tile (x, y): tudo o que o passo na grade fazia ao
  // pisar num tile. Devolve true se começou uma transição (para de andar).
  function pisouTile(x, y) {
    player.x = x;
    player.y = y;
    player.idle = 0;
    if (coding) stopCoding();
    if (noPredio() && interior.saidaEm(x, y)) {
      usarSaida(interior.saidaEm(x, y));
      return Boolean(transicao);
    }
    if (!noPredio()) {
      veg.rustle(x, y);
      if (!tryFindOcarina(x, y)) tryColeta(x, y);
    } else tryColeta(x, y);
    if (corrida && naPista()) tilesNoQuadro.push(`${x},${y}`);
    return false;
  }

  // Encostado num tile de saída (porta da SEMEC, portão do box, saída de um
  // interior) e empurrando para ele: usa a saída, como o passo na grade.
  function saidaAFrente(x, y) {
    if (!noPredio() && x === SEMEC_PORTA.x && y === SEMEC_PORTA.y) entrarOuSair("terreo");
    else if (naPista() && naSaidaDaPista(x, y)) sairDaPista();
    else if (noPredio() && interior.saidaEm(x, y)) usarSaida(interior.saidaEm(x, y));
    return Boolean(transicao);
  }

  // Caminho do clique (player.path, direções na grade) montado: os centros
  // dos tiles viram waypoints; passa a ~0,8 tile de cada um (corta a quina) e
  // freia para parar no último. Devolve { rumo, vel } ou null (chegou/desistiu).
  function seguirRota(p, dt) {
    if (bike.rotaDe !== player.path) {
      bike.rotaDe = player.path;
      bike.rota = [];
      bike.rotaI = 0;
      bike.rotaPreso = 0;
      let x = player.x;
      let y = player.y;
      for (const dir of player.path) {
        x += DIRS[dir].dx;
        y += DIRS[dir].dy;
        bike.rota.push([x + 0.5, y + 0.5]);
      }
    }
    const r = bike.rota;
    const ultimo = r.length - 1;
    while (bike.rotaI < ultimo && Math.hypot(r[bike.rotaI][0] - p.x, r[bike.rotaI][1] - p.y) < 0.8) bike.rotaI++;
    const [tx, ty] = r[bike.rotaI];
    const d = Math.hypot(tx - p.x, ty - p.y);
    // Preso (parede, alguém no caminho) por mais de 1,2 s: desiste.
    bike.rotaPreso = bike.spd < 0.5 ? bike.rotaPreso + dt : 0;
    if ((bike.rotaI === ultimo && d < 0.3) || bike.rotaPreso > 1.2) {
      player.path = [];
      bike.rota = null;
      bike.rotaDe = null;
      // Alvo do clique (alguém, uma placa): vira para ele parado e conversa.
      const pend = player.pending;
      player.pending = null;
      if (pend) bike.virar = Object.keys(DIRS).find((k) => DIRS[k].dx === pend.x - player.x && DIRS[k].dy === pend.y - player.y) ?? null;
      return null;
    }
    const resto = d + (ultimo - bike.rotaI);
    const rumo = Math.atan2(tx - p.x, ty - p.y);
    let vel = Math.min(BIKE_VMAX, Math.sqrt((2 * BIKE_VMAX * resto) / BIKE_FREIO) * 0.8);
    // Esquina fechada pela frente: entra mais devagar.
    if (Math.abs(difAngulo(rumo, bike.rumo)) > 0.8) vel = Math.min(vel, BIKE_VMAX * 0.45);
    return { rumo, vel };
  }

  const pLivre = { x: 0, y: 0 };
  function pedalarLivre(dt) {
    // Setas de toque perdem a validade (mesmo travado: um toque na contagem
    // não fica guardado para o verde).
    for (const [k, s] of bike.toque) {
      if (s - dt <= 0) bike.toque.delete(k);
      else bike.toque.set(k, s - dt);
    }
    // Pausa: congela tudo (posição, velocidade, rumo).
    if (paused || foco || cutscene.active || dt <= 0) {
      bike.omega = 0;
      return;
    }
    // Travado (íris, contagem, depois da chegada): sem entrada, só freia.
    const travado = Boolean(transicao) || corridaTrava();
    let ix = 0;
    let iy = 0;
    if (!travado) {
      for (const dir of held) {
        ix += DIRS[dir].dx;
        iy += DIRS[dir].dy;
      }
      for (const dir of bike.toque.keys()) {
        if (held.includes(dir)) continue;
        ix += DIRS[dir].dx;
        iy += DIRS[dir].dy;
      }
    }
    const temSeta = ix !== 0 || iy !== 0;
    const o = origemDaGrade();
    const pos = player.root.position;
    pLivre.x = pos.x - o.x;
    pLivre.y = pos.z - o.z;
    let alvoRumo = null;
    let vAlvo = 0;
    if (temSeta) {
      alvoRumo = Math.atan2(ix, iy);
      vAlvo = BIKE_VMAX;
      bike.virar = null;
    } else if (!travado && player.path.length) {
      const r = seguirRota(pLivre, dt);
      if (r) {
        alvoRumo = r.rumo;
        vAlvo = r.vel;
      }
    } else if (!travado && bike.virar && bike.spd < 0.3) {
      // Fim do caminho do clique: vira parado para o alvo e conversa.
      alvoRumo = DIRS[bike.virar].rot;
      if (Math.abs(difAngulo(alvoRumo, bike.rumo)) < 0.03) {
        player.dir = bike.virar;
        bike.virar = null;
        reportFacing();
        interact();
        alvoRumo = null;
      }
    }
    // Giro do rumo, limitado (mais lento quanto mais rápido).
    const taxa = BIKE_GIRO_LENTO + (BIKE_GIRO_RAPIDO - BIKE_GIRO_LENTO) * Math.min(bike.spd / BIKE_VMAX, 1);
    let dRumo = 0;
    if (alvoRumo !== null) {
      let dif = difAngulo(alvoRumo, bike.rumo);
      // Bem atrás: continua virando para o lado em que já virava (sem
      // trocar de lado a cada quadro perto dos 180°) e freia para o U.
      if (Math.abs(dif) > Math.PI - 0.2 && bike.omega) dif = Math.sign(bike.omega) * Math.abs(dif);
      if (Math.abs(dif) > BIKE_U && bike.spd > 0.5) vAlvo = Math.min(vAlvo, BIKE_VMAX * BIKE_U_VEL);
      dRumo = THREE.MathUtils.clamp(dif, -taxa * dt, taxa * dt);
    }
    bike.pedalando = alvoRumo !== null && vAlvo > 0.5;
    if (bike.spd < vAlvo) bike.spd = Math.min(vAlvo, bike.spd + (BIKE_VMAX / BIKE_EMBALO) * dt);
    else bike.spd = Math.max(vAlvo, bike.spd - (BIKE_VMAX / BIKE_FREIO) * dt);
    bike.rumo = difAngulo(bike.rumo + dRumo, 0);
    bike.omega = dRumo / dt;
    // Anda em subpassos, colidindo e conferindo cada tile novo.
    const fx = Math.sin(bike.rumo);
    const fy = Math.cos(bike.rumo);
    const dist = bike.spd * dt;
    const n = Math.max(1, Math.ceil(dist / BIKE_SUBPASSO));
    let contra = 0;
    let andou = 0;
    let mudou = false;
    for (let i = 0; i < n && dist > 0; i++) {
      const ax = pLivre.x;
      const ay = pLivre.y;
      pLivre.x += (fx * dist) / n;
      pLivre.y += (fy * dist) / n;
      const nrm = colidir(pLivre);
      if (nrm) contra = Math.max(contra, -(fx * nrm.x + fy * nrm.y));
      andou += Math.hypot(pLivre.x - ax, pLivre.y - ay);
      const tx = Math.floor(pLivre.x);
      const ty = Math.floor(pLivre.y);
      if (tx === player.x && ty === player.y) continue;
      mudou = true;
      pos.x = pLivre.x + o.x;
      pos.z = pLivre.y + o.z;
      if (pisouTile(tx, ty)) return;
    }
    pos.x = pLivre.x + o.x;
    pos.z = pLivre.y + o.z;
    // Batendo na parede: perde embalo só pelo que passa de BIKE_RASPA no
    // ângulo contra ela (ao quadrado). Raspando a 45° desliza a ~5,8 tiles/s;
    // de frente quase para (~1,5 tile/s de pedalada contra a parede).
    const contraEfetivo = Math.max(0, (contra - BIKE_RASPA) / (1 - BIKE_RASPA));
    if (contraEfetivo > 0) bike.spd = Math.max(0, bike.spd - bike.spd * contraEfetivo ** 2 * BIKE_ATRITO_PAREDE * dt);
    // Pneu no chão a cada ~1 tile rodado.
    bike.pneu += andou;
    if (bike.pneu >= 1) {
      bike.pneu %= 1;
      onSom("pneu");
    }
    // Empurrando contra uma saída (porta, portão): sai, como o passo na grade.
    if (temSeta && !transicao) {
      const alc = BIKE_RAIO + 0.15;
      const sx = Math.floor(pLivre.x + fx * alc);
      const sy = Math.floor(pLivre.y + fy * alc);
      if ((sx !== player.x || sy !== player.y) && saidaAFrente(sx, sy)) return;
    }
    // Cardinal de frente: o mais perto do rumo, trocando só depois de passar
    // ~5° da diagonal (sem piscar a dica "Espaço: …" na diagonal exata).
    let virou = false;
    if (Math.abs(difAngulo(bike.rumo, DIRS[player.dir].rot)) > Math.PI / 4 + 0.08) {
      player.dir = cardinalDe(bike.rumo);
      virou = true;
    }
    if (mudou || virou) reportFacing();
  }

  // ---- Giro visual (a pé) -------------------------------------------------------
  // O yaw lógico (player.dir → root.rotation.y) muda na hora, como sempre;
  // o visual persegue-o pelo lado mais curto (player.giro guarda a diferença).
  // Travado (= lógico) com movimento reduzido, em transições, cenas e
  // sentado, onde quem gira o root é o código daquele trecho. Montado não
  // roda: o rumo contínuo já é o yaw do root (pedalarLivre).
  let yawVisual = player.root.rotation.y;
  let assento = null; // { de, ate, t, dur }: assentando no centro do tile ao descer
  const VOLTA = Math.PI * 2;
  const difAngulo = (a, b) => {
    const d = (a - b) % VOLTA;
    return d > Math.PI ? d - VOLTA : d < -Math.PI ? d + VOLTA : d;
  };
  function giroVisual(dt) {
    const logico = player.root.rotation.y;
    if (reducedMotion || transicao || cutscene.active || sentados.has(player.body) || dt <= 0) yawVisual = logico;
    else {
      const passo = THREE.MathUtils.clamp(
        difAngulo(logico, yawVisual) * (1 - Math.exp(-dt * GIRO_TAXA)),
        -GIRO_MAX * dt,
        GIRO_MAX * dt
      );
      yawVisual += passo;
    }
    player.giro.rotation.y = difAngulo(yawVisual, logico);
  }

  // Caminhada: crossfade entre a pose parada (1º quadro da `entrada`, ou a
  // `parado` dos jogadores novos) e a
  // clip `andando`, acelerada para casar com a velocidade do passo em grade.
  // Andando sozinho (porta, elevador): a velocidade de verdade (m/s), para a
  // clip acompanhar o chão; 0 no passo normal da grade.
  let velAuto = 0;
  function walkTimeScale() {
    const dur = player.run ? STEP_RUN : STEP_WALK;
    const natural = walkStride / walkCycle; // m/s da clip em 1x
    if (velAuto) return Math.min(velAuto / natural, WALK_AUTO_TIMESCALE);
    return Math.min(1 / dur / natural, WALK_MAX_TIMESCALE);
  }

  function startWalk() {
    walking = true;
    // Montado, a cadência (e o congelar do pedivela) é do embalo (pilotarBike).
    if (bike.on) return;
    const walk = actions?.andando;
    if (!walk) return;
    walk.timeScale = walkTimeScale();
    if (walk.isRunning() && walk.getEffectiveWeight() > 0.99) return;
    walk.enabled = true;
    walk.setEffectiveWeight(1);
    walk.play();
    walk.crossFadeFrom(actions.pose, 0.12, false);
  }

  // Pose de descanso: a `parado` em loop (parada no 1º quadro com movimento
  // reduzido) ou o 1º quadro da `entrada` do Gava.
  function playPose() {
    actions.pose.reset().play();
    actions.pose.paused = !actions.parado || reducedMotion;
  }

  function stopWalk() {
    walking = false;
    if (bike.on) return;
    const walk = actions?.andando;
    if (!walk || coding) return;
    playPose();
    actions.pose.crossFadeFrom(walk, 0.15, false);
  }

  function startCoding() {
    if (!actions?.digitando || coding) return;
    coding = true;
    // Vira para a câmera: o notebook fica de frente para quem joga.
    face("down");
    if (laptop) laptop.visible = true;
    actions.digitando.stop();
    actions.andando?.stop();
    actions.entrada.reset().play();
    if (reducedMotion) {
      actions.entrada.time = actions.entrada.getClip().duration;
    }
  }

  function stopCoding() {
    coding = false;
    laptopPose = null;
    if (!actions) {
      if (laptop) laptop.visible = false;
      return;
    }
    actions.digitando?.stop();
    // Pose de caminhada = primeiro quadro da `entrada` (braços baixos).
    playPose();
    if (laptop) laptop.visible = false;
    mixer.update(0);
  }

  // ---- Destaque do tile sob o mouse -----------------------------------------
  const hover = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.9, 0.9)),
    track(new THREE.MeshBasicMaterial({ color: pal.white, transparent: true, opacity: 0.35, depthWrite: false }))
  );
  hover.rotation.x = -Math.PI / 2;
  hover.position.y = 0.012;
  hover.visible = false;
  scene.add(hover);

  // ---- Regras de movimento ----------------------------------------------------
  const inBounds = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const passable = (x, y) => inBounds(x, y) && WALKABLE.has(map[y][x]) && !occupied.has(`${x},${y}`);

  // ---- Galeria da Equipe: o jogador anda na grade do lugar em que está -------
  let local = "vila";
  // Interiores do prédio (térreo, andares e Galeria), criados na visita; só
  // os dois mais recentes ficam guardados (guardarSoRecentes). `interior` é
  // o atual (null na Vila).
  const interiores = new Map();
  let interior = null;
  let transicao = null; // { para, t, fase, de, ate }
  let foco = null; // id do quadro com a câmera em close
  let voltaDoFoco = 0; // segundos de câmera suave depois de fechar o close
  let snapCamera = false;
  // Elevador: dolly da câmera (multiplica a distância) e as portas que fecham
  // atrás de quem já saiu (o jogador anda livre enquanto isso).
  let zoomElevador = 1;
  let zoomElevadorAlvo = 1;
  let dollyVolta = null; // { de, t, dur }: recuo da câmera na saída da cabine
  let portaFechando = null; // { interior, t }
  const camLook = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  // "Prédio" = qualquer interior (andares, Galeria e a pista de corrida): a
  // grade, o mundo e o render passam a ser os dele. A pista tem regras
  // próprias (naPista): bicicleta liberada, sem desmontar sozinho.
  const noPredio = () => local !== "vila";
  const naPista = () => local === "pista";
  const paraMundo = (x, y) => (noPredio() ? interior.tileToWorld(x, y) : tileToWorld(x, y));
  const podeAndar = (x, y) => (noPredio() ? interior.passable(x, y) : passable(x, y));
  const dentro = (x, y) => (noPredio() ? interior.inBounds(x, y) : inBounds(x, y));

  function frontOf() {
    const d = DIRS[player.dir];
    return { x: player.x + d.dx, y: player.y + d.dy };
  }

  function targetAt(x, y) {
    if (noPredio()) {
      const pessoa = interior.pessoaEm?.(x, y);
      if (pessoa) return { type: "pessoa", id: pessoa.id };
      const saida = interior.saidaEm(x, y);
      if (saida) return { type: "saida", saida };
      const quadro = interior.quadroNaParede?.(x, y);
      if (quadro) return { type: "quadro", id: quadro };
      const info = interior.infoEm?.(x, y);
      return info ? { type: "info", info } : null;
    }
    if (x === SEMEC_PORTA.x && y === SEMEC_PORTA.y) return { type: "porta" };
    const npc = occupied.get(`${x},${y}`);
    if (npc) return { type: npc.isWalker ? "pedro" : "npc", npc };
    const sign = SIGNS.find((sg) => sg.x === x && sg.y === y);
    if (sign) return { type: "sign", sign };
    // Bicicletário da praça do Front-End: a oficina da bicicleta (minigame).
    if (x === BICICLETARIO.x && y === BICICLETARIO.y) return { type: "sign", sign: { id: "bicicletario" } };
    return null;
  }

  let lastFacingKey = "";
  function reportFacing() {
    const f = frontOf();
    const t = targetAt(f.x, f.y);
    // Personagem 3D ou mascote (Pedro, duplas): Espaço abre a ficha dele.
    const inspectId = t?.type === "pedro" ? (t.npc.inspectId ?? t.npc.id ?? null) : null;
    let key = "";
    if (inspectId) key = `inspect:${inspectId}`;
    else if (t?.type === "npc") key = `npc:${t.npc.treinador ?? t.npc.index}`;
    else if (t?.type === "sign") key = `sign:${t.sign.id}`;
    else if (t?.type === "pessoa" || t?.type === "quadro") key = `${t.type}:${t.id}`;
    else if (t?.type === "info") key = `info:${t.info.id}`;
    else if (t?.type === "porta") key = t.type;
    else if (t?.type === "saida") key = `saida:${t.saida}`;
    if (key === lastFacingKey) return;
    lastFacingKey = key;
    if (noPredio()) interior.setPerto?.(t?.type === "quadro" ? t.id : null);
    if (t?.type === "pessoa") return onFacing({ type: "museu-pessoa", id: t.id });
    if (t?.type === "quadro") return onFacing({ type: "quadro", id: t.id });
    if (t?.type === "info") return onFacing({ type: "info", id: t.info.id, titulo: t.info.titulo });
    if (t?.type === "porta") return onFacing({ type: "porta" });
    if (t?.type === "saida") return onFacing({ type: "saida", saida: t.saida });
    if (inspectId) onFacing({ type: "inspect", id: inspectId });
    else if (t?.type === "npc" && t.npc.treinador) onFacing({ type: "treinador", id: t.npc.treinador });
    else if (t?.type === "npc") onFacing({ type: "npc", index: t.npc.index });
    else if (t?.type === "sign") onFacing({ type: "sign", id: t.sign.id });
    else onFacing(null);
  }

  function face(dir) {
    player.dir = dir;
    player.root.rotation.y = DIRS[dir].rot;
    // Montado (teleportes da pista, cenas): o rumo contínuo vai junto.
    if (bike.on) bike.rumo = DIRS[dir].rot;
    reportFacing();
  }

  // Passo na grade (a pé; montado, quem anda é pedalarLivre).
  function tryStep(dir) {
    const d = DIRS[dir];
    const nx = player.x + d.dx;
    const ny = player.y + d.dy;
    if (player.dir !== dir) face(dir);
    // Subir a escada da SEMEC entra na galeria; pisar na porta dela sai.
    if (!noPredio() && nx === SEMEC_PORTA.x && ny === SEMEC_PORTA.y) {
      entrarOuSair("terreo");
      return false;
    }
    if (noPredio() && interior.saidaEm(nx, ny)) {
      usarSaida(interior.saidaEm(nx, ny));
      return false;
    }
    // Pista: o portão do box (corrida.saidaVila) leva de volta à Vila.
    if (naPista() && naSaidaDaPista(nx, ny)) {
      sairDaPista();
      return false;
    }
    if (!podeAndar(nx, ny)) return false;
    const dur = player.run ? STEP_RUN : STEP_WALK;
    // Ainda assentando depois de descer da bicicleta: parte de onde está.
    const from = assento ? player.root.position.clone() : paraMundo(player.x, player.y);
    assento = null;
    player.move = { from, to: paraMundo(nx, ny), t: 0, dur, dir };
    player.x = nx;
    player.y = ny;
    if (!noPredio()) veg.rustle(nx, ny);
    if (coding) stopCoding();
    player.idle = 0;
    onSom(somDoPasso(nx, ny));
    return true;
  }
  // Som do passo pelo chão: grama/mato, calçada, madeira (Galeria), carpete.
  function somDoPasso(x, y) {
    if (interior?.piso === "asfalto") return "passo-pedra";
    if (noPredio()) return interior?.galeria || local === "galeria" ? "passo-madeira" : "passo-carpete";
    return map[y]?.[x] === PATH ? "passo-pedra" : "passo-grama";
  }

  function paintMarker(npc, color) {
    npc.marker.material.color.copy(color);
    npc.marker.material.emissive.copy(color);
  }

  // Ocarina: achada ao pisar no tile (ou de frente para ele, com Espaço).
  function tryFindOcarina(x, y) {
    if (questEtapa !== "procurando" || x !== OCARINA_SPOT.x || y !== OCARINA_SPOT.y) return false;
    questEtapa = "achou";
    ocarina?.pop(player.root.position);
    ocarina?.setEtapa("achou");
    questMarker.setEtapa("achou");
    onQuestFind();
    return true;
  }

  // Item de quest de coleta: pisou no tile (ou de frente, com Espaço). Quem
  // decide se coleta é a interface (a página do Zé pede a resposta certa).
  function tryColeta(x, y) {
    const hit = coletaAqui()?.itemAt(x, y) ?? null;
    if (hit) onColeta(hit);
    return Boolean(hit);
  }

  function interact() {
    const f = frontOf();
    const t = targetAt(f.x, f.y);
    if (t?.type === "porta") return entrarOuSair("terreo");
    if (t?.type === "saida") return usarSaida(t.saida);
    if (t?.type === "quadro") return abrirQuadro(t.id);
    if (t?.type === "info") return onInfo(t.info);
    if (t?.type === "pessoa") {
      interior.falar(t.id, DIRS[OPPOSITE[player.dir]].rot);
      onInspect({ id: t.id, museu: true });
      return;
    }
    // No prédio, Espaço de frente para um item de quest (bug de um andar).
    if (noPredio()) {
      if (!t) tryColeta(f.x, f.y);
      return;
    }
    if (!t) {
      if (!tryFindOcarina(f.x, f.y)) tryColeta(f.x, f.y);
      return;
    }
    if (t.type === "pedro") {
      t.npc.talk(DIRS[OPPOSITE[player.dir]].rot);
      // Ficha de quem está no tile: marca do dono/mascote (companion.js
      // `inspectId`) ou o próprio Pedro (`id`).
      const id = t.npc.inspectId ?? t.npc.id ?? t.npc.group?.id;
      if (id) onInspect({ id });
      return;
    }
    if (t.type === "npc" && t.npc.isQuestNpc) {
      t.npc.talk(DIRS[OPPOSITE[player.dir]].rot);
      onInteract({ type: "npc", index: t.npc.index });
      return;
    }
    if (t.type === "npc") {
      const npc = t.npc;
      npc.dir = OPPOSITE[player.dir];
      npc.fig.rotation.y = DIRS[npc.dir].rot;
      // Chefe 3D: o mascote se exibe para o jogador.
      if (npc.boneco) walkers.find((w) => w.id === npc.boneco)?.cheer();
      if (!npc.talked) {
        npc.talked = true;
        // Líder só ganha o "✓" quando o ginásio é vencido (setLeadersDone).
        if (!npc.leader) paintMarker(npc, pal.markerDone);
      }
      if (npc.treinador) onInteract({ type: "treinador", id: npc.treinador });
      else onInteract({ type: "npc", index: npc.index });
    } else {
      onInteract({ type: "sign", id: t.sign.id });
    }
  }

  // Busca em largura até o tile (ou até um vizinho, se o alvo bloqueia).
  function findPath(tx, ty) {
    const goalIsBlocked = !podeAndar(tx, ty);
    const isGoal = (x, y) =>
      goalIsBlocked ? Math.abs(x - tx) + Math.abs(y - ty) === 1 : x === tx && y === ty;
    const startKey = `${player.x},${player.y}`;
    const prev = new Map([[startKey, null]]);
    const queue = [[player.x, player.y]];
    while (queue.length) {
      const [x, y] = queue.shift();
      if (isGoal(x, y)) {
        const dirs = [];
        let key = `${x},${y}`;
        while (prev.get(key)) {
          const { from, dir } = prev.get(key);
          dirs.unshift(dir);
          key = from;
        }
        return dirs;
      }
      for (const [dir, d] of Object.entries(DIRS)) {
        const nx = x + d.dx;
        const ny = y + d.dy;
        const k = `${nx},${ny}`;
        if (prev.has(k) || !dentro(nx, ny) || !podeAndar(nx, ny)) continue;
        prev.set(k, { from: `${x},${y}`, dir });
        queue.push([nx, ny]);
      }
    }
    return null;
  }

  // ---- Prédio da SEMFAZ: entrada, saída, elevador e close nas fotos ---------
  // Interior de um andar (predio/andares.js): a Galeria da Equipe é o museu
  // (scene/museu/); os outros são escritórios (predio/escritorio.js). Os dois
  // guardam e descartam os próprios recursos (o escritório vai sem o `track`
  // do motor, e o cache da mobília, que é por `track`, vai junto).
  function obterInterior(id) {
    if (interiores.has(id)) return interiores.get(id);
    // A pista de corrida entra no mesmo LRU dos andares (guardarSoRecentes).
    if (id === "pista") {
      const pista = createPista({ pal, lite, reducedMotion });
      interiores.set(id, pista);
      return pista;
    }
    const andar = andarPorId(id);
    const novo = andar.galeria
      ? createMuseu({
          loader,
          baseUrl: modelUrl ? modelUrl.replace(/gava\.glb$/, "") : "",
          pal,
          lite,
          reducedMotion,
          quadros: quadrosMuseu,
        })
      : createEscritorio({ andar, pal, lite, reducedMotion });
    interiores.set(id, novo);
    ligarColetaInterior(novo, id);
    return novo;
  }

  // Quests de coleta dentro de um interior (andar `id`): uma instância de
  // createColetaveis na cena dele (com o tileToWorld dele) com os itens
  // daquele andar, e o cristal das quests dadas ali (`q.local`) sobre a
  // pessoa (raizPessoa, só a Galeria tem). Como o interior pode ser
  // descartado e recriado (LRU, guardarSoRecentes), o estado vem do último
  // setColeta (estadosColeta) e é reaplicado aqui.
  const coletaDoInterior = new Map(); // interior → { coleta, recursos, marcadores: [qc] }
  function ligarColetaInterior(int, id) {
    const recursos = [];
    const trackInt = (x) => {
      recursos.push(x);
      return x;
    };
    let coleta = null;
    const marcadores = [];
    for (const qc of questsColeta) {
      const q = qc.quest;
      const itens = q.itens.filter((i) => localDoItem(i) === id);
      if (itens.length) {
        coleta ??= createColetaveis({ scene: int.scene, pal, track: trackInt, tileToWorld: int.tileToWorld, reducedMotion });
        coleta.add(q.id, itens, tipoDoItem(q));
        const e = estadosColeta.get(q.id);
        if (e) coleta.set(q.id, { visivel: e.etapa === "coletando", coletados: e.itens });
      }
      const raiz = q.local === id ? int.raizPessoa?.(q.npc) : null;
      if (raiz) {
        raiz.add(qc.marker.object);
        marcadores.push(qc);
      }
    }
    if (coleta || marcadores.length) coletaDoInterior.set(int, { coleta, recursos, marcadores });
  }
  // Antes do dispose do interior: tira o cristal (é do motor e volta na
  // próxima Galeria) e descarta os recursos dos itens do andar.
  function desligarColetaInterior(int) {
    const c = coletaDoInterior.get(int);
    if (!c) return;
    coletaDoInterior.delete(int);
    for (const qc of c.marcadores) {
      qc.marker.object.removeFromParent();
      if (qc.perto) {
        qc.perto = false;
        onColetaPerto({ quest: qc.quest.id, perto: false });
      }
    }
    for (const r of c.recursos) r.dispose?.();
  }
  // Coletáveis de onde o jogador está: os da Vila ou os do interior atual.
  const coletaAqui = () => (noPredio() ? (coletaDoInterior.get(interior)?.coleta ?? null) : coletaveis);

  // Em PC fraco (vídeo integrado, 8 GB), guardar os 7 interiores pesa: cada
  // escritório tem ~20-28 MB de texturas (fotos, placas, carpete) e a Galeria
  // ~60 MB, fora o mapa de sombra 2048² de cada um nos níveis com sombra.
  // Ficam só o atual e o anterior (ida e volta pelo elevador ou à rua sem
  // reconstruir); os outros são descartados e refeitos na próxima visita.
  // Na viagem de elevador o destino já existe (prepararDestino): ficam 3 até
  // a troca, que chama guardarSoRecentes e volta a 2.
  const MAX_INTERIORES = 2;
  function guardarSoRecentes(atual) {
    // Map mantém a ordem de inserção: reinserir o atual o põe no fim (LRU).
    const atualObj = interiores.get(atual);
    if (atualObj) {
      interiores.delete(atual);
      interiores.set(atual, atualObj);
    }
    while (interiores.size > MAX_INTERIORES) {
      const [id, velho] = interiores.entries().next().value;
      if (velho === interior) break;
      interiores.delete(id);
      descartarInterior(velho);
    }
  }
  function descartarInterior(i) {
    // As luzes guardam o mapa de sombra (render target); o dispose do
    // interior não as alcança.
    const luzes = [];
    i.scene.traverse((o) => {
      if (o.isLight) luzes.push(o);
    });
    desligarColetaInterior(i);
    i.dispose();
    for (const l of luzes) l.dispose?.();
  }

  // ---- Pré-carregamento do destino do elevador ---------------------------------
  // Criar o andar e a 1ª renderização dele (shaders, texturas, mapa de sombra,
  // os GLBs do time na Galeria) travavam a chegada. Agora o destino é criado
  // no clique e aquecido enquanto o jogador está no elevador, um passo por
  // quadro (avancarPreparo): espera os GLBs (`pronto()` do museu), compila os
  // materiais, sobe as texturas aos poucos e, com a tela já escura, roda o
  // primeiro `update` e faz um render do destino fora da tela (o render
  // normal do quadro o cobre). Compilar e subir texturas só acontece com a
  // cena ainda visível quando o navegador compila shaders em paralelo
  // (KHR_parallel_shader_compile); sem isso, cada shader trava o quadro e
  // tudo fica para o escuro. A troca de cena espera o destino pronto, até
  // PREPARO_ESPERA_MAX no escuro.
  const aquecidos = new WeakSet();
  const camPreparo = new THREE.PerspectiveCamera();
  const compilaEmParalelo = renderer.extensions.has("KHR_parallel_shader_compile");
  let preparo = null; // { id, destino, fase, cargas, pronto, ocupado, inicio, texturas, i }
  function prepararDestino(id) {
    if (disposed || preparo?.id === id) return;
    const destino = obterInterior(id);
    const p = { id, destino, fase: "cargas", cargas: !destino.pronto, pronto: aquecidos.has(destino), ocupado: false, inicio: performance.now(), texturas: null, i: 0 };
    preparo = p;
    destino.pronto?.().then(() => {
      p.cargas = true;
    });
  }
  // Câmera do primeiro quadro no destino: perto da cabine, como na chegada.
  function posicionarCamPreparo(d) {
    camPreparo.copy(camera, false);
    const alvo = d.cabine ?? d.tileToWorld(d.chegada.x, d.chegada.y);
    camPreparo.position.copy(alvo).addScaledVector(CAM_OFFSET, (camera.userData.far || 1) * MUSEU_ZOOM * userZoom * ELEVADOR_ZOOM);
    camPreparo.lookAt(alvo.x, alvo.y + 0.4, alvo.z);
    camPreparo.updateMatrixWorld();
  }
  function texturasDe(cena) {
    const set = new Set();
    cena.traverse((o) => {
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) for (const v of Object.values(m)) if (v?.isTexture) set.add(v);
    });
    return [...set];
  }
  // `escuro`: a tela já está toda coberta (o render fora da tela não aparece).
  function avancarPreparo(escuro) {
    const p = preparo;
    if (!p || p.pronto || p.ocupado || disposed) return;
    if (p.fase === "cargas") {
      if (!p.cargas && performance.now() - p.inicio < PREPARO_CARGAS_MAX) return;
      if (!compilaEmParalelo && !escuro) return;
      p.fase = "compilar";
      posicionarCamPreparo(p.destino);
      if (!compilaEmParalelo) {
        renderer.compile(p.destino.scene, camPreparo);
        p.fase = "texturas";
        return;
      }
      p.ocupado = true;
      const fim = () => {
        p.ocupado = false;
        p.fase = "texturas";
      };
      renderer.compileAsync(p.destino.scene, camPreparo).then(fim, fim);
    } else if (p.fase === "texturas") {
      if (!compilaEmParalelo && !escuro) return;
      p.texturas ??= texturasDe(p.destino.scene);
      const t0 = performance.now();
      while (p.i < p.texturas.length && performance.now() - t0 < PREPARO_TEXTURAS_MS) renderer.initTexture(p.texturas[p.i++]);
      if (p.i >= p.texturas.length) p.fase = "render";
    } else if (p.fase === "render" && escuro) {
      // Com o jogador dentro: compila também os materiais dele (e a sombra)
      // com as luzes do destino.
      const d = p.destino;
      const pai = player.root.parent;
      const pos = vPreparo.copy(player.root.position);
      d.scene.add(player.root);
      player.root.position.copy(d.cabine ?? d.tileToWorld(d.chegada.x, d.chegada.y));
      // O 1º update (mixers do time, ligações das clips) também pesa.
      d.update?.(t, 0);
      posicionarCamPreparo(d);
      renderer.render(d.scene, camPreparo);
      // Lê 1 pixel: obriga a GPU a terminar a fila (uploads e compilações
      // pesariam nos primeiros quadros visíveis); no escuro, não aparece.
      sincronizarGpu();
      pai?.add(player.root);
      player.root.position.copy(pos);
      p.pronto = true;
      aquecidos.add(d);
    }
  }
  const vPreparo = new THREE.Vector3();
  const vCamPos = new THREE.Vector3();
  const qCam = new THREE.Quaternion();
  const pixelPreparo = new Uint8Array(4);
  // Lê 1 pixel da tela: espera a GPU terminar tudo o que já foi pedido.
  function sincronizarGpu() {
    const gl = renderer.getContext();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelPreparo);
  }

  // ---- Preparo da Vila (antes de jogar) -----------------------------------------
  // A tela de título já mostra a Vila de longe, mas os GLBs chegam aos poucos e
  // o 1º quadro perto do jogador ainda compila shaders e sobe texturas (o
  // engasgo do começo). O preparo roda na tela de título, um passo por quadro
  // (avancarPreparoVila, no tick): espera todas as cargas da Vila e o boneco
  // do jogador, compila a cena vista de perto do jogador (em paralelo, se o
  // navegador deixar), sobe as texturas aos poucos e faz um render fora da
  // tela (o render normal do quadro o cobre) seguido de um sincronizarGpu.
  // api.preparar() devolve a promessa; trocar o boneco refaz o preparo.
  let preparoVila = null; // { fase, texturas, i, ocupado, resolver, promessa }
  function prepararVila() {
    if (preparoVila) return preparoVila.promessa;
    let resolver;
    const promessa = new Promise((r) => (resolver = r));
    preparoVila = { fase: "cargas", texturas: null, i: 0, ocupado: false, resolver, promessa };
    return promessa;
  }
  function posicionarCamJogador() {
    camPreparo.copy(camera, false);
    const alvo = player.root.position;
    camPreparo.position.copy(alvo).addScaledVector(CAM_OFFSET, (camera.userData.far || 1) * userZoom);
    camPreparo.lookAt(alvo.x, alvo.y + 0.4, alvo.z);
    camPreparo.updateMatrixWorld();
  }
  let ultimoAviso = "";
  function avisarPreparo(fase, progresso) {
    const chave = `${fase}:${Math.round(progresso * 100)}`;
    if (chave === ultimoAviso) return;
    ultimoAviso = chave;
    onPreparo({ fase, progresso });
  }
  // Com a tela de carregamento por cima (setCarregando), o preparo também
  // monta e aquece por dentro a entrada da SEMEC (e a Galeria, fora dos níveis
  // leves: ela pesa ~60 MB de texturas), pelo mesmo caminho do elevador
  // (prepararDestino/avancarPreparo com a tela "escura"); a 1ª visita abre na
  // hora. Sem a tela (boneco trocado depois), só a Vila.
  const PREDIOS_NA_CARGA = lite ? ["terreo"] : ["terreo", "galeria"];
  let capa = carregando; // tela de carregamento por cima do jogo
  const faixa = (de, ate, f) => de + (ate - de) * Math.min(Math.max(f, 0), 1);
  function avancarPreparoVila() {
    const p = preparoVila;
    if (!p || p.fase === "pronto" || p.ocupado || disposed || noPredio()) return;
    if (p.fase === "cargas") {
      const { total, feitas } = cargasVila;
      avisarPreparo("cargas", faixa(0, 0.55, total ? feitas / total : 0));
      if (feitas < total || !jogadorPronto) return;
      p.fase = "compilar";
      avisarPreparo("compilar", 0.6);
      posicionarCamJogador();
      if (!compilaEmParalelo) {
        renderer.compile(scene, camPreparo);
        p.fase = "texturas";
        return;
      }
      p.ocupado = true;
      const fim = () => {
        p.ocupado = false;
        p.fase = "texturas";
      };
      renderer.compileAsync(scene, camPreparo).then(fim, fim);
    } else if (p.fase === "texturas") {
      p.texturas ??= texturasDe(scene);
      // Debaixo da tela de carregamento, fatias maiores (ninguém vê o quadro).
      const orcamento = capa ? 40 : PREPARO_TEXTURAS_MS;
      const t0 = performance.now();
      while (p.i < p.texturas.length && performance.now() - t0 < orcamento) renderer.initTexture(p.texturas[p.i++]);
      avisarPreparo("texturas", faixa(0.6, 0.7, p.i / Math.max(p.texturas.length, 1)));
      if (p.i >= p.texturas.length) p.fase = "render";
    } else if (p.fase === "render") {
      // Render fora da tela pelo caminho de verdade (sombra, névoa e
      // pós-processamento: programas que o compileAsync não cobre), de perto
      // do jogador e da vitrine da tela de título, e espera a GPU; o tick
      // refaz a luz da câmera de verdade logo depois.
      vCamPos.copy(camera.position);
      qCam.copy(camera.quaternion);
      posicionarCamJogador();
      camera.position.copy(camPreparo.position);
      camera.quaternion.copy(camPreparo.quaternion);
      camera.updateMatrixWorld();
      lighting.update(player.root.position, (camera.userData.far || 1) * userZoom);
      lighting.desenhar();
      camera.position.copy(vCamPos);
      camera.quaternion.copy(qCam);
      camera.updateMatrixWorld();
      lighting.update(camTarget, (camera.userData.far || 1) * zoom);
      lighting.desenhar();
      sincronizarGpu();
      p.predio = 0;
      p.fase = capa && modelUrl ? "predios" : "pronto";
      if (p.fase === "pronto") {
        avisarPreparo("pronto", 1);
        p.resolver();
      }
    } else if (p.fase === "predios") {
      const id = PREDIOS_NA_CARGA[p.predio];
      if (!id || !capa) {
        p.fase = "pronto";
        avisarPreparo("pronto", 1);
        p.resolver();
        return;
      }
      const de = 0.72 + (0.27 * p.predio) / PREDIOS_NA_CARGA.length;
      const ate = 0.72 + (0.27 * (p.predio + 1)) / PREDIOS_NA_CARGA.length;
      if (preparo?.id !== id) prepararDestino(id);
      const etapa = { cargas: 0, compilar: 0.35, texturas: 0.6, render: 0.9 }[preparo.fase] ?? 0;
      avisarPreparo("predios", faixa(de, ate, preparo.pronto ? 1 : etapa));
      if (preparo.pronto) p.predio++;
      else avancarPreparo(true);
    }
  }


  // Porta da rua (térreo) ou elevador: o tile de saída do interior atual.
  function usarSaida(tipo) {
    if (naPista()) sairDaPista();
    else if (tipo === "rua") entrarOuSair("vila");
    else if (tipo === "elevador") {
      held.length = 0;
      player.path = [];
      onElevador({ andar: local });
    }
  }

  // Tile do elevador (ou da porta) atrás de um ponto de chegada.
  const atrasDe = (c) => ({ x: c.x - DIRS[c.dir].dx, y: c.y - DIRS[c.dir].dy });
  const rotuloDe = (para) => {
    if (para === "pista") return "Pista de corrida";
    const andar = para === "vila" ? null : andarPorId(para);
    return andar ? `${andar.rotulo} · ${andar.nome}` : "Vila SEMEC";
  };

  // `para`: id do andar ou "vila". `modo`: "porta" (rua) ou "elevador".
  let catracaT = 0;
  function entrarOuSair(para, modo = "porta") {
    if (transicao || cutscene.active || para === local) return;
    if (modo === "porta") onSom("porta");
    held.length = 0;
    player.path = [];
    player.pending = null;
    player.idle = 0;
    if (coding) stopCoding();
    hover.visible = false;
    // Anda até o batente: na Vila, a porta no alto da escada; dentro, a porta
    // da rua ou o elevador (que abre antes).
    let ate;
    if (!noPredio()) ate = tileToWorld(SEMEC_PORTA.x, SEMEC_PORTA.y).add(new THREE.Vector3(0, 0, 0.2));
    else if (modo === "elevador") {
      // Até o meio da cabine (escritórios e Galeria); sem cabine, até o tile
      // atrás da chegada.
      const e = atrasDe(interior.chegada);
      ate = interior.cabine ? interior.cabine.clone() : interior.tileToWorld(e.x, e.y);
      face(OPPOSITE[interior.chegada.dir]);
      fecharPortaAtras(true);
      dollyVolta = null;
    } else {
      const r = atrasDe(interior.entradaRua ?? interior.chegada);
      ate = interior.tileToWorld(r.x, r.y);
      interior.abrirPorta(1);
    }
    transicao = { para, modo, t: 0, fase: "fechar", de: player.root.position.clone(), ate };
    if (modo === "elevador") {
      transicao.etapas = reducedMotion ? ELEVADOR_IDA_RAPIDA : ELEVADOR_IDA;
      transicao.i = -1;
      transicao.deAndar = andarPorId(local)?.numero ?? 0;
      transicao.ateAndar = andarPorId(para)?.numero ?? 0;
      transicao.sentido = transicao.ateAndar >= transicao.deAndar ? 1 : -1;
      // Partida e chegada dividem a contagem dos andares no display.
      const viagem = deslizeDoElevador(Math.abs(transicao.ateAndar - transicao.deAndar));
      transicao.durPartir = reducedMotion ? ELEVADOR_IDA_RAPIDA.at(-1)[1] : viagem.partir;
      transicao.durChegar = reducedMotion ? ELEVADOR_VOLTA_RAPIDA[0][1] : viagem.chegar;
      // O andar de destino já nasce agora e aquece durante a ida.
      prepararDestino(para);
      proximaEtapa(transicao);
      // A interface só esconde a dica (a tela escurece na partida).
      avisarElevador(transicao, "chamar");
      return;
    }
    onTransicao({ fase: "fechar", para, modo, rotulo: rotuloDe(para) });
  }

  // ---- Viagem de elevador, etapa por etapa (ELEVADOR_IDA / _VOLTA) --------------
  const TAU = Math.PI * 2;
  // Interface (VilaSemec.jsx): a tela escurece ("fechar") e clareia ("abrir").
  const avisarElevador = (tr, fase) => onTransicao({ fase, para: tr.para, modo: tr.modo, rotulo: rotuloDe(tr.para) });
  const anguloDe = (de, ate) => Math.atan2(ate.x - de.x, ate.z - de.z);
  const rotuloDoNumero = (n) => ANDARES.find((a) => a.numero === n)?.rotulo ?? "";
  const easeIn = (k) => k * k * k;
  const easeOut = (k) => 1 - (1 - k) ** 3;
  // Deslize vertical da câmera na viagem (tickMuseu soma na posição e no alvo).
  let deslizeElevador = 0;
  // Display acima da porta: conta os andares de `u` 0 (saindo) a 1 (chegou).
  function contarAndares(tr, u) {
    if (reducedMotion) return;
    const n = Math.abs(tr.ateAndar - tr.deAndar);
    const idx = Math.min(n, Math.floor(u * n + 0.5));
    interior.displayElevador?.(rotuloDoNumero(tr.deAndar + tr.sentido * idx), tr.sentido);
  }
  // Duração de "entrar"/"sair": a distância no passo de ELEVADOR_VEL.
  const duracaoDoPasso = (de, ate) => THREE.MathUtils.clamp(de.distanceTo(ate) / ELEVADOR_VEL, 0.25, 0.75);
  function proximaEtapa(tr) {
    tr.i += 1;
    tr.t = 0;
    velAuto = 0;
    if (tr.i >= tr.etapas.length) {
      // Fim da chegada: o controle volta e as portas fecham atrás.
      transicao = null;
      deslizeElevador = 0;
      // (Já fechando se ele saiu do vão antes do fim.)
      portaFechando ??= { interior, t: 0 };
      onTransicao(null);
      reportFacing();
      return;
    }
    const [nome, dur] = tr.etapas[tr.i];
    tr.etapa = nome;
    tr.dur = dur;
    tr.avisou = false;
    if (nome === "abrir") tr.porta = 0;
    if (tr.fase !== "abrir") {
      if (nome === "chamar") interior.sinalElevador?.("chamando");
      else if (nome === "abrir") {
        interior.sinalElevador?.("ding");
        onSom("elevador-ding");
        onSom("elevador-porta");
      } else if (nome === "fechar") onSom("elevador-porta");
      else if (nome === "entrar") {
        tr.de = player.root.position.clone();
        if (!dur) tr.dur = duracaoDoPasso(tr.de, tr.ate);
        // Anda olhando para onde vai (na diagonal, se veio do tile ao lado).
        if (tr.de.distanceToSquared(tr.ate) > 1e-4) player.root.rotation.y = anguloDe(tr.de, tr.ate);
        if (!reducedMotion) zoomElevadorAlvo = ELEVADOR_ZOOM;
      } else if (nome === "virar") {
        // Na cabine: dá meia-volta de frente para a porta (sem cabine, não gira).
        tr.rot0 = player.root.rotation.y;
        const alvo = DIRS[interior.chegada.dir].rot;
        const d = interior.cabine ? ((((alvo - tr.rot0) % TAU) + TAU * 1.5) % TAU) - Math.PI : 0;
        tr.rot1 = tr.rot0 + d;
        if (!d) tr.dur = 0;
      } else if (nome === "partir") tr.dur = tr.durPartir;
    } else if (nome === "chegar") tr.dur = tr.durChegar;
    else if (nome === "ding") {
      interior.displayElevador?.(rotuloDoNumero(tr.ateAndar), 0);
      interior.sinalElevador?.("ding");
      onSom("elevador-ding");
    } else if (nome === "abrir") {
      zoomElevadorAlvo = 1;
      onSom("elevador-porta");
      if (!reducedMotion) {
        // A saída já fica traçada: a câmera recua da cabine para o "seguir"
        // numa curva só, das portas abrindo até ele parar.
        tr.saida = tracarSaida();
        dollyVolta = { de: zoomElevador, t: 0, dur: dur + tr.saida.T };
      }
    } else if (nome === "sair") {
      tr.de = player.root.position.clone();
      if (tr.saida) tr.dur = tr.saida.T;
      else if (!dur) tr.dur = duracaoDoPasso(tr.de, tr.ate);
    }
  }

  // Saída da cabine: anda reto para a frente (já de frente para a sala),
  // passa o vão e só então desvia de leve para o tile da chegada (a cabine
  // fica no meio dos 2 tiles do elevador): uma curva em S (Bézier cúbica)
  // que começa e termina apontando para a frente, sem giro brusco. Se o
  // tile depois da chegada estiver livre, ele dá um passo a mais (a curva
  // fica mais suave e o vão fica livre para as portas fecharem).
  const vBez = new THREE.Vector3();
  function tracarSaida() {
    const tr = transicao;
    const c = interior.chegada;
    const d = DIRS[c.dir];
    const nx = player.x + d.dx;
    const ny = player.y + d.dy;
    if (interior.passable(nx, ny) && !interior.saidaEm(nx, ny)) {
      player.x = nx;
      player.y = ny;
      tr.ate = interior.tileToWorld(nx, ny);
    }
    const p0 = player.root.position.clone();
    const p3 = tr.ate.clone();
    const frente = new THREE.Vector3(d.dx, 0, d.dy);
    const a = 0.45 * Math.max(0.2, p3.clone().sub(p0).dot(frente));
    const pts = [p0, p0.clone().addScaledVector(frente, a), p3.clone().addScaledVector(frente, -a), p3];
    // Tabela do comprimento ao longo da curva (passo uniforme no chão).
    const N = 24;
    const tab = [0];
    const ant = p0.clone();
    for (let i = 1; i <= N; i++) {
      bezier(pts, i / N, vBez);
      tab.push(tab[i - 1] + ant.distanceTo(vBez));
      ant.copy(vBez);
    }
    const L = tab[N];
    // Passo de verdade: no máximo o que a clip acompanha sem deslizar.
    const natural = walkStride / walkCycle;
    let v = Math.min(ELEVADOR_VEL, natural * WALK_AUTO_TIMESCALE);
    const rampa = SAIDA_RAMPA;
    if (L < v * rampa) v = L / rampa;
    return { pts, tab, L, v, rampa, T: L / v + rampa, frente, fechou: false };
  }
  function bezier(pts, u, out) {
    const w = 1 - u;
    out.set(0, 0, 0);
    out.addScaledVector(pts[0], w * w * w);
    out.addScaledVector(pts[1], 3 * w * w * u);
    out.addScaledVector(pts[2], 3 * w * u * u);
    return out.addScaledVector(pts[3], u * u * u);
  }
  // Distância andada em `t` (velocidade sobe e desce em cosseno nas rampas).
  function distanciaNaSaida(s, t) {
    const { v, rampa: r, T, L } = s;
    const naRampa = (x) => v * (x / 2 - (r / (2 * Math.PI)) * Math.sin((Math.PI * x) / r));
    if (t <= 0) return 0;
    if (t >= T) return L;
    if (t < r) return naRampa(t);
    if (t > T - r) return L - naRampa(T - t);
    return v * (r / 2 + (t - r));
  }
  // Parâmetro da curva para a distância `dist` (pela tabela).
  function uDaDistancia(s, dist) {
    const { tab } = s;
    const N = tab.length - 1;
    let i = 1;
    while (i < N && tab[i] < dist) i++;
    const f = (dist - tab[i - 1]) / Math.max(1e-6, tab[i] - tab[i - 1]);
    return THREE.MathUtils.clamp((i - 1 + f) / N, 0, 1);
  }
  const vTan = new THREE.Vector3();
  const vAux = new THREE.Vector3();
  function andarNaSaida(tr) {
    const s = tr.saida;
    const [p0, p1, p2, p3] = s.pts;
    const u = uDaDistancia(s, distanciaNaSaida(s, tr.t));
    bezier(s.pts, u, player.root.position);
    // Olha para onde anda (tangente da curva).
    const w = 1 - u;
    vTan.subVectors(p1, p0).multiplyScalar(w * w);
    vTan.addScaledVector(vAux.subVectors(p2, p1), 2 * w * u);
    vTan.addScaledVector(vAux.subVectors(p3, p2), u * u);
    if (vTan.lengthSq() > 1e-8) player.root.rotation.y = Math.atan2(vTan.x, vTan.z);
    // Velocidade de agora (a clip acompanha; nunca 0, que é o passo da grade).
    const h = 1 / 120;
    velAuto = Math.max(0.05, (distanciaNaSaida(s, tr.t + h) - distanciaNaSaida(s, tr.t - h)) / (2 * h));
    // Passou do vão: as portas já começam a fechar atrás dele.
    if (!s.fechou && tr.porta == null && vAux.subVectors(player.root.position, p0).dot(s.frente) > ELEVADOR_VAO_LIVRE) {
      s.fechou = true;
      portaFechando = { interior, t: 0 };
    }
    return tr.t < s.T;
  }

  // Avança a etapa atual; true enquanto o jogador anda (anima o passo).
  function atualizarElevador(tr, dt) {
    tr.t += dt;
    const k = tr.dur > 0 ? Math.min(tr.t / tr.dur, 1) : 1;
    let andando = false;
    // Ida: aquece o destino, um passo por quadro (o render, só no escuro).
    if (tr.fase !== "abrir") avancarPreparo(tr.etapa === "partir" && tr.avisou && (reducedMotion || tr.t >= tr.dur - ELEVADOR_ESCURO));
    // Portas abrindo (seguem abrindo enquanto o jogador já anda).
    if (tr.porta != null) {
      tr.porta += dt;
      const kp = reducedMotion ? 1 : Math.min(tr.porta / ELEVADOR_PORTA, 1);
      interior.abrirElevador?.(kp);
      if (kp >= 1) tr.porta = null;
    }
    if (tr.etapa === "fechar") interior.abrirElevador?.(1 - k);
    else if (tr.etapa === "sair" && tr.saida) andando = andarNaSaida(tr);
    else if (tr.etapa === "entrar" || tr.etapa === "sair") {
      player.root.position.lerpVectors(tr.de, tr.ate, k);
      andando = k < 1;
      if (andando) velAuto = tr.de.distanceTo(tr.ate) / tr.dur;
    } else if (tr.etapa === "virar") {
      player.root.rotation.y = tr.rot0 + (tr.rot1 - tr.rot0) * k * k * (3 - 2 * k);
      // Passinhos no lugar enquanto gira.
      andando = k < 1;
      if (andando) velAuto = 0.9;
    } else if (tr.etapa === "partir") {
      contarAndares(tr, tr.t / (tr.durPartir + tr.durChegar));
      // Ritmo dos quadros antes da troca (ms): a chegada espera voltar a ele.
      const agora = performance.now();
      if (tr.quadroAnt != null) (tr.ritmos ??= []).push(agora - tr.quadroAnt);
      tr.quadroAnt = agora;
      // Câmera sobe (ou desce) acelerando; a tela escurece no fim.
      if (!reducedMotion) deslizeElevador = tr.sentido * ELEVADOR_DESLIZE * easeIn(k);
      if (!tr.avisou && (reducedMotion || tr.t >= tr.dur - ELEVADOR_ESCURO - ELEVADOR_ESCURECER)) {
        tr.avisou = true;
        avisarElevador(tr, "fechar");
      }
    } else if (tr.etapa === "chegar") {
      // A tela só clareia quando a cena nova já roda no ritmo de antes (os
      // primeiros quadros sobem texturas e shaders): até 1 s no escuro.
      if (!tr.avisou) {
        // Termina o quadro anterior na GPU antes de medir: sem isso, os
        // primeiros quadros "voam" com a fila da GPU cheia e o pagamento
        // vem depois, já com a tela clara.
        sincronizarGpu();
        const agora = performance.now();
        // Ritmo de antes: a mediana dos quadros da partida (o mínimo enganava:
        // com a fila da GPU, um quadro sai "de graça" de vez em quando).
        if (tr.ritmo == null) {
          const r = (tr.ritmos ?? []).sort((a, b) => a - b);
          tr.ritmo = r.length ? r[r.length >> 1] : 25;
        }
        const liso = agora - tr.quadroAnt < Math.max(40, 1.6 * tr.ritmo);
        tr.quadroAnt = agora;
        tr.inicioEspera ??= agora;
        if (!liso && agora - tr.inicioEspera < 1000) {
          tr.t = 0;
          return false;
        }
        tr.t = 0;
        tr.avisou = true;
        avisarElevador(tr, "abrir");
        if (reducedMotion) interior.displayElevador?.(rotuloDoNumero(tr.ateAndar), 0);
      }
      contarAndares(tr, (tr.durPartir + tr.t) / (tr.durPartir + tr.dur));
      // Câmera chega do sentido oposto, freando até a posição normal.
      deslizeElevador = reducedMotion ? 0 : -tr.sentido * ELEVADOR_DESLIZE * (1 - easeOut(k));
    }
    if (k < 1) return andando;
    // De frente para a porta na cabine; saindo, olhando para a sala.
    if ((tr.etapa === "virar" && interior.cabine) || tr.etapa === "sair") face(interior.chegada.dir);
    if (tr.etapa === "partir") {
      // No escuro, a troca espera o destino aquecido (até PREPARO_ESPERA_MAX).
      if (preparo && !preparo.pronto && tr.t - tr.dur < PREPARO_ESPERA_MAX) return andando;
      // No escuro: troca de cena; a câmera já começa do lado oposto.
      trocarDeLugar();
      deslizeElevador = reducedMotion ? 0 : -tr.sentido * ELEVADOR_DESLIZE;
      tr.fase = "abrir";
      tr.etapas = reducedMotion ? ELEVADOR_VOLTA_RAPIDA : ELEVADOR_VOLTA;
      tr.i = -1;
    }
    if (tr.etapa === "chegar") deslizeElevador = 0;
    proximaEtapa(tr);
    return andando;
  }

  // Portas do elevador fechando atrás de quem saiu (de uma vez, se `ja`).
  function fecharPortaAtras(ja = false) {
    const pf = portaFechando;
    if (!pf) return;
    if (ja) pf.t = ELEVADOR_FECHA_ATRAS;
    const k = Math.min(pf.t / ELEVADOR_FECHA_ATRAS, 1);
    pf.interior.abrirElevador?.(1 - k);
    if (k >= 1) {
      pf.interior.sinalElevador?.(null);
      portaFechando = null;
    }
  }

  // No escuro (íris ou portas do elevador fechadas): troca a cena, põe o
  // jogador no batente do outro lado e prepara a caminhada de chegada.
  function trocarDeLugar() {
    const tr = transicao;
    // Quem "olha para o jogador" (o time na Galeria) para de segui-lo ao sair.
    interior?.setJogador?.(null);
    if (tr.para === "vila") {
      local = "vila";
      interior = null;
      scene.add(player.root);
      player.x = SEMEC_FRENTE.x;
      player.y = SEMEC_FRENTE.y;
      tr.de = tileToWorld(SEMEC_PORTA.x, SEMEC_PORTA.y).add(new THREE.Vector3(0, 0, 0.2));
      tr.ate = tileToWorld(player.x, player.y);
      face("down");
    } else {
      fecharPortaAtras(true);
      interior?.abrirElevador?.(0);
      interior?.sinalElevador?.(null);
      interior = obterInterior(tr.para);
      local = tr.para;
      preparo = null;
      aquecidos.add(interior);
      guardarSoRecentes(tr.para);
      interior.scene.add(player.root);
      interior.setJogador?.(player.root.position);
      // Da rua, entra pela porta do térreo; de elevador, sai dele.
      const c = tr.modo === "porta" && interior.entradaRua ? interior.entradaRua : interior.chegada;
      const de = atrasDe(c);
      player.x = c.x;
      player.y = c.y;
      tr.ate = interior.tileToWorld(c.x, c.y);
      if (tr.modo === "elevador") {
        // Chega dentro da cabine, de frente, com as portas fechadas.
        tr.de = interior.cabine ? interior.cabine.clone() : interior.tileToWorld(de.x, de.y);
        interior.abrirElevador?.(0);
      } else {
        tr.de = interior.tileToWorld(de.x, de.y);
        interior.abrirPorta(1);
      }
      face(c.dir);
    }
    player.root.position.copy(tr.de);
    // De elevador, a câmera começa perto do jogador (ainda na cabine).
    camTarget.copy(tr.modo === "elevador" ? tr.de : tr.ate);
    snapCamera = true;
    lastFacingKey = "";
    onLocal({ local });
    // De elevador, a tela clareia no primeiro quadro de "chegar".
    if (tr.modo === "elevador") return;
    onTransicao({ fase: "abrir", para: tr.para, modo: tr.modo, rotulo: rotuloDe(tr.para) });
  }

  // Avança a transição; true enquanto o jogador anda sozinho (anima o passo).
  function atualizarTransicao(dt) {
    const tr = transicao;
    if (tr.modo === "elevador") return atualizarElevador(tr, dt);
    if (tr.modo === "pista") return atualizarTransicaoPista(tr, dt);
    const T = reducedMotion ? TRANSICAO_RAPIDA : TRANSICAO;
    tr.t += dt;
    // O passo acompanha a caminhada até a porta (e da porta para dentro).
    velAuto = tr.de.distanceTo(tr.ate) / (tr.fase === "fechar" ? T.fechar : T.abrir);
    if (tr.fase === "fechar") {
      const k = Math.min(tr.t / T.fechar, 1);
      player.root.position.lerpVectors(tr.de, tr.ate, k);
      if (tr.t >= T.fechar + T.escuro) {
        trocarDeLugar();
        tr.fase = "abrir";
        tr.t = 0;
      }
      return k < 1;
    }
    const k = Math.min(tr.t / T.abrir, 1);
    player.root.position.lerpVectors(tr.de, tr.ate, k);
    // A porta fecha atrás de quem chega.
    if (noPredio()) interior.abrirPorta(1 - k);
    if (k >= 1) {
      transicao = null;
      velAuto = 0;
      reportFacing();
      return false;
    }
    return true;
  }

  // ---- Corrida na pista (scene/pista) ---------------------------------------------
  // A pista é um interior como os andares (mesma grade, mesmo LRU, mesmo
  // preparo), mas se entra a partir da Vila, já montado: api.entrarPista()
  // fecha a íris parado (modo "pista": ninguém anda até porta nenhuma),
  // troca de cena no escuro e abre com o jogador na largada. Lá dentro a
  // bicicleta não desce (nem pelo B, nem sozinha) e anda em direção livre
  // como na Vila (pedalarLivre). O portão do box (corrida.saidaVila) ou api.sairDaPista()
  // levam de volta para o lado do bicicletário.
  //
  // Máquina da corrida (no motor, para o tempo ser justo):
  //   "espera"    jogador travado até a íris abrir;
  //   "contagem"  3 bipes, 1 s cada (onCorrida "contagem" n = 3, 2, 1; o
  //               semáforo da pista no vermelho), jogador travado;
  //   "correndo"  verde ("largada"); conta o tempo e os checkpoints na ordem
  //               (o último é a linha de chegada; fora de ordem não conta;
  //               valem todos os tiles que o centro da bicicleta cruzou no
  //               quadro, em ordem: tilesNoQuadro);
  //   "fim"       cruzou a chegada na última volta: festa, jogador freia e
  //               fica parado até correrDeNovo() ou sairDaPista().
  // Tempo: soma do dt do próprio tick (já limitado a 0,05 s por quadro), só
  // em "correndo" e sem pausa. É o mesmo relógio que move a bicicleta
  // (pedalarLivre anda spd·dt): num PC lento, em que o quadro passa de 50 ms,
  // o jogo inteiro anda mais devagar e o cronômetro também, então a mesma
  // pilotagem dá o mesmo tempo em qualquer máquina, e um engasgo (GC, aba em
  // segundo plano) não vira segundos perdidos. Com performance.now() o PC
  // fraco daria tempos piores. Pausa (modal, menu) congela contagem e tempo.
  // Por dentro, c.tempo em segundos; nos eventos e em api.corrida, em ms.
  let corrida = null; // { fase, t, bipes, tempo, volta, voltas, proximo, total, tile, tiles }
  // Eventos e sons da corrida passam por aqui; `espiaCorrida` (TEMP-HOOK,
  // window.__vilaDbg.espiarCorrida) deixa o teste headless ver os dois.
  let espiaCorrida = null;
  const avisarCorrida = (ev) => {
    onCorrida(ev);
    espiaCorrida?.(ev);
  };
  const somCorrida = (nome, opts) => {
    onSom(nome, opts);
    espiaCorrida?.({ som: nome, ...opts });
  };
  const corridaTrava = () => Boolean(corrida && naPista() && corrida.fase !== "correndo");
  const naSaidaDaPista = (x, y) => (interior?.corrida?.saidaVila ?? []).some(([sx, sy]) => sx === x && sy === y);

  // Íris para a pista (entrar ou recomeçar: para = "pista") ou para a Vila.
  function iniciarTransicaoPista(para) {
    if (transicao || cutscene.active) return false;
    held.length = 0;
    player.path = [];
    player.pending = null;
    player.tap = null;
    player.idle = 0;
    if (coding) stopCoding();
    hover.visible = false;
    const aqui = player.root.position.clone();
    transicao = { para, modo: "pista", t: 0, fase: "fechar", de: aqui, ate: aqui.clone() };
    onTransicao({ fase: "fechar", para, modo: "pista", rotulo: rotuloDe(para) });
    return true;
  }
  function sairDaPista() {
    if (!naPista() || !iniciarTransicaoPista("vila")) return false;
    corrida = null;
    return true;
  }

  // Parado no lugar: a íris fecha (a pista aquece; o render fora da tela, só
  // no escuro), troca no escuro (esperando a pista pronta, até
  // PREPARO_ESPERA_MAX) e abre. Nunca "anda sozinho" (devolve false).
  function atualizarTransicaoPista(tr, dt) {
    const T = reducedMotion ? TRANSICAO_RAPIDA : TRANSICAO;
    tr.t += dt;
    if (tr.fase === "fechar") {
      const aquecendo = tr.para === "pista" && !naPista() && preparo?.id === "pista";
      if (aquecendo) avancarPreparo(tr.t >= T.fechar);
      if (tr.t < T.fechar + T.escuro) return false;
      if (aquecendo && !preparo.pronto && tr.t - T.fechar - T.escuro < PREPARO_ESPERA_MAX) return false;
      trocarDePista(tr);
      tr.fase = "abrir";
      tr.t = 0;
      return false;
    }
    if (tr.t >= T.abrir) {
      transicao = null;
      reportFacing();
    }
    return false;
  }

  // No escuro: Vila → pista (na largada, montado), pista → largada de novo,
  // ou pista → Vila (ao lado do bicicletário, de frente para ele).
  function trocarDePista(tr) {
    const de = local;
    // Passo pela metade, velocidade, setas, caminho: tudo zerado (é um teleporte).
    player.move = null;
    player.path = [];
    player.pending = null;
    player.tap = null;
    held.length = 0;
    assento = null;
    zerarPilotagem();
    if (tr.para === "vila") {
      interior?.setJogador?.(null);
      local = "vila";
      interior = null;
      corrida = null;
      scene.add(player.root);
      const b = BICICLETARIO;
      const lado = VOLTA_DA_PISTA.find((l) => passable(b.x + l.dx, b.y + l.dy)) ?? VOLTA_DA_PISTA[0];
      player.x = b.x + lado.dx;
      player.y = b.y + lado.dy;
      face(lado.dir);
    } else {
      if (!naPista()) {
        interior?.setJogador?.(null);
        interior = obterInterior("pista");
        local = "pista";
        if (preparo?.id === "pista") preparo = null;
        aquecidos.add(interior);
        guardarSoRecentes("pista");
        interior.scene.add(player.root);
        interior.setJogador?.(player.root.position);
      }
      const L = interior.corrida.largada;
      player.x = L.x;
      player.y = L.y;
      face(L.dir);
      montar(true);
      // (montar parte do yaw na tela, que ainda é o do outro lado.)
      bike.rumo = DIRS[L.dir].rot;
      player.root.rotation.y = bike.rumo;
    }
    const pos = paraMundo(player.x, player.y);
    player.root.position.copy(pos);
    tr.de = pos.clone();
    tr.ate = pos.clone();
    // Sem giro amortecido nem inclinação herdados do outro lado.
    yawVisual = player.root.rotation.y;
    player.giro.rotation.y = 0;
    player.inclina.rotation.z = 0;
    bike.guidao = 0;
    bike.ultimo.copy(pos);
    camTarget.copy(pos);
    pistaFrente.set(0, 0, 0);
    pistaUltimo.copy(pos);
    snapCamera = true;
    lastFacingKey = "";
    if (local !== de) onLocal({ local });
    if (tr.para === "vila") avisarCorrida({ tipo: "saiu" });
    else {
      prepararCorrida();
      if (de !== "pista") avisarCorrida({ tipo: "entrou", voltas: corrida.voltas, total: corrida.total });
    }
    onTransicao({ fase: "abrir", para: tr.para, modo: "pista", rotulo: rotuloDe(tr.para) });
  }

  // Corrida nova (na largada, ainda no escuro): espera a íris abrir.
  function prepararCorrida() {
    const c = interior.corrida;
    corrida = {
      fase: "espera",
      t: 0,
      bipes: 0,
      tempo: 0,
      volta: 1,
      voltas: c.voltas ?? 1,
      proximo: 0,
      total: c.checkpoints.length,
      tile: "",
      tiles: c.checkpoints.map((cp) => new Set(cp.tiles.map(([x, y]) => `${x},${y}`))),
    };
    interior.setProximo?.(0);
    // Semáforo apagado; cada bipe acende mais uma lâmpada (largada(n)).
    interior.largada?.(null);
  }

  // A cada quadro, depois do movimento: cada tile em que o centro da
  // bicicleta entrou neste quadro (tilesNoQuadro, na ordem) e o atual.
  function atualizarCorrida(dt) {
    const c = corrida;
    const atravessados = tilesNoQuadro.splice(0);
    if (!c || !naPista() || paused) return;
    if (c.fase === "espera") {
      if (transicao) return;
      c.fase = "contagem";
      c.t = 0;
    }
    if (c.fase === "contagem") {
      c.t += dt;
      const k = Math.floor(c.t / CORRIDA_BIPE);
      while (c.bipes < CORRIDA_CONTAGEM && c.bipes <= k) {
        const n = CORRIDA_CONTAGEM - c.bipes++;
        interior.largada?.(n);
        somCorrida("contagem", { n });
        avisarCorrida({ tipo: "contagem", n, voltas: c.voltas, total: c.total });
      }
      if (k < CORRIDA_CONTAGEM) return;
      c.fase = "correndo";
      c.tempo = 0;
      c.tile = `${player.x},${player.y}`;
      interior.largada?.("verde");
      somCorrida("largada");
      avisarCorrida({ tipo: "largada", inicio: performance.now() });
      return;
    }
    if (c.fase !== "correndo") return;
    c.tempo += dt;
    atravessados.push(`${player.x},${player.y}`);
    for (const tile of atravessados) {
      if (c.fase !== "correndo") break;
      corridaPisou(c, tile);
    }
  }
  function corridaPisou(c, tile) {
    if (tile === c.tile) return;
    c.tile = tile;
    const i = c.proximo;
    if (!c.tiles[i]?.has(tile)) return;
    interior.passou?.(i);
    avisarCorrida({ tipo: "checkpoint", i, total: c.total, volta: c.volta, tempo: c.tempo * 1000 });
    if (i < c.total - 1) {
      c.proximo = i + 1;
      interior.setProximo?.(c.proximo);
      somCorrida("checkpoint", { i });
      return;
    }
    // Linha de chegada: fecha a volta (`volta` = a que acabou de fechar).
    avisarCorrida({ tipo: "volta", volta: c.volta, voltas: c.voltas, tempo: c.tempo * 1000 });
    if (c.volta < c.voltas) {
      c.volta += 1;
      c.proximo = 0;
      interior.setProximo?.(0);
      somCorrida("volta");
      return;
    }
    // Última volta: festa, freia sozinha (sem entrada: corridaTrava) e fica
    // parado.
    c.fase = "fim";
    c.proximo = -1;
    interior.setProximo?.(-1);
    held.length = 0;
    player.tap = null;
    player.path = [];
    player.pending = null;
    interior.festa?.();
    somCorrida("chegada");
    somCorrida("torcida");
    avisarCorrida({ tipo: "chegada", tempo: c.tempo * 1000 });
  }

  // Câmera na pista: o alvo vai à frente, na direção (amortecida) em que o
  // jogador anda. Movimento reduzido: só segue.
  const pistaFrente = new THREE.Vector3();
  const pistaUltimo = new THREE.Vector3();
  const vPistaVel = new THREE.Vector3();
  function adiantarCameraPista(dt, out) {
    const pos = player.root.position;
    if (reducedMotion || snapCamera || dt <= 0) {
      pistaFrente.set(0, 0, 0);
      pistaUltimo.copy(pos);
      return out;
    }
    vPistaVel.subVectors(pos, pistaUltimo).divideScalar(dt);
    pistaUltimo.copy(pos);
    // Teleporte (mais de 20 m/s): não é movimento.
    if (vPistaVel.lengthSq() > 400) vPistaVel.set(0, 0, 0);
    pistaFrente.lerp(vPistaVel.multiplyScalar(PISTA_FRENTE_S), 1 - Math.exp(-dt * PISTA_FRENTE_TAXA));
    return out.add(vPistaVel.copy(pistaFrente).clampLength(0, PISTA_FRENTE_MAX));
  }

  function abrirQuadro(id) {
    if (!noPredio() || !interior.pose(id)) return;
    foco = id;
    held.length = 0;
    player.path = [];
    player.pending = null;
    if (coding) stopCoding();
    // No close, a câmera fica atrás do jogador: ele sairia na frente da placa.
    player.root.visible = false;
    interior.setDestaque(id);
    onQuadro({ id });
  }

  // Câmera do close: de frente para o quadro, a uma distância em que ele
  // ocupa ~70% da altura, deslocada para o lado do painel da interface
  // (à direita na tela larga; embaixo na estreita).
  const vLado = new THREE.Vector3();
  function cameraDoQuadro(pose, posOut, lookOut) {
    const tanMeio = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const largo = camera.aspect >= 1;
    // A placa de latão fica logo abaixo da moldura: entra no enquadramento.
    const abaixo = pose.abaixo ?? 0;
    const altura = pose.altura + abaixo;
    let dist = altura / 0.78 / (2 * tanMeio);
    if (!largo) dist = Math.max(dist, pose.largura / 0.85 / (2 * tanMeio * camera.aspect));
    lookOut.copy(pose.centro);
    lookOut.y -= abaixo / 2;
    posOut.copy(lookOut).addScaledVector(pose.normal, dist);
    if (largo) {
      // Direita da câmera de frente para o quadro: (-normal) × cima. Câmera
      // e alvo vão para a direita: o quadro fica à esquerda, o painel à direita.
      vLado.set(pose.normal.z, 0, -pose.normal.x);
      const meiaLargura = dist * tanMeio * camera.aspect;
      lookOut.addScaledVector(vLado, meiaLargura * 0.4);
      posOut.addScaledVector(vLado, meiaLargura * 0.4);
    } else {
      const meiaAltura = dist * tanMeio;
      lookOut.y -= meiaAltura * 0.45;
      posOut.y -= meiaAltura * 0.45;
    }
  }

  // ---- Cenas (scene/cutscene.js) ----------------------------------------------
  // Atores por "player" ou índice em members.
  const npcByIndex = new Map(npcs.map((n) => [n.index, n]));
  const actors = {
    get(who) {
      if (who === "player") {
        return {
          get x() {
            return player.x;
          },
          get y() {
            return player.y;
          },
          object: player.root,
          face,
          moveTo(x, y, snap = true) {
            player.x = x;
            player.y = y;
            if (snap) player.root.position.copy(tileToWorld(x, y));
          },
        };
      }
      // O Pedro (3D, quest) é ator de câmera: posição e objeto; ele mesmo
      // cuida de para onde olha (scene/pedro.js).
      if (pedro && who === pedro.index) {
        return { x: pedro.x, y: pedro.y, object: pedro.root, face() {}, moveTo() {} };
      }
      // Dupla que passeia (id do walker, ex. "emily"): ator de câmera.
      const walker = typeof who === "string" ? walkers.find((w) => w.id === who) : null;
      if (walker) {
        const p = tileOf(walker.owner.root.position);
        return { x: p.x, y: p.y, object: walker.owner.root, face() {}, moveTo() {} };
      }
      const n = npcByIndex.get(who);
      if (!n) return null;
      return {
        get x() {
          return n.x;
        },
        get y() {
          return n.y;
        },
        object: n.fig,
        face(dir) {
          n.dir = dir;
          n.fig.rotation.y = DIRS[dir].rot;
        },
        moveTo(x, y, snap = true) {
          occupied.delete(`${n.x},${n.y}`);
          n.x = x;
          n.y = y;
          occupied.set(`${x},${y}`, n);
          if (snap) n.fig.position.copy(tileToWorld(x, y));
        },
      };
    },
  };
  // ---- Mundo nas cenas (passo { mundo } de scene/cutscene.js) -----------------
  // Épocas da cena da ocarina (scene/epocas.js), tempo acelerado, time reunido
  // na praça e efeitos de tela. instant = pular a cena (ou o passo): aplica o
  // estado final sem animar. Devolve quantos segundos o passo deve esperar.
  const epocas = createEpocas({
    scene,
    pal,
    track,
    tileToWorld,
    buildings: buildingGroups,
    makeLabel: (text, bg, fg) => makeLabelTexture(text, bg, fg, pal.font),
    reducedMotion,
    dayNight,
  });
  let tempoAnim = null; // { from, to, t, dur, cmd }
  let tempoAplicado = 0; // horas somadas pela cena (o "voltar" desfaz)
  const reuniao = new Map(); // npc → { x, y, dir } de antes da festa
  // spots: [[x, y, dir?], …] (sem dir: virado para a câmera).
  function reunir(on, spots = FESTA_SPOTS) {
    if (on && !reuniao.size) {
      for (const n of npcs.slice(0, spots.length)) {
        reuniao.set(n, { x: n.x, y: n.y, dir: n.dir });
        occupied.delete(`${n.x},${n.y}`);
      }
      [...reuniao.keys()].forEach((n, i) => {
        const [x, y, dir = "down"] = spots[i];
        n.x = x;
        n.y = y;
        n.dir = dir;
        occupied.set(`${x},${y}`, n);
        n.fig.position.copy(tileToWorld(x, y));
        n.fig.rotation.y = DIRS[dir].rot;
      });
    } else if (!on && reuniao.size) {
      for (const n of reuniao.keys()) occupied.delete(`${n.x},${n.y}`);
      for (const [n, o] of reuniao) {
        n.x = o.x;
        n.y = o.y;
        n.dir = o.dir;
        occupied.set(`${o.x},${o.y}`, n);
        n.fig.position.copy(tileToWorld(o.x, o.y));
        n.fig.rotation.y = DIRS[o.dir].rot;
      }
      reuniao.clear();
    }
  }
  // Roda de história: acampamento com fogueira (scene/historia.js) e o time
  // sentado nos bancos, virado para o fogo. Assentos (índices em
  // historia.ASSENTOS, ângulo a partir do norte): 0 Zé (de frente para a
  // câmera), -30 Pedro, 30/±60/±90/-120 os chibis, 120 Emily, 150 o jogador.
  const fogoPos = tileToWorld(...FOGO_TILE).add(new THREE.Vector3(0.5, 0, 0.5));
  const historia = createHistoria({ scene, pal, track, reducedMotion, lite });
  historia.setPos(fogoPos);
  const RODA = { ze: 0, pedro: 1, chibis: [2, 3, 4, 5, 6, 7], emily: 8, jogador: 10 };
  let rodaAntes = null; // estado de antes da cena (para devolver tudo)
  // Pose sentada (scene/sentar.js), criada na primeira roda (os GLBs já
  // carregaram). O corpo fica 0,1 atrás do centro do banco, com a borda da
  // frente do banco em z = 0,05 do corpo.
  const sentados = new Map(); // root do corpo → sentado
  function sentar(root, on) {
    if (!root) return;
    let s = sentados.get(root);
    if (!s && on) {
      s = createSentado(root, { alturaAssento: historia.alturaAssento, bordaAssento: 0.05 });
      if (s.tipo) sentados.set(root, s);
    }
    s?.setSentado(on, { instantaneo: reducedMotion || !on });
  }
  const noBanco = (s) => s.pos.clone().addScaledVector(new THREE.Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw)), -0.1);
  // Mascote ao lado do dono, um pouco para fora da roda.
  const aoLado = (i, graus) => {
    const s = historia.ASSENTOS[i];
    const a = Math.atan2(s.x, -s.z) + THREE.MathUtils.degToRad(graus);
    return new THREE.Vector3(Math.sin(a) * 1.95, 0, -Math.cos(a) * 1.95).add(fogoPos);
  };
  function roda(on) {
    const ze = walkers.find((w) => w.id === "ze-carlos");
    const emily = walkers.find((w) => w.id === "emily");
    if (on) {
      if (rodaAntes) return;
      rodaAntes = { npcs: [], jogador: { x: player.x, y: player.y, dir: player.dir } };
      npcs.slice(0, RODA.chibis.length).forEach((n, i) => {
        rodaAntes.npcs.push({ n, x: n.x, y: n.y, dir: n.dir, marker: n.marker?.visible });
        const s = historia.assento(RODA.chibis[i]);
        n.fig.position.copy(noBanco(s));
        n.fig.rotation.y = s.yaw;
        sentar(n.fig, true);
        // Chefe com boneco 3D: o 3D segue o chibi (invisível) e senta junto.
        if (n.boneco) sentar(walkers.find((w) => w.id === n.boneco)?.owner.root, true);
        // Balões (estrela, "!", "✓") saem de cena enquanto o Zé conta.
        if (n.marker) n.marker.visible = false;
      });
      rodaAntes.cristais = questsColeta.map((qc) => qc.marker.object.visible);
      for (const qc of questsColeta) qc.marker.object.visible = false;
      const sz = historia.assento(RODA.ze);
      ze?.encenar(noBanco(sz), sz.yaw, aoLado(RODA.ze, 14));
      sentar(ze?.owner.root, true);
      const se = historia.assento(RODA.emily);
      emily?.encenar(noBanco(se), se.yaw, aoLado(RODA.emily, 14));
      sentar(emily?.owner.root, true);
      const sp = historia.assento(RODA.pedro);
      pedro?.encenar(noBanco(sp), sp.yaw);
      sentar(pedro?.root, true);
      const sj = historia.assento(RODA.jogador);
      player.root.position.copy(noBanco(sj));
      player.root.rotation.y = sj.yaw;
      sentar(player.body, true);
      historia.setOn(true);
    } else if (rodaAntes) {
      for (const root of sentados.keys()) sentar(root, false);
      for (const { n, x, y, dir, marker } of rodaAntes.npcs) {
        n.x = x;
        n.y = y;
        n.dir = dir;
        n.fig.position.copy(tileToWorld(x, y));
        n.fig.rotation.y = DIRS[dir].rot;
        if (n.marker && marker !== undefined) n.marker.visible = marker;
      }
      questsColeta.forEach((qc, i) => (qc.marker.object.visible = rodaAntes.cristais[i]));
      ze?.liberar();
      emily?.liberar();
      pedro?.liberar();
      const j = rodaAntes.jogador;
      player.x = j.x;
      player.y = j.y;
      player.root.position.copy(tileToWorld(j.x, j.y));
      face(j.dir);
      rodaAntes = null;
      historia.setOn(false);
    }
  }

  function mundo(cmd, instant) {
    const rapido = instant || reducedMotion;
    if (cmd.tocar !== undefined) {
      pedro?.tocar(cmd.tocar);
      return 0;
    }
    // Época: a construção (ou a volta) roda em `dur` segundos SEM segurar a
    // cena, para acontecer junto com o relógio do passo seguinte.
    if (cmd.epoca !== undefined) {
      epocas.set(cmd.epoca, { dur: rapido ? 0 : (cmd.dur ?? 0) });
      return 0;
    }
    // Show da Emily: o mascote canta e as notas sobem em espiral.
    if (cmd.show !== undefined) {
      const w = walkers.find((x) => x.id === cmd.show);
      if (!w || rapido) return 0;
      w.pet.perform("cantar");
      coletaveis.burst(w.owner.root.position);
      return coletaveis.BURST_TIME;
    }
    if (cmd.reunir !== undefined) {
      reunir(cmd.reunir);
      return 0;
    }
    if (cmd.roda !== undefined) {
      roda(cmd.roda);
      return 0;
    }
    // Página da história sobre a fogueira (índice ou null): espera a troca.
    // A ilustração aparece grande na interface (LivroHistoria.jsx).
    if (cmd.pagina !== undefined) {
      onCutsceneEfeito({ efeito: "pagina", pagina: cmd.pagina });
      return rapido ? 0 : 0.9;
    }
    // Mascote se apresenta (ex. o Livro Sábio abrindo a história).
    if (cmd.apresenta !== undefined) {
      const w = walkers.find((x) => x.id === cmd.apresenta);
      if (w && !rapido) w.pet.perform(cmd.show);
      return 0;
    }
    if (cmd.efeito !== undefined) {
      onCutsceneEfeito(cmd);
      return 0;
    }
    if (cmd.tempo !== undefined) {
      // O passo em andamento terminando de uma vez (pular): só fecha a animação.
      if (tempoAnim) {
        dayNight.setHours(tempoAnim.to);
        const mesmo = tempoAnim.cmd === cmd;
        tempoAnim = null;
        if (mesmo) return 0;
      }
      const h0 = dayNight.state.hours;
      let delta;
      if (cmd.tempo === "voltar") delta = -tempoAplicado;
      else {
        // Avança (1) ou volta (-1) `dias` dias inteiros e para na hora `ate`.
        const dias = cmd.dias ?? 2;
        delta =
          cmd.tempo > 0 ? dias * 24 + ((((cmd.ate - h0) % 24) + 24) % 24) : -(dias * 24 + ((((h0 - cmd.ate) % 24) + 24) % 24));
      }
      tempoAplicado = cmd.tempo === "voltar" ? 0 : tempoAplicado + delta;
      if (rapido) {
        dayNight.setHours(h0 + delta);
        return 0;
      }
      tempoAnim = { from: h0, to: h0 + delta, t: 0, dur: cmd.dur ?? 3, cmd };
      return tempoAnim.dur;
    }
    return 0;
  }

  const cutscene = createCutscene({
    mundo,
    scene,
    track,
    pal,
    tileToWorld,
    DIRS,
    reducedMotion,
    actors,
    onSay: (fala) => onCutsceneSay(fala),
    urlInsignia,
  });

  // ---- Entrada ------------------------------------------------------------------
  const held = []; // direções seguradas, a última tem prioridade
  let paused = false;

  const api = {
    press(dir) {
      if (!DIRS[dir]) return;
      player.path = [];
      player.pending = null;
      if (!held.includes(dir)) held.push(dir);
      // Montado: a seta entra no alvo do rumo (pedalarLivre); um toque curto
      // vale como segurada por BIKE_TOQUE (vira ou anda um pouco).
      if (bike.on) {
        bike.toque.set(dir, BIKE_TOQUE);
        return;
      }
      // Na contagem a seta fica segurada (sai no verde), mas não vira.
      if (!player.move && !paused && !transicao && !foco && !corridaTrava()) {
        if (player.dir !== dir) {
          face(dir);
          player.turnLock = TURN_LOCK;
        } else {
          // Já de frente: o toque vale um passo mesmo se a tecla subir antes
          // do próximo quadro (PC lento: um toque curto se perdia, e o passo
          // para o elevador/porta não acontecia).
          player.tap = dir;
        }
      }
    },
    release(dir) {
      const i = held.indexOf(dir);
      if (i >= 0) held.splice(i, 1);
    },
    releaseAll() {
      held.length = 0;
      bike.toque.clear();
      player.tap = null;
      player.run = false;
    },
    step(dir) {
      player.pending = null;
      player.path = [dir];
    },
    setRun(on) {
      player.run = on;
    },
    // Bicicleta (tecla B / botão): sobe ou desce. Devolve se ficou montado.
    setBicicletaLiberada(on) {
      bikeLiberada = on;
      if (!on) desmontar();
    },
    toggleBicicleta() {
      // Na pista não se desce (o B não faz nada).
      if (naPista()) return bike.on;
      if (bike.on) desmontar();
      else montar();
      return bike.on;
    },
    interact() {
      if (!paused && !player.move && !cutscene.active && !transicao && !foco) interact();
    },
    setPaused(p) {
      paused = p;
      if (p) {
        held.length = 0;
        bike.toque.clear();
        player.tap = null;
      }
    },
    // Nível gráfico em uso agora (pode ter descido sozinho).
    get quality() {
      return lighting.quality;
    },
    // Etapa da quest da ocarina (quest.js): símbolo, esconderijo e o Pedro.
    // celebrar: acabou de devolver (o Pedro dança na hora).
    setQuest(etapa, { celebrar = false } = {}) {
      questEtapa = etapa;
      questMarker.setEtapa(etapa);
      ocarina?.setEtapa(etapa);
      if (etapa === "concluida") {
        if (celebrar) pedro?.celebrate();
        else pedro?.setHasOcarina(true);
      } else pedro?.setHasOcarina(false);
    },
    // Estado de uma quest de coleta ({ etapa, itens }, quests-coleta.js):
    // cristal sobre quem dá a quest e itens que ainda faltam no mapa.
    setColeta(questId, estado) {
      const qc = questsColeta.find((q) => q.quest.id === questId);
      if (!qc) return;
      const visual = { nova: "nova", coletando: "procurando", pronta: "achou", concluida: "concluida" };
      qc.marker.setEtapa(visual[estado.etapa] ?? "nova");
      estadosColeta.set(questId, { etapa: estado.etapa, itens: [...estado.itens] });
      const vis = { visivel: estado.etapa === "coletando", coletados: estado.itens };
      coletaveis.set(questId, vis);
      // Os andares guardados também (os descartados reaplicam ao recriar).
      for (const c of coletaDoInterior.values()) c.coleta?.set(questId, vis);
    },
    // Item aceito pela interface: sobe girando sobre o jogador e some. O
    // item pode ser da Vila ou do andar onde o jogador está.
    coletar(questId, itemId) {
      if (coletaAqui()?.pop(questId, itemId, player.root.position)) return;
      // Fora do lugar do item (a UI aceitou depois de sair?): só esconde.
      const e = estadosColeta.get(questId);
      if (e && !e.itens.includes(itemId)) e.itens.push(itemId);
      const vis = { visivel: e?.etapa === "coletando", coletados: e?.itens ?? [itemId] };
      coletaveis.set(questId, vis);
      for (const c of coletaDoInterior.values()) c.coleta?.set(questId, vis);
    },
    // Líderes já vencidos (Set/array de índices em members): estrela → "✓".
    setLeadersDone(indices) {
      const done = new Set(indices);
      for (const n of npcs) {
        if (!n.leader || n.beaten === done.has(n.index)) continue;
        n.beaten = done.has(n.index);
        paintMarker(n, n.beaten ? pal.markerDone : pal.markerLeader);
      }
    },
    // Aproxima (fator < 1) ou afasta (fator > 1) a câmera do personagem.
    zoomBy(fator) {
      userZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, userZoom * fator));
    },
    // Cena: devolve uma Promise que resolve quando ela termina (ou é pulada).
    playCutscene(steps) {
      held.length = 0;
      player.path = [];
      player.pending = null;
      player.idle = 0;
      if (coding) stopCoding();
      return cutscene.play(steps).then(reportFacing);
    },
    continueCutscene() {
      cutscene.continuar();
    },
    skipCutscene() {
      cutscene.pular();
    },
    // Modo vitrine (tela de título): câmera afastada sobrevoando a vila.
    setAttract(on) {
      attract = on;
    },
    // Troca o boneco do jogador (tela de escolha de personagem).
    setJogador(arquivo) {
      carregarJogador(arquivo);
      // Boneco novo: refaz o preparo (o que já subiu sai rápido do cache).
      preparoVila = null;
      prepararVila();
    },
    // Promessa do preparo da Vila (cargas + shaders + texturas perto do
    // jogador); resolve na hora se já estiver pronto.
    preparar() {
      return prepararVila();
    },
    // Tela de carregamento por cima do jogo: enquanto ligada, a Vila não é
    // desenhada (o preparo anda mais rápido) e o preparo inclui os prédios.
    setCarregando(on) {
      capa = on;
    },
    // Galeria da Equipe: onde o jogador está, troca do quadro em close (setas
    // do painel), fim do close e saída pela interface.
    get local() {
      return local;
    },
    focarQuadro(id) {
      if (!noPredio() || !interior.pose(id)) return;
      foco = id;
      interior.setDestaque(id);
    },
    fecharQuadro() {
      if (!foco) return;
      foco = null;
      voltaDoFoco = 1.4;
      player.root.visible = true;
      interior?.setDestaque(null);
      lastFacingKey = "";
      reportFacing();
    },
    // Painel do elevador: vai para o andar escolhido.
    irParaAndar(id) {
      if (noPredio() && !naPista() && !foco && andarPorId(id)) entrarOuSair(id, "elevador");
    },
    // ---- Corrida na pista (ver "Corrida na pista") ----
    // Convite do bicicletário na tela: cria a pista e começa a aquecê-la
    // (shaders e texturas com a Vila visível; o resto no escuro da íris).
    prepararPista() {
      if (disposed || local !== "vila" || transicao) return;
      // Debaixo da tela de carregamento o `preparo` é dos prédios.
      if (preparoVila && preparoVila.fase !== "pronto") return;
      prepararDestino("pista");
    },
    // Da Vila para a largada da pista, já montado. Só com a bicicleta
    // conquistada (e o boneco carregado). Devolve se a ida começou.
    entrarPista() {
      if (disposed || local !== "vila" || transicao || cutscene.active || foco || !temBike()) return false;
      if (!(preparoVila && preparoVila.fase !== "pronto")) prepararDestino("pista");
      return iniciarTransicaoPista("pista");
    },
    // Volta para a largada (íris) e recomeça a contagem.
    correrDeNovo() {
      if (!naPista() || !iniciarTransicaoPista("pista")) return false;
      corrida = null;
      return true;
    },
    // Da pista para a Vila, ao lado do bicicletário (também pelo portão).
    sairDaPista() {
      return sairDaPista();
    },
    // Estado da corrida para o HUD (cronômetro ao vivo): null fora da pista.
    // tempo em milissegundos de jogo (o mesmo relógio dos eventos).
    get corrida() {
      if (!corrida || !naPista()) return null;
      const c = corrida;
      return { fase: c.fase, tempo: c.tempo * 1000, volta: c.volta, voltas: c.voltas, proximo: c.proximo, total: c.total };
    },
    dispose,
  };

  // ---- Mouse / toque: clique no chão para andar, em alguém para conversar ----
  // Personagens 3D e mascotes (Pedro, duplas) abrem a ficha: onInspect({ id }).
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const npcFigs = npcs.map((n) => n.fig);
  // Malhas invisíveis dos personagens 3D e mascotes (userData.inspectId).
  const inspectProxies = () => [pedro, ...walkers].flatMap((c) => c?.hitProxies ?? []);

  // { inspect: id } quando o ponteiro está sobre um personagem 3D ou mascote
  // (abre a ficha); { x, y, npc? } para um tile ou boneco chibi.
  function pick(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    if (noPredio()) {
      const quadro = raycaster.intersectObjects(interior.hitQuadros ?? [], false)[0];
      const pessoa = raycaster.intersectObjects(interior.hitPessoas ?? [], true)[0];
      if (pessoa && (!quadro || pessoa.distance <= quadro.distance)) return { inspect: pessoa.object.userData.inspectId, museu: true };
      if (quadro) return { quadro: quadro.object.userData.quadroId };
      const p = raycaster.ray.intersectPlane(groundPlane, v);
      if (!p) return null;
      // Clique na parede do fundo (as portas do elevador, por exemplo): o chão
      // "atrás" dela fica fora do andar; vale o tile da parede mais próximo.
      const x = THREE.MathUtils.clamp(Math.floor(p.x + interior.MW / 2), 0, interior.MW - 1);
      const y = THREE.MathUtils.clamp(Math.floor(p.z + interior.MH / 2), 0, interior.MH - 1);
      return { x, y };
    }
    const hit = raycaster.intersectObjects(npcFigs, true)[0];
    const proxyHit = raycaster.intersectObjects(inspectProxies(), true)[0];
    // Proxy na frente (ou sem boneco chibi na linha): ficha do personagem.
    if (proxyHit && (!hit || proxyHit.distance <= hit.distance)) {
      // O Pedro conversa (quest) em vez de abrir a ficha: vira alvo de tile.
      if (pedro && proxyHit.object.userData.inspectId === pedro.id) return { x: pedro.x, y: pedro.y };
      return { inspect: proxyHit.object.userData.inspectId };
    }
    if (hit) {
      const npc = npcs[hit.object.userData.npcIndex];
      return { x: npc.x, y: npc.y, npc };
    }
    const p = raycaster.ray.intersectPlane(groundPlane, v);
    if (!p) return null;
    const x = Math.floor(p.x + W / 2);
    const y = Math.floor(p.z + H / 2);
    return inBounds(x, y) ? { x, y } : null;
  }

  function onPointerMove(ev) {
    if (ev.pointerType !== "mouse") return;
    const t = pick(ev);
    if (t?.inspect || t?.quadro) {
      renderer.domElement.classList.add("is-pointer");
      hover.visible = false;
      return;
    }
    const target = t && targetAt(t.x, t.y);
    renderer.domElement.classList.toggle("is-pointer", Boolean(target));
    if (t && !noPredio() && passable(t.x, t.y)) {
      hover.position.copy(tileToWorld(t.x, t.y)).setY(0.012);
      hover.visible = true;
    } else hover.visible = false;
  }

  function onPointerLeave() {
    hover.visible = false;
  }

  function onClick(ev) {
    if (paused || cutscene.active || transicao || foco || corridaTrava()) return;
    const t = pick(ev);
    if (!t) return;
    // Personagem 3D ou mascote: abre a ficha sem andar até ele.
    if (t.inspect) {
      onInspect(t.museu ? { id: t.inspect, museu: true } : { id: t.inspect });
      return;
    }
    // Quadro: anda até o ponto de vista dele e abre o close.
    if (t.quadro) {
      const vista = interior.pontoDeVista(t.quadro);
      const path = vista && findPath(vista.x, vista.y);
      if (!path) return;
      held.length = 0;
      player.path = path;
      player.pending = { x: vista.x + DIRS[vista.dir].dx, y: vista.y + DIRS[vista.dir].dy };
      return;
    }
    const target = targetAt(t.x, t.y);
    const path = findPath(t.x, t.y);
    if (!path) return;
    held.length = 0;
    player.path = path;
    player.pending = target ? { x: t.x, y: t.y } : null;
  }

  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerleave", onPointerLeave);
  renderer.domElement.addEventListener("click", onClick);

  // ---- Tamanho e visibilidade ---------------------------------------------------
  function resize() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Em tela estreita, afasta a câmera para caber mais mapa.
    const far = w / h < 0.9 ? 1.35 : 1;
    camera.position.copy(camTarget).addScaledVector(CAM_OFFSET, far);
    camera.userData.far = far;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  let lastTs = null;
  let t = 0;

  // Fora da tela (rolou até a lista da equipe), para de renderizar.
  const io = new IntersectionObserver(([entry]) => {
    lastTs = null;
    renderer.setAnimationLoop(entry.isIntersecting ? tick : null);
  });
  io.observe(host);

  // ---- Loop ---------------------------------------------------------------------
  let attract = false;
  let attractT = 0;
  let zoom = 1;
  let userZoom = 1;
  const attractGoal = new THREE.Vector3();
  camTarget.copy(player.root.position);

  function tick(ts) {
    const dt = lastTs === null ? 0 : Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    t += dt;

    // Montado: direção livre (posição e rumo contínuos; a grade só segue).
    if (bike.on) {
      pedalarLivre(dt);
      player.root.rotation.y = bike.rumo;
      player.giro.rotation.y = 0;
      yawVisual = bike.rumo;
    }
    // Descendo da bicicleta: assenta no centro do tile.
    if (assento) {
      if (bike.on || transicao || cutscene.active) assento = null;
      else {
        assento.t += dt;
        const k = Math.min(assento.t / assento.dur, 1);
        player.root.position.lerpVectors(assento.de, assento.ate, k * k * (3 - 2 * k));
        if (k >= 1) assento = null;
      }
    }
    // Movimento em grade (a pé).
    if (player.turnLock > 0) player.turnLock -= dt;
    if (player.move) {
      const m = player.move;
      m.t += dt / m.dur;
      const k = Math.min(m.t, 1);
      player.root.position.lerpVectors(m.from, m.to, k);
      // Sem a clip `andando` (bonequinho provisório), balanço procedural.
      if (player.body && !reducedMotion && !actions?.andando) {
        player.body.position.y = Math.abs(Math.sin(k * Math.PI)) * 0.06;
        player.body.rotation.z = Math.sin(k * Math.PI * 2) * 0.07;
      }
      if (m.t >= 1) {
        player.move = null;
        if (noPredio() || !tryFindOcarina(player.x, player.y)) tryColeta(player.x, player.y);
        if (player.body) {
          player.body.position.y = 0;
          player.body.rotation.z = 0;
        }
        reportFacing();
      }
    }
    // (Na pista, travado na espera, na contagem e depois da chegada.)
    if (!bike.on && !assento && !player.move && !paused && !cutscene.active && !transicao && !foco && !corridaTrava()) {
      const want = held[held.length - 1] ?? player.tap;
      if (want && player.turnLock <= 0) {
        player.tap = null;
        tryStep(want);
      }
      else if (!want && player.path.length) {
        const dir = player.path.shift();
        if (!tryStep(dir)) player.path = [];
      } else if (!want && player.pending) {
        const p = player.pending;
        player.pending = null;
        const dx = p.x - player.x;
        const dy = p.y - player.y;
        const dir = Object.keys(DIRS).find((k) => DIRS[k].dx === dx && DIRS[k].dy === dy);
        if (dir) {
          face(dir);
          interact();
        }
      }
    }
    atualizarCorrida(dt);
    if (!player.move && !held.length && !player.path.length) {
      player.idle += dt;
      // Sentar para programar vira o jogador para a câmera (para baixo): não
      // senta de frente para alguém/uma mesa/uma saída nem quando embaixo há
      // um alvo, senão a dica "Espaço: …" (e o alvo do Espaço) mudaria sem o
      // jogador ter feito nada.
      // (Montado nunca: na largada da pista ele ficaria de notebook na bike.)
      if (
        !coding &&
        !bike.on &&
        !cutscene.active &&
        !transicao &&
        !foco &&
        player.idle > IDLE_BEFORE_CODING &&
        !lastFacingKey &&
        !targetAt(player.x + DIRS.down.dx, player.y + DIRS.down.dy)
      )
        startCoding();
    }
    // Entrando ou saindo da galeria, o jogador anda sozinho até a porta.
    const andandoSozinho = transicao ? atualizarTransicao(dt) : false;
    if (portaFechando) {
      portaFechando.t += dt;
      fecharPortaAtras();
    }
    // Prédio, elevador, porta ou cena: desce da bicicleta (na pista e na íris
    // de ida e volta dela, não).
    if (bike.on && ((noPredio() && !naPista()) || cutscene.active || (transicao && transicao.modo !== "pista"))) desmontar();
    const emPasso = Boolean(player.move) || andandoSozinho;
    if (emPasso && !walking) startWalk();
    else if (!emPasso && walking) stopWalk();
    // A pé: yaw visual. Montado: cadência, guidão, roll e pesos das clips
    // (pausado, a bicicleta congela: o mixer do jogador não anda).
    if (bike.on) {
      if (!paused) pilotarBike(dt);
    } else {
      giroVisual(dt);
      if (walking && actions?.andando) actions.andando.timeScale = walkTimeScale();
    }
    if (mixer) mixer.update(bike.on && paused ? 0 : dt);
    if (bike.on) {
      girarBike();
      // Roda livre: freando ou embalado sem pedalar, a catraca "tica" mais
      // rápido quanto maior o embalo.
      if (bike.vel > 0.08 && !bike.pedalando && !paused) {
        catracaT -= dt;
        if (catracaT <= 0) {
          onSom("catraca");
          catracaT = 0.035 + (1 - bike.vel) * 0.09;
        }
      }
    }
    // Na galeria, a Vila fica parada: só o relógio anda.
    if (noPredio()) {
      tickMuseu(dt);
      return;
    }
    pedro?.update(dt);
    vinicius?.update(dt);
    questMarker.update(t, dt);
    ocarina?.update(t, dt);
    // Perto do Pedro: o painel da quest aparece no canto da tela.
    if (pedro) {
      const near = Math.max(Math.abs(player.x - pedro.x), Math.abs(player.y - pedro.y)) <= QUEST_NEAR;
      if (near !== questNear) {
        questNear = near;
        onQuestNear(near);
      }
    }
    for (const w of walkers) w.update(dt);
    coletaveis.update(t, dt);
    historia.update(t, dt);
    // Depois de todos os mixers (jogador, Pedro, duplas): pose sentada.
    for (const s of sentados.values()) s.update(dt);
    soltarPertoFora();
    for (const qc of questsColeta) {
      if (!qc.walker) continue;
      qc.marker.update(t, dt);
      const p = tileOf(qc.walker.owner.root.position);
      const perto = Math.max(Math.abs(player.x - p.x), Math.abs(player.y - p.y)) <= QUEST_NEAR;
      if (perto !== qc.perto) {
        qc.perto = perto;
        onColetaPerto({ quest: qc.quest.id, perto });
      }
    }
    // Pedro e as duplas andam sozinhos: a dica "Espaço: …" acompanha quem
    // entra ou sai da frente do jogador (barato: uma consulta na grade).
    if (!player.move) reportFacing();
    if (coding && laptopPose) {
      for (const p of laptopPose) {
        p.o.scale.copy(p.s);
        p.o.quaternion.copy(p.q);
      }
    }

    for (const fn of frameUpdaters) fn(t, dt);

    // Ciclo dia/noite: luz (em lighting.update), postes/janelas e relógio do HUD.
    dayNight.update(dt);
    // Cena da ocarina: o relógio corre (para frente ou para trás), acelerando
    // no começo e freando no fim.
    if (tempoAnim) {
      tempoAnim.t += dt;
      const k = Math.min(tempoAnim.t / tempoAnim.dur, 1);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      dayNight.setHours(tempoAnim.from + (tempoAnim.to - tempoAnim.from) * e);
      if (k >= 1) tempoAnim = null;
    }
    epocas.update(t, dt);
    // Festa: o time pula de alegria em volta da estátua.
    if (reuniao.size && !reducedMotion) {
      for (const n of reuniao.keys()) n.fig.position.y = Math.abs(Math.sin(t * 5 + n.phase)) * 0.12;
    }
    nightLights.update(dayNight.state.night, t);
    const clock = formatClock(dayNight.state.hours);
    if (clock !== lastClock) {
      lastClock = clock;
      onClock({ time: clock, night: dayNight.state.night > 0.5 });
    }

    // NPCs: balão de frente para a câmera e "!" → "✓" depois da conversa
    // (líderes: estrela → "✓" depois de vencidos)
    // (estado, não animação: roda mesmo com reduced motion).
    for (const n of npcs) {
      setMarkerDone(n.marker, n.leader ? n.beaten : n.talked);
      n.marker.rotation.y = -n.fig.rotation.y;
    }
    // NPCs: respiração, cabeça balançando e balão flutuante.
    if (!reducedMotion) {
      for (const n of npcs) {
        const b = n.fig.userData.body;
        b.scale.y = 1 + Math.sin(t * 2.2 + n.phase) * 0.015;
        n.fig.userData.head.rotation.z = Math.sin(t * 0.9 + n.phase) * 0.05;
        n.marker.position.y = n.markerY + Math.sin(t * 2.4 + n.phase) * 0.045;
        n.marker.rotation.y = -n.fig.rotation.y + Math.sin(t * 1.3 + n.phase) * 0.12;
      }

      // Água ondulando, vitórias-régias e reflexos (scene/ground.js).
      groundFx.update(t);
    }

    // Mato alto balançando e brisa na vegetação.
    veg.update(t, dt);

    // Câmera segue o jogador; no modo vitrine, afasta e passeia pelo mapa;
    // numa cena, vai até o alvo da cena (com reduced motion, corta direto).
    cutscene.update(dt);
    const cutCam = cutscene.camera();
    // Numa cena, o zoom é o da cena; fora dela, o que o jogador escolheu.
    const zoomGoal = attract ? ATTRACT_ZOOM : cutCam ? cutCam.zoom : userZoom;
    // O zoom do jogador responde rápido; o da vitrine e o das cenas, devagar.
    const zoomRate = attract || cutCam ? 2.2 : 9;
    zoom += (zoomGoal - zoom) * (reducedMotion ? 1 : 1 - Math.exp(-dt * zoomRate));
    if (cutCam) {
      camTarget.lerp(cutCam.target, reducedMotion ? 1 : 1 - Math.exp(-dt * 2.6));
    } else if (attract) {
      if (!reducedMotion) attractT += dt;
      attractGoal.set(Math.sin(attractT * 0.07) * 6, 0, Math.cos(attractT * 0.05) * 3 - 1);
      camTarget.lerp(attractGoal, reducedMotion ? 1 : 1 - Math.exp(-dt * 1.2));
    } else {
      camTarget.lerp(player.root.position, reducedMotion ? 1 : 1 - Math.exp(-dt * 6));
    }
    const camFar = (camera.userData.far || 1) * zoom;
    camera.position.copy(camTarget).addScaledVector(CAM_OFFSET, camFar);
    camera.lookAt(camTarget.x, camTarget.y + 0.4, camTarget.z);
    // Sol, frustum de sombra e névoa acompanham a câmera; render (com ou sem
    // pós-processamento) fica no módulo de iluminação.
    avancarPreparoVila();
    // Convite da pista aberto (api.prepararPista): compila e sobe texturas
    // com a Vila na tela; o render fora da tela fica para o escuro da íris.
    if (preparo?.id === "pista" && !transicao) avancarPreparo(false);
    if (capa) return;
    lighting.update(camTarget, camFar);
    lighting.render(ts);
  }

  const vPos = new THREE.Vector3();
  const vLook = new THREE.Vector3();
  const vAlvoCam = new THREE.Vector3();
  // Itens e cristal de quest do interior atual; "perto" de quem dá a quest
  // aqui dentro (o Rafa da Galeria), como os walkers fazem na Vila.
  // Quem dá a quest num interior (`q.local`): fora de lá, não está "perto".
  function soltarPertoFora() {
    for (const qc of questsColeta) {
      if (!qc.perto || !qc.quest.local || qc.quest.local === local) continue;
      qc.perto = false;
      onColetaPerto({ quest: qc.quest.id, perto: false });
    }
  }
  function atualizarColetaInterior(dt) {
    soltarPertoFora();
    const c = coletaDoInterior.get(interior);
    if (!c) return;
    c.coleta?.update(t, dt);
    for (const qc of c.marcadores) {
      qc.marker.update(t, dt);
      const p = interior.tilePessoa?.(qc.quest.npc);
      const perto = Boolean(p) && Math.max(Math.abs(player.x - p.x), Math.abs(player.y - p.y)) <= QUEST_NEAR;
      if (perto !== qc.perto) {
        qc.perto = perto;
        onColetaPerto({ quest: qc.quest.id, perto });
      }
    }
  }

  function tickMuseu(dt) {
    if (coding && laptopPose) {
      for (const p of laptopPose) {
        p.o.scale.copy(p.s);
        p.o.quaternion.copy(p.q);
      }
    }
    dayNight.update(dt);
    const clock = formatClock(dayNight.state.hours);
    if (clock !== lastClock) {
      lastClock = clock;
      onClock({ time: clock, night: dayNight.state.night > 0.5 });
    }
    interior.update(t, dt);
    atualizarColetaInterior(dt);
    // Câmera: segue o jogador como na Vila (mais perto) ou voa até o quadro
    // em foco; ao fechar o close, volta devagar.
    const pose = foco ? interior.pose(foco) : null;
    if (pose) cameraDoQuadro(pose, vPos, vLook);
    else {
      // Na pista: mais afastada e adiantada na direção do movimento.
      vAlvoCam.copy(player.root.position);
      if (naPista()) adiantarCameraPista(dt, vAlvoCam);
      camTarget.lerp(vAlvoCam, reducedMotion ? 1 : 1 - Math.exp(-dt * 6));
      vLook.set(camTarget.x, camTarget.y + 0.4, camTarget.z);
      // Dolly do elevador: chega perto com o jogador na cabine e volta. Na
      // saída, recua numa curva suave (começa e termina parada) até o "seguir".
      if (dollyVolta && !reducedMotion) {
        dollyVolta.t += dt;
        const k = Math.min(dollyVolta.t / dollyVolta.dur, 1);
        zoomElevador = dollyVolta.de + (zoomElevadorAlvo - dollyVolta.de) * k * k * (3 - 2 * k);
        if (k >= 1) dollyVolta = null;
      } else zoomElevador = reducedMotion ? 1 : zoomElevador + (zoomElevadorAlvo - zoomElevador) * (1 - Math.exp(-dt * 2.4));
      const zoomLocal = naPista() ? (interior.zoom ?? PISTA_ZOOM) : MUSEU_ZOOM;
      vPos.copy(camTarget).addScaledVector(CAM_OFFSET, (camera.userData.far || 1) * zoomLocal * userZoom * zoomElevador);
    }
    if (voltaDoFoco > 0) voltaDoFoco -= dt;
    const suave = Boolean(pose) || voltaDoFoco > 0;
    const r = snapCamera || reducedMotion ? 1 : 1 - Math.exp(-dt * (suave ? 3 : 30));
    snapCamera = false;
    camPos.lerp(vPos, r);
    camLook.lerp(vLook, r);
    // Viagem de elevador: a câmera desliza na vertical (posição e alvo juntos).
    camera.position.copy(camPos);
    camera.position.y += deslizeElevador;
    vLook.copy(camLook);
    vLook.y += deslizeElevador;
    camera.lookAt(vLook);
    renderer.render(interior.scene, camera);
  }

  renderer.setAnimationLoop(tick);
  window.__vilaDbg = { get local() { return local; }, get interior() { return interior; }, player, occupied, passable, pedro, walkers, map, epocas, get paused() { return paused; }, get cut() { return cutscene.active; }, bike, liberarBike() { bikeLiberada = true; }, entrarPista: () => api.entrarPista(), api, get corrida() { return corrida; }, espiarCorrida(fn) { espiaCorrida = fn; } }; // TEMP-HOOK
  reportFacing();
  prepararVila();
  onReady();

  function dispose() {
    disposed = true;
    // Os interiores guardados (o atual e o anterior, guardarSoRecentes): cada
    // um descarta os próprios recursos (o escritório tem `track` próprio).
    for (const i of interiores.values()) descartarInterior(i);
    interiores.clear();
    pedro?.dispose();
    vinicius?.dispose();
    ocarina?.dispose();
    for (const w of walkers) w.dispose();
    renderer.setAnimationLoop(null);
    ro.disconnect();
    io.disconnect();
    renderer.domElement.removeEventListener("pointermove", onPointerMove);
    renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
    renderer.domElement.removeEventListener("click", onClick);
    scene.traverse((o) => {
      if (o.isMesh) {
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const mat of mats) {
          if (!mat) continue;
          for (const val of Object.values(mat)) if (val && val.isTexture) val.dispose();
          mat.dispose();
        }
      }
      if (o.isInstancedMesh) o.dispose();
    });
    for (const d of disposables) d.dispose?.();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return api;
}
