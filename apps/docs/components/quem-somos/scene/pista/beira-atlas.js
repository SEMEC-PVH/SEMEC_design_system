// Pista de bicicleta da Vila SEMEC: o atlas de canvas da beira (placas de
// publicidade, chevrons, marcos 100/50, letreiros da área técnica e o
// telão).
//
// Um canvas só (1024², metade no `lite`), cores só de tokens. O telão mora
// numa região do mesmo atlas e é redesenhado nos eventos da corrida
// (logo, contagem da largada, próximo arco, chegada, festa): uma textura, um
// material, um draw call para todas as placas da beira.

import * as THREE from "three";

export function criarAtlasBeira(pal, lite) {
  const { pv } = pal;
  const W = 1024;
  const H = 1024;
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
  const texto = (str, x, y, { tam = 64, peso = 700, cor, max = 1000, alinh = "center" }) => {
    let s = tam;
    g.font = `${peso} ${s}px ${pal.font}`;
    while (g.measureText(str).width > max && s > 10) {
      s -= 2;
      g.font = `${peso} ${s}px ${pal.font}`;
    }
    g.fillStyle = cor.getStyle();
    g.textAlign = alinh;
    g.textBaseline = "middle";
    g.fillText(str, x, y);
  };
  const ret = (x, y, w, h, cor) => {
    g.fillStyle = cor.getStyle();
    g.fillRect(x, y, w, h);
  };
  const xadrez = (x, y, w, h, n, m, c1, c2) => {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) ret(x + (i * w) / n, y + (j * h) / m, w / n + 0.5, h / m + 0.5, (i + j) % 2 ? c2 : c1);
    }
  };
  // Bicicleta estilizada (duas rodas, quadro e guidão) com centro (x, y).
  const bike = (x, y, r, cor) => {
    g.strokeStyle = cor.getStyle();
    g.lineWidth = r * 0.28;
    g.lineCap = "round";
    g.lineJoin = "round";
    for (const dx of [-1.25, 1.25]) {
      g.beginPath();
      g.arc(x + dx * r, y + r * 0.35, r * 0.85, 0, Math.PI * 2);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(x - 1.25 * r, y + r * 0.35);
    g.lineTo(x - 0.35 * r, y - r * 0.55);
    g.lineTo(x + 0.75 * r, y - r * 0.55);
    g.lineTo(x + 1.25 * r, y + r * 0.35);
    g.moveTo(x - 0.35 * r, y - r * 0.55);
    g.lineTo(x + 0.1 * r, y + r * 0.35);
    g.lineTo(x + 0.75 * r, y - r * 0.55);
    g.moveTo(x + 0.75 * r, y - r * 0.55);
    g.lineTo(x + 0.6 * r, y - r * 1.05);
    g.lineTo(x + 0.95 * r, y - r * 1.05);
    g.stroke();
  };
  const branco = pv("white");
  const escuro = pv("gray-900");
  const preto = pv("gray-950");
  const amarelo = pv("yellow-500");
  const azulEsc = pv("blue-900");

  // ---- Placas de publicidade (4:1) ----------------------------------------------
  // Design System (azul-marinho, faixa amarela).
  ret(0, 0, 512, 128, azulEsc);
  ret(0, 0, 18, 128, amarelo);
  texto("DESIGN SYSTEM", 268, 52, { tam: 62, cor: branco, max: 450 });
  texto("@semec/ds", 268, 100, { tam: 30, peso: 600, cor: pv("yellow-400"), max: 440 });
  reg("ds", 0, 0, 512, 128);
  // Vila SEMEC (verde, telhadinho amarelo).
  ret(512, 0, 512, 128, pv("green-700"));
  g.fillStyle = amarelo.getStyle();
  g.beginPath();
  g.moveTo(540, 74);
  g.lineTo(582, 34);
  g.lineTo(624, 74);
  g.closePath();
  g.fill();
  ret(552, 74, 60, 34, amarelo);
  ret(574, 84, 16, 24, pv("green-700"));
  texto("VILA SEMEC", 812, 66, { tam: 70, cor: branco, max: 360 });
  reg("vila", 512, 0, 512, 128);
  // Pedal (amarelo, bicicleta escura).
  ret(0, 128, 512, 128, amarelo);
  bike(96, 196, 26, escuro);
  texto("PEDAL", 330, 194, { tam: 84, cor: escuro, max: 320 });
  reg("pedal", 0, 128, 512, 128);
  // Acessibilidade (azul, texto branco).
  ret(512, 128, 512, 128, pv("blue-700"));
  ret(512, 236, 512, 20, pv("blue-500"));
  texto("ACESSIBILIDADE", 768, 172, { tam: 50, cor: branco, max: 470 });
  texto("WCAG 2.1 AA", 768, 214, { tam: 30, peso: 600, cor: pv("yellow-400"), max: 470 });
  reg("acesso", 512, 128, 512, 128);

  // ---- Letreiros da área técnica ---------------------------------------------------
  ret(0, 256, 512, 96, azulEsc);
  xadrez(0, 256, 512, 10, 40, 1, preto, branco);
  texto("CRONOMETRAGEM", 256, 308, { tam: 54, cor: branco, max: 470 });
  reg("crono", 0, 256, 512, 96);
  ret(512, 256, 512, 96, branco);
  ret(512, 336, 512, 16, pv("blue-700"));
  texto("IMPRENSA", 768, 296, { tam: 62, cor: pv("blue-800"), max: 470 });
  reg("imprensa", 512, 256, 512, 96);
  // TV SEMEC (lateral da van).
  ret(0, 352, 384, 128, pv("red-600"));
  ret(24, 382, 80, 56, branco);
  ret(104, 396, 26, 28, branco);
  g.fillStyle = pv("red-600").getStyle();
  g.beginPath();
  g.arc(64, 410, 16, 0, Math.PI * 2);
  g.fill();
  texto("TV SEMEC", 252, 414, { tam: 54, cor: branco, max: 230 });
  reg("tv", 0, 352, 384, 128);

  // ---- Chevrons (vermelho, setas brancas) e marcos de frenagem -----------------------
  const chevron = (x0, dir) => {
    ret(x0, 352, 192, 128, pv("red-600"));
    g.fillStyle = branco.getStyle();
    for (let i = 0; i < 3; i++) {
      const cx = x0 + 44 + i * 52;
      g.beginPath();
      g.moveTo(cx - dir * 18, 372);
      g.lineTo(cx + dir * 18, 416);
      g.lineTo(cx - dir * 18, 460);
      g.lineTo(cx - dir * 34, 460);
      g.lineTo(cx + dir * 2, 416);
      g.lineTo(cx - dir * 34, 372);
      g.closePath();
      g.fill();
    }
  };
  chevron(384, 1);
  reg("chevD", 384, 352, 192, 128);
  chevron(576, -1);
  reg("chevE", 576, 352, 192, 128);
  for (const [nome, n, x0] of [["m100", "100", 768], ["m50", "50", 896]]) {
    ret(x0, 352, 128, 128, pv("blue-700"));
    ret(x0 + 10, 362, 108, 108, branco);
    texto(n, x0 + 64, 418, { tam: 56, cor: escuro, max: 100 });
    reg(nome, x0, 352, 128, 128);
  }

  // ---- Telão (960 × 518): redesenhado pelos eventos da corrida -------------------
  const TX = 0;
  const TY = 480;
  const TW = 960;
  const TH = 518;
  reg("telao", TX, TY, TW, TH);
  const coresConf = [pv("red-500"), amarelo, pv("blue-300"), pv("green-500"), branco];
  const telao = (estado = { tipo: "logo" }) => {
    ret(TX, TY, TW, TH, azulEsc);
    ret(TX, TY, TW, 10, pv("blue-700"));
    ret(TX, TY + TH - 10, TW, 10, pv("blue-700"));
    // "AO VIVO" no canto.
    g.fillStyle = pv("red-500").getStyle();
    g.beginPath();
    g.arc(TX + 44, TY + 46, 13, 0, Math.PI * 2);
    g.fill();
    texto("AO VIVO", TX + 66, TY + 47, { tam: 28, cor: branco, alinh: "left", max: 200 });
    const cx = TX + TW / 2;
    const cy = TY + TH / 2;
    if (estado.tipo === "contagem") {
      if (estado.fase === "verde") texto("VAI!", cx, cy + 10, { tam: 250, cor: pv("green-500"), max: 800 });
      else if (estado.fase === "vermelho") {
        g.fillStyle = pv("red-500").getStyle();
        for (let i = 0; i < 3; i++) {
          g.beginPath();
          g.arc(cx + (i - 1) * 190, cy + 10, 70, 0, Math.PI * 2);
          g.fill();
        }
      } else texto(String(estado.fase), cx, cy + 14, { tam: 300, cor: pv("yellow-400"), max: 800 });
    } else if (estado.tipo === "arco") {
      texto("PRÓXIMO ARCO", cx, TY + 140, { tam: 70, cor: branco, max: 800 });
      g.fillStyle = pv("blue-700").getStyle();
      g.beginPath();
      g.roundRect(cx - 110, TY + 210, 220, 220, 36);
      g.fill();
      texto(String(estado.n), cx, TY + 326, { tam: 170, cor: pv("yellow-400") });
    } else if (estado.tipo === "chegada") {
      xadrez(TX, TY + 70, TW, 28, 48, 2, preto, branco);
      xadrez(TX, TY + TH - 98, TW, 28, 48, 2, preto, branco);
      texto("RUMO À", cx, cy - 70, { tam: 64, cor: pv("yellow-400"), max: 800 });
      texto("CHEGADA", cx, cy + 40, { tam: 150, cor: branco, max: 820 });
    } else if (estado.tipo === "festa") {
      let s = 7;
      const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 90; i++) ret(TX + r() * TW, TY + 20 + r() * (TH - 40), 14, 22, coresConf[i % coresConf.length]);
      texto("PARABÉNS!", cx, cy - 20, { tam: 150, cor: pv("yellow-400"), max: 860 });
      texto("Volta completa · Pista Vila SEMEC", cx, cy + 110, { tam: 44, peso: 600, cor: branco, max: 820 });
    } else {
      xadrez(TX, TY + 70, TW, 28, 48, 2, preto, branco);
      xadrez(TX, TY + TH - 98, TW, 28, 48, 2, preto, branco);
      bike(cx - 300, cy + 4, 44, amarelo);
      texto("PISTA", cx + 90, cy - 62, { tam: 64, cor: pv("yellow-400"), max: 560 });
      texto("VILA SEMEC", cx + 90, cy + 34, { tam: 120, cor: branco, max: 600 });
    }
    tex.needsUpdate = true;
  };

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  telao();
  return { tex, regioes, telao };
}
