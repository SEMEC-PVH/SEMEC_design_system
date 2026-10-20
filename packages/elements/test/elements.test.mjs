/**
 * Comportamento, ARIA e acessibilidade dos elementos em navegador real.
 * Chromium sempre; Firefox e WebKit quando instalados (SEMEC_BROWSERS restringe).
 * Página: fixtures/bancada.html com o bundle do CDN (dist/semec-elements.js) e o
 * CSS atual do @semec/ds-css.
 */
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, availableBrowsers, launch, open, axe, focused } from "./support/harness.mjs";

const srv = await startServer();
const browsers = await availableBrowsers();
after(() => srv.close());

const attrs = (page, selector, names) =>
  page.$eval(selector, (el, names) => Object.fromEntries(names.map((n) => [n, el.getAttribute(n)])), names);
const visible = (page, selector) => page.$eval(selector, (el) => !el.closest("[hidden]") && el.getClientRects().length > 0);
const isMac = process.platform === "darwin";

for (const name of browsers) {
  describe(`${name}`, () => {
    let browser;
    let page;
    let errors;

    before(async () => {
      browser = await launch(name);
    });
    after(async () => {
      await browser?.close();
    });

    const fresh = async (query = "") => {
      await page?.close();
      ({ page, errors } = await open(browser, `${srv.base}/bancada${query}`));
      return page;
    };
    const tabTo = async (selector) => {
      // WebKit no macOS só leva Tab a botões com Option+Tab; foco direto é suficiente aqui.
      await page.focus(selector);
    };

    // ---------------------------------------------------------------- dialog
    test("dialog: ARIA, foco inicial, foco preso, Esc, foco de volta, trava de rolagem e eventos", async () => {
      await fresh();
      await page.evaluate(() => {
        window.__eventos = [];
        for (const t of ["semec-open", "semec-close"]) document.addEventListener(t, (e) => window.__eventos.push(`${t}:${e.target.id}`));
      });
      assert.deepEqual(await attrs(page, "#abrir-dialogo", ["aria-haspopup", "aria-expanded", "aria-controls"]), {
        "aria-haspopup": "dialog",
        "aria-expanded": "false",
        "aria-controls": await page.$eval("#dialogo dialog", (d) => d.id),
      });
      const ids = await page.$eval("#dialogo dialog", (d) => ({
        title: document.getElementById(d.getAttribute("aria-labelledby"))?.textContent,
        description: document.getElementById(d.getAttribute("aria-describedby"))?.textContent,
        state: d.getAttribute("data-state"),
      }));
      assert.deepEqual(ids, { title: "Editar contato", description: "Altere o telefone do responsável.", state: "closed" });

      await tabTo("#abrir-dialogo");
      await page.keyboard.press("Enter");
      assert.equal((await focused(page)).id, "telefone", "foco inicial no primeiro campo");
      assert.equal(await page.$eval("#dialogo dialog", (d) => d.matches(":modal") && d.getAttribute("data-state")), "open");
      assert.equal(await page.$eval("#abrir-dialogo", (b) => b.getAttribute("aria-expanded")), "true");
      assert.equal(await page.evaluate(() => document.documentElement.hasAttribute("data-semec-scroll-lock")), true);
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflow), "hidden");

      for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
      assert.equal((await focused(page)).id, "telefone", "Tab circula dentro do diálogo");
      await page.keyboard.press("Shift+Tab");
      assert.equal((await focused(page)).name, "Fechar", "Shift+Tab no primeiro vai ao último");

      await page.keyboard.press("Escape");
      await page.waitForFunction(() => window.__eventos.length === 2); // "close" do <dialog> é assíncrono
      assert.equal((await focused(page)).id, "abrir-dialogo", "foco volta ao gatilho");
      assert.equal(await page.evaluate(() => document.documentElement.hasAttribute("data-semec-scroll-lock")), false);
      assert.deepEqual(await page.evaluate(() => window.__eventos), ["semec-open:dialogo", "semec-close:dialogo"]);
      assert.deepEqual(errors, []);
    });

    test("dialog: open()/close() por script, clique no fundo e no X", async () => {
      await page.evaluate(() => document.getElementById("depois").focus());
      await page.evaluate(() => document.getElementById("dialogo").open());
      assert.equal(await page.$eval("#dialogo dialog", (d) => d.open), true);
      await page.evaluate(() => document.getElementById("dialogo").close());
      await page.waitForFunction(() => !document.querySelector("#dialogo dialog").open);
      assert.equal((await focused(page)).id, "depois", "sem gatilho, o foco volta ao elemento focado antes");

      await page.click("#abrir-dialogo");
      await page.mouse.click(1200, 850);
      await page.waitForFunction(() => !document.querySelector("#dialogo dialog").open);
      await page.click("#abrir-dialogo");
      await page.click("#dialogo .semec-dialog__close");
      await page.waitForFunction(() => !document.querySelector("#dialogo dialog").open);
      assert.equal((await focused(page)).id, "abrir-dialogo");
    });

    test("alertdialog: role, aria-modal, foco no Cancelar, fundo não fecha, link como gatilho com Espaço", async () => {
      await fresh();
      assert.equal(await page.$eval("#abrir-alerta", (a) => a.getAttribute("role")), "button");
      await tabTo("#abrir-alerta");
      await page.keyboard.press("Space");
      assert.deepEqual(await attrs(page, "#excluir dialog", ["role", "aria-modal", "data-state"]), { role: "alertdialog", "aria-modal": "true", "data-state": "open" });
      assert.equal((await focused(page)).id, "alerta-cancelar");
      assert.equal(await page.evaluate(() => location.hash), "", "o link não navegou");
      await page.mouse.click(1200, 850);
      await page.waitForTimeout(100);
      assert.equal(await page.$eval("#excluir dialog", (d) => d.open), true, "clique no fundo não fecha o alerta");
      assert.equal((await focused(page)).id, "alerta-cancelar", "e o foco continua no Cancelar");
      await page.keyboard.press("Enter"); // Cancelar
      await page.waitForFunction(() => !document.querySelector("#excluir dialog").open);
      assert.equal((await focused(page)).id, "abrir-alerta");
    });

    // ------------------------------------------------------------------ tabs
    test("tabs: papéis, aria-controls/labelledby, roving tabindex, painel focável e escondido com hidden", async () => {
      await fresh();
      const info = await page.evaluate(() => {
        const list = document.querySelector("#abas .semec-tabs__list");
        const tabs = [...list.querySelectorAll(".semec-tabs__trigger")];
        return {
          list: [list.getAttribute("role"), list.getAttribute("aria-orientation")],
          tabs: tabs.map((t) => [t.getAttribute("role"), t.getAttribute("aria-selected"), t.getAttribute("tabindex"), t.getAttribute("data-state"), t.getAttribute("aria-controls")]),
          panels: [...document.querySelectorAll("#abas .semec-tabs__panel")].map((p) => [p.getAttribute("role"), p.getAttribute("aria-labelledby"), p.getAttribute("tabindex"), p.hidden, p.getAttribute("data-state")]),
          value: document.getElementById("abas").getAttribute("value"),
        };
      });
      assert.deepEqual(info.list, ["tablist", "horizontal"]);
      assert.deepEqual(info.tabs, [
        ["tab", "true", "0", "active", "painel-dados"],
        ["tab", "false", "-1", "inactive", "painel-documentos"],
        ["tab", "false", "-1", "inactive", "painel-historico"],
      ]);
      assert.deepEqual(info.panels, [
        ["tabpanel", "aba-1", "0", false, "active"],
        ["tabpanel", "aba-2", "0", true, "inactive"],
        ["tabpanel", "aba-3", "0", true, "inactive"],
      ]);
      assert.equal(info.value, "painel-dados");
    });

    test("tabs: teclado, clique, evento semec-change e atributo value", async () => {
      await page.evaluate(() => {
        window.__trocas = [];
        document.getElementById("abas").addEventListener("semec-change", (e) => window.__trocas.push(e.detail.value));
      });
      await tabTo("#aba-1");
      await page.keyboard.press("ArrowRight");
      assert.equal((await focused(page)).id, "aba-2");
      await page.keyboard.press("End");
      await page.keyboard.press("ArrowRight");
      assert.equal((await focused(page)).id, "aba-1", "→ no último volta ao primeiro");
      await page.keyboard.press("ArrowLeft");
      assert.equal((await focused(page)).id, "aba-3");
      await page.keyboard.press("Tab");
      assert.equal((await focused(page)).id, "painel-historico", "Tab leva ao painel ativo");
      await page.click("#aba-2");
      assert.equal(await page.evaluate(() => location.hash), "", "clique na aba não navega até a âncora");
      assert.deepEqual(await page.evaluate(() => window.__trocas), ["painel-documentos", "painel-historico", "painel-dados", "painel-historico", "painel-documentos"]);
      await page.evaluate(() => document.getElementById("abas").setAttribute("value", "painel-dados"));
      assert.equal(await visible(page, "#painel-dados"), true);
      assert.equal(await visible(page, "#painel-documentos"), false);
    });

    test("tabs verticais: ↑/↓ movem, ←/→ não", async () => {
      await page.evaluate(() => {
        document.getElementById("conteudo").insertAdjacentHTML(
          "beforeend",
          `<semec-tabs class="semec-tabs" id="vert" orientation="vertical"><div class="semec-tabs__list" aria-label="Etapas"><button class="semec-tabs__trigger" id="v1" data-value="a">A</button><button class="semec-tabs__trigger" id="v2" data-value="b">B</button></div><div class="semec-tabs__panel">Painel A</div><div class="semec-tabs__panel">Painel B</div></semec-tabs>`
        );
      });
      assert.equal(await page.$eval("#vert [role=tablist]", (l) => l.getAttribute("aria-orientation")), "vertical");
      await page.focus("#v1");
      await page.keyboard.press("ArrowRight");
      assert.equal((await focused(page)).id, "v1");
      await page.keyboard.press("ArrowDown");
      assert.equal((await focused(page)).id, "v2");
      assert.equal(await page.$eval("#vert", (t) => t.value), "b");
      await page.keyboard.press("ArrowUp");
      assert.equal((await focused(page)).id, "v1");
    });

    // ------------------------------------------------------------- accordion
    test("accordion: botão no heading, region rotulada, hidden, data-state e collapsible", async () => {
      await fresh();
      const before = await page.evaluate(() =>
        [...document.querySelectorAll("#acordeao .semec-accordion__item")].map((item) => {
          const t = item.querySelector("button");
          const p = item.querySelector(".semec-accordion__panel");
          return [t.parentElement.tagName, t.getAttribute("aria-expanded"), t.getAttribute("aria-controls") === p.id, p.getAttribute("role"), p.getAttribute("aria-labelledby") === t.id, p.hidden, item.getAttribute("data-state")];
        })
      );
      assert.deepEqual(before, Array(3).fill(["H3", "false", true, "region", true, true, "closed"]));
      await page.evaluate(() => {
        window.__acordeao = [];
        document.getElementById("acordeao").addEventListener("semec-change", (e) => window.__acordeao.push(e.detail.value));
      });
      await page.focus("#ac-2");
      await page.keyboard.press("Enter");
      assert.deepEqual(await attrs(page, "#ac-2", ["aria-expanded", "data-state", "aria-disabled"]), { "aria-expanded": "true", "data-state": "open", "aria-disabled": null });
      assert.equal(await visible(page, "#ac-painel-2"), true);
      await page.keyboard.press("Enter");
      assert.equal(await visible(page, "#ac-painel-2"), false, "collapsible: fecha o aberto");
      assert.deepEqual(await page.evaluate(() => window.__acordeao), ["ac-painel-2", ""]);
    });

    test("accordion: single sem collapsible trava o aberto (aria-disabled), multiple abre vários", async () => {
      await page.evaluate(() => {
        const item = (id, t) => `<div class="semec-accordion__item"><h3 class="semec-accordion__header"><button class="semec-accordion__trigger" id="${id}">${t}</button></h3><div class="semec-accordion__panel">Texto ${t}</div></div>`;
        document.getElementById("conteudo").insertAdjacentHTML(
          "beforeend",
          `<semec-accordion class="semec-accordion" id="fixo">${item("f1", "Um")}${item("f2", "Dois")}</semec-accordion><semec-accordion class="semec-accordion" id="varios" type="multiple">${item("m1", "Três")}${item("m2", "Quatro")}</semec-accordion>`
        );
      });
      await page.click("#f1");
      assert.equal(await page.$eval("#f1", (b) => b.getAttribute("aria-disabled")), "true");
      await page.$eval("#f1", (b) => b.click()); // o Playwright recusa clicar em aria-disabled
      assert.equal(await page.$eval("#f1", (b) => b.getAttribute("aria-expanded")), "true", "não fecha sem collapsible");
      await page.click("#f2");
      assert.deepEqual([await page.$eval("#f1", (b) => [b.getAttribute("aria-expanded"), b.getAttribute("aria-disabled")]), await page.$eval("#f2", (b) => b.getAttribute("aria-expanded"))], [["false", null], "true"]);
      await page.click("#m1");
      await page.click("#m2");
      assert.equal(await page.$eval("#varios", (a) => a.value), "0 1", "sem data-value nem id no painel, o valor é a posição");
      assert.deepEqual(await page.$$eval("#varios [aria-expanded]", (bs) => bs.map((b) => b.getAttribute("aria-expanded"))), ["true", "true"]);
    });

    // ------------------------------------------------------------------ menu
    test("menu: ARIA do botão e do menu, ↑ abre no último, setas com volta, data-highlighted, Tab fecha", async () => {
      await fresh();
      assert.deepEqual(await attrs(page, "#menu-gatilho", ["aria-haspopup", "aria-expanded", "aria-controls"]), { "aria-haspopup": "menu", "aria-expanded": "false", "aria-controls": null });
      assert.equal(await visible(page, "#menu .semec-menu"), false);
      const roles = await page.$$eval("#menu .semec-menu > *", (els) => els.map((e) => [e.getAttribute("role"), e.getAttribute("tabindex"), e.hasAttribute("data-disabled")]));
      assert.deepEqual(roles, [["menuitem", "-1", false], ["menuitem", "-1", false], ["separator", null, false], ["menuitem", "-1", false], ["menuitem", "-1", false], ["menuitem", "-1", true]]);

      await page.focus("#menu-gatilho");
      await page.keyboard.press("ArrowUp");
      assert.equal((await focused(page)).name, "Dividir", "↑ abre no último habilitado");
      const menuId = await page.$eval("#menu .semec-menu", (m) => m.id);
      assert.deepEqual(await attrs(page, "#menu-gatilho", ["aria-expanded", "aria-controls", "data-state"]), { "aria-expanded": "true", "aria-controls": menuId, "data-state": "open" });
      assert.equal(await page.$eval("#menu .semec-menu", (m) => [m.getAttribute("role"), m.getAttribute("aria-labelledby"), m.getAttribute("data-state")].join()), `menu,menu-gatilho,open`);
      await page.keyboard.press("ArrowDown");
      assert.equal((await focused(page)).name, "Editar", "↓ no último volta ao primeiro (o desabilitado fica de fora)");
      await page.keyboard.press("ArrowUp");
      assert.equal((await focused(page)).name, "Dividir", "↑ no primeiro vai ao último");
      assert.deepEqual(await page.$$eval("#menu [data-highlighted]", (els) => els.map((e) => e.textContent)), ["Dividir"]);
      await page.keyboard.press("Tab");
      assert.equal(await visible(page, "#menu .semec-menu"), false, "Tab fecha");
      assert.equal((await focused(page)).id, "ac-1", "e o foco segue para o próximo elemento depois do gatilho");
    });

    test("menu: semec-select (cancelável), clique fora, Espaço em link e clique do ponteiro", async () => {
      await page.evaluate(() => {
        window.__menu = [];
        document.getElementById("menu").addEventListener("semec-select", (e) => {
          window.__menu.push(e.detail.value);
          if (e.detail.value === "Duplicar") e.preventDefault();
        });
      });
      await page.focus("#menu-gatilho");
      await page.keyboard.press("Enter");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      assert.equal(await visible(page, "#menu .semec-menu"), true, "preventDefault mantém aberto");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Space");
      assert.equal(await page.evaluate(() => location.hash), "#arquivado", "Espaço ativa o link");
      assert.equal((await focused(page)).id, "menu-gatilho");
      assert.deepEqual(await page.evaluate(() => window.__menu), ["Duplicar", "Arquivar"]);

      await page.click("#menu-gatilho");
      assert.equal(await visible(page, "#menu .semec-menu"), true);
      assert.equal((await focused(page)).id, await page.$eval("#menu .semec-menu", (m) => m.id), "clique abre com o foco no menu, como o Radix");
      await page.mouse.click(1200, 20);
      assert.equal(await visible(page, "#menu .semec-menu"), false, "clique fora fecha");
      await page.click("#menu-gatilho");
      await page.click("#menu-gatilho");
      assert.equal(await visible(page, "#menu .semec-menu"), false, "segundo clique no botão fecha");
    });

    test("menu e combobox: data-side=\"top\" só quando o popup não cabe embaixo", async () => {
      await fresh();
      await page.setViewportSize({ width: 1280, height: 500 });
      // Altura fixa do popup e espaço para rolar: a medida não depende do CSS da F1.
      await page.addStyleTag({ content: "#menu .semec-menu:not([hidden]), #combo [role=listbox]:not([hidden]) { display: block; height: 300px; } body { padding-block: 1200px; }" });
      const side = async (trigger, popup, block) => {
        await page.$eval(trigger, (el, block) => el.scrollIntoView({ block }), block);
        await page.focus(trigger);
        await page.keyboard.press("ArrowDown");
        const value = await page.$eval(popup, (el) => el.getAttribute("data-side"));
        await page.keyboard.press("Escape");
        return value;
      };
      assert.equal(await side("#menu-gatilho", "#menu .semec-menu", "end"), "top");
      assert.equal(await side("#menu-gatilho", "#menu .semec-menu", "start"), null);
      assert.equal(await side("#escola", "#combo [role=listbox]", "end"), "top");
      assert.equal(await side("#escola", "#combo [role=listbox]", "start"), null);
      await page.setViewportSize({ width: 1280, height: 900 });
    });

    // -------------------------------------------------------------- combobox
    test("combobox: campo assume id/rótulo/descrição do select, select escondido e fora do Tab", async () => {
      await fresh();
      const info = await page.evaluate(() => {
        const input = document.querySelector("#combo input");
        const select = document.querySelector("#combo select");
        const listbox = document.querySelector("#combo [role=listbox]");
        return {
          input: [input.id, input.getAttribute("role"), input.labels[0]?.textContent, input.getAttribute("aria-describedby"), input.getAttribute("aria-controls") === listbox.id, input.getAttribute("aria-expanded"), input.getAttribute("aria-autocomplete"), input.placeholder],
          select: [select.hidden, select.getAttribute("aria-hidden"), select.tabIndex, select.name],
          listbox: [listbox.hidden, listbox.getAttribute("aria-labelledby") === input.labels[0].id],
        };
      });
      assert.deepEqual(info.input, ["escola", "combobox", "Escola", "escola-dica", true, "false", "list", "Selecione a escola"]);
      assert.deepEqual(info.select, [true, "true", -1, "escola"]);
      assert.deepEqual(info.listbox, [true, true]);
    });

    test("combobox: filtro sem acento, anúncio de resultados, aria-activedescendant e aria-selected", async () => {
      await page.focus("#escola");
      await page.keyboard.type("sao");
      await page.waitForFunction(() => document.querySelector("#combo [role=status]").textContent !== "");
      const st = await page.evaluate(() => {
        const input = document.getElementById("escola");
        const active = document.getElementById(input.getAttribute("aria-activedescendant"));
        return {
          expanded: input.getAttribute("aria-expanded"),
          options: [...document.querySelectorAll("#combo [role=option]")].map((o) => o.textContent),
          active: [active?.textContent, active?.hasAttribute("data-highlighted")],
          status: document.querySelector("#combo [role=status]").textContent,
        };
      });
      assert.deepEqual(st, { expanded: "true", options: ["EMEF São Sebastião"], active: ["EMEF São Sebastião", true], status: "1 resultado" });
      await page.keyboard.press("Enter");
      assert.equal(await page.$eval("#escola", (i) => i.value), "EMEF São Sebastião");
      await page.keyboard.press("ArrowDown");
      const sel = await page.$$eval("#combo [role=option]", (os) => os.map((o) => o.getAttribute("aria-selected")));
      assert.deepEqual(sel, ["false", "false", "false", "true", "false"], "aria-selected marca a escolhida");
      await page.keyboard.type("emef");
      await page.waitForFunction(() => document.querySelector("#combo [role=status]").textContent === "3 resultados");
      await page.keyboard.type("xyz");
      await page.waitForFunction(() => document.querySelector("#combo [role=status]").textContent === "Nenhum resultado");
      assert.equal(await visible(page, "#combo .semec-combobox__empty"), true);
      assert.equal(await page.$eval("#combo .semec-combobox__empty", (e) => e.textContent), "Nenhum resultado");
    });

    test("combobox: Esc fecha, o segundo Esc limpa; Tab sai; o formulário envia o valor do select", async () => {
      await page.keyboard.press("Escape");
      assert.equal(await page.$eval("#escola", (i) => [i.getAttribute("aria-expanded"), i.value].join("|")), "false|EMEF São Sebastião", "1º Esc fecha e restaura o texto");
      await page.keyboard.press("Escape");
      assert.equal(await page.$eval("#combo", (c) => c.value + "|" + c.input.value), "|", "2º Esc limpa");

      await page.evaluate(() => {
        window.__combo = [];
        document.getElementById("combo").addEventListener("semec-change", (e) => window.__combo.push(e.detail.value));
        document.querySelector("#combo select").addEventListener("change", (e) => window.__combo.push(`change:${e.target.value}`));
      });
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Tab");
      assert.equal((await focused(page)).id, "enviar", "Tab sai do campo");
      assert.equal(await page.$eval("#escola", (i) => i.getAttribute("aria-expanded")), "false");
      await page.focus("#escola");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      assert.deepEqual(await page.evaluate(() => window.__combo), ["change:santa-marcelina", "santa-marcelina"]);
      await Promise.all([page.waitForURL(/\/eco/), page.click("#enviar")]);
      assert.deepEqual(JSON.parse(await page.evaluate(() => document.body.innerText)), { escola: "santa-marcelina" });
    });

    test("combobox: clique abre e escolhe com o mouse; texto solto no blur volta ao escolhido", async () => {
      await fresh();
      await page.click("#escola");
      assert.equal(await visible(page, "#combo [role=listbox]"), true);
      await page.click("#combo [role=option] >> text=EMEI Pequeno Príncipe");
      assert.equal(await page.$eval("#combo", (c) => c.value), "pequeno-principe");
      assert.equal((await focused(page)).id, "escola", "o foco fica no campo");
      await page.keyboard.type("qualquer coisa");
      await page.focus("#depois");
      assert.equal(await page.$eval("#escola", (i) => i.value), "EMEI Pequeno Príncipe");
    });

    // ------------------------------------------------- registro, reconexão, sem JS
    test("registro duplo: duas cópias do bundle e defineSemecElements() repetido", async () => {
      for (const q of ["?duplo", "?esm"]) {
        await fresh(q);
        await page.waitForTimeout(200);
        assert.deepEqual(errors, [], `${q}: sem erros`);
        assert.equal(await page.$$eval("#combo input", (i) => i.length), 1, `${q}: um campo só`);
        await page.focus("#menu-gatilho");
        await page.keyboard.press("Enter");
        await page.keyboard.press("ArrowDown");
        assert.equal((await focused(page)).name, "Duplicar", `${q}: um ouvinte só por tecla`);
      }
    });

    test("desconectar limpa ouvintes; reconectar volta a funcionar sem duplicar", async () => {
      await fresh();
      // Remove o diálogo: o gatilho deixa de abrir (ouvinte do documento removido).
      await page.evaluate(() => {
        window.__dlg = document.getElementById("dialogo");
        window.__dlg.remove();
      });
      await page.click("#abrir-dialogo");
      assert.equal(await page.evaluate(() => window.__dlg.querySelector("dialog").open), false);
      await page.evaluate(() => document.getElementById("conteudo").append(window.__dlg));
      await page.click("#abrir-dialogo");
      assert.equal(await page.evaluate(() => window.__dlg.querySelector("dialog").open), true);
      await page.keyboard.press("Escape");
      // O evento "close" do <dialog> é assíncrono: espera o foco voltar antes de seguir.
      await page.waitForFunction(() => document.activeElement?.id === "abrir-dialogo");

      // Move abas, menu, combobox e acordeão (desconecta e conecta de novo).
      await page.evaluate(() => {
        const main = document.getElementById("conteudo");
        for (const id of ["abas", "menu", "combo", "acordeao"]) main.append(document.getElementById(id));
        window.__n = 0;
        document.getElementById("abas").addEventListener("semec-change", () => window.__n++);
      });
      assert.equal(await page.$$eval("#combo input, #combo [role=listbox], #combo [role=status]", (e) => e.length), 3, "combobox não duplica as partes");
      await page.focus("#aba-1");
      await page.keyboard.press("ArrowRight");
      assert.equal((await focused(page)).id, "aba-2", "abas: uma tecla, um passo");
      assert.equal(await page.evaluate(() => window.__n), 1);
      await page.focus("#menu-gatilho");
      await page.keyboard.press("Enter");
      await page.keyboard.press("ArrowDown");
      assert.equal((await focused(page)).name, "Duplicar", "menu: uma tecla, um passo");
      await page.keyboard.press("Escape");
      await page.focus("#ac-1");
      await page.keyboard.press("Enter");
      assert.equal(await page.$eval("#ac-1", (b) => b.getAttribute("aria-expanded")), "true", "acordeão: um clique, um toggle");
      await page.focus("#escola");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      assert.equal(await page.$eval("#escola", (i) => document.getElementById(i.getAttribute("aria-activedescendant")).textContent), "EMEF Santa Marcelina", "combobox: uma tecla, um passo");
      assert.deepEqual(errors, []);
    });

    test("sem JavaScript: painéis, itens do menu e select visíveis; nada de ARIA de widget", async () => {
      await fresh("?nojs");
      for (const sel of ["#painel-dados", "#painel-documentos", "#painel-historico", "#ac-painel-1", "#ac-painel-3", "#menu .semec-menu", "#escola"]) {
        assert.equal(await visible(page, sel), true, `${sel} visível`);
      }
      assert.equal(await page.$$eval("[role=tab], [role=menu], [role=combobox]", (e) => e.length), 0);
      await page.selectOption("#escola", "ulisses");
      await Promise.all([page.waitForURL(/\/eco/), page.click("#enviar")]);
      assert.deepEqual(JSON.parse(await page.evaluate(() => document.body.innerText)), { escola: "ulisses" });
    });

    // ------------------------------------------------------------------- axe
    test("axe: zero violações sem JS, com JS e com cada componente aberto", async () => {
      await fresh("?nojs");
      assert.deepEqual(await axe(page), [], "sem JS");
      await fresh();
      assert.deepEqual(await axe(page), [], "inicial");
      const estados = [
        ["dialog aberto", async () => { await page.click("#abrir-dialogo"); }, async () => page.keyboard.press("Escape")],
        ["alertdialog aberto", async () => { await page.click("#abrir-alerta"); }, async () => page.keyboard.press("Escape")],
        ["menu aberto", async () => { await page.focus("#menu-gatilho"); await page.keyboard.press("Enter"); }, async () => page.keyboard.press("Escape")],
        ["listbox aberto", async () => { await page.focus("#escola"); await page.keyboard.press("ArrowDown"); }, async () => page.keyboard.press("Escape")],
        ["lista vazia", async () => { await page.focus("#escola"); await page.keyboard.type("xyz"); await page.waitForTimeout(500); }, async () => { await page.keyboard.press("Escape"); await page.keyboard.press("Escape"); }],
        ["aba 2 e item aberto", async () => { await page.click("#aba-2"); await page.click("#ac-2"); }, async () => {}],
      ];
      for (const [label, abrir, fechar] of estados) {
        await abrir();
        await page.waitForTimeout(50);
        assert.deepEqual(await axe(page), [], label);
        await fechar();
      }
    });
  });
}
