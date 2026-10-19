// Vila 2030 — módulo "predios": os cinco prédios de hoje ganham um retrofit
// cyberpunk montado por cima, um prédio depois do outro (k 0,30–0,80):
//
//   estrutura sobe → neon é desenhado nas arestas → fachada escurece e as
//   janelas pegam a cor do prédio → telões ligam com cintilação (abrindo como
//   um tubo de TV) → letreiro acende letra por letra → luzes de topo piscam.
//
// Identidade de cor: SEDE SEMEC ciano/azul institucional, FRONT-END magenta,
// BACK-END verde "terminal", BANCO DE DADOS âmbar/violeta (anéis tracejados
// girando em volta da torre e dois anéis inclinados flutuando no topo),
// LABORATÓRIO DE ML violeta/lilás (rede neural de neon sobre o telhado).
//
// Nada daqui toca nos grupos dos prédios: tudo fica no grupo próprio do
// módulo. A única mudança nos prédios é de material (cor, emissive e opacidade
// do vidro/janelas/paredes), guardada no primeiro uso e devolvida exatamente
// em k = 0. Sem luzes reais: neon e telões são MeshBasic/shader sem tone
// mapping, com halos aditivos.
import * as THREE from "three";
import { trecho, assentar } from "../comum";
import { criarNeon, foraDoAO, revelar, criarTela, criarFaixa, criarLetreiro, cintila, suave } from "./predios-kit";

// Ordem de obra e janelas de k: cada prédio dura DUR e começa PASSO depois do
// anterior (o último termina em 0,80).
const ORDEM = ["database", "semec", "ml", "frontend", "backend"];
const K0 = 0.3;
const DUR = 0.25;
const PASSO = (0.8 - K0 - DUR) / (ORDEM.length - 1);

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function createPredios(ctx) {
  const { scene, pal, track, buildings, reducedMotion = false, cores, kit } = ctx;
  const { pv, mix, white } = pal;
  const font = pal.font || "sans-serif";

  const root = new THREE.Group();
  root.visible = false;
  scene.add(root);

  const neon = criarNeon({ track });
  const uK = neon.uK;

  // ---- Materiais ----------------------------------------------------------------
  const ferro = kit.mat(mix(cores.asfalto, pv("gray-700"), 0.4), { roughness: 0.45, metalness: 0.55 });
  const aco = kit.mat(pv("gray-400"), { roughness: 0.35, metalness: 0.6 });
  const painel = kit.mat(mix(cores.noite, pv("gray-900"), 0.5), { roughness: 0.3, metalness: 0.3 });
  const prato = kit.mat(pv("gray-200"), { roughness: 0.4, metalness: 0.2, side: THREE.DoubleSide });
  const borracha = revelar(kit.mat(mix(pv("gray-900"), cores.noite, 0.4), { roughness: 0.55 }), uK);
  const cilindro = track(new THREE.CylinderGeometry(1, 1, 1, 10));
  const cuia = track(new THREE.SphereGeometry(1, 16, 6, 0, Math.PI * 2, 0, 0.75));

  // ---- Peças que "sobem" (instanciadas) -------------------------------------------
  // Cada item: base (centro da face de baixo, mundo), q (rotação), tam, janela
  // [a, b] e modo: "sobe" cresce em altura a partir da base; "cresce" escala
  // tudo junto (parabólicas).
  const lotes = new Map();
  function peca(geo, material, base, q, tam, a, b, modo = "sobe") {
    const chave = `${geo.uuid}|${material.uuid}`;
    if (!lotes.has(chave)) lotes.set(chave, { geo, material, itens: [] });
    lotes.get(chave).itens.push({ base, q, tam, a, b, modo });
  }

  // Referencial de cada prédio (e de molduras inclinadas presas a ele).
  function referencial(obj) {
    obj.updateMatrixWorld(true);
    const M = obj.matrixWorld.clone();
    const q = obj.getWorldQuaternion(new THREE.Quaternion());
    return { obj, P: (x, y, z) => V(x, y, z).applyMatrix4(M), q };
  }
  // Moldura inclinada para trás (para encarar a câmera alta) presa ao prédio.
  function moldura(F, x, y, z, inclina) {
    const o = new THREE.Object3D();
    o.position.set(x, y, z);
    o.rotation.x = -inclina;
    F.obj.add(o);
    return referencial(o);
  }
  // Caixa pelos limites no referencial F.
  function caixa(F, material, x0, x1, y0, y1, z0, z1, a, b, geo = kit.box) {
    peca(geo, material, F.P((x0 + x1) / 2, y0, (z0 + z1) / 2), F.q, V(x1 - x0, y1 - y0, z1 - z0), a, b);
  }
  function mastro(F, x, y0, y1, z, a, b, grossura = 0.035) {
    peca(cilindro, aco, F.P(x, y0, z), F.q, V(grossura, y1 - y0, grossura), a, b);
  }
  // Parabólica: cuia virada para o sul e para cima, num pé curto.
  function parabolica(F, x, y, z, raio, giro, a, b) {
    mastro(F, x, y, y + raio * 0.9, z, a, a + (b - a) * 0.5, 0.03);
    const q = F.q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(1.0, giro, 0, "YXZ")));
    peca(cuia, prato, F.P(x, y + raio * 0.9, z), q, V(raio, raio * 0.55, raio), a + (b - a) * 0.4, b, "cresce");
  }

  // ---- Luzes de topo piscando -----------------------------------------------------
  const piscas = []; // { p, cor, a, fase }
  const pisca = (F, x, y, z, cor, a, fase) => piscas.push({ p: F.P(x, y, z), cor, a, fase });
  // Nós acesos fixos (rede neural do laboratório): { p, cor, a, b, seed }.
  const nos = [];

  // ---- Grades iluminadas (ar-condicionado, exaustão) -----------------------------
  const grades = []; // { p, q, w, h, cor, a, b }
  function grade(F, x, y, z, w, h, cor, a, b, deitada = false) {
    const q = F.q.clone();
    if (deitada) q.multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -Math.PI / 2));
    grades.push({ p: F.P(x, y, z), q, w, h, cor, a, b });
  }
  // Condensadora nova: caixa escura com grade na frente.
  function arCondicionado(F, x0, x1, y0, z0, z1, alt, cor, a, b) {
    caixa(F, ferro, x0, x1, y0, y0 + alt, z0, z1, a, a + (b - a) * 0.6);
    grade(F, (x0 + x1) / 2, y0 + alt * 0.5, z1 + 0.004, x1 - x0 - 0.08, alt * 0.62, cor, a + (b - a) * 0.6, b);
  }

  // ---- Cabos grossos ------------------------------------------------------------------
  const cabos = []; // { pts, a, b, r }
  // Cabo pendurado entre dois pontos com barriga para baixo.
  function vao(A, B, barriga, a, b, r = 0.03) {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      pts.push(V(0, 0, 0).lerpVectors(A, B, t).add(V(0, -barriga * 4 * t * (1 - t), 0)));
    }
    cabos.push({ pts, a, b, r });
  }
  // Cabo descendo pela fachada, preso em braçadeiras, com leve barriga para fora.
  function descida(F, pts, saida, a, b, r = 0.03) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const [x, y, z] = pts[i];
      out.push(F.P(x, y, z));
      if (i < pts.length - 1) {
        const [x2, y2, z2] = pts[i + 1];
        out.push(F.P((x + x2) / 2 + saida[0], (y + y2) / 2, (z + z2) / 2 + saida[1]));
      }
    }
    cabos.push({ pts: out, a, b, r, suave: true });
  }

  // ---- Telas, faixas e letreiros ------------------------------------------------------
  const telas = []; // { t: criarTela, a, b, seed }
  const faixas = []; // { f: criarFaixa, a, b, seed }
  const letreiros = []; // { l: criarLetreiro, a, b, seed }

  // Linhas de neon num referencial (pontos locais).
  const linha = (F, pts, t0, t1, cor, opts) => neon.caminho(pts.map(([x, y, z]) => F.P(x, y, z)), t0, t1, cor, opts);
  // Contorno de um retângulo horizontal: duas linhas partem da quina da frente
  // (x0 ou x1) e se encontram na quina oposta do fundo.
  function contorno(F, x0, x1, z0, z1, y, t0, t1, cor, opts = {}) {
    const deEsq = opts.deEsq !== false;
    const xa = deEsq ? x0 : x1;
    const xb = deEsq ? x1 : x0;
    linha(F, [[xa, y, z1], [xb, y, z1], [xb, y, z0]], t0, t1, cor, opts);
    linha(F, [[xa, y, z1], [xa, y, z0], [xb, y, z0]], t0, t1, cor, opts);
  }
  // Moldura de neon em volta de uma tela (no plano z do referencial): parte
  // do meio de baixo e fecha em cima.
  function quadroNeon(F, w, h, y0, z, t0, t1, cor) {
    const hw = w / 2;
    linha(F, [[0, y0, z], [hw, y0, z], [hw, y0 + h, z], [0, y0 + h, z]], t0, t1, cor);
    linha(F, [[0, y0, z], [-hw, y0, z], [-hw, y0 + h, z], [0, y0 + h, z]], t0, t1, cor);
  }

  // Painel de LED numa moldura inclinada sobre o telhado: pernas, caixa,
  // tela e quadro de neon.
  function outdoor(F, { x, z, yTeto, alt, w, h, inclina, cor, desenhar, px = 384, L }) {
    const M = moldura(F, x, yTeto + alt, z, inclina);
    for (const sx of [-0.36, 0.36]) {
      caixa(F, ferro, x + sx * w - 0.04, x + sx * w + 0.04, yTeto, yTeto + alt + 0.02, z - 0.1, z - 0.02, L(0.02), L(0.16));
      caixa(F, ferro, x + sx * w - 0.03, x + sx * w + 0.03, yTeto, yTeto + 0.04, z - 0.4, z + 0.12, L(0.0), L(0.06));
    }
    caixa(M, painel, -w / 2 - 0.07, w / 2 + 0.07, -0.07, h + 0.07, -0.08, 0.0, L(0.12), L(0.3));
    const tela = criarTela({ track, largura: w, altura: h, px, desenhar });
    // Tela "abre" a partir do centro: pivô no meio da altura.
    tela.mesh.position.set(0, h / 2, 0.006);
    M.obj.add(tela.mesh);
    telas.push({ t: tela, a: L(0.55), b: L(0.85), seed: telas.length });
    quadroNeon(M, w + 0.1, h + 0.1, -0.05, 0.02, L(0.32), L(0.55), cor);
    return M;
  }

  // Letreiro de neon de pé no telhado, com caixa escura e treliça.
  function letreiroTeto(F, { x, z, yTeto, alt, w, h, inclina, texto, cor, cor2, L }) {
    const M = moldura(F, x, yTeto + alt, z, inclina);
    for (const sx of [-0.4, 0, 0.4]) caixa(F, ferro, x + sx * w - 0.025, x + sx * w + 0.025, yTeto, yTeto + alt + 0.04, z - 0.09, z - 0.04, L(0.04), L(0.2));
    caixa(F, ferro, x - w / 2, x + w / 2, yTeto + alt * 0.45, yTeto + alt * 0.45 + 0.04, z - 0.09, z - 0.04, L(0.12), L(0.24));
    caixa(M, painel, -w / 2 - 0.05, w / 2 + 0.05, -0.04, h + 0.04, -0.06, 0.0, L(0.16), L(0.32));
    const l = criarLetreiro({ track, texto, largura: w, altura: h, cor, branco: white, font });
    l.mesh.position.set(0, h / 2, 0.012);
    M.obj.add(l.mesh);
    letreiros.push({ l, a: L(0.62), b: L(0.95), seed: letreiros.length });
    linha(M, [[-w / 2 - 0.05, -0.04, 0.01], [w / 2 + 0.05, -0.04, 0.01]], L(0.4), L(0.56), cor2, { modo: 1, raio: 0.026 });
    return M;
  }

  // ---- Reforma dos materiais das fachadas -------------------------------------
  // { m, cor0, emi0, op0, tipo, alvo*, a, b }
  const reformas = [];
  const vistos = new Set();
  const escuro = mix(cores.noite, cores.asfalto, 0.5);
  function reformar(group, cor, L) {
    group.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!m || vistos.has(m) || !m.isMeshStandardMaterial) continue;
        vistos.add(m);
        const r = { m, cor0: m.color.clone(), emi0: m.emissive.clone(), op0: m.opacity, a: L(0.34), b: L(0.62) };
        const emissivo = m.emissive.r + m.emissive.g + m.emissive.b > 0.01;
        if (m.transparent && m.opacity < 0.6) {
          // Vidro: escuro e espelhado, com um véu da cor do prédio.
          r.corA = m.color.clone().lerp(escuro, 0.75);
          r.emiA = cor.clone().multiplyScalar(0.22);
          r.opA = Math.min(0.7, m.opacity + 0.3);
        } else if (emissivo) {
          // Janelas e interiores acesos: luz puxada para a cor do prédio.
          r.corA = m.color.clone().lerp(cor, 0.2);
          r.emiA = m.emissive.clone().lerp(cor, 0.6);
          r.opA = m.opacity;
        } else {
          // Paredes e lajes: um tom mais escuro e frio (o neon salta).
          r.corA = m.color.clone().multiplyScalar(0.62).lerp(cores.roxo, 0.12);
          r.emiA = m.emissive.clone();
          r.opA = m.opacity;
        }
        reformas.push(r);
      }
    });
  }

  // ---- Conteúdo dos telões (canvas 2D; cores sempre da paleta) ------------------
  const css = (c) => c.getStyle();
  const fundoTela = mix(cores.noite, pv("gray-900"), 0.35);
  function varredura(g, W, H, t) {
    g.globalAlpha = 0.13;
    g.fillStyle = css(pal.black || pv("gray-900"));
    for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    // Faixa de varredura descendo.
    g.globalAlpha = 0.08;
    g.fillStyle = css(white);
    g.fillRect(0, ((t * 40) % (H + 30)) - 30, W, 14);
    g.globalAlpha = 1;
  }
  function rRect(g, x, y, w, h, r) {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    g.fill();
  }

  // SEDE: vitrine do Design System (tokens, botão, toggle, checkbox, progresso).
  function telaDS(g, t, W, H) {
    const c = cores.ciano;
    const azul = pv("blue-500");
    g.fillStyle = css(fundoTela);
    g.fillRect(0, 0, W, H);
    g.fillStyle = css(azul);
    g.fillRect(0, 0, W, 26);
    g.fillStyle = css(white);
    g.font = `700 16px ${font}`;
    g.textBaseline = "middle";
    g.fillText("SEMEC DS · 2030", 10, 14);
    g.fillStyle = css(c);
    g.fillRect(W - 40, 9, 30, 8);
    // Tokens pv-* em coluna.
    const toks = [["blue-700", pv("blue-700")], ["blue-400", pv("blue-400")], ["yellow-400", pv("yellow-400")], ["green-500", pv("green-500")], ["red-500", pv("red-500")]];
    g.font = `500 11px ${font}`;
    toks.forEach(([nome, cor], i) => {
      const y = 36 + i * 22;
      g.fillStyle = css(cor);
      rRect(g, 10, y, 16, 16, 4);
      g.fillStyle = css(c);
      g.globalAlpha = 0.85;
      g.fillText(`pv-${nome}`, 32, y + 9);
      g.globalAlpha = 1;
    });
    // Componentes.
    const x0 = W * 0.48;
    g.fillStyle = css(azul);
    rRect(g, x0, 38, 92, 26, 7);
    g.fillStyle = css(white);
    g.font = `600 13px ${font}`;
    g.fillText("Botão", x0 + 26, 52);
    const on = Math.floor(t * 0.8) % 2 === 0;
    g.fillStyle = css(on ? c : pv("gray-600"));
    rRect(g, x0 + 104, 41, 40, 20, 10);
    g.fillStyle = css(white);
    g.beginPath();
    g.arc(x0 + (on ? 134 : 114), 51, 7, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = css(c);
    g.lineWidth = 2;
    g.strokeRect(x0 + 2, 78, 16, 16);
    if (Math.floor(t * 1.3) % 3 !== 0) {
      g.beginPath();
      g.moveTo(x0 + 5, 86);
      g.lineTo(x0 + 9, 91);
      g.lineTo(x0 + 16, 81);
      g.stroke();
    }
    g.fillStyle = css(c);
    g.font = `500 12px ${font}`;
    g.fillText("Acessível · WCAG AA", x0 + 26, 87);
    const prog = (t * 0.25) % 1;
    g.fillStyle = css(pv("gray-700"));
    rRect(g, x0, 106, W - x0 - 12, 8, 4);
    g.fillStyle = css(c);
    rRect(g, x0, 106, (W - x0 - 12) * prog, 8, 4);
    g.globalAlpha = 0.7;
    g.font = `500 11px ${font}`;
    g.fillText(`47 componentes · ${Math.round(prog * 100)}%`, x0, 128);
    g.globalAlpha = 1;
    varredura(g, W, H, t);
  }

  // FRONT-END: código JSX rolando à esquerda e o componente renderizado à direita.
  const JSX = [
    "<Card destaque>",
    "  <Card.Titulo>Matrícula</Card.Titulo>",
    "  <Campo rotulo=\"Aluno\" />",
    "  <Seletor opcoes={escolas} />",
    "  <Botao variante=\"primario\">",
    "    Enviar",
    "  </Botao>",
    "</Card>",
    "<Abas valor={aba}>",
    "  <Aba>Turmas</Aba>",
    "  <Aba>Notas</Aba>",
    "</Abas>",
  ];
  function telaFront(g, t, W, H) {
    const m = cores.magenta;
    const vi = cores.violeta;
    g.fillStyle = css(fundoTela);
    g.fillRect(0, 0, W, H);
    // Barra da janela.
    g.fillStyle = css(mix(fundoTela, m, 0.25));
    g.fillRect(0, 0, W, 22);
    [m, vi, cores.ciano].forEach((c, i) => {
      g.fillStyle = css(c);
      g.beginPath();
      g.arc(12 + i * 14, 11, 4, 0, Math.PI * 2);
      g.fill();
    });
    g.fillStyle = css(white);
    g.font = `600 12px ${font}`;
    g.textBaseline = "middle";
    g.fillText("src/telas/Matricula.jsx", 58, 12);
    // Código rolando.
    const lh = 15;
    const rol = (t * 16) % (JSX.length * lh);
    g.save();
    g.beginPath();
    g.rect(0, 24, W * 0.56, H - 24);
    g.clip();
    g.font = `500 11px monospace`;
    for (let i = -1; i < JSX.length + 10; i++) {
      const y = 34 + i * lh - rol;
      if (y < 20 || y > H + lh) continue;
      const linhaTxt = JSX[((i % JSX.length) + JSX.length) % JSX.length];
      g.fillStyle = css(mix(white, vi, 0.5));
      g.globalAlpha = 0.45;
      g.fillText(String((((i % JSX.length) + JSX.length) % JSX.length) + 1).padStart(2, " "), 6, y);
      g.globalAlpha = 1;
      g.fillStyle = css(linhaTxt.includes("<") ? m : white);
      g.fillText(linhaTxt, 26, y);
    }
    g.restore();
    // Componente renderizado.
    const x0 = W * 0.6;
    const w = W - x0 - 10;
    g.fillStyle = css(mix(fundoTela, white, 0.08));
    rRect(g, x0, 32, w, H - 44, 8);
    g.fillStyle = css(white);
    g.font = `700 13px ${font}`;
    g.fillText("Matrícula", x0 + 10, 48);
    g.fillStyle = css(pv("gray-600"));
    rRect(g, x0 + 10, 60, w - 20, 16, 4);
    rRect(g, x0 + 10, 82, w - 20, 16, 4);
    g.fillStyle = css(white);
    g.font = `500 10px ${font}`;
    const digitado = "Ana Souza".slice(0, Math.floor(t * 4) % 14);
    g.fillText(digitado + (Math.floor(t * 3) % 2 ? "|" : ""), x0 + 15, 68);
    const hover = Math.floor(t * 0.7) % 2;
    g.fillStyle = css(hover ? m : vi);
    rRect(g, x0 + 10, H - 40, w - 20, 22, 6);
    g.fillStyle = css(white);
    g.font = `700 11px ${font}`;
    g.fillText("Enviar", x0 + w / 2 - 16, H - 29);
    varredura(g, W, H, t);
  }

  // BACK-END: terminal com o log da API rolando.
  const LOG = [
    "GET  /api/escolas           200  12ms",
    "POST /api/matriculas        201  31ms",
    "GET  /api/turmas?ano=2030   200   9ms",
    "[ok] fila de notas: 0 pendentes",
    "PUT  /api/alunos/4821       200  18ms",
    "GET  /api/merenda/cardapio  200   7ms",
    "[ok] backup 03:00 concluído",
    "GET  /api/transporte/rotas  200  22ms",
    "POST /api/frequencia        201  15ms",
    "[ok] deploy v2030.1 no ar",
  ];
  function telaTerminal(g, t, W, H) {
    const v = cores.verde;
    g.fillStyle = css(mix(fundoTela, pv("gray-900"), 0.5));
    g.fillRect(0, 0, W, H);
    g.font = `700 14px monospace`;
    g.textBaseline = "middle";
    g.fillStyle = css(v);
    g.fillText("semec@api:~$ tail -f acesso.log", 8, 12);
    const lh = 18;
    const n = Math.floor((H - 44) / lh);
    const passo = Math.floor(t * 2.2);
    for (let i = 0; i < n; i++) {
      const txt = LOG[(passo + i) % LOG.length];
      g.fillStyle = css(txt.startsWith("[ok]") ? cores.ciano : v);
      g.globalAlpha = 0.55 + (0.45 * i) / n;
      g.fillText(txt, 8, 30 + i * lh);
    }
    g.globalAlpha = 1;
    g.fillStyle = css(v);
    g.fillText("$", 8, H - 10);
    if (Math.floor(t * 2.5) % 2) g.fillRect(20, H - 16, 8, 12);
    // Medidor de requisições.
    g.globalAlpha = 0.85;
    for (let i = 0; i < 24; i++) {
      const h = 6 + 18 * Math.abs(Math.sin(t * 1.7 + i * 0.6) * Math.sin(i * 1.3 + t * 0.4));
      g.fillRect(W - 110 + i * 4.2, H - 4 - h, 3, h);
    }
    g.globalAlpha = 1;
    varredura(g, W, H, t);
  }

  // BANCO DE DADOS: barras de consultas por segundo e a consulta rodando.
  function telaBanco(g, t, W, H) {
    const am = cores.ambar;
    const vi = cores.violeta;
    g.fillStyle = css(fundoTela);
    g.fillRect(0, 0, W, H);
    const nb = 22;
    const bw = W / nb;
    for (let i = 0; i < nb; i++) {
      const h = (0.25 + 0.65 * Math.abs(Math.sin(t * 1.1 + i * 0.55) * Math.cos(t * 0.37 + i * 0.21))) * (H - 46);
      g.fillStyle = css(i % 4 === 0 ? vi : am);
      g.fillRect(i * bw + 2, H - 8 - h, bw - 4, h);
    }
    g.fillStyle = css(white);
    g.font = `700 15px ${font}`;
    g.textBaseline = "middle";
    const qps = 12480 + Math.round(Math.sin(t * 0.9) * 900);
    g.fillText(`${qps.toLocaleString("pt-BR")} consultas/s`, 12, 16);
    g.font = `600 11px monospace`;
    g.fillStyle = css(am);
    const sql = "SELECT nome, turma FROM alunos WHERE ano = 2030;";
    g.fillText(sql.slice(0, 6 + (Math.floor(t * 9) % (sql.length + 12))), 12, 34);
    varredura(g, W, H, t);
  }

  // ---- Prédio a prédio ----------------------------------------------------------------
  const P = {};
  ORDEM.forEach((id, i) => {
    const g = buildings.get(id);
    if (!g) return;
    const a = K0 + i * PASSO;
    const local = new THREE.Group();
    local.position.copy(g.position);
    local.quaternion.copy(g.quaternion);
    root.add(local);
    P[id] = { F: referencial(local), L: (u) => a + u * DUR, g };
  });

  // ===== BANCO DE DADOS: torre redonda, âmbar e violeta ==========================
  if (P.database) {
    const { F, L, g } = P.database;
    const am = cores.ambar;
    const vi = cores.violeta;
    reformar(g, am, L);
    const c = F.P(0, 0, 0);
    const cintas = [0.045, 1.08, 1.27, 1.92, 2.11, 2.75];
    // Anéis tracejados girando nas cintas, de baixo para cima, sentidos alternados.
    cintas.forEach((y, j) => {
      const t0 = L(0.24 + j * 0.035);
      neon.anel(c, 1.54, y + (j % 2 ? -0.035 : 0.035), t0, t0 + DUR * 0.16, j % 2 ? vi : am, { modo: 1, sentido: j % 2 ? -1 : 1 });
    });
    // Coroa contínua na platibanda.
    neon.anel(c, 1.53, 2.93, L(0.42), L(0.56), am, { raioTubo: 0.028 });
    // Linhas de dados subindo pela torre (tracejado correndo para cima).
    [-1.25, -0.8, 0.8, 1.25].forEach((ang, j) => {
      const pts = [];
      for (const y of [0.12, 2.9]) pts.push([Math.sin(ang) * 1.56, y, Math.cos(ang) * 1.56]);
      linha(F, pts, L(0.3 + j * 0.02), L(0.5 + j * 0.02), vi, { modo: 1, raio: 0.026 });
    });
    // Dois anéis inclinados flutuando sobre a cobertura (giroscópio de dados).
    const topo = F.P(0, 0, 0);
    neon.anel(topo, 0.95, 3.55, L(0.5), L(0.66), am, {
      modo: 1, raioTubo: 0.04, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.42, 0, 0.18)),
    });
    neon.anel(topo, 0.72, 3.55, L(0.54), L(0.7), vi, {
      modo: 1, raioTubo: 0.034, sentido: -1, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, 0, -0.5)),
    });
    // Feixe de luz da claraboia até os anéis.
    linha(F, [[0, 2.95, 0], [0, 3.55, 0]], L(0.46), L(0.52), white, { raio: 0.03, ponta: false });
    // Telão curvo no volume do meio.
    const arco = 1.2;
    const curva = track(new THREE.CylinderGeometry(1.6, 1.6, 0.56, 24, 1, true, -arco / 2, arco));
    caixa(F, painel, -0.1, 0.1, 1.24, 1.95, 1.48, 1.58, L(0.1), L(0.24)); // suporte central
    const tela = criarTela({ track, largura: 1.6 * arco, altura: 0.56, px: 320, desenhar: telaBanco, geo: curva });
    tela.mesh.position.copy(F.P(0, 1.595, 0));
    root.add(tela.mesh);
    telas.push({ t: tela, a: L(0.55), b: L(0.85), seed: 11 });
    for (const y of [1.3, 1.89]) {
      const pts = [];
      for (let n = 0; n <= 16; n++) {
        const ang = -arco / 2 + (arco * n) / 16;
        pts.push([Math.sin(ang) * 1.62, y, Math.cos(ang) * 1.62]);
      }
      linha(F, pts, L(0.36), L(0.52), am, { raio: 0.026 });
    }
    // Letreiro no topo, virado para a câmera.
    letreiroTeto(F, { x: 0, z: 1.05, yTeto: 2.75, alt: 0.3, w: 2.0, h: 0.34, inclina: 0.45, texto: "BANCO DE DADOS", cor: am, cor2: vi, L });
    // Antenas, parabólica e luzes de topo.
    mastro(F, -0.95, 2.75, 3.95, -0.7, L(0.04), L(0.2));
    pisca(F, -0.95, 3.98, -0.7, pv("red-400"), L(0.8), 0);
    mastro(F, 1.0, 2.75, 3.45, -0.85, L(0.08), L(0.22), 0.03);
    pisca(F, 1.0, 3.48, -0.85, white, L(0.82), 0.45);
    parabolica(F, 0.2, 2.78, -1.05, 0.26, 0.3, L(0.1), L(0.28));
    // Grades das condensadoras existentes acendem.
    for (const cx of [-0.68, 0.68]) grade(F, cx, 2.885, -0.284, 0.5, 0.13, am, L(0.45), L(0.62));
    // Cabo grosso descendo da cobertura até o muro do pátio.
    descida(F, [[1.12, 2.92, 1.0], [1.24, 1.98, 1.1], [1.3, 1.0, 1.15], [1.62, 0.5, 1.45]], [0.1, 0.12], L(0.05), L(0.3), 0.035);
  }

  // ===== SEDE SEMEC: ciano e azul institucional ===================================
  if (P.semec) {
    const { F, L, g } = P.semec;
    const ci = cores.ciano;
    const az = pv("blue-500").clone().offsetHSL(0, 0.25, 0.1);
    reformar(g, ci, L);
    // Contornos das platibandas (bloco alto e volume baixo).
    contorno(F, -2.86, -1.1, -1.76, 0.65, 2.225, L(0.26), L(0.44), ci);
    contorno(F, -1.1, 2.86, -1.76, 0.65, 2.045, L(0.3), L(0.5), ci, { deEsq: false });
    // Quinas do pavimento superior descendo até a laje.
    linha(F, [[-2.86, 2.225, 0.65], [-2.86, 1.02, 0.65]], L(0.42), L(0.52), ci);
    linha(F, [[2.86, 2.045, 0.65], [2.86, 1.02, 0.65]], L(0.46), L(0.56), ci);
    // Lâmina azul: filete vertical.
    linha(F, [[-0.98, 2.24, 0.75], [-0.98, 1.02, 0.75]], L(0.4), L(0.5), az);
    // Fita de LED correndo na borda da laje e filete sobre o friso.
    linha(F, [[-2.86, 1.185, 0.66], [2.86, 1.185, 0.66]], L(0.36), L(0.56), az, { modo: 1, raio: 0.026 });
    linha(F, [[-1.1, 1.835, 0.66], [2.86, 1.835, 0.66]], L(0.4), L(0.58), ci, { raio: 0.024 });
    // Letreiro corrido na laje (sob o filete).
    const fx = criarFaixa({
      track, largura: 3.86, altura: 0.12, font, cor: ci, fundo: fundoTela,
      texto: "  SEMEC · DESIGN SYSTEM 2030 · TOKENS pv-* · WCAG 2.1 AA · 47 COMPONENTES · PT-BR ·",
    });
    fx.mesh.position.copy(F.P(0.88, 1.1, 0.648));
    root.add(fx.mesh);
    faixas.push({ f: fx, a: L(0.56), b: L(0.8), seed: 3 });
    // Telão do Design System no bloco alto.
    outdoor(F, { x: -1.98, z: 0.05, yTeto: 2.12, alt: 0.32, w: 1.5, h: 0.84, inclina: 0.4, cor: ci, desenhar: telaDS, px: 320, L });
    // Letreiro SEMEC no volume baixo.
    letreiroTeto(F, { x: 1.2, z: 0.42, yTeto: 1.92, alt: 0.2, w: 1.7, h: 0.5, inclina: 0.42, texto: "SEMEC", cor: ci, cor2: az, L });
    // Antenas, parabólica, ar-condicionado.
    mastro(F, -2.62, 2.12, 3.35, -1.5, L(0.02), L(0.16));
    pisca(F, -2.62, 3.38, -1.5, pv("red-400"), L(0.8), 0.2);
    mastro(F, 2.6, 1.92, 2.85, -1.55, L(0.06), L(0.2), 0.03);
    pisca(F, 2.6, 2.88, -1.55, white, L(0.84), 0.7);
    parabolica(F, -1.4, 2.13, -1.45, 0.24, -0.2, L(0.08), L(0.26));
    arCondicionado(F, -2.62, -2.1, 2.12, -0.75, -0.42, 0.26, ci, L(0.06), L(0.6));
    grade(F, -1.525, 2.165, -1.146, 0.4, 0.05, az, L(0.5), L(0.64));
    // Cabo descendo a quina esquerda.
    descida(F, [[-2.8, 2.2, 0.55], [-2.95, 1.6, 0.62], [-2.95, 0.9, 0.5], [-3.0, 0.05, 0.4]], [-0.08, 0.06], L(0.06), L(0.3), 0.032);
  }

  // Vão de cabo entre a SEDE e o Banco de Dados, passando sobre o caminho.
  if (P.semec && P.database) {
    const A = P.semec.F.P(2.75, 2.0, -1.45);
    const B = P.database.F.P(-1.25, 2.6, -0.55);
    vao(A, B, 0.75, P.semec.L(0.1), P.semec.L(0.34), 0.028);
    vao(P.semec.F.P(2.75, 1.9, -1.2), P.database.F.P(-1.3, 2.3, -0.35), 0.9, P.semec.L(0.14), P.semec.L(0.38), 0.02);
  }

  // ===== LABORATÓRIO DE MACHINE LEARNING: violeta e lilás =========================
  // Sobre o telhado, uma rede neural de neon: os sinais acendem camada por
  // camada (um "forward pass") e depois ficam correndo pelas ligações.
  if (P.ml) {
    const { F, L, g } = P.ml;
    const vi = cores.violeta;
    const lilas = mix(cores.violeta, white, 0.4);
    const roxo = cores.roxo.clone().offsetHSL(0, 0.15, 0.22);
    reformar(g, vi, L);
    contorno(F, -1.78, 1.78, -1.26, 1.01, 2.345, L(0.26), L(0.44), roxo);
    linha(F, [[-1.78, 2.345, 1.01], [-1.78, 0.22, 1.01]], L(0.42), L(0.52), roxo);
    linha(F, [[1.78, 2.345, 1.01], [1.78, 0.22, 1.01]], L(0.42), L(0.52), roxo);
    linha(F, [[-1.68, 1.41, 1.0], [1.68, 1.41, 1.0]], L(0.36), L(0.52), vi, { modo: 1, raio: 0.022 });
    // Rede: 4 camadas flutuando a 2,9 m, mastros finos nas pontas.
    const Y = 2.92;
    const camadas = [3, 4, 4, 2].map((n, li) => {
      const x = -1.3 + li * 0.72;
      const out = [];
      for (let i = 0; i < n; i++) out.push([x, Y, n === 1 ? -0.1 : 0.55 - (1.4 * i) / (n - 1)]);
      return out;
    });
    for (const [x, z] of [[-1.42, -0.95], [-1.42, 0.7], [0.95, -0.95], [0.95, 0.7]]) mastro(F, x, 2.22, Y - 0.02, z, L(0.04), L(0.2), 0.022);
    const tCam = (li) => L(0.34 + li * 0.11);
    camadas.forEach((cam, li) => {
      cam.forEach(([x, y, z], i) => nos.push({ p: F.P(x, y, z), cor: li % 3 === 0 ? lilas : vi, a: tCam(li), b: tCam(li) + DUR * 0.08, seed: li * 7 + i }));
      if (li === camadas.length - 1) return;
      for (const p0 of cam) {
        for (const p1 of camadas[li + 1]) {
          linha(F, [p0, p1], tCam(li) + DUR * 0.04, tCam(li + 1), (li + p0[2] * 3) % 2 > 1 ? lilas : vi, { modo: 1, raio: 0.012, ponta: false });
        }
      }
    });
    // Feixe do núcleo de IA (redoma) até a rede.
    linha(F, [[0.05, 2.5, 0.05], [0.05, Y - 0.05, 0.05]], L(0.28), L(0.34), white, { raio: 0.022 });
    // Letreiro na frente do telhado.
    letreiroTeto(F, { x: 0, z: 0.82, yTeto: 2.22, alt: 0.1, w: 2.3, h: 0.28, inclina: 0.5, texto: "MACHINE LEARNING", cor: lilas, cor2: vi, L });
    pisca(F, -1.34, 2.82, -0.18, pv("red-400"), L(0.86), 0.15);
    grade(F, -1.34, 2.5, 0.0, 0.34, 0.2, vi, L(0.5), L(0.66));
    descida(F, [[1.72, 2.32, 0.9], [1.88, 1.5, 1.0], [1.9, 0.7, 1.02], [1.98, 0.06, 1.1]], [0.06, 0.06], L(0.06), L(0.3), 0.03);
  }

  // ===== FRONT-END: magenta e violeta =============================================
  if (P.frontend) {
    const { F, L, g } = P.frontend;
    const m = cores.magenta;
    const vi = cores.violeta;
    reformar(g, m, L);
    // Platibanda, quina e bordas das lajes.
    contorno(F, -2.51, 1.97, -1.96, 1.86, 2.53, L(0.26), L(0.46), m);
    linha(F, [[-2.51, 2.53, 1.86], [-2.51, 1.0, 1.86]], L(0.44), L(0.54), m);
    linha(F, [[-2.51, 1.27, 1.83], [1.95, 1.27, 1.83]], L(0.38), L(0.58), m, { modo: 1, raio: 0.026 });
    linha(F, [[-2.51, 2.24, 1.87], [1.97, 2.24, 1.87]], L(0.4), L(0.58), vi, { raio: 0.024 });
    // Letreiro corrido no beiral da cobertura.
    const fx = criarFaixa({
      track, largura: 4.44, altura: 0.15, font, cor: m, fundo: fundoTela,
      texto: "  <Botao/> · <Card/> · <Dialogo/> · <Abas/> · <Tooltip/> · INTERFACES ACESSÍVEIS ·",
    });
    fx.mesh.position.copy(F.P(-0.27, 2.34, 1.858));
    root.add(fx.mesh);
    faixas.push({ f: fx, a: L(0.56), b: L(0.8), seed: 5 });
    // Lâmina: letreiro vertical FRONT-END.
    caixa(F, painel, 2.0, 2.36, 0.85, 3.15, 1.86, 1.92, L(0.06), L(0.3));
    for (const y of [1.2, 2.6]) caixa(F, ferro, 2.1, 2.26, y, y + 0.05, 1.8, 1.9, L(0.04), L(0.12));
    const lv = criarLetreiro({ track, texto: "FRONT-END", largura: 0.34, altura: 2.24, cor: m, branco: white, font, vertical: true });
    lv.mesh.position.copy(F.P(2.18, 2.0, 1.93));
    root.add(lv.mesh);
    letreiros.push({ l: lv, a: L(0.62), b: L(0.95), seed: 7 });
    linha(F, [[2.0, 0.85, 1.93], [2.0, 3.15, 1.93]], L(0.34), L(0.52), vi, { raio: 0.024 });
    linha(F, [[2.36, 0.85, 1.93], [2.36, 3.15, 1.93]], L(0.34), L(0.52), vi, { raio: 0.024 });
    // Outdoor de LED no telhado.
    outdoor(F, { x: -0.45, z: -0.55, yTeto: 2.43, alt: 0.38, w: 2.7, h: 1.25, inclina: 0.42, cor: vi, desenhar: telaFront, px: 384, L });
    // Pouso de drones na frente do outdoor: disco escuro, anel e marcas.
    const pc = F.P(-0.55, 0, 0.95);
    peca(cilindro, painel, F.P(-0.55, 2.43, 0.95), F.q, V(0.62, 0.03, 0.62), L(0.1), L(0.26), "cresce");
    neon.anel(pc, 0.56, 2.475, L(0.4), L(0.56), m, { modo: 1, raioTubo: 0.022 });
    neon.anel(pc, 0.36, 2.475, L(0.46), L(0.6), vi, { raioTubo: 0.018 });
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      linha(F, [[-0.55 + dx * 0.12, 2.47, 0.95 + dz * 0.12], [-0.55 + dx * 0.28, 2.47, 0.95 + dz * 0.28]], L(0.56), L(0.62), white, { raio: 0.016, ponta: false });
    }
    // Antenas e ar-condicionado.
    mastro(F, -2.2, 2.43, 3.7, -1.6, L(0.02), L(0.18));
    pisca(F, -2.2, 3.73, -1.6, pv("red-400"), L(0.8), 0.55);
    parabolica(F, 1.45, 2.45, -1.45, 0.25, -0.35, L(0.08), L(0.28));
    arCondicionado(F, 0.95, 1.65, 2.43, 0.6, 1.05, 0.3, m, L(0.04), L(0.62));
    arCondicionado(F, -2.3, -1.7, 2.43, 0.75, 1.15, 0.26, vi, L(0.08), L(0.66));
    // Cabo descendo a quina da frente.
    descida(F, [[-2.45, 2.5, 1.8], [-2.62, 1.75, 1.95], [-2.6, 1.0, 1.92], [-2.55, 0.05, 1.98]], [-0.06, 0.08], L(0.06), L(0.3), 0.032);
  }

  // ===== BACK-END: verde "terminal" e ciano =======================================
  if (P.backend) {
    const { F, L, g } = P.backend;
    const v = cores.verde;
    const ci = cores.ciano;
    reformar(g, v, L);
    contorno(F, -2.34, 2.09, -1.84, 1.54, 2.32, L(0.26), L(0.46), v);
    linha(F, [[-2.34, 2.32, 1.54], [-2.34, 0.06, 1.54]], L(0.44), L(0.56), v);
    linha(F, [[2.09, 2.32, 1.54], [2.09, 0.06, 1.54]], L(0.44), L(0.56), v);
    // Faixa de janelas emoldurada por fitas que correm.
    linha(F, [[-2.17, 1.335, 1.6], [1.92, 1.335, 1.6]], L(0.36), L(0.54), ci, { modo: 1, raio: 0.024 });
    linha(F, [[-2.17, 1.635, 1.6], [1.92, 1.635, 1.6]], L(0.38), L(0.56), ci, { modo: 1, raio: 0.024 });
    // "Chuva" de código descendo pelas aletas (uma sim, uma não).
    for (let i = 0; i < 13; i += 2) {
      const x = -2.045 + i * 0.32;
      const sobreMarquise = x > -1.35 && x < -0.15;
      const sobreTela = x > 0.05 && x < 1.85;
      const y0 = sobreMarquise ? 1.02 : sobreTela ? 1.32 : 0.12;
      // s cresce para baixo: o tracejado escorre.
      neon.caminho([F.P(x, 2.12, 1.6), F.P(x, y0, 1.6)], L(0.42 + i * 0.008), L(0.56 + i * 0.008), v, { modo: 1, raio: 0.022 });
    }
    // Terminal na fachada, à direita da porta, preso nas aletas.
    const tw = 1.7;
    const th = 0.9;
    caixa(F, painel, 0.95 - tw / 2 - 0.05, 0.95 + tw / 2 + 0.05, 0.25, 0.25 + th + 0.1, 1.6, 1.66, L(0.08), L(0.28));
    const tela = criarTela({ track, largura: tw, altura: th, px: 320, desenhar: telaTerminal });
    tela.mesh.position.copy(F.P(0.95, 0.3 + th / 2, 1.665));
    root.add(tela.mesh);
    telas.push({ t: tela, a: L(0.55), b: L(0.85), seed: 17 });
    quadroNeon(moldura(F, 0.95, 0, 0, 0), tw + 0.1, th + 0.1, 0.25, 1.675, L(0.34), L(0.54), v);
    // Letreiro no telhado.
    letreiroTeto(F, { x: -0.35, z: 1.15, yTeto: 2.17, alt: 0.24, w: 2.1, h: 0.44, inclina: 0.42, texto: "BACK-END", cor: v, cor2: ci, L });
    // Torre de antena existente ganha luz no topo; parabólicas e mastro novos.
    pisca(F, 1.73, 3.42, -1.48, pv("red-400"), L(0.8), 0.3);
    parabolica(F, 1.25, 2.2, -1.25, 0.27, -0.4, L(0.08), L(0.28));
    parabolica(F, -0.1, 2.2, -0.15, 0.2, 0.25, L(0.12), L(0.3));
    mastro(F, -2.05, 2.17, 3.05, -1.55, L(0.04), L(0.18), 0.03);
    pisca(F, -2.05, 3.08, -1.55, white, L(0.84), 0.8);
    // Grades: condensadoras e unidade existentes, exaustão do data center.
    grade(F, -1.675, 2.36, -0.444, 0.77, 0.24, v, L(0.46), L(0.62));
    grade(F, -1.025, 2.36, -1.064, 0.77, 0.24, v, L(0.48), L(0.64));
    grade(F, 1.125, 2.32, -0.542, 0.55, 0.2, ci, L(0.5), L(0.66));
    grade(F, 0.475, 2.205, 0.815, 0.85, 0.43, v, L(0.44), L(0.6), true);
    // Cabos descendo a quina da frente direita.
    descida(F, [[2.0, 2.3, 1.5], [2.2, 1.6, 1.62], [2.22, 0.8, 1.6], [2.3, 0.06, 1.7]], [0.08, 0.06], L(0.06), L(0.3), 0.034);
    descida(F, [[1.92, 2.3, 1.5], [2.12, 1.5, 1.66], [2.16, 0.06, 1.75]], [0.06, 0.08], L(0.1), L(0.32), 0.022);
  }

  // Vão de cabo entre o Front-End (topo da lâmina) e o Back-End.
  if (P.frontend && P.backend) {
    const A = P.frontend.F.P(2.3, 2.84, -0.2);
    const B = P.backend.F.P(-2.25, 2.3, -0.35);
    vao(A, B, 0.6, P.backend.L(0.06), P.backend.L(0.3), 0.03);
    vao(P.frontend.F.P(2.3, 2.7, 0.6), P.backend.F.P(-2.25, 2.25, 0.5), 0.75, P.backend.L(0.1), P.backend.L(0.34), 0.02);
  }

  // ---- Montagem das malhas --------------------------------------------------------------
  neon.montar(root);

  const m4 = new THREE.Matrix4();
  const vp = new THREE.Vector3();
  const vs = new THREE.Vector3();
  const up = new THREE.Vector3();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const malhas = [];
  for (const lote of lotes.values()) {
    const im = new THREE.InstancedMesh(lote.geo, lote.material, lote.itens.length);
    im.castShadow = true;
    im.receiveShadow = true;
    im.frustumCulled = false;
    root.add(im);
    malhas.push({ im, itens: lote.itens });
  }

  // Grades: plano com ripas brancas, colorido por instância.
  const ripas = document.createElement("canvas");
  ripas.width = 32;
  ripas.height = 32;
  {
    const g = ripas.getContext("2d");
    g.fillStyle = css(pv("gray-900"));
    g.fillRect(0, 0, 32, 32);
    g.fillStyle = css(white);
    for (let y = 2; y < 32; y += 6) g.fillRect(1, y, 30, 3);
  }
  const texRipas = track(new THREE.CanvasTexture(ripas));
  texRipas.colorSpace = THREE.SRGBColorSpace;
  const gradesIM = new THREE.InstancedMesh(
    track(new THREE.PlaneGeometry(1, 1)),
    track(new THREE.MeshBasicMaterial({ map: texRipas, toneMapped: false })),
    Math.max(1, grades.length)
  );
  gradesIM.frustumCulled = false;
  root.add(foraDoAO(gradesIM));

  // Luzes de topo: núcleo + halo aditivo.
  const bolinha = track(new THREE.IcosahedronGeometry(1, 1));
  const piscaIM = new THREE.InstancedMesh(bolinha, kit.glow(white), Math.max(1, piscas.length));
  const piscaHalo = new THREE.InstancedMesh(
    bolinha,
    track(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })),
    Math.max(1, piscas.length)
  );
  piscas.forEach((p, i) => {
    piscaIM.setColorAt(i, p.cor);
    piscaHalo.setColorAt(i, p.cor);
  });
  for (const m of [piscaIM, piscaHalo]) {
    m.frustumCulled = false;
    root.add(foraDoAO(m));
  }

  // Nós da rede neural: esfera brilhante + halo, acendendo com cintilação.
  const nosIM = new THREE.InstancedMesh(bolinha, kit.glow(white), Math.max(1, nos.length));
  const nosHalo = new THREE.InstancedMesh(bolinha, piscaHalo.material, Math.max(1, nos.length));
  nos.forEach((n, i) => {
    nosIM.setColorAt(i, n.cor);
    nosHalo.setColorAt(i, n.cor);
  });
  for (const m of [nosIM, nosHalo]) {
    m.frustumCulled = false;
    root.add(foraDoAO(m));
  }

  // Cabos: um tubo por cabo, todos numa geometria só, revelados por aT.
  if (cabos.length) {
    const pos = [];
    const nrm = [];
    const tt = [];
    const idx = [];
    let base = 0;
    for (const cb of cabos) {
      const curva = new THREE.CatmullRomCurve3(cb.pts, false, "catmullrom", 0.3);
      const segs = 40;
      const rad = 6;
      const tubo = new THREE.TubeGeometry(curva, segs, cb.r, rad, false);
      const p = tubo.getAttribute("position");
      const n = tubo.getAttribute("normal");
      for (let i = 0; i < p.count; i++) {
        pos.push(p.getX(i), p.getY(i), p.getZ(i));
        nrm.push(n.getX(i), n.getY(i), n.getZ(i));
        const anel = Math.floor(i / (rad + 1));
        tt.push(cb.a + ((cb.b - cb.a) * anel) / segs);
      }
      const ix = tubo.getIndex();
      for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + base);
      base += p.count;
      tubo.dispose();
    }
    const geo = track(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
    geo.setAttribute("aT", new THREE.Float32BufferAttribute(tt, 1));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    const malha = new THREE.Mesh(geo, borracha);
    malha.receiveShadow = true;
    // Revelado por descarte no shader: fora do AO, senão o cabo inteiro
    // apareceria antes da hora no passe de normais.
    root.add(foraDoAO(malha));
  }

  // ---- Progresso ---------------------------------------------------------------------
  let kAtual = 0;
  let tempo = 0;
  const cor = new THREE.Color();

  function aplicarPecas(k) {
    for (const { im, itens } of malhas) {
      itens.forEach((it, i) => {
        const s = assentar(trecho(k, it.a, it.b));
        if (s <= 0) {
          im.setMatrixAt(i, zero);
          return;
        }
        up.set(0, 1, 0).applyQuaternion(it.q);
        if (it.modo === "cresce") vs.copy(it.tam).multiplyScalar(s);
        else vs.set(it.tam.x, it.tam.y * s, it.tam.z);
        vp.copy(it.base).addScaledVector(up, vs.y / 2);
        im.setMatrixAt(i, m4.compose(vp, it.q, vs));
      });
      im.instanceMatrix.needsUpdate = true;
    }
  }

  function aplicarReformas(k) {
    for (const r of reformas) {
      const d = suave(trecho(k, r.a, r.b));
      if (d <= 0) {
        r.m.color.copy(r.cor0);
        r.m.emissive.copy(r.emi0);
        r.m.opacity = r.op0;
        continue;
      }
      r.m.color.lerpColors(r.cor0, r.corA, d);
      r.m.emissive.lerpColors(r.emi0, r.emiA, d);
      r.m.opacity = r.op0 + (r.opA - r.op0) * d;
    }
  }

  function aplicarLuzes(k) {
    grades.forEach((gr, i) => {
      const b = cintila(k, gr.a, gr.b, i + 40);
      if (k <= gr.a) {
        gradesIM.setMatrixAt(i, zero);
      } else {
        gradesIM.setMatrixAt(i, m4.compose(gr.p, gr.q, vs.set(gr.w, gr.h, 1)));
      }
      gradesIM.setColorAt(i, cor.copy(gr.cor).multiplyScalar(0.08 + 0.92 * b));
    });
    gradesIM.instanceMatrix.needsUpdate = true;
    if (gradesIM.instanceColor) gradesIM.instanceColor.needsUpdate = true;
    gradesIM.visible = grades.length > 0;
    nos.forEach((n, i) => {
      const b = cintila(k, n.a, n.b, n.seed);
      nosIM.setMatrixAt(i, b > 0.01 ? m4.makeScale(0.07, 0.07, 0.07).setPosition(n.p) : zero);
      nosHalo.setMatrixAt(i, b > 0.01 ? m4.makeScale(0.2 * b, 0.2 * b, 0.2 * b).setPosition(n.p) : zero);
    });
    nosIM.instanceMatrix.needsUpdate = nosHalo.instanceMatrix.needsUpdate = true;
    nosIM.visible = nosHalo.visible = nos.length > 0;
    piscarTopo(k);
  }

  function piscarTopo(k) {
    piscas.forEach((p, i) => {
      let on = k > p.a;
      if (on && !reducedMotion) on = (tempo * 0.75 + p.fase) % 1 < 0.22;
      const s = on ? 1 : 0;
      piscaIM.setMatrixAt(i, s ? m4.makeScale(0.05, 0.05, 0.05).setPosition(p.p) : zero);
      piscaHalo.setMatrixAt(i, s ? m4.makeScale(0.2, 0.2, 0.2).setPosition(p.p) : zero);
    });
    piscaIM.instanceMatrix.needsUpdate = piscaHalo.instanceMatrix.needsUpdate = true;
    piscaIM.visible = piscaHalo.visible = piscas.length > 0;
  }

  function aplicarTelas(k) {
    for (const { t, a, b, seed } of telas) {
      const u = trecho(k, a, b);
      // Abre como tubo de TV (linha → quadro) e estabiliza cintilando.
      t.ligar(cintila(k, a, b, seed), u <= 0 ? 0 : suave(Math.min(1, u / 0.35)));
    }
    for (const { f, a, b, seed } of faixas) {
      const u = trecho(k, a, b);
      f.ligar(cintila(k, a, b, seed), u <= 0 ? 0 : suave(Math.min(1, u / 0.4)));
    }
    for (const { l, a, b, seed } of letreiros) {
      // Letras acendem em sequência; cada uma falha um pouco antes de firmar.
      const passo = (b - a) / (l.n + 2);
      const brilhos = [];
      for (let i = 0; i < l.n; i++) brilhos.push(cintila(k, a + i * passo, a + (i + 3) * passo, seed * 13 + i));
      l.ligar(brilhos);
    }
  }

  function setProgress(k) {
    kAtual = k;
    root.visible = k > 0;
    aplicarReformas(k);
    if (k <= 0) return;
    neon.setK(k);
    aplicarPecas(k);
    aplicarLuzes(k);
    aplicarTelas(k);
  }

  function update(t, dt, k) {
    tempo = t;
    if (reducedMotion) return;
    neon.uTempo.value = t;
    for (const { t: tela, a } of telas) if (k > a) tela.pintar(t);
    for (const { f, a } of faixas) if (k > a) f.rolar(t);
    piscarTopo(kAtual);
  }

  return { setProgress, update };
}
