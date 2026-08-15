// Program orchestration helpers (L4). Server-only: plan synthesis and
// specialist matching used by the program server functions.
import { SPECIALISTS, DEPARTMENTS, type Department } from "./secp-data";

export type PlanTask = {
  title: string;
  detail: string;
  department: Department;
  effort_hours: number;
};

export type PlanWorkstream = {
  code: string;
  title: string;
  objective: string;
  owner_role: string;
  duration_days: number;
  acceptance: string;
  risk: "low" | "medium" | "high";
  tasks: PlanTask[];
};

/** Pick the best-fit specialist for a department, preferring available ones. */
export function matchSpecialist(department: string, taken: Set<string>) {
  const pool = SPECIALISTS.filter((s) => s.department === department);
  const candidates = pool.length ? pool : SPECIALISTS;
  const ranked = [...candidates].sort((a, b) => {
    const avail = (s: (typeof candidates)[number]) =>
      s.status === "active" ? 0 : s.status === "idle" ? 1 : 2;
    const load = (s: (typeof candidates)[number]) => (taken.has(s.id) ? 1 : 0);
    return load(a) - load(b) || avail(a) - avail(b) || b.level - a.level;
  });
  const pick = ranked[0];
  taken.add(pick.id);
  return pick;
}

export function normalizeDepartment(value: string): Department {
  const hit = DEPARTMENTS.find((d) => d.toLowerCase() === value.trim().toLowerCase());
  return hit ?? "Operations";
}

/** Deterministic fallback plan used when the gateway is unavailable. */
export function fallbackPlan(title: string): PlanWorkstream[] {
  const mk = (
    code: string,
    wsTitle: string,
    dept: Department,
    owner: string,
    days: number,
    risk: PlanWorkstream["risk"],
    tasks: [string, string, number][],
  ): PlanWorkstream => ({
    code,
    title: wsTitle,
    objective: `${wsTitle} for directive: ${title}.`,
    owner_role: owner,
    duration_days: days,
    acceptance: "Deliverables reviewed by the governance layer with a reproducible evidence trail.",
    risk,
    tasks: tasks.map(([t, d, h]) => ({ title: t, detail: d, department: dept, effort_hours: h })),
  });

  return [
    mk("WS-01", "Discovery & baseline", "Data & AI", "Data Analyst", 10, "low", [
      ["Assemble baseline dataset", "Pull governed warehouse reads covering the directive scope.", 12],
      ["Quantify current-state metrics", "Compute deterministic baselines for the success criteria.", 8],
    ]),
    mk("WS-02", "Compliance & policy review", "Legal", "Compliance Analyst", 14, "medium", [
      ["Map applicable policies", "Identify regulatory constraints binding the directive.", 8],
      ["Draft control checklist", "Define the controls each deliverable must satisfy.", 6],
    ]),
    mk("WS-03", "Financial envelope", "Finance", "Financial Analyst", 12, "medium", [
      ["Model cost envelope", "Build the budget model and sensitivity bands.", 10],
      ["Define materiality thresholds", "Set the thresholds validators enforce at review.", 4],
    ]),
    mk("WS-04", "Build & execution", "Software", "Solution Architect", 21, "high", [
      ["Design execution architecture", "Sequence delivery with dependencies and abort conditions.", 16],
      ["Implement first increment", "Ship the smallest increment that proves the plan.", 24],
    ]),
    mk("WS-05", "Rollout & acceptance", "Operations", "Operations Analyst", 15, "low", [
      ["Prepare rollout runbook", "Document cutover, monitoring, and rollback.", 10],
      ["Run acceptance review", "Verify acceptance criteria and capture sign-off evidence.", 6],
    ]),
  ];
}
