/**
 * Situações sem paridade com o React (o Radix usa portal e JS em tudo), com o
 * dist/semec-ds.css no Chromium:
 *   - A11Y-05: sem JavaScript, o popup do menu fica no fluxo e não cobre o conteúdo;
 *   - A11Y-17: item de menu `disabled` (sem o data-disabled que o JS põe) aparece apagado;
 *   - A11Y-06: listbox e menu dentro de um diálogo curto aparecem inteiros, sem rolar;
 *   - A11Y-18: `prefers-reduced-motion` alcança o ::backdrop do diálogo;
 *   - CONS-11: o campo alvo do link do resumo de erros tem margem de rolagem.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { startServer } from "./support/harness.mjs";

const page = (body, head = "") => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Teste</title><link rel="stylesheet" href="/semec-ds.css">${head}</head><body><main id="conteudo">${body}</main></body></html>`;
const html = (body, head) => ({ type: "text/html; charset=utf-8", body: page(body, head) });

const OPCOES = Array.from({ length: 6 }, (_, i) => `<li role="option" id="o${i}" class="semec-combobox__option" aria-selected="${i === 0}" data-state="unchecked"${i === 0 ? " data-highlighted" : ""}>Escola ${i + 1}</li>`).join("");

let srv;
let browser;
before(async () => {
  srv = await startServer({
    // Sem o <script> do @semec/ds-elements: o <semec-menu> não é definido.
    "/menu-sem-js": html(`<semec-menu><button type="button" class="semec-btn semec-btn--outline" data-semec-menu-trigger>Ações</button><div class="semec-menu"><button type="button" class="semec-menu__item">Editar</button><button type="button" class="semec-menu__item" disabled id="desabilitado">Excluir</button><a class="semec-menu__item" href="#x" aria-disabled="true" id="link-desabilitado">Arquivar</a></div></semec-menu><h2 class="semec-heading semec-heading--2">Acordeão</h2><button type="button" class="semec-btn" id="alvo">Depois do menu</button>`),
    // Diálogo curto com o listbox aberto (estado que o <semec-combobox> deixa) e um menu aberto.
    "/popups-no-dialogo": html(`<dialog class="semec-dialog" data-state="open"><div class="semec-dialog__header"><h2 class="semec-dialog__title">Editar contato</h2></div><div class="semec-form-field"><label for="cb" class="semec-label">Escola</label><semec-combobox class="semec-combobox" data-state="open"><input id="cb" type="text" role="combobox" class="semec-combobox__input" aria-expanded="true" aria-controls="lb" aria-activedescendant="o0"><ul id="lb" role="listbox" aria-label="Escolas" class="semec-combobox__listbox" data-state="open">${OPCOES}</ul></semec-combobox></div><semec-menu><button type="button" class="semec-btn semec-btn--outline" aria-haspopup="menu" aria-expanded="true">Mais ações</button><div role="menu" class="semec-menu" data-state="open" id="menu"><button type="button" role="menuitem" class="semec-menu__item">Copiar</button><button type="button" role="menuitem" class="semec-menu__item">Recortar</button><button type="button" role="menuitem" class="semec-menu__item" id="ultimo-item">Limpar</button></div></semec-menu><div class="semec-dialog__footer"><button type="button" class="semec-btn">Salvar</button></div></dialog><script>document.querySelector("dialog").showModal()</script>`),
    "/campo": html(`<div class="semec-form-field"><label for="cpf" class="semec-label">CPF</label><input id="cpf" class="semec-field"></div><label class="semec-choice"><input type="radio" id="turno" class="semec-radio"> Manhã</label>`),
  });
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await srv?.close();
});

test("A11Y-05/A11Y-17: sem JS, o menu fica no fluxo, não cobre o conteúdo e o item desabilitado aparece apagado", async () => {
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await p.goto(`${srv.base}/menu-sem-js`);
    const r = await p.evaluate(() => {
      const alvo = document.getElementById("alvo").getBoundingClientRect();
      const topo = document.elementFromPoint(alvo.x + alvo.width / 2, alvo.y + alvo.height / 2);
      const s = (id) => getComputedStyle(document.getElementById(id));
      return {
        position: getComputedStyle(document.querySelector(".semec-menu")).position,
        alvoNoTopo: topo?.id === "alvo",
        desabilitado: [s("desabilitado").opacity, s("desabilitado").pointerEvents],
        linkDesabilitado: [s("link-desabilitado").opacity, s("link-desabilitado").pointerEvents],
      };
    });
    assert.equal(r.position, "static", "popup sem JS no fluxo");
    assert.ok(r.alvoNoTopo, "o conteúdo depois do menu continua clicável (nada por cima)");
    assert.deepEqual(r.desabilitado, ["0.5", "none"], "<button disabled> apagado como o data-disabled");
    assert.deepEqual(r.linkDesabilitado, ["0.5", "none"], "<a aria-disabled> apagado");
  } finally {
    await p.close();
  }
});

test("A11Y-06: listbox e menu dentro de um diálogo curto aparecem inteiros, sem rolar o diálogo", async () => {
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await p.goto(`${srv.base}/popups-no-dialogo`);
    const r = await p.evaluate(() => {
      const dlg = document.querySelector("dialog");
      const visivel = (el) => {
        const b = el.getBoundingClientRect();
        const d = dlg.getBoundingClientRect();
        const topo = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
        return b.bottom <= d.bottom && b.top >= d.top && (topo === el || el.contains(topo));
      };
      return { scrollTop: dlg.scrollTop, opcao: visivel(document.getElementById("o5")), item: visivel(document.getElementById("ultimo-item")), rolavel: dlg.scrollHeight > dlg.clientHeight };
    });
    assert.equal(r.scrollTop, 0);
    assert.equal(r.rolavel, false, "o diálogo cresceu com os popups (cabe na tela)");
    assert.ok(r.opcao, "a última opção do listbox está visível dentro do diálogo");
    assert.ok(r.item, "o último item do menu está visível dentro do diálogo");
  } finally {
    await p.close();
  }
});

test("A11Y-18: com menos movimento, o ::backdrop do diálogo não anima", async () => {
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  try {
    await p.goto(`${srv.base}/popups-no-dialogo`);
    const dur = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector("dialog"), "::backdrop").animationDuration));
    assert.ok(dur <= 0.001, `animação do ::backdrop: ${dur}s`);
  } finally {
    await p.close();
  }
});

test("CONS-11: o campo e o rádio alvos do resumo de erros deixam o rótulo visível ao rolar", async () => {
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await p.goto(`${srv.base}/campo`);
    const m = await p.evaluate(() => ["cpf", "turno"].map((id) => parseFloat(getComputedStyle(document.getElementById(id)).scrollMarginTop)));
    for (const v of m) assert.ok(v >= 40, `scroll-margin-top ${v}px`);
  } finally {
    await p.close();
  }
});
