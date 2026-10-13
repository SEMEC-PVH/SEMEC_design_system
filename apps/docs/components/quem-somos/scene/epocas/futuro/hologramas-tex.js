// Texturas em canvas dos hologramas da Vila 2030 (futuro/hologramas.js).
// Tudo desenhado em branco/alfa ou nas cores da paleta neon (cores.js) — o
// material tinge e soma (AdditiveBlending), então o "preto" some no ar.
import * as THREE from "three";

export function criarPintor({ pal, track }) {
  const fonte = (peso, px) => `${peso} ${px}px ${pal.font}`;
  // Branco da paleta com alfa (o material tinge depois) e cinza opaco.
  const rgb = (c) => {
    const s = c.clone().convertLinearToSRGB();
    return [s.r, s.g, s.b].map((v) => Math.round(v * 255)).join(" ");
  };
  const bc = (a) => `rgb(${rgb(pal.white)} / ${a})`;
  const cinza = (v) => `rgb(${rgb(pal.white.clone().multiplyScalar(v))})`;

  function tex(canvas, extra = {}) {
    const t = track(new THREE.CanvasTexture(canvas));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    Object.assign(t, extra);
    return t;
  }
  function tela(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return [c, c.getContext("2d")];
  }
  // Ajusta o tamanho da fonte até o texto caber em `max` px.
  function caber(g, texto, peso, px, max) {
    let s = px;
    do {
      g.font = fonte(peso, s);
      s -= 2;
    } while (g.measureText(texto).width > max && s > 10);
    return s + 2;
  }
  function retArred(g, x, y, w, h, r) {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
  }
  // Brilho de neon: o mesmo traço com sombra larga e depois nítido.
  function neon(g, cor, blur, desenhar) {
    g.save();
    g.shadowColor = cor;
    g.shadowBlur = blur;
    desenhar();
    g.shadowBlur = blur * 0.4;
    desenhar();
    g.restore();
    desenhar();
  }

  // Linhas de varredura (alphaMap compartilhado; o offset corre em update).
  function scanlines() {
    const [c, g] = tela(4, 16);
    g.fillStyle = bc(1);
    g.fillRect(0, 0, 4, 16);
    g.fillStyle = cinza(0.37);
    g.fillRect(0, 0, 4, 5);
    g.fillStyle = cinza(0.67);
    g.fillRect(0, 5, 4, 2);
    return tex(c, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, colorSpace: THREE.NoColorSpace });
  }

  // Mancha radial (halo no chão, partículas, brilho de placa).
  function radial(paradas = [[0, 1], [0.35, 0.45], [1, 0]]) {
    const [c, g] = tela(128, 128);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [p, a] of paradas) gr.addColorStop(p, bc(a));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    return tex(c);
  }

  // Feixe do projetor: forte embaixo, some no alto, com estrias verticais.
  function feixe() {
    const [c, g] = tela(128, 256);
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, bc(0.02));
    gr.addColorStop(0.55, bc(0.24));
    gr.addColorStop(1, bc(0.85));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 256);
    g.globalCompositeOperation = "destination-out";
    for (let x = 0; x < 128; x += 8) {
      g.fillStyle = bc(0.25 + ((x * 37) % 50) / 100);
      g.fillRect(x, 0, 3 + ((x * 13) % 4), 256);
    }
    return tex(c, { wrapS: THREE.RepeatWrapping });
  }

  // Anel de HUD no chão sob o projetor: aros, marcas e arcos.
  function hudChao() {
    const [c, g] = tela(512, 512);
    g.translate(256, 256);
    g.strokeStyle = bc(0.9);
    g.lineWidth = 4;
    g.beginPath();
    g.arc(0, 0, 240, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 2;
    g.beginPath();
    g.arc(0, 0, 196, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const l = i % 6 === 0 ? 22 : 9;
      g.lineWidth = i % 6 === 0 ? 4 : 2;
      g.beginPath();
      g.moveTo(Math.cos(a) * 236, Math.sin(a) * 236);
      g.lineTo(Math.cos(a) * (236 - l), Math.sin(a) * (236 - l));
      g.stroke();
    }
    g.lineWidth = 10;
    for (const [a0, a1] of [[0.2, 1.1], [2.3, 2.9], [3.6, 5.2]]) {
      g.beginPath();
      g.arc(0, 0, 172, a0, a1);
      g.stroke();
    }
    g.lineWidth = 2;
    g.setLineDash([6, 10]);
    g.beginPath();
    g.arc(0, 0, 140, 0, Math.PI * 2);
    g.stroke();
    return tex(c);
  }

  // Camadas do holograma-herói (componentes do Design System).
  function card() {
    const [c, g] = tela(512, 352);
    g.fillStyle = bc(0.2);
    retArred(g, 6, 6, 500, 340, 34);
    g.fill();
    g.strokeStyle = bc(1);
    g.lineWidth = 7;
    retArred(g, 6, 6, 500, 340, 34);
    g.stroke();
    // Cabeçalho, avatar e linhas de texto.
    g.fillStyle = bc(0.4);
    retArred(g, 6, 6, 500, 70, [34, 34, 0, 0]);
    g.fill();
    g.fillStyle = bc(0.95);
    g.beginPath();
    g.arc(70, 140, 34, 0, Math.PI * 2);
    g.fill();
    for (const [x, y, w, a] of [[124, 122, 250, 0.9], [124, 154, 170, 0.55], [40, 210, 420, 0.5], [40, 238, 380, 0.5], [40, 266, 300, 0.5]]) {
      g.fillStyle = bc(a);
      retArred(g, x, y, w, 14, 7);
      g.fill();
    }
    g.lineWidth = 5;
    g.strokeStyle = bc(0.95);
    retArred(g, 318, 290, 160, 40, 20);
    g.stroke();
    return tex(c);
  }
  function botao(texto) {
    const [c, g] = tela(512, 170);
    g.fillStyle = bc(0.32);
    retArred(g, 6, 6, 500, 158, 79);
    g.fill();
    g.strokeStyle = bc(1);
    g.lineWidth = 8;
    retArred(g, 6, 6, 500, 158, 79);
    g.stroke();
    g.fillStyle = bc(1);
    caber(g, texto, 700, 76, 380);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(texto, 256, 92);
    return tex(c);
  }
  function trilho() {
    const [c, g] = tela(512, 240);
    g.fillStyle = bc(0.22);
    retArred(g, 8, 8, 496, 224, 112);
    g.fill();
    g.strokeStyle = bc(1);
    g.lineWidth = 10;
    retArred(g, 8, 8, 496, 224, 112);
    g.stroke();
    return tex(c);
  }
  function logo() {
    const [c, g] = tela(256, 256);
    g.fillStyle = bc(0.18);
    retArred(g, 8, 8, 240, 240, 48);
    g.fill();
    g.strokeStyle = bc(1);
    g.lineWidth = 9;
    retArred(g, 8, 8, 240, 240, 48);
    g.stroke();
    g.fillStyle = bc(1);
    g.font = fonte(700, 170);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("S", 128, 142);
    return tex(c);
  }

  // Outdoor holográfico: cantoneiras, título neon e legenda. Devolve a
  // textura normal e uma "com defeito" (RGB separado + faixas deslocadas).
  function outdoor({ titulo, sub, cor, cor2, w = 512, h = 208 }) {
    const [c, g] = tela(w, h);
    const css = cor.getStyle();
    const css2 = cor2.getStyle();
    const fundo = g.createLinearGradient(0, 0, 0, h);
    fundo.addColorStop(0, css);
    fundo.addColorStop(1, css2);
    g.fillStyle = fundo;
    g.globalAlpha = 0.16;
    g.fillRect(10, 10, w - 20, h - 20);
    g.globalAlpha = 1;
    // Cantoneiras.
    g.strokeStyle = css;
    g.lineWidth = 6;
    const L = 34;
    for (const [x, y, sx, sy] of [[10, 10, 1, 1], [w - 10, 10, -1, 1], [10, h - 10, 1, -1], [w - 10, h - 10, -1, -1]]) {
      neon(g, css, 14, () => {
        g.beginPath();
        g.moveTo(x, y + sy * L);
        g.lineTo(x, y);
        g.lineTo(x + sx * L, y);
        g.stroke();
      });
    }
    // Etiqueta "AO VIVO" com ponto.
    g.fillStyle = css2;
    g.beginPath();
    g.arc(34, 34, 6, 0, Math.PI * 2);
    g.fill();
    g.font = fonte(600, 16);
    g.textBaseline = "middle";
    g.fillText("AO VIVO · 2030", 48, 35);
    // Título.
    g.textAlign = "center";
    caber(g, titulo, 700, 92, w - 90);
    g.fillStyle = cor.clone().lerp(pal.white, 0.55).getStyle();
    neon(g, css, 30, () => g.fillText(titulo, w / 2, h * 0.5));
    // Legenda entre traços.
    g.font = fonte(600, 22);
    g.fillStyle = css2;
    const ls = g.measureText(sub).width;
    g.fillText(sub, w / 2, h * 0.8);
    g.fillRect(40, h * 0.8 - 1, Math.max(0, w / 2 - ls / 2 - 56), 3);
    g.fillRect(w / 2 + ls / 2 + 16, h * 0.8 - 1, Math.max(0, w / 2 - ls / 2 - 56), 3);
    // Marcas de régua na base.
    g.fillStyle = css;
    for (let x = w - 120; x < w - 30; x += 9) g.fillRect(x, 26, 4, x % 18 ? 8 : 14);

    const [cg, gg] = tela(w, h);
    const tingido = (corCss) => {
      const [ct, gt] = tela(w, h);
      gt.drawImage(c, 0, 0);
      gt.globalCompositeOperation = "source-in";
      gt.fillStyle = corCss;
      gt.fillRect(0, 0, w, h);
      return ct;
    };
    gg.globalCompositeOperation = "lighter";
    gg.drawImage(tingido(css2), -9, 0);
    gg.drawImage(tingido(css), 9, 2);
    gg.globalAlpha = 0.7;
    gg.drawImage(c, 0, 0);
    // Faixas deslocadas (determinístico).
    const [cf, gf] = tela(w, h);
    let y = 0;
    let i = 0;
    while (y < h) {
      const bh = 8 + ((i * 53) % 30);
      const dx = i % 3 === 1 ? ((i * 71) % 40) - 20 : 0;
      gf.drawImage(cg, 0, y, w, bh, dx, y, w, bh);
      y += bh;
      i++;
    }
    return { normal: tex(c), defeito: tex(cf) };
  }

  // Placa vertical estreita (letras empilhadas), opaca: fundo escuro e
  // letras em neon com moldura interna.
  function placa({ texto, rodape, cor, w = 96, h = 448 }) {
    const [c, g] = tela(w, h);
    const css = cor.getStyle();
    g.fillStyle = pal.mix(cores0(pal), cor, 0.08).getStyle();
    g.fillRect(0, 0, w, h);
    g.strokeStyle = css;
    g.lineWidth = 4;
    neon(g, css, 10, () => g.strokeRect(7, 7, w - 14, h - 14));
    const letras = [...texto];
    const area = h - (rodape ? 84 : 40);
    const passo = area / letras.length;
    const px = Math.min(passo * 0.86, w * 0.62);
    g.font = fonte(700, px);
    g.textAlign = "center";
    g.textBaseline = "middle";
    letras.forEach((l, i) => {
      g.fillStyle = bc(1);
      neon(g, css, 16, () => g.fillText(l, w / 2, 24 + passo * (i + 0.5)));
    });
    if (rodape) {
      g.fillStyle = css;
      g.fillRect(16, h - 64, w - 32, 3);
      g.font = fonte(700, 22);
      g.fillText(rodape, w / 2, h - 36);
    }
    return { tex: tex(c), passo: passo / h, topo: 24 / h };
  }

  // Letreiro do portal "VILA SEMEC · 2030".
  function letreiro(texto, cor, cor2) {
    const w = 1024;
    const h = 192;
    const [c, g] = tela(w, h);
    const css = cor.getStyle();
    const css2 = cor2.getStyle();
    g.fillStyle = css;
    g.globalAlpha = 0.08;
    g.fillRect(0, 30, w, h - 60);
    g.globalAlpha = 1;
    g.strokeStyle = css;
    g.lineWidth = 3;
    neon(g, css, 12, () => {
      g.beginPath();
      g.moveTo(20, 30);
      g.lineTo(w - 20, 30);
      g.moveTo(20, h - 30);
      g.lineTo(w - 20, h - 30);
      g.stroke();
    });
    g.fillStyle = css2;
    for (const x of [20, w - 32]) g.fillRect(x, 24, 12, h - 48);
    g.textAlign = "center";
    g.textBaseline = "middle";
    caber(g, texto, 600, 96, w - 140);
    g.fillStyle = bc(1);
    neon(g, css, 28, () => g.fillText(texto, w / 2, h / 2 + 4));
    return tex(c);
  }

  return { scanlines, radial, feixe, hudChao, card, botao, trilho, logo, outdoor, placa, letreiro };
}

// Fundo das placas: quase preto puxado para o roxo da noite.
function cores0(pal) {
  return pal.mix(pal.pv("gray-950"), pal.pv("blue-950"), 0.5);
}
