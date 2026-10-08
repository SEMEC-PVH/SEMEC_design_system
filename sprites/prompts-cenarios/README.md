# Prompts dos cenários de batalha — Vila SEMEC (pixel art)

Um cenário por ginásio, no mesmo **pixel art de GBA** dos personagens (`../prompts/`). Na batalha, o cenário ocupa a área inteira do jogo: o adversário fica de frente, no meio à direita, e a sua criatura de costas, embaixo à esquerda, cada um sobre uma plataforma oval desenhada pelo jogo.

## Como usar

1. Abra o documento do cenário e copie o bloco **Prompt** inteiro.
2. Se a ferramenta aceitar, anexe como referência a imagem do prédio indicada e o sprite aprovado `sprites/python-frente.png`.
3. Gere em **paisagem 16:9** (ex.: 1920×1080) e salve com o nome indicado na pasta `sprites/cenarios/`.
4. Marque o ☐ na tabela abaixo.

## O que acontece depois

O conversor (`sprites/converter.py cenarios`) ajusta o tamanho preservando os pixels e exporta em WebP leve para o jogo. Enquanto um cenário não chega, o jogo usa um fundo desenhado em código com as cores do Design System.

## Estilo base (já incluído em todos os prompts)

```text
Pixel art battle background in the style of Game Boy Advance monster-battle games (2003 era), native 240x160 pixel art upscaled with crisp hard pixels, limited 32-color palette, clean dark outlines, simple cel shading, bright and friendly colors. Wide landscape (3:2 or 16:9), camera slightly above eye level looking into the room. Keep two clear empty floor spots for creatures to stand: one on the right half at mid-distance and one on the lower left close to the camera, with nothing placed on them (the game draws the oval platforms itself). The bottom quarter of the image is a calm, low-detail floor, because it will be partly covered by the game interface. No characters, no creatures, no people, no text, no letters, no logos, no user interface.
```

## Lista de cenários (4)

| Documento | Chefe | Arquivo | Pronto |
|---|---|---|---|
| [Ginásio Front-End](frontend.md) | Líder do Ginásio Front-End (adversários CSS e React) | `sprites/cenarios/frontend.png` | ☐ |
| [Ginásio Back-End](backend.md) | Líder do Ginásio Back-End (adversários PHP e Node.js) | `sprites/cenarios/backend.png` | ☐ |
| [Ginásio de Dados](database.md) | Líder do Ginásio de Dados (adversários SQL e MongoDB) | `sprites/cenarios/database.png` | ☐ |
| [Diretoria da SEMEC](diretoria.md) | Diretoria — chefe final (adversários Figma, Planilha e COBOL) | `sprites/cenarios/diretoria.png` | ☐ |
