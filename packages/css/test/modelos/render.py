"""Renderiza os casos de fixtures.json com os modelos Jinja2.

Lê os casos (JSON) da entrada padrão e escreve na saída
{"jinja": {id: html}, "jinja-sem-autoescape": {id: html}}.
O ambiente roda com o autoescape ligado (Django com django-jinja) e desligado
(Flask com extensão .jinja): a macro liga o seu próprio. StrictUndefined pega
variável esquecida no modelo.
"""

import json
import os
import sys

from jinja2 import ChoiceLoader, Environment, FileSystemLoader, PrefixLoader, StrictUndefined

AQUI = os.path.dirname(os.path.abspath(__file__))
TEMPLATES = os.path.join(AQUI, "..", "..", "templates", "jinja")
FILHOS = os.path.join(AQUI, "filhos")


def ambiente(autoescape):
    loader = ChoiceLoader([PrefixLoader({"semec": FileSystemLoader(TEMPLATES)}), FileSystemLoader(FILHOS)])
    return Environment(loader=loader, autoescape=autoescape, undefined=StrictUndefined)


def macro(parcial):
    return parcial.replace("-", "_")


def renderizar(env, caso):
    dados = caso["dados"]
    if caso["parcial"] == "pagina":
        return env.get_template("pagina.jinja").render(**dados)
    nome = macro(caso["parcial"])
    # O uso documentado: importar a macro e chamá-la com os parâmetros.
    chamada = env.from_string('{% from "semec/' + caso["parcial"] + '.jinja" import ' + nome + " %}{{ " + nome + "(**dados) }}")
    return chamada.render(dados=dados)


def main():
    casos = json.loads(sys.stdin.buffer.read().decode("utf-8"))
    com = ambiente(True)
    sem = ambiente(False)
    saida = {"jinja": {}, "jinja-sem-autoescape": {}}
    for caso in casos:
        saida["jinja"][caso["id"]] = renderizar(com, caso)
        saida["jinja-sem-autoescape"][caso["id"]] = renderizar(sem, caso)
    sys.stdout.buffer.write(json.dumps(saida, ensure_ascii=False).encode("utf-8"))


if __name__ == "__main__":
    main()
