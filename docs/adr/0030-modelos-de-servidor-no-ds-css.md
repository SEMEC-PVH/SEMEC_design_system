---
adr: 30
titulo: "Modelos oficiais de servidor no @semec/ds-css"
status: Aceito
data: 2026-10-20
---

# ADR-030 — Modelos oficiais de servidor no `@semec/ds-css`

**Status:** Aceito (20/10/2026, onda 3 da integração, issue #82). Complementa o [ADR-028](0028-pacote-ds-css-classes-semec.md) (classes `.semec-*`) e o ADR-029 (Web Components do `@semec/ds-elements`).

**Contexto.** O `@semec/ds-css` entrega as classes e o README mostra o HTML recomendado de cada componente. Os sistemas da prefeitura que não usam React são, na maioria, aplicações de servidor: PHP puro, Laravel, Symfony, Django e Flask. Em cada um, a equipe copia o HTML do README para um template próprio e preenche os dados. Cada cópia pode errar exatamente o que o design system quer garantir: o `for` do rótulo, o `aria-describedby` que liga a dica e o erro, o `aria-invalid`, o `aria-current` do menu, o foco no resumo de erros, e o escape do que vem do usuário (o protótipo PHP da transferência escolar, refeito na onda 2, precisou de `htmlspecialchars` em cada linha). Quando uma classe muda, as cópias ficam para trás sem aviso.

Restrições: mesma aparência e mesmo ARIA do kit React; WCAG 2.1 AA bloqueante ([ADR-014](0014-wcag-21-aa-criterio-bloqueante.md)); nenhuma dependência nova para quem consome; a CI roda em `ubuntu-latest`, que já tem PHP, Composer e Python.

**Decisão.** O `@semec/ds-css` passa a publicar a pasta `templates/` com parciais oficiais em quatro linguagens: `php/` (PHP puro), `jinja/` (Jinja2, que serve Django com django-jinja e Flask), `twig/` e `blade/`.

1. **Mesmo conjunto, mesmos nomes, mesmos parâmetros.** Oito parciais: `pagina` (layout base com `lang="pt-BR"`, pular para o conteúdo, cabeçalho, `<main id="conteudo">`, rodapé e os `<link>`/`<script>` do CSS, das fontes e do `@semec/ds-elements`), `pular-para-o-conteudo`, `cabecalho`, `rodape`, `campo` (input, textarea e select com rótulo, obrigatório, dica, erro, `aria-describedby` e `aria-invalid`), `resumo-de-erros`, `alerta` e `botao`. Os parâmetros ficam numa tabela única no `templates/README.md`. Os nomes das parciais e dos parâmetros são em português, como os nomes das parciais fixados no contrato da onda: quem usa é a equipe que escreve as telas em PT-BR, e o nome do parâmetro descreve conteúdo da tela (`rotulo`, `dica`, `erro`). Os valores que viram classe (`variante`, `tamanho`) são os do `cva`, em inglês, iguais aos modificadores `.semec-*`. Cada linguagem usa o seu mecanismo natural: função `semec_render()` no PHP, macros no Jinja, `include … only` no Twig, `@include` no Blade, e herança de layout (`extends`) para a `pagina`.
2. **O HTML é o do kit.** A saída segue o React: com erro, a mensagem substitui a dica (como o `FormField`); o `alerta` usa `role="alert"` só em `danger` e `role="status"` nas demais (como o `announce` do `Alert`), com o mesmo ícone Lucide; o resumo de erros recebe `autofocus`, o equivalente de servidor ao `autoFocus` do `ErrorSummary`, para o foco ir até ele quando a página volta do envio com erros.
3. **Escape em tudo, nada de HTML de parâmetro.** PHP com `htmlspecialchars(…, ENT_QUOTES)`; Blade com `{{ }}`; Jinja e Twig ligam o autoescape dentro de cada parcial (`{% autoescape %}`), porque o Flask não liga o autoescape para `.jinja` e um ambiente Twig pode estar com ele desligado. Valores que viram classe ou atributo de lista (`variante`, `tamanho`, `tipo`, `anuncio`) passam por lista fechada e caem no padrão fora dela. O conteúdo da página entra como bloco do template (ou função no PHP), nunca como texto HTML num parâmetro.
4. **Um HTML canônico, quatro motores, uma bateria.** `npm run test:modelos` renderiza cada caso de `test/modelos/fixtures.json` com os motores reais (PHP 8, Twig 3, Blade do `illuminate/view` sem Laravel, Jinja2 3.1), inclusive Twig e Jinja com o autoescape do ambiente desligado, Twig com `strict_variables` e Jinja com `StrictUndefined`. Cada saída é normalizada (parser HTML5, atributos ordenados, espaço insignificante removido) e comparada a um HTML canônico único por caso, escrito à mão a partir do README do pacote. O mesmo teste roda o axe-core no Chromium com o `semec-ds.css` (zero violações), confere toda classe contra o `classes.json`, injeta `<script>`, aspas e atributos `on*` em todos os parâmetros de texto e confere a tabela do README contra as assinaturas das quatro linguagens. Os motores rodam com os binários locais (a CI) ou, sem eles, em Docker (`php:8.3-cli`, `composer:2`, `python:3.12-slim`). As dependências PHP (`twig/twig`, `illuminate/view`) e o `jinja2` são só de teste e ficam fora do pacote publicado.

Fora do escopo: Django Template Language (o motor padrão do Django não lê Jinja; quem usa DTL copia o HTML do README ou adota o django-jinja nas telas novas), componentes Blade de classe (`<x-…>`), comportamento interativo (fica com o `@semec/ds-elements`, que o layout carrega) e validação de esquema de URL (`href` é escapado, não filtrado).

**Alternativas descartadas.**

- *Só documentar o HTML no README.* É o estado atual e é o que gera as cópias divergentes descritas no contexto.
- *Gerar os modelos a partir de uma fonte única (por exemplo, um template neutro compilado para as quatro linguagens).* Cada motor tem semântica própria de escape, de valores vazios e de herança de layout; um gerador esconderia essas diferenças em vez de testá-las, e o template gerado seria mais difícil de ler e adaptar. Quatro arquivos escritos à mão, presos a um canônico único por teste, são mais simples de manter com oito parciais.
- *Pacote separado por linguagem (Composer para PHP/Twig/Blade, PyPI para Jinja).* Seriam três registros e três ciclos de release para arquivos que mudam junto com as classes do `@semec/ds-css`. Na mesma pasta do pacote CSS, a versão dos modelos é sempre a das classes.
- *Componentes Blade (`<x-semec-campo>`) e macros Twig em vez de `@include`/`include`.* Isolam melhor as variáveis, mas exigem registro de componente no Laravel e `import` no Twig, e afastam a API das outras linguagens. O `include … only` do Twig já isola; no Blade, o README documenta a herança de variáveis do `@include` e a renderização isolada, e o layout `pagina` já renderiza isolado.
- *Parâmetros em inglês (`label`, `hint`, `error`).* Coerente com o ADR-016 para código, mas misturaria nomes de parciais em português (fixados no contrato) com parâmetros em inglês na mesma chamada.

**Consequências.**

- Um sistema PHP, Laravel, Symfony, Django (com django-jinja) ou Flask monta a tela com o visual e o ARIA do kit chamando oito parciais, sem copiar HTML.
- Mudar o HTML recomendado de um componente coberto exige mudar o canônico e as quatro linguagens juntos; o teste falha se uma delas ficar para trás. Classe nova ou renomeada no `@semec/ds-css` que os modelos usam aparece no teste de classes.
- Parâmetro novo entra na tabela do `templates/README.md` e nas quatro linguagens; o teste confere a tabela contra a assinatura das macros Jinja e o uso nos outros três.
- A CI precisa de PHP 8.2+, Composer e Python 3 no job que roda `npm run test:modelos` (o `ubuntu-latest` tem os três); localmente, o Docker substitui.
- Renomear parcial ou parâmetro, ou mudar o HTML de forma incompatível, é mudança *major* do `@semec/ds-css`, como as classes.
- Fica para depois: parciais de tabela, cartão, badge e dos elementos interativos (`semec-dialog`, `semec-tabs`…), e um exemplo completo de aplicação por linguagem.
