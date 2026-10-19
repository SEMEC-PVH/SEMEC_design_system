// Tema do andar "orcamento" (3º andar · Secretaria Executiva de Orçamento).
//
// O que caracteriza o setor:
// - PEÇA CENTRAL (leste do salão): os três volumes "PPA", "LDO" e "LOA" em pé
//   num pedestal, com setas em arco mostrando o ciclo e um anel no piso.
// - Parede norte, ao lado do elevador: calendário do ciclo orçamentário (oeste,
//   junto do Planejamento Orçamentário) e a tela "Projeção da receita" (leste,
//   junto da Pesquisa e Projeções de Receitas), cada um sobre um aparador baixo
//   no lugar dos vasos altos.
// - Painel "Execução orçamentária" em pé no salão oeste, de frente para a
//   câmera, perto do Controle e Acompanhamento da Execução: barras de empenhado,
//   liquidado e pago enchendo ao longo do "ano".
// - Balança "Receita × Despesa" equilibrada, pizza 3D das despesas numa mesinha
//   e, na área comum leste, um quadro de cortiça com post-its de emendas.
//
// Objetos que ensinam: pedestal (PPA, LDO e LOA), painel (Execução
// orçamentária) e aparador da tela (Projeção de receita).
//
// Desempenho: tudo o que é liso vai no lote de cor por vértice do andar (zero
// draw call novo). Os textos moram num único atlas de canvas usado por dois
// materiais (papel e tela); as barras do painel são um só mesh e o ponto da
// projeção outro. Total: ~4 draw calls a mais.

import * as THREE from "three";

// Tiles (planta 22 × 14, ver escritorio.js).
const PEDESTAL = { x0: 14, x1: 16, y0: 5, y1: 6 };
const PAINEL = [[5, 6], [6, 6]];
const BALANCA = [17, 8];
const PIZZA = [7, 9];
const APARADOR_CAL = [9, 1]; // no lugar do vaso alto à esquerda do elevador
const APARADOR_TV = [12, 1]; // no lugar do vaso alto à direita

// Atlas (2048 × 1024): regiões em pixels.
const AW = 2048;
const AH = 1024;
const R = {
  cal: { x: 0, y: 0, w: 1024, h: 368 },
  ppa: { x: 1024, y: 0, w: 256, h: 416 },
  ldo: { x: 1280, y: 0, w: 256, h: 416 },
  loa: { x: 1536, y: 0, w: 256, h: 416 },
  exec: { x: 0, y: 416, w: 768, h: 448 },
  proj: { x: 768, y: 416, w: 896, h: 400 },
  cortica: { x: 1664, y: 416, w: 384, h: 240 },
  receita: { x: 1664, y: 672, w: 192, h: 64 },
  despesa: { x: 1856, y: 672, w: 192, h: 64 },
  rotulo: { x: 0, y: 880, w: 1024, h: 112 },
};

// Painel de execução: trilhos das barras (px dentro da região `exec`).
const BARRAS = [
  { rotulo: "1 · Empenhado", alvo: 0.86, atraso: 0 },
  { rotulo: "2 · Liquidado", alvo: 0.68, atraso: 0.12 },
  { rotulo: "3 · Pago", alvo: 0.55, atraso: 0.22 },
];
const TRILHO = { x: 250, w: 470, y0: 150, passo: 92, h: 40 };

// Gráfico de projeção (px dentro da região `proj`): 6 pontos, 3 anos
// realizados + hoje + 2 anos projetados (como pede a LRF, art. 12).
const GRAF = { x0: 90, x1: 850, y0: 330, y1: 100 };
const SERIE = [0.18, 0.3, 0.38, 0.52, 0.66, 0.8];
const HOJE = 3;

const INFO_PPA = [
  "O orçamento público nasce de três leis previstas no art. 165 da Constituição. O PPA (Plano Plurianual) traça diretrizes, objetivos e metas para 4 anos. A LDO (Lei de Diretrizes Orçamentárias) define as metas e prioridades do ano seguinte e orienta a LOA.",
  "A LOA (Lei Orçamentária Anual) é o orçamento do ano: estima a receita e fixa a despesa. Uma lei segue a outra: a LOA respeita a LDO, que respeita o PPA. Em geral o PPA começa no 2º ano de um mandato e vai até o 1º ano do seguinte, para as políticas não pararem.",
  "A Prefeitura elabora os projetos e a Câmara Municipal vota. Na União, a regra geral (ADCT, art. 35) manda o projeto da LDO ao Legislativo até 15 de abril e o da LOA até 31 de agosto. Cada município fixa os seus prazos na Lei Orgânica.",
];
const INFO_EXEC = [
  "Executar o orçamento é transformar o que a LOA autorizou em gasto de verdade. Pela Lei 4.320/64, toda despesa pública passa por três etapas, nesta ordem: empenho, liquidação e pagamento.",
  "Empenho: a Prefeitura separa parte da verba para aquela compra ou serviço. Liquidação: confere se o que foi contratado foi mesmo entregue. Pagamento: só então o dinheiro sai. Por isso, no painel, o pago nunca passa o liquidado, nem o liquidado passa o empenhado.",
];
const INFO_PROJ = [
  "Antes de decidir quanto gastar, é preciso estimar quanto vai entrar: impostos como IPTU e ISS, taxas e transferências da União e do Estado. Essa estimativa é a projeção de receita, feita com a série histórica, a inflação e o ritmo da economia.",
  "A LRF (art. 12) pede que a previsão mostre o método usado e os números dos 3 anos anteriores e dos 2 seguintes, como no gráfico. E se a arrecadação vier abaixo do esperado e ameaçar as metas, a LRF (art. 9º) manda limitar os empenhos.",
];

const tilesPedestal = () => {
  const t = [];
  for (let x = PEDESTAL.x0; x <= PEDESTAL.x1; x++) for (let y = PEDESTAL.y0; y <= PEDESTAL.y1; y++) t.push([x, y]);
  return t;
};

export const orcamento = {
  planejar(ctx) {
    // Vasos altos do elevador saem: no lugar, aparadores baixos sob o
    // calendário e a tela. Na área comum leste, a impressora e o quadro branco
    // dão lugar à cortiça das emendas (bebedouro, sofá e planta ficam).
    ctx.removerDecor((d) => d.tipo === "plantaAlta");
    ctx.removerDecor((d) => d.seg === "leste" && (d.tipo === "impressora" || d.tipo === "quadroBranco"));
    const reservados = [...tilesPedestal(), ...PAINEL, BALANCA, PIZZA, APARADOR_CAL, APARADOR_TV];
    for (const [x, y] of reservados) ctx.reservar(x, y);

    ctx.info("orc-ppa-ldo-loa", tilesPedestal(), "PPA, LDO e LOA", INFO_PPA);
    ctx.info("orc-execucao", PAINEL, "Execução orçamentária", INFO_EXEC);
    ctx.info("orc-projecao", [APARADOR_TV], "Projeção de receita", INFO_PROJ);

    const falhas = ctx.alcancavel();
    if (falhas.length) console.warn("Tema orcamento: inalcançável", falhas);
  },

  construir(ctx) {
    const { root, lotes, M, pal, track, lite, reducedMotion, cor, FACE, tileToWorld, caixa, colocar, std, makeCanvas, canvasTexture, caberFonte } = ctx;
    const { pv, mix } = pal;
    const white = pv("white");
    const semSombra = { cast: false };
    const seg = lite ? 10 : 20;
    const font = pal.font;

    // Cores lisas (vão para o lote de cor por vértice: não somam draw call).
    const liso = (c) => track(std(c, { roughness: 0.7 }));
    const C = {
      ppa: pv("blue-700"),
      ldo: pv("yellow-500"),
      loa: cor,
      verde: pv("green-600"),
      papel: mix(pv("yellow-400"), white, 0.85),
      ouro: mix(pv("yellow-500"), pv("yellow-800"), 0.45),
      pedra: mix(pv("gray-700"), cor, 0.18),
      seta: mix(pv("gray-800"), pv("gray-900"), 0.5),
    };
    const MT = {
      ppa: liso(C.ppa),
      ldo: liso(mix(C.ldo, pv("yellow-800"), 0.15)),
      loa: liso(C.loa),
      papel: liso(C.papel),
      ouro: liso(C.ouro),
      pedra: liso(C.pedra),
      seta: liso(C.seta),
      anel: liso(mix(cor, white, 0.55)),
      cortica: liso(mix(pv("yellow-800"), pv("yellow-400"), 0.3)),
      fatias: [pv("blue-600"), pv("red-600"), pv("yellow-500"), pv("green-600"), pv("gray-400")].map(liso),
      moeda: liso(mix(pv("yellow-400"), pv("yellow-500"), 0.5)),
      nota: liso(mix(pv("green-500"), white, 0.35)),
    };

    // ---- Atlas de textos (um canvas para tudo) ------------------------------
    const atlas = makeCanvas(AW, AH);
    const tex = track(canvasTexture(atlas));
    const matPapel = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
    const matTela = track(new THREE.MeshBasicMaterial({ map: tex, color: mix(white, pv("gray-200"), 0.08) }));

    const desenhar = () => {
      const g = atlas.getContext("2d");
      g.clearRect(0, 0, AW, AH);
      g.textAlign = "center";
      g.textBaseline = "middle";
      desenharCalendario(g);
      desenharCapa(g, R.ppa, C.ppa, white, "PPA", ["Plano", "Plurianual"], "4 anos");
      desenharCapa(g, R.ldo, C.ldo, pv("gray-900"), "LDO", ["Lei de Diretrizes", "Orçamentárias"], "metas do ano");
      desenharCapa(g, R.loa, C.loa, white, "LOA", ["Lei Orçamentária", "Anual"], "orçamento do ano");
      desenharExecucao(g);
      desenharProjecao(g);
      desenharCortica(g);
      desenharPlaquinha(g, R.receita, "RECEITA", pv("green-700"));
      desenharPlaquinha(g, R.despesa, "DESPESA", pv("red-700"));
      desenharRotulo(g);
      tex.needsUpdate = true;
    };

    // Texto que cabe na largura (centralizado em x, y).
    const texto = (g, t, x, y, peso, max, min, largura) => {
      caberFonte(g, t, peso, max, min, largura, font);
      g.fillText(t, x, y);
    };
    const roundRect = (g, x, y, w, h, r) => {
      g.beginPath();
      g.roundRect(x, y, w, h, r);
      g.fill();
    };

    function desenharCalendario(g) {
      const { x, y, w, h } = R.cal;
      g.fillStyle = white.getStyle();
      g.fillRect(x, y, w, h);
      // Cabeçalho na cor do andar.
      g.fillStyle = cor.getStyle();
      g.fillRect(x, y, w, 58);
      g.fillStyle = white.getStyle();
      texto(g, "CALENDÁRIO DO CICLO ORÇAMENTÁRIO", x + w / 2, y + 30, 700, 34, 18, w - 40);
      // Argolas do calendário de parede.
      g.fillStyle = pv("gray-700").getStyle();
      for (let i = 0; i < 6; i++) roundRect(g, x + 80 + i * 170, y - 4, 10, 24, 4);
      const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
      const marcos = {
        3: ["Envio da LDO", C.ldo, pv("gray-900")],
        6: ["Votação da LDO", C.ldo, pv("gray-900")],
        7: ["Envio da LOA", C.loa, white],
        11: ["Votação da LOA", C.loa, white],
      };
      const cw = (w - 24) / 6;
      const ch = 112;
      for (let i = 0; i < 12; i++) {
        const cx = x + 12 + (i % 6) * cw;
        const cy = y + 68 + Math.floor(i / 6) * (ch + 6);
        const m = marcos[i];
        g.fillStyle = (m ? mix(m[1], white, 0.82) : mix(pv("gray-100"), white, 0.4)).getStyle();
        g.fillRect(cx + 3, cy, cw - 6, ch);
        g.fillStyle = pv("gray-700").getStyle();
        texto(g, meses[i], cx + cw / 2, cy + 26, 700, 30, 16, cw - 20);
        if (m) {
          g.fillStyle = m[1].getStyle();
          roundRect(g, cx + 12, cy + 56, cw - 24, 40, 10);
          g.fillStyle = m[2].getStyle();
          texto(g, m[0], cx + cw / 2, cy + 77, 700, 22, 12, cw - 34);
        }
      }
      // Faixa de execução: o orçamento do ano corre de janeiro a dezembro.
      g.fillStyle = C.verde.getStyle();
      roundRect(g, x + 16, y + h - 54, w - 32, 22, 11);
      g.fillStyle = pv("gray-700").getStyle();
      texto(g, "Execução da LOA: o ano todo · Prazos da União (ADCT, art. 35); o município segue a Lei Orgânica", x + w / 2, y + h - 16, 600, 18, 11, w - 40);
      g.fillStyle = white.getStyle();
      texto(g, "EXECUÇÃO", x + w / 2, y + h - 43, 700, 16, 10, 200);
    }

    function desenharCapa(g, r, fundo, tinta, sigla, nome, rodape) {
      const { x, y, w, h } = r;
      g.fillStyle = fundo.getStyle();
      g.fillRect(x, y, w, h);
      // Filetes dourados de livro encadernado.
      g.strokeStyle = mix(pv("yellow-400"), fundo, 0.25).getStyle();
      g.lineWidth = 5;
      g.strokeRect(x + 16, y + 16, w - 32, h - 32);
      g.lineWidth = 2;
      g.strokeRect(x + 26, y + 26, w - 52, h - 52);
      g.fillStyle = tinta.getStyle();
      texto(g, sigla, x + w / 2, y + 140, 800, 92, 40, w - 64);
      g.fillStyle = mix(pv("yellow-400"), fundo, 0.2).getStyle();
      g.fillRect(x + 60, y + 200, w - 120, 4);
      g.fillStyle = tinta.getStyle();
      nome.forEach((l, i) => texto(g, l, x + w / 2, y + 236 + i * 30, 600, 26, 12, w - 70));
      g.globalAlpha = 0.85;
      texto(g, rodape, x + w / 2, y + h - 64, 700, 22, 12, w - 70);
      g.globalAlpha = 1;
    }

    const fundoTela = mix(pv("blue-950"), pv("gray-900"), 0.4);
    function desenharExecucao(g) {
      const { x, y, w, h } = R.exec;
      g.fillStyle = fundoTela.getStyle();
      g.fillRect(x, y, w, h);
      g.fillStyle = cor.getStyle();
      g.fillRect(x, y, w, 10);
      g.fillStyle = white.getStyle();
      texto(g, "EXECUÇÃO ORÇAMENTÁRIA", x + w / 2, y + 56, 700, 44, 20, w - 60);
      g.fillStyle = pv("blue-200").getStyle();
      texto(g, "despesa do ano, etapa por etapa", x + w / 2, y + 100, 500, 24, 12, w - 80);
      BARRAS.forEach((b, i) => {
        const ty = y + TRILHO.y0 + i * TRILHO.passo;
        g.textAlign = "left";
        g.fillStyle = white.getStyle();
        caberFonte(g, b.rotulo, 600, 28, 14, TRILHO.x - 40, font);
        g.fillText(b.rotulo, x + 28, ty + TRILHO.h / 2);
        g.textAlign = "center";
        g.fillStyle = mix(fundoTela, white, 0.14).getStyle();
        roundRect(g, x + TRILHO.x, ty, TRILHO.w, TRILHO.h, 8);
      });
      g.fillStyle = pv("gray-400").getStyle();
      texto(g, "empenho → liquidação → pagamento (Lei 4.320/64)", x + w / 2, y + h - 22, 500, 22, 11, w - 60);
    }

    const pontoGraf = (i) => [
      GRAF.x0 + ((GRAF.x1 - GRAF.x0) * i) / (SERIE.length - 1),
      GRAF.y0 + (GRAF.y1 - GRAF.y0) * SERIE[i],
    ];
    function desenharProjecao(g) {
      const { x, y, w, h } = R.proj;
      g.save();
      g.translate(x, y);
      g.fillStyle = fundoTela.getStyle();
      g.fillRect(0, 0, w, h);
      g.fillStyle = pv("green-600").getStyle();
      g.fillRect(0, 0, w, 10);
      g.fillStyle = white.getStyle();
      g.textAlign = "left";
      caberFonte(g, "PROJEÇÃO DA RECEITA", 700, 40, 20, 520, font);
      g.fillText("PROJEÇÃO DA RECEITA", 28, 50);
      // Legenda.
      g.font = `600 20px ${font}`;
      g.fillStyle = pv("blue-300").getStyle();
      g.fillRect(w - 300, 38, 30, 6);
      g.fillStyle = white.getStyle();
      g.fillText("realizada", w - 262, 42);
      g.fillStyle = pv("green-500").getStyle();
      g.fillRect(w - 150, 38, 10, 6);
      g.fillRect(w - 134, 38, 10, 6);
      g.fillStyle = white.getStyle();
      g.fillText("projetada", w - 116, 42);
      g.textAlign = "center";
      // Grade e eixos.
      g.strokeStyle = mix(fundoTela, white, 0.12).getStyle();
      g.lineWidth = 2;
      for (let k = 0; k <= 4; k++) {
        const yy = GRAF.y0 + ((GRAF.y1 - GRAF.y0) * k) / 4;
        g.beginPath();
        g.moveTo(GRAF.x0 - 20, yy);
        g.lineTo(GRAF.x1 + 20, yy);
        g.stroke();
      }
      // Faixa de incerteza do que é projetado (abre com o tempo).
      const [hx, hy] = pontoGraf(HOJE);
      g.fillStyle = pv("green-500").getStyle();
      g.globalAlpha = 0.2;
      g.beginPath();
      g.moveTo(hx, hy);
      for (let i = HOJE + 1; i < SERIE.length; i++) {
        const [px, py] = pontoGraf(i);
        g.lineTo(px, py - (i - HOJE) * 22);
      }
      for (let i = SERIE.length - 1; i > HOJE; i--) {
        const [px, py] = pontoGraf(i);
        g.lineTo(px, py + (i - HOJE) * 22);
      }
      g.closePath();
      g.fill();
      g.globalAlpha = 1;
      // Linha realizada (contínua) e projetada (tracejada).
      g.lineWidth = 7;
      g.lineJoin = "round";
      g.lineCap = "round";
      g.strokeStyle = pv("blue-300").getStyle();
      g.beginPath();
      for (let i = 0; i <= HOJE; i++) g[i ? "lineTo" : "moveTo"](...pontoGraf(i));
      g.stroke();
      g.strokeStyle = pv("green-500").getStyle();
      g.setLineDash([16, 12]);
      g.beginPath();
      for (let i = HOJE; i < SERIE.length; i++) g[i > HOJE ? "lineTo" : "moveTo"](...pontoGraf(i));
      g.stroke();
      g.setLineDash([]);
      // Marcador "hoje" e rótulos dos anos.
      g.strokeStyle = mix(fundoTela, white, 0.45).getStyle();
      g.lineWidth = 2;
      g.setLineDash([6, 6]);
      g.beginPath();
      g.moveTo(hx, GRAF.y1 - 20);
      g.lineTo(hx, GRAF.y0);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = pv("gray-200").getStyle();
      g.font = `600 20px ${font}`;
      const anos = ["-3 anos", "-2", "-1", "hoje", "+1", "+2 anos"];
      anos.forEach((a, i) => g.fillText(a, pontoGraf(i)[0], GRAF.y0 + 36));
      for (let i = 0; i < SERIE.length; i++) {
        const [px, py] = pontoGraf(i);
        g.fillStyle = (i <= HOJE ? pv("blue-300") : pv("green-500")).getStyle();
        g.beginPath();
        g.arc(px, py, 9, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    }

    function desenharCortica(g) {
      const { x, y, w, h } = R.cortica;
      g.fillStyle = mix(pv("yellow-800"), pv("yellow-400"), 0.35).getStyle();
      g.fillRect(x, y, w, h);
      // Grão da cortiça.
      const rnd = ctx.rand;
      g.fillStyle = mix(pv("yellow-800"), pv("gray-900"), 0.3).getStyle();
      g.globalAlpha = 0.25;
      for (let i = 0; i < 260; i++) g.fillRect(x + rnd() * w, y + rnd() * h, 2 + rnd() * 3, 2 + rnd() * 3);
      g.globalAlpha = 1;
      g.fillStyle = white.getStyle();
      g.fillRect(x + w / 2 - 80, y + 12, 160, 40);
      g.fillStyle = cor.getStyle();
      texto(g, "EMENDAS", x + w / 2, y + 33, 800, 28, 14, 150);
      const notas = [
        ["+ creche", pv("yellow-400")],
        ["UBS nova", mix(pv("red-200"), white, 0.2)],
        ["asfalto", pv("blue-200")],
        ["praça", mix(pv("green-500"), white, 0.5)],
        ["escola", pv("yellow-400")],
        ["iluminação", pv("blue-200")],
      ];
      notas.forEach(([t, c], i) => {
        const nx = x + 24 + (i % 3) * 120;
        const ny = y + 66 + Math.floor(i / 3) * 86;
        g.save();
        g.translate(nx + 48, ny + 36);
        g.rotate((rnd() - 0.5) * 0.18);
        g.fillStyle = c.getStyle();
        g.fillRect(-48, -36, 96, 72);
        g.fillStyle = pv("red-600").getStyle();
        g.beginPath();
        g.arc(0, -28, 6, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = pv("gray-800").getStyle();
        caberFonte(g, t, "italic 600", 20, 11, 86, font);
        g.fillText(t, 0, 8);
        g.restore();
      });
    }

    function desenharPlaquinha(g, r, t, c) {
      g.fillStyle = c.getStyle();
      g.fillRect(r.x, r.y, r.w, r.h);
      g.fillStyle = white.getStyle();
      texto(g, t, r.x + r.w / 2, r.y + r.h / 2 + 2, 700, 36, 14, r.w - 20);
    }

    function desenharRotulo(g) {
      const { x, y, w, h } = R.rotulo;
      g.fillStyle = C.pedra.getStyle();
      g.fillRect(x, y, w, h);
      g.fillStyle = mix(pv("yellow-400"), white, 0.35).getStyle();
      texto(g, "CICLO ORÇAMENTÁRIO   PPA → LDO → LOA", x + w / 2, y + h / 2 + 3, 700, 60, 24, w - 60);
    }

    desenhar();
    document.fonts?.ready.then(desenhar);

    // Plano com uv numa região do atlas (largura w, altura hh, centrado).
    const planoAtlas = (r, w, hh) => {
      const geo = new THREE.PlaneGeometry(w, hh);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, (r.x + uv.getX(i) * r.w) / AW, 1 - (r.y + (1 - uv.getY(i)) * r.h) / AH);
      }
      return geo;
    };
    // Ponto (px da região) → coordenada local do plano.
    const local = (r, w, hh, px, py) => [(px / r.w - 0.5) * w, (0.5 - py / r.h) * hh];

    const ZN = FACE.norte;
    const XL = FACE.leste;
    const vivo = new THREE.Group();
    vivo.name = "tema-orcamento";
    root.add(vivo);

    // ---- Pedestal com PPA, LDO e LOA ----------------------------------------
    const p0 = tileToWorld(PEDESTAL.x0, PEDESTAL.y0);
    const p1 = tileToWorld(PEDESTAL.x1, PEDESTAL.y1);
    const pcx = (p0.x + p1.x) / 2;
    const pcz = (p0.z + p1.z) / 2;
    {
      // Anel do ciclo no piso, com três setas (chevrons) girando no sentido
      // horário visto de cima.
      const rx = 1.95;
      const rz = 1.35;
      const anel = new THREE.RingGeometry(1, 1.07, lite ? 40 : 72).rotateX(-Math.PI / 2).scale(rx, 1, rz).translate(pcx, 0.014, pcz);
      lotes.add(MT.anel, anel, semSombra);
      for (const a of [Math.PI * 0.5, Math.PI * 1.17, Math.PI * 1.83]) {
        const px = pcx + Math.cos(a) * rx * 1.035;
        const pz = pcz + Math.sin(a) * rz * 1.035;
        // Tangente da elipse no sentido de `a` crescente.
        const tx = -Math.sin(a) * rx;
        const tz = Math.cos(a) * rz;
        const chev = new THREE.CylinderGeometry(0, 0.2, 0.004, 3).rotateY(Math.PI / 2 - Math.atan2(tz, tx));
        lotes.add(M.acento, chev.translate(px, 0.016, pz), semSombra);
      }
      // Pedestal em dois degraus, tampo claro e friso dourado.
      lotes.add(MT.pedra, caixa(pcx - 1.4, pcx + 1.4, 0, 0.08, pcz - 0.85, pcz + 0.85));
      lotes.add(MT.pedra, caixa(pcx - 1.25, pcx + 1.25, 0.08, 0.42, pcz - 0.68, pcz + 0.68));
      lotes.add(M.marmore, caixa(pcx - 1.3, pcx + 1.3, 0.42, 0.47, pcz - 0.73, pcz + 0.73));
      lotes.add(MT.ouro, caixa(pcx - 1.26, pcx + 1.26, 0.37, 0.39, pcz + 0.68, pcz + 0.685), semSombra);
      const rot = planoAtlas(R.rotulo, 2.3, 0.25).translate(pcx, 0.225, pcz + 0.683);
      lotes.add(matPapel, rot, semSombra);
    }
    // Volumes em pé, capa para o sul. Lombada à esquerda (x-), páginas à vista
    // no topo e à direita.
    const livros = [
      { r: R.ppa, mat: MT.ppa, x: pcx - 0.88, w: 0.76, h: 1.28, d: 0.3 },
      { r: R.ldo, mat: MT.ldo, x: pcx, w: 0.7, h: 1.1, d: 0.24 },
      { r: R.loa, mat: MT.loa, x: pcx + 0.88, w: 0.72, h: 1.18, d: 0.26 },
    ];
    const Y0 = 0.47;
    const zl = pcz - 0.12;
    for (const l of livros) {
      const { x, w, h, d } = l;
      const e = 0.025;
      lotes.add(l.mat, caixa(x - w / 2, x + w / 2, Y0, Y0 + h, zl + d / 2 - e, zl + d / 2)); // capa
      lotes.add(l.mat, caixa(x - w / 2, x + w / 2, Y0, Y0 + h, zl - d / 2, zl - d / 2 + e)); // contracapa
      lotes.add(l.mat, caixa(x - w / 2, x - w / 2 + e, Y0, Y0 + h, zl - d / 2, zl + d / 2)); // lombada
      lotes.add(MT.papel, caixa(x - w / 2 + e, x + w / 2 - 0.015, Y0 + 0.012, Y0 + h - 0.015, zl - d / 2 + e, zl + d / 2 - e));
      // Nervuras douradas na lombada.
      for (const k of [0.12, 0.88]) lotes.add(MT.ouro, caixa(x - w / 2 - 0.004, x - w / 2 + 0.002, Y0 + h * k - 0.012, Y0 + h * k + 0.012, zl - d / 2, zl + d / 2), semSombra);
      const capa = planoAtlas(l.r, w - 0.02, h - 0.02).translate(x, Y0 + h / 2, zl + d / 2 + 0.002);
      lotes.add(matPapel, capa, semSombra);
    }
    // Setas em arco: PPA → LDO → LOA, à frente dos topos.
    {
      const zs = zl + 0.32;
      const arco = (a, b) => {
        const ya = Y0 + a.h + 0.06;
        const yb = Y0 + b.h + 0.06;
        const xa = a.x + 0.06;
        const xb = b.x - 0.06;
        const topo = Math.max(ya, yb) + 0.3;
        const curva = new THREE.CubicBezierCurve3(
          new THREE.Vector3(xa, ya, zs),
          new THREE.Vector3(xa + 0.05, topo, zs),
          new THREE.Vector3(xb - 0.05, topo, zs),
          new THREE.Vector3(xb, yb + 0.1, zs),
        );
        lotes.add(MT.seta, new THREE.TubeGeometry(curva, lite ? 10 : 20, 0.028, lite ? 5 : 8, false));
        // Ponta: cone apontando ao longo da tangente final.
        const fim = curva.getPoint(1);
        const tan = curva.getTangent(1).normalize();
        const cone = new THREE.ConeGeometry(0.075, 0.18, lite ? 6 : 10).translate(0, 0.06, 0);
        cone.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan));
        lotes.add(MT.seta, cone.translate(fim.x, fim.y, fim.z));
        lotes.add(MT.seta, new THREE.SphereGeometry(0.045, 8, 6).translate(xa, ya, zs));
      };
      arco(livros[0], livros[1]);
      arco(livros[1], livros[2]);
    }

    // ---- Aparadores do elevador (calendário e tela) --------------------------
    const aparador = (tile) => {
      const p = tileToWorld(tile[0], tile[1]);
      lotes.add(M.madeira, caixa(p.x - 0.44, p.x + 0.44, 0.06, 0.62, ZN + 0.04, ZN + 0.46));
      lotes.add(M.escuro, caixa(p.x - 0.4, p.x + 0.4, 0, 0.06, ZN + 0.08, ZN + 0.42), semSombra);
      lotes.add(M.escuro, caixa(p.x - 0.002, p.x + 0.002, 0.12, 0.56, ZN + 0.46, ZN + 0.465), semSombra);
      return p;
    };
    {
      // Calendário: aparador com pastas do ciclo e um vasinho.
      const p = aparador(APARADOR_CAL);
      [MT.ppa, MT.ldo, MT.loa].forEach((m, i) => {
        const x = p.x - 0.32 + i * 0.1;
        lotes.add(m, caixa(x, x + 0.08, 0.62, 0.94, ZN + 0.1, ZN + 0.36));
        lotes.add(M.friso, caixa(x + 0.015, x + 0.065, 0.82, 0.88, ZN + 0.36, ZN + 0.362), semSombra);
      });
      lotes.add(M.vaso, new THREE.CylinderGeometry(0.08, 0.06, 0.14, 10).translate(p.x + 0.22, 0.69, ZN + 0.25));
      lotes.add(M.folha, new THREE.IcosahedronGeometry(0.12, 0).translate(p.x + 0.22, 0.84, ZN + 0.25));
      // Calendário de parede (entre a divisória e o portal do elevador).
      const cw = 2.5;
      const chh = 0.9;
      const cx = -1.12 - cw / 2;
      const cy = 1.68;
      lotes.add(M.caixilho, caixa(cx - cw / 2 - 0.03, cx + cw / 2 + 0.03, cy - chh / 2 - 0.03, cy + chh / 2 + 0.03, ZN, ZN + 0.025), semSombra);
      lotes.add(matPapel, planoAtlas(R.cal, cw, chh).translate(cx, cy, ZN + 0.027), semSombra);
    }
    let ponto = null;
    {
      // Tela da projeção sobre o outro aparador, com o cabo descendo.
      const p = aparador(APARADOR_TV);
      lotes.add(M.escuro, caixa(p.x - 0.2, p.x - 0.05, 0.62, 0.66, ZN + 0.15, ZN + 0.3));
      lotes.add(M.friso, caixa(p.x + 0.05, p.x + 0.35, 0.62, 0.64, ZN + 0.12, ZN + 0.34), semSombra);
      const tw = 2.25;
      const th = 1.0;
      const tx = 1.12 + tw / 2;
      const ty = 1.66;
      lotes.add(M.escuro, caixa(tx - tw / 2 - 0.05, tx + tw / 2 + 0.05, ty - th / 2 - 0.05, ty + th / 2 + 0.05, ZN, ZN + 0.06), semSombra);
      lotes.add(M.escuro, caixa(p.x - 0.015, p.x + 0.015, 0.62, ty - th / 2, ZN + 0.005, ZN + 0.02), semSombra);
      lotes.add(matTela, planoAtlas(R.proj, tw, th).translate(tx, ty, ZN + 0.062), semSombra);
      // Ponto que pulsa no "hoje" da linha (mesh próprio, animado).
      const [px, py] = pontoGraf(HOJE);
      const [lx, ly] = local(R.proj, tw, th, px, py);
      ponto = new THREE.Mesh(track(new THREE.CircleGeometry(0.04, 16)), track(new THREE.MeshBasicMaterial({ color: mix(pv("blue-300"), white, 0.4), transparent: true, opacity: 0.6, depthWrite: false })));
      ponto.position.set(tx + lx, ty + ly, ZN + 0.066);
      ponto.visible = !reducedMotion;
      vivo.add(ponto);
    }

    // ---- Painel "Execução orçamentária" --------------------------------------
    let barras = null;
    const pw = 1.8;
    const ph = 1.05;
    const painel = (() => {
      const a = tileToWorld(PAINEL[0][0], PAINEL[0][1]);
      const b = tileToWorld(PAINEL[1][0], PAINEL[1][1]);
      return { x: (a.x + b.x) / 2, z: a.z, y: 0.6 + ph / 2 };
    })();
    {
      const { x, z, y } = painel;
      // Pés em T, colunas e moldura.
      for (const s of [-1, 1]) {
        const px = x + s * (pw / 2 - 0.15);
        lotes.add(M.escuro, caixa(px - 0.05, px + 0.05, 0, 0.04, z - 0.32, z + 0.32));
        lotes.add(M.metal, caixa(px - 0.035, px + 0.035, 0.04, y - 0.1, z - 0.1, z - 0.03));
      }
      lotes.add(M.escuro, caixa(x - pw / 2 - 0.05, x + pw / 2 + 0.05, y - ph / 2 - 0.05, y + ph / 2 + 0.05, z - 0.03, z + 0.03));
      lotes.add(M.acento, caixa(x - pw / 2 - 0.05, x + pw / 2 + 0.05, y - ph / 2 - 0.09, y - ph / 2 - 0.05, z - 0.03, z + 0.03), semSombra);
      lotes.add(matTela, planoAtlas(R.exec, pw, ph).translate(x, y, z + 0.032), semSombra);
      // Barras: um só mesh, três quads com cor por vértice; a largura muda no
      // update (posições reescritas).
      const cores = [pv("blue-400"), pv("yellow-500"), pv("green-500")];
      const pos = new Float32Array(BARRAS.length * 4 * 3);
      const col = new Float32Array(BARRAS.length * 4 * 3);
      const idx = [];
      BARRAS.forEach((_, i) => {
        for (let k = 0; k < 4; k++) col.set([cores[i].r, cores[i].g, cores[i].b], (i * 4 + k) * 3);
        const o = i * 4;
        idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3);
      });
      const geo = track(new THREE.BufferGeometry());
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      geo.setIndex(idx);
      const mesh = new THREE.Mesh(geo, track(new THREE.MeshBasicMaterial({ vertexColors: true })));
      mesh.frustumCulled = false;
      vivo.add(mesh);
      // Trilho i em coordenadas do mundo.
      const trilhos = BARRAS.map((_, i) => {
        const ty0 = TRILHO.y0 + i * TRILHO.passo + 5;
        const [ax, ay] = local(R.exec, pw, ph, TRILHO.x + 5, ty0);
        const [bx, by] = local(R.exec, pw, ph, TRILHO.x + TRILHO.w - 5, ty0 + TRILHO.h - 10);
        return { x0: x + ax, x1: x + bx, yA: y + ay, yB: y + by };
      });
      const zb = z + 0.036;
      const ajustar = (fr) => {
        trilhos.forEach((t, i) => {
          const xe = t.x0 + (t.x1 - t.x0) * Math.max(fr[i], 0.002);
          pos.set([t.x0, t.yA, zb, xe, t.yA, zb, t.x0, t.yB, zb, xe, t.yB, zb], i * 12);
        });
        geo.attributes.position.needsUpdate = true;
      };
      barras = { ajustar };
      ajustar(BARRAS.map((b) => b.alvo));
    }

    // ---- Balança "Receita × Despesa" ------------------------------------------
    {
      const p = tileToWorld(BALANCA[0], BALANCA[1]);
      const { x, z } = p;
      // Mesinha-base com as plaquinhas na frente.
      lotes.add(M.madeira, caixa(x - 0.42, x + 0.42, 0, 0.38, z - 0.26, z + 0.26));
      lotes.add(MT.ouro, caixa(x - 0.44, x + 0.44, 0.38, 0.41, z - 0.28, z + 0.28));
      lotes.add(matPapel, planoAtlas(R.receita, 0.3, 0.1).translate(x - 0.2, 0.25, z + 0.262), semSombra);
      lotes.add(matPapel, planoAtlas(R.despesa, 0.3, 0.1).translate(x + 0.2, 0.25, z + 0.262), semSombra);
      // Coluna, fiel e travessão (nivelado: equilíbrio).
      const yT = 1.18;
      lotes.add(MT.ouro, new THREE.CylinderGeometry(0.12, 0.15, 0.06, seg).translate(x, 0.44, z));
      lotes.add(MT.ouro, new THREE.CylinderGeometry(0.025, 0.035, yT - 0.44, 8).translate(x, (yT + 0.44) / 2, z));
      lotes.add(MT.ouro, new THREE.ConeGeometry(0.04, 0.14, 8).translate(x, yT + 0.1, z));
      lotes.add(MT.ouro, new THREE.SphereGeometry(0.05, 10, 8).translate(x, yT, z));
      lotes.add(MT.ouro, caixa(x - 0.4, x + 0.4, yT - 0.018, yT + 0.018, z - 0.018, z + 0.018));
      for (const s of [-1, 1]) {
        const bx = x + s * 0.38;
        const yp = 0.7;
        // Correntes (três hastes finas) e prato.
        for (const [dx, dz] of [[-0.1, 0.06], [0.1, 0.06], [0, -0.1]]) {
          const a = new THREE.Vector3(bx, yT, z);
          const b = new THREE.Vector3(bx + dx, yp + 0.04, z + dz);
          const len = a.distanceTo(b);
          const haste = new THREE.CylinderGeometry(0.005, 0.005, len, 4);
          haste.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
          lotes.add(MT.ouro, haste.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2), semSombra);
        }
        lotes.add(MT.ouro, new THREE.CylinderGeometry(0.15, 0.1, 0.05, seg).translate(bx, yp + 0.025, z));
      }
      // Prato da receita: pilhas de moedas; da despesa: maços de notas.
      for (const [dx, dz, n] of [[-0.05, 0, 4], [0.05, 0.03, 3], [0, -0.06, 2]]) {
        for (let k = 0; k < n; k++) lotes.add(MT.moeda, new THREE.CylinderGeometry(0.04, 0.04, 0.018, 12).translate(x - 0.38 + dx, 0.76 + k * 0.02, z + dz));
      }
      for (let k = 0; k < 3; k++) lotes.add(MT.nota, caixa(x + 0.38 - 0.09, x + 0.38 + 0.09, 0.75 + k * 0.025, 0.772 + k * 0.025, z - 0.05 + (k % 2) * 0.02, z + 0.05 + (k % 2) * 0.02));
    }

    // ---- Pizza 3D das despesas numa mesinha redonda ---------------------------
    {
      const p = tileToWorld(PIZZA[0], PIZZA[1]);
      const { x, z } = p;
      lotes.add(M.escuro, new THREE.CylinderGeometry(0.26, 0.3, 0.04, seg).translate(x, 0.02, z));
      lotes.add(M.metal, new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8).translate(x, 0.29, z));
      lotes.add(M.madeiraClara, new THREE.CylinderGeometry(0.42, 0.42, 0.04, seg * 2).translate(x, 0.56, z));
      const fatias = [0.32, 0.24, 0.18, 0.15, 0.11];
      let a0 = 0.4;
      fatias.forEach((f, i) => {
        const ang = f * Math.PI * 2;
        const meio = a0 + ang / 2;
        // A maior fatia sai um pouco do lugar e fica mais alta (destaque).
        const sai = i === 0 ? 0.07 : 0;
        const hgt = 0.1 + (fatias.length - i) * 0.025;
        const geo = new THREE.CylinderGeometry(0.33, 0.33, hgt, Math.max(4, Math.round(seg * 2 * f)), 1, false, a0, ang);
        geo.translate(x + Math.sin(meio) * sai, 0.58 + hgt / 2, z + Math.cos(meio) * sai);
        lotes.add(MT.fatias[i], geo);
        a0 += ang;
      });
    }

    // ---- Cortiça das emendas na área comum leste -----------------------------
    {
      // No lugar do quadro branco (tiles y 6–7 da faixa leste).
      const a = tileToWorld(ctx.MW - 2, 6);
      const b = tileToWorld(ctx.MW - 2, 7);
      const zc = (a.z + b.z) / 2;
      const w = 1.5;
      const hh = 0.94;
      const y = 1.45;
      const g = new THREE.Group();
      g.position.set(XL, y, zc);
      g.rotation.y = -Math.PI / 2;
      g.updateMatrix();
      const pecas = [
        [M.caixilho, caixa(-w / 2 - 0.04, w / 2 + 0.04, -hh / 2 - 0.04, hh / 2 + 0.04, 0, 0.025)],
        [matPapel, planoAtlas(R.cortica, w, hh).translate(0, 0, 0.027)],
      ];
      for (const [m, geo] of pecas) lotes.add(m, geo.applyMatrix4(g.matrix), semSombra);
    }

    // ---- Animação ------------------------------------------------------------
    // Barras: o "ano" corre em 14 s (empenho na frente, pagamento por último),
    // segura 3 s cheio e recomeça. Sem animação com reduced motion.
    const CICLO = 17;
    return {
      update(t) {
        if (reducedMotion) return;
        const k = Math.min((t % CICLO) / 14, 1);
        barras?.ajustar(BARRAS.map((b) => b.alvo * THREE.MathUtils.smoothstep(k, b.atraso, 1)));
        if (ponto) {
          const s = 1 + 0.6 * (0.5 + 0.5 * Math.sin(t * 3));
          ponto.scale.setScalar(s);
          ponto.material.opacity = 0.75 - 0.35 * (s - 1);
        }
      },
      dispose() {
        vivo.removeFromParent();
      },
    };
  },
};

