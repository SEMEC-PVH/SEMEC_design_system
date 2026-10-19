// Pista de bicicleta da Vila SEMEC: a arte pintada do traçado (dono: tracado).
//
// Um atlas de canvas só do traçado (o compartilhado, de comum.js, é das
// placas): letreiro "VILA SEMEC" pintado no asfalto da reta, setas das
// curvas, números do grid de largada, o selo SEMEC do piso do box, o "BOX"
// da entrada, os números do pódio, o pit board, a placa de volta para a
// Vila, o painel de ferramentas e a faixa zebrada de atenção. Fundo
// transparente onde é pintura no chão (o material usa alphaTest: sem
// ordenação de transparência, um draw call para tudo).
//
// Cores só de tokens (pal.pv / pal.mix). No `lite` o canvas sai com metade
// da resolução.

import * as THREE from "three";

export function criarArteTracado(pal, lite) {
  const { pv, mix } = pal;
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
  const fonte = (tam, peso = 800) => `${peso} ${tam}px ${pal.font}`;
  const texto = (str, x, y, { tam = 64, peso = 800, cor, max = 1000, contorno = null, largCont = 6 }) => {
    let s = tam;
    g.font = fonte(s, peso);
    while (g.measureText(str).width > max && s > 10) {
      s -= 2;
      g.font = fonte(s, peso);
    }
    g.textAlign = "center";
    g.textBaseline = "middle";
    if (contorno) {
      g.lineJoin = "round";
      g.lineWidth = largCont;
      g.strokeStyle = contorno.getStyle();
      g.strokeText(str, x, y);
    }
    g.fillStyle = cor.getStyle();
    g.fillText(str, x, y);
  };
  const ret = (x, y, w, h, cor, r = 0) => {
    g.fillStyle = cor.getStyle();
    g.beginPath();
    if (r) g.roundRect(x, y, w, h, r);
    else g.rect(x, y, w, h);
    g.fill();
  };
  const branco = pv("white");
  const tinta = mix(branco, pv("gray-100"), 0.25); // tinta de pista, um tico gasta
  const amarelo = pv("yellow-500");
  const azul = pv("blue-700");
  const azulEsc = pv("blue-900");
  const escuro = pv("gray-950");

  // ---- Linha 0 (y 0..160): "VILA SEMEC" pintado no asfalto -------------------------
  texto("VILA SEMEC", 512, 76, { tam: 132, cor: tinta, max: 980, contorno: amarelo, largCont: 10 });
  reg("vila", 0, 0, 1024, 160);

  // ---- Linha 1 (y 160..416): seta, números do grid, BOX ---------------------------
  // Seta dupla (chevrons) apontando para cima (+v = sentido da corrida).
  {
    const x0 = 0;
    const y0 = 160;
    g.fillStyle = tinta.getStyle();
    for (const dy of [0, 96]) {
      g.beginPath();
      g.moveTo(x0 + 128, y0 + 18 + dy);
      g.lineTo(x0 + 236, y0 + 118 + dy);
      g.lineTo(x0 + 196, y0 + 140 + dy);
      g.lineTo(x0 + 128, y0 + 76 + dy);
      g.lineTo(x0 + 60, y0 + 140 + dy);
      g.lineTo(x0 + 20, y0 + 118 + dy);
      g.closePath();
      g.fill();
    }
    reg("seta", x0, y0, 256, 256);
  }
  // Números do grid (brancos, contorno azul) — 1, 2, 3.
  for (let i = 0; i < 3; i++) {
    const x = 256 + i * 128;
    texto(String(i + 1), x + 64, 160 + 66, { tam: 104, cor: tinta, contorno: azul, largCont: 8 });
    reg(`g${i + 1}`, x, 160, 128, 128);
  }
  // "BOX" amarelo pintado na entrada do box.
  texto("BOX", 256 + 192, 160 + 128 + 64, { tam: 110, cor: amarelo, max: 370, contorno: escuro, largCont: 6 });
  reg("boxChao", 256, 288, 384, 128);
  // Faixa zebrada de atenção (amarelo e preto, opaca).
  {
    const x0 = 640;
    const y0 = 160;
    ret(x0, y0, 384, 64, amarelo);
    g.fillStyle = escuro.getStyle();
    for (let i = -1; i < 9; i++) {
      g.beginPath();
      g.moveTo(x0 + i * 48, y0 + 64);
      g.lineTo(x0 + i * 48 + 24, y0 + 64);
      g.lineTo(x0 + i * 48 + 48, y0);
      g.lineTo(x0 + i * 48 + 24, y0);
      g.closePath();
      g.fill();
    }
    reg("listra", x0, y0, 384, 64);
  }
  // Números do pódio (amarelo sobre azul, opacos): 1, 2, 3.
  for (let i = 0; i < 3; i++) {
    const x = 640 + i * 128;
    ret(x, 224, 128, 128, azul);
    ret(x, 224, 128, 14, amarelo);
    texto(String(i + 1), x + 64, 296, { tam: 84, cor: amarelo });
    reg(`p${i + 1}`, x, 224, 128, 128);
  }
  // Fresta (y 352..416): placa "VOLTAR À VILA" (verde, opaca).
  {
    const x0 = 640;
    const y0 = 352;
    ret(x0, y0, 384, 64, pv("green-700"), 10);
    ret(x0 + 6, y0 + 6, 372, 52, pv("green-600"), 8);
    texto("↓ VOLTAR À VILA", x0 + 192, y0 + 33, { tam: 36, cor: branco, max: 350 });
    reg("voltar", x0, y0, 384, 64);
  }

  // ---- Linha 2 (y 416..672): selo SEMEC do box, pit board, ferramentas -------------
  {
    const cx = 128;
    const cy = 544;
    g.fillStyle = amarelo.getStyle();
    g.beginPath();
    g.arc(cx, cy, 124, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = azul.getStyle();
    g.beginPath();
    g.arc(cx, cy, 108, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = tinta.getStyle();
    g.lineWidth = 4;
    g.beginPath();
    g.arc(cx, cy, 96, 0, Math.PI * 2);
    g.stroke();
    texto("SEMEC", cx, cy - 6, { tam: 52, cor: branco, max: 170 });
    texto("PISTA DA VILA", cx, cy + 42, { tam: 18, peso: 700, cor: amarelo, max: 150 });
    // Bicicletinha estilizada em cima.
    g.strokeStyle = amarelo.getStyle();
    g.lineWidth = 5;
    for (const dx of [-22, 22]) {
      g.beginPath();
      g.arc(cx + dx, cy - 58, 13, 0, Math.PI * 2);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(cx - 22, cy - 58);
    g.lineTo(cx - 4, cy - 76);
    g.lineTo(cx + 14, cy - 76);
    g.lineTo(cx + 22, cy - 58);
    g.moveTo(cx - 4, cy - 76);
    g.lineTo(cx + 2, cy - 58);
    g.lineTo(cx + 14, cy - 76);
    g.stroke();
    reg("selo", 0, 416, 256, 256);
  }
  // Pit board (quadro preto com "P1" e a volta).
  {
    const x0 = 256;
    const y0 = 416;
    ret(x0, y0, 192, 256, mix(escuro, pv("gray-800"), 0.3), 12);
    ret(x0 + 10, y0 + 10, 172, 236, escuro, 8);
    texto("P1", x0 + 96, y0 + 74, { tam: 96, cor: amarelo });
    texto("VOLTA", x0 + 96, y0 + 146, { tam: 34, peso: 700, cor: branco });
    texto("SEMEC", x0 + 96, y0 + 202, { tam: 40, cor: pv("blue-300") });
    reg("pitboard", x0, y0, 192, 256);
  }
  // Painel de ferramentas (pegboard com silhuetas).
  {
    const x0 = 448;
    const y0 = 416;
    ret(x0, y0, 320, 160, mix(pv("gray-100"), pv("blue-100"), 0.4));
    g.fillStyle = mix(pv("gray-400"), pv("gray-100"), 0.4).getStyle();
    for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) g.fillRect(x0 + 10 + i * 19.5, y0 + 10 + j * 19.5, 3, 3);
    const silh = escuro;
    // Chaves de boca, martelo, alicate, chave de fenda.
    for (let i = 0; i < 4; i++) {
      ret(x0 + 22 + i * 26, y0 + 30, 8, 70 + i * 8, silh, 3);
      ret(x0 + 16 + i * 26, y0 + 24, 20, 14, silh, 5);
    }
    ret(x0 + 140, y0 + 30, 14, 90, pv("red-600"), 4);
    ret(x0 + 124, y0 + 26, 46, 20, silh, 4);
    ret(x0 + 190, y0 + 34, 10, 86, amarelo, 3);
    ret(x0 + 192, y0 + 120, 6, 18, silh, 2);
    ret(x0 + 224, y0 + 30, 64, 40, azul, 6);
    texto("SEMEC", x0 + 256, y0 + 50, { tam: 20, cor: branco, max: 58 });
    ret(x0 + 222, y0 + 90, 70, 10, silh, 4);
    ret(x0 + 236, y0 + 108, 40, 10, silh, 4);
    reg("ferramentas", x0, y0, 320, 160);
  }
  // Porta de enrolar fechada com faixa SEMEC (opaca).
  {
    const x0 = 768;
    const y0 = 416;
    ret(x0, y0, 256, 256, mix(pv("gray-300"), pv("gray-200"), 0.5));
    g.fillStyle = mix(pv("gray-400"), pv("gray-300"), 0.4).getStyle();
    for (let j = 0; j < 256; j += 16) g.fillRect(x0, y0 + j, 256, 3);
    ret(x0, y0 + 96, 256, 60, azul);
    ret(x0, y0 + 152, 256, 8, amarelo);
    texto("SEMEC", x0 + 128, y0 + 126, { tam: 46, cor: branco, max: 220 });
    ret(x0 + 108, y0 + 226, 40, 10, escuro, 3);
    reg("porta", x0, y0, 256, 256);
  }

  // ---- Linha 3 (y 672..800): letreiro da garagem e faixa do pórtico ----------------
  {
    const y0 = 672;
    ret(0, y0, 512, 128, azulEsc);
    ret(0, y0 + 110, 512, 18, amarelo);
    // Quadriculado nas pontas.
    for (const x of [0, 448]) {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) ret(x + i * 16, y0 + j * 18, 16, 18, (i + j) % 2 ? branco : escuro);
    }
    texto("GARAGEM SEMEC", 256, y0 + 56, { tam: 52, cor: branco, max: 360 });
    reg("garagem", 0, y0, 512, 128);
    // "VILA SEMEC" do topo do pórtico (azul, letra amarela).
    ret(512, y0, 512, 128, azul);
    ret(512, y0, 512, 10, amarelo);
    ret(512, y0 + 118, 512, 10, amarelo);
    texto("★ VILA SEMEC ★", 768, y0 + 64, { tam: 60, cor: amarelo, max: 470 });
    reg("viga", 512, y0, 512, 128);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, regioes };
}
