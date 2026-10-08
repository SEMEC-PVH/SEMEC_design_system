#!/usr/bin/env python3
"""Conversor de imagens das batalhas da Vila SEMEC.

Transforma as imagens geradas por IA em arquivos prontos para o jogo:

- sprites (personagens em pixel art sobre fundo de cor chapada, verde ou
  magenta) -> WebP 512x512 com alfa binário, fundo removido por chroma key,
  arte reduzida à grade nativa e ampliada por fator inteiro (pixels nítidos),
  com os pés numa mesma linha de base;
- cenários (pixel art) -> WebP 1600x900, também reduzidos à grade nativa e
  ampliados por fator inteiro antes do corte.

Uso:
  python sprites/converter.py sprites            # sprites/<id>-<frente|costas>.png
  python sprites/converter.py cenarios           # sprites/cenarios/<chefe>.png
  python sprites/converter.py arquivo.png --tipo sprite --saida pasta/
  flags: --dry-run, --forcar, --tolerancia N, --estilo pixel|suave

Dependência única: Pillow.
"""

from __future__ import annotations

import argparse
import io
import math
import re
import sys
from collections import deque
from pathlib import Path

try:
    from PIL import Image, ImageFilter, ImageOps
except ImportError:  # pragma: no cover
    sys.exit("Erro: Pillow não está instalado. Rode: python -m pip install Pillow")

# ---- Caminhos ---------------------------------------------------------------------

RAIZ = Path(__file__).resolve().parent.parent
PASTA_SPRITES = RAIZ / "sprites"                     # origem principal dos personagens
PASTA_CENARIOS_ORIGEM = RAIZ / "sprites" / "cenarios"
PASTA_SPRITES_DESTINO = RAIZ / "apps" / "docs" / "public" / "quem-somos" / "batalha" / "sprites"
PASTA_CENARIOS_DESTINO = RAIZ / "apps" / "docs" / "public" / "quem-somos" / "batalha" / "cenarios"
DADOS_JS = RAIZ / "apps" / "docs" / "components" / "quem-somos" / "batalha" / "dados.js"

# ---- Parâmetros -------------------------------------------------------------------

SPRITE_LADO = 512              # canvas quadrado final
SPRITE_MARGEM = 0.04           # margem em volta do personagem (topo e laterais)
SPRITE_BASE = 0.06             # linha dos pés, a partir do fundo do canvas
SPRITE_QUALIDADE = 85          # usada só se o WebP sem perdas passar da meta
SPRITE_META_KB = 80
TRABALHO_MAX = 1024            # estilo suave: reduz a origem antes do chroma key

CENARIO_TAMANHO = (1600, 900)
CENARIO_QUALIDADE = 85
CENARIO_META_KB = 250

PASSO_MIN, PASSO_MAX = 3.0, 48.0   # faixa de tamanho do "pixel" da arte, em px
MENOR_ILHA_PIXEL = 3               # ilhas soltas com menos células que isto saem
ERRO_MAX_GRADE = 8.0               # diferença média de brilho aceita entre origem e grade

# Nomes de arquivo que diferem do id da espécie no jogo.
ALIASES = {
    "planilha": "excel",
    "nodejs": "node",
    "node-js": "node",
    "js": "javascript",
    "ts": "typescript",
}

# Usado só se dados.js não puder ser lido.
ESPECIES_PADRAO = {
    "javascript", "typescript", "python", "anaconda", "java", "kotlin", "css",
    "react", "php", "node", "sql", "mongodb", "figma", "excel", "cobol",
}
CHEFES_PADRAO = {"frontend", "backend", "database", "diretoria"}


# ---- Dados do jogo ----------------------------------------------------------------

def _bloco(texto: str, inicio: str, fim: str) -> str:
    i = texto.find(inicio)
    if i < 0:
        return ""
    j = texto.find(fim, i)
    return texto[i: j if j > 0 else len(texto)]


def carregar_ids() -> tuple[set[str], set[str], str]:
    """Lê os ids de LINGUAGENS e CHEFES em dados.js (sem executar JS)."""
    try:
        texto = DADOS_JS.read_text(encoding="utf-8")
    except OSError:
        return set(ESPECIES_PADRAO), set(CHEFES_PADRAO), "lista interna (dados.js não encontrado)"
    linguagens = _bloco(texto, "export const LINGUAGENS = {", "\n};")
    chefes = _bloco(texto, "export const CHEFES = [", "\n];")
    especies = set(re.findall(r"^  ([a-zA-Z0-9_]+): \{", linguagens, re.M))
    chefe_ids = set(re.findall(r'^    id: "([^"]+)"', chefes, re.M))
    if not especies or not chefe_ids:
        return set(ESPECIES_PADRAO), set(CHEFES_PADRAO), "lista interna (dados.js mudou de formato)"
    return especies, chefe_ids, "dados.js"


PADRAO_SPRITE = re.compile(r"(.+?)[-_ ](frente|costas)")


def mapear_sprite(arquivo: Path, especies: set[str]) -> tuple[str | None, str | None, str]:
    """'planilha-frente.png' -> ('excel', 'frente', aviso)."""
    stem = arquivo.stem.lower().strip()
    m = PADRAO_SPRITE.fullmatch(stem)
    if not m:
        return None, None, "nome fora do padrão <personagem>-<frente|costas>.png"
    nome, lado = m.group(1), m.group(2)
    especie = ALIASES.get(nome, nome)
    if especie not in especies:
        return None, lado, f"nome desconhecido: '{nome}' não é uma espécie de dados.js"
    return especie, lado, ""


# ---- Utilidades -------------------------------------------------------------------

def kb(dados: bytes) -> float:
    return len(dados) / 1024


def atualizado(origem: Path, destino: Path) -> bool:
    return destino.exists() and destino.stat().st_mtime >= origem.stat().st_mtime


def salvar_webp(img: Image.Image, destino: Path, meta_kb: float, qualidade: int,
                sem_perdas: bool) -> tuple[str, float]:
    """Salva em WebP. Pixel art tenta primeiro sem perdas (preserva a borda
    nítida); se passar da meta, usa com perdas reduzindo a qualidade (mín. 60)."""
    def codificar(**opcoes) -> bytes:
        buf = io.BytesIO()
        img.save(buf, "WEBP", method=6, exact=False, **opcoes)
        return buf.getvalue()

    dados, modo = b"", ""
    if sem_perdas:
        dados, modo = codificar(lossless=True, quality=100), "sem perdas"
    if not dados or kb(dados) > meta_kb:
        q = qualidade
        while True:
            dados, modo = codificar(quality=q, alpha_quality=100), f"q{q}"
            if kb(dados) <= meta_kb or q <= 60:
                break
            q -= 5
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(dados)
    return modo, kb(dados)


def _rgb_para_ycc(r: float, g: float, b: float) -> tuple[float, float, float]:
    y = 0.299 * r + 0.587 * g + 0.114 * b
    cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
    cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
    return y, cb, cr


def _ycc_para_rgb(y: float, cb: float, cr: float) -> tuple[int, int, int]:
    r = y + 1.402 * (cr - 128)
    g = y - 0.344136 * (cb - 128) - 0.714136 * (cr - 128)
    b = y + 1.772 * (cb - 128)
    return tuple(0 if v < 0 else 255 if v > 255 else int(v + 0.5) for v in (r, g, b))


def _mediana(valores) -> float:
    v = sorted(valores)
    return float(v[len(v) // 2]) if v else 0.0


def _smoothstep(a: float, b: float, x: float) -> float:
    if x <= a:
        return 0.0
    if x >= b:
        return 1.0
    t = (x - a) / (b - a)
    return t * t * (3 - 2 * t)


def nome_da_cor(rgb) -> str:
    r, g, b = rgb
    if g > r + 60 and g > b + 60:
        return "verde"
    if r > g + 60 and b > g + 60:
        return "magenta"
    return f"{int(r)},{int(g)},{int(b)}"


# ---- Fundo e spill (para qualquer cor de fundo) ------------------------------------

PESO_LUMA = 0.35  # quanto a diferença de brilho conta (sombras do fundo pesam pouco)


class Fundo:
    """Cor de fundo estimada pelos cantos e utilidades de distância/spill."""

    def __init__(self, rgb: Image.Image):
        w, h = rgb.size
        lado = max(2, int(min(w, h) * 0.04))
        caixas = [(0, 0, lado, lado), (w - lado, 0, w, lado),
                  (0, h - lado, lado, h), (w - lado, h - lado, w, h)]
        rs, gs, bs = [], [], []
        for caixa in caixas:
            px = rgb.crop(caixa).tobytes()
            rs.extend(px[0::3])
            gs.extend(px[1::3])
            bs.extend(px[2::3])
        self.cor = (_mediana(rs), _mediana(gs), _mediana(bs))
        self.y, self.cb, self.cr = _rgb_para_ycc(*self.cor)
        # Direção do croma do fundo (para tirar o "spill" dessa cor).
        vx, vy = self.cb - 128, self.cr - 128
        norma = math.hypot(vx, vy)
        self.saturacao = norma
        self.dir = (vx / norma, vy / norma) if norma > 1e-6 else (0.0, 0.0)
        dists = sorted(self.distancia(*_rgb_para_ycc(r, g, b)) for r, g, b in zip(rs, gs, bs))
        self.ruido = dists[int(len(dists) * 0.98)] if dists else 0.0

    def distancia(self, y: float, cb: float, cr: float) -> float:
        dy = (y - self.y) * PESO_LUMA
        return math.sqrt((cb - self.cb) ** 2 + (cr - self.cr) ** 2 + dy * dy)

    def limiares(self, tolerancia: float) -> tuple[float, float]:
        """t1: abaixo é fundo; t2: acima é personagem (faixa de transição no meio)."""
        t1 = min(60.0, max(18.0, self.ruido * 1.3 + 8)) * tolerancia
        return t1, t1 + 40.0

    def tirar_spill(self, r: float, g: float, b: float, peso: float = 1.0):
        """Remove do pixel a componente de croma na direção da cor do fundo."""
        y, cb, cr = _rgb_para_ycc(r, g, b)
        ux, uy = self.dir
        s = (cb - 128) * ux + (cr - 128) * uy
        if s <= 0:
            return int(r + 0.5), int(g + 0.5), int(b + 0.5)
        s *= peso
        return _ycc_para_rgb(y, cb - s * ux, cr - s * uy)

    def conferir(self, avisos: list[str]) -> None:
        nome = nome_da_cor(self.cor)
        if self.saturacao < 60:
            avisos.append(f"pouco fundo de cor chapada detectado nos cantos (cor {nome}): "
                          "confira se o fundo é verde ou magenta liso")
        elif nome not in ("verde", "magenta"):
            avisos.append(f"fundo detectado com cor {nome} (esperado verde ou magenta)")
        if self.ruido > 40:
            avisos.append(f"fundo irregular (ruído {self.ruido:.0f}): degradê, sombra ou "
                          "personagem nos cantos?")


def remover_componentes_pequenos(mascara: bytearray, w: int, h: int, area_min: int) -> int:
    """Zera ilhas opacas menores que area_min (vizinhança 8). Retorna quantas removeu."""
    visitado = bytearray(len(mascara))
    removidas = 0
    for inicio in range(len(mascara)):
        if not mascara[inicio] or visitado[inicio]:
            continue
        fila = deque([inicio])
        visitado[inicio] = 1
        comp = []
        while fila:
            p = fila.popleft()
            comp.append(p)
            x, y = p % w, p // w
            for dy in (-1, 0, 1):
                ny = y + dy
                if ny < 0 or ny >= h:
                    continue
                base = ny * w
                for dx in (-1, 0, 1):
                    nx = x + dx
                    if nx < 0 or nx >= w:
                        continue
                    q = base + nx
                    if mascara[q] and not visitado[q]:
                        visitado[q] = 1
                        fila.append(q)
        if len(comp) < area_min:
            removidas += 1
            for p in comp:
                mascara[p] = 0
    return removidas


# ---- Grade da pixel art ------------------------------------------------------------

def _perfis(img: Image.Image) -> tuple[list[float], list[float]]:
    """Soma das variações de brilho por coluna e por linha (onde há bordas de pixel)."""
    lum = img.convert("L")
    w, h = lum.size
    d = lum.tobytes()
    col = [0.0] * w
    lin = [0.0] * h
    for y in range(h):
        o = y * w
        linha = d[o:o + w]
        for x in range(1, w):
            col[x] += abs(linha[x] - linha[x - 1])
        if y:
            ant = d[o - w:o]
            lin[y] = float(sum(abs(a - b) for a, b in zip(linha, ant)))
    return col, lin


def _magnitude(perfil: list[float], passo: float) -> float:
    """Quão periódico o perfil é com este passo (0..1), via série de Fourier."""
    tot = sum(perfil) or 1.0
    c = s = 0.0
    k = 2 * math.pi / passo
    for x, v in enumerate(perfil):
        if v:
            c += v * math.cos(k * x)
            s += v * math.sin(k * x)
    return math.hypot(c, s) / tot


def _passo(perfil: list[float]) -> tuple[float, float]:
    melhor, mag = 0.0, 0.0
    p = PASSO_MIN
    while p <= PASSO_MAX:
        m = _magnitude(perfil, p)
        if m > mag:
            melhor, mag = p, m
        p += 0.05
    # Se o pico for um harmônico (metade/terço do passo real), sobe para o real.
    for mult in (3, 2):
        cand = melhor * mult
        if cand <= PASSO_MAX and _magnitude(perfil, cand) >= 0.6 * mag:
            melhor, mag = cand, _magnitude(perfil, cand)
    return melhor, mag


def _cortes(perfil: list[float], passo: float) -> list[int]:
    """Fronteiras das células: bordas fortes encontradas + preenchimento pelo passo
    nos trechos sem borda (acompanha a grade mesmo quando ela 'escorrega')."""
    n = len(perfil)
    ordenado = sorted(perfil)
    limiar = max(ordenado[n // 2] * 3, ordenado[-1] * 0.08, 1.0)
    raio = max(1, int(passo * 0.4))
    picos = [x for x in range(1, n)
             if perfil[x] >= limiar and perfil[x] == max(perfil[max(0, x - raio): x + raio + 1])]
    pontos = [0] + picos + [n]
    cortes = [0]
    for a, b in zip(pontos, pontos[1:]):
        if b - a < passo * 0.5:
            continue
        k = max(1, round((b - a) / passo))
        cortes.extend(round(a + (b - a) * i / k) for i in range(1, k + 1))
    cortes[-1] = n
    return cortes


def detectar_grade(img: Image.Image):
    """Retorna (imagem_nativa, passo_x, passo_y) ou None se não achar uma grade confiável."""
    col, lin = _perfis(img)
    px, mx = _passo(col)
    py, my = _passo(lin)
    if min(mx, my) < 0.06:
        return None
    if abs(px - py) / max(px, py) > 0.2:  # pixels muito retangulares: suspeito
        return None
    cx, cy = _cortes(col, px), _cortes(lin, py)
    if len(cx) < 17 or len(cy) < 17:
        return None
    nativa = reduzir_para_grade(img, cx, cy)
    if erro_da_grade(img, nativa, cx, cy) > ERRO_MAX_GRADE:
        return None
    return nativa, px, py


def erro_da_grade(img: Image.Image, nativa: Image.Image, cx: list[int], cy: list[int]) -> float:
    """Diferença média de brilho entre a origem e a grade reconstruída (amostrada).
    Pixel art de verdade fica baixo; grade errada (ou arte sem grade) fica alto."""
    from bisect import bisect_right
    lum = img.convert("L")
    nat = nativa.convert("L")
    w = lum.width
    d = lum.tobytes()
    nd = nat.tobytes()
    nw = nat.width
    col = [bisect_right(cx, x) - 1 for x in range(w)]
    soma = cont = 0
    for y in range(0, lum.height, 3):
        j = bisect_right(cy, y) - 1
        o, no = y * w, j * nw
        for x in range(0, w, 3):
            soma += abs(d[o + x] - nd[no + col[x]])
            cont += 1
    return soma / max(1, cont)


def reduzir_para_grade(img: Image.Image, cx: list[int], cy: list[int]) -> Image.Image:
    """Uma cor por célula: mediana do miolo (metade central) da célula."""
    rgb = img.convert("RGB")
    w = rgb.width
    dados = rgb.tobytes()
    nativa = Image.new("RGB", (len(cx) - 1, len(cy) - 1))
    saida = bytearray()
    for j in range(len(cy) - 1):
        y0, y1 = cy[j], cy[j + 1]
        iy0 = y0 + (y1 - y0) // 4
        iy1 = max(iy0 + 1, y1 - (y1 - y0) // 4)
        for i in range(len(cx) - 1):
            x0, x1 = cx[i], cx[i + 1]
            ix0 = x0 + (x1 - x0) // 4
            ix1 = max(ix0 + 1, x1 - (x1 - x0) // 4)
            rs, gs, bs = [], [], []
            for yy in range(iy0, iy1):
                o = (yy * w + ix0) * 3
                trecho = dados[o: o + (ix1 - ix0) * 3]
                rs.extend(trecho[0::3])
                gs.extend(trecho[1::3])
                bs.extend(trecho[2::3])
            saida += bytes((int(_mediana(rs)), int(_mediana(gs)), int(_mediana(bs))))
    nativa.frombytes(bytes(saida))
    return nativa


# ---- Chroma key --------------------------------------------------------------------

def chroma_key_binario(rgb: Image.Image, tolerancia: float, avisos: list[str]) -> Image.Image:
    """Pixel art: alfa 0/255, sem semitransparência; spill tirado das células de borda."""
    w, h = rgb.size
    fundo = Fundo(rgb)
    fundo.conferir(avisos)
    t1, t2 = fundo.limiares(tolerancia)
    corte = (t1 + t2) / 2

    dados = rgb.tobytes()
    ycc = rgb.convert("YCbCr").tobytes()
    n = w * h
    solido = bytearray(n)
    for i in range(n):
        o = i * 3
        if fundo.distancia(ycc[o], ycc[o + 1], ycc[o + 2]) > corte:
            solido[i] = 1

    transparente = solido.count(0) / n
    if transparente < 0.15:
        avisos.append(f"pouco fundo removido ({transparente:.0%}): confira se o fundo é liso")

    area_min = MENOR_ILHA_PIXEL if n <= 512 * 512 else max(16, int(n * 0.0002))
    removidas = remover_componentes_pequenos(solido, w, h, area_min)
    if removidas:
        avisos.append(f"{removidas} mancha(s) solta(s) removida(s)")

    # "Tingida": célula opaca cujo croma aponta para a cor do fundo (cos > 0,85)
    # com força relevante. Isolada (quase sem vizinhas tingidas), é mistura com o
    # fundo presa num vão, e não parte do personagem: perde o tom também.
    ux, uy = fundo.dir
    tingida = bytearray(n)
    for i in range(n):
        if solido[i]:
            o = i * 3
            vx, vy = ycc[o + 1] - 128, ycc[o + 2] - 128
            norma = math.hypot(vx, vy)
            if norma > 0.3 * fundo.saturacao and (vx * ux + vy * uy) > 0.85 * norma:
                tingida[i] = 1

    def isolada(i: int) -> bool:
        x, y = i % w, i // w
        vizinhas = 0
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if (dx or dy) and 0 <= x + dx < w and 0 <= y + dy < h and tingida[i + dy * w + dx]:
                    vizinhas += 1
        return vizinhas < 2

    # Células de borda (vizinhas do fundo): tira o tom da cor de fundo.
    saida = bytearray(n * 4)
    for i in range(n):
        if not solido[i]:
            continue
        o = i * 3
        r, g, b = dados[o], dados[o + 1], dados[o + 2]
        x, y = i % w, i // w
        borda = ((x > 0 and not solido[i - 1]) or (x < w - 1 and not solido[i + 1])
                 or (y > 0 and not solido[i - w]) or (y < h - 1 and not solido[i + w]))
        if borda or (tingida[i] and isolada(i)):
            r, g, b = fundo.tirar_spill(r, g, b)
        else:
            # Miolo: só o que ainda está bem perto da cor de fundo.
            d = fundo.distancia(ycc[o], ycc[o + 1], ycc[o + 2])
            peso = 1.0 - _smoothstep(corte, t2 + 15, d)
            if peso > 0:
                r, g, b = fundo.tirar_spill(r, g, b, peso)
        saida[i * 4: i * 4 + 4] = bytes((r, g, b, 255))
    return Image.frombytes("RGBA", (w, h), bytes(saida))


def chroma_key_suave(img: Image.Image, tolerancia: float, avisos: list[str]) -> Image.Image:
    """Estilo suave (3D): alfa com transição, 'desmistura' da cor de fundo e spill."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    fundo = Fundo(rgb)
    fundo.conferir(avisos)
    t1, t2 = fundo.limiares(tolerancia)
    kr, kg, kb_ = fundo.cor
    despill_fim = t2 + 15.0

    dados = rgb.tobytes()
    ycc = rgb.convert("YCbCr").tobytes()
    n = w * h
    alfa = bytearray(n)
    cor = bytearray(n * 3)
    for i in range(n):
        o = i * 3
        d = fundo.distancia(ycc[o], ycc[o + 1], ycc[o + 2])
        if d <= t1:
            continue
        r, g, b = dados[o], dados[o + 1], dados[o + 2]
        if d >= despill_fim:
            alfa[i] = 255
            cor[o:o + 3] = bytes((r, g, b))
            continue
        a = _smoothstep(t1, t2, d)
        if a < 1.0:
            inv = 1.0 - a
            aa = max(a, 0.15)
            r = min(255.0, max(0.0, (r - inv * kr) / aa))
            g = min(255.0, max(0.0, (g - inv * kg) / aa))
            b = min(255.0, max(0.0, (b - inv * kb_) / aa))
        peso = 1.0 if a < 1.0 else 1.0 - _smoothstep(t1, despill_fim, d)
        cor[o:o + 3] = bytes(fundo.tirar_spill(r, g, b, peso))
        alfa[i] = int(a * 255 + 0.5)

    if alfa.count(0) / n < 0.15:
        avisos.append(f"pouco fundo removido ({alfa.count(0) / n:.0%}): confira se o fundo é liso")

    solido = bytearray(1 if a >= 128 else 0 for a in alfa)
    removidas = remover_componentes_pequenos(solido, w, h, max(16, int(n * 0.0002)))
    if removidas:
        avisos.append(f"{removidas} mancha(s) solta(s) removida(s)")
    mascara = Image.frombytes("L", (w, h), bytes(v * 255 for v in solido))
    mascara = mascara.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    suporte = mascara.filter(ImageFilter.MaxFilter(5))
    alfa_img = Image.composite(Image.frombytes("L", (w, h), bytes(alfa)),
                               Image.new("L", (w, h), 0), suporte)

    # Faixa de ~2 px junto ao fundo: spill removido por inteiro.
    faixa = alfa_img.point(lambda v: 255 if v < 8 else 0).filter(ImageFilter.MaxFilter(5)).tobytes()
    a_final = alfa_img.tobytes()
    for i in range(n):
        if faixa[i] and a_final[i]:
            o = i * 3
            cor[o:o + 3] = bytes(fundo.tirar_spill(cor[o], cor[o + 1], cor[o + 2]))
    rgb_out = Image.frombytes("RGB", (w, h), bytes(cor))
    rgb_out.putalpha(alfa_img)
    return rgb_out


# ---- Sprite -----------------------------------------------------------------------

def _abrir_rgb(origem: Path, avisos: list[str]) -> Image.Image:
    img = ImageOps.exif_transpose(Image.open(origem))
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        rgba = img.convert("RGBA")
        if rgba.getchannel("A").getextrema()[0] < 255:
            avisos.append("a origem já tem transparência: ela vira fundo magenta antes do recorte")
            base = Image.new("RGB", rgba.size, (255, 0, 255))
            base.paste(rgba, mask=rgba.getchannel("A"))
            return base
    return img.convert("RGB")


def processar_sprite(origem: Path, destino: Path, tolerancia: float, estilo: str,
                     avisos: list[str]) -> str:
    img = _abrir_rgb(origem, avisos)
    tam_origem = img.size
    pixel = estilo == "pixel"
    grade_txt = ""

    if pixel:
        grade = detectar_grade(img)
        if grade:
            base, px, py = grade
            grade_txt = f"grade {base.width}x{base.height} (pixel ~{px:.1f}x{py:.1f} px)"
        else:
            avisos.append("grade de pixel não detectada: redimensionado direto com vizinho "
                          "mais próximo (fator não inteiro)")
            base = img
        recortado = chroma_key_binario(base, tolerancia, avisos)
        inteiro = grade is not None
    else:
        base = img
        if max(base.size) > TRABALHO_MAX:
            esc = TRABALHO_MAX / max(base.size)
            base = base.resize((round(base.width * esc), round(base.height * esc)), Image.LANCZOS)
        recortado = chroma_key_suave(base, tolerancia, avisos)
        inteiro = False

    alfa = recortado.getchannel("A")
    caixa = alfa.point(lambda v: 255 if v >= 24 else 0).getbbox()
    if not caixa:
        raise ValueError("nada sobrou depois de remover o fundo (o fundo não é liso, "
                         "ou a imagem é toda da cor do fundo?)")
    w, h = recortado.size
    borda = 0 if inteiro else 2
    encostado = [nome for nome, cond in (
        ("esquerda", caixa[0] <= borda), ("topo", caixa[1] <= borda),
        ("direita", caixa[2] >= w - borda), ("base", caixa[3] >= h - borda),
    ) if cond]
    if encostado:
        avisos.append("personagem encostando na borda (" + ", ".join(encostado) + "): pode estar cortado")

    lado = SPRITE_LADO
    margem = round(lado * SPRITE_MARGEM)
    linha_base = round(lado * (1 - SPRITE_BASE))
    larg_util = lado - 2 * margem
    alt_util = linha_base - margem
    x0, y0, x1, y1 = caixa
    bw, bh = x1 - x0, y1 - y0

    canvas = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    if pixel:
        pers = recortado.crop(caixa)
        if inteiro:
            fator = min(larg_util // bw, alt_util // bh)
            if fator < 1:
                fator = 1
                avisos.append("grade nativa maior que o canvas: personagem não cabe sem reduzir")
            nova = (bw * fator, bh * fator)
            escala_txt = f"x{fator}"
            ocupacao = max(nova[0] / larg_util, nova[1] / alt_util)
            if ocupacao < 0.8:
                avisos.append(f"com fator inteiro x{fator} o personagem ocupa só {ocupacao:.0%} do "
                              "espaço (grade nativa fina); fica menor que os outros")
        else:
            esc = min(larg_util / bw, alt_util / bh)
            nova = (max(1, round(bw * esc)), max(1, round(bh * esc)))
            escala_txt = f"x{esc:.2f}"
        pers = pers.resize(nova, Image.NEAREST)
        px_ = (lado - nova[0]) // 2
        py_ = linha_base - nova[1]
        canvas.paste(pers, (px_, py_))
        larg_esc, alt_esc = nova
    else:
        folga = (max(0, x0 - 2), max(0, y0 - 2), min(w, x1 + 2), min(h, y1 + 2))
        pers = recortado.crop(folga)
        esc = min(larg_util / bw, alt_util / bh)
        if esc > 1.0:
            avisos.append(f"personagem pequeno na origem: ampliado {esc:.1f}x (pode ficar borrado)")
        nova = (max(1, round(pers.width * esc)), max(1, round(pers.height * esc)))
        pers = pers.convert("RGBa").resize(nova, Image.LANCZOS).convert("RGBA")
        off_x, off_y = (x0 - folga[0]) * esc, (y0 - folga[1]) * esc
        larg_esc, alt_esc = round(bw * esc), round(bh * esc)
        canvas.paste(pers, (round((lado - larg_esc) / 2 - off_x), round(linha_base - alt_esc - off_y)))
        escala_txt = f"x{esc:.2f}"

    # Pixels totalmente transparentes com RGB zerado comprimem melhor.
    a = canvas.getchannel("A")
    canvas = Image.composite(canvas, Image.new("RGBA", canvas.size, (0, 0, 0, 0)),
                             a.point(lambda v: 255 if v else 0))

    modo, tamanho = salvar_webp(canvas, destino, SPRITE_META_KB, SPRITE_QUALIDADE, sem_perdas=pixel)
    if tamanho > SPRITE_META_KB:
        avisos.append(f"acima da meta de {SPRITE_META_KB} KB mesmo com {modo}")
    elif pixel and modo != "sem perdas":
        avisos.append(f"sem perdas passou da meta: salvo com perdas ({modo})")
    partes = [f"{tam_origem[0]}x{tam_origem[1]} -> {lado}x{lado}", f"{tamanho:.1f} KB ({modo})"]
    if grade_txt:
        partes.append(grade_txt)
    partes.append(f"personagem {larg_esc}x{alt_esc} px ({escala_txt})")
    return ", ".join(partes)


# ---- Cenário ----------------------------------------------------------------------

def _cobrir_centralizado(img: Image.Image, tamanho: tuple[int, int]) -> Image.Image:
    """Corte central no tamanho pedido (a imagem já deve cobri-lo)."""
    w, h = img.size
    tw, th = tamanho
    x0, y0 = (w - tw) // 2, (h - th) // 2
    return img.crop((x0, y0, x0 + tw, y0 + th))


def processar_cenario(origem: Path, destino: Path, estilo: str, avisos: list[str]) -> str:
    img = ImageOps.exif_transpose(Image.open(origem)).convert("RGB")
    tam_origem = img.size
    alvo_w, alvo_h = CENARIO_TAMANHO
    prop = img.width / img.height
    proporcoes = {"16:9": 16 / 9, "3:2": 3 / 2}
    if all(abs(prop - p) / p > 0.05 for p in proporcoes.values()):
        avisos.append(f"proporção {prop:.2f} diferente de 16:9 e de 3:2: as bordas serão cortadas")
    detalhe = ""

    grade = detectar_grade(img) if estilo == "pixel" else None
    if estilo == "pixel" and grade:
        nativa, px, py = grade
        fator = max(math.ceil(alvo_w / nativa.width), math.ceil(alvo_h / nativa.height))
        ampliada = nativa.resize((nativa.width * fator, nativa.height * fator), Image.NEAREST)
        saida = _cobrir_centralizado(ampliada, CENARIO_TAMANHO)
        detalhe = f", grade {nativa.width}x{nativa.height} (pixel ~{px:.1f}x{py:.1f} px), x{fator}"
    else:
        if estilo == "pixel":
            avisos.append("grade de pixel não detectada: redimensionado direto com vizinho "
                          "mais próximo (fator não inteiro)")
            filtro = Image.NEAREST
        else:
            filtro = Image.LANCZOS
        if img.width < alvo_w or img.height < alvo_h:
            avisos.append(f"origem menor que {alvo_w}x{alvo_h}: será ampliada")
        saida = ImageOps.fit(img, CENARIO_TAMANHO, filtro, centering=(0.5, 0.5))

    modo, tamanho = salvar_webp(saida, destino, CENARIO_META_KB, CENARIO_QUALIDADE,
                                sem_perdas=estilo == "pixel")
    if tamanho > CENARIO_META_KB:
        avisos.append(f"acima da meta de {CENARIO_META_KB} KB mesmo com {modo}")
    return f"{tam_origem[0]}x{tam_origem[1]} -> {alvo_w}x{alvo_h}, {tamanho:.1f} KB ({modo}){detalhe}"


# ---- CLI --------------------------------------------------------------------------

def rel(p: Path) -> str:
    try:
        return str(p.resolve().relative_to(RAIZ)).replace("\\", "/")
    except ValueError:
        return str(p)


def _pngs(pasta: Path) -> list[Path]:
    if not pasta.is_dir():
        return []
    return sorted(p for p in pasta.iterdir() if p.is_file() and p.suffix.lower() == ".png")


def planejar(args) -> list[tuple[Path, Path | None, str, list[str]]]:
    """Lista de (origem, destino, tipo, avisos-de-mapeamento)."""
    especies, chefes, fonte = carregar_ids()
    print(f"ids do jogo lidos de {fonte}: {len(especies)} espécies, {len(chefes)} chefes")
    lote = args.alvo in ("sprites", "cenarios")
    saida = Path(args.saida) if args.saida else None
    tarefas = []

    if args.alvo == "sprites":
        tipo = "sprite"
        # Só a raiz de sprites/ (subpastas como 3d/ e prompts*/ ficam de fora).
        # PNGs fora do padrão <id>-<frente|costas> são ignorados em silêncio.
        arquivos = [p for p in _pngs(PASTA_SPRITES) if PADRAO_SPRITE.fullmatch(p.stem.lower())]
        if not arquivos:
            print(f"nenhum PNG <personagem>-<frente|costas>.png em {rel(PASTA_SPRITES)}/")
    elif args.alvo == "cenarios":
        tipo = "cenario"
        if not PASTA_CENARIOS_ORIGEM.is_dir():
            print(f"pasta {rel(PASTA_CENARIOS_ORIGEM)} não existe: nada a fazer")
            return []
        arquivos = _pngs(PASTA_CENARIOS_ORIGEM)
        if not arquivos:
            print(f"nenhum PNG em {rel(PASTA_CENARIOS_ORIGEM)}")
    else:
        tipo = args.tipo
        arquivos = [Path(args.alvo)]
        if not arquivos[0].is_file():
            sys.exit(f"Erro: arquivo não encontrado: {args.alvo}")

    for origem in arquivos:
        avisos = []
        if tipo == "sprite":
            especie, lado, aviso = mapear_sprite(origem, especies)
            if aviso:
                avisos.append(aviso)
            if especie:
                nome = f"{especie}-{lado}.webp"
            elif saida is not None and not lote:
                nome = origem.stem + ".webp"  # arquivo avulso: converte mesmo assim
            else:
                tarefas.append((origem, None, tipo, avisos))
                continue
            destino = (saida or PASTA_SPRITES_DESTINO) / nome
        else:
            chefe = origem.stem.lower()
            if chefe not in chefes:
                avisos.append(f"nome desconhecido: '{chefe}' não é um chefe de dados.js "
                              f"({', '.join(sorted(chefes))})")
                if saida is None or lote:
                    tarefas.append((origem, None, tipo, avisos))
                    continue
            destino = (saida or PASTA_CENARIOS_DESTINO) / f"{chefe}.webp"
        tarefas.append((origem, destino, tipo, avisos))
    return tarefas


def main(argv=None) -> int:
    for fluxo in (sys.stdout, sys.stderr):
        try:
            if fluxo.isatty():
                fluxo.reconfigure(errors="replace")
            else:  # saída redirecionada (Git Bash, arquivo): UTF-8
                fluxo.reconfigure(encoding="utf-8", errors="replace")
        except AttributeError:
            pass

    ap = argparse.ArgumentParser(
        description="Converte personagens e cenários das batalhas da Vila SEMEC para WebP.")
    ap.add_argument("alvo", help="'sprites', 'cenarios' ou o caminho de um PNG")
    ap.add_argument("--tipo", choices=("sprite", "cenario"), default="sprite",
                    help="tipo do arquivo avulso (padrão: sprite)")
    ap.add_argument("--saida", help="pasta de destino (padrão: apps/docs/public/quem-somos/batalha/...)")
    ap.add_argument("--dry-run", action="store_true", help="só lista o que faria")
    ap.add_argument("--forcar", action="store_true", help="regera mesmo se o destino estiver atualizado")
    ap.add_argument("--tolerancia", type=float, default=1.0,
                    help="multiplica o limiar do chroma key (ex.: 1.3 remove mais fundo, 0.8 menos)")
    ap.add_argument("--estilo", choices=("pixel", "suave"), default="pixel",
                    help="pixel (padrão): grade nativa, NEAREST, alfa binário; suave: arte 3D")
    args = ap.parse_args(argv)

    tarefas = planejar(args)
    feitos = pulados = erros = ignorados = 0
    for origem, destino, tipo, avisos in tarefas:
        print(f"\n{rel(origem)}")
        if destino is None:
            for a in avisos:
                print(f"  ! {a}")
            print("  -> ignorado")
            ignorados += 1
            continue
        print(f"  -> {rel(destino)}")
        if not args.forcar and atualizado(origem, destino):
            print("  = destino já atualizado (use --forcar para regerar)")
            pulados += 1
            continue
        if args.dry_run:
            for a in avisos:
                print(f"  ! {a}")
            print(f"  (dry-run: {tipo} não gerado)")
            continue
        try:
            if tipo == "sprite":
                info = processar_sprite(origem, destino, args.tolerancia, args.estilo, avisos)
            else:
                info = processar_cenario(origem, destino, args.estilo, avisos)
        except Exception as e:  # noqa: BLE001 - relata e segue para o próximo
            print(f"  x ERRO: {e}")
            for a in avisos:
                print(f"  ! {a}")
            erros += 1
            continue
        print(f"  {info}")
        for a in avisos:
            print(f"  ! {a}")
        feitos += 1

    print(f"\nResumo: {feitos} gerado(s), {pulados} já atualizado(s), "
          f"{ignorados} ignorado(s), {erros} erro(s)" + (" [dry-run]" if args.dry_run else ""))
    return 1 if erros else 0


if __name__ == "__main__":
    sys.exit(main())
