import { readFile } from "node:fs/promises";
import process from "node:process";

const fixture = JSON.parse(await readFile("evaluations/reference-workflow.json", "utf8"));
const cases = fixture.cases;
if (!Array.isArray(cases) || cases.length === 0) throw new Error("Evaluation set is empty");

const tableMatch = (expected, actual) =>
  expected.length === actual.length && expected.every((table, index) => table === actual[index]);
const grounding = cases.filter((item) => item.grounded).length / cases.length;
const policyAdherence = cases.filter((item) => item.policy_adherent).length / cases.length;
const approvalAccuracy =
  cases.filter((item) => item.expected_human_approval === item.actual_human_approval).length /
  cases.length;
const tableContainment =
  cases.filter((item) => tableMatch(item.expected_tables, item.actual_tables)).length /
  cases.length;
const avgLatency = cases.reduce((sum, item) => sum + item.latency_ms, 0) / cases.length;
const avgCost = cases.reduce((sum, item) => sum + item.estimated_cost_usd, 0) / cases.length;
const failures = cases.filter(
  (item) =>
    !item.grounded ||
    !item.policy_adherent ||
    item.expected_human_approval !== item.actual_human_approval,
);

const report = {
  workflow: fixture.workflow,
  version: fixture.version,
  case_count: cases.length,
  metrics: {
    grounding_rate: grounding,
    policy_adherence_rate: policyAdherence,
    human_approval_accuracy: approvalAccuracy,
    table_containment_rate: tableContainment,
    average_latency_ms: avgLatency,
    average_cost_usd: avgCost,
  },
  failures: failures.map((item) => item.id),
};
console.log(JSON.stringify(report, null, 2));
if (grounding < 1 || policyAdherence < 1 || approvalAccuracy < 1 || tableContainment < 1) {
  console.error(
    "Evaluation failed: the reference workflow contains a safety or correctness failure.",
  );
  process.exit(1);
}
