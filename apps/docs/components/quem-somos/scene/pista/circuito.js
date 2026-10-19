// Pista de bicicleta da Vila SEMEC: o traçado em grade (sem three.js).
//
// Contrato puro (só números), usado por index.js (o 3D) e testável no Node:
// a linha central do circuito é uma Catmull-Rom fechada pelos pontos de
// CONTROLE (coordenadas de tile, contínuas: o centro do tile (x, y) é o
// ponto (x, y)). É asfalto andável todo tile cujo centro fica a até
// RAIO_PISTA da linha central (2 a 3 tiles de largura, conforme a linha
// passe no centro ou na borda dos tiles). Fora disso é grama: não andável,
// para ninguém cortar caminho. O box (área de partida, ao sul da reta) é
// andável e só encosta na pista por uma abertura no muro dos boxes — uma
// entrada só, então não vira atalho.
//
// Sentido da corrida: na reta principal (sul) para o leste (→), sobe pela
// direita, faz o grampo do nordeste, mergulha no "U" do meio, segue pelo
// alto para o oeste e desce o "S" do lado esquerdo até a reta de novo
// (anti-horário na tela).
//
// Mapa real (gerado de montarCircuito; colunas x = 3…83, linhas y = 7…54):
//   # asfalto andável      0–5 checkpoints (tiles do corte; 5 = chegada)
//   L largada (→)          : box andável, X = chegada da Vila (olhando ↑)
//   P portão (saída)       = muro dos boxes (a abertura é andável)
//   G garagem, B bancada, R placa das regras, A arquibancada (bloqueados)
//
// x →
//    3    8    13   18   23   28   33   38   43   48   53   58   63   68   73   78   83
//    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
//  7 ..............#####3######
//  8 ...........########3########
//  9 ..........######.......######
// 10 .........####.............####
// 11 .........###................###
// 12 ........###..................###............................#1##
// 13 ........##...................###.........................####1####
// 14 .......###....................###......................######1######
// 15 .......##.....................###.....................#####......#####
// 16 .......##......................##....................####..........####
// 17 .......##......................###...................###............####
// 18 .......###.....................###..................###..............###
// 19 ........###.....................##..................###...............###
// 20 .........###....................##..................##.................##
// 21 ..........##....................##..................##.................###
// 22 ..........###...................##.................###..................##
// 23 ..........###...................##.................###..................###
// 24 ..........##....................##.................###..................###
// 25 .........###....................##................###....................##
// 26 ........###.....................###...............###....................###
// 27 .......####.....................###..............###.....................###
// 28 .......###.......................###.............###......................##
// 29 ......###.........................###...........###.......................##
// 30 ......44..........................####.........###........................###
// 31 .....###...........................####......####.........................###
// 32 .....##.............................#######2####..........................###
// 33 ....###...............................#####2##............................000
// 34 ....##...................................#................................###
// 35 ....##....................................................................###
// 36 ...###....................................................................##
// 37 ...###....................................................................##
// 38 ...###...................................................................###
// 39 ...###......AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA..............................###
// 40 ....##......AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA..............................##
// 41 ....###.....AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.............................###
// 42 ....###.....AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA............................###
// 43 .....###....AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...........................###
// 44 ......####..........................................................####
// 45 .......#####.....................................................######
// 46 ........###########...###5###########################################
// 47 ..........###############5#L#######################################
// 48 .............############5####################################
// 49 ........................========:::========
// 50 ........................BB:R::::::::::GGGGG
// 51 ........................::::::::::::::GGGGG
// 52 ........................:::::::::::::::::::
// 53 ........................:::::::::X:::::::::
// 54 .................................PP
//
// Comprimento: ~220 tiles de linha central por volta. Na grade (4 vizinhos,
// os trechos diagonais viram "escadinha") o caminho mais curto da largada
// passando pelos checkpoints na ordem dá 254 tiles na 1ª volta e 256 na 2ª
// (medirVolta). De bicicleta em direção livre (máx. ~9,1 tiles/s, curvas
// pelo corredor contínuo) dá ~23,5 s por volta, ~47 s nas 2.

export const MW = 86;
export const MH = 56;

// Meia-largura do asfalto andável (tiles) e do asfalto desenhado (o desenho
// passa um pouco da área andável para cobrir a borda dos tiles da beirada).
export const RAIO_PISTA = 1.25;
export const RAIO_ASFALTO = 1.7;
// Zebra (meio-fio vermelho e branco) logo depois do asfalto desenhado.
export const LARGURA_ZEBRA = 0.38;
// De bicicleta, o centro do ciclista vai até RAIO_ASFALTO + isto da linha
// central (as rodas pegam um pouco da zebra).
export const CORREDOR_FOLGA = 0.1;

// Pontos de controle da linha central (ordem = sentido da corrida).
export const CONTROLE = [
  [17.5, 47], // reta principal (sul), da esquerda para a direita
  [36, 47],
  [57, 47],
  [68.5, 46], // curva 1: grande, para a esquerda, subindo
  [75.5, 41.5],
  [78, 33.5], // lado direito, subindo
  [76.5, 24.5],
  [72, 16.5], // grampo do nordeste
  [64, 13],
  [57, 16.5],
  [54.5, 24.5], // "U" do meio: mergulha para o sul e volta
  [50, 31],
  [42, 32.5],
  [36, 26.5],
  [35, 17.5],
  [30.5, 9.5], // alto, para o oeste
  [22, 7.5],
  [14, 9.5],
  [10.5, 16.5], // "S" do lado esquerdo, descendo
  [14, 22.5],
  [9.5, 30],
  [7, 37],
  [9.5, 43.5], // última curva, de volta para a reta
];

// Checkpoints (na ordem da corrida): o ponto da linha central mais perto de
// `perto`; `eixo` diz como o corte atravessa a pista ("col": uma coluna de
// tiles, para trechos que andam no eixo x; "lin": uma linha, para trechos no
// eixo y). O ÚLTIMO é a linha de chegada/largada, sob o pórtico.
const CHECKPOINTS = [
  { id: "subida", perto: [78, 33], eixo: "lin" },
  { id: "grampo", perto: [64, 13], eixo: "col" },
  { id: "vale", perto: [46, 32.5], eixo: "col" },
  { id: "alto", perto: [22, 7.5], eixo: "col" },
  { id: "esse", perto: [9.5, 30], eixo: "lin" },
  { id: "chegada", perto: [28, 47], eixo: "col" },
];

// Largada: 2 tiles depois da linha de chegada, olhando o sentido da reta. Da
// largada até cruzar a chegada de novo (passando por todos) é uma volta.
export const LARGADA = { x: 30, y: 47, dir: "right" };

// Box de partida (andável), ao sul da reta: muro na linha MURO_Y com uma
// abertura, área retangular e o portão na borda sul (volta para a Vila).
export const MURO_Y = 49;
export const ABERTURA = [35, 37]; // x da abertura no muro (inclusivo)
export const BOX = { x0: 27, x1: 45, y0: 50, y1: 53 };
// Garagem (bloqueada) no fundo leste do box; mesa de ferramentas a oeste.
export const GARAGEM = { x0: 41, x1: 45, y0: 50, y1: 51 };
export const BANCADA = { x0: 27, x1: 28, y0: 50, y1: 50 };
// Placa das regras (bloqueada, ensina com Espaço: infoEm).
export const PLACA_REGRAS = { x: 30, y: 50 };
export const PORTAO = [[36, 54], [37, 54]];
// Chegando da Vila: no box, de frente para a pista (o portão fica atrás).
export const CHEGADA = { x: 36, y: 53, dir: "up" };

// Arquibancada (fora da pista, no gramado do lado de dentro da reta).
export const ARQUIBANCADA = { x0: 15, x1: 45, y0: 39, y1: 43 };

const chave = (x, y) => `${x},${y}`;

// Catmull-Rom uniforme fechada.
function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
}

// Amostra a linha central a cada ~`passo` tile: [{ x, y, tx, ty, s }], com
// tangente unitária (tx, ty) e o comprimento acumulado s.
export function amostrarLinha(passo = 0.2) {
  const n = CONTROLE.length;
  const brutos = [];
  for (let i = 0; i < n; i++) {
    const p = [CONTROLE[(i - 1 + n) % n], CONTROLE[i], CONTROLE[(i + 1) % n], CONTROLE[(i + 2) % n]];
    for (let k = 0; k < 60; k++) brutos.push(catmull(...p, k / 60));
  }
  // Reamostra por comprimento (pontos igualmente espaçados).
  const acum = [0];
  for (let i = 1; i <= brutos.length; i++) {
    const a = brutos[i - 1];
    const b = brutos[i % brutos.length];
    acum.push(acum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = acum[brutos.length];
  const m = Math.round(total / passo);
  const pts = [];
  let j = 0;
  for (let k = 0; k < m; k++) {
    const s = (k / m) * total;
    while (acum[j + 1] < s) j++;
    const a = brutos[j];
    const b = brutos[(j + 1) % brutos.length];
    const u = (s - acum[j]) / (acum[j + 1] - acum[j] || 1);
    pts.push({ x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, s });
  }
  for (let k = 0; k < m; k++) {
    const a = pts[(k - 1 + m) % m];
    const b = pts[(k + 1) % m];
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    pts[k].tx = (b.x - a.x) / l;
    pts[k].ty = (b.y - a.y) / l;
  }
  return { pts, total };
}

// Monta a grade: asfalto, box, checkpoints e a interface lógica da pista.
export function montarCircuito() {
  const { pts, total } = amostrarLinha(0.2);
  // Distância de cada centro de tile à linha central (grade grossa: só
  // perto da pista interessa; o resto fica Infinity).
  const dist = new Float32Array(MW * MH).fill(Infinity);
  const idx = new Int32Array(MW * MH).fill(-1);
  const alcance = RAIO_ASFALTO + LARGURA_ZEBRA + 3;
  pts.forEach((p, k) => {
    for (let y = Math.max(0, Math.floor(p.y - alcance)); y <= Math.min(MH - 1, Math.ceil(p.y + alcance)); y++) {
      for (let x = Math.max(0, Math.floor(p.x - alcance)); x <= Math.min(MW - 1, Math.ceil(p.x + alcance)); x++) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < dist[y * MW + x]) {
          dist[y * MW + x] = d;
          idx[y * MW + x] = k;
        }
      }
    }
  });
  const pista = new Set();
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (dist[y * MW + x] <= RAIO_PISTA) pista.add(chave(x, y));

  // Box: retângulo andável menos garagem, bancada e placa; abertura no muro.
  const box = new Set();
  const dentroDe = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
  for (let y = BOX.y0; y <= BOX.y1; y++) {
    for (let x = BOX.x0; x <= BOX.x1; x++) {
      if (dentroDe(GARAGEM, x, y) || dentroDe(BANCADA, x, y)) continue;
      if (x === PLACA_REGRAS.x && y === PLACA_REGRAS.y) continue;
      box.add(chave(x, y));
    }
  }
  for (let x = ABERTURA[0]; x <= ABERTURA[1]; x++) box.add(chave(x, MURO_Y));

  const andavel = new Set([...pista, ...box]);
  const passable = (x, y) => andavel.has(chave(x, y));

  // Ponto contínuo (px, py) → distância à linha central e normal unitária
  // (da linha para o ponto), ou null longe da pista. A bicicleta colide com
  // este corredor (o asfalto desenhado), não com a escadinha dos tiles.
  const n = pts.length;
  const corredor = (px, py) => {
    const rx = Math.round(px);
    const ry = Math.round(py);
    if (rx < 0 || ry < 0 || rx >= MW || ry >= MH) return null;
    const k0 = idx[ry * MW + rx];
    if (k0 < 0) return null;
    let d2 = Infinity;
    let cx = 0;
    let cy = 0;
    for (let d = -20; d < 20; d++) {
      const a = pts[(k0 + d + n) % n];
      const b = pts[(k0 + d + 1 + n) % n];
      const ex = b.x - a.x;
      const ey = b.y - a.y;
      const u = Math.max(0, Math.min(1, ((px - a.x) * ex + (py - a.y) * ey) / (ex * ex + ey * ey || 1)));
      const qx = a.x + ex * u;
      const qy = a.y + ey * u;
      const e2 = (px - qx) ** 2 + (py - qy) ** 2;
      if (e2 < d2) {
        d2 = e2;
        cx = qx;
        cy = qy;
      }
    }
    const dist = Math.sqrt(d2);
    return { d: dist, nx: dist > 1e-9 ? (px - cx) / dist : 0, ny: dist > 1e-9 ? (py - cy) / dist : 0 };
  };
  // Tiles fora da grade andável em que o centro da bicicleta pode entrar
  // pelo corredor (até RAIO_ASFALTO + CORREDOR_FOLGA da linha): os cortes dos
  // checkpoints passam por eles também, para ninguém "pular" um arco pela borda.
  const alcanceCorredor = RAIO_ASFALTO + CORREDOR_FOLGA + Math.SQRT1_2;
  const noCorredor = (x, y) => y < MURO_Y && x >= 0 && y >= 0 && x < MW && y < MH && dist[y * MW + x] <= alcanceCorredor;

  // Checkpoints: corte de uma coluna (ou linha) inteira de asfalto que passa
  // pelo ponto da linha central mais perto de `perto`.
  const checkpoints = CHECKPOINTS.map((c) => {
    let k0 = 0;
    let best = Infinity;
    pts.forEach((p, k) => {
      const d = Math.hypot(p.x - c.perto[0], p.y - c.perto[1]);
      if (d < best) {
        best = d;
        k0 = k;
      }
    });
    const p = pts[k0];
    const tiles = [];
    if (c.eixo === "col") {
      const x = Math.round(p.x);
      let y = Math.round(p.y);
      while (pista.has(chave(x, y - 1))) y--;
      for (; pista.has(chave(x, y)); y++) tiles.push([x, y]);
    } else {
      const y = Math.round(p.y);
      let x = Math.round(p.x);
      while (pista.has(chave(x - 1, y))) x--;
      for (; pista.has(chave(x, y)); x++) tiles.push([x, y]);
    }
    // Corte lógico: os tiles do asfalto andável mais as bordas do corredor
    // (fora da grade) por onde a bicicleta também passa.
    const [dx, dy] = c.eixo === "col" ? [0, 1] : [1, 0];
    const corte = [...tiles];
    for (let [x, y] = tiles[0]; noCorredor(x - dx, y - dy) && !pista.has(chave(x - dx, y - dy)); ) {
      x -= dx;
      y -= dy;
      corte.unshift([x, y]);
    }
    for (let [x, y] = tiles[tiles.length - 1]; noCorredor(x + dx, y + dy) && !pista.has(chave(x + dx, y + dy)); ) {
      x += dx;
      y += dy;
      corte.push([x, y]);
    }
    // Onde a linha central cruza a reta do corte (x = X ou y = Y) e a meia-
    // largura do asfalto medida nessa reta: é onde se pinta a faixa no chão,
    // alinhada com o arco (que também segue a grade).
    const col = c.eixo === "col";
    const reta = col ? tiles[0][0] : tiles[0][1];
    let kc = k0;
    let melhor = Infinity;
    for (let d = -40; d <= 40; d++) {
      const q = pts[(k0 + d + pts.length) % pts.length];
      const e = Math.abs((col ? q.x : q.y) - reta);
      if (e < melhor) {
        melhor = e;
        kc = (k0 + d + pts.length) % pts.length;
      }
    }
    const q = pts[kc];
    const meia = RAIO_ASFALTO / Math.max(0.5, Math.abs(col ? q.tx : q.ty));
    const faixa = col ? { x: reta, y: q.y, meia } : { x: q.x, y: reta, meia };
    return { id: c.id, tiles, corte, eixo: c.eixo, s: q.s, centro: [q.x, q.y], tangente: [q.tx, q.ty], faixa };
  });

  return {
    pts,
    total,
    pista,
    box,
    andavel,
    passable,
    // Distância do centro do tile (x, y) à linha central (Infinity longe).
    distancia: (x, y) => (x >= 0 && y >= 0 && x < MW && y < MH ? dist[y * MW + x] : Infinity),
    checkpoints,
    corredor,
    noCorredor,
  };
}

// Caminho mais curto (BFS na grade, 4 vizinhos) de `de` passando pelos
// checkpoints na ordem, `voltas` vezes; nenhum outro checkpoint pode ser
// pisado no meio de um trecho. Devolve os tiles de cada volta (ou null se o
// circuito estiver quebrado). Serve de teste e de "tempo de referência".
export function medirVolta(c, de = [LARGADA.x, LARGADA.y], voltas = 2) {
  const todos = new Set();
  for (const cp of c.checkpoints) for (const [x, y] of cp.tiles) todos.add(chave(x, y));
  const passos = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const trecho = (ini, alvo) => {
    const dist = new Map([[chave(ini[0], ini[1]), 0]]);
    const fila = [ini];
    for (let h = 0; h < fila.length; h++) {
      const [x, y] = fila[h];
      const d = dist.get(chave(x, y));
      if (alvo.has(chave(x, y))) return { d, fim: [x, y] };
      for (const [dx, dy] of passos) {
        const k = chave(x + dx, y + dy);
        if (!c.andavel.has(k) || dist.has(k) || (todos.has(k) && !alvo.has(k))) continue;
        dist.set(k, d + 1);
        fila.push([x + dx, y + dy]);
      }
    }
    return null;
  };
  const porVolta = [];
  let pos = de;
  for (let v = 0; v < voltas; v++) {
    let n = 0;
    for (const cp of c.checkpoints) {
      const r = trecho(pos, new Set(cp.tiles.map(([x, y]) => chave(x, y))));
      if (!r) return null;
      n += r.d;
      pos = r.fim;
    }
    porVolta.push(n);
  }
  return porVolta;
}
