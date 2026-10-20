"""Renderiza o exemplo Jinja do templates/README.md como está (CONS-04).

O teste extrai o trecho para .cache/exemplos/exemplo.jinja. Ambiente com
StrictUndefined (o README diz que funciona) e o autoescape que a seção Flask
manda configurar. Saída: {"jinja": {"get": html, "post": html}}.
"""

import json
import os
import sys

from jinja2 import ChoiceLoader, Environment, FileSystemLoader, PrefixLoader, StrictUndefined, select_autoescape

AQUI = os.path.dirname(os.path.abspath(__file__))
TEMPLATES = os.path.join(AQUI, "..", "..", "templates", "jinja")
EXEMPLOS = os.path.join(AQUI, ".cache", "exemplos")

LAYOUT = {"titulo": "Transferência escolar — SEMEC", "cabecalho": {"marca_src": "/img/marca.svg", "servico": "Matrícula e transferência"}}
CENARIOS = {
    "get": {"erros": {}, "dados": {}},
    "post": {"erros": {"cpf": "Informe o CPF."}, "dados": {"cpf": ""}},
}


def main():
    env = Environment(
        loader=ChoiceLoader([PrefixLoader({"semec": FileSystemLoader(TEMPLATES)}), FileSystemLoader(EXEMPLOS)]),
        autoescape=select_autoescape(["html", "htm", "xml", "xhtml", "jinja"]),
        undefined=StrictUndefined,
    )
    saida = {"jinja": {nome: env.get_template("exemplo.jinja").render(**LAYOUT, **c) for nome, c in CENARIOS.items()}}
    sys.stdout.buffer.write(json.dumps(saida, ensure_ascii=False).encode("utf-8"))


if __name__ == "__main__":
    main()
