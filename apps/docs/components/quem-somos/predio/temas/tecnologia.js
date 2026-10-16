// Tema do 5º andar: Tecnologia e Administração (ver ./index.js).
//
// O andar não tem ilha de gabinete (`semIlha` em andares.js): no centro fica
// a Central de Operações da cidade inteligente, uma mesa com a maquete de
// uma cidade (prédios, ruas, rio) cheia de sensores com LEDs, feixes de dados
// subindo até um holograma com painéis que gira devagar.
//
// O que caracteriza cada departamento:
// - Tecnologia (lado leste, com a chefia virada para o sul): telão com terminal
//   rolando, fileira de racks de servidores com LEDs e cabos organizados na
//   eletrocalha, bancada de IoT (placa com microcontrolador, protoboard,
//   sensores, multímetro) e uma esteira com braço robótico comandada por um
//   painel de CLP.
// - Inovação e Integração (faixa norte-oeste): impressora 3D imprimindo, painel
//   de sensores na parede, quadro Kanban com post-its e pufes.
// - Sistemas (faixa norte-leste): estação com três monitores e o quadro de
//   arquitetura (caixas e setas) na parede.
// - Administrativo (faixa oeste e o miolo dela): almoxarifado com prateleiras
//   e carrinho, balcão de protocolo com pilhas de processos, quadro de chaves
//   com a miniatura do carro oficial e o relógio de ponto junto ao elevador.
//
// Planta (tiles reservados; o resto do andar segue escritorio.js):
//
//   x → 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20
// y 1   . I . P . K K R .  E  E  .  .  .  .  S  .  M  M  .    I impressora 3D, K Kanban+pufes
//   …                                                         R relógio de ponto, M monitores
//   3   . . . . . . . . .  .  .  .  .  .  .  .  .  .  .  p    p planta
//   4   o . . . . . . . .  .  .  .  .  .  .  x  x  x  .  .    x área técnica atrás dos racks
//   5   o . . A A c . . C  C  C  C  T  T  .  r  r  r  .  .    A almoxarifado, c carrinho
//   6   o . . . . . . . C  C  C  C  .  .  .  .  .  .  .  .    C Central de Operações, T telão
//   7   o . . B B q . . .  .  .  .  b  b  .  e  e  L  d  d    B protocolo, q chaves e carro
//   8   o . . . . . . . .  .  .  .  .  .  .  .  .  .  G  a    b bancada IoT, e esteira, L CLP
//                                                             G Gava (chefia, virada para o
//                                                             sul), d aparador, a arquivo
//
// Desempenho: a parte fixa vai nos `lotes` (cor lisa = mesmo draw call do
// andar); os textos impressos (Kanban, arquitetura, placas) dividem UMA
// textura; as telas dividem OUTRA (redesenhada poucas vezes por segundo). Os
// LEDs (racks, CLP e sensores da maquete) são um InstancedMesh só. Animados:
// braço (2), impressora (3) e caixas da esteira (1). A Central soma 4: mapa
// com o letreiro (textura), holograma (um mesh), feixes e pacotes de dados.
// Ao todo, uns 13 draw calls a mais.

import * as THREE from "three";

// Tiles ocupados pelo tema.
const TILES = {
  impressora: [[2, 1]],
  kanban: [[6, 1], [7, 1]],
  ponto: [[8, 1]],
  sistemas: [[18, 1], [19, 1]],
  telao: [[13, 5], [14, 5]],
  racks: [[16, 5], [17, 5], [18, 5]],
  bancada: [[13, 7], [14, 7]],
  esteira: [[16, 7], [17, 7]],
  clp: [[18, 7]],
  almox: [[4, 5], [5, 5]],
  carrinho: [[6, 5]],
  protocolo: [[4, 7], [5, 7]],
  chaves: [[6, 7]],
  // Central de Operações: mesa de 4 × 2 tiles no meio do salão.
  mesa: [[9, 5], [10, 5], [11, 5], [12, 5], [9, 6], [10, 6], [11, 6], [12, 6]],
};

// ---- Objetos que ensinam ------------------------------------------------------

const INFO_IOT = [
  "Internet das Coisas (IoT) é dar sensores e conexão a objetos do dia a dia. Nesta bancada, uma plaquinha com microcontrolador (como o ESP32) lê um sensor de temperatura e manda o valor pela internet a cada poucos segundos.",
  "Na cidade, a mesma ideia mede o nível de um rio, a umidade do ar, o consumo de energia de um prédio público ou avisa quando uma lixeira está cheia. Os dados chegam a um painel e ajudam a decidir com base em medições.",
  "E a automação? O CLP (controlador lógico programável) é um computador robusto feito para trabalhar sem parar: lê sensores e liga motores, como nesta esteira com braço robótico. Ele repete a mesma tarefa com precisão, dia e noite.",
];

const INFO_INTEGRACAO = [
  "Uma prefeitura usa muitos sistemas: um para tributos, outro para protocolo, outro para pagamentos. Quando eles não conversam, alguém precisa digitar a mesma informação de novo em cada um, e cada redigitação é uma chance de erro.",
  "Integrar é fazer os sistemas trocarem dados sozinhos, por meio de APIs: \"portas\" combinadas por onde um programa pede e recebe informações de outro. No quadro, as caixas são os sistemas e as setas, as trocas de dados.",
  "O resultado: o cidadão informa os dados uma vez só, o servidor não refaz trabalho e todo mundo consulta a mesma versão da informação, sempre atualizada.",
];

const INFO_PROCESSO = [
  "Todo pedido feito à Prefeitura vira um processo administrativo: um conjunto de documentos com número próprio, que guarda o pedido, as análises, os pareceres e a decisão. Assim tudo fica registrado e pode ser consultado depois.",
  "O caminho: o pedido é protocolado e ganha um número; depois tramita, isto é, é enviado aos setores responsáveis, que analisam e juntam suas manifestações; por fim, a autoridade competente decide e o interessado é avisado.",
  "Em Porto Velho, os processos tramitam no SEI (Sistema Eletrônico de Informações): em vez de pastas de papel indo de mesa em mesa, os documentos ficam no sistema, e dá para acompanhar em que setor o pedido está.",
];

const INFO_CIDADE = [
  "Numa cidade inteligente, sensores espalhados pelas ruas medem o que está acontecendo: postes que percebem quando há gente passando, semáforos que contam carros, lixeiras que avisam quando estão cheias e medidores do consumo de energia dos prédios públicos. Nesta maquete, cada luzinha é um desses sensores.",
  "Os dados chegam a uma central de operações, como esta, e viram painéis. Com eles a Prefeitura decide melhor e gasta menos: acende a iluminação mais forte só onde e quando precisa, ajusta o tempo dos semáforos no horário de pico, manda o caminhão de lixo às lixeiras cheias e descobre prédios que gastam energia demais.",
  "E a privacidade? Dados sobre pessoas são protegidos pela LGPD (Lei Geral de Proteção de Dados Pessoais). A Prefeitura deve coletar só o necessário para uma finalidade clara, guardar com segurança e, sempre que possível, usar dados agregados ou anonimizados: contar quantos carros passam, sem identificar quem dirige.",
];

// Gerador pseudoaleatório próprio (não mexe na sequência do escritório).
function semente(s) {
  let a = s % 2147483647;
  return () => {
    a = (a * 16807) % 2147483647;
    return (a - 1) / 2147483646;
  };
}

// Leva o UV (0..1) de uma geometria para um recorte do atlas (px, py, pw, ph
// em pixels do canvas).
function noRecorte(g, [px, py, pw, ph], CW, CH) {
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (px + uv.getX(i) * pw) / CW, 1 - (py + (1 - uv.getY(i)) * ph) / CH);
  }
  return g;
}

// Plano com UV recortado de um atlas.
function recorte(w, h, reg, CW, CH) {
  return noRecorte(new THREE.PlaneGeometry(w, h), reg, CW, CH);
}

// ---- Atlas impresso (Kanban, arquitetura, placas) -----------------------------

const AT = { W: 1024, H: 512 };
const R_KANBAN = [0, 0, 512, 320];
const R_ARQ = [512, 0, 512, 320];
const R_PROTOCOLO = [0, 336, 512, 88];
const R_ALMOX = [512, 336, 512, 88];
const R_CHAVES = [0, 432, 512, 72];

function desenharAtlas(canvas, pal, caberFonte) {
  const g = canvas.getContext("2d");
  const { pv, mix } = pal;
  const css = (c) => c.getStyle();
  const font = pal.font;
  const branco = pv("white");
  const tinta = pv("gray-700");
  const rand = semente(5005);
  g.clearRect(0, 0, AT.W, AT.H);

  // Kanban: três colunas com post-its (rabiscos no lugar do texto).
  {
    const [x0, y0, w, h] = R_KANBAN;
    g.fillStyle = css(mix(branco, pv("gray-100"), 0.4));
    g.fillRect(x0, y0, w, h);
    const cols = [
      ["A FAZER", pv("red-600")],
      ["FAZENDO", pv("yellow-600")],
      ["FEITO", pv("green-700")],
    ];
    const cw = w / 3;
    const postits = [pv("yellow-400"), pv("red-200"), pv("blue-200"), mix(pv("green-500"), branco, 0.55)];
    cols.forEach(([nome, cor], i) => {
      const cx = x0 + i * cw;
      g.fillStyle = css(cor);
      g.fillRect(cx + 6, y0 + 6, cw - 12, 44);
      g.fillStyle = css(branco);
      g.textAlign = "center";
      g.textBaseline = "middle";
      caberFonte(g, nome, 700, 30, 16, cw - 24, font);
      g.fillText(nome, cx + cw / 2, y0 + 29);
      if (i) {
        g.fillStyle = css(pv("gray-400"));
        g.fillRect(cx - 1, y0 + 56, 2, h - 64);
      }
      const n = [4, 3, 5][i];
      for (let k = 0; k < n; k++) {
        const px = cx + 14 + (k % 2) * (cw / 2 - 6) + rand() * 6;
        const py = y0 + 62 + Math.floor(k / 2) * 84 + rand() * 6;
        const s = cw / 2 - 22;
        g.save();
        g.translate(px + s / 2, py + s / 2);
        g.rotate((rand() - 0.5) * 0.14);
        g.fillStyle = css(mix(postits[(k + i) % 4], pv("gray-700"), 0.12));
        g.fillRect(-s / 2 + 3, -s / 2 + 4, s, s);
        g.fillStyle = css(postits[(k + i) % 4]);
        g.fillRect(-s / 2, -s / 2, s, s);
        g.fillStyle = css(tinta);
        for (let l = 0; l < 3; l++) g.fillRect(-s / 2 + 8, -s / 2 + 14 + l * 16, (s - 16) * (0.5 + rand() * 0.5), 4);
        g.restore();
      }
    });
    g.strokeStyle = css(pv("gray-400"));
    g.lineWidth = 4;
    g.strokeRect(x0 + 2, y0 + 2, w - 4, h - 4);
  }

  // Arquitetura: sistemas (caixas) ligados pela camada de integração (API).
  {
    const [x0, y0, w, h] = R_ARQ;
    g.fillStyle = css(branco);
    g.fillRect(x0, y0, w, h);
    g.fillStyle = css(tinta);
    g.textAlign = "left";
    g.textBaseline = "middle";
    g.font = `700 22px ${font}`;
    g.fillText("Integração dos sistemas", x0 + 18, y0 + 26);
    const azul = pv("blue-700");
    const verde = pv("green-700");
    const verm = pv("red-600");
    const caixa = (cx, cy, bw, bh, texto, cor, cheio) => {
      g.lineWidth = 4;
      g.strokeStyle = css(cor);
      g.fillStyle = css(cheio ? cor : mix(cor, branco, 0.88));
      g.beginPath();
      g.roundRect(x0 + cx - bw / 2, y0 + cy - bh / 2, bw, bh, 10);
      g.fill();
      g.stroke();
      g.fillStyle = css(cheio ? branco : cor);
      g.textAlign = "center";
      caberFonte(g, texto, 700, 22, 12, bw - 14, font);
      g.fillText(texto, x0 + cx, y0 + cy + 1);
    };
    const seta = (ax, ay, bx, by, cor) => {
      g.strokeStyle = css(cor);
      g.fillStyle = css(cor);
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(x0 + ax, y0 + ay);
      g.lineTo(x0 + bx, y0 + by);
      g.stroke();
      const a = Math.atan2(by - ay, bx - ax);
      for (const [px, py] of [[bx, by], [ax, ay]]) {
        const s = px === bx ? a : a + Math.PI;
        g.beginPath();
        g.moveTo(x0 + px, y0 + py);
        g.lineTo(x0 + px - Math.cos(s - 0.45) * 14, y0 + py - Math.sin(s - 0.45) * 14);
        g.lineTo(x0 + px - Math.cos(s + 0.45) * 14, y0 + py - Math.sin(s + 0.45) * 14);
        g.fill();
      }
    };
    const hub = [w / 2, 172];
    const nos = [
      [92, 92, "Portal do Cidadão", azul],
      [w - 92, 92, "Tributos", verde],
      [92, 262, "Protocolo", verde],
      [w - 92, 262, "Pagamentos", verde],
      [w / 2, 282, "Banco de dados", verm],
    ];
    for (const [cx, cy, , cor] of nos) {
      const dx = cx - hub[0];
      const dy = cy - hub[1];
      const d = Math.hypot(dx, dy);
      const r0 = 62;
      const r1 = d - (cy === 282 ? 26 : 68);
      seta(hub[0] + (dx / d) * r0, hub[1] + (dy / d) * (r0 * 0.5), hub[0] + (dx / d) * r1, hub[1] + (dy / d) * r1, pv("gray-600"));
    }
    caixa(hub[0], hub[1], 150, 56, "API", azul, true);
    for (const [cx, cy, t, cor] of nos) caixa(cx, cy, cy === 282 ? 170 : 160, 48, t, cor, false);
    g.strokeStyle = css(pv("gray-400"));
    g.lineWidth = 4;
    g.strokeRect(x0 + 2, y0 + 2, w - 4, h - 4);
  }

  // Placas (fundo azul-escuro, letra branca).
  const placa = ([x0, y0, w, h], texto, fundo) => {
    g.fillStyle = css(fundo);
    g.fillRect(x0, y0, w, h);
    g.fillStyle = css(mix(fundo, branco, 0.25));
    g.fillRect(x0, y0 + h - 8, w, 8);
    g.fillStyle = css(branco);
    g.textAlign = "center";
    g.textBaseline = "middle";
    caberFonte(g, texto, 700, 52, 20, w - 40, font);
    g.fillText(texto, x0 + w / 2, y0 + h / 2 - 2);
  };
  placa(R_PROTOCOLO, "PROTOCOLO", pv("blue-800"));
  placa(R_ALMOX, "ALMOXARIFADO", pv("blue-800"));
  placa(R_CHAVES, "CHAVES DA FROTA", pv("gray-700"));
}

// ---- Telas (canvas redesenhado: terminal, painéis, monitores) -----------------

const TL = { W: 1024, H: 512 };
const R_TERM = [0, 0, 512, 288];
const R_DASH = [512, 0, 512, 288];
const R_M1 = [0, 296, 240, 135];
const R_M2 = [248, 296, 240, 135];
const R_M3 = [496, 296, 240, 135];
const R_IHM = [744, 296, 160, 96];
const R_PONTO = [744, 400, 160, 80];
const R_LAPTOP = [912, 296, 112, 70];

const TERMINAL = [
  ["$ ssh admin@srv-aplicacao", 0],
  ["Conectado ao servidor de aplicação.", 1],
  ["$ systemctl status portal-api", 0],
  ["● portal-api: ativo (rodando) há 12 dias", 2],
  ["$ python3 coleta_sensores.py --enviar", 0],
  ["[ok] 48 leituras recebidas de 6 sensores", 2],
  ["[ok] dados enviados ao painel", 2],
  ["$ git pull origin main", 0],
  ["Já está atualizado.", 1],
  ["$ ping -c 1 10.0.0.12", 0],
  ["64 bytes de 10.0.0.12: tempo=0,8 ms", 1],
  ["$ df -h /dados", 0],
  ["/dev/sdb1  2,0T  1,1T  900G  55%  /dados", 1],
  ["$ backup --verificar ontem", 0],
  ["[ok] cópia de segurança íntegra", 2],
  ["$ tail -f integracao.log", 0],
  ["protocolo → tributos: 200 OK", 1],
  ["pagamentos → contabilidade: 200 OK", 1],
  ["tributos → portal: 200 OK", 1],
];

function criarTelas(pal) {
  const { pv, mix } = pal;
  const css = (c) => c.getStyle();
  const font = pal.font;
  const mono = "ui-monospace, Consolas, monospace";
  const C = {
    fundo: mix(pv("gray-950"), pv("blue-950"), 0.35),
    painel: mix(pv("gray-900"), pv("blue-950"), 0.4),
    cartao: mix(pv("gray-800"), pv("blue-900"), 0.35),
    texto: mix(pv("gray-100"), pv("white"), 0.5),
    sutil: pv("gray-400"),
    verde: pv("green-500"),
    azul: pv("blue-300"),
    amarelo: pv("yellow-400"),
    vermelho: pv("red-400"),
  };

  const canvas = document.createElement("canvas");
  canvas.width = TL.W;
  canvas.height = TL.H;
  const g = canvas.getContext("2d");

  const terminal = (t) => {
    const [x0, y0, w, h] = R_TERM;
    g.fillStyle = css(C.fundo);
    g.fillRect(x0, y0, w, h);
    g.fillStyle = css(C.cartao);
    g.fillRect(x0, y0, w, 26);
    [C.vermelho, C.amarelo, C.verde].forEach((c, i) => {
      g.fillStyle = css(c);
      g.beginPath();
      g.arc(x0 + 16 + i * 18, y0 + 13, 5, 0, Math.PI * 2);
      g.fill();
    });
    g.fillStyle = css(C.sutil);
    g.font = `600 14px ${mono}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("terminal — tecnologia", x0 + w / 2, y0 + 14);
    g.textAlign = "left";
    g.font = `500 17px ${mono}`;
    const passo = 1.4;
    const k = Math.floor(t / passo);
    const frac = (t / passo) % 1;
    const N = 11;
    for (let i = 0; i < N; i++) {
      const [txt, tipo] = TERMINAL[(k + i) % TERMINAL.length];
      const ultima = i === N - 1;
      const vis = ultima && tipo === 0 ? txt.slice(0, Math.max(2, Math.floor(txt.length * Math.min(1, frac * 1.6)))) : txt;
      g.fillStyle = css(tipo === 0 ? C.azul : tipo === 2 ? C.verde : C.texto);
      g.fillText(vis, x0 + 12, y0 + 44 + i * 22);
      if (ultima && frac % 0.5 < 0.3) {
        g.fillStyle = css(C.texto);
        g.fillRect(x0 + 14 + g.measureText(vis).width, y0 + 35, 9, 18);
      }
    }
  };

  // Valores fictícios dos sensores (variam devagar com o tempo).
  const temp = (s) => 27 + Math.sin(s * 0.35) * 1.6 + Math.sin(s * 1.3) * 0.4;
  const dash = (t) => {
    const [x0, y0, w, h] = R_DASH;
    g.fillStyle = css(C.painel);
    g.fillRect(x0, y0, w, h);
    g.fillStyle = css(C.texto);
    g.textAlign = "left";
    g.textBaseline = "middle";
    g.font = `700 20px ${font}`;
    g.fillText("Painel de sensores", x0 + 16, y0 + 22);
    g.fillStyle = css(C.verde);
    g.beginPath();
    g.arc(x0 + w - 70, y0 + 22, 6, 0, Math.PI * 2);
    g.fill();
    g.font = `600 14px ${font}`;
    g.fillText("ao vivo", x0 + w - 58, y0 + 23);
    const cards = [
      ["Temperatura", `${temp(t).toFixed(1).replace(".", ",")} °C`, C.amarelo],
      ["Umidade", `${Math.round(70 + Math.sin(t * 0.2) * 4)} %`, C.azul],
      ["Energia", `${(12.4 + Math.sin(t * 0.5) * 0.8).toFixed(1).replace(".", ",")} kW`, C.verde],
    ];
    const cw = (w - 16 * 4) / 3;
    cards.forEach(([nome, valor, cor], i) => {
      const cx = x0 + 16 + i * (cw + 16);
      g.fillStyle = css(C.cartao);
      g.fillRect(cx, y0 + 44, cw, 72);
      g.fillStyle = css(cor);
      g.fillRect(cx, y0 + 44, 5, 72);
      g.fillStyle = css(C.sutil);
      g.font = `600 14px ${font}`;
      g.fillText(nome, cx + 14, y0 + 62);
      g.fillStyle = css(C.texto);
      g.font = `700 26px ${font}`;
      g.fillText(valor, cx + 14, y0 + 94);
    });
    // Gráfico da temperatura (rola com o tempo).
    const gx = x0 + 16;
    const gy = y0 + 132;
    const gw = w - 32;
    const gh = h - 148;
    g.fillStyle = css(C.cartao);
    g.fillRect(gx, gy, gw, gh);
    g.strokeStyle = css(mix(C.cartao, C.sutil, 0.35));
    g.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      g.beginPath();
      g.moveTo(gx, gy + (gh * i) / 4);
      g.lineTo(gx + gw, gy + (gh * i) / 4);
      g.stroke();
    }
    g.strokeStyle = css(C.amarelo);
    g.lineWidth = 3;
    g.beginPath();
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const v = temp(t - (n - i) * 0.5);
      const px = gx + (gw * i) / n;
      const py = gy + gh - ((v - 24.5) / 5) * gh;
      if (i) g.lineTo(px, py);
      else g.moveTo(px, py);
    }
    g.stroke();
  };

  // Monitores da estação de Sistemas: código, registro e gráfico de barras.
  const m1 = () => {
    const [x0, y0, w, h] = R_M1;
    g.fillStyle = css(C.fundo);
    g.fillRect(x0, y0, w, h);
    const r = semente(77);
    const cores = [C.azul, C.verde, C.amarelo, C.texto, C.vermelho];
    for (let i = 0; i < 11; i++) {
      let x = x0 + 10 + (i % 4 ? 14 : 0) + (i % 3 === 2 ? 14 : 0);
      for (let k = 0; k < 3 && x < x0 + w - 20; k++) {
        const lw = 14 + r() * 50;
        g.fillStyle = css(cores[Math.floor(r() * cores.length)]);
        g.fillRect(x, y0 + 8 + i * 11.5, lw, 5);
        x += lw + 6;
      }
    }
  };
  const m2 = (t) => {
    const [x0, y0, w, h] = R_M2;
    g.fillStyle = css(C.painel);
    g.fillRect(x0, y0, w, h);
    g.font = `600 11px ${mono}`;
    g.textAlign = "left";
    g.textBaseline = "middle";
    const k = Math.floor(t / 0.9);
    for (let i = 0; i < 9; i++) {
      const ok = (k + i) % 7 !== 3;
      g.fillStyle = css(ok ? C.verde : C.amarelo);
      g.fillRect(x0 + 8, y0 + 10 + i * 13.5, 6, 6);
      g.fillStyle = css(C.texto);
      g.fillText(ok ? `GET /api/v1/... 200 ${12 + ((k + i) * 7) % 40}ms` : "fila: reenviando...", x0 + 20, y0 + 14 + i * 13.5);
    }
  };
  const m3 = () => {
    const [x0, y0, w, h] = R_M3;
    g.fillStyle = css(C.painel);
    g.fillRect(x0, y0, w, h);
    const r = semente(31);
    for (let i = 0; i < 8; i++) {
      const bh = 20 + r() * (h - 40);
      g.fillStyle = css(i % 2 ? C.azul : C.verde);
      g.fillRect(x0 + 14 + i * 27, y0 + h - 10 - bh, 18, bh);
    }
  };
  // IHM do painel da esteira (contador de peças).
  const ihm = (t) => {
    const [x0, y0, w, h] = R_IHM;
    g.fillStyle = css(C.painel);
    g.fillRect(x0, y0, w, h);
    g.fillStyle = css(C.verde);
    g.fillRect(x0, y0, w, 26);
    g.fillStyle = css(C.fundo);
    g.font = `700 15px ${font}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("EM OPERAÇÃO", x0 + w / 2, y0 + 14);
    g.fillStyle = css(C.texto);
    g.font = `600 14px ${font}`;
    g.fillText("Peças", x0 + w / 2, y0 + 44);
    g.font = `700 28px ${mono}`;
    g.fillText(String(120 + Math.floor(t / 3.2)).padStart(4, "0"), x0 + w / 2, y0 + 72);
  };
  // Relógio de ponto: hora de agora.
  const ponto = () => {
    const [x0, y0, w, h] = R_PONTO;
    g.fillStyle = css(mix(pv("green-800"), pv("gray-900"), 0.4));
    g.fillRect(x0, y0, w, h);
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    g.fillStyle = css(mix(pv("green-500"), pv("white"), 0.45));
    g.font = `700 40px ${mono}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(`${hh}${d.getSeconds() % 2 ? ":" : " "}${mm}`, x0 + w / 2, y0 + 32);
    g.font = `600 14px ${font}`;
    g.fillText("Aproxime o crachá", x0 + w / 2, y0 + 64);
  };
  // Notebook da bancada: leitura do sensor chegando pela porta serial.
  const laptop = (t) => {
    const [x0, y0, w, h] = R_LAPTOP;
    g.fillStyle = css(C.fundo);
    g.fillRect(x0, y0, w, h);
    g.strokeStyle = css(C.verde);
    g.lineWidth = 2;
    g.beginPath();
    for (let i = 0; i <= 20; i++) {
      const px = x0 + 4 + ((w - 8) * i) / 20;
      const py = y0 + h / 2 - (temp(t * 2 - (20 - i) * 0.7) - 27) * 12;
      if (i) g.lineTo(px, py);
      else g.moveTo(px, py);
    }
    g.stroke();
  };

  const desenhar = (t) => {
    terminal(t);
    dash(t);
    m2(t);
    ihm(t);
    ponto();
    laptop(t);
  };
  const desenharTudo = (t) => {
    g.fillStyle = css(C.fundo);
    g.fillRect(0, 0, TL.W, TL.H);
    m1();
    m3();
    desenhar(t);
  };
  return { canvas, desenhar, desenharTudo };
}

// ---- Central de Operações: a cidade da maquete -------------------------------
// Coordenadas (u, v) de 0 a 1 sobre o tampo (u: oeste → leste, v: norte →
// sul). O mapa (textura) e as peças 3D (prédios, sensores) usam as mesmas.

const CIDADE = {
  ruasU: [0.2, 0.4, 0.6, 0.8],
  ruasV: [0.28, 0.87],
  largU: 0.034,
  largV: 0.06,
  colunas: [[0.03, 0.18], [0.22, 0.38], [0.42, 0.58], [0.62, 0.78], [0.82, 0.97]],
  // [v0, v1, tipo]: centro (prédios altos), bairro (médios), casas (telhado).
  filas: [[0.04, 0.25, "centro"], [0.32, 0.47, "bairro"], [0.69, 0.84, "casas"]],
  parques: ["1,0", "2,3"],
  praca: "1,2", // onde fica o projetor do holograma
  prefeitura: "0,2",
};
const rioV = (u) => 0.58 + 0.035 * Math.sin(u * Math.PI * 2.4 + 0.6);
const RIO_MEIA = 0.06;
// Sensores: [tipo, u, v, feixe (manda dados ao holograma)].
const SENSORES = [
  ["poste", 0.1, 0.236, true],
  ["poste", 0.5, 0.236, false],
  ["poste", 0.9, 0.236, true],
  ["poste", 0.3, 0.912, true],
  ["poste", 0.7, 0.912, false],
  ["semaforo", 0.428, 0.322, true],
  ["semaforo", 0.628, 0.83, true],
  ["lixeira", 0.244, 0.336, true],
  ["lixeira", 0.756, 0.336, false],
  ["lixeira", 0.54, 0.915, true],
  ["medidor", 0.405, 0.07, true],
  ["medidor", 0.16, 0.71, false],
  ["rio", 0.425, rioV(0.4), true],
  ["rio", 0.825, rioV(0.8), false],
];

const MESA = { W: 1024, H: 560 };
const R_MAPA = [0, 0, 1024, 460]; // proporção do tampo (3,56 × 1,6)
const R_LETREIRO = [0, 472, 1024, 78];

// Mapa da maquete (quadras, parques, rio, ruas, anéis dos sensores) e o
// letreiro da frente da mesa.
function desenharMesa(canvas, pal, caberFonte) {
  const g = canvas.getContext("2d");
  const { pv, mix } = pal;
  const css = (c) => c.getStyle();
  const [x0, y0, w, h] = R_MAPA;
  const X = (u) => x0 + u * w;
  const Y = (v) => y0 + v * h;
  const base = mix(pv("blue-950"), pv("gray-900"), 0.35);
  g.setLineDash([]);
  g.globalAlpha = 1;
  g.fillStyle = css(base);
  g.fillRect(0, 0, MESA.W, MESA.H);
  // Grade holográfica.
  g.strokeStyle = css(mix(base, pv("blue-500"), 0.22));
  g.lineWidth = 1;
  for (let x = 16; x < w; x += 32) {
    g.beginPath();
    g.moveTo(x0 + x, y0);
    g.lineTo(x0 + x, y0 + h);
    g.stroke();
  }
  for (let y = 14; y < h; y += 32) {
    g.beginPath();
    g.moveTo(x0, y0 + y);
    g.lineTo(x0 + w, y0 + y);
    g.stroke();
  }
  // Quadras, parques e a praça do projetor.
  CIDADE.filas.forEach(([v0, v1], fi) => {
    CIDADE.colunas.forEach(([u0, u1], ci) => {
      const k = `${fi},${ci}`;
      const parque = CIDADE.parques.includes(k);
      g.fillStyle = css(parque ? mix(pv("green-800"), base, 0.3) : k === CIDADE.praca ? mix(base, pv("gray-500"), 0.35) : mix(base, pv("blue-800"), 0.5));
      g.fillRect(X(u0), Y(v0), X(u1) - X(u0), Y(v1) - Y(v0));
      if (k === CIDADE.praca) {
        g.strokeStyle = css(pv("blue-300"));
        g.lineWidth = 3;
        g.beginPath();
        g.arc(X((u0 + u1) / 2), Y((v0 + v1) / 2), 28, 0, Math.PI * 2);
        g.stroke();
      }
    });
  });
  // Rio, com a margem acesa.
  const passo = 0.02;
  g.beginPath();
  for (let u = 0; u <= 1.0001; u += passo) g.lineTo(X(u), Y(rioV(u) - RIO_MEIA));
  for (let u = 1; u >= -0.0001; u -= passo) g.lineTo(X(u), Y(rioV(u) + RIO_MEIA));
  g.closePath();
  g.fillStyle = css(mix(pv("blue-600"), base, 0.25));
  g.fill();
  g.strokeStyle = css(pv("blue-300"));
  g.lineWidth = 2;
  for (const s of [-1, 1]) {
    g.beginPath();
    for (let u = 0; u <= 1.0001; u += passo) g.lineTo(X(u), Y(rioV(u) + s * RIO_MEIA));
    g.stroke();
  }
  // Ruas (por cima do rio, viram pontes) com a faixa tracejada.
  const asfalto = mix(pv("gray-700"), pv("blue-900"), 0.4);
  const faixa = mix(pv("blue-300"), pv("white"), 0.3);
  for (const v of CIDADE.ruasV) {
    g.fillStyle = css(asfalto);
    g.fillRect(x0, Y(v - CIDADE.largV / 2), w, h * CIDADE.largV);
  }
  for (const u of CIDADE.ruasU) {
    g.fillStyle = css(asfalto);
    g.fillRect(X(u - CIDADE.largU / 2), y0, w * CIDADE.largU, h);
    // Guarda-corpo da ponte.
    g.fillStyle = css(pv("yellow-400"));
    for (const s of [-1, 1]) g.fillRect(X(u + (s * CIDADE.largU) / 2) - 1.5, Y(rioV(u) - RIO_MEIA), 3, h * RIO_MEIA * 2);
  }
  g.strokeStyle = css(faixa);
  g.lineWidth = 2;
  g.setLineDash([10, 8]);
  for (const v of CIDADE.ruasV) {
    g.beginPath();
    g.moveTo(x0, Y(v));
    g.lineTo(x0 + w, Y(v));
    g.stroke();
  }
  for (const u of CIDADE.ruasU) {
    g.beginPath();
    g.moveTo(X(u), y0);
    g.lineTo(X(u), y0 + h);
    g.stroke();
  }
  g.setLineDash([]);
  // Anéis de sinal em volta de cada sensor.
  g.strokeStyle = css(pv("green-500"));
  g.lineWidth = 2;
  for (const [, u, v] of SENSORES) {
    for (const [r, a] of [[9, 0.9], [16, 0.45]]) {
      g.globalAlpha = a;
      g.beginPath();
      g.arc(X(u), Y(v), r, 0, Math.PI * 2);
      g.stroke();
    }
  }
  g.globalAlpha = 1;
  g.strokeStyle = css(pv("blue-400"));
  g.lineWidth = 4;
  g.strokeRect(x0 + 2, y0 + 2, w - 4, h - 4);

  // Letreiro.
  {
    const [lx, ly, lw, lh] = R_LETREIRO;
    g.fillStyle = css(mix(pv("gray-950"), pv("blue-950"), 0.5));
    g.fillRect(lx, ly, lw, lh);
    g.fillStyle = css(pv("blue-400"));
    g.fillRect(lx, ly, lw, 4);
    g.fillRect(lx, ly + lh - 4, lw, 4);
    g.fillStyle = css(pv("green-500"));
    for (const cx of [lx + 26, lx + lw - 26]) {
      g.beginPath();
      g.arc(cx, ly + lh / 2, 7, 0, Math.PI * 2);
      g.fill();
    }
    const texto = "CENTRAL DE OPERAÇÕES · CIDADE INTELIGENTE";
    g.fillStyle = css(pv("white"));
    g.textAlign = "center";
    g.textBaseline = "middle";
    caberFonte(g, texto, 700, 44, 20, lw - 110, pal.font);
    g.fillText(texto, lx + lw / 2, ly + lh / 2 + 1);
  }
}

const HO = { W: 512, H: 352 };
const R_HOLO = [[0, 0, 256, 160], [256, 0, 256, 160], [0, 176, 256, 160]];
const R_SOLIDO = [280, 200, 24, 24];
const R_FACHO = [320, 176, 64, 160];

// Holograma (fundo transparente): três painéis com gráficos, um recorte de
// cor cheia (anéis) e o degradê do facho de luz do projetor.
function desenharHolo(canvas, pal, caberFonte) {
  const g = canvas.getContext("2d");
  const { pv, mix } = pal;
  const css = (c) => c.getStyle();
  const r = semente(4242);
  const linha = pv("blue-300");
  const texto = mix(pv("blue-100"), pv("white"), 0.5);
  g.clearRect(0, 0, HO.W, HO.H);
  const titulos = ["ILUMINAÇÃO", "TRÂNSITO", "COLETA DE LIXO"];
  R_HOLO.forEach(([x0, y0, w, h], k) => {
    g.globalAlpha = 0.5;
    g.fillStyle = css(mix(pv("blue-900"), pv("blue-700"), 0.3));
    g.beginPath();
    g.roundRect(x0 + 4, y0 + 4, w - 8, h - 8, 12);
    g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = css(linha);
    g.lineWidth = 4;
    g.stroke();
    g.fillStyle = css(texto);
    g.textAlign = "left";
    g.textBaseline = "middle";
    caberFonte(g, titulos[k], 700, 22, 12, w - 40, pal.font);
    g.fillText(titulos[k], x0 + 18, y0 + 26);
    const gx = x0 + 18;
    const gy = y0 + 46;
    const gw = w - 36;
    const gh = h - 64;
    if (k === 0) {
      // Consumo por bairro (barras).
      for (let i = 0; i < 8; i++) {
        const bh = gh * (0.3 + r() * 0.7);
        g.fillStyle = css(i % 3 ? pv("yellow-400") : pv("green-500"));
        g.fillRect(gx + i * (gw / 8) + 3, gy + gh - bh, gw / 8 - 8, bh);
      }
    } else if (k === 1) {
      // Carros por hora (linha), com o pico da manhã e o da tarde.
      g.strokeStyle = css(pv("green-500"));
      g.lineWidth = 4;
      g.beginPath();
      for (let i = 0; i <= 24; i++) {
        const pico = Math.exp(-((i - 7.5) ** 2) / 3) + Math.exp(-((i - 18) ** 2) / 4);
        const py = gy + gh - gh * (0.12 + 0.8 * pico + r() * 0.06);
        if (i) g.lineTo(gx + (gw * i) / 24, py);
        else g.moveTo(gx, py);
      }
      g.stroke();
      g.fillStyle = css(linha);
      g.fillRect(gx, gy + gh - 2, gw, 2);
    } else {
      // Lixeiras: quanto cada uma está cheia (rosquinhas).
      [[0.35, pv("green-500")], [0.7, pv("yellow-400")], [0.95, pv("red-400")]].forEach(([f, c], i) => {
        const cx = gx + gw / 6 + (i * gw) / 3;
        const cy = gy + gh / 2;
        g.lineWidth = 10;
        g.strokeStyle = css(mix(pv("blue-900"), linha, 0.35));
        g.beginPath();
        g.arc(cx, cy, 26, 0, Math.PI * 2);
        g.stroke();
        g.strokeStyle = css(c);
        g.beginPath();
        g.arc(cx, cy, 26, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2);
        g.stroke();
        g.fillStyle = css(texto);
        g.textAlign = "center";
        g.font = `700 16px ${pal.font}`;
        g.fillText(`${Math.round(f * 100)}%`, cx, cy + 1);
      });
    }
  });
  {
    const [x0, y0, w, h] = R_SOLIDO;
    g.fillStyle = css(linha);
    g.fillRect(x0, y0, w, h);
  }
  {
    // Facho: aceso embaixo (no projetor), sumindo para cima.
    const [x0, y0, w, h] = R_FACHO;
    g.fillStyle = css(linha);
    for (let i = 0; i < h; i++) {
      g.globalAlpha = 0.65 * (i / h) ** 1.4;
      g.fillRect(x0, y0 + i, w, 1);
    }
    g.globalAlpha = 1;
  }
}

// ---- Chefia do Departamento de Tecnologia ------------------------------------------
// Na faixa leste do escritório a estação fica encostada na parede, virada
// para oeste: de perfil para a câmera (que vem do sul), a foto e o nome quase
// somem. Aqui ela sai da parede e fica no próprio departamento, junto do CLP,
// virada para o sul (de frente para a câmera), com um aparador baixo atrás,
// um arquivo ao lado e a placa do departamento suspensa logo acima (no lugar
// da bandeira da faixa, desenhada em `construir`). O aparador também tranca o
// cantinho atrás da estação, onde a placa esconderia o jogador.
const GAVA = { codigo: "6.1.6", tile: [19, 8], aparador: [19, 7], arquivo: [20, 8], planta: [20, 3] };

function chefiaTecnologia({ plano, removerDecor, reservar, tileToWorld }) {
  const ep = plano.estacoes.find((e) => e.pessoa.codigo === GAVA.codigo);
  if (!ep) return;
  // Sem a zona da faixa: o escritório não desenha tapete, divisórias nem a
  // bandeira lá no norte; as peças da faixa (plantas e arquivos) saem também.
  const zd = plano.zonas.find((z) => z.zona === ep.zona);
  if (zd) {
    removerDecor((d) => d.seg === zd.seg);
    plano.zonas.splice(plano.zonas.indexOf(zd), 1);
  }
  for (const [x, y] of ep.tiles) plano.bloq.delete(`${x},${y}`);
  const [tx, ty] = GAVA.tile;
  const p = tileToWorld(tx, ty);
  Object.assign(ep, { x: p.x, z: p.z, rot: 0, tiles: [[tx, ty]], ver: [[tx, ty + 1]], dir: "up" });
  reservar(tx, ty);
  const [ax, ay] = GAVA.aparador;
  plano.decor.push({ tipo: "aparador", x: ax, y: ay, rot: 0 });
  reservar(ax, ay);
  reservar(ax + 1, ay);
  const [qx, qy] = GAVA.arquivo;
  plano.decor.push({ tipo: "arquivo", x: qx, y: qy, rot: 0 });
  reservar(qx, qy);
  // A planta do canto norte da faixa volta (saiu com as peças da zona).
  const [px, py] = GAVA.planta;
  plano.decor.push({ tipo: "planta", x: px, y: py, rot: 0 });
  reservar(px, py);
}

// ---- Tema -----------------------------------------------------------------------

export const tecnologia = {
  planejar(ctx) {
    const { removerDecor, reservar, info, alcancavel } = ctx;
    // Libera a estante da impressora 3D (2,1), a do Kanban (6,1), a dos
    // monitores de Sistemas (18,1) e a planta onde fica o relógio de ponto.
    removerDecor((d) => d.y === 1 && ((d.tipo === "estante" && [2, 6, 18].includes(d.x)) || (d.tipo === "planta" && d.x === 8)));
    for (const lista of Object.values(TILES)) for (const [x, y] of lista) reservar(x, y);
    // Corredor atrás dos racks (2 m de altura): área técnica, fora do caminho,
    // senão os racks escondem o jogador na câmera do jogo.
    for (const [x, y] of TILES.racks) reservar(x, y - 1);
    chefiaTecnologia(ctx);
    info("iot", [...TILES.bancada, ...TILES.esteira, ...TILES.clp], "Internet das Coisas (IoT)", INFO_IOT);
    info("integracao", TILES.sistemas, "Integração de sistemas", INFO_INTEGRACAO);
    info("processo", TILES.protocolo, "Processo administrativo", INFO_PROCESSO);
    info("cidade-inteligente", TILES.mesa, "Cidade inteligente", INFO_CIDADE);
    const falhas = alcancavel();
    if (falhas.length) console.warn("Tema tecnologia: inalcançável", falhas);
  },

  construir(ctx) {
    const { root, lotes, M, pal, track, lite, reducedMotion, tileToWorld, caixa, std, makeCanvas, canvasTexture, caberFonte, FACE, plano, cor, H, criarPlacaZona } = ctx;
    const { pv, mix } = pal;
    const white = pv("white");
    const rad = lite ? 6 : 10;
    const rand = semente(2905);
    const ZN = FACE.norte;

    const mat = (c, o) => track(std(c, { roughness: 0.6, ...o }));
    const C = {
      rack: mat(mix(pv("gray-800"), pv("gray-700"), 0.35), { roughness: 0.45, metalness: 0.3 }),
      servidor: mat(mix(pv("gray-700"), pv("gray-600"), 0.4), { roughness: 0.4, metalness: 0.35 }),
      grade: mat(pv("gray-950"), { roughness: 0.7 }),
      plastico: mat(mix(pv("gray-900"), pv("gray-800"), 0.3), { roughness: 0.5 }),
      cabos: [pv("blue-500"), pv("yellow-500"), pv("green-600"), pv("red-500")].map((c) => mat(c, { roughness: 0.7 })),
      pcb: mat(mix(pv("gray-900"), pv("blue-900"), 0.35), { roughness: 0.5 }),
      sensor: mat(pv("blue-500"), { roughness: 0.5 }),
      protoboard: mat(mix(pv("gray-50"), white, 0.5), { roughness: 0.5 }),
      multimetro: mat(pv("yellow-500"), { roughness: 0.55 }),
      pegboard: mat(mix(pv("gray-200"), pv("gray-300"), 0.4), { roughness: 0.9 }),
      bracoInd: mat(mix(pv("yellow-500"), pv("yellow-400"), 0.3), { roughness: 0.45 }),
      correia: mat(pv("gray-900"), { roughness: 0.9 }),
      painel: mat(mix(pv("gray-100"), pv("gray-200"), 0.5), { roughness: 0.55, metalness: 0.1 }),
      placaPainel: mat(mix(pv("yellow-500"), pv("red-500"), 0.45), { roughness: 0.7 }),
      modulo: mat(mix(pv("gray-50"), pv("gray-200"), 0.4), { roughness: 0.5 }),
      borne: mat(pv("green-600"), { roughness: 0.6 }),
      filamento: mat(pv("red-500"), { roughness: 0.5 }),
      movel: mat(mix(pv("gray-50"), white, 0.5), { roughness: 0.6 }),
      pufes: [pv("red-400"), pv("yellow-400"), pv("blue-400")].map((c) => mat(c, { roughness: 0.95 })),
      estante: mat(mix(pv("gray-400"), pv("gray-500"), 0.4), { roughness: 0.5, metalness: 0.35 }),
      papelao: mat(mix(pv("yellow-800"), pv("yellow-400"), 0.45), { roughness: 0.95 }),
      papelaoEsc: mat(mix(pv("yellow-800"), pv("gray-700"), 0.2), { roughness: 0.95 }),
      carrinho: mat(pv("blue-700"), { roughness: 0.5 }),
      papel: mat(white, { roughness: 0.9 }),
      capas: [pv("blue-200"), pv("red-200"), mix(pv("yellow-400"), white, 0.5), mix(pv("green-500"), white, 0.55)].map((c) => mat(c, { roughness: 0.85 })),
      carro: mat(mix(white, pv("gray-50"), 0.5), { roughness: 0.35 }),
      faixaCarro: mat(pv("blue-700"), { roughness: 0.4 }),
      vidroCarro: mat(mix(pv("blue-900"), pv("gray-700"), 0.4), { roughness: 0.2 }),
      ponto: mat(mix(pv("gray-700"), pv("gray-600"), 0.3), { roughness: 0.45 }),
      canaleta: mat(pv("gray-500"), { roughness: 0.8 }),
      faixaAmarela: mat(pv("yellow-500"), { roughness: 0.8 }),
      // Central de Operações.
      pisoTec: mat(mix(pv("gray-900"), pv("blue-950"), 0.5), { roughness: 0.9 }),
      frisoTec: mat(pv("blue-400"), { roughness: 0.6 }),
      predios: [mix(white, pv("blue-100"), 0.35), mix(pv("blue-200"), pv("gray-200"), 0.5), mix(pv("gray-300"), pv("blue-300"), 0.35)].map((c) => mat(c, { roughness: 0.5 })),
      torre: mat(mix(pv("blue-400"), pv("blue-700"), 0.4), { roughness: 0.3 }),
      telhado: mat(mix(pv("red-500"), pv("yellow-800"), 0.45), { roughness: 0.8 }),
      lixeira: mat(pv("green-700"), { roughness: 0.6 }),
    };

    const add = (m, g, sombra = true) => lotes.add(m, g, sombra ? undefined : { cast: false });
    // Centro (mundo) de uma lista de tiles.
    const centro = (tiles) => {
      const v = new THREE.Vector3();
      for (const [x, y] of tiles) v.add(tileToWorld(x, y));
      return v.multiplyScalar(1 / tiles.length);
    };
    // Caixa local (frente +z) deslocada para o ponto p.
    const bx = (m, p, x0, x1, y0, y1, z0, z1, sombra = true) => add(m, caixa(p.x + x0, p.x + x1, y0, y1, p.z + z0, p.z + z1), sombra);
    const cil = (m, p, r0, r1, h, x, y, z, eixo = "y", seg = rad, sombra = true) => {
      const geo = new THREE.CylinderGeometry(r0, r1, h, seg);
      if (eixo === "x") geo.rotateZ(Math.PI / 2);
      else if (eixo === "z") geo.rotateX(Math.PI / 2);
      return add(m, geo.translate(p.x + x, y, p.z + z), sombra);
    };

    // Texturas: atlas impresso (estático) e telas (redesenhadas).
    const atlasCanvas = makeCanvas(AT.W, AT.H);
    desenharAtlas(atlasCanvas, pal, caberFonte);
    const atlasTex = track(canvasTexture(atlasCanvas));
    const atlasMat = track(new THREE.MeshStandardMaterial({ map: atlasTex, roughness: 0.6 }));
    document.fonts?.ready.then(() => {
      desenharAtlas(atlasCanvas, pal, caberFonte);
      atlasTex.needsUpdate = true;
    });
    const atlas = (p, w, h, reg, x, y, z, rotY = 0) => {
      const geo = recorte(w, h, reg, AT.W, AT.H);
      if (rotY) geo.rotateY(rotY);
      add(atlasMat, geo.translate(p.x + x, y, p.z + z), false);
    };
    const telas = criarTelas(pal);
    telas.desenharTudo(reducedMotion ? 7 : 0);
    const telasTex = track(canvasTexture(telas.canvas));
    const telasMat = track(new THREE.MeshBasicMaterial({ map: telasTex, color: mix(white, pv("gray-200"), 0.08) }));
    // Tela: plano com o recorte, girado em torno de x (inclinação) e y.
    const tela = (p, w, h, reg, x, y, z, { incl = 0, rotY = 0 } = {}) => {
      const geo = recorte(w, h, reg, TL.W, TL.H);
      if (incl) geo.rotateX(incl);
      if (rotY) geo.rotateY(rotY);
      add(telasMat, geo.translate(p.x + x, y, p.z + z), false);
    };

    // LEDs (um InstancedMesh): [x, y, z, cor, piscaPorSegundo (0 = fixo)].
    const leds = [];
    const COR_LED = { verde: pv("green-500"), azul: pv("blue-400"), ambar: pv("yellow-400"), vermelho: pv("red-500") };
    const led = (p, x, y, z, cor, pisca = 0) => leds.push([p.x + x, y, p.z + z, COR_LED[cor], pisca]);

    // ---- Tecnologia: racks de servidores -------------------------------------------
    const racks = TILES.racks.map(([x, y]) => tileToWorld(x, y));
    racks.forEach((p, i) => {
      bx(C.rack, p, -0.31, 0.31, 0.06, 2.0, -0.45, 0.36);
      bx(C.grade, p, -0.29, 0.29, 0, 0.06, -0.43, 0.34, false);
      bx(C.rack, p, -0.33, 0.33, 2.0, 2.04, -0.47, 0.38);
      // Montantes da frente e organizadores de cabo (laterais).
      for (const s of [-1, 1]) {
        bx(C.servidor, p, s * 0.31 - 0.02, s * 0.31 + 0.02, 0.06, 2.0, 0.34, 0.39);
        if (!lite) bx(C.cabos[(i + (s > 0 ? 1 : 0)) % 2], p, s * 0.255 - 0.02, s * 0.255 + 0.02, 0.2, 1.86, 0.34, 0.37);
      }
      // Servidores (gavetas) com grade de ventilação e LEDs.
      const n = lite ? 7 : 9;
      for (let k = 0; k < n; k++) {
        const y0 = 0.14 + k * (1.62 / n);
        const hh = 1.62 / n - 0.03;
        if (i === 1 && k === n - 1) {
          // Patch panel com os cabos em laço, de cores separadas por função.
          bx(C.plastico, p, -0.23, 0.23, y0, y0 + hh, 0.3, 0.38);
          for (let c = 0; c < (lite ? 4 : 8); c++) {
            const cx = -0.19 + c * (lite ? 0.12 : 0.054);
            bx(C.cabos[c % 4], p, cx - 0.008, cx + 0.008, y0 - 0.12, y0 + hh * 0.6, 0.385, 0.405, false);
          }
          continue;
        }
        bx(C.servidor, p, -0.23, 0.23, y0, y0 + hh, 0.3, 0.37);
        bx(C.grade, p, -0.2, 0.05, y0 + hh * 0.25, y0 + hh * 0.75, 0.37, 0.375, false);
        led(p, 0.12, y0 + hh / 2, 0.375, "verde");
        led(p, 0.17, y0 + hh / 2, 0.375, rand() < 0.75 ? "azul" : "ambar", 2 + rand() * 7);
      }
    });
    // Eletrocalha sobre os racks com os cabos arrumados, descendo em cada um.
    {
      const a = racks[0];
      const b = racks[racks.length - 1];
      const z = a.z - 0.12;
      add(C.servidor, caixa(a.x - 0.36, b.x + 0.36, 2.32, 2.35, z - 0.14, z + 0.14), false);
      for (const s of [-1, 1]) add(C.servidor, caixa(a.x - 0.36, b.x + 0.36, 2.35, 2.43, z + s * 0.14 - 0.01, z + s * 0.14 + 0.01), false);
      C.cabos.slice(0, lite ? 2 : 3).forEach((m, k) => {
        const geo = new THREE.CylinderGeometry(0.02, 0.02, b.x - a.x + 0.66, 6).rotateZ(Math.PI / 2);
        add(m, geo.translate((a.x + b.x) / 2, 2.37, z - 0.075 + k * 0.05), false);
      });
      for (const p of racks) {
        add(C.servidor, caixa(p.x - 0.02, p.x + 0.02, 2.04, 2.32, z - 0.02, z + 0.02), false);
        add(C.cabos[0], caixa(p.x + 0.06, p.x + 0.12, 2.04, 2.36, z - 0.03, z + 0.03), false);
      }
      // Canaleta de piso levando os cabos até a mesa da Central de Operações.
      const zc = racks[0].z + 0.52;
      add(C.canaleta, caixa(1.98, a.x - 0.25, 0, 0.022, zc - 0.07, zc + 0.07), false);
      for (const s of [-1, 1]) add(C.faixaAmarela, caixa(1.98, a.x - 0.25, 0, 0.024, zc + s * 0.06 - 0.012, zc + s * 0.06 + 0.012), false);
      add(C.canaleta, caixa(a.x - 0.3, a.x - 0.2, 0, 0.022, a.z + 0.36, zc + 0.07), false);
    }

    // ---- Tecnologia: telão com o terminal ------------------------------------------
    {
      const p = centro(TILES.telao);
      p.z -= 0.1;
      // Baixo o bastante para não esconder quem passa atrás (y = 4).
      bx(C.plastico, p, -0.8, 0.8, 0.7, 1.6, -0.07, -0.01);
      tela(p, 1.52, 0.855, R_TERM, 0, 1.15, -0.004);
      bx(C.plastico, p, -0.05, 0.05, 0.04, 0.7, -0.1, -0.04);
      bx(C.plastico, p, -0.5, 0.5, 0, 0.04, -0.4, 0.22);
      bx(C.grade, p, -0.12, 0.12, 0.04, 0.12, -0.2, 0.0);
    }

    // ---- Tecnologia: bancada de IoT --------------------------------------------------
    {
      const p = centro(TILES.bancada);
      bx(M.madeiraClara, p, -0.9, 0.9, 0.86, 0.92, -0.42, 0.3);
      for (const sx of [-0.85, 0.85]) {
        for (const sz of [-0.36, 0.24]) bx(C.servidor, p, sx - 0.025, sx + 0.025, 0, 0.86, sz - 0.025, sz + 0.025);
      }
      bx(C.servidor, p, -0.85, 0.85, 0.22, 0.25, -0.38, 0.26);
      bx(C.papelao, p, -0.6, -0.15, 0.25, 0.5, -0.32, 0.1);
      // Painel perfurado com ferramentas penduradas.
      // Painel baixo: não esconde quem passa atrás da bancada (y = 6).
      bx(C.pegboard, p, -0.9, 0.9, 0.92, 1.3, -0.44, -0.4);
      bx(C.servidor, p, -0.9, 0.9, 1.28, 1.32, -0.45, -0.38, false);
      const ferr = [[-0.7, C.cabos[3]], [-0.55, C.cabos[0]], [-0.4, C.cabos[1]], [0.45, C.cabos[3]], [0.62, C.cabos[2]]];
      for (const [fx, m] of ferr) {
        bx(m, p, fx - 0.02, fx + 0.02, 0.98, 1.08, -0.4, -0.37, false);
        bx(C.servidor, p, fx - 0.008, fx + 0.008, 1.08, 1.24, -0.395, -0.375, false);
      }
      // Rolo de fio e luminária de bancada (braço articulado).
      add(C.cabos[3], new THREE.TorusGeometry(0.07, 0.025, 6, rad).translate(p.x + 0.05, 1.12, p.z - 0.37), false);
      bx(C.plastico, p, 0.78, 0.84, 0.92, 1.26, -0.36, -0.3);
      bx(C.plastico, p, 0.55, 0.84, 1.22, 1.26, -0.36, -0.3);
      bx(C.plastico, p, 0.5, 0.62, 1.16, 1.24, -0.4, -0.26);
      // Protoboard com a placa do microcontrolador, jumpers e sensores.
      const y = 0.92;
      bx(C.protoboard, p, -0.62, -0.22, y, y + 0.025, -0.2, 0.04);
      bx(C.grade, p, -0.6, -0.24, y + 0.025, y + 0.027, -0.085, -0.075, false);
      bx(C.pcb, p, -0.56, -0.38, y + 0.025, y + 0.04, -0.17, -0.09);
      bx(M.metal, p, -0.52, -0.43, y + 0.04, y + 0.052, -0.16, -0.1);
      led(p, -0.4, y + 0.045, -0.105, "azul", 1.2);
      led(p, -0.545, y + 0.045, -0.105, "vermelho");
      if (!lite) {
        [[-0.36, C.cabos[3]], [-0.32, C.cabos[2]], [-0.28, C.cabos[1]]].forEach(([jx, m], k) => {
          bx(m, p, jx - 0.006, jx + 0.006, y + 0.025, y + 0.05 + k * 0.006, -0.06 - k * 0.02, 0.0);
        });
      }
      // Sensor de temperatura (azul gradeado) e sensor ultrassônico ("olhos").
      bx(C.sensor, p, -0.33, -0.26, y + 0.025, y + 0.085, -0.03, 0.0);
      bx(C.protoboard, p, -0.32, -0.27, y + 0.035, y + 0.075, 0.0, 0.004, false);
      bx(C.sensor, p, -0.12, 0.06, y, y + 0.08, -0.12, -0.105);
      for (const ox of [-0.075, 0.015]) cil(M.metal, p, 0.028, 0.028, 0.03, ox, y + 0.045, -0.09, "z", rad, false);
      // Multímetro (amarelo, visor e seletor) com as pontas de prova.
      bx(C.multimetro, p, 0.14, 0.32, y, y + 0.04, -0.12, 0.16);
      bx(C.grade, p, 0.165, 0.295, y + 0.04, y + 0.043, 0.06, 0.13, false);
      cil(C.plastico, p, 0.04, 0.04, 0.015, 0.23, y + 0.045, -0.02, "y", rad, false);
      bx(C.cabos[3], p, 0.32, 0.5, y, y + 0.012, 0.11, 0.125, false);
      bx(C.plastico, p, 0.32, 0.48, y, y + 0.012, 0.14, 0.155, false);
      // Notebook com o gráfico da leitura do sensor.
      bx(C.plastico, p, 0.48, 0.82, y, y + 0.02, -0.14, 0.1);
      const tamp = new THREE.Group();
      tamp.position.set(p.x + 0.65, y + 0.02, p.z - 0.14);
      tamp.rotation.x = -0.28;
      tamp.updateMatrix();
      add(C.plastico, caixa(-0.17, 0.17, 0, 0.22, -0.012, 0).applyMatrix4(tamp.matrix));
      const tlap = recorte(0.3, 0.188, R_LAPTOP, TL.W, TL.H).translate(0, 0.11, 0.002).applyMatrix4(tamp.matrix);
      add(telasMat, tlap, false);
      // Banqueta.
      cil(C.plastico, p, 0.17, 0.17, 0.05, -0.1, 0.62, 0.48);
      cil(C.servidor, p, 0.025, 0.025, 0.6, -0.1, 0.3, 0.48);
      cil(C.servidor, p, 0.16, 0.16, 0.025, -0.1, 0.012, 0.48);
    }

    // ---- Tecnologia: esteira, braço robótico e painel do CLP -----------------------
    const est = centro(TILES.esteira);
    const zb = est.z + 0.12; // eixo da correia
    {
      const p = est;
      for (const sx of [-0.85, 0.85]) {
        for (const sz of [-0.11, 0.35]) bx(C.servidor, p, sx - 0.025, sx + 0.025, 0, 0.64, sz - 0.025, sz + 0.025);
      }
      add(C.correia, caixa(p.x - 0.9, p.x + 0.9, 0.64, 0.7, zb - 0.2, zb + 0.2));
      for (const s of [-1, 1]) add(M.metal, caixa(p.x - 0.95, p.x + 0.95, 0.62, 0.74, zb + s * 0.22 - 0.02, zb + s * 0.22 + 0.02));
      for (const sx of [-0.9, 0.9]) add(M.metal, new THREE.CylinderGeometry(0.04, 0.04, 0.42, rad).rotateX(Math.PI / 2).translate(p.x + sx, 0.67, zb));
      add(C.sensor, caixa(p.x + 0.8, p.x + 0.98, 0.42, 0.6, zb - 0.12, zb + 0.08));
      // Sensor de presença (fotoelétrico) no trilho.
      add(C.multimetro, caixa(p.x - 0.1, p.x - 0.02, 0.74, 0.82, zb + 0.22, zb + 0.27));
      leds.push([p.x - 0.06, 0.8, zb + 0.272, COR_LED.ambar, 0.8]);
      // Pedestal do braço e caixa de peças prontas.
      add(C.plastico, caixa(p.x + 0.12, p.x + 0.4, 0, 0.6, est.z - 0.45, est.z - 0.18));
      add(C.correia, new THREE.CylinderGeometry(0.15, 0.15, 0.04, rad).translate(p.x + 0.26, 0.62, est.z - 0.31));
      add(C.carrinho, caixa(p.x + 0.52, p.x + 0.8, 0.5, 0.56, est.z - 0.45, est.z - 0.2));
      for (const s of [-1, 1]) add(C.carrinho, caixa(p.x + 0.52, p.x + 0.8, 0.56, 0.66, est.z - 0.325 + s * 0.12 - 0.01, est.z - 0.325 + s * 0.12 + 0.01));
      add(C.carrinho, caixa(p.x + 0.79, p.x + 0.8, 0.56, 0.66, est.z - 0.45, est.z - 0.2));
      add(C.carrinho, caixa(p.x + 0.52, p.x + 0.53, 0.56, 0.66, est.z - 0.45, est.z - 0.2));
      add(C.servidor, caixa(p.x + 0.56, p.x + 0.76, 0, 0.5, est.z - 0.42, est.z - 0.23));
      add(C.papelao, caixa(p.x + 0.56, p.x + 0.68, 0.56, 0.64, est.z - 0.4, est.z - 0.28));
    }
    {
      const p = centro(TILES.clp);
      p.z += 0.07; // um pouco ao sul: esconde menos quem passa atrás (y = 6)
      bx(C.plastico, p, -0.3, 0.3, 0, 0.28, -0.38, -0.12);
      bx(C.painel, p, -0.33, 0.33, 0.28, 1.5, -0.42, -0.1);
      bx(C.placaPainel, p, -0.28, 0.28, 0.33, 1.45, -0.1, -0.09);
      // Porta aberta (90°), presa à direita.
      bx(C.painel, p, 0.32, 0.345, 0.28, 1.5, -0.1, 0.5);
      bx(C.plastico, p, 0.345, 0.36, 0.85, 0.95, 0.38, 0.42, false);
      // IHM (tela de operação) no alto, CLP e módulos no trilho, disjuntores embaixo.
      bx(C.plastico, p, -0.24, 0.02, 1.22, 1.4, -0.09, -0.06);
      tela(p, 0.22, 0.132, R_IHM, -0.11, 1.31, -0.058);
      bx(M.metal, p, -0.26, 0.26, 1.06, 1.08, -0.09, -0.07, false);
      bx(C.modulo, p, -0.24, -0.08, 0.98, 1.17, -0.09, 0.0);
      for (let k = 0; k < 4; k++) {
        const mx = -0.07 + k * 0.075;
        bx(C.modulo, p, mx, mx + 0.065, 0.99, 1.16, -0.09, -0.01);
        bx(C.borne, p, mx + 0.005, mx + 0.06, 0.99, 1.02, -0.01, 0.005, false);
        led(p, mx + 0.032, 1.12, -0.005, k % 2 ? "verde" : "ambar", 1 + rand() * 4);
      }
      for (const [lx, cor] of [[-0.21, "verde"], [-0.18, "verde"], [-0.15, "ambar"]]) led(p, lx, 1.13, 0.005, cor, cor === "ambar" ? 1.5 : 0);
      bx(C.canaleta, p, -0.26, 0.26, 0.86, 0.92, -0.09, -0.03);
      bx(C.canaleta, p, -0.26, 0.26, 0.5, 0.56, -0.09, -0.03);
      bx(M.metal, p, -0.26, 0.26, 0.69, 0.71, -0.09, -0.07, false);
      for (let k = 0; k < 6; k++) {
        const dx = -0.24 + k * 0.08;
        bx(C.modulo, p, dx, dx + 0.07, 0.6, 0.8, -0.09, -0.02);
        bx(C.plastico, p, dx + 0.025, dx + 0.045, 0.7, 0.74, -0.02, 0.0, false);
      }
    }

    // ---- Inovação: impressora 3D e painel de sensores -------------------------------
    const imp = tileToWorld(...TILES.impressora[0]);
    imp.z -= 0.1;
    const IMP_Y = 0.62; // tampo do móvel
    {
      const p = imp;
      bx(C.movel, p, -0.42, 0.42, 0.04, IMP_Y, -0.36, 0.22);
      bx(C.plastico, p, -0.4, 0.4, 0, 0.04, -0.34, 0.2, false);
      bx(C.grade, p, -0.003, 0.003, 0.08, IMP_Y - 0.04, 0.22, 0.225, false);
      // Estrutura (pórtico), mesa e carretel de filamento.
      bx(C.plastico, p, -0.3, 0.3, IMP_Y, IMP_Y + 0.06, -0.3, 0.14);
      for (const s of [-1, 1]) bx(C.plastico, p, s * 0.27 - 0.025, s * 0.27 + 0.025, IMP_Y + 0.06, IMP_Y + 0.62, -0.13, -0.07);
      bx(C.plastico, p, -0.3, 0.3, IMP_Y + 0.6, IMP_Y + 0.65, -0.13, -0.07);
      bx(M.metal, p, -0.22, 0.22, IMP_Y + 0.06, IMP_Y + 0.08, -0.26, 0.1, false);
      bx(C.plastico, p, 0.3, 0.32, IMP_Y + 0.4, IMP_Y + 0.6, -0.11, -0.09);
      cil(C.filamento, p, 0.11, 0.11, 0.07, 0.36, IMP_Y + 0.5, -0.1, "x");
      cil(C.plastico, p, 0.05, 0.05, 0.08, 0.36, IMP_Y + 0.5, -0.1, "x", rad, false);
      bx(C.grade, p, -0.12, 0.0, IMP_Y + 0.01, IMP_Y + 0.05, 0.14, 0.15, false);
      // Peças prontas em cima do móvel.
      cil(C.cabos[0], p, 0.035, 0.05, 0.08, -0.36, IMP_Y + 0.04, 0.1, "y", 6);
      // Painel de sensores na parede (acima da impressora).
      const pw = { x: p.x, z: ZN };
      bx(C.plastico, pw, -0.5, 0.5, 1.42, 2.02, 0, 0.05);
      tela(pw, 0.96, 0.54, R_DASH, 0, 1.72, 0.053);
    }

    // ---- Inovação: quadro Kanban e pufes ---------------------------------------------
    {
      const p = centro(TILES.kanban);
      p.x += 0.12;
      const pw = { x: p.x, z: ZN };
      const w = 1.46;
      const h = 0.91;
      const y = 1.6;
      atlas(pw, w, h, R_KANBAN, 0, y, 0.04);
      bx(M.caixilho, pw, -w / 2 - 0.03, w / 2 + 0.03, y + h / 2, y + h / 2 + 0.03, 0, 0.04, false);
      bx(M.caixilho, pw, -w / 2 - 0.03, w / 2 + 0.03, y - h / 2 - 0.03, y - h / 2, 0, 0.04, false);
      for (const s of [-1, 1]) bx(M.caixilho, pw, s * (w / 2 + 0.015) - 0.015, s * (w / 2 + 0.015) + 0.015, y - h / 2, y + h / 2, 0, 0.04, false);
      bx(M.caixilho, pw, -w / 3, w / 3, y - h / 2 - 0.06, y - h / 2 - 0.03, 0, 0.09, false);
      // Marcadores na calha.
      [C.cabos[3], C.cabos[0], C.cabos[2]].forEach((m, k) => bx(m, pw, -0.2 + k * 0.1, -0.13 + k * 0.1, y - h / 2 - 0.03, y - h / 2 - 0.01, 0.05, 0.07, false));
      // Pufes redondos embaixo do quadro.
      [-0.55, 0.0, 0.55].forEach((ox, k) => {
        cil(C.pufes[k], p, 0.21, 0.23, 0.36, ox, 0.18, -0.02 + (k % 2) * 0.1, "y", rad + 2);
        cil(M.friso, p, 0.04, 0.04, 0.01, ox, 0.365, -0.02 + (k % 2) * 0.1, "y", 6, false);
      });
    }

    // ---- Administrativo: relógio de ponto junto ao elevador --------------------------
    {
      const p = tileToWorld(...TILES.ponto[0]);
      p.z -= 0.22;
      bx(C.ponto, p, -0.06, 0.06, 0, 1.0, -0.12, 0.0);
      bx(C.ponto, p, -0.18, 0.18, 0, 0.04, -0.2, 0.08);
      const cab = new THREE.Group();
      cab.position.set(p.x, 1.0, p.z - 0.06);
      cab.rotation.x = -0.3;
      cab.updateMatrix();
      const pc = (m, g, s = true) => add(m, g.applyMatrix4(cab.matrix), s);
      pc(C.ponto, caixa(-0.17, 0.17, 0, 0.42, -0.07, 0.05));
      pc(telasMat, recorte(0.26, 0.13, R_PONTO, TL.W, TL.H).translate(0, 0.32, 0.052), false);
      pc(C.grade, caixa(-0.05, 0.05, 0.1, 0.18, 0.05, 0.06), false);
      pc(C.pcb, caixa(-0.13, 0.13, 0.03, 0.07, 0.05, 0.06), false);
      leds.push([p.x + 0.09, 1.0 + 0.13, p.z - 0.06 + 0.06, COR_LED.verde, 0]);
    }

    // ---- Sistemas: estação com três monitores e quadro de arquitetura ----------------
    {
      const p = centro(TILES.sistemas);
      p.z -= 0.05;
      bx(M.madeiraClara, p, -0.86, 0.86, 0.72, 0.76, -0.42, 0.12);
      for (const s of [-1, 1]) bx(C.plastico, p, s * 0.8 - 0.03, s * 0.8 + 0.03, 0, 0.72, -0.4, 0.1);
      bx(C.plastico, p, -0.8, 0.8, 0.35, 0.65, -0.41, -0.38);
      // Monitores: o do meio reto, os das pontas virados para quem senta.
      const mons = [[-0.54, 0.38, R_M1], [0, 0, R_M2], [0.54, -0.38, R_M3]];
      for (const [mx, giro, reg] of mons) {
        const gm = new THREE.Group();
        gm.position.set(p.x + mx, 0.76, p.z - 0.2 + Math.abs(giro) * 0.12);
        gm.rotation.y = giro;
        gm.updateMatrix();
        add(C.plastico, caixa(-0.27, 0.27, 0.17, 0.48, -0.03, 0).applyMatrix4(gm.matrix));
        add(C.plastico, caixa(-0.025, 0.025, 0, 0.2, -0.07, -0.03).applyMatrix4(gm.matrix));
        add(C.plastico, caixa(-0.1, 0.1, 0, 0.015, -0.14, 0.02).applyMatrix4(gm.matrix), false);
        add(telasMat, recorte(0.5, 0.28, reg, TL.W, TL.H).translate(0, 0.325, 0.002).applyMatrix4(gm.matrix), false);
      }
      bx(C.plastico, p, -0.22, 0.22, 0.76, 0.775, -0.02, 0.1, false);
      bx(C.plastico, p, 0.3, 0.36, 0.76, 0.78, 0.0, 0.08, false);
      cil(C.cabos[3], p, 0.035, 0.035, 0.09, -0.5, 0.805, 0.0, "y", rad, false);
      // Cadeira.
      const cz = 0.42;
      bx(M.estofado, p, -0.22, 0.22, 0.42, 0.5, cz - 0.2, cz + 0.2);
      bx(M.estofado, p, -0.22, 0.22, 0.5, 1.02, cz + 0.16, cz + 0.22);
      cil(M.escuro, p, 0.03, 0.03, 0.4, 0, 0.22, cz);
      cil(M.escuro, p, 0.22, 0.22, 0.03, 0, 0.03, cz, "y", rad, false);
      // Quadro de arquitetura na parede.
      const pw = { x: p.x, z: ZN };
      const w = 1.5;
      const h = 0.74;
      const y = 1.71;
      atlas(pw, w, h, R_ARQ, 0, y, 0.04);
      bx(M.caixilho, pw, -w / 2 - 0.03, w / 2 + 0.03, y + h / 2, y + h / 2 + 0.03, 0, 0.04, false);
      bx(M.caixilho, pw, -w / 2 - 0.03, w / 2 + 0.03, y - h / 2 - 0.03, y - h / 2, 0, 0.04, false);
      for (const s of [-1, 1]) bx(M.caixilho, pw, s * (w / 2 + 0.015) - 0.015, s * (w / 2 + 0.015) + 0.015, y - h / 2, y + h / 2, 0, 0.04, false);
    }

    // ---- Administrativo: almoxarifado e carrinho -------------------------------------
    {
      const p = centro(TILES.almox);
      p.z -= 0.05;
      const W2 = 0.88;
      // Estante baixa e puxada para o sul: não esconde quem passa atrás (y = 4).
      const z0 = -0.24;
      const z1 = 0.26;
      for (const sx of [-W2, 0, W2]) for (const sz of [z0, z1]) bx(C.estante, p, sx - 0.025, sx + 0.025, 0, 1.3, sz - 0.025, sz + 0.025);
      const niveis = [0.08, 0.48, 0.88, 1.28];
      for (const y of niveis) bx(C.estante, p, -W2 - 0.02, W2 + 0.02, y - 0.025, y, z0 - 0.02, z1 + 0.02);
      // Caixas de papelão (algumas com etiqueta) e pacotes de papel A4.
      niveis.slice(0, 3).forEach((y) => {
        let x = -W2 + 0.06;
        while (x < W2 - 0.2) {
          if (Math.abs(x) < 0.05) x = 0.05;
          const w = 0.2 + rand() * 0.16;
          const hh = 0.18 + rand() * 0.16;
          const resma = rand() < 0.22;
          if (x + w > (x < 0 ? -0.04 : W2 - 0.04)) {
            x = x < 0 ? 0.05 : W2;
            continue;
          }
          const m = resma ? C.papel : rand() < 0.5 ? C.papelao : C.papelaoEsc;
          bx(m, p, x, x + w, y, y + (resma ? 0.12 : hh), z0 + 0.02, z1 - 0.04);
          if (!resma && !lite) bx(C.papel, p, x + w * 0.3, x + w * 0.7, y + hh * 0.45, y + hh * 0.75, z1 - 0.04, z1 - 0.035, false);
          x += w + 0.03;
        }
      });
      // Placa no alto.
      bx(C.estante, p, -0.62, 0.62, 1.3, 1.56, z1 - 0.01, z1 + 0.01, false);
      atlas(p, 1.2, 0.22, R_ALMOX, 0, 1.43, z1 + 0.012);
    }
    {
      const p = tileToWorld(...TILES.carrinho[0]);
      bx(C.carrinho, p, -0.28, 0.28, 0.08, 0.13, -0.38, 0.28);
      for (const sx of [-0.22, 0.22]) {
        for (const sz of [-0.32, 0.22]) cil(M.escuro, p, 0.05, 0.05, 0.035, sx, 0.05, sz, "x", rad, false);
      }
      for (const sx of [-0.24, 0.24]) bx(C.carrinho, p, sx - 0.02, sx + 0.02, 0.13, 0.95, -0.4, -0.36);
      bx(C.carrinho, p, -0.26, 0.26, 0.92, 0.96, -0.41, -0.35);
      bx(C.papelao, p, -0.24, 0.12, 0.13, 0.43, -0.32, 0.04);
      bx(C.papelaoEsc, p, -0.2, 0.16, 0.43, 0.68, -0.3, 0.02);
      bx(C.papelao, p, 0.0, 0.24, 0.13, 0.33, 0.06, 0.26);
    }

    // ---- Administrativo: balcão de protocolo com pilhas de processos -----------------
    {
      const p = centro(TILES.protocolo);
      p.z -= 0.05;
      bx(C.movel, p, -0.88, 0.88, 0.05, 1.0, -0.3, 0.22);
      bx(C.plastico, p, -0.86, 0.86, 0, 0.05, -0.28, 0.2, false);
      bx(M.madeiraClara, p, -0.93, 0.93, 1.0, 1.04, -0.34, 0.27);
      bx(M.acento, p, -0.88, 0.88, 0.52, 0.56, 0.22, 0.225, false);
      atlas(p, 1.1, 0.19, R_PROTOCOLO, 0, 0.78, 0.226);
      // Pilhas de processos (capas coloridas, papel aparecendo).
      const pilhas = [[-0.68, 9], [-0.4, 6], [0.38, 11], [0.66, 5]];
      for (const [px, n] of pilhas) {
        let y = 1.04;
        for (let k = 0; k < n; k++) {
          const e = 0.028;
          const dx = (rand() - 0.5) * 0.03;
          const dz = (rand() - 0.5) * 0.03;
          const g = caixa(-0.12, 0.12, 0, e, -0.16, 0.16).rotateY((rand() - 0.5) * 0.18).translate(p.x + px + dx, y, p.z - 0.05 + dz);
          add(C.capas[Math.floor(rand() * C.capas.length)], g);
          if (!lite && k % 2) add(C.papel, caixa(-0.11, 0.11, 0, e * 0.5, -0.15, 0.15).translate(p.x + px + dx + 0.012, y + e * 0.25, p.z - 0.05 + dz), false);
          y += e;
        }
      }
      // Bandejas de entrada e saída, carimbo e almofada.
      for (const yy of [1.04, 1.12]) {
        bx(C.plastico, p, -0.18, 0.12, yy, yy + 0.012, -0.22, 0.12, false);
        bx(C.plastico, p, -0.18, 0.12, yy, yy + 0.05, -0.22, -0.21, false);
      }
      bx(C.papel, p, -0.16, 0.1, 1.052, 1.07, -0.2, 0.1, false);
      bx(C.papel, p, -0.16, 0.1, 1.132, 1.145, -0.2, 0.1, false);
      cil(C.cabos[0], p, 0.03, 0.04, 0.025, 0.2, 1.052, 0.12, "y", rad, false);
      cil(M.madeira, p, 0.015, 0.02, 0.08, 0.2, 1.1, 0.12, "y", 6, false);
      bx(C.plastico, p, 0.14, 0.26, 1.04, 1.055, -0.05, 0.04, false);
    }

    // ---- Administrativo: quadro de chaves da frota e miniatura do carro oficial ------
    {
      const p = tileToWorld(...TILES.chaves[0]);
      p.z -= 0.05;
      bx(M.madeira, p, -0.38, 0.38, 0.7, 0.74, -0.3, 0.26);
      for (const sx of [-0.33, 0.33]) for (const sz of [-0.25, 0.2]) bx(M.escuro, p, sx - 0.02, sx + 0.02, 0, 0.7, sz - 0.02, sz + 0.02);
      // Quadro (painel de madeira clara) com ganchos, chaves e etiquetas.
      bx(M.madeiraClara, p, -0.32, 0.32, 0.74, 1.36, -0.3, -0.26);
      bx(M.escuro, p, -0.33, 0.33, 0.74, 0.77, -0.32, -0.2, false);
      atlas(p, 0.6, 0.085, R_CHAVES, 0, 1.3, -0.258);
      const etiq = [C.cabos[3], C.cabos[0], C.cabos[1], C.cabos[2]];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          if (r === 1 && c === 2) continue; // uma chave está em uso
          const kx = -0.21 + c * 0.14;
          const ky = 1.18 - r * 0.15;
          bx(M.metal, p, kx - 0.006, kx + 0.006, ky, ky + 0.02, -0.26, -0.22, false);
          bx(M.metal, p, kx - 0.012, kx + 0.012, ky - 0.06, ky, -0.255, -0.245, false);
          if (!lite || r === 0) bx(etiq[(r + c) % 4], p, kx - 0.025, kx + 0.025, ky - 0.11, ky - 0.065, -0.256, -0.244, false);
        }
      }
      // Miniatura: carro branco com faixa azul (sem brasão nem marca).
      const cx = 0.02;
      const cz = 0.04;
      bx(C.carro, p, cx - 0.25, cx + 0.25, 0.78, 0.87, cz - 0.1, cz + 0.1);
      bx(C.faixaCarro, p, cx - 0.25, cx + 0.25, 0.81, 0.83, cz - 0.102, cz + 0.102, false);
      bx(C.vidroCarro, p, cx - 0.13, cx + 0.09, 0.87, 0.95, cz - 0.088, cz + 0.088);
      bx(C.carro, p, cx - 0.11, cx + 0.075, 0.95, 0.962, cz - 0.09, cz + 0.09, false);
      for (const wx of [-0.15, 0.15]) for (const wz of [-0.095, 0.095]) cil(M.escuro, p, 0.042, 0.042, 0.03, cx + wx, 0.782, cz + wz, "z", rad, false);
    }

    // ---- Tecnologia: chefia (ver chefiaTecnologia) ----------------------------------
    // Tapete com borda na cor do andar sob a estação e a frente dela (como o do
    // gabinete) e a placa do departamento suspensa acima da divisória, presa
    // por cabos ao "teto". A placa fica no plano da divisória, acima do
    // porta-retrato: vista do sul, alta, não tapa a foto nem a plaquinha.
    {
      const ep = plano.estacoes.find((e) => e.pessoa.codigo === GAVA.codigo);
      if (ep) {
        const cx = ep.x;
        const cz = ep.z + 0.45;
        add(M.passadeira, caixa(cx - 1.1, cx + 1.1, 0.004, 0.012, cz - 1.0, cz + 1.0), false);
        add(M.tapeteChefe, caixa(cx - 0.97, cx + 0.97, 0.012, 0.02, cz - 0.88, cz + 0.88), false);
        const placa = criarPlacaZona({ pal, track, lite, nome: ep.zona.nome, cor, max: 1.7 });
        const larg = 1.7;
        const esc = placa.largura > larg ? larg / placa.largura : 1;
        placa.grupo.scale.setScalar(esc);
        const yP = 2.02;
        const zP = ep.z - 0.5;
        placa.grupo.position.set(cx, yP, zP);
        root.add(placa.grupo);
        const topo = yP + (placa.altura * esc) / 2;
        const lw = (placa.largura * esc) / 2 - 0.15;
        for (const s of [-1, 1]) add(M.caixilho, caixa(cx + s * lw - 0.006, cx + s * lw + 0.006, topo, H, zP - 0.006, zP + 0.006), false);
      }
    }

    // ---- Centro: Central de Operações da cidade inteligente --------------------------
    // Mesa com a maquete: o mapa e o letreiro numa textura que brilha (um draw
    // call); prédios, postes e sensores de cor lisa nos lotes; os LEDs dos
    // sensores no InstancedMesh dos LEDs. Feixes, pacotes e o holograma são
    // peças vivas (mais abaixo).
    const mc = centro(TILES.mesa);
    const MX = 1.78; // meia largura do tampo (maquete)
    const MZ = 0.8; // meia profundidade
    const TOPO = 0.845;
    const wx = (u) => mc.x + (u - 0.5) * 2 * MX;
    const wz = (v) => mc.z + (v - 0.5) * 2 * MZ;
    // Projetor no meio da praça; o holograma flutua acima dele.
    const praca = (() => {
      const [fi, ci] = CIDADE.praca.split(",").map(Number);
      const [u0, u1] = CIDADE.colunas[ci];
      const [v0, v1] = CIDADE.filas[fi];
      return new THREE.Vector3(wx((u0 + u1) / 2), 0, wz((v0 + v1) / 2));
    })();
    const HOLO_Y = 1.42; // base do holograma
    const feixes = []; // [origem, destino] dos dados até o holograma
    {
      const p = mc;
      // Piso técnico: borda na cor da passadeira (que vem do elevador e passa
      // por baixo) e miolo escuro com friso azul.
      const zSul = p.z + 2.1;
      add(M.passadeira, caixa(p.x - 2.25, p.x + 2.25, 0.003, 0.014, p.z - 1.35, zSul), false);
      add(C.pisoTec, caixa(p.x - 2.1, p.x + 2.1, 0.014, 0.022, p.z - 1.2, zSul - 0.15), false);
      for (const s of [-1, 1]) {
        add(C.frisoTec, caixa(p.x - 2.0, p.x + 2.0, 0.022, 0.025, (s < 0 ? p.z - 1.1 : zSul - 0.25) - 0.015, (s < 0 ? p.z - 1.1 : zSul - 0.25) + 0.015), false);
        add(C.frisoTec, caixa(p.x + s * 2.0 - 0.015, p.x + s * 2.0 + 0.015, 0.022, 0.025, p.z - 1.1, zSul - 0.25), false);
      }
      // Móvel: rodapé recuado, corpo escuro, aro metálico e beiral do tampo.
      bx(M.escuro, p, -1.66, 1.66, 0.02, 0.08, -0.7, 0.7, false);
      bx(C.plastico, p, -1.74, 1.74, 0.08, 0.72, -0.78, 0.78);
      bx(C.rack, p, -1.84, 1.84, 0.72, 0.84, -0.86, 0.86);
      for (const s of [-1, 1]) {
        bx(M.metal, p, -1.84, 1.84, 0.84, 0.87, s * 0.83 - 0.03, s * 0.83 + 0.03, false);
        bx(M.metal, p, s * 1.81 - 0.03, s * 1.81 + 0.03, 0.84, 0.87, -0.8, 0.8, false);
      }
      // Mapa (em cima) e letreiro (na frente, abaixo do beiral).
      const mesaCanvas = makeCanvas(MESA.W, MESA.H);
      desenharMesa(mesaCanvas, pal, caberFonte);
      const mesaTex = track(canvasTexture(mesaCanvas));
      document.fonts?.ready.then(() => {
        desenharMesa(mesaCanvas, pal, caberFonte);
        mesaTex.needsUpdate = true;
      });
      const mesaMat = track(new THREE.MeshStandardMaterial({ map: mesaTex, emissive: white, emissiveMap: mesaTex, emissiveIntensity: lite ? 0.55 : 0.45, roughness: 0.45 }));
      add(mesaMat, recorte(MX * 2, MZ * 2, R_MAPA, MESA.W, MESA.H).rotateX(-Math.PI / 2).translate(p.x, TOPO, p.z), false);
      add(mesaMat, recorte(2.9, 0.221, R_LETREIRO, MESA.W, MESA.H).translate(p.x, 0.445, p.z + 0.783), false);
    }
    // Prédios low-poly nas quadras, árvores nos parques, prefeitura no centro.
    {
      const r = semente(1709);
      CIDADE.filas.forEach(([v0, v1, tipo], fi) => {
        CIDADE.colunas.forEach(([u0, u1], ci) => {
          const k = `${fi},${ci}`;
          if (k === CIDADE.praca) return;
          if (CIDADE.parques.includes(k)) {
            const n = lite ? 3 : 5;
            for (let i = 0; i < n; i++) {
              const x = wx(u0 + 0.025 + ((u1 - u0 - 0.05) * (i + 0.5)) / n);
              const z = wz(v0 + 0.03 + (v1 - v0 - 0.06) * (i % 2 ? 0.72 : 0.28));
              add(M.madeira, caixa(x - 0.008, x + 0.008, TOPO, TOPO + 0.05, z - 0.008, z + 0.008), false);
              add(i % 2 ? M.folhaClara : M.folha, new THREE.IcosahedronGeometry(0.045 + r() * 0.015, 0).translate(x, TOPO + 0.08, z));
            }
            return;
          }
          const z0 = wz(v0 + 0.03);
          const z1 = wz(v1 - 0.03);
          if (k === CIDADE.prefeitura) {
            // Prefeitura: bloco largo e baixo com a torre do relógio no meio.
            const xm = wx((u0 + u1) / 2);
            add(C.predios[0], caixa(wx(u0 + 0.02), wx(u1 - 0.02), TOPO, TOPO + 0.09, z0, z1));
            add(C.predios[1], caixa(xm - 0.07, xm + 0.07, TOPO + 0.09, TOPO + 0.2, z0 + 0.05, z1 - 0.05));
            add(C.telhado, new THREE.CylinderGeometry(0, 0.09, 0.06, 4).rotateY(Math.PI / 4).translate(xm, TOPO + 0.23, (z0 + z1) / 2));
            return;
          }
          const n = tipo === "casas" ? (lite ? 2 : 3) : 2;
          const du = (u1 - u0 - 0.03) / n;
          for (let i = 0; i < n; i++) {
            const xa = wx(u0 + 0.015 + i * du + 0.004);
            const xb = wx(u0 + 0.015 + (i + 1) * du - 0.004);
            if (tipo === "casas") {
              const hh = 0.045 + r() * 0.025;
              const zm = (z0 + z1) / 2;
              add(C.predios[i % 3], caixa(xa, xb, TOPO, TOPO + hh, zm - 0.06, zm + 0.06));
              const tw = Math.min(xb - xa, 0.12) / 2 + 0.015;
              const telh = new THREE.CylinderGeometry(0, tw * Math.SQRT2, 0.05, 4).rotateY(Math.PI / 4).scale(1, 1, 0.07 / tw);
              add(C.telhado, telh.translate((xa + xb) / 2, TOPO + hh + 0.025, zm));
            } else {
              const alta = tipo === "centro";
              const hh = alta ? 0.14 + r() * 0.24 : 0.07 + r() * 0.1;
              const torre = alta && r() < 0.4;
              add(torre ? C.torre : C.predios[Math.floor(r() * 3)], caixa(xa, xb, TOPO, TOPO + hh, z0, z1));
              // Laje com a casa de máquinas.
              if (!lite || alta) add(M.metal, caixa(xa + 0.03, xa + 0.07, TOPO + hh, TOPO + hh + 0.025, z0 + 0.03, z0 + 0.07), false);
            }
          }
        });
      });
      // Guarda-corpo das pontes.
      for (const u of CIDADE.ruasU) {
        for (const s of [-1, 1]) {
          const x = wx(u + (s * CIDADE.largU) / 2);
          add(M.metal, caixa(x - 0.006, x + 0.006, TOPO, TOPO + 0.025, wz(rioV(u) - RIO_MEIA), wz(rioV(u) + RIO_MEIA)), false);
        }
      }
      // Projetor do holograma.
      cil(C.rack, praca, 0.12, 0.14, 0.05, 0, TOPO + 0.025, 0);
      cil(C.frisoTec, praca, 0.07, 0.07, 0.012, 0, TOPO + 0.056, 0, "y", rad, false);
    }
    // Sensores (postes, semáforos, lixeiras, medidores de energia e de nível do
    // rio), cada um com o seu LED; alguns mandam dados ao holograma.
    {
      const lampada = [1.5, 1.5, 2.6]; // LED maior (visto de cima)
      SENSORES.forEach(([tipo, u, v, temFeixe], i) => {
        const x = wx(u);
        const z = wz(v);
        let topo;
        if (tipo === "poste") {
          add(M.metal, new THREE.CylinderGeometry(0.006, 0.008, 0.16, 5).translate(x, TOPO + 0.08, z), false);
          add(M.metal, caixa(x, x + 0.045, TOPO + 0.155, TOPO + 0.165, z - 0.005, z + 0.005), false);
          topo = new THREE.Vector3(x + 0.04, TOPO + 0.145, z);
          leds.push([topo.x, topo.y, topo.z, COR_LED.ambar, 0, 0, lampada]);
        } else if (tipo === "semaforo") {
          add(M.metal, new THREE.CylinderGeometry(0.006, 0.007, 0.11, 5).translate(x, TOPO + 0.055, z), false);
          add(C.plastico, caixa(x - 0.018, x + 0.018, TOPO + 0.1, TOPO + 0.17, z - 0.014, z + 0.014));
          // Vermelho e verde se revezam (fases opostas).
          leds.push([x, TOPO + 0.152, z + 0.016, COR_LED.vermelho, 0.12, 0, [1.1, 1.1, 1]]);
          leds.push([x, TOPO + 0.118, z + 0.016, COR_LED.verde, 0.12, Math.PI, [1.1, 1.1, 1]]);
          topo = new THREE.Vector3(x, TOPO + 0.17, z);
        } else if (tipo === "lixeira") {
          add(C.lixeira, new THREE.CylinderGeometry(0.022, 0.018, 0.05, rad).translate(x, TOPO + 0.025, z));
          add(C.plastico, new THREE.CylinderGeometry(0.025, 0.025, 0.008, rad).translate(x, TOPO + 0.054, z), false);
          topo = new THREE.Vector3(x, TOPO + 0.065, z);
          leds.push([topo.x, topo.y, topo.z, i % 2 ? COR_LED.vermelho : COR_LED.verde, 0.6, 0, lampada]);
        } else if (tipo === "medidor") {
          add(C.modulo, caixa(x - 0.022, x + 0.022, TOPO, TOPO + 0.07, z - 0.015, z + 0.015));
          topo = new THREE.Vector3(x, TOPO + 0.05, z + 0.017);
          leds.push([topo.x, topo.y, topo.z, COR_LED.azul, 1.5, 0, [1.2, 1.2, 1]]);
        } else {
          // Sensor de nível do rio, preso no guarda-corpo da ponte.
          add(C.sensor, caixa(x - 0.015, x + 0.015, TOPO + 0.02, TOPO + 0.06, z - 0.015, z + 0.015));
          topo = new THREE.Vector3(x, TOPO + 0.068, z);
          leds.push([topo.x, topo.y, topo.z, COR_LED.azul, 0.9, 0, lampada]);
        }
        if (temFeixe && (!lite || i % 2 === 0)) {
          const dir = new THREE.Vector3(x - praca.x, 0, z - praca.z);
          dir.normalize().multiplyScalar(0.3);
          feixes.push([topo, new THREE.Vector3(praca.x + dir.x, HOLO_Y, praca.z + dir.z)]);
        }
      });
    }

    // ---- Peças vivas (fora dos lotes) ------------------------------------------------
    const vivo = new THREE.Group();
    vivo.name = "tema-tecnologia";
    root.add(vivo);

    // LEDs: [x, y, z, cor, pisca, fase?, escala?].
    const ledGeo = track(new THREE.BoxGeometry(0.022, 0.022, 0.012));
    const ledMat = track(new THREE.MeshBasicMaterial({ color: white }));
    const ledMesh = new THREE.InstancedMesh(ledGeo, ledMat, leds.length);
    const m4 = new THREE.Matrix4();
    const apagado = new THREE.Color();
    leds.forEach(([x, y, z, cor, , , esc], i) => {
      ledMesh.setMatrixAt(i, esc ? m4.makeScale(...esc).setPosition(x, y, z) : m4.makeTranslation(x, y, z));
      ledMesh.setColorAt(i, cor);
    });
    ledMesh.instanceMatrix.needsUpdate = true;
    vivo.add(ledMesh);
    const fases = leds.map((l) => l[5] ?? rand() * 10);

    // Central: feixes de dados (um mesh), pacotes subindo por eles (um
    // InstancedMesh) e o holograma (anéis, painéis e facho num mesh só, com
    // a mesma textura), que gira devagar.
    const feixeMat = track(new THREE.MeshBasicMaterial({ color: mix(pv("blue-300"), pv("green-500"), 0.3), transparent: true, opacity: 0.45, depthWrite: false }));
    {
      const up = new THREE.Vector3(0, 1, 0);
      const q = new THREE.Quaternion();
      const geos = feixes.map(([a, b]) => {
        const d = b.clone().sub(a);
        const len = d.length();
        q.setFromUnitVectors(up, d.normalize());
        return new THREE.CylinderGeometry(0.005, 0.005, len, 4, 1, true)
          .applyQuaternion(q)
          .translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      });
      const mesh = new THREE.Mesh(track(mergeGeos(geos)), feixeMat);
      mesh.name = "central-feixes";
      vivo.add(mesh);
    }
    const pacotes = new THREE.InstancedMesh(
      track(new THREE.BoxGeometry(0.028, 0.028, 0.028)),
      track(new THREE.MeshBasicMaterial({ color: mix(white, pv("blue-200"), 0.3) })),
      feixes.length,
    );
    pacotes.name = "central-pacotes";
    pacotes.frustumCulled = false;
    vivo.add(pacotes);
    const holo = new THREE.Group();
    holo.position.set(praca.x, 0, praca.z);
    {
      const holoCanvas = makeCanvas(HO.W, HO.H);
      desenharHolo(holoCanvas, pal, caberFonte);
      const holoTex = track(canvasTexture(holoCanvas));
      document.fonts?.ready.then(() => {
        desenharHolo(holoCanvas, pal, caberFonte);
        holoTex.needsUpdate = true;
      });
      const holoMat = track(new THREE.MeshBasicMaterial({ map: holoTex, transparent: true, depthWrite: false }));
      const y0 = TOPO + 0.06;
      const partes = [
        noRecorte(new THREE.CylinderGeometry(0.4, 0.06, HOLO_Y - y0, lite ? 10 : 18, 1, true).translate(0, (y0 + HOLO_Y) / 2, 0), R_FACHO, HO.W, HO.H),
        noRecorte(new THREE.TorusGeometry(0.44, 0.008, 4, lite ? 28 : 44).rotateX(Math.PI / 2).translate(0, HOLO_Y, 0), R_SOLIDO, HO.W, HO.H),
        noRecorte(new THREE.TorusGeometry(0.4, 0.006, 4, lite ? 28 : 44).rotateX(Math.PI / 2).translate(0, HOLO_Y + 0.62, 0), R_SOLIDO, HO.W, HO.H),
      ];
      // Painéis voltados para fora, com uma cópia virada para dentro: lidos
      // do lado de fora e através do holograma (o texto nunca sai espelhado).
      R_HOLO.forEach((reg, k) => {
        const a = (k * Math.PI * 2) / 3;
        partes.push(recorte(0.56, 0.35, reg, HO.W, HO.H).translate(0, HOLO_Y + 0.31, 0.38).rotateY(a));
        partes.push(recorte(0.56, 0.35, reg, HO.W, HO.H).rotateY(Math.PI).translate(0, HOLO_Y + 0.31, 0.376).rotateY(a));
      });
      const mesh = new THREE.Mesh(track(mergeGeos(partes)), holoMat);
      mesh.name = "central-holograma";
      mesh.renderOrder = 1;
      holo.add(mesh);
    }
    vivo.add(holo);
    const vp = new THREE.Vector3();
    const poseCentral = (t) => {
      holo.rotation.y = t * 0.22;
      feixeMat.opacity = reducedMotion ? 0.45 : 0.3 + 0.25 * (0.5 + 0.5 * Math.sin(t * 2.2));
      feixes.forEach(([a, b], i) => {
        const f = (t * 0.45 + i * 0.37) % 1;
        vp.copy(a).lerp(b, f);
        pacotes.setMatrixAt(i, m4.makeTranslation(vp.x, vp.y, vp.z));
      });
      pacotes.instanceMatrix.needsUpdate = true;
    };

    // Braço robótico: giro (torre) e ombro (braço inteiro, num mesh só).
    const giro = new THREE.Group();
    giro.position.set(est.x + 0.26, 0.64, est.z - 0.31);
    const torre = new THREE.Mesh(track(new THREE.CylinderGeometry(0.1, 0.12, 0.12, rad).translate(0, 0.06, 0)), C.plastico);
    giro.add(torre);
    const ombro = new THREE.Group();
    ombro.position.y = 0.14;
    giro.add(ombro);
    {
      const partes = [
        new THREE.CylinderGeometry(0.06, 0.06, 0.13, rad).rotateZ(Math.PI / 2),
        caixa(-0.045, 0.045, 0, 0.42, -0.045, 0.045),
        new THREE.CylinderGeometry(0.05, 0.05, 0.11, rad).rotateZ(Math.PI / 2).translate(0, 0.42, 0),
        caixa(-0.035, 0.035, 0.39, 0.45, 0, 0.36),
        caixa(-0.03, 0.03, 0.24, 0.45, 0.34, 0.4),
        caixa(-0.06, 0.06, 0.21, 0.24, 0.33, 0.41),
        caixa(-0.055, -0.035, 0.15, 0.21, 0.35, 0.39),
        caixa(0.035, 0.055, 0.15, 0.21, 0.35, 0.39),
      ];
      const geo = track(mergeGeos(partes));
      const braco = new THREE.Mesh(geo, C.bracoInd);
      braco.castShadow = !lite;
      ombro.add(braco);
    }
    vivo.add(giro);

    // Caixinhas andando na esteira.
    const NCX = 3;
    const caixas = new THREE.InstancedMesh(track(new THREE.BoxGeometry(0.15, 0.13, 0.15)), C.papelao, NCX);
    caixas.castShadow = !lite;
    vivo.add(caixas);

    // Impressora 3D: peça crescendo, ponte (eixo X) subindo e cabeçote.
    const pecaBase = IMP_Y + 0.08;
    const peca = new THREE.Mesh(track(new THREE.CylinderGeometry(0.06, 0.08, 0.2, 8).translate(0, 0.1, 0)), C.filamento);
    peca.position.set(imp.x, pecaBase, imp.z - 0.06);
    const ponte = new THREE.Mesh(track(caixa(-0.26, 0.26, -0.015, 0.015, -0.13, -0.09)), M.metal);
    ponte.position.set(imp.x, 0, imp.z);
    const cabecote = new THREE.Mesh(track(mergeGeos([caixa(-0.04, 0.04, 0.015, 0.09, -0.04, 0.04), new THREE.ConeGeometry(0.018, 0.03, 6).rotateX(Math.PI).translate(0, 0.0, 0)])), C.plastico);
    vivo.add(peca, ponte, cabecote);

    const pose = (t) => {
      // Esteira: caixas a 0,25 m/s, espaçadas igualmente.
      const L = 1.7;
      for (let i = 0; i < NCX; i++) {
        const u = (((t * 0.25 + (i * L) / NCX) % L) + L) % L;
        caixas.setMatrixAt(i, m4.makeTranslation(est.x - 0.85 + u, 0.765, zb));
      }
      caixas.instanceMatrix.needsUpdate = true;
      // Braço: busca na esteira (giro 0), leva à caixa de peças (giro ~1,6).
      const ciclo = (t % 6) / 6;
      const ida = ciclo < 0.5 ? ciclo * 2 : 2 - ciclo * 2;
      const s = ida * ida * (3 - 2 * ida);
      giro.rotation.y = s * 1.75;
      ombro.rotation.x = 0.35 * Math.max(0, Math.cos(ida * Math.PI * 2)) + 0.05;
      // Impressora: 20 s imprimindo, 4 s com a peça pronta.
      const prog = Math.min(1, (t % 24) / 20);
      const alt = Math.max(0.02, prog);
      peca.scale.set(1, alt, 1);
      const topo = pecaBase + 0.2 * alt;
      ponte.position.y = topo + 0.05;
      const parado = prog >= 1;
      cabecote.position.set(imp.x + (parado ? 0.18 : Math.sin(t * 6) * 0.06), topo + 0.012, imp.z - 0.06 + (parado ? -0.04 : Math.cos(t * 4.3) * 0.04));
      poseCentral(t);
    };
    pose(reducedMotion ? 13 : 0);

    let ultLed = -1;
    let ultTela = 0;
    const passoTela = lite ? 0.6 : 0.25;
    return {
      update(t) {
        if (reducedMotion) return;
        pose(t);
        if (t - ultLed > 0.08) {
          ultLed = t;
          leds.forEach(([, , , cor, pisca], i) => {
            if (!pisca) return;
            const on = Math.sin(t * pisca * Math.PI * 2 + fases[i]) > -0.2;
            ledMesh.setColorAt(i, on ? cor : apagado.copy(cor).multiplyScalar(0.18));
          });
          ledMesh.instanceColor.needsUpdate = true;
        }
        if (t - ultTela > passoTela) {
          ultTela = t;
          telas.desenhar(t);
          telasTex.needsUpdate = true;
        }
      },
      dispose() {
        vivo.removeFromParent();
      },
    };
  },
};

// Junta geometrias simples (sem índice, com uv) num BufferGeometry só.
function mergeGeos(lista) {
  const pos = [];
  const nor = [];
  const uvs = [];
  for (const g0 of lista) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    pos.push(...g.attributes.position.array);
    nor.push(...g.attributes.normal.array);
    uvs.push(...(g.attributes.uv ? g.attributes.uv.array : new Float32Array(g.attributes.position.count * 2)));
    if (g !== g0) g.dispose();
    g0.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  return out;
}
