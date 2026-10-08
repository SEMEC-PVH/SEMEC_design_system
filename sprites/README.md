# Imagens das batalhas da Vila SEMEC

Originais em pixel art (estilo Game Boy Advance) das batalhas. O jogo não lê esta pasta: ele usa os WebP gerados pelo conversor em `apps/docs/public/quem-somos/batalha/`.

| Pasta / arquivo | O que tem |
|---|---|
| `personagens/` | Os 21 personagens, `<linguagem>-<frente\|costas>.png`, sobre fundo verde (ou magenta nos personagens verdes). |
| `cenarios/` | Os 4 cenários de batalha, um por chefe: `frontend`, `backend`, `database`, `diretoria`. |
| `prompts/` | Prompt de cada personagem e o `CODEX.md` (pedido para o Codex CLI gerar tudo com subagentes). |
| `prompts-cenarios/` | Prompt de cada cenário. |
| `converter.py` + `CONVERSOR.md` | Tira o fundo, recorta e exporta os WebP do jogo. |

Para trocar uma imagem: salve o PNG novo com o mesmo nome em `personagens/` ou `cenarios/` e rode `python sprites/converter.py sprites` (ou `cenarios`).

Referências usadas para criar as imagens (prints dos prédios, layout de batalha, mascote do JavaScript) ficam em `referencias/`, na raiz. Essa pasta fica fora do git porque tem imagens de terceiros.
