---
"@semec/ds": patch
---

Torna determinístico o carimbo `generatedAt` / "Gerado em" dos artefatos de agentes (llms.txt, llms-full.txt, manifest.json): usa `SOURCE_DATE_EPOCH` ou a data do último commit do pacote, em vez da hora do build (#26).
