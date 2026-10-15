// Tema do andar "financas" (2º · Finanças e Contabilidade) — ver ./index.js.
//
// O que caracteriza o setor:
// - área comum OESTE vira a tesouraria: balcão com guichê de vidro, máquina
//   de contar cédulas, maços de cédulas, pilhas de moedas e calculadora de
//   fita; mais ao sul, o cofre-forte com volante (a peça marcante);
// - área comum LESTE (lado da contabilidade): estante de livros-razão
//   encadernados;
// - duas ilhas no salão: a mesa de conciliação (extrato × livro-razão, lado
//   da Gestão Financeira) e a mesa da contabilidade (caixas da prestação de
//   contas, razão aberto, calculadora com a fita caindo até o chão);
// - ladeando o elevador, na parede norte: o telão do fluxo de caixa (barras
//   de entradas e saídas, anima de leve) e o quadro do Balanço Patrimonial;
// - plaquetas de patrimônio nos móveis (arquivos, mesas, estante, cofre).
//
// Desempenho: tudo o que é de cor lisa vai nos lotes do escritório (somam no
// mesmo draw call); papéis, rótulos, plaquetas, fitas e o quadro do balanço
// saem de UMA textura-atlas (um draw call); o telão é o único mesh à parte.

import * as THREE from "three";

// ---- Planta ---------------------------------------------------------------

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const bloco = (xs, ys) => xs.flatMap((x) => ys.map((y) => [x, y]));

const TEXTOS = {
  conciliacao: [
    "Conciliação bancária é conferir, item por item, o extrato do banco com os registros da contabilidade. Cada entrada e cada saída de dinheiro precisa aparecer dos dois lados, com o mesmo valor.",
    "Quando algo não bate (uma tarifa não lançada, um pagamento ainda não compensado, um depósito sem identificação), a diferença é investigada e explicada. Assim o saldo registrado é o saldo que existe de fato no banco.",
  ],
  balanco: [
    "O balanço patrimonial é uma fotografia do patrimônio numa data, em geral o fim do ano. De um lado fica o ATIVO: bens e direitos, como dinheiro em caixa e nos bancos, valores a receber, imóveis, veículos e equipamentos.",
    "Do outro lado ficam o PASSIVO (as obrigações, como fornecedores a pagar e dívidas) e o PATRIMÔNIO LÍQUIDO, a diferença entre os dois. Por isso a conta sempre fecha: Ativo = Passivo + Patrimônio Líquido.",
    "No setor público, o balanço segue as Normas Brasileiras de Contabilidade Aplicadas ao Setor Público (NBC TSP) e o Manual de Contabilidade Aplicada ao Setor Público (MCASP), do Tesouro Nacional.",
  ],
  prestacao: [
    "Quem administra dinheiro público tem o dever de prestar contas: está na Constituição. Todo ano o Prefeito apresenta as contas do município, com balanços e demonstrativos do que foi arrecadado e de como foi gasto.",
    "O Tribunal de Contas do Estado analisa essas contas e emite um parecer prévio; quem as julga é a Câmara Municipal. A Lei de Responsabilidade Fiscal ainda exige relatórios periódicos (RREO e RGF), abertos a qualquer cidadão.",
  ],
};

export const financas = {
  planejar(ctx) {
    const { plano, CX, MW } = ctx;
    const L = MW - 2;
    const comum = (seg) => !plano.zonas.some((z) => z.seg === seg);
    // Libera as áreas comuns para o tema (o leste mantém o sofá e a planta) e
    // tira os vasos altos do elevador (dão lugar ao telão e ao quadro).
    ctx.removerDecor((d) => d.tipo === "plantaAlta"
      || (comum("oeste") && d.seg === "oeste" && d.tipo !== "areaComum")
      || (comum("leste") && d.seg === "leste" && ["bebedouro", "impressora", "quadroBranco"].includes(d.tipo)));

    // Só monta a peça se todos os tiles dela estiverem livres.
    const pecas = {};
    const tentar = (nome, tiles) => {
      if (!tiles.every(([x, y]) => ctx.livre(x, y))) return false;
      for (const [x, y] of tiles) ctx.reservar(x, y);
      pecas[nome] = tiles;
      return true;
    };
    tentar("balcao", bloco([1], range(3, 5)));
    tentar("cofre", bloco([1, 2], [8, 9]));
    tentar("telao", [[CX - 1, 1]]);
    tentar("quadro", [[CX + 2, 1]]);
    tentar("estante", bloco([L], range(3, 5)));
    if (tentar("conciliacao", bloco(range(4, 6), [5, 6]))) {
      ctx.info("financas-conciliacao", pecas.conciliacao, "Conciliação bancária", TEXTOS.conciliacao);
    }
    if (tentar("contabilidade", bloco(range(MW - 7, MW - 5), [5, 6]))) {
      ctx.info("financas-prestacao", pecas.contabilidade, "Prestação de contas", TEXTOS.prestacao);
    }
    if (pecas.quadro) ctx.info("financas-balanco", pecas.quadro, "Balanço patrimonial", TEXTOS.balanco);
    plano.financas = pecas;

    const falhas = ctx.alcancavel();
    if (falhas.length) console.warn("Tema financas: inalcançável", falhas);
  },

  construir(ctx) {
    const { root, lotes, M, vidroMat, pal, track, lite, reducedMotion, cor, plano, FACE, tileToWorld, caixa, colocar, std, rand } = ctx;
    const pecas = plano.financas;
    if (!pecas) return null;
    const { pv, mix } = pal;
    const white = pv("white");
    const semSombra = { cast: false };
    const rad = lite ? 8 : 14;
    const { norte: ZN, oeste: XO, leste: XL } = FACE;

    const mat = (c, o) => track(std(c, o));
    const C = {
      aco: mat(mix(pv("gray-500"), pv("gray-600"), 0.45)),
      acoClaro: mat(mix(pv("gray-300"), pv("gray-400"), 0.35)),
      acoEscuro: mat(mix(pv("gray-700"), pv("gray-800"), 0.5)),
      ouro: mat(mix(pv("yellow-500"), pv("yellow-400"), 0.35)),
      ouroEscuro: mat(mix(pv("yellow-600"), pv("yellow-800"), 0.35)),
      papel: mat(mix(white, pv("gray-50"), 0.5)),
      papelVelho: mat(mix(pv("yellow-400"), white, 0.78)),
      kraft: mat(mix(pv("yellow-600"), pv("gray-300"), 0.5)),
      tampa: mat(mix(pv("yellow-800"), pv("gray-300"), 0.45)),
      capas: [mix(pv("red-800"), pv("red-900"), 0.4), pv("green-800"), pv("blue-900")].map((c) => mat(c)),
      visor: mat(mix(pv("green-600"), pv("gray-900"), 0.35)),
      cedula: mat(mix(pv("green-500"), pv("gray-100"), 0.5)),
      tecla: mat(mix(pv("gray-100"), pv("gray-200"), 0.5)),
      borracha: mat(mix(pv("gray-800"), pv("gray-900"), 0.5)),
      cofre: mat(mix(pv("green-800"), pv("gray-600"), 0.3)),
      cofreClaro: mat(mix(pv("green-700"), pv("gray-400"), 0.35)),
      tapete: mat(mix(pv("gray-500"), pv("gray-600"), 0.5)),
      cinta: mat(mix(pv("yellow-400"), white, 0.4)),
      vermelho: mat(pv("red-600")),
    };

    // ---- Atlas: tudo o que é impresso (um draw call) --------------------------
    const S = 1024;
    const R = {
      balanco: [0, 0, 512, 816],
      extrato: [512, 0, 256, 352],
      livro: [768, 0, 256, 176],
      rotulo: [768, 176, 256, 128],
      cedula: [768, 304, 256, 112],
      fita: [512, 352, 64, 448],
      plaqueta: [576, 416, 192, 64],
      tesouraria: [576, 480, 448, 80],
    };
    const atlasCanvas = ctx.makeCanvas(S, S);
    desenharAtlas(atlasCanvas.getContext("2d"), R, pal, cor, ctx.caberFonte);
    const atlasTex = track(ctx.canvasTexture(atlasCanvas));
    const atlasMat = track(new THREE.MeshStandardMaterial({ map: atlasTex, roughness: 0.8, side: THREE.DoubleSide }));
    // Plano (frente +z) com o recorte `reg` do atlas.
    const folha = (reg, w, h) => {
      const g = new THREE.PlaneGeometry(w, h);
      const [x0, y0, rw, rh] = R[reg];
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + 1 + uv.getX(i) * (rw - 2)) / S, 1 - (y0 + 1 + (1 - uv.getY(i)) * (rh - 2)) / S);
      return g;
    };
    // Papel deitado na mesa (topo do texto para o norte), girado `a` no plano.
    const deitada = (reg, w, h, x, y, z, a = 0) => {
      lotes.add(atlasMat, folha(reg, w, h).rotateX(-Math.PI / 2).rotateY(a).translate(x, y, z), semSombra);
    };
    // Fita de papel (calculadora) ao longo de uma curva; `lado`: largura.
    const fita = (pontos, lado, larg = 0.055) => {
      const ps = new THREE.CatmullRomCurve3(pontos).getSpacedPoints(lite ? 14 : 28);
      const n = ps.length - 1;
      const [x0, y0, rw, rh] = R.fita;
      const pos = [];
      const uv = [];
      const idx = [];
      ps.forEach((p, i) => {
        for (const s of [-1, 1]) {
          pos.push(p.x + (lado.x * s * larg) / 2, p.y + (lado.y * s * larg) / 2, p.z + (lado.z * s * larg) / 2);
          uv.push((x0 + (s < 0 ? 2 : rw - 2)) / S, 1 - (y0 + 2 + (i / n) * (rh - 4)) / S);
        }
        if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      lotes.add(atlasMat, g, semSombra);
    };
    // Plaqueta de patrimônio (etiqueta metálica), frente para `rot`.
    const plaqueta = (x, y, z, rot = 0, esc = 1) => {
      lotes.add(atlasMat, colocar(folha("plaqueta", 0.12 * esc, 0.04 * esc).translate(0, y, 0), x, z, rot), semSombra);
    };

    const cil = (r, h, n = rad) => new THREE.CylinderGeometry(r, r, h, n);
    // Cilindro com o eixo em z (peças da porta do cofre).
    const cilZ = (r, z0, z1, x, y, n = rad) => cil(r, z1 - z0, n).rotateX(Math.PI / 2).translate(x, y, (z0 + z1) / 2);

    // ---- Peças pequenas reaproveitadas ------------------------------------------
    // Pilha de moedas: discos alternando dois tons (o "serrilhado").
    const moedas = (x, y, z, n, r = 0.045) => {
      const h = 0.011;
      for (let i = 0; i < n; i++) {
        const dx = (rand() - 0.5) * 0.006;
        lotes.add(i % 3 === 2 ? C.ouroEscuro : C.ouro, cil(r, h, lite ? 8 : 12).translate(x + dx, y + h * (i + 0.5), z + dx), semSombra);
      }
    };
    // Maço de cédulas com cinta de papel.
    const maco = (x, y, z, a = 0) => {
      const g = (geo) => geo.rotateY(a).translate(x, y, z);
      lotes.add(C.cedula, g(caixa(-0.08, 0.08, 0, 0.035, -0.036, 0.036)), semSombra);
      lotes.add(C.cinta, g(caixa(-0.018, 0.018, -0.001, 0.037, -0.037, 0.037)), semSombra);
      lotes.add(atlasMat, folha("cedula", 0.16, 0.07).rotateX(-Math.PI / 2).translate(0, 0.0355, 0).rotateY(a).translate(x, y, z), semSombra);
    };
    // Pilha de extratos (folhas soltas) com o de cima impresso.
    const extratos = (x, y, z, n, a = 0, esc = 1) => {
      const w = 0.21 * esc;
      const d = 0.29 * esc;
      for (let i = 0; i < n; i++) {
        const ai = a + (rand() - 0.5) * 0.12;
        lotes.add(C.papel, caixa(-w / 2, w / 2, 0, 0.006, -d / 2, d / 2).rotateY(ai).translate(x, y + i * 0.006, z), semSombra);
      }
      deitada("extrato", w, d, x, y + n * 0.006 + 0.001, z, a);
    };
    // Livro-razão aberto sobre a mesa.
    const razaoAberto = (x, y, z, a = 0, esc = 1) => {
      const w = 0.62 * esc;
      const d = 0.42 * esc;
      lotes.add(C.capas[0], caixa(-w / 2 - 0.01, w / 2 + 0.01, 0, 0.012, -d / 2 - 0.01, d / 2 + 0.01).rotateY(a).translate(x, y, z), semSombra);
      lotes.add(C.papelVelho, caixa(-w / 2, w / 2, 0.012, 0.03, -d / 2, d / 2).rotateY(a).translate(x, y, z), semSombra);
      deitada("livro", w, d, x, y + 0.031, z, a);
    };
    // Calculadora de fita (operador ao norte; a fita sai pelas costas, ao sul).
    // Devolve o ponto de saída da fita.
    const calculadora = (x, y, z) => {
      lotes.add(C.tecla, caixa(x - 0.1, x + 0.1, y, y + 0.045, z - 0.13, z + 0.11));
      lotes.add(C.acoEscuro, caixa(x - 0.1, x + 0.1, y + 0.045, y + 0.07, z + 0.03, z + 0.11), semSombra);
      lotes.add(C.visor, caixa(x - 0.07, x + 0.07, y + 0.045, y + 0.05, z - 0.12, z - 0.09), semSombra);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          const kx = x - 0.06 + i * 0.04;
          const kz = z - 0.07 + j * 0.035;
          lotes.add(i === 3 ? C.vermelho : C.acoEscuro, caixa(kx - 0.013, kx + 0.013, y + 0.045, y + 0.055, kz - 0.012, kz + 0.012), semSombra);
        }
      }
      lotes.add(C.papel, cil(0.035, 0.1, 10).rotateZ(Math.PI / 2).translate(x, y + 0.1, z + 0.08), semSombra);
      return new THREE.Vector3(x, y + 0.135, z + 0.08);
    };
    // Fita que sai da calculadora, passa pela borda da mesa e cai até o chão,
    // enrolando no piso.
    const fitaCaindo = (s, zBorda, yMesa, alcance = 0.4) => {
      const x = s.x;
      fita([
        s,
        new THREE.Vector3(x, s.y + 0.06, s.z + 0.05),
        new THREE.Vector3(x, yMesa + 0.03, zBorda - 0.02),
        new THREE.Vector3(x, yMesa - 0.05, zBorda + 0.025),
        new THREE.Vector3(x + 0.01, yMesa * 0.45, zBorda + 0.04),
        new THREE.Vector3(x + 0.02, 0.06, zBorda + 0.07),
        new THREE.Vector3(x + 0.03, 0.006, zBorda + alcance * 0.55),
        new THREE.Vector3(x + 0.02, 0.05, zBorda + alcance * 0.9),
        new THREE.Vector3(x, 0.09, zBorda + alcance * 0.7),
      ], new THREE.Vector3(1, 0, 0));
    };
    // Cadeira (como as da sala de reunião); `sz` = lado do encosto.
    const cadeira = (x, z, sz) => {
      lotes.add(M.estofado, caixa(x - 0.2, x + 0.2, 0.36, 0.44, z - 0.18, z + 0.18));
      lotes.add(M.estofado, caixa(x - 0.2, x + 0.2, 0.44, 0.82, z + sz * 0.15 - 0.025, z + sz * 0.15 + 0.025));
      lotes.add(M.escuro, cil(0.025, 0.36, 6).translate(x, 0.18, z));
      lotes.add(M.escuro, cil(0.17, 0.03, rad).translate(x, 0.015, z));
    };
    // Mesa de trabalho da ilha (2,5 × 1,1), com plaqueta na borda sul.
    const mesa = (cx, cz) => {
      lotes.add(M.madeiraClara, caixa(cx - 1.25, cx + 1.25, 0.7, 0.75, cz - 0.55, cz + 0.55));
      for (const s of [-1, 1]) lotes.add(M.escuro, caixa(cx + s * 1.05 - 0.04, cx + s * 1.05 + 0.04, 0, 0.7, cz - 0.45, cz + 0.45));
      lotes.add(M.escuro, caixa(cx - 1.05, cx + 1.05, 0.5, 0.56, cz - 0.03, cz + 0.03));
      plaqueta(cx + 0.95, 0.725, cz + 0.553, 0, 0.8);
      for (const sx of [-0.6, 0.6]) cadeira(cx + sx, cz - 0.82, -1);
    };
    const centro = (tiles) => {
      const v = new THREE.Vector3();
      for (const [x, y] of tiles) v.add(tileToWorld(x, y));
      return v.multiplyScalar(1 / tiles.length);
    };

    // ---- Cofre-forte (tesouraria) ------------------------------------------------
    if (pecas.cofre) {
      const c = centro(pecas.cofre);
      const x0 = XO + 0.08;
      const x1 = c.x + 0.92;
      const cx = (x0 + x1) / 2;
      // Baixo e raso o bastante para não esconder o jogador que passa atrás
      // (tiles 1–2 × 7) na câmera do jogo.
      const z0 = c.z - 0.3;
      const zf = c.z + 0.72; // face da frente (sul)
      const topo = 1.5;
      // Corpo verde-escuro de cofre antigo, filetes dourados e base de borracha.
      lotes.add(C.borracha, caixa(x0 - 0.04, x1 + 0.04, 0, 0.08, z0 - 0.04, zf + 0.06));
      lotes.add(C.cofre, caixa(x0, x1, 0.08, topo, z0, zf));
      lotes.add(C.cofreClaro, caixa(x0 - 0.03, x1 + 0.03, topo, topo + 0.06, z0 - 0.03, zf + 0.03));
      for (const [a, b, y0, y1] of [[x0 + 0.06, x1 - 0.06, topo - 0.075, topo - 0.06], [x0 + 0.06, x1 - 0.06, 0.13, 0.145], [x0 + 0.06, x0 + 0.075, 0.13, topo - 0.06], [x1 - 0.075, x1 - 0.06, 0.13, topo - 0.06]]) {
        lotes.add(C.ouro, caixa(a, b, y0, y1, zf, zf + 0.006), semSombra);
      }
      // Filete dourado no tampo.
      const yt = topo + 0.06;
      for (const g of [
        caixa(x0 + 0.1, x1 - 0.1, yt, yt + 0.004, z0 + 0.1, z0 + 0.12),
        caixa(x0 + 0.1, x1 - 0.1, yt, yt + 0.004, zf - 0.12, zf - 0.1),
        caixa(x0 + 0.1, x0 + 0.12, yt, yt + 0.004, z0 + 0.1, zf - 0.1),
        caixa(x1 - 0.12, x1 - 0.1, yt, yt + 0.004, z0 + 0.1, zf - 0.1),
      ]) lotes.add(C.ouro, g, semSombra);
      // Porta redonda de aço: aro, porta, trancas, miolo e o volante de latão.
      const py = 0.72;
      const nPorta = lite ? 16 : 32;
      lotes.add(C.acoEscuro, cilZ(0.52, zf, zf + 0.03, cx, py, nPorta));
      lotes.add(C.acoClaro, cilZ(0.47, zf, zf + 0.1, cx, py, nPorta));
      lotes.add(C.aco, cilZ(0.31, zf + 0.1, zf + 0.115, cx, py, nPorta), semSombra);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        lotes.add(C.aco, cilZ(0.026, zf + 0.1, zf + 0.12, cx + Math.cos(a) * 0.4, py + Math.sin(a) * 0.4, 8), semSombra);
      }
      lotes.add(C.ouroEscuro, cilZ(0.09, zf + 0.1, zf + 0.24, cx, py, rad));
      lotes.add(C.ouro, cilZ(0.05, zf + 0.24, zf + 0.26, cx, py, rad), semSombra);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI + Math.PI / 6;
        lotes.add(C.ouroEscuro, caixa(-0.25, 0.25, -0.016, 0.016, -0.016, 0.016).rotateZ(a).translate(cx, py, zf + 0.2));
        for (const s of [-1, 1]) {
          lotes.add(C.ouro, new THREE.SphereGeometry(0.035, rad, Math.max(4, rad / 2)).translate(cx + s * Math.cos(a) * 0.26, py + s * Math.sin(a) * 0.26, zf + 0.2));
        }
      }
      // Dobradiças (à esquerda) e o segredo (disco numerado) à direita.
      for (const y of [0.44, 1.0]) lotes.add(C.acoEscuro, cil(0.04, 0.18, 10).translate(cx - 0.5, y, zf + 0.06));
      lotes.add(C.acoEscuro, cilZ(0.085, zf, zf + 0.04, x1 - 0.2, 1.08, rad), semSombra);
      lotes.add(C.acoClaro, cilZ(0.06, zf + 0.04, zf + 0.07, x1 - 0.2, 1.08, rad), semSombra);
      lotes.add(C.vermelho, caixa(x1 - 0.205, x1 - 0.195, 1.14, 1.17, zf + 0.04, zf + 0.075), semSombra);
      // Placa "TESOURARIA" no alto e plaqueta de patrimônio na lateral.
      lotes.add(atlasMat, folha("tesouraria", 0.9, 0.16).translate(cx, 1.33, zf + 0.008), semSombra);
      plaqueta(x1 + 0.001, 0.3, zf - 0.2, Math.PI / 2);
      // Tapete de borracha e faixa de atenção no piso, na frente da porta.
      lotes.add(C.tapete, caixa(x0 + 0.15, x1 - 0.15, 0, 0.012, zf + 0.12, zf + 0.55), semSombra);
      lotes.add(C.ouro, caixa(x0 + 0.15, x1 - 0.15, 0.012, 0.016, zf + 0.12, zf + 0.15), semSombra);
    }

    // ---- Balcão da tesouraria (parede oeste) ------------------------------------
    if (pecas.balcao) {
      const zs = pecas.balcao.map(([x, y]) => tileToWorld(x, y).z);
      const za = Math.min(...zs) - 0.45;
      const zb = Math.max(...zs) + 0.3;
      const xf = XO + 0.88; // frente (leste)
      const yt = 0.95;
      lotes.add(M.madeira, caixa(XO + 0.02, xf - 0.04, 0, yt - 0.04, za, zb));
      lotes.add(M.marmore, caixa(XO + 0.02, xf + 0.02, yt - 0.04, yt, za - 0.02, zb + 0.02));
      lotes.add(M.acento, caixa(xf - 0.04, xf - 0.02, 0.62, 0.7, za, zb), semSombra);
      lotes.add(M.escuro, caixa(xf - 0.06, xf - 0.02, 0, 0.08, za, zb), semSombra);
      plaqueta(xf - 0.035, 0.8, za + 0.35, Math.PI / 2, 0.8);
      // Guichê de vidro com montantes e a fresta embaixo.
      const xv = xf - 0.1;
      lotes.add(vidroMat, new THREE.PlaneGeometry(zb - za - 0.1, 0.5).rotateY(Math.PI / 2).translate(xv, yt + 0.13 + 0.25, (za + zb) / 2), { cast: false, receive: false });
      for (const z of [za + 0.03, (za + zb) / 2, zb - 0.03]) lotes.add(M.caixilho, caixa(xv - 0.02, xv + 0.02, yt, yt + 0.66, z - 0.02, z + 0.02), semSombra);
      lotes.add(M.caixilho, caixa(xv - 0.025, xv + 0.025, yt + 0.63, yt + 0.67, za + 0.01, zb - 0.01), semSombra);
      const xm = XO + 0.4; // meio do tampo atrás do vidro
      // Máquina de contar cédulas: corpo, funil com o maço, visor e bandeja.
      {
        const z = za + 0.42;
        lotes.add(C.tecla, caixa(xm - 0.17, xm + 0.17, yt, yt + 0.16, z - 0.17, z + 0.17));
        lotes.add(C.acoEscuro, caixa(xm - 0.15, xm + 0.15, yt + 0.16, yt + 0.19, z - 0.15, z + 0.0));
        lotes.add(C.cedula, caixa(xm - 0.12, xm + 0.12, yt + 0.16, yt + 0.22, z - 0.13, z - 0.03), semSombra);
        lotes.add(C.visor, caixa(xm - 0.1, xm + 0.1, yt + 0.06, yt + 0.12, z + 0.17, z + 0.175), semSombra);
        lotes.add(C.acoEscuro, caixa(xm - 0.13, xm + 0.13, yt, yt + 0.04, z + 0.17, z + 0.3), semSombra);
        lotes.add(atlasMat, folha("cedula", 0.22, 0.1).rotateX(-Math.PI / 2).translate(xm, yt + 0.045, z + 0.24), semSombra);
      }
      // Maços de cédulas, moedas, extratos e a calculadora de fita.
      maco(xm - 0.05, yt, za + 0.92, 0.2);
      maco(xm + 0.12, yt, za + 0.98, -0.15);
      maco(xm + 0.04, yt + 0.035, za + 0.95, 0.05);
      [6, 10, 14, 9, 4].forEach((n, i) => moedas(xm - 0.18 + (i % 3) * 0.11, yt, za + 1.3 + Math.floor(i / 3) * 0.11, n));
      extratos(xm, yt, za + 1.85, 7, 0.1);
      const s = calculadora(xm, yt, zb - 0.22);
      fitaCaindo(s, zb + 0.02, yt, 0.18);
    }

    // ---- Mesa de conciliação (extrato × livro-razão) ----------------------------
    if (pecas.conciliacao) {
      const c = centro(pecas.conciliacao);
      mesa(c.x, c.z);
      const y = 0.75;
      extratos(c.x - 0.85, y, c.z - 0.05, 4, -0.12, 1.45);
      extratos(c.x - 0.5, y, c.z + 0.12, 2, 0.18, 1.45);
      razaoAberto(c.x + 0.62, y, c.z - 0.02, 0.06, 1.1);
      // Lupa e lápis vermelho entre os dois (o "confere").
      lotes.add(C.acoEscuro, new THREE.TorusGeometry(0.07, 0.012, 6, rad).rotateX(Math.PI / 2).translate(c.x - 0.08, y + 0.012, c.z + 0.1), semSombra);
      lotes.add(C.acoEscuro, caixa(-0.012, 0.012, 0, 0.02, 0.07, 0.2).rotateY(0.6).translate(c.x - 0.08, y, c.z + 0.1), semSombra);
      lotes.add(C.vermelho, cil(0.008, 0.18, 6).rotateZ(Math.PI / 2).rotateY(0.4).translate(c.x + 0.15, y + 0.008, c.z + 0.28), semSombra);
      moedas(c.x + 0.05, y, c.z - 0.33, 8);
      moedas(c.x + 0.16, y, c.z - 0.36, 12);
      const s = calculadora(c.x - 0.1, y, c.z + 0.33);
      fitaCaindo(s, c.z + 0.56, y, 0.4);
    }

    // ---- Mesa da contabilidade (prestação de contas) ----------------------------
    if (pecas.contabilidade) {
      const c = centro(pecas.contabilidade);
      mesa(c.x, c.z);
      const y = 0.75;
      razaoAberto(c.x - 0.7, y, c.z, -0.05, 1.05);
      // Caixas-arquivo da prestação de contas, rótulo virado para o sul.
      const caixaArq = (x, yb, z) => {
        lotes.add(C.kraft, caixa(x - 0.17, x + 0.17, yb, yb + 0.27, z - 0.2, z + 0.2));
        lotes.add(C.tampa, caixa(x - 0.18, x + 0.18, yb + 0.27, yb + 0.3, z - 0.21, z + 0.21));
        lotes.add(atlasMat, folha("rotulo", 0.26, 0.13).translate(x, yb + 0.14, z + 0.202), semSombra);
      };
      caixaArq(c.x + 0.62, y, c.z - 0.05);
      caixaArq(c.x + 0.99, y, c.z - 0.05);
      caixaArq(c.x + 0.8, y + 0.3, c.z - 0.05);
      // Encadernados deitados e um carimbo.
      for (let i = 0; i < 3; i++) {
        const a = (rand() - 0.5) * 0.2;
        lotes.add(C.capas[(i + 1) % 3], caixa(-0.17, 0.17, 0, 0.035, -0.23, 0.23).rotateY(a).translate(c.x + 0.05, y + i * 0.04, c.z - 0.15));
        lotes.add(C.papelVelho, caixa(-0.16, 0.16, 0.006, 0.03, -0.225, 0.225).rotateY(a).translate(c.x + 0.055, y + i * 0.04, c.z - 0.15 + 0.008), semSombra);
      }
      lotes.add(M.madeira, cil(0.035, 0.08, 8).translate(c.x + 0.32, y + 0.04, c.z + 0.25), semSombra);
      lotes.add(C.borracha, caixa(c.x + 0.27, c.x + 0.37, y, y + 0.02, c.z + 0.2, c.z + 0.3), semSombra);
      const s = calculadora(c.x + 0.05, y, c.z + 0.32);
      fitaCaindo(s, c.z + 0.56, y, 0.45);
      extratos(c.x + 0.42, y, c.z + 0.3, 3, 0.25, 1.1);
    }

    // ---- Estante de livros-razão (parede leste) ---------------------------------
    if (pecas.estante) {
      const zs = pecas.estante.map(([x, y]) => tileToWorld(x, y).z);
      const za = Math.min(...zs) - 0.45;
      const zb = Math.max(...zs) + 0.45;
      const xa = XL - 0.45;
      const alt = 1.78;
      const lados = [
        caixa(xa, XL, 0, alt, za, za + 0.04),
        caixa(xa, XL, 0, alt, zb - 0.04, zb),
        caixa(xa, XL, 0, 0.08, za, zb),
        caixa(xa, XL, alt - 0.04, alt, za, zb),
        caixa(XL - 0.03, XL, 0, alt, za, zb),
      ];
      for (const g of lados) lotes.add(M.madeira, g);
      const prat = lite ? [0.08, 0.66, 1.24] : [0.08, 0.5, 0.92, 1.34];
      for (const yb of prat) {
        lotes.add(M.madeira, caixa(xa, XL, yb - 0.03, yb, za, zb), semSombra);
        let z = za + 0.06;
        while (z < zb - 0.12) {
          const w = 0.07 + rand() * 0.025;
          const h = 0.3 + rand() * 0.05;
          const k = Math.floor(rand() * 3);
          // Lombada virada para o salão (oeste), com duas faixas douradas.
          lotes.add(C.capas[k], caixa(xa + 0.04, XL - 0.05, yb, yb + h, z, z + w), semSombra);
          if (!lite) for (const fy of [0.06, h - 0.07]) lotes.add(C.ouro, caixa(xa + 0.035, xa + 0.04, yb + fy, yb + fy + 0.018, z + 0.008, z + w - 0.008), semSombra);
          z += w + 0.008;
        }
      }
      plaqueta((xa + XL) / 2, 1.25, zb + 0.001, 0, 0.9);
    }

    // ---- Parede norte: credenzas ao lado do elevador -------------------------------
    const credenza = (x) => {
      lotes.add(M.madeira, caixa(x - 0.42, x + 0.42, 0.06, 0.5, ZN + 0.02, ZN + 0.42));
      lotes.add(M.escuro, caixa(x - 0.4, x + 0.4, 0, 0.06, ZN + 0.04, ZN + 0.4), semSombra);
      lotes.add(M.escuro, caixa(-0.002, 0.002, 0.12, 0.44, ZN + 0.42, ZN + 0.425).translate(x, 0, 0), semSombra);
      plaqueta(x + 0.25, 0.42, ZN + 0.421, 0, 0.7);
    };

    // Quadro do Balanço Patrimonial.
    if (pecas.quadro) {
      const p = tileToWorld(...pecas.quadro[0]);
      credenza(p.x);
      // Livros-razão em pé com aparador e um deitado.
      for (let i = 0; i < 4; i++) {
        const x = p.x - 0.32 + i * 0.075;
        lotes.add(C.capas[i % 3], caixa(x, x + 0.065, 0.5, 0.82, ZN + 0.1, ZN + 0.36));
        lotes.add(C.ouro, caixa(x + 0.005, x + 0.06, 0.74, 0.76, ZN + 0.36, ZN + 0.362), semSombra);
      }
      lotes.add(C.acoEscuro, caixa(p.x - 0.03, p.x - 0.02, 0.5, 0.66, ZN + 0.12, ZN + 0.34), semSombra);
      lotes.add(C.capas[2], caixa(p.x + 0.05, p.x + 0.38, 0.5, 0.54, ZN + 0.1, ZN + 0.36));
      lotes.add(C.capas[0], caixa(p.x + 0.07, p.x + 0.36, 0.54, 0.58, ZN + 0.12, ZN + 0.35));
      const w = 0.84;
      const h = 1.34;
      const y = 1.5;
      const e = 0.03;
      lotes.add(atlasMat, folha("balanco", w, h).translate(p.x, y, ZN + 0.035), semSombra);
      for (const g of [
        caixa(p.x - w / 2 - e, p.x + w / 2 + e, y + h / 2, y + h / 2 + e, ZN, ZN + 0.04),
        caixa(p.x - w / 2 - e, p.x + w / 2 + e, y - h / 2 - e, y - h / 2, ZN, ZN + 0.04),
        caixa(p.x - w / 2 - e, p.x - w / 2, y - h / 2, y + h / 2, ZN, ZN + 0.04),
        caixa(p.x + w / 2, p.x + w / 2 + e, y - h / 2, y + h / 2, ZN, ZN + 0.04),
      ]) lotes.add(M.caixilho, g, semSombra);
    }

    // Telão do fluxo de caixa (mesh próprio: a textura anima).
    const vivo = new THREE.Group();
    vivo.name = "financas-vivo";
    root.add(vivo);
    let telao = null;
    if (pecas.telao) {
      const p = tileToWorld(...pecas.telao[0]);
      credenza(p.x);
      extratos(p.x - 0.2, 0.5, ZN + 0.22, 9, 0.08, 0.9);
      extratos(p.x + 0.17, 0.5, ZN + 0.24, 5, -0.15, 0.9);
      const w = 0.82;
      const h = 1.08;
      const y = 1.45;
      lotes.add(M.escuro, caixa(p.x - w / 2 - 0.04, p.x + w / 2 + 0.04, y - h / 2 - 0.05, y + h / 2 + 0.04, ZN, ZN + 0.05));
      lotes.add(C.acoEscuro, caixa(p.x - 0.06, p.x + 0.06, y - h / 2 - 0.12, y - h / 2 - 0.05, ZN, ZN + 0.02), semSombra);
      const canvas = ctx.makeCanvas(256, 336);
      const tex = track(ctx.canvasTexture(canvas));
      const m = new THREE.Mesh(
        track(new THREE.PlaneGeometry(w, h)),
        track(new THREE.MeshStandardMaterial({ map: tex, emissive: white, emissiveMap: tex, emissiveIntensity: lite ? 0.85 : 0.7, roughness: 0.4 })),
      );
      m.position.set(p.x, y, ZN + 0.052);
      vivo.add(m);
      telao = { canvas, tex, k: -1, f: -1 };
      desenharTelao(canvas, pal, 0, 1);
      tex.needsUpdate = true;
    }

    // ---- Plaquetas nos arquivos e na mesa de reunião --------------------------------
    for (const d of plano.decor) {
      const p = d.x === undefined ? null : tileToWorld(d.x, d.y);
      if (d.tipo === "arquivo") {
        const g = folha("plaqueta", 0.1, 0.034).translate(0.13, 0.67, -0.054);
        lotes.add(atlasMat, colocar(g, p.x, p.z, d.rot), semSombra);
      } else if (d.tipo === "reuniao") {
        plaqueta(p.x + 0.5 + 0.9, 0.705, p.z + 0.5 + 0.553, 0, 0.75);
      }
    }

    // Fonte carregada depois: redesenha o que tem texto.
    let vivoOk = true;
    document.fonts?.ready.then(() => {
      if (!vivoOk) return;
      desenharAtlas(atlasCanvas.getContext("2d"), R, pal, cor, ctx.caberFonte);
      atlasTex.needsUpdate = true;
      if (telao) {
        desenharTelao(telao.canvas, pal, Math.max(telao.k, 0), 1);
        telao.tex.needsUpdate = true;
      }
    });

    return {
      // Telão: a cada 1,8 s entra um mês novo; a barra dele cresce em 0,6 s.
      update(t) {
        if (!telao || reducedMotion) return;
        const P = 1.8;
        const k = Math.floor(t / P);
        const f = Math.min(1, (t - k * P) / 0.6);
        const fq = Math.round(f * 12) / 12;
        if (k === telao.k && fq === telao.f) return;
        telao.k = k;
        telao.f = fq;
        desenharTelao(telao.canvas, pal, k, fq);
        telao.tex.needsUpdate = true;
      },
      dispose() {
        vivoOk = false;
        vivo.removeFromParent();
      },
    };
  },
};

// ---- Desenhos (canvas) -------------------------------------------------------------

// Entradas e saídas do mês `i` (0..1), determinísticas e com cara de série.
const entrada = (i) => 0.55 + 0.3 * Math.abs(Math.sin(i * 1.37 + 0.4)) + 0.12 * Math.sin(i * 0.53);
const saida = (i) => 0.5 + 0.28 * Math.abs(Math.cos(i * 1.11 + 0.9)) + 0.1 * Math.sin(i * 0.71 + 1);

// Telão "Fluxo de caixa": barras verdes (entradas) para cima, vermelhas
// (saídas) para baixo e a linha do saldo acumulado. `k`: mês mais recente;
// `f`: quanto a barra dele já cresceu.
function desenharTelao(canvas, pal, k, f) {
  const g = canvas.getContext("2d");
  const { pv, mix } = pal;
  const W = canvas.width;
  const Hh = canvas.height;
  const css = (c) => c.getStyle();
  g.fillStyle = css(mix(pv("blue-950"), pv("gray-900"), 0.35));
  g.fillRect(0, 0, W, Hh);
  g.fillStyle = css(mix(pv("blue-900"), pv("gray-900"), 0.2));
  g.fillRect(0, 0, W, 64);
  g.fillStyle = css(pv("white"));
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `700 28px ${pal.font}`;
  g.fillText("FLUXO DE CAIXA", W / 2, 26);
  g.fillStyle = css(pv("blue-200"));
  g.font = `500 15px ${pal.font}`;
  g.fillText("entradas × saídas por mês", W / 2, 50);

  const zero = 176;
  const esc = 78;
  const n = 7;
  const larg = (W - 28) / n;
  // Grade leve.
  g.strokeStyle = css(mix(pv("blue-900"), pv("gray-600"), 0.4));
  g.lineWidth = 1;
  for (const y of [zero - esc, zero - esc / 2, zero + esc / 2, zero + esc]) {
    g.beginPath();
    g.moveTo(14, y);
    g.lineTo(W - 14, y);
    g.stroke();
  }
  let saldo = 0;
  const pts = [];
  for (let j = 0; j < n; j++) {
    const i = k - n + 1 + j;
    const cresce = j === n - 1 ? 1 - (1 - f) ** 2 : 1;
    const e = entrada(i) * cresce;
    const s = saida(i) * cresce;
    const x = 14 + j * larg;
    g.fillStyle = css(pv("green-500"));
    g.fillRect(x + 4, zero - e * esc, larg / 2 - 5, e * esc);
    g.fillStyle = css(pv("red-500"));
    g.fillRect(x + larg / 2 + 1, zero, larg / 2 - 5, s * esc);
    saldo += e - s;
    pts.push([x + larg / 2, zero - 20 - saldo * 60]);
  }
  g.strokeStyle = css(pv("gray-300"));
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(14, zero);
  g.lineTo(W - 14, zero);
  g.stroke();
  // Saldo acumulado.
  g.strokeStyle = css(pv("yellow-400"));
  g.lineWidth = 4;
  g.beginPath();
  pts.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
  g.fillStyle = css(pv("yellow-400"));
  const [ux, uy] = pts[pts.length - 1];
  g.beginPath();
  g.arc(ux, uy, 6, 0, Math.PI * 2);
  g.fill();
  // Legenda.
  g.font = `600 16px ${pal.font}`;
  g.textAlign = "left";
  const leg = [["Entradas", pv("green-500")], ["Saídas", pv("red-500")], ["Saldo", pv("yellow-400")]];
  leg.forEach(([t, c], j) => {
    const y = j === 2 ? 286 : 286 + j * 26;
    const x = j === 2 ? 150 : 22;
    g.fillStyle = css(c);
    g.fillRect(x, y - 7, 14, 14);
    g.fillStyle = css(pv("gray-100"));
    g.fillText(t, x + 22, y + 1);
  });
}

// Atlas de impressos do andar (ver R em construir).
function desenharAtlas(g, R, pal, cor, caberFonte) {
  const { pv, mix } = pal;
  const css = (c) => c.getStyle();
  const font = pal.font;
  const white = pv("white");
  let semente = 2205;
  const rnd = () => {
    semente = (semente * 16807) % 2147483647;
    return semente / 2147483647;
  };
  const em = ([x0, y0, w, h], fn) => {
    g.save();
    g.beginPath();
    g.rect(x0, y0, w, h);
    g.clip();
    g.translate(x0, y0);
    fn(w, h);
    g.restore();
  };
  const texto = (t, x, y, peso, tam, c, alinhar = "center") => {
    g.font = `${peso} ${tam}px ${font}`;
    g.fillStyle = css(c);
    g.textAlign = alinhar;
    g.textBaseline = "middle";
    g.fillText(t, x, y);
  };
  const certo = (x, y, s, c) => {
    g.strokeStyle = css(c);
    g.lineWidth = Math.max(2, s / 4);
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x - s / 2, y);
    g.lineTo(x - s / 8, y + s / 2.5);
    g.lineTo(x + s / 2, y - s / 2);
    g.stroke();
  };
  g.clearRect(0, 0, g.canvas.width, g.canvas.height);

  // Quadro do Balanço Patrimonial (razonete em T: Ativo | Passivo + PL).
  em(R.balanco, (w, h) => {
    g.fillStyle = css(mix(white, pv("gray-50"), 0.6));
    g.fillRect(0, 0, w, h);
    g.fillStyle = css(cor);
    g.fillRect(0, 0, w, 156);
    g.fillStyle = css(white);
    g.textAlign = "center";
    g.textBaseline = "middle";
    caberFonte(g, "PATRIMONIAL", 700, 72, 30, w - 48, font);
    const tam = parseInt(g.font.match(/(\d+)px/)[1], 10);
    texto("BALANÇO", w / 2, 50, 700, tam, white);
    texto("PATRIMONIAL", w / 2, 112, 700, tam, white);
    const topo = 190;
    const base = 642;
    const meio = w / 2;
    texto("ATIVO", w / 4, topo + 22, 700, 36, pv("gray-900"));
    texto("PASSIVO", (3 * w) / 4, topo + 22, 700, 36, pv("gray-900"));
    g.fillStyle = css(pv("gray-700"));
    g.fillRect(22, topo + 48, w - 44, 7);
    g.fillRect(meio - 3.5, topo + 4, 7, base - topo);
    const y0 = topo + 66;
    const y1 = base - 8;
    const hPas = (y1 - y0) * 0.58;
    const caixaCor = (x, y, bw, bh, c, linhas) => {
      g.fillStyle = css(c);
      g.fillRect(x, y, bw, bh);
      linhas.forEach((l, i) => texto(l, x + bw / 2, y + 30 + i * 34, i === 0 ? 700 : 500, i === 0 ? 26 : 21, white));
    };
    caixaCor(26, y0, meio - 40, y1 - y0, pv("blue-600"), ["Bens e", "direitos", "", "Caixa e", "bancos", "Créditos", "Imóveis", "Veículos"]);
    caixaCor(meio + 14, y0, meio - 40, hPas - 6, pv("red-600"), ["Obrigações", "", "Fornecedores", "Dívidas"]);
    caixaCor(meio + 14, y0 + hPas + 6, meio - 40, y1 - y0 - hPas - 6, pv("green-700"), ["Patrimônio", "líquido"]);
    // Fórmula embaixo.
    g.fillStyle = css(pv("gray-100"));
    g.fillRect(0, base + 14, w, h - base - 14);
    g.fillStyle = css(pv("gray-900"));
    g.textAlign = "center";
    g.textBaseline = "middle";
    caberFonte(g, "ATIVO = PASSIVO + PL", 800, 54, 26, w - 40, font);
    g.fillText("ATIVO = PASSIVO + PL", w / 2, base + 78);
    texto("a conta sempre fecha", w / 2, base + 132, 500, 26, pv("gray-600"));
  });

  // Extrato bancário (genérico): lançamentos com o "confere" da conciliação;
  // um deles ainda pendente (círculo vermelho).
  em(R.extrato, (w, h) => {
    g.fillStyle = css(white);
    g.fillRect(0, 0, w, h);
    g.fillStyle = css(pv("gray-200"));
    g.fillRect(0, 0, w, 54);
    texto("EXTRATO", 14, 22, 800, 24, pv("gray-800"), "left");
    texto("conta corrente", 14, 42, 500, 14, pv("gray-600"), "left");
    for (let i = 0; i < 11; i++) {
      const y = 72 + i * 23;
      g.fillStyle = css(pv("gray-400"));
      g.fillRect(12, y - 3, 30, 6);
      g.fillStyle = css(pv("gray-300"));
      g.fillRect(50, y - 3, 50 + rnd() * 50, 6);
      const deb = rnd() < 0.45;
      const v = `${deb ? "-" : ""}${Math.floor(100 + rnd() * 8900)},${String(Math.floor(rnd() * 99)).padStart(2, "0")}`;
      texto(v, 214, y, 600, 14, deb ? pv("red-600") : pv("gray-800"), "right");
      if (i === 6) {
        g.strokeStyle = css(pv("red-600"));
        g.lineWidth = 3;
        g.beginPath();
        g.arc(234, y, 9, 0, Math.PI * 2);
        g.stroke();
      } else certo(234, y, 14, pv("green-600"));
    }
    g.fillStyle = css(pv("gray-700"));
    g.fillRect(12, h - 38, w - 24, 2);
    texto("SALDO", 14, h - 20, 800, 16, pv("gray-800"), "left");
    texto("48.215,07", 214, h - 20, 800, 16, pv("gray-900"), "right");
  });

  // Livro-razão aberto: duas páginas pautadas, colunas Débito | Crédito.
  em(R.livro, (w, h) => {
    g.fillStyle = css(mix(pv("yellow-400"), white, 0.82));
    g.fillRect(0, 0, w, h);
    for (const px of [0, w / 2]) {
      texto(px ? "DÉBITO · CRÉDITO" : "RAZÃO", px + 12, 14, 800, 12, pv("blue-900"), "left");
      g.fillStyle = css(pv("blue-200"));
      for (let y = 30; y < h - 6; y += 11) g.fillRect(px + 6, y, w / 2 - 12, 1);
      g.fillStyle = css(pv("red-400"));
      for (const cx of [26, 82, 104]) g.fillRect(px + cx, 24, 1.5, h - 30);
      g.fillStyle = css(pv("blue-800"));
      for (let y = 36; y < h - 10; y += 11) {
        g.fillRect(px + 30, y - 4, 20 + rnd() * 40, 2);
        g.fillRect(px + 86 + rnd() * 6, y - 4, 10 + rnd() * 8, 2);
      }
      certo(px + 116, h - 18, 10, pv("green-600"));
    }
    const sombra = g.createLinearGradient(w / 2 - 14, 0, w / 2 + 14, 0);
    sombra.addColorStop(0, css(mix(pv("yellow-400"), white, 0.82)));
    sombra.addColorStop(0.5, css(mix(pv("yellow-800"), pv("gray-400"), 0.5)));
    sombra.addColorStop(1, css(mix(pv("yellow-400"), white, 0.82)));
    g.fillStyle = sombra;
    g.fillRect(w / 2 - 14, 0, 28, h);
  });

  // Rótulo da caixa-arquivo.
  em(R.rotulo, (w, h) => {
    g.fillStyle = css(white);
    g.fillRect(0, 0, w, h);
    g.strokeStyle = css(pv("gray-700"));
    g.lineWidth = 4;
    g.strokeRect(6, 6, w - 12, h - 12);
    texto("PRESTAÇÃO", w / 2, 38, 800, 30, pv("gray-900"));
    texto("DE CONTAS", w / 2, 72, 800, 30, pv("gray-900"));
    g.fillStyle = css(cor);
    g.fillRect(20, 96, w - 40, 14);
  });

  // Cédula estilizada (sem desenho de pessoa).
  em(R.cedula, (w, h) => {
    g.fillStyle = css(mix(pv("green-500"), pv("gray-100"), 0.5));
    g.fillRect(0, 0, w, h);
    g.strokeStyle = css(pv("green-700"));
    g.lineWidth = 3;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      for (let x = 10; x < w - 10; x += 4) g.lineTo(x, h / 2 + Math.sin(x / 9 + k) * (10 + k * 6));
      g.stroke();
    }
    g.fillStyle = css(mix(pv("green-500"), white, 0.6));
    g.beginPath();
    g.arc(56, h / 2, 32, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = css(pv("green-700"));
    g.stroke();
    texto("100", w - 54, h / 2 + 2, 800, 44, pv("green-800"));
  });

  // Fita da calculadora: parcelas e totais.
  em(R.fita, (w, h) => {
    g.fillStyle = css(mix(white, pv("yellow-400"), 0.08));
    g.fillRect(0, 0, w, h);
    for (let y = 16; y < h; y += 17) {
      const total = rnd() < 0.18;
      const v = `${Math.floor(rnd() * 990)},${String(Math.floor(rnd() * 99)).padStart(2, "0")}${total ? " *" : " +"}`;
      texto(v, w - 5, y, total ? 800 : 500, 12, total ? pv("red-600") : pv("gray-800"), "right");
    }
  });

  // Plaqueta de patrimônio (etiqueta metálica com código de barras).
  em(R.plaqueta, (w, h) => {
    const met = g.createLinearGradient(0, 0, 0, h);
    met.addColorStop(0, css(pv("gray-200")));
    met.addColorStop(1, css(pv("gray-400")));
    g.fillStyle = met;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = css(pv("gray-600"));
    g.lineWidth = 3;
    g.strokeRect(2, 2, w - 4, h - 4);
    texto("PATRIMÔNIO", 10, 20, 800, 15, pv("gray-800"), "left");
    texto("Nº 004512", 10, 44, 800, 19, pv("gray-900"), "left");
    g.fillStyle = css(pv("gray-900"));
    for (let x = 122; x < w - 10; x += 2 + Math.floor(rnd() * 3)) g.fillRect(x, 10, rnd() < 0.5 ? 1.5 : 3, h - 20);
  });

  // Placa "TESOURARIA" do cofre.
  em(R.tesouraria, (w, h) => {
    g.fillStyle = css(pv("gray-800"));
    g.fillRect(0, 0, w, h);
    g.strokeStyle = css(pv("yellow-500"));
    g.lineWidth = 4;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = css(pv("yellow-500"));
    g.textAlign = "center";
    g.textBaseline = "middle";
    caberFonte(g, "TESOURARIA", 800, 50, 20, w - 50, font);
    g.fillText("TESOURARIA", w / 2, h / 2 + 2);
  });
}
