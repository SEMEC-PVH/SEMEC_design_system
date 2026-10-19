---
"@semec/ds": patch
---

Corrige o contraste do foco em superfícies `bg-brand-hero` sem Tailwind e permite cliques sob a região vazia do Toast com CSP estrita. Esconde os inputs auxiliares de Checkbox, Switch, RadioGroup e Slider sem depender de estilos inline; mantém o preenchimento de Progress e Slider sob CSP no SSR.

Distribui o nonce do SemecProvider aos viewports de SelectContent e ScrollArea, com precedência para valores explícitos. Alinha o nome acessível padrão de HeaderNav a "Menu principal" e documenta "SEMEC" como nome padrão de HeaderBrand.
