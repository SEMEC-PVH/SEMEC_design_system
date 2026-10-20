// Exemplo do @semec/ds-css: o CSS dá a aparência; validação, resumo de erros e aviso são do app.
(function () {
  const ESCOLAS = { "emef-joao-paulo": "EMEF João Paulo II", "emef-santa-marcelina": "EMEF Santa Marcelina", "emef-rio-madeira": "EMEF Rio Madeira" };
  const TURNOS = { manha: "Manhã", tarde: "Tarde", integral: "Integral" };
  const ORDEM = ["nome", "nascimento", "cpf", "telefone", "escola", "turno", "motivo", "declaracao"];
  const STATUS = { Deferida: "success", "Em análise": "warning", Indeferida: "danger" };
  const linhas = [
    ["2026-000318", "Ana Beatriz Souza", "EMEF Rio Madeira", "Manhã", "Deferida"],
    ["2026-000322", "Carlos Henrique Lima", "EMEF Santa Marcelina", "Tarde", "Em análise"],
    ["2026-000327", "Joana Ferreira", "EMEF João Paulo II", "Integral", "Indeferida"],
  ];

  const $ = (id) => document.getElementById(id);
  const form = $("form");
  const so = (v) => v.replace(/\D/g, "");

  function cpfValido(v) {
    const d = so(v);
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    for (const t of [9, 10]) {
      let s = 0;
      for (let i = 0; i < t; i++) s += Number(d[i]) * (t + 1 - i);
      if (((s * 10) % 11) % 10 !== Number(d[t])) return false;
    }
    return true;
  }

  function ler() {
    const fd = new FormData(form);
    return {
      nome: String(fd.get("nome") || "").trim(),
      nascimento: String(fd.get("nascimento") || ""),
      cpf: String(fd.get("cpf") || ""),
      telefone: String(fd.get("telefone") || ""),
      escola: String(fd.get("escola") || ""),
      turno: String(fd.get("turno") || ""),
      motivo: String(fd.get("motivo") || "").trim(),
      declaracao: $("declaracao").checked,
    };
  }

  function validar(d) {
    const e = {};
    if (d.nome.length < 3) e.nome = "Informe o nome completo do estudante (ao menos 3 caracteres).";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.nascimento)) e.nascimento = "Informe a data de nascimento do estudante.";
    if (!d.cpf) e.cpf = "Informe o CPF.";
    else if (!cpfValido(d.cpf)) e.cpf = "CPF inválido. Confira os 11 dígitos.";
    if (so(d.telefone).length < 10) e.telefone = "Informe o telefone com DDD.";
    if (!d.escola) e.escola = "Escolha a escola de destino.";
    if (!d.turno) e.turno = "Escolha o turno desejado.";
    if (d.motivo.length < 10) e.motivo = "Descreva o motivo da transferência (ao menos 10 caracteres).";
    else if (d.motivo.length > 500) e.motivo = "O motivo pode ter até 500 caracteres.";
    if (!d.declaracao) e.declaracao = "Confirme que as informações são verdadeiras.";
    return e;
  }

  // Erro inline: .semec-error abaixo do campo + aria-invalid + aria-describedby (dica some enquanto há erro).
  function mostrarErros(erros) {
    for (const id of ORDEM) {
      const bloco = form.querySelector(`[data-campo="${id}"]`);
      bloco.querySelector(".semec-error")?.remove();
      const alvos = id === "turno" ? [...form.querySelectorAll('input[name="turno"]')] : [$(id)];
      const hint = $(`${id}-hint`);
      if (erros[id]) {
        const p = document.createElement("p");
        p.className = "semec-error";
        p.id = `${id}-error`;
        p.textContent = erros[id];
        bloco.appendChild(p);
        if (hint) hint.hidden = true;
        if (id === "turno") bloco.setAttribute("aria-describedby", `${id}-error`);
        alvos.forEach((a) => {
          a.setAttribute("aria-invalid", "true");
          if (id !== "turno") a.setAttribute("aria-describedby", `${id}-error`);
        });
      } else {
        if (hint) hint.hidden = false;
        if (id === "turno") bloco.removeAttribute("aria-describedby");
        alvos.forEach((a) => {
          a.removeAttribute("aria-invalid");
          if (hint) a.setAttribute("aria-describedby", `${id}-hint`);
          else if (id !== "turno") a.removeAttribute("aria-describedby");
        });
      }
    }
    const lista = $("resumo-lista");
    lista.replaceChildren();
    const ids = ORDEM.filter((id) => erros[id]);
    for (const id of ids) {
      const a = document.createElement("a");
      a.href = `#${id}`;
      a.textContent = erros[id];
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        const alvo = id === "turno" ? form.querySelector('input[name="turno"]') : $(id);
        alvo.focus();
        alvo.scrollIntoView({ block: "center" });
      });
      const li = document.createElement("li");
      li.appendChild(a);
      lista.appendChild(li);
    }
    $("resumo").hidden = ids.length === 0;
    return ids.length;
  }

  function avisar(titulo, texto) {
    const toast = document.createElement("div");
    toast.className = "semec-toast semec-toast--success";
    const corpo = document.createElement("div");
    corpo.className = "semec-toast__body";
    const t = document.createElement("p");
    t.className = "semec-toast__title";
    t.textContent = titulo;
    const d = document.createElement("p");
    d.className = "semec-toast__description";
    d.textContent = texto;
    corpo.append(t, d);
    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "semec-toast__close";
    fechar.setAttribute("aria-label", "Fechar notificação");
    fechar.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';
    fechar.addEventListener("click", () => {
      toast.remove();
      $("enviar").focus();
    });
    toast.append(corpo, fechar);
    $("avisos").appendChild(toast);
  }

  function desenharTabela() {
    const tb = $("linhas");
    tb.replaceChildren();
    for (const l of linhas) {
      const tr = document.createElement("tr");
      l.forEach((v, i) => {
        const td = document.createElement("td");
        if (i === 4) {
          const s = document.createElement("span");
          s.className = `semec-badge semec-badge--${STATUS[v]}`;
          s.textContent = v;
          td.appendChild(s);
        } else td.textContent = v;
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    }
  }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const dados = ler();
    if (mostrarErros(validar(dados)) > 0) {
      $("resumo").focus();
      return;
    }
    const protocolo = `2026-${String(330 + linhas.length).padStart(6, "0")}`;
    linhas.push([protocolo, dados.nome, ESCOLAS[dados.escola], TURNOS[dados.turno], "Em análise"]);
    desenharTabela();
    form.reset();
    avisar("Solicitação enviada", `Protocolo ${protocolo}. Acompanhe o andamento na tabela abaixo.`);
  });
  form.addEventListener("reset", () => setTimeout(() => mostrarErros({}), 0));
  desenharTabela();
})();
