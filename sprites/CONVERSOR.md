# Conversor de imagens das batalhas

`sprites/converter.py` transforma as imagens de pixel art geradas por IA em arquivos prontos para as batalhas da Vila SEMEC. Precisa só de Python 3 com Pillow (`python -m pip install Pillow`).

## 1. Gerar

- **Personagens:** pixel art em formato quadrado (ex.: 1254×1254), corpo inteiro, sem encostar na borda e com o fundo de **uma cor lisa**:
  - **magenta** (`#FF00FF`) para os personagens verdes: `node-frente`, `mongodb-frente` e `planilha-frente`;
  - **verde** (`#00FF00`) para todos os outros.
- **Cenários:** pixel art em 16:9 ou 3:2 (ex.: nativa ~240×160 ampliada), sem fundo de chroma key.

## 2. Salvar

| Tipo | Pasta | Nome do arquivo |
|---|---|---|
| Personagem | `sprites/` | `<personagem>-<frente\|costas>.png` (ex.: `python-frente.png`, `planilha-frente.png`) |
| Cenário | `sprites/cenarios/` | `<chefe>.png`: `frontend`, `backend`, `database` ou `diretoria` |

Os nomes dos personagens são os mesmos dos prompts. O conversor traduz `planilha` para `excel`, que é o id da espécie no jogo. Os ids válidos são lidos de `apps/docs/components/quem-somos/batalha/dados.js`.

O modo `sprites` lê só a raiz de `sprites/`: PNGs fora do padrão e as subpastas (`3d/`, `prompts*/`, `cenarios/`) ficam de fora. A pasta `sprites/3d/` (versão 3D, rejeitada) não é usada.

## 3. Rodar

Na raiz do repositório:

```bash
python sprites/converter.py sprites --dry-run   # mostra o que vai gerar, sem gravar nada
python sprites/converter.py sprites             # todos os personagens
python sprites/converter.py cenarios            # todos os cenários

# um arquivo só, numa pasta de teste
python sprites/converter.py sprites/python-frente.png --tipo sprite --saida teste/
python sprites/converter.py sprites/cenarios/frontend.png --tipo cenario --saida teste/
```

O que o conversor faz:

1. Descobre o tamanho do "pixel" da arte e reduz a imagem para a resolução nativa, com uma cor por pixel.
2. **Só nos personagens:** remove o fundo pela cor detectada nos cantos (verde ou magenta). A transparência fica só "tudo ou nada", sem borda borrada. O tom da cor de fundo é tirado da borda, para não sobrar halo.
3. Amplia por um fator **inteiro** com vizinho mais próximo, sem nenhuma suavização.

Saída:

- **Personagens:** `apps/docs/public/quem-somos/batalha/sprites/<especie>-<frente|costas>.webp`. Canvas 512×512 transparente, personagem centralizado e com os pés na linha a 6% do fundo. Meta < 80 KB.
- **Cenários:** `apps/docs/public/quem-somos/batalha/cenarios/<chefe>.webp`. 1600×900; a arte é ampliada até cobrir esse tamanho e depois cortada no centro. Meta < 250 KB.

O WebP sai **sem perdas**, para manter os pixels nítidos. Se passar da meta, o conversor salva com perdas e avisa.

## 4. Conferir

Para cada arquivo, o terminal mostra:

- o destino e as dimensões;
- os KB;
- a grade detectada (ex.: `grade 149x144 (pixel ~8.4x8.9 px)`) e o fator de ampliação (ex.: `x4`);
- os avisos, nas linhas com `!`.

Avisos mais comuns:

- **pouco fundo de cor chapada / pouco fundo removido**: o fundo não é liso. Gere a imagem de novo.
- **fundo detectado com cor …**: o fundo não é verde nem magenta.
- **fundo irregular**: há degradê, sombra ou parte do personagem nos cantos.
- **personagem encostando na borda**: provavelmente está cortado.
- **grade de pixel não detectada**: a imagem não tem uma grade regular de pixels (comum em cenários gerados por IA "estilo pixel art"). Ela foi redimensionada direto com vizinho mais próximo, sem fator inteiro. Confira o resultado; se ficar ruim, gere de novo pedindo pixel art de grade fixa.
- **ocupa só N% do espaço**: a arte tem pixels muito pequenos, e o fator inteiro deixou o personagem menor que os outros.
- **nome desconhecido / nome fora do padrão**: renomeie o arquivo (veja a tabela acima). Arquivos com esses avisos são ignorados.

Abra o `.webp` no navegador e confira:

- se os pixels estão nítidos;
- se o fundo saiu inteiro, inclusive nos vãos internos;
- se não ficou contorno verde ou magenta;
- se o personagem não perdeu partes.

## 5. Reprocessar

Por padrão, o conversor pula as imagens cujo `.webp` é mais novo que o `.png`. Por isso, basta substituir o PNG e rodar de novo. Para regerar tudo, use `--forcar`.

Se o recorte não ficar bom, ajuste `--tolerancia`:

- **sobrou fundo** em volta: suba para `--tolerancia 1.3`;
- **o personagem perdeu partes**: desça para `--tolerancia 0.8`.

Rode com `--forcar` para regerar o arquivo:

```bash
python sprites/converter.py sprites/node-frente.png --tolerancia 0.8 --forcar
```

Para arte que não é pixel art (a antiga versão 3D), use `--estilo suave`. Esse modo usa transparência suave e redimensionamento com filtro.
