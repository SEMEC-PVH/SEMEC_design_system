# Prompt para o Codex CLI — gerar os sprites das batalhas

Abra o Codex CLI na raiz do projeto (`C:\dev\SEMEC_design_system`) e cole o bloco abaixo inteiro.

```text
Você vai gerar 21 imagens de personagens em pixel art para um mini game de batalhas. Trabalhe só dentro da pasta sprites/. Não altere nenhum outro arquivo do repositório.

## Fontes
- sprites/prompts/README.md: lista das 21 imagens, nome de cada arquivo e estilo base.
- sprites/prompts/<nome>.md: um arquivo por imagem, com o "Prompt", o "Prompt negativo", uma versão "sem marca" e um checklist.
Leia o README e todos os arquivos .md antes de começar.

## Como gerar
Use a sua ferramenta de geração de imagens. Se você não tiver uma, escreva um script em sprites/tools/gerar.mjs (Node, sem dependências) que chame a API de imagens da OpenAI (modelo gpt-image-1, size 1024x1024, chave em OPENAI_API_KEY) e rode o script.
- Cada imagem: quadrada, 1024x1024, PNG.
- Use o texto do bloco "Prompt" do .md exatamente como está. Se a geração for recusada por causa do nome da marca, use o bloco "Se a ferramenta recusar...".
- Salve em sprites/personagens/<stack>/<nome>.png, com o nome exato da tabela do README (ex.: sprites/personagens/dados/python-frente.png).

## Fase 1: referência de estilo (você mesmo, sem subagentes)
1. Gere sprites/personagens/dados/python-frente.png.
2. Confira o checklist do python-frente.md: fundo verde (#00FF00) liso, um personagem inteiro e centralizado, sem texto, pixel art nítido. Se falhar, gere de novo (até 3 tentativas).
3. PARE e me mostre a imagem. Só siga para a fase 2 depois que eu aprovar o estilo.

## Fase 2: subagentes em paralelo
Depois da minha aprovação, dispare 4 subagentes em paralelo. Cada um cuida de um grupo e usa sprites/personagens/dados/python-frente.png como imagem de referência de estilo, quando a ferramenta aceitar:
- Agente 1 (Dados): python-costas, anaconda-frente, anaconda-costas, sql-frente, mongodb-frente, planilha-frente
- Agente 2 (Front-End): javascript-frente, javascript-costas, typescript-frente, typescript-costas, css-frente
- Agente 3 (Back-End): java-frente, java-costas, kotlin-frente, kotlin-costas, php-frente
- Agente 4 (outros): react-frente, node-frente, figma-frente, cobol-frente

Regras para cada subagente:
- Grava só os próprios arquivos sprites/personagens/<stack>/<nome>.png e não mexe em mais nada.
- Confere cada imagem contra o checklist do .md correspondente e gera de novo se falhar (até 3 tentativas por imagem).
- As versões "costas" precisam ser o MESMO personagem da versão "frente", visto de trás. Gere a "frente" primeiro e use-a como referência para a "costas".
- No fim, informa: arquivos gerados, quantas tentativas cada um precisou, quais usaram a versão sem marca e quais falharam.

Se você não tiver subagentes, faça o mesmo em sequência, grupo por grupo.

## Fase 3: fechamento (você)
1. Confira se os 21 arquivos existem em sprites/personagens/ e são PNG 1024x1024.
2. Na tabela do sprites/prompts/README.md, troque ☐ por ☑ nas imagens prontas.
3. Grave o relatório em sprites/RELATORIO.md: o que ficou pronto, o que falhou e o porquê, e quais imagens usaram o prompt sem marca.
4. Não remova o fundo, não redimensione, não converta e não faça commit. Esse tratamento é feito depois, por outra ferramenta.
```

## Depois que o Codex terminar

Volte aqui e avise o Claude. Ele confere as imagens, tira o fundo verde, recorta, converte para WebP e coloca no jogo.
