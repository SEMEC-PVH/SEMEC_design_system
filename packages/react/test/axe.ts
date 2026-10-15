import axe from "axe-core";

export interface SevereViolation {
  id: string;
  impact: string;
  help: string;
  nodes: string[];
}

/**
 * Roda o axe no `document.body` e devolve só as violações serious/critical
 * (ADR-014: essas reprovam o PR). `color-contrast` fica desligado porque o
 * jsdom não calcula CSS. `disable` existe para a exceção EXC-01 e só deve ser
 * usado onde docs/excecoes-acessibilidade.md permite.
 */
export async function severeViolations(disable: string[] = []): Promise<SevereViolation[]> {
  const rules: Record<string, { enabled: boolean }> = { "color-contrast": { enabled: false } };
  for (const id of disable) rules[id] = { enabled: false };
  const results = await axe.run(document.body, { rules, resultTypes: ["violations"] });
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => ({
      id: v.id,
      impact: String(v.impact),
      help: v.help,
      nodes: v.nodes.map((n) => n.target.join(" ")),
    }));
}
