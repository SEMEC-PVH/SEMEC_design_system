---
"@semec/ds": patch
---

`Badge` success/warning/danger/info passa a usar os tokens `--feedback-*-surface` opacos (#20), garantindo contraste AA em qualquer fundo (info 4,89:1, warning 5,49:1, danger 5,91:1, success 6,31:1). Atenção: o fundo dessas variantes deixa de ser semitransparente e agora é opaco, então não deixa mais passar a cor do container.
