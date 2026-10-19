// Pista de bicicleta da Vila SEMEC: o atlas de canvas da zona "vila"
// (letreiros das maquetes, o título do totem, os botões gigantes, as placas
// das praças, os nomes dos mascotes e as insígnias das Stacks).
//
// Um canvas só (1024 × 1024; metade no `lite`) → uma textura e um lote com
// uv remapeado (criarLote({ uv: true }) de comum.js): um draw call para
// todas as placas da vila. As regiões fora do desenho (cantos dos botões,
// em volta das insígnias) ficam transparentes: o material usa alphaTest.
//
// As insígnias são as mesmas imagens da StackDex (insignias.js): carregam
// em paralelo (contadas na tela de carregamento por ctx.carregar) e são
// pintadas por cima de um disco na cor da Stack — se uma falhar, o disco
// fica.

import * as THREE from "three";
import { urlInsignia } from "../../insignias";

const W = 1024;
const H = 1024;

export function criarRotulos(ctx) {
  const { pal, pv, mix, lite } = ctx;
  const k = lite ? 0.5 : 1;
  const canvas = document.createElement("canvas");
  canvas.width = W * k;
  canvas.height = H * k;
  const g = canvas.getContext("2d");
  g.scale(k, k);
  const regioes = {};
  const reg = (nome, x, y, w, h) => {
    regioes[nome] = { u0: (x + 1) / W, u1: (x + w - 1) / W, v0: 1 - (y + h - 1) / H, v1: 1 - (y + 1) / H };
  };
  const texto = (str, x, y, { tam = 64, peso = 700, cor, max = 1000 }) => {
    let s = tam;
    g.font = `${peso} ${s}px ${pal.font}`;
    while (g.measureText(str).width > max && s > 10) {
      s -= 2;
      g.font = `${peso} ${s}px ${pal.font}`;
    }
    g.fillStyle = cor.getStyle();
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(str, x, y);
  };
  const arred = (x, y, w, h, r, cor) => {
    g.fillStyle = cor.getStyle();
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    g.fill();
  };
  const branco = pv("white");
  const escuro = pv("gray-900");

  // Letreiros das maquetes (512 × 128), nas cores dos prédios da Vila.
  const letreiro = (nome, x, y, fundo, frente, str, faixa) => {
    arred(x + 4, y + 4, 504, 120, 18, fundo);
    if (faixa) {
      g.fillStyle = faixa.getStyle();
      g.fillRect(x + 20, y + 102, 472, 10);
    }
    texto(str, x + 256, y + 60, { tam: 74, cor: frente, max: 450 });
    reg(nome, x, y, 512, 128);
  };
  letreiro("frontend", 0, 0, pv("blue-900"), branco, "FRONT-END", pv("blue-400"));
  letreiro("backend", 512, 0, pv("green-800"), branco, "BACK-END", pv("green-500"));
  letreiro("dados", 0, 128, mix(pv("yellow-800"), pv("gray-900"), 0.35), pv("yellow-400"), "DADOS", pv("yellow-500"));
  letreiro("ds", 512, 128, pv("blue-900"), branco, "DESIGN SYSTEM", pv("yellow-500"));

  // Botões gigantes (340 × 128, cápsula): as variantes do Button do kit.
  const botao = (nome, x, fundo, frente, str, borda) => {
    const y = 256;
    if (borda) arred(x + 6, y + 10, 328, 108, 54, borda);
    arred(x + (borda ? 16 : 6), y + (borda ? 20 : 10), borda ? 308 : 328, borda ? 88 : 108, 54, fundo);
    texto(str, x + 170, y + 66, { tam: 50, cor: frente, max: 260 });
    reg(nome, x, y, 340, 128);
  };
  botao("primario", 0, pv("blue-700"), branco, "Primário");
  botao("secundario", 340, branco, pv("blue-700"), "Secundário", pv("blue-700"));
  botao("perigo", 680, pv("red-600"), branco, "Perigo");

  // Placas das praças (512 × 128): fundo verde da Vila com faixa amarela.
  const placa = (nome, x, y, str, fundo = pv("green-700")) => {
    arred(x + 4, y + 4, 504, 120, 16, fundo);
    g.fillStyle = pv("yellow-500").getStyle();
    g.fillRect(x + 4, y + 104, 504, 12);
    texto(str, x + 256, y + 56, { tam: 58, cor: branco, max: 460 });
    reg(nome, x, y, 512, 128);
  };
  placa("mascotes", 0, 384, "Praça dos Mascotes");
  placa("jardim", 512, 384, "Jardim dos Tokens");
  placa("codigo", 0, 512, "Praça do Código");
  placa("minivila", 512, 512, "Mini Vila SEMEC", pv("blue-700"));
  // O 4º botão (verde, "Sucesso") ao lado da placa do código.
  {
    const x = 0;
    const y = 896;
    arred(x + 6, y + 10, 328, 108, 54, pv("green-600"));
    texto("Sucesso", x + 170, y + 66, { tam: 50, cor: branco, max: 260 });
    reg("sucesso", x, y, 340, 128);
  }

  // Nomes dos mascotes (plaquinhas dos pedestais, 170 × 64).
  const nomes = ["Samurai", "Waffle", "Coelho", "Rena", "Livro", "Microfone", "Ocarina"];
  nomes.forEach((n, i) => {
    const x = (i % 6) * 170;
    const y = 640 + Math.floor(i / 6) * 64;
    arred(x + 3, y + 3, 164, 58, 10, mix(pv("yellow-800"), pv("yellow-500"), 0.35));
    texto(n, x + 85, y + 33, { tam: 34, cor: escuro, max: 150 });
    reg(`nome-${n.toLowerCase()}`, x, y, 170, 64);
  });

  // Insígnias (160 × 160): disco na cor da Stack agora, imagem quando chegar.
  const INSIG = [
    ["front", "blue-500"],
    ["back", "green-500"],
    ["dados", "yellow-500"],
    ["ia", "blue-800"],
    ["full", "red-500"],
    ["pedal", "green-700"],
  ];
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const cargas = [];
  INSIG.forEach(([id, corId], i) => {
    const x = 340 + (i % 4) * 170;
    const y = 704 + Math.floor(i / 4) * 160;
    const cx = x + 80;
    const cy = y + 80;
    g.fillStyle = mix(pv(corId), branco, 0.75).getStyle();
    g.beginPath();
    g.arc(cx, cy, 76, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = pv(corId).getStyle();
    g.beginPath();
    g.arc(cx, cy, 66, 0, Math.PI * 2);
    g.fill();
    reg(`insignia-${id}`, x, y, 160, 160);
    const url = urlInsignia(id);
    if (!url || typeof Image === "undefined") return;
    cargas.push(
      new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          g.drawImage(img, cx - 70, cy - 70, 140, 140);
          tex.needsUpdate = true;
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      }),
    );
  });

  return { tex, regioes, cargas };
}
