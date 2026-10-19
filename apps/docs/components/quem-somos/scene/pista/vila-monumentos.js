// Pista de bicicleta da Vila SEMEC: os monumentos da zona "vila" — maquetes
// dos prédios da Vila, totem do Design System, pedestais dos mascotes,
// esculturas de código, insígnias das Stacks, fonte e mastros. Mesmo
// esquema de vila-pecas.js: coordenadas locais num construtor `k`
// (novaPeca), frente em +z (sul, de frente para a câmera), tudo no lote
// fixo; placas no atlas da vila; lâmpadas em k.luz.
//
// As maquetes resumem os prédios de buildings/ (mesmas cores e formas, em
// poucas caixas): Front-End (estúdio bege com vidro e faixa azul-marinho),
// Back-End (bloco grafite com aletas e o verde dos LEDs), Banco de Dados
// (torre de três tambores com faixas âmbar) e a sede SEMEC (marquise
// branca e a torre de vidro azul em dois volumes).

import * as THREE from "three";
import { estrela, extrudar, traco } from "./vila-pecas";

// Placa do atlas no plano da frente (z) de uma face, centro (x, y).
const naFrente = (k, regiao, x, y, z, w, h, incl = 0) => {
  const m = new THREE.Matrix4().makeTranslation(x, y, z);
  if (incl) m.multiply(new THREE.Matrix4().makeRotationX(incl));
  k.placa(regiao, w, h, m);
};

// Base de maquete: placa clara com o gramado em cima (h = 0.1).
function baseMaquete(k, cor, w, d) {
  k.caixa(cor.maqueteBase, 0, 0, w, d, 0, 0.07);
  k.caixa(cor.maqueteGrama, 0, 0, w - 0.1, d - 0.1, 0.07, 0.1);
}

// Arvorezinha de maquete (bolinha num pauzinho).
function arvorezinha(k, cor, x, z, c) {
  k.cil(cor.madeira, x, z, 0.02, 0.025, 0.1, 0.3, 4);
  k.bola(c ?? cor.folhaClara, x, 0.38, z, 0.13);
}

export function maqueteFrontEnd(k, cor) {
  baseMaquete(k, cor, 3.0, 2.0);
  const H = 0.1;
  // Térreo de vidro recuado, laje, andar bege com janelas e cobertura.
  k.caixa(cor.vidro, 0, -0.05, 2.3, 1.2, H, H + 0.55);
  k.caixa(cor.laje, 0, 0, 2.5, 1.45, H + 0.55, H + 0.63);
  k.caixa(cor.bege, 0, -0.05, 2.4, 1.3, H + 0.63, H + 1.35);
  for (let i = 0; i < 5; i++) k.caixa(cor.vidro, -0.96 + i * 0.48, 0.61, 0.34, 0.03, H + 0.82, H + 1.2);
  k.caixa(cor.navy, 0, 0.62, 2.42, 0.04, H + 0.63, H + 0.74);
  k.caixa(cor.laje, 0, -0.05, 2.5, 1.4, H + 1.35, H + 1.43);
  // Pilares do térreo.
  for (const sx of [-1.15, 1.15]) k.caixa(cor.navy, sx, 0.6, 0.1, 0.1, H, H + 0.55);
  naFrente(k, "frontend", 0, H + 1.62, 0.25, 1.1, 0.275, -0.6);
  k.caixa(cor.ferro, 0, 0.18, 0.04, 0.04, H + 1.43, H + 1.55);
  arvorezinha(k, cor, -1.3, 0.75);
  arvorezinha(k, cor, 1.3, 0.75, cor.ipe);
}

export function maqueteBackEnd(k, cor) {
  baseMaquete(k, cor, 3.0, 2.0);
  const H = 0.1;
  k.caixa(cor.grafite, 0, -0.05, 2.4, 1.3, H, H + 1.3);
  // Aletas verticais e a faixa de LED verde.
  for (let i = 0; i < 9; i++) k.caixa(cor.grafiteClaro, -1.12 + i * 0.28, 0.63, 0.07, 0.07, H + 0.1, H + 1.25);
  k.caixa(cor.led, 0, 0.62, 2.42, 0.03, H + 0.95, H + 1.0);
  k.caixa(cor.escuro, 0, 0.61, 0.6, 0.04, H, H + 0.45);
  k.caixa(cor.laje, 0, -0.05, 2.5, 1.4, H + 1.3, H + 1.36);
  // Máquinas no teto.
  k.caixa(cor.unidade, -0.6, -0.25, 0.5, 0.45, H + 1.36, H + 1.56);
  k.caixa(cor.unidade, 0.1, -0.25, 0.5, 0.45, H + 1.36, H + 1.56);
  k.cil(cor.ferro, 0.75, -0.2, 0.16, 0.16, H + 1.36, H + 1.5, 8);
  naFrente(k, "backend", 0, H + 1.72, 0.15, 1.1, 0.275, -0.6);
  arvorezinha(k, cor, -1.3, 0.75);
  arvorezinha(k, cor, 1.3, 0.75);
}

export function maqueteDados(k, cor) {
  baseMaquete(k, cor, 2.0, 2.0);
  const H = 0.1;
  // Três tambores (o ícone de banco de dados) com faixas âmbar entre eles.
  const R = 0.72;
  const t = 0.78;
  for (let i = 0; i < 3; i++) {
    const h0 = H + i * (t + 0.12);
    k.cil(cor.bege, 0, 0, R, R, h0, h0 + t, 14);
    // Aletas.
    const nAletas = cor.lite ? 6 : 12;
    for (let a = 0; a < nAletas; a++) {
      const ang = (a / nAletas) * Math.PI * 2;
      k.caixa(cor.begeClaro, Math.sin(ang) * (R + 0.02), Math.cos(ang) * (R + 0.02), 0.06, 0.06, h0 + 0.06, h0 + t - 0.06, ang);
    }
    if (i < 2) k.cil(cor.ambar, 0, 0, R - 0.06, R - 0.06, h0 + t, h0 + t + 0.12, 14);
  }
  const topo = H + 3 * t + 0.24;
  k.cil(cor.laje, 0, 0, R * 0.55, R, topo, topo + 0.16, 14);
  k.cil(cor.ambar, 0, 0, 0.12, R * 0.5, topo + 0.16, topo + 0.32, 6);
  naFrente(k, "dados", 0, H + 0.42, R + 0.06, 1.1, 0.275, -0.35);
  arvorezinha(k, cor, -0.8, 0.8);
  arvorezinha(k, cor, 0.8, 0.8, cor.ipe);
}

export function maqueteSemec(k, cor) {
  baseMaquete(k, cor, 3.6, 2.2);
  const H = 0.1;
  // Térreo de vidro escuro, dois blocos brancos e a marquise larga.
  k.caixa(cor.vidroEsc, 0, 0.1, 2.6, 1.0, H, H + 0.45);
  k.caixa(cor.branco, -1.15, 0.1, 0.5, 1.1, H, H + 0.45);
  k.caixa(cor.branco, 1.15, 0.1, 0.5, 1.1, H, H + 0.45);
  k.caixa(cor.branco, 0, 0.18, 3.3, 1.5, H + 0.45, H + 0.58);
  // Torre de vidro azul: o volume da esquerda mais alto.
  k.caixa(cor.vidroAzul, -0.45, -0.3, 1.3, 0.85, H + 0.58, H + 2.5);
  k.caixa(cor.vidroAzul2, 0.75, -0.3, 1.0, 0.8, H + 0.85, H + 1.9);
  k.caixa(cor.branco, 0.75, -0.3, 1.04, 0.84, H + 0.58, H + 0.85);
  k.caixa(cor.laje, -0.45, -0.3, 1.34, 0.89, H + 2.5, H + 2.56);
  k.caixa(cor.laje, 0.75, -0.3, 1.04, 0.84, H + 1.9, H + 1.95);
  // Caixilhos (faixas horizontais claras na pele de vidro).
  for (let i = 1; i < 6; i++) k.caixa(cor.caixilho, -0.45, 0.13, 1.31, 0.02, H + 0.58 + i * 0.32, H + 0.6 + i * 0.32);
  for (let i = 1; i < 4; i++) k.caixa(cor.caixilho, 0.75, 0.11, 1.01, 0.02, H + 0.85 + i * 0.27, H + 0.87 + i * 0.27);
  // Mastros de bandeira na marquise.
  for (const [sx, c] of [
    [1.25, cor.azul],
    [1.45, cor.amarelo],
  ]) {
    k.cil(cor.ferro, sx, 0.78, 0.015, 0.015, H + 0.58, H + 1.3, 4);
    k.caixa(c, sx + 0.1, 0.78, 0.2, 0.01, H + 1.12, H + 1.28);
  }
  arvorezinha(k, cor, -1.55, 0.85, cor.ipe);
  arvorezinha(k, cor, 1.6, 0.85);
}

// Fonte redonda: bacia, água, coluna e a taça de cima.
export function pecaFonte(k, cor, r) {
  k.cil(cor.mureta, 0, 0, r, r + 0.05, 0, 0.28, 14);
  k.cil(cor.agua, 0, 0, r - 0.1, r - 0.1, 0.28, 0.3, 14);
  k.cil(cor.mureta, 0, 0, 0.1, 0.13, 0.3, 0.72, 6);
  k.cil(cor.mureta, 0, 0, 0.32, 0.12, 0.72, 0.82, 10);
  k.cil(cor.agua, 0, 0, 0.27, 0.27, 0.82, 0.84, 10);
  k.cil(cor.aguaClara, 0, 0, 0.02, 0.07, 0.84, 1.0, 6);
}

// Totem do Design System: base em degraus com o título, pilha de cubos
// nas cores dos tokens (girados alternadamente) e luzinhas na base. A
// estrela do topo gira (vila-estatuas.js, extras): devolve a altura dela.
export function pecaTotem(k, cor, tokens) {
  k.cil(cor.pedraClara, 0, 0, 0.95, 1.0, 0, 0.22, 8);
  k.cil(cor.pedra, 0, 0, 0.72, 0.78, 0.22, 0.5, 8);
  const lado = 0.66;
  let h = 0.5;
  tokens.forEach((c, i) => {
    const giro = i % 2 ? Math.PI / 8 : 0;
    k.caixa(c, 0, 0, lado, lado, h, h + 0.58, giro);
    // Filete branco entre os cubos.
    k.caixa(cor.branco, 0, 0, lado * 0.82, lado * 0.82, h + 0.58, h + 0.62, giro);
    h += 0.62;
  });
  naFrente(k, "ds", 0, 0.36, 0.86, 1.4, 0.35, -0.7);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    k.luz(Math.sin(a) * 0.92, 0.27, Math.cos(a) * 0.92, "pisca");
  }
  return h + 0.45;
}

// Pedestal de estátua: prisma octogonal de mármore, aro na cor do mascote
// e a plaquinha com o nome na frente.
export function pecaPedestal(k, cor, aro, regiao) {
  k.cil(cor.pedraClara, 0, 0, 0.62, 0.66, 0, 0.1, 8);
  k.cil(cor.marmore, 0, 0, 0.52, 0.56, 0.1, 0.44, 8);
  k.cil(aro, 0, 0, 0.58, 0.58, 0.44, 0.5, 8);
  naFrente(k, regiao, 0, 0.27, 0.56, 0.62, 0.234, -0.45);
}

// Esculturas de código: { }, </> e ; em traços grossos, sobre um plinto,
// inclinadas um pouco para trás (lê-se melhor de cima).
// Meia chave "{" (bico à esquerda), de cima para baixo.
const CHAVE = [[0.32, 1.75], [0.1, 1.7], [-0.02, 1.55], [-0.02, 1.12], [-0.12, 0.96], [-0.32, 0.875], [-0.12, 0.79], [-0.02, 0.63], [-0.02, 0.2], [0.1, 0.05], [0.32, 0.0]];
const GLIFOS = {
  chaves: {
    largura: 2.4,
    fundo: 0.2,
    tracos: [
      { c: "chave", esp: 0.18, pts: CHAVE.map(([x, y]) => [x - 0.62, y]) },
      { c: "chave", esp: 0.18, pts: CHAVE.map(([x, y]) => [0.62 - x, y]) },
    ],
  },
  tag: {
    largura: 2.8,
    tracos: [
      { c: "tagLado", esp: 0.24, pts: [[-0.55, 1.45], [-1.25, 0.82], [-0.55, 0.2]] },
      { c: "tagBarra", esp: 0.24, pts: [[-0.3, 0.0], [0.3, 1.7]] },
      { c: "tagLado", esp: 0.24, pts: [[0.55, 1.45], [1.25, 0.82], [0.55, 0.2]] },
    ],
  },
  ponto: {
    largura: 1.0,
    tracos: [
      { c: "pontoV", esp: 0.42, pts: [[0, 1.1], [0, 1.52]] },
      { c: "pontoV", esp: 0.42, pts: [[0, 0.42], [0, 0.84]] },
      { c: "pontoV", esp: 0.22, pts: [[0.1, 0.5], [0.05, 0.2], [-0.2, -0.12]] },
    ],
  },
};
export function pecaCodigo(k, cor, glifo) {
  const gl = GLIFOS[glifo];
  const w = gl.largura;
  k.caixa(cor.pedra, 0, 0, w, 0.7, 0, 0.18);
  k.caixa(cor.pedraClara, 0, 0, w - 0.12, 0.58, 0.18, 0.26);
  const m = new THREE.Matrix4().makeTranslation(0, 0.26, 0).multiply(new THREE.Matrix4().makeRotationX(-0.28));
  for (const t of gl.tracos) {
    const g = extrudar(traco(t.pts, t.esp), gl.fundo ?? 0.3);
    g.translate(0, 0.08, 0).applyMatrix4(m);
    k.geo(g, cor[t.c]);
  }
}

// Insígnia de Stack: poste, medalhão inclinado para a câmera (aro na cor
// da Stack) e a imagem da insígnia (atlas) na face.
export function pecaMedalha(k, cor, aro, regiao) {
  k.cil(cor.pedra, 0, 0, 0.22, 0.26, 0, 0.12, 6);
  k.cil(cor.ferro, 0, 0, 0.05, 0.06, 0.12, 1.25, 5);
  const incl = -0.45;
  const m = new THREE.Matrix4().makeTranslation(0, 1.45, 0).multiply(new THREE.Matrix4().makeRotationX(incl));
  const disco = new THREE.CylinderGeometry(0.52, 0.52, 0.1, 16);
  disco.rotateX(Math.PI / 2);
  disco.applyMatrix4(m);
  k.geo(disco, aro);
  const fita = (s) => {
    const g = new THREE.BoxGeometry(0.14, 0.42, 0.02);
    g.translate(0, -0.2, 0);
    g.rotateZ(s * 0.35);
    g.translate(s * 0.14, -0.38, -0.07);
    g.applyMatrix4(m);
    k.geo(g, aro);
  };
  fita(-1);
  fita(1);
  k.placa(regiao, 0.98, 0.98, m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.056)));
}

// Mastro das bandeirinhas (a ponta é uma bolinha amarela).
export function pecaMastro(k, cor, alt) {
  k.cil(cor.pedra, 0, 0, 0.12, 0.14, 0, 0.1, 6);
  k.cil(cor.branco, 0, 0, 0.035, 0.045, 0.1, alt, 5);
  k.bola(cor.amarelo, 0, alt + 0.04, 0, 0.07);
}

// A estrela do topo do totem (geometria local, centrada na origem).
export function geoEstrela() {
  return estrela(0.42, 0.18, 0.16);
}
