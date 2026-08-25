# Caminho de adoção

> **Nota de origem:** este texto vem da seção 6, "Caminho de adoção", do documento *Design System SEMEC — Identidade Visual e Tokens Base* (versão 0.1, 20/08/2026), que circulava como `03-identidade-visual-semec-digital.md`. Apenas esta seção foi publicada; o restante daquele documento foi descartado por ter sido superado — a parte de inventário pelo *Inventário da Identidade Visual — SEMEC* e a proposta de tokens pela documentação do design system. O texto abaixo está íntegro, como foi escrito na origem.

O portal SEMEC Digital não precisa ser reescrito. A sequência que dá resultado visível cedo:

1. **Extrair** a paleta de `globals.css` para `@semec/ds-tokens` e fazer o portal consumir o pacote em vez da declaração local. Nenhuma mudança visual — é uma troca de origem.
2. **Unificar os oito `logo-prefeitura.tsx`** em um único componente publicado em `@semec/ds-react`. Ganho imediato e mensurável, e estanca a degradação da marca.
3. **Substituir os hex institucionais por tokens** — as ~260 ocorrências de `#1e3a5f` e `#70b643` são substituição mecânica e segura.
4. **Consolidar os dois botões** em um só, com CVA, sobre os tokens semânticos.
5. **Publicar o shell** (Header/TopBar/Footer) como template.

Só depois disso os projetos novos nascem sobre o DS — e o portal, que é a maior base de código de frontend da secretaria, vira o primeiro consumidor real em vez de ficar como legado paralelo.
