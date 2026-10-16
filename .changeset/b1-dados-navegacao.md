---
"@semec/ds": minor
---

Dados e navegação: alvos de toque, `onRowClick` e nomes acessíveis (bateria de testes de 16/10/2026, onda 1, #55 e #56).

- **DataTable — `rowLabel` (novo, aditivo, TST-28):** `rowLabel={(row) => "Abrir protocolo " + row.numero}` vira o `aria-label` da linha. Use junto com `onRowClick`: a linha focável não tinha nome e o leitor de tela não dizia o que o Enter fazia.
- **DataTable — nome do cabeçalho ordenável (TST-27):** o cabeçalho e o botão de ordenação passam a se chamar só pelo nome da coluna ("Nome"). A instrução "Ordenar por Nome" agora é a **descrição** do botão (`aria-describedby`), e não se repete mais a cada célula. `labels.sortBy` continua aceito, com a mesma assinatura, e passa a definir essa descrição. Se o seu teste consulta `getByRole("button", { name: "Ordenar por Nome" })`, troque por `getByRole("columnheader", { name: "Nome" })` e o botão dentro dele, ou confira a descrição com `toHaveAccessibleDescription` (TST-B4).
- **DataTable — `onRowClick` (TST-11):** o clique ou o Enter/Espaço num botão, link, campo ou outro controle dentro da célula não ativa mais a linha. O clique dentro de um portal aberto pela célula (menu, diálogo) também não.
- **DataTable — alvos e rodapé (TST-10, TST-23):** o botão de ordenação ganha `min-h-11 min-w-11` (44 px, dentro do cabeçalho que já tinha 44 px). Abaixo de `sm`, o rodapé da paginação vira coluna, os botões podem quebrar de linha e o texto deles não quebra mais dentro do botão.
- **Pagination (TST-07, TST-25):** setas, números e elipses têm `shrink-0` e não encolhem mais para 18–23 px em 390/320 px. Abaixo de `sm` ficam só as setas e a página atual ± 1: a primeira e a última página e as elipses somem (mudança visual no mobile). `siblingCount={0}` agora é respeitado (antes virava 1 em silêncio); valores negativos contam como 0.
- **Breadcrumb e Link (TST-10):** abaixo de `sm`, os links da trilha passam a ter 44 px de altura e de largura mínima. O `Link` ganha um `::after` de no mínimo 44×44 que amplia a área de toque sem mudar a altura da linha do texto (um tel/mailto sozinho num parágrafo media 21 px). No desktop, nada muda.
