# Prompts dos personagens das batalhas — Vila SEMEC

Um documento por imagem. Cada um traz o prompt completo, pronto para colar no gerador de imagens, uma versão alternativa sem nome de marca e uma lista de conferência.

## Como usar

1. Abra o documento do personagem e copie o bloco **Prompt** inteiro.
2. Se a ferramenta aceitar, anexe o logo indicado como **imagem de referência**. Depois do primeiro sprite aprovado, anexe também ele, para manter o estilo igual em todos.
3. Gere em formato **quadrado** (ex.: 1024×1024) e salve com o nome indicado na pasta `sprites/` (um nível acima desta).
4. Marque o ☐ na tabela abaixo quando a imagem estiver pronta.

Recomendação: gere primeiro **um** personagem (por exemplo, `python-frente`) e aprove o estilo antes de produzir os outros.

## O que acontece depois

O Claude converte cada imagem: remove o fundo verde, recorta, padroniza o tamanho e o pixel e exporta em WebP leve para o jogo. Enquanto uma imagem não chega, o jogo usa o monograma (Py, JS, CSS…) no lugar.

Na batalha, a criatura do jogador aparece **de costas**, embaixo à esquerda, e a adversária **de frente**, em cima à direita, cada uma sobre uma plataforma oval (layout clássico de batalha de monstrinhos).

## Estilo base (já incluído em todos os prompts)

```text
Pixel art creature sprite in the style of Game Boy Advance monster-battle games (2003 era), 96x96 pixel art upscaled with crisp hard pixels, limited 16-color palette, clean 1px dark outline, simple cel shading, cute but cool, full body, centered, single character, plain solid pure green (#00FF00) background, no ground, no shadow, no text, no letters.
```

## Sobre o uso das marcas

Os personagens são inspirados nos logos oficiais das tecnologias. As regras de uso variam por marca: algumas permitem modificar (o logo do PHP, por exemplo, tem licença CC BY-SA), outras proíbem alterações (Java/Oracle, Excel/Microsoft, React/Meta, MongoDB). Antes de publicar, valide com a comunicação ou o jurídico da Prefeitura. O jogo exibirá o aviso: *"Marcas e logos pertencem aos seus respectivos donos; uso ilustrativo e educativo, sem afiliação."*

## Lista de imagens (21)

| Documento | Papel | Tipo | Arquivo | Pronto |
|---|---|---|---|---|
| [Python — Frente](python-frente.md) | Linguagem inicial do jogador | Dados | `sprites/python-frente.png` | ☐ |
| [Python — Costas](python-costas.md) | Linguagem inicial do jogador | Dados | `sprites/python-costas.png` | ☐ |
| [Anaconda — Frente](anaconda-frente.md) | Evolução do Python (nível 8) | Dados | `sprites/anaconda-frente.png` | ☐ |
| [Anaconda — Costas](anaconda-costas.md) | Evolução do Python (nível 8) | Dados | `sprites/anaconda-costas.png` | ☐ |
| [JavaScript — Frente](javascript-frente.md) | Linguagem inicial do jogador | Front-End | `sprites/javascript-frente.png` | ☐ |
| [JavaScript — Costas](javascript-costas.md) | Linguagem inicial do jogador | Front-End | `sprites/javascript-costas.png` | ☐ |
| [TypeScript — Frente](typescript-frente.md) | Evolução do JavaScript (nível 8) | Front-End | `sprites/typescript-frente.png` | ☐ |
| [TypeScript — Costas](typescript-costas.md) | Evolução do JavaScript (nível 8) | Front-End | `sprites/typescript-costas.png` | ☐ |
| [Java — Frente](java-frente.md) | Linguagem inicial do jogador | Back-End | `sprites/java-frente.png` | ☐ |
| [Java — Costas](java-costas.md) | Linguagem inicial do jogador | Back-End | `sprites/java-costas.png` | ☐ |
| [Kotlin — Frente](kotlin-frente.md) | Evolução do Java (nível 8) | Back-End | `sprites/kotlin-frente.png` | ☐ |
| [Kotlin — Costas](kotlin-costas.md) | Evolução do Java (nível 8) | Back-End | `sprites/kotlin-costas.png` | ☐ |
| [CSS — Frente](css-frente.md) | Adversário — Ginásio Front-End | Front-End | `sprites/css-frente.png` | ☐ |
| [React — Frente](react-frente.md) | Adversário — Ginásio Front-End | Front-End | `sprites/react-frente.png` | ☐ |
| [PHP — Frente](php-frente.md) | Adversário — Ginásio Back-End | Back-End | `sprites/php-frente.png` | ☐ |
| [Node.js — Frente](node-frente.md) | Adversário — Ginásio Back-End | Back-End | `sprites/node-frente.png` | ☐ |
| [SQL — Frente](sql-frente.md) | Adversário — Ginásio de Dados | Dados | `sprites/sql-frente.png` | ☐ |
| [MongoDB — Frente](mongodb-frente.md) | Adversário — Ginásio de Dados | Dados | `sprites/mongodb-frente.png` | ☐ |
| [Figma — Frente](figma-frente.md) | Adversário — Diretoria (chefe final) | Front-End | `sprites/figma-frente.png` | ☐ |
| [Planilha (Excel) — Frente](planilha-frente.md) | Adversário — Diretoria (chefe final) | Dados | `sprites/planilha-frente.png` | ☐ |
| [COBOL — Frente](cobol-frente.md) | Adversário — Diretoria (chefe final) | Back-End | `sprites/cobol-frente.png` | ☐ |
