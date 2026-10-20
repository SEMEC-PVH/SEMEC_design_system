"""Prova a configuração do Flask documentada no templates/README.md (CONS-03).

Monta um app Flask de verdade como a documentação manda: templates/jinja
copiado para templates/semec/ e a tela do app (filho de semec/pagina.jinja)
ao lado. Renderiza a mesma tela, com um nome malicioso, em três situações e
escreve o HTML de cada uma em JSON na saída padrão:

  padrao-jinja       Flask sem configurar, tela .jinja  (o autoescape do Flask
                     só vale para .html/.htm/.xml/.xhtml/.svg: o filho sai cru)
  documentado-jinja  app.jinja_env.autoescape = select_autoescape([... "jinja"])
  padrao-html        Flask sem configurar, tela .html
"""

import json
import os
import shutil
import sys
import tempfile

from flask import Flask, render_template
from jinja2 import select_autoescape

AQUI = os.path.dirname(os.path.abspath(__file__))
TEMPLATES = os.path.join(AQUI, "..", "..", "templates", "jinja")
TELAS = os.path.join(AQUI, "telas-flask")
NOME = '<img src=x onerror="alert(1)">'


def app(pasta, documentado):
    aplicacao = Flask(__name__, template_folder=pasta)
    if documentado:
        # O trecho do templates/README.md (seção Flask).
        aplicacao.jinja_env.autoescape = select_autoescape(["html", "htm", "xml", "xhtml", "jinja"])
    return aplicacao


def renderizar(pasta, documentado, tela):
    aplicacao = app(pasta, documentado)
    with aplicacao.test_request_context("/"):
        return render_template(tela, titulo="Protocolo — SEMEC", dados={"nome": NOME})


def main():
    with tempfile.TemporaryDirectory() as tmp:
        pasta = os.path.join(tmp, "templates")
        shutil.copytree(TEMPLATES, os.path.join(pasta, "semec"))
        for nome in os.listdir(TELAS):
            shutil.copy(os.path.join(TELAS, nome), pasta)
        saida = {
            "padrao-jinja": renderizar(pasta, False, "tela.jinja"),
            "documentado-jinja": renderizar(pasta, True, "tela.jinja"),
            "padrao-html": renderizar(pasta, False, "tela.html"),
        }
    sys.stdout.buffer.write(json.dumps(saida, ensure_ascii=False).encode("utf-8"))


if __name__ == "__main__":
    main()
