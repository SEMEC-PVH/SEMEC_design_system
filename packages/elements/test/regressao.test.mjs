/**
 * Regressões dos achados do teste independente de acessibilidade da onda 3
 * (A11Y-01…17) e do teste do consumidor (CONS-10), em navegador real.
 * Cada teste reproduz o passo do relatório e falhava antes da correção.
 * Chromium sempre; Firefox e WebKit quando instalados (SEMEC_BROWSERS restringe).
 */
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, availableBrowsers, launch, open, axe, focused } from "./support/harness.mjs";

const srv = await startServer();
const browsers = await availableBrowsers();
after(() => srv.close());

const insert = (page, html) =>
  page.evaluate((html) => document.getElementById("conteudo").insertAdjacentHTML("beforeend", html), html);
const tick = (page, ms = 50) => page.waitForTimeout(ms);

/**
 * Regra que o @semec/ds-css precisa ter para `data-align="end"` (registrada para
 * o integrador): o popup ancora pela direita do wrapper. Injetada aqui para medir
 * a geometria; o atributo é o que o elemento entrega.
 */
const ALIGN_END_CSS =
  ".semec-menu[data-align=end], .semec-combobox__listbox[data-align=end], .semec-combobox__empty[data-align=end] { left: auto; right: 0; } .semec-menu, .semec-combobox__listbox { max-width: calc(100vw - 2rem); }";

for (const name of browsers) {
  describe(`${name}`, () => {
    let browser;
    let page;

    before(async () => {
      browser = await launch(name);
    });
    after(async () => {
      await browser?.close();
    });

    const fresh = async () => {
      await page?.close();
      ({ page } = await open(browser, `${srv.base}/bancada`));
      return page;
    };

    // ------------------------------------------------------------------ tabs
    test("A11Y-01: abas <button> sem aria-controls e painéis sem id usam a posição", async () => {
      await fresh();
      await insert(
        page,
        `<semec-tabs class="semec-tabs" id="turnos"><div class="semec-tabs__list" aria-label="Período"><button type="button" class="semec-tabs__trigger" id="t-m">Manhã</button><button type="button" class="semec-tabs__trigger" id="t-t">Tarde</button><button type="button" class="semec-tabs__trigger" id="t-n">Noite</button></div><div class="semec-tabs__panel">Turno da manhã.</div><div class="semec-tabs__panel">Turno da tarde.</div><div class="semec-tabs__panel">Turno da noite.</div></semec-tabs>`
      );
      const state = () =>
        page.evaluate(() => ({
          values: [...document.querySelectorAll("#turnos [role=tab]")].map((t) => t.dataset.value),
          selected: [...document.querySelectorAll("#turnos [role=tab]")].map((t) => t.getAttribute("aria-selected")),
          visible: [...document.querySelectorAll("#turnos [role=tabpanel]")].filter((p) => !p.hidden).map((p) => p.textContent),
        }));
      assert.deepEqual((await state()).values, ["0", "1", "2"]);
      await page.click("#t-n");
      assert.deepEqual(await state(), { values: ["0", "1", "2"], selected: ["false", "false", "true"], visible: ["Turno da noite."] }, "o clique em Noite ativa Noite");
      await page.focus("#t-n");
      await page.keyboard.press("Home");
      assert.equal((await focused(page)).id, "t-m");
      await page.keyboard.press("ArrowRight");
      assert.equal((await focused(page)).id, "t-t", "→ sai da primeira aba");
      assert.deepEqual((await state()).visible, ["Turno da tarde."]);
      await page.keyboard.press("End");
      assert.equal((await focused(page)).id, "t-n");
    });

    test("A11Y-08: abas removidas e acrescentadas depois de montado", async () => {
      const dyn = await page.evaluate(async () => {
        const tabs = document.getElementById("turnos");
        const list = tabs.querySelector("[role=tablist]");
        document.getElementById("t-t").click(); // remove a do meio: sobram "0" e "2"
        const active = list.querySelector("[aria-selected=true]");
        document.getElementById(active.getAttribute("aria-controls")).remove();
        active.remove();
        await new Promise((r) => setTimeout(r, 50));
        const depoisDeRemover = {
          selected: [...list.querySelectorAll("[role=tab]")].filter((t) => t.getAttribute("aria-selected") === "true").map((t) => t.id),
          tabbable: [...list.querySelectorAll("[role=tab]")].filter((t) => t.tabIndex === 0).map((t) => t.id),
          visible: [...tabs.querySelectorAll(".semec-tabs__panel")].filter((p) => !p.hidden).map((p) => p.textContent),
        };
        const nb = document.createElement("button");
        nb.type = "button";
        nb.className = "semec-tabs__trigger";
        nb.id = "t-i";
        nb.textContent = "Integral";
        list.append(nb);
        const np = document.createElement("div");
        np.className = "semec-tabs__panel";
        np.textContent = "Turno integral.";
        tabs.append(np);
        await new Promise((r) => setTimeout(r, 50));
        const antesDoClique = { role: nb.getAttribute("role"), controls: nb.getAttribute("aria-controls") === np.id, panelHidden: np.hidden, value: nb.dataset.value };
        nb.click();
        return { depoisDeRemover, antesDoClique, depoisDoClique: { selected: nb.getAttribute("aria-selected"), panelHidden: np.hidden, value: tabs.value } };
      });
      assert.deepEqual(dyn.depoisDeRemover, { selected: ["t-m"], tabbable: ["t-m"], visible: ["Turno da manhã."] }, "a primeira aba assume");
      assert.deepEqual(dyn.antesDoClique, { role: "tab", controls: true, panelHidden: true, value: "2-2" }, "a aba nova é montada, com valor que não repete o de outra");
      assert.deepEqual(dyn.depoisDoClique, { selected: "true", panelHidden: false, value: "2-2" });
    });

    test("A11Y-11: link interno para painel inativo (ou algo dentro dele) ativa a aba", async () => {
      await fresh();
      await page.evaluate(() => {
        document.getElementById("painel-historico").insertAdjacentHTML("beforeend", '<label for="motivo">Motivo</label> <input id="motivo">');
        document.getElementById("antes").insertAdjacentHTML(
          "afterend",
          '<a id="lnk-painel" href="#painel-historico">Ver histórico</a> <a id="lnk-campo" href="#motivo">Informe o motivo</a> <a id="lnk-acordeao" href="#ac-painel-3">Prazo</a>'
        );
        // Resumo de erros como o do exemplo do ds-css: o script do link foca o campo.
        document.getElementById("lnk-campo").addEventListener("click", (e) => {
          e.preventDefault();
          document.getElementById("motivo").focus();
        });
      });
      await page.click("#lnk-painel");
      await tick(page, 100);
      assert.deepEqual(await page.evaluate(() => [document.getElementById("abas").value, document.getElementById("painel-historico").hidden]), ["painel-historico", false]);

      await page.evaluate(() => document.getElementById("abas").setAttribute("value", "painel-dados"));
      await page.click("#lnk-campo");
      assert.equal((await focused(page)).id, "motivo", "o foco chega ao campo do painel inativo");
      assert.equal(await page.$eval("#abas", (t) => t.value), "painel-historico");

      await page.evaluate(() => document.getElementById("abas").setAttribute("value", "painel-dados"));
      await page.evaluate(() => (location.hash = "#painel-documentos"));
      await page.waitForFunction(() => document.getElementById("abas").value === "painel-documentos");
      assert.equal(await page.$eval("#painel-documentos", (p) => p.hidden), false, "hashchange também ativa");

      await page.click("#lnk-acordeao");
      await tick(page, 100);
      assert.deepEqual(await page.evaluate(() => [document.getElementById("ac-3").getAttribute("aria-expanded"), document.getElementById("ac-painel-3").hidden]), ["true", false], "acordeão: o item do alvo abre");
    });

    // --------------------------------------------------------------- accordion
    test("A11Y-12: item de acordeão acrescentado depois é montado", async () => {
      const r = await page.evaluate(async () => {
        const acc = document.getElementById("acordeao");
        const it = document.createElement("div");
        it.className = "semec-accordion__item";
        it.innerHTML = '<h3 class="semec-accordion__header"><button type="button" class="semec-accordion__trigger" id="ac-novo">Novo item</button></h3><div class="semec-accordion__panel"><p>Novo conteúdo</p></div>';
        acc.append(it);
        await new Promise((r) => setTimeout(r, 50));
        const b = it.querySelector("button");
        const p = it.querySelector(".semec-accordion__panel");
        const antes = { expanded: b.getAttribute("aria-expanded"), hidden: p.hidden, role: p.getAttribute("role"), labelled: p.getAttribute("aria-labelledby") === b.id, controls: b.getAttribute("aria-controls") === p.id };
        b.click();
        await new Promise((r) => setTimeout(r, 50));
        return { antes, depois: { expanded: b.getAttribute("aria-expanded"), hidden: p.hidden } };
      });
      assert.deepEqual(r, { antes: { expanded: "false", hidden: true, role: "region", labelled: true, controls: true }, depois: { expanded: "true", hidden: false } });
    });

    // ------------------------------------------------------------------ menu
    test("A11Y-09 e A11Y-16: item acrescentado recebe o papel; rótulo de seção vira grupo", async () => {
      await fresh();
      const added = await page.evaluate(async () => {
        const m = document.querySelector("#menu .semec-menu");
        const b = document.createElement("button");
        b.className = "semec-menu__item";
        b.textContent = "Novo item";
        m.append(b);
        await new Promise((r) => setTimeout(r, 50));
        document.getElementById("menu").open("last");
        return { role: b.getAttribute("role"), tabindex: b.getAttribute("tabindex"), type: b.type, focus: document.activeElement === b };
      });
      assert.deepEqual(added, { role: "menuitem", tabindex: "-1", type: "button", focus: true });
      await page.keyboard.press("Escape");

      await insert(
        page,
        `<semec-menu id="menu-secoes"><button type="button" class="semec-btn semec-btn--outline" id="secoes-gatilho" data-semec-menu-trigger>Seções</button><div class="semec-menu"><div class="semec-menu__label" id="rot-rascunho">Rascunho</div><button type="button" class="semec-menu__item">Editar</button><button type="button" class="semec-menu__item">Duplicar</button><hr class="semec-menu__separator"><div class="semec-menu__label">Envio</div><button type="button" class="semec-menu__item">Enviar</button></div></semec-menu>`
      );
      await page.focus("#secoes-gatilho");
      await page.keyboard.press("Enter");
      const tree = await page.evaluate(() => {
        const m = document.querySelector("#menu-secoes .semec-menu");
        return [...m.children].map((c) => {
          const label = c.getAttribute("aria-labelledby");
          return [c.getAttribute("role") ?? (c.getAttribute("aria-hidden") === "true" ? "oculto" : "texto"), label ? document.getElementById(label).textContent : null, [...c.querySelectorAll("[role=menuitem]")].map((i) => i.textContent)];
        });
      });
      assert.deepEqual(tree, [
        ["oculto", null, []],
        ["group", "Rascunho", ["Editar", "Duplicar"]],
        ["separator", null, []],
        ["oculto", null, []],
        ["group", "Envio", ["Enviar"]],
      ]);
      assert.equal((await focused(page)).name, "Editar", "a navegação continua pelos itens dos grupos");
      await page.keyboard.press("ArrowUp");
      assert.equal((await focused(page)).name, "Enviar");
      const snap = await page.locator("#menu-secoes [role=menu]").ariaSnapshot();
      assert.doesNotMatch(snap, /^\s*- text: Rascunho/m, "o rótulo não fica como texto solto no menu");
      assert.deepEqual(await axe(page), [], "axe com o menu de seções aberto");
      await page.keyboard.press("Escape");
    });

    test("A11Y-04: menu e listbox perto da borda direita alinham pelo fim do wrapper", async () => {
      await fresh();
      await page.addStyleTag({ content: `#borda-dir { text-align: right; } #combo-dir { width: 120px; margin-left: auto; } ${ALIGN_END_CSS}` });
      await insert(
        page,
        `<div id="borda-dir"><semec-menu id="menu-dir"><button type="button" class="semec-btn semec-btn--outline" id="dir-gatilho" data-semec-menu-trigger>Opções</button><div class="semec-menu"><button type="button" class="semec-menu__item">Primeira opção com um nome bem comprido</button><button type="button" class="semec-menu__item">Segunda</button></div></semec-menu></div><label class="semec-label" for="sigla">Sigla</label><semec-combobox class="semec-combobox" id="combo-dir"><select class="semec-field" id="sigla" name="sigla"><option value="">Sigla</option><option>RO</option><option>AM</option></select></semec-combobox>`
      );
      const medir = async (trigger, popup) => {
        await page.$eval(trigger, (el) => el.scrollIntoView({ block: "center" }));
        await page.focus(trigger);
        await page.keyboard.press("ArrowDown");
        const r = await page.$eval(popup, (el) => {
          const b = el.getBoundingClientRect();
          return { align: el.getAttribute("data-align"), left: b.left, right: b.right, vw: document.documentElement.clientWidth, scrollW: document.documentElement.scrollWidth };
        });
        await page.keyboard.press("Escape");
        return r;
      };
      for (const width of [1280, 320]) {
        await page.setViewportSize({ width, height: 900 });
        const menu = await medir("#dir-gatilho", "#menu-dir .semec-menu");
        assert.equal(menu.align, "end", `${width}px: menu com data-align="end"`);
        assert.ok(menu.left >= 0 && menu.right <= menu.vw + 0.5, `${width}px: o menu cabe (${menu.left}..${menu.right} em ${menu.vw})`);
        assert.ok(menu.scrollW <= menu.vw, `${width}px: sem rolagem horizontal (${menu.scrollW} > ${menu.vw})`);
        const combo = await medir("#sigla", "#combo-dir [role=listbox]");
        assert.equal(combo.align, "end", `${width}px: listbox com data-align="end"`);
        assert.ok(combo.left >= 0 && combo.right <= combo.vw + 0.5 && combo.scrollW <= combo.vw, `${width}px: o listbox cabe`);
      }
      await page.setViewportSize({ width: 1280, height: 900 });
      assert.equal((await medir("#menu-gatilho", "#menu .semec-menu")).align, null, "longe da borda: sem data-align");
      assert.equal((await medir("#escola", "#combo [role=listbox]")).align, null);
    });

    // -------------------------------------------------------------- combobox
    test("A11Y-03: opções que chegam depois e atributos do select não apagam o texto digitado", async () => {
      await fresh();
      await page.focus("#escola");
      await page.keyboard.type("Nova");
      await tick(page, 100);
      await page.evaluate(() => {
        const s = document.querySelector("#combo select");
        for (const n of ["Nova Esperança", "Nova Vida"]) s.append(new Option(n, n.toLowerCase()));
        s.setAttribute("aria-invalid", "true");
      });
      await page.waitForFunction(() => document.querySelector("#combo [role=status]").textContent.trim() === "2 resultados");
      const st = await page.evaluate(() => {
        const i = document.getElementById("escola");
        return {
          texto: i.value,
          expanded: i.getAttribute("aria-expanded"),
          opcoes: [...document.querySelectorAll("#combo [role=option]")].map((o) => o.textContent),
          ativa: document.getElementById(i.getAttribute("aria-activedescendant") ?? "")?.textContent ?? null,
        };
      });
      assert.deepEqual(st, { texto: "Nova", expanded: "true", opcoes: ["Nova Esperança", "Nova Vida"], ativa: "Nova Esperança" });
      await page.keyboard.press("Enter");
      assert.equal(await page.$eval("#combo", (c) => c.value), "nova esperança");
    });

    test("A11Y-10: disabled, aria-invalid, aria-describedby e required do select chegam ao campo", async () => {
      const read = () => page.$eval("#escola", (i) => ({ disabled: i.disabled, invalid: i.getAttribute("aria-invalid"), describedby: i.getAttribute("aria-describedby"), required: i.required }));
      await page.evaluate(() => {
        const s = document.querySelector("#combo select");
        s.disabled = true;
        s.setAttribute("aria-describedby", "escola-dica escola-erro");
        s.required = true;
      });
      await tick(page);
      assert.deepEqual(await read(), { disabled: true, invalid: "true", describedby: "escola-dica escola-erro", required: true });
      assert.equal(await page.$eval("#combo select", (s) => s.required), false, "o select escondido não fica obrigatório (travaria o envio sem mensagem)");
      await page.evaluate(() => {
        const s = document.querySelector("#combo select");
        s.disabled = false;
        s.removeAttribute("aria-invalid");
      });
      await tick(page);
      assert.deepEqual(await read(), { disabled: false, invalid: null, describedby: "escola-dica escola-erro", required: true });
    });

    test("A11Y-07: combobox obrigatório não envia texto solto (Alt+↑ ou clique fecham a lista)", async () => {
      await fresh();
      await page.evaluate(() => {
        document.querySelector("#combo select").required = true;
        window.__envios = 0;
        document.getElementById("formulario").addEventListener("submit", (e) => {
          window.__envios++;
          e.preventDefault();
        });
      });
      const tentar = async (fechar) => {
        await page.focus("#escola");
        await page.keyboard.press("Control+A");
        await page.keyboard.type("xyz");
        await tick(page);
        await fechar();
        assert.equal(await page.$eval("#escola", (i) => i.getAttribute("aria-expanded")), "false");
        await page.keyboard.press("Enter");
        await tick(page, 100);
        return page.evaluate(() => ({ envios: window.__envios, valido: document.getElementById("escola").validity.valid, msg: document.getElementById("escola").validationMessage }));
      };
      assert.deepEqual(await tentar(() => page.keyboard.press("Alt+ArrowUp")), { envios: 0, valido: false, msg: "Escolha uma opção da lista." }, "Alt+↑");
      assert.deepEqual(await tentar(() => page.click("#escola")), { envios: 0, valido: false, msg: "Escolha uma opção da lista." }, "clique no campo");
      // Texto igual ao de uma opção: Enter com a lista fechada escolhe e envia.
      await page.focus("#escola");
      await page.keyboard.press("Control+A");
      await page.keyboard.type("emef rio madeira");
      await page.keyboard.press("Alt+ArrowUp");
      await page.keyboard.press("Enter");
      await tick(page, 100);
      assert.deepEqual(await page.evaluate(() => [window.__envios, document.getElementById("combo").value]), [1, "rio-madeira"]);
    });

    test("A11Y-13: a região viva reanuncia contagens iguais e fica vazia ao fechar", async () => {
      await fresh();
      const status = () => page.$eval("#combo [role=status]", (s) => s.textContent);
      await page.focus("#escola");
      await page.keyboard.type("emef");
      await page.waitForFunction(() => document.querySelector("#combo [role=status]").textContent.trim() === "3 resultados");
      const s1 = await status();
      await page.keyboard.type(" ");
      await page.waitForFunction((s1) => document.querySelector("#combo [role=status]").textContent !== s1, s1);
      const s2 = await status();
      assert.equal(s2.trim(), "3 resultados");
      assert.notEqual(s2, s1, "o texto muda para o leitor de tela ler de novo");
      await page.focus("#depois");
      assert.equal(await status(), "", "sem texto velho depois de sair do campo");
    });

    test("A11Y-14: Esc que limpa a escolha avisa na região viva", async () => {
      await page.focus("#escola");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      assert.notEqual(await page.$eval("#combo", (c) => c.value), "");
      await page.keyboard.press("Escape");
      assert.deepEqual(await page.evaluate(() => [document.getElementById("combo").value, document.querySelector("#combo [role=status]").textContent]), ["", "Escolha removida"]);
    });

    // ---------------------------------------------------------------- dialog
    test("A11Y-15: remover o <semec-dialog> aberto devolve o foco ao gatilho", async () => {
      await fresh();
      await page.click("#abrir-dialogo");
      assert.equal((await focused(page)).id, "telefone");
      const r = await page.evaluate(async () => {
        document.getElementById("dialogo").remove();
        await new Promise((r) => setTimeout(r, 50));
        return { foco: document.activeElement.id, lock: document.documentElement.hasAttribute("data-semec-scroll-lock"), expanded: document.getElementById("abrir-dialogo").getAttribute("aria-expanded") };
      });
      assert.deepEqual(r, { foco: "abrir-dialogo", lock: false, expanded: "false" });
    });

    test("CONS-10: <semec-dialog alert> põe o modificador --alert do @semec/ds-css", async () => {
      await fresh();
      assert.equal(await page.$eval("#excluir dialog", (d) => d.classList.contains("semec-dialog--alert")), true);
      assert.equal(await page.$eval("#dialogo dialog", (d) => d.classList.contains("semec-dialog--alert")), false);
    });
  });
}
