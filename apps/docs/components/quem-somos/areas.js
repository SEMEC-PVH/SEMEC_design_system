// Áreas da Vila SEMEC e líderes dos ginásios.
//
// Compartilhado entre o motor 3D (posiciona cada pessoa na frente do prédio
// da sua área) e o componente React (decide quem é líder e o que cada um
// fala). Os dois precisam achar as MESMAS pessoas: os índices são sempre os
// de `members`.

// Área de cada estagiário, pelo cargo. Quem não casar fica em "generic".
export const AREA_BY_ROLE = [
  [/front|design|ui|ux/i, "frontend"],
  [/back|api/i, "backend"],
  [/devops|infra|dados|data|dba/i, "database"],
];

export const areaOf = (role = "") => AREA_BY_ROLE.find(([re]) => re.test(role))?.[1] ?? "generic";

// Ginásio (id do chefe em batalha/dados.js) de cada área.
export const CHEFE_POR_AREA = { frontend: "frontend", backend: "backend", database: "database" };

// Map<índice em members, id do chefe>: o PRIMEIRO estagiário de cada área
// lidera o ginásio dela; todos os diretores representam a Diretoria.
export function mapaDeLideres(members = []) {
  const lideres = new Map();
  const areasComLider = new Set();
  members.forEach((m, i) => {
    if (m.group === "directors") {
      lideres.set(i, "diretoria");
      return;
    }
    if (m.group !== "interns") return;
    const chefeId = CHEFE_POR_AREA[areaOf(m.role)];
    if (!chefeId || areasComLider.has(chefeId)) return;
    areasComLider.add(chefeId);
    lideres.set(i, chefeId);
  });
  return lideres;
}
