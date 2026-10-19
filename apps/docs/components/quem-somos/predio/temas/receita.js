// Tema do 1º andar: Receita Municipal (ver ./index.js).
//
// O que caracteriza o setor, por departamento:
// - Gestão Tributária (faixa oeste): mesa de protocolo com esteira de
//   processos, bandejas, carimbos e pilhas de carnês; telão com o gráfico de
//   arrecadação por tributo (ilustrativo, sem números).
// - Cadastros Fiscais (norte-leste): maquete de quarteirão com os lotes
//   coloridos (cadastro imobiliário) no meio do salão oeste; mesa de luz com o
//   mapa da cidade dividido em lotes; drone pousado na base (geoprocessamento)
//   e o kit de vistoria (câmera no tripé, colete "FISCAL", prancheta, trena).
// - Atendimento ao Cidadão: balcão com três guichês numerados, painel de
//   senha ("SENHA 042", pisca ao trocar fora do reduced motion), totem de
//   senha e longarina de espera, na área comum do leste.
//
// Objetos que ensinam: maquete ("Como funciona o IPTU"), telão ("ISS e
// ITBI") e mapa ("Cadastro imobiliário").
//
// Desempenho: tudo o que é cor lisa vai para os lotes (um draw call para o
// andar inteiro); os textos e desenhos estáticos ficam num só atlas de canvas
// (um draw call); o painel de senha tem canvas próprio (um draw call).

import * as THREE from "three";

// Planta (tiles): ver o diagrama em ../escritorio.js.
const MAQUETE = { x0: 4, x1: 6, y0: 5, y1: 6 };
const TELAO = { x0: 7, x1: 8, y: 4 };
const PROTOCOLO = { x0: 4, x1: 6, y: 9 };
const GUICHES = { x0: 14, x1: 18, y: 5 };
const TOTEM = [19, 5];
const LONGARINA = { x0: 14, x1: 17, y: 7 };
const MAPA = { x0: 18, x1: 19, y: 9 };
const MESINHA = [20, 4];
const TRIPE = [20, 6];
const CABIDEIRO = [20, 7];
const DRONE = [20, 8];

const intervalo = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ---- Atlas (1024 × 1024) ----------------------------------------------------
// Regiões em pixels do canvas: [x, y, w, h].
const R = {
  mapa: [0, 0, 512, 512],
  telao: [512, 0, 512, 288],
  guiche: [0, 1, 2].map((i) => [512 + i * 170, 300, 160, 72]),
  colete: [512, 384, 256, 96],
  tela: [784, 384, 128, 80],
  carne: [920, 384, 96, 64],
  totem: [512, 490, 256, 64],
  atendimento: [0, 530, 512, 56],
  protocolo: [0, 600, 256, 56],
  tiraTelao: [272, 600, 240, 56],
};

function desenharAtlas(g, pal) {
  const { pv, mix } = pal;
  const font = pal.font;
  const white = pv("white");
  const S = 1024;
  g.clearRect(0, 0, S, S);
  g.fillStyle = pv("gray-200").getStyle();
  g.fillRect(0, 0, S, S);
  const texto = (t, x, y, peso, max, largura, cor, alinhar = "center") => {
    g.fillStyle = cor.getStyle();
    g.textAlign = alinhar;
    g.textBaseline = "middle";
    let size = max;
    g.font = `${peso} ${size}px ${font}`;
    while (g.measureText(t).width > largura && size > 10) {
      size -= 2;
      g.font = `${peso} ${size}px ${font}`;
    }
    g.fillText(t, x, y);
  };

  // Mapa da cidade dividido em lotes (vista de cima): rio, quadras
  // retangulares inclinadas, lotes com contorno e alguns destacados.
  {
    const [mx, my, mw, mh] = R.mapa;
    g.save();
    g.beginPath();
    g.rect(mx, my, mw, mh);
    g.clip();
    g.fillStyle = mix(mix(pv("yellow-400"), pv("white"), 0.75), white, 0.5).getStyle();
    g.fillRect(mx, my, mw, mh);
    // Rio no canto oeste, com mata ciliar.
    g.fillStyle = mix(mix(pv("green-500"), pv("white"), 0.55), white, 0.2).getStyle();
    g.beginPath();
    g.moveTo(mx, my);
    g.bezierCurveTo(mx + 150, my + 120, mx + 40, my + 300, mx + 130, my + mh);
    g.lineTo(mx, my + mh);
    g.fill();
    g.fillStyle = mix(pv("blue-300"), pv("blue-200"), 0.4).getStyle();
    g.beginPath();
    g.moveTo(mx, my);
    g.bezierCurveTo(mx + 110, my + 120, mx + 0, my + 300, mx + 90, my + mh);
    g.lineTo(mx, my + mh);
    g.fill();
    // Quadras: grade levemente girada.
    g.translate(mx + 300, my + 256);
    g.rotate(-0.12);
    const rand = (() => {
      let a = 7;
      return () => ((a = (a * 16807) % 2147483647) / 2147483647);
    })();
    const destaques = [mix(pv("green-500"), pv("white"), 0.3), mix(pv("yellow-400"), pv("white"), 0.25), pv("blue-300"), pv("red-200")];
    const QW = 92;
    const QH = 64;
    const RUA = 16;
    for (let i = -3; i <= 3; i++) {
      for (let j = -4; j <= 4; j++) {
        const x = i * (QW + RUA) - QW / 2;
        const y = j * (QH + RUA) - QH / 2;
        // A margem do rio fica sem quadra.
        if (x + 300 < 120 + (j + 4) * 4) continue;
        g.fillStyle = mix(pv("gray-100"), white, 0.4).getStyle();
        g.fillRect(x, y, QW, QH);
        // Lotes: duas fileiras, frentes para as ruas maiores.
        const n = 4 + Math.floor(rand() * 2);
        for (let f = 0; f < 2; f++) {
          for (let k = 0; k < n; k++) {
            const lw = QW / n;
            const lx = x + k * lw;
            const ly = y + f * (QH / 2);
            if (rand() < 0.22) {
              g.fillStyle = destaques[Math.floor(rand() * destaques.length)].getStyle();
              g.fillRect(lx + 1, ly + 1, lw - 2, QH / 2 - 2);
            }
            g.strokeStyle = pv("gray-400").getStyle();
            g.lineWidth = 1.2;
            g.strokeRect(lx, ly, lw, QH / 2);
          }
        }
        g.strokeStyle = pv("gray-600").getStyle();
        g.lineWidth = 2;
        g.strokeRect(x, y, QW, QH);
      }
    }
    // Avenida principal mais larga.
    g.fillStyle = mix(mix(pv("yellow-400"), pv("white"), 0.25), white, 0.3).getStyle();
    g.fillRect(-400, -RUA / 2 - 2 + (QH + RUA) / 2 - QH / 2 - 6, 900, 10);
    g.restore();
    // Rosa dos ventos e moldura.
    g.fillStyle = pv("gray-800").getStyle();
    g.beginPath();
    g.moveTo(mx + mw - 40, my + 24);
    g.lineTo(mx + mw - 52, my + 62);
    g.lineTo(mx + mw - 40, my + 54);
    g.lineTo(mx + mw - 28, my + 62);
    g.fill();
    texto("N", mx + mw - 40, my + 78, 700, 20, 30, pv("gray-800"));
    g.strokeStyle = pv("gray-700").getStyle();
    g.lineWidth = 10;
    g.strokeRect(mx + 5, my + 5, mw - 10, mh - 10);
  }

  // Telão: arrecadação por tributo (barras ilustrativas, sem valores) e uma
  // linha de tendência ao fundo.
  {
    const [tx, ty, tw, th] = R.telao;
    const fundo = mix(pv("blue-950"), pv("gray-900"), 0.4);
    g.fillStyle = fundo.getStyle();
    g.fillRect(tx, ty, tw, th);
    texto("ARRECADAÇÃO POR TRIBUTO", tx + 20, ty + 30, 700, 26, tw - 40, white, "left");
    g.fillStyle = mix(pv("green-500"), pv("white"), 0.15).getStyle();
    g.fillRect(tx + 20, ty + 50, 60, 4);
    const base = ty + th - 46;
    const barras = [
      ["IPTU", 0.62, mix(pv("green-500"), pv("white"), 0.15)],
      ["ISS", 0.95, pv("blue-300")],
      ["ITBI", 0.38, pv("yellow-400")],
      ["TAXAS", 0.27, pv("red-300")],
    ];
    g.strokeStyle = mix(fundo, white, 0.18).getStyle();
    g.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const y = base - k * 42;
      g.beginPath();
      g.moveTo(tx + 20, y);
      g.lineTo(tx + tw - 20, y);
      g.stroke();
    }
    barras.forEach(([nome, v, c], i) => {
      const bw = 70;
      const x = tx + 50 + i * 115;
      const h = v * 160;
      g.fillStyle = c.getStyle();
      g.fillRect(x, base - h, bw, h);
      texto(nome, x + bw / 2, base + 22, 700, 22, bw + 30, mix(white, pv("gray-300"), 0.2));
    });
  }

  // Plaquinhas dos guichês.
  R.guiche.forEach(([x, y, w, h], i) => {
    g.fillStyle = pv("green-700").getStyle();
    g.fillRect(x, y, w, h);
    g.fillStyle = white.getStyle();
    g.fillRect(x + w - 64, y + 8, 56, h - 16);
    texto("GUICHÊ", x + (w - 64) / 2, y + h / 2, 700, 24, w - 76, white);
    texto(`0${i + 1}`, x + w - 36, y + h / 2 + 1, 700, 40, 50, pv("green-800"));
  });

  // Colete de fiscal: tecido escuro com faixa refletiva e a palavra FISCAL.
  {
    const [x, y, w, h] = R.colete;
    g.fillStyle = mix(pv("blue-900"), pv("gray-900"), 0.3).getStyle();
    g.fillRect(x, y, w, h);
    g.fillStyle = pv("yellow-400").getStyle();
    g.fillRect(x, y + h - 22, w, 10);
    texto("FISCAL", x + w / 2, y + 36, 700, 46, w - 30, white);
  }

  // Tela dos computadores dos guichês (sistema de atendimento).
  {
    const [x, y, w, h] = R.tela;
    g.fillStyle = mix(pv("blue-100"), white, 0.4).getStyle();
    g.fillRect(x, y, w, h);
    g.fillStyle = pv("green-700").getStyle();
    g.fillRect(x, y, w, 14);
    g.fillStyle = pv("gray-400").getStyle();
    for (let k = 0; k < 4; k++) g.fillRect(x + 10, y + 24 + k * 13, 60 + ((k * 23) % 40), 6);
    g.fillStyle = pv("green-500").getStyle();
    g.fillRect(x + w - 36, y + h - 20, 28, 12);
  }

  // Capa do carnê de IPTU.
  {
    const [x, y, w, h] = R.carne;
    g.fillStyle = white.getStyle();
    g.fillRect(x, y, w, h);
    g.fillStyle = pv("green-700").getStyle();
    g.fillRect(x, y, w, 22);
    texto("IPTU", x + w / 2, y + 12, 700, 18, w - 10, white);
    g.fillStyle = pv("gray-400").getStyle();
    for (let k = 0; k < 3; k++) g.fillRect(x + 10, y + 30 + k * 10, w - 20 - k * 14, 4);
  }

  // Totem: "RETIRE SUA SENHA".
  {
    const [x, y, w, h] = R.totem;
    g.fillStyle = pv("green-700").getStyle();
    g.fillRect(x, y, w, h);
    texto("RETIRE SUA SENHA", x + w / 2, y + h / 2, 700, 30, w - 20, white);
  }

  // Faixas de identificação.
  for (const [r, t, bg, fg] of [
    [R.atendimento, "ATENDIMENTO AO CIDADÃO", pv("green-700"), white],
    [R.protocolo, "PROTOCOLO", pv("gray-800"), white],
    [R.tiraTelao, "GESTÃO TRIBUTÁRIA", pv("gray-800"), white],
  ]) {
    const [x, y, w, h] = r;
    g.fillStyle = bg.getStyle();
    g.fillRect(x, y, w, h);
    texto(t, x + w / 2, y + h / 2 + 1, 700, 34, w - 24, fg);
  }
}

// Painel de senha (canvas próprio, redesenhado ao trocar).
function desenharPainel(g, pal, senha, guiche, aceso) {
  const { pv, mix } = pal;
  const W = 512;
  const Hh = 176;
  const fundo = mix(pv("gray-950"), pv("blue-950"), 0.3);
  g.fillStyle = fundo.getStyle();
  g.fillRect(0, 0, W, Hh);
  const txt = (t, x, y, peso, size, cor, alinhar) => {
    g.font = `${peso} ${size}px ${pal.font}`;
    g.textAlign = alinhar;
    g.textBaseline = "middle";
    g.fillStyle = cor.getStyle();
    g.fillText(t, x, y);
  };
  const apagado = mix(fundo, pv("white"), 0.12);
  txt("SENHA", 28, 40, 700, 34, aceso ? pv("gray-300") : apagado, "left");
  txt(String(senha).padStart(3, "0"), 28, 118, 700, 104, aceso ? pv("yellow-400") : apagado, "left");
  g.fillStyle = mix(fundo, pv("white"), 0.15).getStyle();
  g.fillRect(300, 22, 3, Hh - 44);
  txt("GUICHÊ", 410, 52, 700, 32, aceso ? pv("gray-300") : apagado, "center");
  txt(`0${guiche}`, 410, 118, 700, 84, aceso ? mix(pv("green-500"), pv("white"), 0.15) : apagado, "center");
}

export const receita = {
  planejar(ctx) {
    const { reservar, info } = ctx;
    // A área comum do leste vira atendimento, geoprocessamento e vistoria
    // (fica o bebedouro e a planta do canto).
    ctx.removerDecor((d) => d.seg === "leste" && d.tipo !== "bebedouro" && d.tipo !== "planta");

    const tiles = [];
    const marcar = (x, y) => {
      reservar(x, y);
      tiles.push([x, y]);
      return [x, y];
    };
    const maquete = [];
    for (const x of intervalo(MAQUETE.x0, MAQUETE.x1)) for (const y of intervalo(MAQUETE.y0, MAQUETE.y1)) maquete.push(marcar(x, y));
    const telao = intervalo(TELAO.x0, TELAO.x1).map((x) => marcar(x, TELAO.y));
    for (const x of intervalo(PROTOCOLO.x0, PROTOCOLO.x1)) marcar(x, PROTOCOLO.y);
    for (const x of intervalo(GUICHES.x0, GUICHES.x1)) marcar(x, GUICHES.y);
    // Lado dos atendentes (cadeiras e painel de senha): fora do caminho, que
    // ali o balcão e o painel esconderiam o jogador.
    for (const x of intervalo(GUICHES.x0, GUICHES.x1)) reservar(x, GUICHES.y - 1);
    marcar(...TOTEM);
    for (const x of intervalo(LONGARINA.x0, LONGARINA.x1)) marcar(x, LONGARINA.y);
    const mapa = intervalo(MAPA.x0, MAPA.x1).map((x) => marcar(x, MAPA.y));
    for (const t of [MESINHA, TRIPE, CABIDEIRO, DRONE]) marcar(...t);

    info("receita-iptu", maquete, "Como funciona o IPTU", [
      "O IPTU (Imposto Predial e Territorial Urbano) é cobrado pela prefeitura de quem é dono ou tem a posse de um imóvel na zona urbana. Como todo imposto, entra no caixa geral do município e ajuda a pagar ruas, escolas, postos de saúde e outros serviços.",
      "O cálculo parte do valor venal: uma estimativa do preço do imóvel feita com os dados do cadastro imobiliário (tamanho do terreno, área construída, localização, padrão da obra) e a Planta Genérica de Valores. Sobre ele se aplica a alíquota fixada em lei municipal.",
      "O carnê sai uma vez por ano e costuma permitir cota única ou parcelas. Quem acha que o valor está errado pode pedir revisão na Receita Municipal, levando os documentos do imóvel.",
    ]);
    info("receita-iss-itbi", telao, "ISS e ITBI", [
      "ISS (Imposto Sobre Serviços) incide sobre serviços como consertos, consultas, aulas e informática. Quem presta o serviço, empresa ou autônomo, recolhe ao município. A alíquota vai de 2% a 5%, conforme a lei de cada cidade.",
      "ITBI (Imposto sobre a Transmissão de Bens Imóveis) é pago quando um imóvel é vendido ou transferido de forma onerosa entre pessoas vivas, em geral antes do registro no cartório. Herança e doação não: aí o imposto é o ITCMD, do estado.",
      "IPTU, ISS e ITBI são os três impostos que a Constituição dá aos municípios (art. 156). Junto com as taxas e os repasses de estado e União, pagam os serviços públicos da cidade.",
    ]);
    info("receita-cadastro", mapa, "Cadastro imobiliário", [
      "O cadastro imobiliário é o registro de todos os imóveis da cidade: onde fica cada lote, o tamanho do terreno, a área construída, o uso (casa, comércio, terreno vazio) e quem responde por ele.",
      "Ele é atualizado com vistorias em campo e com geoprocessamento: fotos aéreas, de satélite ou de drone sobrepostas ao mapa de lotes mostram construções novas e ampliações que ainda não foram declaradas.",
      "Com o cadastro em dia, o IPTU fica mais justo (cada um paga pelo imóvel que de fato tem) e a prefeitura enxerga a cidade para planejar ruas, escolas e serviços.",
    ]);

    const falhas = ctx.alcancavel();
    if (falhas.length) console.warn("Tema receita: inalcançável", falhas, tiles);
  },

  construir(ctx) {
    const { root, lotes, M, vidroMat, pal, track, lite, reducedMotion, tileToWorld, caixa, colocar, std, makeCanvas, canvasTexture } = ctx;
    const { pv, mix } = pal;
    const white = pv("white");
    const rad = lite ? 6 : 10;
    const semSombra = { cast: false };

    // Material liso por cor (os lotes só leem a cor: vira um draw call só).
    const cache = new Map();
    const mc = (c) => {
      const k = c.getHexString();
      if (!cache.has(k)) cache.set(k, track(std(c)));
      return cache.get(k);
    };
    const add = (c, geo, opts) => lotes.add(c.isColor ? mc(c) : c, geo, opts);
    const C = {
      asfalto: mix(pv("gray-700"), pv("gray-600"), 0.4),
      calcada: mix(pv("gray-200"), white, 0.3),
      grama: mix(pv("green-500"), pv("green-600"), 0.4),
      terra: mix(pv("yellow-800"), pv("yellow-500"), 0.25),
      telhado: mix(pv("red-600"), pv("yellow-800"), 0.35),
      telhado2: mix(pv("gray-500"), pv("blue-700"), 0.25),
      verde: pv("green-700"),
      verdeClaro: pv("green-500"),
      amarelo: pv("yellow-400"),
      laranja: mix(pv("yellow-500"), pv("red-500"), 0.4),
      vermelho: pv("red-600"),
      azul: pv("blue-600"),
      papel: mix(white, mix(pv("yellow-400"), pv("white"), 0.75), 0.25),
      pasta: [pv("yellow-500"), pv("blue-500"), pv("red-400"), pv("green-500")],
    };

    // Limites de um trecho de tiles no mundo.
    const ext = (x0, x1, y0, y1) => {
      const a = tileToWorld(x0, y0);
      const b = tileToWorld(x1, y1);
      return { x0: a.x - 0.5, x1: b.x + 0.5, z0: a.z - 0.5, z1: b.z + 0.5, cx: (a.x + b.x) / 2, cz: (a.z + b.z) / 2 };
    };
    const cil = (r0, r1, h, x, y, z, lados = rad) => new THREE.CylinderGeometry(r0, r1, h, lados).translate(x, y, z);

    // ---- Atlas: um canvas com mapa, telão e plaquinhas -------------------------
    const atlasCanvas = makeCanvas(1024, 1024);
    desenharAtlas(atlasCanvas.getContext("2d"), pal);
    const atlasTex = track(canvasTexture(atlasCanvas, false));
    const atlasMat = track(std(white, { map: atlasTex, emissive: white, emissiveMap: atlasTex, emissiveIntensity: lite ? 0.3 : 0.2, roughness: 0.6 }));
    document.fonts?.ready.then(() => {
      desenharAtlas(atlasCanvas.getContext("2d"), pal);
      atlasTex.needsUpdate = true;
    });
    // Plano com a região `r` do atlas (frente +z, centro na origem).
    const plano = (w, h, r) => {
      const g = new THREE.PlaneGeometry(w, h);
      const [px, py, pw, ph] = r;
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, (px + uv.getX(i) * pw) / 1024, 1 - (py + (1 - uv.getY(i)) * ph) / 1024);
      }
      return g;
    };
    const rotulo = (w, h, r, x, y, z, rotY = 0) => lotes.add(atlasMat, plano(w, h, r).rotateY(rotY).translate(x, y, z), semSombra);

    // ---- Maquete do quarteirão (cadastro imobiliário / IPTU) -------------------
    {
      const e = ext(MAQUETE.x0, MAQUETE.x1, MAQUETE.y0, MAQUETE.y1);
      const { cx, cz } = e;
      const TW = 2.7;
      const TD = 1.7;
      const TOPO = 0.72;
      // Mesa: tampo, saia e pés.
      add(M.madeira, caixa(cx - TW / 2 - 0.05, cx + TW / 2 + 0.05, TOPO - 0.06, TOPO, cz - TD / 2 - 0.05, cz + TD / 2 + 0.05));
      add(M.escuro, caixa(cx - TW / 2, cx + TW / 2, TOPO - 0.16, TOPO - 0.06, cz - TD / 2, cz + TD / 2));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(M.escuro, caixa(cx + sx * (TW / 2 - 0.1) - 0.04, cx + sx * (TW / 2 - 0.1) + 0.04, 0, TOPO - 0.16, cz + sz * (TD / 2 - 0.1) - 0.04, cz + sz * (TD / 2 - 0.1) + 0.04));
      // Base: ruas em volta, calçada e a quadra.
      const B = TOPO + 0.02;
      add(C.asfalto, caixa(cx - TW / 2, cx + TW / 2, TOPO, B, cz - TD / 2, cz + TD / 2), semSombra);
      // Faixas tracejadas nas ruas da frente e de trás.
      for (const zz of [cz - TD / 2 + 0.11, cz + TD / 2 - 0.11]) {
        for (let x = cx - TW / 2 + 0.1; x < cx + TW / 2 - 0.15; x += 0.24) add(white, caixa(x, x + 0.12, B, B + 0.003, zz - 0.008, zz + 0.008), semSombra);
      }
      const Q = { x0: cx - TW / 2 + 0.24, x1: cx + TW / 2 - 0.24, z0: cz - TD / 2 + 0.24, z1: cz + TD / 2 - 0.24 };
      add(C.calcada, caixa(Q.x0, Q.x1, B, B + 0.025, Q.z0, Q.z1), semSombra);
      // Lotes: duas fileiras de cinco, frentes para as ruas norte e sul.
      const S0 = B + 0.025;
      // Cores das classes do cadastro (como na legenda do mapa de lotes).
      const cores = [
        mix(pv("green-500"), pv("white"), 0.3),
        mix(pv("yellow-400"), pv("white"), 0.25),
        mix(pv("blue-300"), white, 0.1),
        mix(pv("red-300"), white, 0.2),
        mix(mix(pv("green-500"), pv("white"), 0.3), mix(pv("yellow-400"), pv("white"), 0.25), 0.5),
      ];
      const paredes = [white, mix(white, mix(pv("yellow-400"), pv("white"), 0.5), 0.6), mix(white, pv("blue-200"), 0.55), mix(white, mix(pv("green-500"), pv("white"), 0.55), 0.5), mix(white, pv("red-200"), 0.45)];
      const larguras = [[0.42, 0.38, 0.46, 0.36, 0.48], [0.4, 0.5, 0.34, 0.44, 0.42]];
      const quadra = Q.x1 - Q.x0 - 0.06;
      const meioZ = (Q.z0 + Q.z1) / 2;
      larguras.forEach((ls, f) => {
        const soma = ls.reduce((s, v) => s + v, 0);
        let x = Q.x0 + 0.03;
        ls.forEach((lw0, k) => {
          const lw = (lw0 / soma) * quadra;
          const z0 = f === 0 ? Q.z0 + 0.03 : meioZ + 0.01;
          const z1 = f === 0 ? meioZ - 0.01 : Q.z1 - 0.03;
          const id = f * 5 + k;
          const vazio = id === 3 || id === 7;
          // Piso do lote na cor da classe (terreno vazio em terra batida).
          add(vazio ? C.terra : cores[(id * 3) % cores.length], caixa(x + 0.012, x + lw - 0.012, S0, S0 + 0.012, z0, z1), semSombra);
          const frente = f === 0 ? -1 : 1; // rua para onde a casa olha
          const mx = x + lw / 2;
          if (!vazio) {
            // Casa: corpo e telhado de quatro águas; alguns sobrados e um
            // comércio de laje com toldo; caixa d'água azul em algumas.
            const cw = lw * 0.74;
            const cd = (z1 - z0) * 0.62;
            const czc = frente < 0 ? z0 + 0.06 + cd / 2 : z1 - 0.06 - cd / 2;
            const comercio = id === 5;
            const alto = comercio ? 0.3 : id % 4 === 1 ? 0.25 : 0.15;
            add(paredes[(id * 2) % paredes.length], caixa(mx - cw / 2, mx + cw / 2, S0, S0 + alto, czc - cd / 2, czc + cd / 2));
            const zp = frente < 0 ? czc - cd / 2 - 0.002 : czc + cd / 2 + 0.002;
            if (comercio) {
              add(M.friso, caixa(mx - cw / 2 - 0.01, mx + cw / 2 + 0.01, S0 + alto, S0 + alto + 0.02, czc - cd / 2 - 0.01, czc + cd / 2 + 0.01));
              add(C.vermelho, caixa(mx - cw / 2, mx + cw / 2, S0 + 0.1, S0 + 0.115, zp - 0.05 * frente, zp), semSombra);
              add(M.escuro, caixa(mx - cw / 2 + 0.03, mx + cw / 2 - 0.03, S0, S0 + 0.09, zp - 0.002, zp + 0.002), semSombra);
            } else {
              const raio = Math.hypot(cw, cd) * 0.58;
              const telha = new THREE.ConeGeometry(raio, 0.14, 4, 1).rotateY(Math.PI / 4).scale(cw / Math.hypot(cw, cd) * 1.414, 1, cd / Math.hypot(cw, cd) * 1.414).translate(mx, S0 + alto + 0.07, czc);
              add(id % 3 ? C.telhado : C.telhado2, telha);
              // Porta e janelas viradas para a rua.
              add(M.escuro, caixa(mx - 0.02, mx + 0.02, S0, S0 + 0.07, zp - 0.002, zp + 0.002), semSombra);
              for (const sx of [-1, 1]) add(mix(pv("blue-200"), pv("gray-500"), 0.4), caixa(mx + sx * cw * 0.28 - 0.025, mx + sx * cw * 0.28 + 0.025, S0 + 0.05, S0 + 0.1, zp - 0.002, zp + 0.002), semSombra);
              if (id % 4 === 1) for (const sx of [-1, 1]) add(mix(pv("blue-200"), pv("gray-500"), 0.4), caixa(mx + sx * cw * 0.2 - 0.025, mx + sx * cw * 0.2 + 0.025, S0 + 0.16, S0 + 0.21, zp - 0.002, zp + 0.002), semSombra);
              if (id % 3 === 0) add(C.azul, cil(0.025, 0.025, 0.04, mx + cw * 0.2, S0 + alto + 0.06, czc, 8));
            }
          } else if (!lite) {
            // Terreno vazio: arbustos.
            add(M.folha, new THREE.IcosahedronGeometry(0.045, 0).translate(mx - 0.05, S0 + 0.04, (z0 + z1) / 2));
            add(M.folhaClara, new THREE.IcosahedronGeometry(0.035, 0).translate(mx + 0.06, S0 + 0.03, (z0 + z1) / 2 + 0.05));
          }
          // Muro baixo entre lotes.
          if (k > 0) add(white, caixa(x - 0.004, x + 0.004, S0, S0 + 0.03, z0, z1), semSombra);
          // Marcador do cadastro (alfinete) em alguns lotes.
          if (id === 2 || id === 7 || id === 9) {
            add(M.metal, cil(0.004, 0.004, 0.14, mx + lw * 0.3, S0 + 0.07, (z0 + z1) / 2, 4), semSombra);
            add(id === 7 ? C.vermelho : C.azul, new THREE.SphereGeometry(0.022, lite ? 6 : 8, lite ? 4 : 6).translate(mx + lw * 0.3, S0 + 0.15, (z0 + z1) / 2), semSombra);
          }
          x += lw;
        });
      });
      // Árvores na calçada (copa + tronco).
      for (const [tx, tz] of [[Q.x0 - 0.1, Q.z0 - 0.1], [Q.x1 + 0.1, Q.z0 - 0.1], [Q.x0 - 0.1, Q.z1 + 0.1], [Q.x1 + 0.1, Q.z1 + 0.1], [cx, Q.z1 + 0.1]]) {
        add(M.madeira, cil(0.012, 0.015, 0.08, tx, B + 0.04, tz, 5), semSombra);
        add(M.folha, new THREE.IcosahedronGeometry(0.06, 0).translate(tx, B + 0.12, tz));
      }
      // Carrinhos na rua.
      for (const [vx, vz, c] of [[cx - 0.7, cz + TD / 2 - 0.11, C.vermelho], [cx + 0.55, cz - TD / 2 + 0.11, C.azul], [cx + 1.18, cz, C.amarelo]]) {
        const lado = Math.abs(vz - cz) < 0.01;
        const w = lado ? 0.07 : 0.13;
        const d = lado ? 0.13 : 0.07;
        add(c, caixa(vx - w / 2, vx + w / 2, B, B + 0.045, vz - d / 2, vz + d / 2), semSombra);
        add(M.escuro, caixa(vx - w / 2 + 0.01, vx + w / 2 - 0.01, B + 0.045, B + 0.07, vz - d / 2 + 0.015, vz + d / 2 - 0.015), semSombra);
      }
      // Etiqueta "QUADRA" na borda sul da mesa: faixa verde.
      add(C.verde, caixa(cx - 0.6, cx + 0.6, TOPO - 0.15, TOPO - 0.07, cz + TD / 2 + 0.001, cz + TD / 2 + 0.012), semSombra);
    }

    // ---- Telão de arrecadação (Gestão Tributária) --------------------------------
    {
      const e = ext(TELAO.x0, TELAO.x1, TELAO.y, TELAO.y);
      const { cx, cz } = e;
      // Baixo o bastante para não esconder quem passa atrás (y = 3).
      const SW = 1.36;
      const SH = 0.765;
      const Y0 = 0.8;
      // Pedestal com dois pés.
      for (const sx of [-0.55, 0.55]) {
        add(M.escuro, caixa(cx + sx - 0.04, cx + sx + 0.04, 0, Y0 + 0.2, cz - 0.04, cz + 0.04));
        add(M.escuro, caixa(cx + sx - 0.07, cx + sx + 0.07, 0, 0.03, cz - 0.3, cz + 0.3));
      }
      add(M.escuro, caixa(cx - SW / 2 - 0.05, cx + SW / 2 + 0.05, Y0 - 0.05, Y0 + SH + 0.05, cz - 0.07, cz + 0.02));
      rotulo(SW, SH, R.telao, cx, Y0 + SH / 2, cz + 0.022);
      // Faixa com o nome do departamento embaixo do telão.
      add(M.escuro, caixa(cx - 0.62, cx + 0.62, 0.5, 0.7, cz - 0.03, cz + 0.02));
      rotulo(1.2, 0.18, R.tiraTelao, cx, 0.6, cz + 0.022);
    }

    // ---- Protocolo: esteira de processos, bandejas, carimbos e carnês ----------
    {
      const e = ext(PROTOCOLO.x0, PROTOCOLO.x1, PROTOCOLO.y, PROTOCOLO.y);
      const { cx, cz } = e;
      const TW = 2.8;
      const TOPO = 0.74;
      add(M.madeiraClara, caixa(cx - TW / 2, cx + TW / 2, TOPO - 0.05, TOPO, cz - 0.38, cz + 0.32));
      add(M.metal, caixa(cx - TW / 2 + 0.05, cx + TW / 2 - 0.05, 0, TOPO - 0.05, cz - 0.3, cz + 0.22));
      add(M.friso, caixa(cx - TW / 2 + 0.05, cx + TW / 2 - 0.05, 0.08, TOPO - 0.08, cz + 0.22, cz + 0.24), semSombra);
      rotulo(1.0, 0.22, R.protocolo, cx + 0.55, 0.42, cz + 0.245);
      // Esteira de roletes à esquerda, com pastas de processo passando.
      const ex0 = cx - TW / 2 + 0.1;
      const ex1 = cx - 0.1;
      const EY = TOPO + 0.12;
      add(M.metal, caixa(ex0, ex1, TOPO, EY - 0.03, cz - 0.24, cz - 0.2));
      add(M.metal, caixa(ex0, ex1, TOPO, EY - 0.03, cz + 0.12, cz + 0.16));
      const nRol = lite ? 8 : 14;
      for (let k = 0; k < nRol; k++) {
        const x = ex0 + 0.05 + ((ex1 - ex0 - 0.1) * k) / (nRol - 1);
        // Rolete deitado no eixo z.
        add(M.caixilho, new THREE.CylinderGeometry(0.018, 0.018, 0.36, 6).rotateX(Math.PI / 2).translate(x, EY - 0.03, cz - 0.04), semSombra);
      }
      // Pastas sobre a esteira.
      [-0.95, -0.55, -0.2].forEach((dx, i) => {
        const px = cx + dx;
        const h = 0.025 + (i % 2) * 0.02;
        add(C.pasta[i % C.pasta.length], caixa(px - 0.13, px + 0.13, EY - 0.012, EY - 0.012 + h, cz - 0.17, cz + 0.09));
        add(C.papel, caixa(px - 0.11, px + 0.11, EY - 0.012 + h, EY - 0.008 + h, cz - 0.15, cz + 0.07), semSombra);
      });
      // Bandejas "entrada" e "saída" empilhadas.
      const bx = cx + 0.25;
      for (const [k, cor] of [[0, C.verdeClaro], [1, C.amarelo]]) {
        const y = TOPO + k * 0.09;
        add(cor, caixa(bx - 0.17, bx + 0.17, y, y + 0.012, cz - 0.2, cz + 0.12));
        add(cor, caixa(bx - 0.17, bx + 0.17, y, y + 0.06, cz + 0.11, cz + 0.12), semSombra);
        add(C.papel, caixa(bx - 0.14, bx + 0.14, y + 0.012, y + 0.035, cz - 0.17, cz + 0.08), semSombra);
      }
      add(M.metal, caixa(bx - 0.17, bx - 0.16, TOPO, TOPO + 0.18, cz - 0.2, cz - 0.19), semSombra);
      add(M.metal, caixa(bx + 0.16, bx + 0.17, TOPO, TOPO + 0.18, cz - 0.2, cz - 0.19), semSombra);
      // Carimbos e almofada.
      const ax = cx + 0.62;
      add(M.escuro, caixa(ax - 0.08, ax + 0.08, TOPO, TOPO + 0.02, cz - 0.05, cz + 0.07));
      add(C.vermelho, caixa(ax - 0.065, ax + 0.065, TOPO + 0.02, TOPO + 0.025, cz - 0.035, cz + 0.055), semSombra);
      for (const [dx, dz, c] of [[0.2, -0.08, C.vermelho], [0.2, 0.1, C.azul]]) {
        add(M.escuro, caixa(ax + dx - 0.035, ax + dx + 0.035, TOPO, TOPO + 0.03, cz + dz - 0.025, cz + dz + 0.025));
        add(M.madeira, cil(0.012, 0.016, 0.07, ax + dx, TOPO + 0.065, cz + dz, 6));
        add(c, new THREE.SphereGeometry(0.026, 8, 6).translate(ax + dx, TOPO + 0.11, cz + dz));
      }
      // Pilhas de carnês (capas do atlas no topo).
      [[1.0, -0.12, 9], [1.21, -0.12, 6], [1.1, 0.13, 7]].forEach(([dx, dz, n]) => {
        const px = cx + dx;
        const pz = cz + dz;
        const h = n * 0.012;
        add(C.papel, caixa(px - 0.09, px + 0.09, TOPO, TOPO + h, pz - 0.06, pz + 0.06));
        for (let k = 1; k < n; k += 2) add(C.verde, caixa(px - 0.091, px + 0.091, TOPO + k * 0.012, TOPO + k * 0.012 + 0.003, pz - 0.061, pz + 0.061), semSombra);
        lotes.add(atlasMat, plano(0.18, 0.12, R.carne).rotateX(-Math.PI / 2).translate(px, TOPO + h + 0.002, pz), semSombra);
      });
    }

    // ---- Atendimento ao Cidadão: guichês, painel de senha, totem e espera -------
    const vivos = new THREE.Group();
    vivos.name = "receita-vivos";
    root.add(vivos);
    let painel = null;
    {
      const e = ext(GUICHES.x0, GUICHES.x1, GUICHES.y, GUICHES.y);
      const { x0, x1, cz } = e;
      const L = x1 - x0;
      const ALTO = 1.02; // balcão de atendimento em pé
      const MESA = 0.75; // lado do atendente
      const ZF = cz + 0.36; // frente (sul)
      const ZB = cz - 0.12; // fundo do balcão alto
      // Balcão alto contínuo, tampo branco e faixa na cor do andar.
      add(M.madeiraClara, caixa(x0 + 0.05, x1 - 0.05, 0, ALTO - 0.04, ZB, ZF - 0.02));
      add(M.marmore, caixa(x0, x1, ALTO - 0.04, ALTO, ZB - 0.02, ZF + 0.04));
      add(M.rodape, caixa(x0 + 0.05, x1 - 0.05, 0, 0.1, ZF - 0.03, ZF - 0.01), semSombra);
      rotulo(2.4, 0.2, R.atendimento, (x0 + x1) / 2, 0.82, ZF - 0.018);
      // Mesa do atendente atrás (mais baixa).
      add(M.madeira, caixa(x0 + 0.05, x1 - 0.05, MESA - 0.04, MESA, cz - 0.48, ZB));
      add(M.metal, caixa(x0 + 0.05, x0 + 0.1, 0, MESA - 0.04, cz - 0.45, ZB));
      add(M.metal, caixa(x1 - 0.1, x1 - 0.05, 0, MESA - 0.04, cz - 0.45, ZB));
      const n = 3;
      for (let i = 0; i < n; i++) {
        const gx0 = x0 + (L * i) / n;
        const gx = gx0 + L / n / 2;
        // Divisória de vidro entre guichês (sobre o balcão).
        if (i > 0) {
          add(M.caixilho, caixa(gx0 - 0.02, gx0 + 0.02, ALTO, ALTO + 0.42, cz - 0.4, ZF), semSombra);
          lotes.add(vidroMat, caixa(gx0 - 0.006, gx0 + 0.006, ALTO, ALTO + 0.4, cz - 0.4, ZF - 0.02), semSombra);
        }
        // Plaquinha "GUICHÊ 0n" na frente do balcão.
        rotulo(0.62, 0.28, R.guiche[i], gx, 0.48, ZF - 0.018);
        // Monitor virado para o atendente (o cidadão vê as costas) e teclado.
        add(M.escuro, caixa(gx - 0.2, gx + 0.2, MESA + 0.12, MESA + 0.4, cz - 0.2, cz - 0.16));
        add(M.escuro, caixa(gx - 0.02, gx + 0.02, MESA, MESA + 0.14, cz - 0.17, cz - 0.15));
        rotulo(0.36, 0.24, R.tela, gx, MESA + 0.26, cz - 0.205, Math.PI);
        add(M.escuro, caixa(gx - 0.14, gx + 0.14, MESA, MESA + 0.015, cz - 0.38, cz - 0.3), semSombra);
        // Cadeira do atendente.
        const sz = cz - 0.58;
        add(M.estofado, caixa(gx - 0.18, gx + 0.18, 0.44, 0.52, sz - 0.16, sz + 0.16));
        add(M.estofado, caixa(gx - 0.18, gx + 0.18, 0.52, 0.86, sz - 0.2, sz - 0.15));
        add(M.escuro, cil(0.025, 0.025, 0.44, gx, 0.22, sz, 6));
        add(M.escuro, cil(0.17, 0.17, 0.03, gx, 0.015, sz), semSombra);
        // Pilhas de carnês e caneta no balcão.
        if (i !== 1) {
          add(C.papel, caixa(gx + 0.18, gx + 0.36, ALTO, ALTO + 0.06, cz + 0.05, cz + 0.17));
          lotes.add(atlasMat, plano(0.18, 0.12, R.carne).rotateX(-Math.PI / 2).translate(gx + 0.27, ALTO + 0.062, cz + 0.11), semSombra);
        } else {
          add(C.azul, caixa(gx - 0.3, gx - 0.12, ALTO, ALTO + 0.01, cz + 0.08, cz + 0.2), semSombra);
        }
      }
      // Painel de senha: suspenso por dois postes no fundo do balcão.
      const PW = 1.25;
      const PH = PW * (176 / 512);
      const PY = 1.62;
      const px = (x0 + x1) / 2;
      const pz = cz - 0.46;
      for (const sx of [-0.45, 0.45]) add(M.caixilho, caixa(px + sx - 0.025, px + sx + 0.025, MESA, PY - PH / 2, pz - 0.025, pz + 0.025));
      add(M.escuro, caixa(px - PW / 2 - 0.04, px + PW / 2 + 0.04, PY - PH / 2 - 0.04, PY + PH / 2 + 0.04, pz - 0.05, pz + 0.03));
      const pc = makeCanvas(512, 176);
      const ptex = track(canvasTexture(pc, false));
      const pmat = track(new THREE.MeshStandardMaterial({ map: ptex, emissive: white, emissiveMap: ptex, emissiveIntensity: lite ? 0.75 : 0.6, roughness: 0.4 }));
      const pmesh = new THREE.Mesh(track(new THREE.PlaneGeometry(PW, PH)), pmat);
      pmesh.position.set(px, PY, pz + 0.032);
      vivos.add(pmesh);
      painel = { g: pc.getContext("2d"), tex: ptex, senha: 42, guiche: 2 };
      desenharPainel(painel.g, pal, painel.senha, painel.guiche, true);
      document.fonts?.ready.then(() => {
        desenharPainel(painel.g, pal, painel.senha, painel.guiche, true);
        ptex.needsUpdate = true;
      });
    }
    // Totem de senha (dispensador).
    {
      const p = tileToWorld(...TOTEM);
      const x = p.x;
      const z = p.z + 0.1;
      add(M.acento, caixa(x - 0.2, x + 0.2, 0, 1.3, z - 0.14, z + 0.12));
      add(M.escuro, caixa(x - 0.24, x + 0.24, 0, 0.05, z - 0.18, z + 0.16), semSombra);
      add(white, caixa(x - 0.16, x + 0.16, 0.95, 1.2, z + 0.12, z + 0.13), semSombra);
      rotulo(0.32, 0.08, R.totem, x, 1.08, z + 0.132);
      add(M.escuro, caixa(x - 0.1, x + 0.1, 0.78, 0.82, z + 0.1, z + 0.15));
      add(C.papel, caixa(x - 0.04, x + 0.04, 0.72, 0.8, z + 0.13, z + 0.135), semSombra);
      add(C.amarelo, caixa(x - 0.06, x + 0.06, 0.6, 0.66, z + 0.115, z + 0.13), semSombra);
    }
    // Longarina de espera (quatro assentos virados para os guichês).
    {
      const e = ext(LONGARINA.x0, LONGARINA.x1, LONGARINA.y, LONGARINA.y);
      const { x0, x1, cz } = e;
      add(M.escuro, caixa(x0 + 0.2, x1 - 0.2, 0.32, 0.38, cz - 0.03, cz + 0.03));
      for (const lx of [x0 + 0.35, x1 - 0.35]) {
        add(M.escuro, caixa(lx - 0.03, lx + 0.03, 0, 0.35, cz - 0.03, cz + 0.03));
        add(M.escuro, caixa(lx - 0.04, lx + 0.04, 0, 0.03, cz - 0.25, cz + 0.25), semSombra);
      }
      const nS = LONGARINA.x1 - LONGARINA.x0 + 1;
      for (let k = 0; k < nS; k++) {
        const sx = x0 + 0.5 + k;
        add(M.estofado, caixa(sx - 0.24, sx + 0.24, 0.4, 0.47, cz - 0.24, cz + 0.2));
        add(M.estofado, caixa(sx - 0.24, sx + 0.24, 0.47, 0.88, cz + 0.17, cz + 0.24));
        add(M.metal, caixa(sx - 0.25, sx - 0.23, 0.38, 0.62, cz - 0.15, cz + 0.2), semSombra);
      }
      // Alguém esqueceu um carnê no assento.
      lotes.add(atlasMat, plano(0.18, 0.12, R.carne).rotateX(-Math.PI / 2).rotateY(0.4).translate(x0 + 1.5, 0.475, cz - 0.05), semSombra);
    }

    // ---- Mesa de luz com o mapa de lotes (geoprocessamento) --------------------
    {
      const e = ext(MAPA.x0, MAPA.x1, MAPA.y, MAPA.y);
      const { cx, cz } = e;
      const MW2 = 1.6;
      const MD = 1.0;
      const INC = 0.5; // inclinação do tampo para o sul (rad)
      const Y = 0.8;
      // Pés e travessa.
      for (const sx of [-1, 1]) {
        add(M.metal, caixa(cx + sx * 0.68 - 0.03, cx + sx * 0.68 + 0.03, 0, Y + 0.08, cz - 0.25, cz - 0.19));
        add(M.metal, caixa(cx + sx * 0.68 - 0.03, cx + sx * 0.68 + 0.03, 0, Y - 0.14, cz + 0.19, cz + 0.25));
        add(M.metal, caixa(cx + sx * 0.68 - 0.04, cx + sx * 0.68 + 0.04, 0, 0.03, cz - 0.38, cz + 0.38), semSombra);
      }
      add(M.metal, caixa(cx - 0.68, cx + 0.68, 0.18, 0.22, cz - 0.02, cz + 0.02));
      // Tampo inclinado: caixa escura + mapa luminoso por cima.
      const tampo = caixa(-MW2 / 2 - 0.05, MW2 / 2 + 0.05, -0.05, 0, -MD / 2 - 0.05, MD / 2 + 0.05).rotateX(INC).translate(cx, Y, cz);
      add(M.escuro, tampo);
      lotes.add(atlasMat, plano(MW2, MD, R.mapa).rotateX(-Math.PI / 2 + INC).translate(cx, Y + 0.002, cz), semSombra);
      // Régua de escala e uma lupa na borda de baixo.
      const bordaZ = cz + Math.cos(INC) * (MD / 2 + 0.05);
      const bordaY = Y - Math.sin(INC) * (MD / 2 + 0.05);
      add(C.amarelo, caixa(cx - 0.6, cx + 0.1, bordaY - 0.02, bordaY + 0.02, bordaZ - 0.02, bordaZ + 0.03), semSombra);
      add(M.escuro, cil(0.06, 0.06, 0.015, cx + 0.45, bordaY + 0.02, bordaZ - 0.1, 12), semSombra);
    }

    // ---- Kit de vistoria e drone (leste) ------------------------------------------
    // Mesinha com prancheta, trena e capacete.
    {
      const p = tileToWorld(...MESINHA);
      const { x, z } = p;
      add(M.madeiraClara, caixa(x - 0.38, x + 0.38, 0.66, 0.7, z - 0.3, z + 0.3));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(M.escuro, caixa(x + sx * 0.32 - 0.025, x + sx * 0.32 + 0.025, 0, 0.66, z + sz * 0.24 - 0.025, z + sz * 0.24 + 0.025));
      // Prancheta com ficha de vistoria.
      add(M.madeira, caixa(x - 0.25, x + 0.0, 0.7, 0.71, z - 0.2, z + 0.14), semSombra);
      add(C.papel, caixa(x - 0.23, x - 0.02, 0.71, 0.715, z - 0.14, z + 0.12), semSombra);
      add(M.metal, caixa(x - 0.17, x - 0.08, 0.71, 0.725, z - 0.19, z - 0.15), semSombra);
      // Trena: caixa amarela e fita.
      add(C.amarelo, caixa(x + 0.06, x + 0.18, 0.7, 0.8, z - 0.18, z - 0.08));
      add(M.escuro, new THREE.CylinderGeometry(0.035, 0.035, 0.125, 8).rotateZ(Math.PI / 2).translate(x + 0.12, 0.75, z - 0.13), semSombra);
      add(C.amarelo, caixa(x + 0.18, x + 0.34, 0.701, 0.704, z - 0.14, z - 0.12), semSombra);
      // Capacete branco.
      add(white, new THREE.SphereGeometry(0.1, lite ? 8 : 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(x + 0.16, 0.7, z + 0.12));
      add(white, cil(0.13, 0.13, 0.01, x + 0.16, 0.705, z + 0.12, lite ? 8 : 12), semSombra);
    }
    // Câmera no tripé.
    {
      const p = tileToWorld(...TRIPE);
      const { x, z } = p;
      const top = 1.25;
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + 0.4;
        const fx = x + Math.cos(a) * 0.3;
        const fz = z + Math.sin(a) * 0.3;
        const len = Math.hypot(0.3, top);
        const dir = new THREE.Vector3(x - fx, top, z - fz).normalize();
        const perna = new THREE.CylinderGeometry(0.014, 0.018, len, 5).translate(0, len / 2, 0);
        perna.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
        add(M.escuro, perna.translate(fx, 0, fz));
      }
      add(M.escuro, caixa(x - 0.05, x + 0.05, top - 0.02, top + 0.04, z - 0.05, z + 0.05));
      // Corpo da câmera virado para sudoeste, lente e visor.
      const corpo = caixa(-0.1, 0.1, 0, 0.13, -0.06, 0.06);
      const lente = new THREE.CylinderGeometry(0.045, 0.05, 0.12, 10).rotateX(Math.PI / 2).translate(0, 0.065, 0.12);
      const flash = caixa(-0.04, 0.04, 0.13, 0.17, -0.03, 0.03);
      const rot = -0.8;
      add(M.escuro, colocar(corpo, x, z, rot).translate(0, top + 0.04, 0));
      add(M.caixilho, colocar(lente, x, z, rot).translate(0, top + 0.04, 0));
      add(M.escuro, colocar(flash, x, z, rot).translate(0, top + 0.04, 0));
      add(C.vermelho, caixa(x - 0.012, x + 0.012, top + 0.15, top + 0.165, z - 0.012, z + 0.012), semSombra);
    }
    // Cabideiro com o colete "FISCAL" (virado para o salão).
    {
      const p = tileToWorld(...CABIDEIRO);
      const { x, z } = p;
      add(M.escuro, cil(0.02, 0.02, 1.7, x + 0.15, 0.85, z, 6));
      add(M.escuro, cil(0.2, 0.22, 0.04, x + 0.15, 0.02, z), semSombra);
      add(M.escuro, caixa(x + 0.15 - 0.02, x + 0.15 + 0.02, 1.55, 1.58, z - 0.2, z + 0.2));
      // Colete: tronco sem mangas, girado para ser visto do sul-oeste.
      const ROT = -0.9;
      const cx0 = -0.24;
      const cx1 = 0.24;
      const geoCorpo = caixa(cx0, cx1, 0.92, 1.5, -0.07, 0.07);
      add(mix(pv("blue-900"), pv("gray-900"), 0.3), geoCorpo.rotateY(ROT).translate(x - 0.02, 0, z + 0.02));
      // Ombreiras e faixas refletivas.
      for (const s of [-1, 1]) {
        add(mix(pv("blue-900"), pv("gray-900"), 0.3), caixa(s * 0.16 - 0.06, s * 0.16 + 0.06, 1.5, 1.56, -0.06, 0.06).rotateY(ROT).translate(x - 0.02, 0, z + 0.02));
      }
      add(C.amarelo, caixa(cx0 - 0.005, cx1 + 0.005, 1.0, 1.04, -0.075, 0.075).rotateY(ROT).translate(x - 0.02, 0, z + 0.02), semSombra);
      // Costas com "FISCAL" (atlas).
      lotes.add(atlasMat, plano(0.46, 0.17, R.colete).translate(0, 1.3, 0.072).rotateY(ROT).translate(x - 0.02, 0, z + 0.02), semSombra);
    }
    // Drone pousado na maleta-base (geoprocessamento).
    {
      const p = tileToWorld(...DRONE);
      const { x, z } = p;
      // Maleta preta aberta: base com espuma e o heliponto.
      add(M.escuro, caixa(x - 0.38, x + 0.38, 0, 0.32, z - 0.3, z + 0.3));
      add(M.capacho, caixa(x - 0.34, x + 0.34, 0.32, 0.34, z - 0.26, z + 0.26), semSombra);
      add(M.escuro, caixa(x - 0.38, x + 0.38, 0.32, 0.86, z - 0.34, z - 0.3));
      add(white, caixa(x - 0.04, x - 0.02, 0.341, 0.343, z - 0.09, z + 0.09), semSombra);
      add(white, caixa(x + 0.02, x + 0.04, 0.341, 0.343, z - 0.09, z + 0.09), semSombra);
      add(white, caixa(x - 0.02, x + 0.02, 0.341, 0.343, z - 0.01, z + 0.01), semSombra);
      // Drone: corpo, quatro braços em X, motores e hélices paradas.
      const Y = 0.38;
      add(mix(pv("gray-200"), white, 0.4), caixa(x - 0.08, x + 0.08, Y, Y + 0.06, z - 0.1, z + 0.1));
      add(M.escuro, caixa(x - 0.03, x + 0.03, Y - 0.04, Y, z + 0.06, z + 0.11));
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const bx = x + sx * 0.17;
        const bz = z + sz * 0.17;
        add(mix(pv("gray-200"), white, 0.4), caixa(-0.015, 0.015, -0.012, 0.012, -0.12, 0.12).rotateY(Math.atan2(sx, sz)).translate((x + bx) / 2, Y + 0.035, (z + bz) / 2));
        add(M.escuro, cil(0.025, 0.025, 0.04, bx, Y + 0.04, bz, 8));
        add(M.caixilho, caixa(-0.1, 0.1, 0, 0.006, -0.012, 0.012).rotateY(sx * sz * 0.6).translate(bx, Y + 0.062, bz), semSombra);
        add(M.escuro, cil(0.012, 0.012, 0.04, bx, Y - 0.02, bz, 5), semSombra);
      }
      add(C.verdeClaro, caixa(x - 0.012, x + 0.012, Y + 0.06, Y + 0.068, z - 0.1, z - 0.08), semSombra);
      // Controle remoto ao lado.
      add(M.escuro, caixa(x + 0.18, x + 0.32, 0.34, 0.37, z + 0.12, z + 0.22), semSombra);
    }

    // ---- Animação: painel de senha avança e pisca ao trocar --------------------
    let proxima = 7;
    let piscaAte = -1;
    const PISCA = 0.9;
    return {
      update(t) {
        if (reducedMotion || !painel) return;
        if (t >= proxima) {
          proxima = t + 6 + (painel.senha % 3);
          painel.senha = painel.senha >= 99 ? 42 : painel.senha + 1;
          painel.guiche = (painel.guiche % 3) + 1;
          piscaAte = t + PISCA;
        }
        const aceso = t >= piscaAte || Math.floor((piscaAte - t) / 0.15) % 2 === 0;
        if (aceso !== painel.aceso) {
          painel.aceso = aceso;
          desenharPainel(painel.g, pal, painel.senha, painel.guiche, aceso);
          painel.tex.needsUpdate = true;
        }
      },
      dispose() {
        vivos.removeFromParent();
      },
    };
  },
};
