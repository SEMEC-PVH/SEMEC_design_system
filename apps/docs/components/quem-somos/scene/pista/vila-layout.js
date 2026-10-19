// Pista de bicicleta da Vila SEMEC: onde fica cada peça da zona "vila"
// (puro, sem three.js: testável no Node, como zonas.js).
//
// Coordenadas em tile contínuo (o centro do tile (x, y) é o ponto (x, y)).
// Cada peça diz o seu raio `r` (ou o retângulo w × d) e a altura `alt`:
// vila.js confere, antes de montar, que a pegada inteira é da zona "vila"
// (zonas.naZona) e que `alt` não passa de zonas.alturaMax em nenhum tile
// dela (a câmera vem do sul, alta: nada pode tapar o asfalto). Peça que
// não cabe é pulada com um aviso no console.
//
// Duas áreas (zonas.js):
//   B — o miolo do "S" (x 15..31, y 12..35), de norte para sul:
//       Jardim dos Tokens (y 12..17): canteiros com as cores dos tokens,
//         botões gigantes do Design System e um caminho de "amostras".
//         Baixo: logo ao norte passa o "alto" da pista.
//       Praça dos Mascotes (centro (24, 22.5)): o totem do Design System e
//         as estátuas dos mascotes do time em volta, com bandeirinhas.
//       Mini Vila (y 28..35): maquetes da sede SEMEC, dos ginásios Front-End
//         e Back-End e da torre do Banco de Dados, com fonte e bicicletário.
//   b — o miolo do grampo (x 57..74, y 17..31):
//       Praça do Código: { } </> ; gigantes, o switch e o checkbox do kit e
//         as insígnias das Stacks; ao norte (baixo, o grampo passa ali)
//         canteiros e um teclado gigante.

// Centro da Praça dos Mascotes e raio do anel das estátuas.
export const PRACA = { x: 24, y: 22.6, raio: 4.5, anel: 3.25 };

// Mascotes (GLBs -leve em public/quem-somos, ver vila-estatuas.js): ordem no
// anel, a partir do norte, no sentido horário. `alt` = altura da estátua.
export const MASCOTES = [
  { id: "samurai", arquivo: "leo-samurai.glb", nome: "Samurai", cor: "green-500", alt: 1.6 },
  { id: "waffle", arquivo: "rafa-waffle.glb", nome: "Waffle", cor: "blue-500", alt: 1.25 },
  { id: "coelho", arquivo: "tiago-coelho.glb", nome: "Coelho", cor: "yellow-500", alt: 1.5 },
  { id: "rena", arquivo: "mariana-rena.glb", nome: "Rena", cor: "blue-800", alt: 1.5 },
  { id: "livro", arquivo: "ze-carlos-livro.glb", nome: "Livro", cor: "red-500", alt: 1.3 },
  { id: "microfone", arquivo: "emily-microfone.glb", nome: "Microfone", cor: "red-300", alt: 1.45 },
  // A ocarina é comprida: `alt` vale para a maior medida (porMaior) e ela
  // flutua um pouco acima do pedestal.
  { id: "ocarina", arquivo: "ocarina.glb", nome: "Ocarina", cor: "blue-400", alt: 0.95, porMaior: true, flutua: 0.35 },
];
// No `lite`: só estes (menos triângulos).
export const MASCOTES_LITE = ["waffle", "coelho", "rena", "ocarina"];

// Posição de cada estátua no anel (n estátuas). Meio passo de defasagem:
// nenhuma fica bem ao norte, escondida atrás do totem.
export function anelEstatuas(n) {
  return Array.from({ length: n }, (_, i) => {
    const a = ((i + 0.5) / n) * Math.PI * 2;
    return { x: PRACA.x + Math.sin(a) * PRACA.anel, y: PRACA.y - Math.cos(a) * PRACA.anel };
  });
}

export const ALT_PEDESTAL = 0.5;
export const ALT_TOTEM = 4.6;

// Peças (tipo → parâmetros). r: raio da pegada; w/d: retângulo (giro 0).
export const PECAS = [
  // ---- B: Jardim dos Tokens ----------------------------------------------------
  { tipo: "placa", texto: "jardim", x: 24, y: 15.5, w: 2.4, alt: 1.3 },
  { tipo: "canteiro", x: 18.6, y: 13.9, w: 2.2, d: 1.4, flor: "blue-500", alt: 0.5 },
  { tipo: "canteiro", x: 21.2, y: 13.3, w: 2.2, d: 1.4, flor: "yellow-500", alt: 0.5 },
  { tipo: "canteiro", x: 23.8, y: 13.1, w: 2.2, d: 1.4, flor: "red-500", alt: 0.5 },
  { tipo: "canteiro", x: 26.4, y: 13.3, w: 2.2, d: 1.4, flor: "white", alt: 0.5 },
  { tipo: "canteiro", x: 28.5, y: 14.5, w: 1.8, d: 1.4, flor: "blue-300", alt: 0.5 },
  { tipo: "botao", variante: "primario", x: 18.6, y: 16.0, alt: 0.8 },
  { tipo: "botao", variante: "secundario", x: 21.3, y: 15.5, alt: 0.8 },
  { tipo: "botao", variante: "perigo", x: 26.7, y: 15.5, alt: 0.8 },
  { tipo: "botao", variante: "sucesso", x: 29.3, y: 16.2, alt: 0.8 },
  { tipo: "banco", x: 21.0, y: 17.4, giro: 0, alt: 0.7 },
  { tipo: "banco", x: 27.0, y: 17.4, giro: 0, alt: 0.7 },
  { tipo: "poste", x: 22.5, y: 17.7, alt: 2.0 },
  { tipo: "poste", x: 25.5, y: 17.7, alt: 2.0 },

  // ---- B: Praça dos Mascotes (o totem, as estátuas e os mastros saem de PRACA) -
  { tipo: "placa", texto: "mascotes", x: 24, y: 27.9, w: 2.6, alt: 1.3 },
  { tipo: "baloes", x: 21.4, y: 27.6, alt: 2.8 },
  { tipo: "baloes", x: 26.4, y: 27.5, alt: 2.8 },
  { tipo: "ipe", x: 18.4, y: 20.0, alt: 2.0 },
  { tipo: "ipe", x: 29.8, y: 20.4, alt: 2.0 },
  { tipo: "ipe", x: 18.5, y: 25.6, alt: 2.0 },
  { tipo: "ipe", x: 30.2, y: 25.8, alt: 2.0 },
  { tipo: "banco", x: 19.3, y: 22.8, giro: Math.PI / 2, alt: 0.7 },
  { tipo: "banco", x: 28.9, y: 22.8, giro: -Math.PI / 2, alt: 0.7 },

  // ---- B: Mini Vila --------------------------------------------------------------
  { tipo: "maquete", modelo: "dados", x: 20.3, y: 30.0, w: 2.0, d: 2.0, alt: 3.1 },
  { tipo: "maquete", modelo: "semec", x: 28.4, y: 30.0, w: 3.6, d: 2.2, alt: 2.7 },
  { tipo: "maquete", modelo: "frontend", x: 20.9, y: 33.7, w: 3.0, d: 2.0, alt: 1.9 },
  { tipo: "maquete", modelo: "backend", x: 27.4, y: 33.7, w: 3.0, d: 2.0, alt: 1.9 },
  // A fonte é a rotatória no cruzamento das ruas da Mini Vila.
  { tipo: "fonte", x: 24.0, y: 31.9, r: 0.85, alt: 1.0 },
  { tipo: "bicicletario", x: 16.9, y: 32.6, giro: Math.PI / 2, n: 3, alt: 0.8 },
  { tipo: "banco", x: 16.8, y: 29.6, giro: Math.PI / 2, alt: 0.7 },
  { tipo: "baloes", x: 18.8, y: 34.4, alt: 2.8 },
  { tipo: "baloes", x: 30.3, y: 34.4, alt: 2.8 },
  { tipo: "poste", x: 18.4, y: 31.9, alt: 2.0 },
  { tipo: "poste", x: 30.6, y: 31.9, alt: 2.0 },

  // ---- b: Praça do Código ----------------------------------------------------------
  { tipo: "placa", texto: "codigo", x: 66, y: 31.0, w: 2.6, alt: 1.3 },
  { tipo: "codigo", glifo: "chaves", x: 61.4, y: 25.4, w: 2.6, alt: 2.1 },
  { tipo: "codigo", glifo: "tag", x: 66.0, y: 24.6, w: 3.0, alt: 2.1 },
  { tipo: "codigo", glifo: "ponto", x: 70.2, y: 25.6, w: 1.2, alt: 2.1 },
  { tipo: "medalha", id: "front", cor: "blue-500", x: 59.6, y: 29.0, alt: 2.0 },
  { tipo: "medalha", id: "back", cor: "green-500", x: 62.2, y: 29.4, alt: 2.0 },
  { tipo: "medalha", id: "dados", cor: "yellow-500", x: 64.7, y: 29.0, alt: 2.0 },
  { tipo: "medalha", id: "ia", cor: "blue-800", x: 67.3, y: 29.0, alt: 2.0 },
  { tipo: "medalha", id: "full", cor: "red-500", x: 69.8, y: 29.4, alt: 2.0 },
  { tipo: "medalha", id: "pedal", cor: "green-700", x: 72.3, y: 29.0, alt: 2.0 },
  { tipo: "canteiro", x: 62.2, y: 20.4, w: 2.0, d: 1.2, flor: "blue-500", alt: 0.5 },
  { tipo: "canteiro", x: 68.6, y: 20.4, w: 2.0, d: 1.2, flor: "yellow-500", alt: 0.5 },
  { tipo: "canteiro", x: 65.4, y: 18.6, w: 2.4, d: 1.1, flor: "red-500", alt: 0.5 },
  { tipo: "teclado", x: 65.4, y: 21.0, alt: 0.6 },
  { tipo: "switch", x: 62.6, y: 22.5, alt: 0.8 },
  { tipo: "checkbox", x: 69.2, y: 22.5, alt: 0.9 },
  { tipo: "banco", x: 60.6, y: 22.6, giro: 0.35, alt: 0.7 },
  { tipo: "banco", x: 70.4, y: 22.6, giro: -0.35, alt: 0.7 },
  { tipo: "baloes", x: 59.4, y: 26.6, alt: 2.8 },
  { tipo: "baloes", x: 71.6, y: 27.2, alt: 2.8 },
  { tipo: "poste", x: 63.6, y: 27.2, alt: 2.0 },
  { tipo: "poste", x: 68.4, y: 27.2, alt: 2.0 },
  { tipo: "ipe", x: 58.4, y: 28.2, alt: 2.0 },
];

// Mastros das bandeirinhas (altura ALT_MASTRO) e os varais entre eles
// (pares de índices; cada varal leva bandeirinhas ou luzinhas).
export const ALT_MASTRO = 2.3;
export const MASTROS = [
  // Praça dos Mascotes: quadrado em volta (cantos a 45°).
  { x: 20.6, y: 19.2 },
  { x: 27.4, y: 19.2 },
  { x: 27.4, y: 26.0 },
  { x: 20.6, y: 26.0 },
  // Praça do Código.
  { x: 59.0, y: 23.6 },
  { x: 70.6, y: 23.6 },
  { x: 59.0, y: 27.8 },
  { x: 72.6, y: 27.9 },
];
export const VARAIS = [
  { de: 0, para: 1, tipo: "bandeiras" },
  { de: 1, para: 2, tipo: "luzes" },
  { de: 2, para: 3, tipo: "bandeiras" },
  { de: 3, para: 0, tipo: "luzes" },
  { de: 4, para: 5, tipo: "luzes" },
  { de: 6, para: 7, tipo: "bandeiras" },
];

// Caminhos (retângulos no chão, tiles) e praças redondas.
export const CAMINHOS = [
  // Jardim → praça → Mini Vila (eixo x = 24).
  { x0: 23.4, x1: 24.6, y0: 16.2, y1: 18.4, cor: "amostras" },
  { x0: 23.4, x1: 24.6, y0: 26.6, y1: 35.4 },
  // Mini Vila: rua leste-oeste.
  { x0: 17.6, x1: 31.0, y0: 31.4, y1: 32.4 },
  // Praça do Código: passeio em L até as insígnias.
  { x0: 58.6, x1: 73.2, y0: 27.5, y1: 28.3 },
  { x0: 65.5, x1: 66.5, y0: 27.2, y1: 30.6 },
];
export const PRACAS = [
  { x: PRACA.x, y: PRACA.y, r: PRACA.raio },
  { x: 66, y: 25.2, r: 2.2 },
];
// Pisos das maquetes (mesa de maquete: base clara com gramado em cima).
export const MESA_MINI_VILA = { x0: 18.0, x1: 31.0, y0: 28.6, y1: 35.4 };

// Meia-pegada (rx, ry) de uma peça, em tiles, alinhada aos eixos.
const MEIA = {
  placa: (p) => [p.w / 2, 0.35],
  canteiro: (p) => [p.w / 2, p.d / 2],
  botao: () => [1.05, 0.45],
  banco: () => [0.55, 0.55],
  poste: () => [0.2, 0.2],
  mastro: () => [0.2, 0.2],
  ipe: () => [0.7, 0.7],
  maquete: (p) => [p.w / 2, p.d / 2],
  fonte: (p) => [p.r, p.r],
  codigo: (p) => [p.w / 2, 0.55],
  medalha: () => [0.55, 0.35],
  baloes: () => [0.8, 0.8],
  bicicletario: () => [1.15, 0.5],
  teclado: () => [1.15, 0.5],
  switch: () => [0.8, 0.45],
  checkbox: () => [0.5, 0.5],
  estatua: () => [0.6, 0.6],
  totem: () => [0.95, 0.95],
};
export function pegada(p) {
  const [rx, ry] = (MEIA[p.tipo] ?? (() => [p.r ?? 0.5, p.r ?? 0.5]))(p);
  // Girada ~90°: troca os eixos.
  const g = Math.abs(Math.sin(p.giro ?? 0));
  return g > 0.7 ? [ry, rx] : [rx, ry];
}

// A peça cabe? Toda a pegada na zona "vila" e `alt` ≤ alturaMax em cada
// tile dela. Devolve null se cabe, ou o motivo.
export function naoCabe(zonas, p) {
  const [rx, ry] = pegada(p);
  for (let dy = -ry; dy <= ry + 1e-6; dy += Math.min(0.25, ry)) {
    for (let dx = -rx; dx <= rx + 1e-6; dx += Math.min(0.25, rx)) {
      const x = p.x + dx;
      const y = p.y + dy;
      if (!zonas.naZona("vila", x, y)) return `fora da zona em (${x.toFixed(1)}, ${y.toFixed(1)})`;
      const m = zonas.alturaMax(x, y);
      if (p.alt > m) return `alta demais em (${x.toFixed(1)}, ${y.toFixed(1)}): ${p.alt} > ${m.toFixed(2)}`;
    }
  }
  return null;
}

// Todas as peças, inclusive as que saem de PRACA e MASTROS (para conferir
// de uma vez, no jogo e no teste do Node).
export function todasPecas(lite) {
  const ms = lite ? MASCOTES.filter((m) => MASCOTES_LITE.includes(m.id)) : MASCOTES;
  const anel = anelEstatuas(ms.length);
  return [
    ...PECAS,
    { tipo: "totem", x: PRACA.x, y: PRACA.y, alt: ALT_TOTEM + 0.6 },
    ...ms.map((m, i) => ({ tipo: "estatua", mascote: m, ...anel[i], alt: ALT_PEDESTAL + (m.flutua ?? 0) + m.alt })),
    ...MASTROS.map((m, i) => ({ tipo: "mastro", indice: i, ...m, alt: ALT_MASTRO + 0.1 })),
  ];
}
