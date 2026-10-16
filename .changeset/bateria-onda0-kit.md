---
"@semec/ds": patch
---

Correções da onda 0 da bateria de testes de 16/10/2026 (#54):

- **ErrorSummary (TST-01, #48, bloqueante):** o resumo só recebe foco quando aparece (de 0 para N erros) ou quando o `focusKey` muda. Antes, a validação ao vivo (react-hook-form, Formik) mudava a contagem de erros a cada tecla depois do 1º envio e o foco saltava para o resumo, perdendo as teclas seguintes (o celular "69999998888" era gravado como "(69) 9999-9888"). Viola o WCAG 3.2.2.
- **HeaderBrand (TST-12, TST-10):** o nome acessível do link separa os nomes ("SEMEC Matrícula — ir para o início", antes "SEMECMatrícula— ir…"). O link da marca ganha `min-h-11` (44 px de alvo). Mudança visual: a marca passa a ter no mínimo 44 px de altura; o espaçamento em volta do "|" é o mesmo.
- **FileUpload (TST-13):** tamanhos com vírgula decimal PT-BR e no máximo 1 casa ("5 MB", "1,5 MB"), na lista e na mensagem de limite.
- **Progress (TST-14):** a barra preenche `value / max` (com `value={3}` e `max={4}`, 75%, o mesmo que o leitor de tela anuncia).
- **maskCurrency (TST-20):** sem dígitos significativos devolve `""` em vez de "R$ 0,00", então o campo volta a ficar vazio e falha em `z.string().min(1)`.
- **toast() (TST-24):** o `onOpenChange` passado a `toast()` é chamado junto com o handler interno, em vez de ser descartado.
