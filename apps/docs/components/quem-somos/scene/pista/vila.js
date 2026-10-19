// Pista de bicicleta da Vila SEMEC: a parte temática da Vila SEMEC (dono:
// zona "vila" — os retângulos B, no miolo do "S" a oeste, e b, no miolo do
// grampo a leste, de zonas.js).
//
// Praças legíveis de cima (a câmera é alta), com grama entre elas:
//   B, de norte para sul — Jardim dos Tokens (canteiros nas cores dos
//     tokens, botões gigantes do Design System, caminho de amostras),
//     Praça dos Mascotes (totem do Design System com a estrela girando e
//     as estátuas dos mascotes do time em volta, bandeirinhas e luzinhas)
//     e Mini Vila SEMEC (maquetes da sede e dos ginásios, fonte,
//     bicicletário).
//   b — Praça do Código ({ } </> ; gigantes, as insígnias das Stacks,
//     canteiros, bicicletário, bandeirinhas e luzinhas).
// Onde fica cada peça: vila-layout.js (puro; cada peça é conferida contra
// zonas.naZona e zonas.alturaMax antes de montar — a que não cabe é pulada
// com aviso). As peças: vila-pecas.js e vila-monumentos.js; o atlas das
// placas: vila-rotulos.js; as estátuas: vila-estatuas.js.
//
// Custo (draw calls): as peças fixas vão TODAS para o lote compartilhado
// (ctx.add, nenhum draw call a mais); a vila acrescenta 5 malhas — o atlas
// das placas, as estátuas (um só merge que gira no shader), os balões, as
// bandeirinhas e as luzinhas (três InstancedMesh). No `lite`: 4 estátuas,
// menos flores, balões, bandeirinhas e luzinhas. Medido: ~78 mil
// triângulos (51 mil são as estátuas) no nível alto, ~40 mil no `lite`.
//
// Animação: balões balançando, bandeirinhas ao vento, luzinhas piscando e
// as estátuas girando devagar; na festa tudo acelera e sobem fogos do
// totem e da Praça do Código; na largada as luzinhas acompanham o
// semáforo. Com reducedMotion: tudo parado (estátuas de frente).
//
// Reserva os retângulos B e b inteiros (ctx.reservar) para a paisagem não
// plantar árvore aqui: o verde da vila são os ipês, arbustos e flores
// daqui mesmo.
//
// Contrato em comum.js.

import * as THREE from "three";
import { criarLote, wx, wz } from "./comum";
import {
  ALT_MASTRO,
  ALT_PEDESTAL,
  CAMINHOS,
  MASCOTES,
  MASCOTES_LITE,
  MASTROS,
  MESA_MINI_VILA,
  PRACA,
  PRACAS,
  VARAIS,
  anelEstatuas,
  naoCabe,
  pegada,
  todasPecas,
} from "./vila-layout";
import { criarRotulos } from "./vila-rotulos";
import { montarEstatuas } from "./vila-estatuas";
import {
  novaPeca,
  pecaArbusto,
  pecaBanco,
  pecaBicicletario,
  pecaBotao,
  pecaCanteiro,
  pecaIpe,
  pecaPlaca,
  pecaPoste,
  pecaSwitch,
  pecaCheckbox,
  pecaTeclado,
  flor,
} from "./vila-pecas";
import {
  geoEstrela,
  maqueteBackEnd,
  maqueteDados,
  maqueteFrontEnd,
  maqueteSemec,
  pecaCodigo,
  pecaFonte,
  pecaMastro,
  pecaMedalha,
  pecaPedestal,
  pecaTotem,
} from "./vila-monumentos";

// Cores da vila (todas de tokens).
function coresVila(ctx) {
  const { pv, mix, white, cor } = ctx;
  return {
    lite: ctx.lite,
    mix,
    white,
    branco: white,
    madeira: cor.madeira,
    ripa: mix(pv("yellow-800"), pv("yellow-400"), 0.35),
    ferro: mix(pv("gray-700"), pv("gray-800"), 0.5),
    escuro: pv("gray-800"),
    pneu: cor.pneu,
    folha: cor.folhaA,
    folhaEsc: cor.folhaB,
    folhaClara: mix(pv("green-500"), pv("green-600"), 0.4),
    caule: pv("green-700"),
    terraEsc: mix(pv("yellow-800"), pv("gray-800"), 0.45),
    mureta: mix(pv("gray-200"), pv("yellow-400"), 0.1),
    piso: mix(pv("gray-200"), pv("yellow-400"), 0.08),
    pisoClaro: mix(pv("gray-100"), pv("yellow-400"), 0.06),
    pedra: mix(pv("gray-400"), pv("gray-300"), 0.5),
    pedraClara: mix(pv("gray-200"), pv("gray-100"), 0.5),
    marmore: mix(pv("gray-50"), white, 0.5),
    azul: pv("blue-700"),
    azulEsc: pv("blue-900"),
    amarelo: pv("yellow-500"),
    vermelho: pv("red-500"),
    tecla: mix(pv("gray-100"), white, 0.5),
    ipe: pv("yellow-500"),
    // Maquetes (as cores dos prédios de buildings/).
    maqueteBase: mix(pv("gray-100"), white, 0.4),
    maqueteGrama: mix(pv("green-500"), pv("green-600"), 0.3),
    bege: mix(pv("gray-100"), pv("yellow-400"), 0.12),
    begeClaro: mix(pv("gray-50"), pv("yellow-400"), 0.08),
    laje: pv("gray-200"),
    navy: pv("blue-900"),
    vidro: mix(pv("blue-200"), white, 0.2),
    vidroEsc: mix(pv("gray-800"), pv("blue-900"), 0.4),
    vidroAzul: mix(pv("blue-400"), pv("blue-300"), 0.4),
    vidroAzul2: mix(pv("blue-500"), pv("blue-300"), 0.3),
    caixilho: mix(pv("blue-100"), white, 0.4),
    grafite: mix(pv("gray-700"), pv("gray-800"), 0.5),
    grafiteClaro: pv("gray-600"),
    led: pv("green-500"),
    unidade: mix(pv("gray-100"), white, 0.4),
    ambar: mix(pv("yellow-400"), pv("yellow-500"), 0.5),
    agua: mix(pv("blue-300"), pv("blue-400"), 0.4),
    aguaClara: mix(pv("blue-100"), white, 0.4),
    // Esculturas de código.
    chave: pv("blue-600"),
    tagLado: pv("red-500"),
    tagBarra: pv("yellow-500"),
    pontoV: pv("green-600"),
  };
}

export function montarVila(ctx) {
  const { pv, mix, white, lite, reducedMotion, track, root, zonas } = ctx;
  const rand = ctx.semente(20261020);
  const cor = coresVila(ctx);
  const tok = (id) => (id === "white" ? white : pv(id));

  // Os retângulos B e b ficam com a vila (a paisagem desvia).
  for (const r of zonas.ZONAS.vila) ctx.reservar(r.x0, r.x1, r.y0, r.y1);

  // ---- Atlas das placas da vila ---------------------------------------------------
  const rot = criarRotulos(ctx);
  track(rot.tex);
  for (const p of rot.cargas) ctx.carregar(p).catch(() => {});
  const loteRot = criarLote({ uv: true });

  // ---- Colocar uma peça: confere a pegada, monta e passa para o mundo ---------------
  const luzes = []; // { p: Vector3, tipo }
  const pegadas = []; // [x0, x1, y0, y1] (tiles) já ocupados (para o mato)
  const mundo = (x, y, giro, h = 0) => new THREE.Matrix4().makeTranslation(wx(x), h, wz(y)).multiply(new THREE.Matrix4().makeRotationY(giro));
  const colocar = (p, montar) => {
    const motivo = naoCabe(zonas, p);
    if (motivo) {
      console.warn(`[pista] vila: "${p.tipo}" em (${p.x}, ${p.y}) não cabe — ${motivo}`);
      return false;
    }
    const [rx, ry] = pegada(p);
    pegadas.push([p.x - rx, p.x + rx, p.y - ry, p.y + ry]);
    const k = novaPeca();
    montar(k);
    const m = mundo(p.x, p.y, p.giro ?? 0);
    for (const [g, c] of k.partes) {
      g.applyMatrix4(m);
      ctx.add(g, c);
    }
    for (const [regiao, w, h, ml] of k.placas) loteRot.add(new THREE.PlaneGeometry(w, h), rot.regioes[regiao], m.clone().multiply(ml));
    for (const l of k.luzes) luzes.push({ p: new THREE.Vector3(l.x, l.y, l.z).applyMatrix4(m), tipo: l.tipo });
    return true;
  };

  // ---- Chão: praças, caminhos e a mesa da Mini Vila ------------------------------------
  {
    const k = novaPeca();
    for (const pr of PRACAS) {
      const r = pr.r;
      const disco = (rr, h0, h1, c, seg = lite ? 18 : 28) => k.cil(c, wx(pr.x), wz(pr.y), rr, rr, h0, h1, seg);
      disco(r, -0.02, 0.03, cor.pedraClara);
      disco(r - 0.12, 0.03, 0.036, cor.piso);
      disco(r * 0.55, 0.036, 0.042, cor.amarelo);
      disco(r * 0.55 - 0.14, 0.042, 0.048, cor.pisoClaro);
      // Raios do piso (oito faixas azuis da borda até o anel amarelo).
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const rm = (r - 0.12 + r * 0.55) / 2;
        k.caixa(cor.azul, wx(pr.x) + Math.sin(a) * rm, wz(pr.y) + Math.cos(a) * rm, 0.12, r - 0.12 - r * 0.55, 0.036, 0.04, a);
      }
    }
    const mv = MESA_MINI_VILA;
    k.caixa(cor.pedraClara, wx((mv.x0 + mv.x1) / 2), wz((mv.y0 + mv.y1) / 2), mv.x1 - mv.x0, mv.y1 - mv.y0, -0.02, 0.025);
    k.caixa(cor.maqueteGrama, wx((mv.x0 + mv.x1) / 2), wz((mv.y0 + mv.y1) / 2), mv.x1 - mv.x0 - 0.3, mv.y1 - mv.y0 - 0.3, 0.025, 0.03);
    const amostras = [pv("blue-900"), pv("blue-700"), pv("blue-500"), pv("blue-300"), pv("yellow-500"), pv("red-500"), pv("green-600"), pv("gray-200")];
    for (const cm of CAMINHOS) {
      const cx = wx((cm.x0 + cm.x1) / 2);
      const cz = wz((cm.y0 + cm.y1) / 2);
      if (cm.cor === "amostras") {
        // Pedras de pisar nas cores dos tokens (as "amostras").
        let i = 0;
        for (let y = cm.y0 + 0.45; y < cm.y1; y += 0.85, i++) k.caixa(amostras[i % amostras.length], cx, wz(y), 0.75, 0.7, -0.02, 0.04);
      } else {
        k.caixa(cor.piso, cx, cz, cm.x1 - cm.x0, cm.y1 - cm.y0, -0.02, 0.05);
        // Meio-fio claro dos lados.
        const vert = cm.y1 - cm.y0 > cm.x1 - cm.x0;
        for (const s of [-1, 1]) {
          if (vert) k.caixa(cor.pisoClaro, cx + (s * (cm.x1 - cm.x0)) / 2, cz, 0.08, cm.y1 - cm.y0, -0.02, 0.07);
          else k.caixa(cor.pisoClaro, cx, cz + (s * (cm.y1 - cm.y0)) / 2, cm.x1 - cm.x0, 0.08, -0.02, 0.07);
        }
      }
      pegadas.push([cm.x0, cm.x1, cm.y0, cm.y1]);
    }
    for (const [g, c] of k.partes) ctx.add(g, c);
    for (const pr of PRACAS) pegadas.push([pr.x - pr.r, pr.x + pr.r, pr.y - pr.r, pr.y + pr.r]);
    pegadas.push([mv.x0, mv.x1, mv.y0, mv.y1]);
  }

  // ---- Peças do layout ------------------------------------------------------------------
  const coresBike = [pv("blue-700"), pv("red-500"), pv("yellow-500"), pv("green-600")];
  const botoes = {
    primario: [pv("blue-700"), pv("blue-900")],
    secundario: [white, pv("blue-700")],
    perigo: [pv("red-600"), pv("red-800")],
    sucesso: [pv("green-600"), pv("green-800")],
  };
  const maquetes = { frontend: maqueteFrontEnd, backend: maqueteBackEnd, dados: maqueteDados, semec: maqueteSemec };
  const ancorasBaloes = [];
  let estrelaTopo = null;
  const lugaresEstatuas = [];
  const ms = lite ? MASCOTES.filter((m) => MASCOTES_LITE.includes(m.id)) : MASCOTES;
  const anel = anelEstatuas(ms.length);

  for (const p of todasPecas(lite)) {
    switch (p.tipo) {
      case "placa":
        colocar(p, (k) => pecaPlaca(k, cor, p.texto, p.w));
        break;
      case "canteiro":
        colocar(p, (k) => pecaCanteiro(k, cor, p, tok(p.flor), lite, rand));
        break;
      case "botao":
        colocar(p, (k) => pecaBotao(k, cor, botoes[p.variante][0], botoes[p.variante][1], p.variante));
        break;
      case "banco":
        colocar(p, (k) => pecaBanco(k, cor));
        break;
      case "poste":
        colocar(p, (k) => pecaPoste(k, cor));
        break;
      case "ipe":
        colocar(p, (k) => pecaIpe(k, cor, rand() < 0.75 ? pv("yellow-500") : mix(pv("red-300"), white, 0.25), rand));
        break;
      case "maquete":
        colocar(p, (k) => {
          maquetes[p.modelo](k, cor);
          // A placa SEMEC da sede usa o atlas compartilhado (região "semec").
          if (p.modelo === "semec") ctx.placa("semec", p.x, p.y + 0.95, 0.84, 1.2, 0.3, { deFrente: true });
        });
        break;
      case "fonte":
        colocar(p, (k) => pecaFonte(k, cor, p.r));
        break;
      case "bicicletario":
        colocar(p, (k) => pecaBicicletario(k, cor, p.n, coresBike));
        break;
      case "teclado":
        colocar(p, (k) => pecaTeclado(k, cor));
        break;
      case "switch":
        colocar(p, (k) => pecaSwitch(k, cor));
        break;
      case "checkbox":
        colocar(p, (k) => pecaCheckbox(k, cor));
        break;
      case "codigo":
        colocar(p, (k) => pecaCodigo(k, cor, p.glifo));
        break;
      case "medalha":
        colocar(p, (k) => pecaMedalha(k, cor, pv(p.cor), `insignia-${p.id}`));
        break;
      case "baloes":
        if (colocar(p, (k) => k.caixa(cor.pedra, 0, 0, 0.3, 0.3, 0, 0.16))) ancorasBaloes.push(p);
        break;
      case "totem":
        colocar(p, (k) => {
          const hEstrela = pecaTotem(k, cor, [pv("blue-900"), pv("blue-700"), pv("blue-500"), pv("green-600"), pv("yellow-500"), pv("red-500")]);
          estrelaTopo = hEstrela;
        });
        break;
      case "estatua": {
        const m = p.mascote;
        const i = ms.indexOf(m);
        colocar(p, (k) => pecaPedestal(k, cor, pv(m.cor), `nome-${m.nome.toLowerCase()}`));
        lugaresEstatuas.push({
          arquivo: m.arquivo,
          alt: m.alt,
          porMaior: m.porMaior,
          x: wx(anel[i].x),
          z: wz(anel[i].y),
          h: ALT_PEDESTAL + (m.flutua ?? 0),
          fase: reducedMotion ? 0 : rand() * Math.PI * 2,
          vel: 0.32 + rand() * 0.12,
        });
        break;
      }
      case "mastro":
        colocar(p, (k) => pecaMastro(k, cor, ALT_MASTRO));
        break;
      default:
        break;
    }
  }

  // ---- Estátuas (e a estrela do totem): uma malha que gira no shader -------------------
  const extras = [];
  if (estrelaTopo !== null) {
    const g = ctx.vertexColored([[geoEstrela(), pv("yellow-400")]]);
    g.translate(wx(PRACA.x), estrelaTopo, wz(PRACA.y));
    extras.push({ geo: g, x: wx(PRACA.x), z: wz(PRACA.y), fase: 0, vel: 1.1 });
  }
  const estatuas = montarEstatuas(ctx, lugaresEstatuas, extras);

  // ---- Mato: arbustos e tufos de flores nos vãos (com grama entre as praças) ---------------
  {
    const livreAqui = (x, y, r) => {
      for (const [x0, x1, y0, y1] of pegadas) if (x + r > x0 - 0.3 && x - r < x1 + 0.3 && y + r > y0 - 0.3 && y - r < y1 + 0.3) return false;
      for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, 0]]) if (!zonas.naZona("vila", x + dx, y + dy)) return false;
      return zonas.alturaMax(x, y) >= 0.7;
    };
    const coresTufo = [pv("yellow-500"), pv("red-400"), white, pv("blue-300"), mix(pv("red-300"), pv("blue-300"), 0.5), pv("yellow-400")];
    for (const r of zonas.ZONAS.vila) {
      for (let y = r.y0 + 0.5; y <= r.y1; y += 1.05) {
        for (let x = r.x0 + 0.5; x <= r.x1; x += 1.05) {
          if (rand() > (lite ? 0.07 : 0.4)) continue;
          const px = x + (rand() - 0.5) * 0.7;
          const py = y + (rand() - 0.5) * 0.7;
          if (!livreAqui(px, py, 0.35)) continue;
          const k = novaPeca();
          if (rand() < 0.55) pecaArbusto(k, cor, rand);
          else {
            const c = coresTufo[Math.floor(rand() * coresTufo.length)];
            const n = lite ? 2 : 3 + Math.floor(rand() * 3);
            for (let i = 0; i < n; i++) flor(k, cor, (rand() - 0.5) * 0.45, (rand() - 0.5) * 0.45, mix(c, white, rand() * 0.2), lite, rand);
            k.bola(cor.folha, 0, 0.06, 0, 0.12, 0, 0.6);
          }
          const m = mundo(px, py, rand() * Math.PI * 2);
          for (const [g, c] of k.partes) {
            g.applyMatrix4(m);
            ctx.add(g, c);
          }
        }
      }
    }
  }

  // ---- Varais: cordas (lote), bandeirinhas e luzinhas -------------------------------------
  const flamulas = []; // { x, y, z, giro, fase, cor }
  const coresFlamula = [pv("blue-700"), pv("yellow-500"), pv("red-500"), pv("green-600"), white, pv("blue-400")];
  const coresVaral = [pv("yellow-400"), pv("red-400"), pv("blue-300"), pv("green-500"), white];
  for (const v of VARAIS) {
    const a = MASTROS[v.de];
    const b = MASTROS[v.para];
    const ax = wx(a.x);
    const az = wz(a.y);
    const bx = wx(b.x);
    const bz = wz(b.y);
    const comp = Math.hypot(bx - ax, bz - az);
    const giro = -Math.atan2(bz - az, bx - ax);
    const topo = ALT_MASTRO - 0.08;
    const flecha = Math.min(0.5, comp * 0.06);
    const alturaEm = (s) => topo - flecha * 4 * s * (1 - s);
    const SEG = 10;
    const pontos = Array.from({ length: SEG + 1 }, (_, i) => new THREE.Vector3(ax + ((bx - ax) * i) / SEG, alturaEm(i / SEG), az + ((bz - az) * i) / SEG));
    for (let i = 0; i < SEG; i++) {
      const p0 = pontos[i];
      const p1 = pontos[i + 1];
      const l = p0.distanceTo(p1);
      const g = new THREE.BoxGeometry(l, 0.018, 0.018);
      const meio = p0.clone().add(p1).multiplyScalar(0.5);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), p1.clone().sub(p0).normalize());
      g.applyMatrix4(new THREE.Matrix4().compose(meio, q, new THREE.Vector3(1, 1, 1)));
      ctx.add(g, cor.ferro);
    }
    const passo = v.tipo === "bandeiras" ? (lite ? 0.62 : 0.38) : lite ? 0.7 : 0.42;
    const n = Math.max(2, Math.floor(comp / passo));
    for (let i = 1; i < n; i++) {
      const s = i / n;
      const x = ax + (bx - ax) * s;
      const z = az + (bz - az) * s;
      const y = alturaEm(s);
      if (v.tipo === "bandeiras") flamulas.push({ x, y, z, giro, fase: rand() * 6, cor: coresFlamula[i % coresFlamula.length] });
      else luzes.push({ p: new THREE.Vector3(x, y - 0.07, z), tipo: "varal", cor: coresVaral[i % coresVaral.length] });
    }
  }

  // ---- Malhas instanciadas: balões, bandeirinhas e luzinhas ---------------------------------
  const dummy = new THREE.Object3D();
  const instanciado = (geo, mat, n) => {
    const mesh = new THREE.InstancedMesh(track(geo), mat, Math.max(1, n));
    mesh.count = n;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    // Balançam: a caixa de repouso não serve para o corte.
    mesh.frustumCulled = false;
    root.add(mesh);
    return mesh;
  };

  // Balões: cachos de 3–5 presos num peso, cada um inclinado para fora.
  const baloes = [];
  const coresBalao = [pv("red-500"), pv("yellow-500"), pv("blue-500"), pv("green-500"), white, mix(pv("red-300"), pv("blue-300"), 0.5), pv("blue-700")];
  for (const an of ancorasBaloes) {
    const n = lite ? 3 : 4 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.6;
      const incl = 0.16 + rand() * 0.14;
      baloes.push({ x: wx(an.x), z: wz(an.y), ax: Math.cos(a) * incl, az: Math.sin(a) * incl, s: 0.88 + rand() * 0.18, fase: rand() * 6, cor: coresBalao[Math.floor(rand() * coresBalao.length)] });
    }
  }
  const L = 1.55;
  const geoBalao = ctx.vertexColored([
    [new THREE.BoxGeometry(0.014, L, 0.014).translate(0, L / 2, 0), mix(white, pv("gray-200"), 0.3)],
    [new THREE.ConeGeometry(0.05, 0.08, 5).rotateX(Math.PI).translate(0, L + 0.03, 0), white],
    [new THREE.IcosahedronGeometry(0.25, lite ? 0 : 1).scale(1, 1.18, 1).translate(0, L + 0.32, 0), white],
    [new THREE.IcosahedronGeometry(0.06, 0).translate(-0.08, L + 0.45, 0.17), mix(white, pv("blue-50"), 0.5)],
  ]);
  const matBalao = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.05, flatShading: true }));
  const meshBaloes = baloes.length ? instanciado(geoBalao, matBalao, baloes.length) : null;
  if (!meshBaloes) geoBalao.dispose();
  baloes.forEach((b, i) => meshBaloes.setColorAt(i, b.cor));
  const poseBaloes = (t, amp) => {
    baloes.forEach((b, i) => {
      dummy.position.set(b.x, 0.14, b.z);
      dummy.rotation.set(b.ax + Math.sin(t * 1.3 + b.fase) * 0.06 * amp, 0, b.az + Math.cos(t * 1.1 + b.fase) * 0.06 * amp);
      dummy.scale.setScalar(b.s);
      dummy.updateMatrix();
      meshBaloes.setMatrixAt(i, dummy.matrix);
    });
    meshBaloes.instanceMatrix.needsUpdate = true;
  };
  if (meshBaloes) poseBaloes(0, 0);

  // Bandeirinhas: triângulo pendurado pela borda de cima (dupla face).
  const tri = new THREE.Shape();
  tri.moveTo(-0.13, 0);
  tri.lineTo(0.13, 0);
  tri.lineTo(0, -0.28);
  tri.closePath();
  const frente = new THREE.ShapeGeometry(tri);
  const verso = new THREE.ShapeGeometry(tri).rotateY(Math.PI);
  const geoFlamula = ctx.vertexColored([
    [frente, white],
    [verso, white],
  ]);
  const meshFlamulas = flamulas.length ? instanciado(geoFlamula, ctx.matInst, flamulas.length) : null;
  if (!meshFlamulas) geoFlamula.dispose();
  flamulas.forEach((f, i) => meshFlamulas.setColorAt(i, f.cor));
  const poseFlamulas = (t, amp) => {
    flamulas.forEach((f, i) => {
      dummy.position.set(f.x, f.y, f.z);
      dummy.rotation.set(Math.sin(t * 2.6 + f.fase) * 0.28 * amp, f.giro, 0, "YXZ");
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      meshFlamulas.setMatrixAt(i, dummy.matrix);
    });
    meshFlamulas.instanceMatrix.needsUpdate = true;
  };
  if (meshFlamulas) poseFlamulas(0, 0.5);

  // Luzinhas: lâmpadas dos postes (quentes), do totem (piscam) e dos varais.
  const quente = mix(pv("yellow-400"), white, 0.55);
  const apagada = mix(pv("gray-600"), pv("gray-400"), 0.3);
  const geoLuz = lite ? new THREE.OctahedronGeometry(0.07, 0) : new THREE.IcosahedronGeometry(0.06, 0);
  const matLuz = track(new THREE.MeshBasicMaterial({ color: white }));
  const meshLuzes = luzes.length ? instanciado(geoLuz, matLuz, luzes.length) : null;
  if (!meshLuzes) geoLuz.dispose();
  luzes.forEach((l, i) => {
    l.fase = rand() * 6;
    l.base = l.tipo === "lampada" ? quente : l.tipo === "pisca" ? [pv("yellow-400"), pv("blue-300"), white, pv("red-400")][i % 4] : l.cor;
    dummy.position.copy(l.p);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(l.tipo === "lampada" ? 1.7 : 1);
    dummy.updateMatrix();
    meshLuzes.setMatrixAt(i, dummy.matrix);
    meshLuzes.setColorAt(i, l.base);
  });
  if (meshLuzes?.instanceColor) meshLuzes.instanceColor.needsUpdate = true;
  const tmpCor = new THREE.Color();
  let corLargada = null; // cor forçada nas luzinhas dos varais (semáforo)
  let largadaAte = 0;
  const pintarLuzes = (t, rapido) => {
    luzes.forEach((l, i) => {
      if (l.tipo === "lampada") return;
      if (corLargada && l.tipo === "varal") {
        meshLuzes.setColorAt(i, corLargada);
        return;
      }
      if (l.tipo === "varal") {
        // "Corrida" de luz pelo varal: uma em cada três acesa por vez.
        const acesa = (i + Math.floor(t * (rapido ? 9 : 2.5))) % 3 !== 0;
        meshLuzes.setColorAt(i, acesa ? l.base : tmpCor.copy(l.base).lerp(apagada, 0.7));
      } else {
        const k = 0.5 + 0.5 * Math.sin(t * (rapido ? 9 : 3) + l.fase);
        meshLuzes.setColorAt(i, tmpCor.copy(apagada).lerp(l.base, 0.25 + 0.75 * k));
      }
    });
    if (meshLuzes.instanceColor) meshLuzes.instanceColor.needsUpdate = true;
  };

  // ---- Fecha o atlas da vila ------------------------------------------------------------------
  const matRot = track(new THREE.MeshStandardMaterial({ map: rot.tex, roughness: 0.7, metalness: 0, alphaTest: 0.5, side: THREE.DoubleSide }));
  const meshRot = loteRot.fechar(matRot);
  if (meshRot) {
    track(meshRot.geometry);
    meshRot.castShadow = false;
    meshRot.receiveShadow = !lite;
    root.add(meshRot);
  }

  // ---- Eventos ------------------------------------------------------------------------------------
  let festaT = -1;
  let agora = 0;
  let ultimaLuz = -1;
  let ultimoFogo = -1;
  const origemFogo = new THREE.Vector3();
  const focos = [
    [wx(PRACA.x), wz(PRACA.y), (estrelaTopo ?? 4) + 0.6],
    [wx(66), wz(25.2), 2.6],
  ];

  return {
    update(t, dt) {
      agora = t;
      estatuas.update(t, dt);
      if (reducedMotion) return;
      const emFesta = festaT >= 0 && festaT < 7;
      if (festaT >= 0) festaT += dt;
      const amp = emFesta ? 3 : 1;
      if (meshBaloes) poseBaloes(t, amp);
      if (meshFlamulas) poseFlamulas(t, emFesta ? 2 : 1);
      if (corLargada && t > largadaAte && largadaAte > 0) corLargada = null;
      if (meshLuzes && t - ultimaLuz > 0.1) {
        ultimaLuz = t;
        pintarLuzes(t, emFesta);
      }
      // Fogos do totem e da Praça do Código nos primeiros 4 s da festa.
      if (emFesta && festaT < 4 && festaT - ultimoFogo > 0.8) {
        ultimoFogo = festaT;
        for (const [fx, fz, fy] of focos) {
          origemFogo.set(fx, fy, fz);
          ctx.soltar(origemFogo, lite ? 14 : 26, { vel: 2.6, sobe: 1.2, vida: 1.0, cores: ctx.coresFogos, tam: 2 });
        }
      }
    },
    festa() {
      festaT = 0;
      ultimoFogo = -1;
      estatuas.acelerar(6);
    },
    largada(fase) {
      // As luzinhas dos varais acompanham o semáforo (vermelhas na
      // contagem, verdes por 2 s na largada). Com reducedMotion, paradas.
      if (reducedMotion) return;
      if (fase === 3 || fase === 2 || fase === 1 || fase === "vermelho") {
        corLargada = pv("red-500");
        largadaAte = 0;
      } else if (fase === "verde") {
        corLargada = pv("green-500");
        largadaAte = agora + 2;
      } else corLargada = null;
    },
    dispose() {
      estatuas.dispose();
    },
  };
}
