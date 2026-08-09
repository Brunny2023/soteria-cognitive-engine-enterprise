// Operator Academy — course catalogue teaching the platform through the lens
// of each AI executive's real use cases. Progress is per-user, stored locally.

export type Lesson = {
  code: string;
  title: string;
  /** What the operator will be able to do after this lesson. */
  outcome: string;
  /** Concrete click-path inside the platform. */
  steps: string[];
  /** Where to practise it. */
  to: string;
  minutes: number;
};

export type Course = {
  id: string;
  execId: string;
  exec: string;
  codename: string;
  track: "Foundations" | "Executive use case";
  useCase: string;
  summary: string;
  /** Deterministic guardrails the operator must understand for this exec. */
  guardrails: string[];
  lessons: Lesson[];
};

const foundation: Course = {
  id: "FND-000",
  execId: "PLATFORM",
  exec: "Platform foundations",
  codename: "START HERE",
  track: "Foundations",
  useCase: "Run your first governed directive end to end",
  summary:
    "The shortest path from a blank console to a validated, signed work product. Every executive course assumes you have finished this one.",
  guardrails: [
    "Directives are the only way work enters the platform — nothing runs without one.",
    "Autonomy level decides whether a stage pauses for a co-approver.",
    "Every stage writes to the audit ledger; nothing is deletable, only supersedable.",
  ],
  lessons: [
    {
      code: "FND.1",
      title: "Read Mission Control",
      outcome: "Interpret cognitive load, active specialists, and the executive council grid.",
      steps: ["Open Mission Control", "Check the KPI ribbon", "Open the live audit trail panel"],
      to: "/dashboard",
      minutes: 4,
    },
    {
      code: "FND.2",
      title: "Feed the knowledge corpus",
      outcome: "Ingest a policy document so executives can ground answers in your own material.",
      steps: ["Open Ingestion", "Drop a PDF or DOCX", "Watch parse → embed → index in the pipeline trace"],
      to: "/ingest",
      minutes: 6,
    },
    {
      code: "FND.3",
      title: "Submit a directive",
      outcome: "Write intent, priority, and autonomy that produce a useful plan.",
      steps: ["Open the directive composer", "State the decision you need, not the task", "Set autonomy to Execute on approval"],
      to: "/requests/new",
      minutes: 7,
    },
    {
      code: "FND.4",
      title: "Follow the twelve-stage pipeline",
      outcome: "Use the timeline viewer, approve at decision gates, and read the EXPLAIN panel.",
      steps: ["Open the directive", "Filter the timeline by stage", "Approve at the executive gate", "Open EXPLAIN to see tool calls"],
      to: "/requests",
      minutes: 8,
    },
    {
      code: "FND.5",
      title: "Collect the evidence",
      outcome: "Download a signed audit package and verify its checksum.",
      steps: ["Open the Artifact Ledger", "Select the execution", "Download the audit package", "Verify the .sha256 sidecar"],
      to: "/artifacts",
      minutes: 5,
    },
  ],
};

function course(
  id: string,
  execId: string,
  exec: string,
  codename: string,
  useCase: string,
  summary: string,
  guardrails: string[],
  lessons: Lesson[],
): Course {
  return { id, execId, exec, codename, track: "Executive use case", useCase, summary, guardrails, lessons };
}

export const COURSES: Course[] = [
  foundation,

  course(
    "CRS-CDO",
    "A-CDO-01",
    "Chief Data Officer",
    "PRIMARY LEDGER",
    "Run a governed analysis against the warehouse",
    "The CDO is the only executive with broad warehouse read scope. This course teaches you to get a real number out of it — and to prove the number is right.",
    [
      "SQL is SELECT-only, parameterized, and capped by the scope matrix.",
      "Masked columns never leave the tool boundary, even for admins.",
      "A metric is not validated until the deterministic validator re-derives it.",
    ],
    [
      { code: "CDO.1", title: "Read the data scope", outcome: "Know exactly which tables, columns, row caps, and masks apply.", steps: ["Open a directive", "Open the scope preview in the inspector"], to: "/requests", minutes: 5 },
      { code: "CDO.2", title: "Ask an answerable question", outcome: "Phrase a directive the SQL tool can actually satisfy.", steps: ["Name the metric", "Name the grain", "Name the period"], to: "/requests/new", minutes: 6 },
      { code: "CDO.3", title: "Inspect the tool trace", outcome: "Read the emitted SQL, bound parameters, and row counts.", steps: ["Open EXPLAIN", "Expand run_sql_query", "Compare rows returned to the cap"], to: "/requests", minutes: 6 },
      { code: "CDO.4", title: "Validate against graph rules", outcome: "Interpret R1–R9 validator findings and fix a failing stage.", steps: ["Open Governance", "Open the validator report", "Re-run the stage after correcting intent"], to: "/governance", minutes: 8 },
    ],
  ),

  course(
    "CRS-CFO",
    "A-CFO-01",
    "Chief Financial Officer",
    "CAPITAL ALLOCATOR",
    "Build a defensible budget or capex recommendation",
    "Finance work fails audit when the arithmetic is model-generated. This course shows how the deterministic math engine keeps every figure reproducible.",
    [
      "All arithmetic routes through the deterministic math engine, never the model.",
      "CFO autonomy is capped at Execute on approval — a co-approver is mandatory.",
      "Every figure in an artifact must trace to a tool call.",
    ],
    [
      { code: "CFO.1", title: "Frame the capital question", outcome: "Write a directive with an explicit envelope and horizon.", steps: ["State the envelope", "State the horizon", "State the constraint"], to: "/requests/new", minutes: 6 },
      { code: "CFO.2", title: "Check the arithmetic", outcome: "Verify each figure against compute_metric calls in EXPLAIN.", steps: ["Open EXPLAIN", "Expand compute_metric", "Match inputs to outputs"], to: "/requests", minutes: 7 },
      { code: "CFO.3", title: "Approve at the decision gate", outcome: "Perform a co-approval with a recorded rationale.", steps: ["Open the pending approval", "Read the stage output", "Sign off with a note"], to: "/requests", minutes: 5 },
      { code: "CFO.4", title: "Export the compliance report", outcome: "Produce a signed PDF/JSON bundle for the audit committee.", steps: ["Open the directive", "Generate the compliance report", "Verify hashes"], to: "/artifacts", minutes: 5 },
    ],
  ),

  course(
    "CRS-CRO",
    "A-CRO-01",
    "Chief Risk Officer",
    "THREAT MODEL",
    "Model an emerging risk and set an escalation trigger",
    "Risk work is only useful if the escalation path is encoded. This course covers risk registers, blast-radius simulation, and thresholds.",
    [
      "Risk artifacts must name an owner, a trigger, and a mitigation.",
      "Escalations above appetite always pause for governance.",
      "Simulated policy changes never mutate production policy.",
    ],
    [
      { code: "CRO.1", title: "Open the risk register", outcome: "Read live risks against the program plan.", steps: ["Open Program", "Open the risk register tab"], to: "/program", minutes: 5 },
      { code: "CRO.2", title: "Simulate a policy change", outcome: "See the blast radius of an access rule before you apply it.", steps: ["Open the Policy Simulator", "Pick a knowledge source", "Change the layer rule", "Read the impact"], to: "/policy-sim", minutes: 8 },
      { code: "CRO.3", title: "Set health thresholds", outcome: "Trigger alerts when execution failure rates breach appetite.", steps: ["Open the Artifact Ledger", "Open alert settings", "Set failure and retry thresholds"], to: "/artifacts", minutes: 6 },
      { code: "CRO.4", title: "Verify the ledger", outcome: "Confirm the audit chain has not drifted for a period.", steps: ["Open Audit Integrity", "Pick a range", "Compare stored vs recomputed hashes"], to: "/audit-integrity", minutes: 6 },
    ],
  ),

  course(
    "CRS-CLO",
    "A-CLO-01",
    "Chief Legal Officer",
    "COVENANT KEEPER",
    "Interpret a regulation against your own policy set",
    "Legal answers must be grounded in ingested source text, never model recall. This course teaches grounding and citation discipline.",
    [
      "Every legal claim must cite an ingested source passage.",
      "Ungrounded assertions fail validator rule R1 and block delivery.",
      "Legal artifacts are advisory — autonomy is capped at recommend/approve.",
    ],
    [
      { code: "CLO.1", title: "Ingest the source instrument", outcome: "Get the regulation and your policy into the corpus.", steps: ["Open Ingestion", "Upload both documents", "Confirm indexed status"], to: "/ingest", minutes: 6 },
      { code: "CLO.2", title: "Ask for a conflict map", outcome: "Directive phrasing that produces clause-level comparison.", steps: ["Name both instruments", "Ask for conflicts, not a summary"], to: "/requests/new", minutes: 6 },
      { code: "CLO.3", title: "Check grounding", outcome: "Trace each conclusion back to a retrieved passage.", steps: ["Open EXPLAIN", "Expand search_knowledge", "Match citations to claims"], to: "/requests", minutes: 7 },
      { code: "CLO.4", title: "Check the knowledge graph", outcome: "See how the policy connects to entities and prior decisions.", steps: ["Open the Knowledge Graph", "Filter to policy edges"], to: "/knowledge", minutes: 5 },
    ],
  ),

  course(
    "CRS-COO",
    "A-COO-01",
    "Chief Operating Officer",
    "OPERATIONAL GRAPH",
    "Turn a directive into a staffed, sequenced program",
    "The COO decomposes intent into workstreams and allocates the specialist workforce under autonomy policy.",
    [
      "Workstreams need acceptance criteria before workforce allocation.",
      "Specialists execute only within their department scope.",
      "Throughput changes must be reflected back into the program plan.",
    ],
    [
      { code: "COO.1", title: "Decompose into workstreams", outcome: "Read and adjust the generated plan.", steps: ["Open Program", "Open the workstream breakdown", "Check acceptance criteria"], to: "/program", minutes: 7 },
      { code: "COO.2", title: "Allocate the workforce", outcome: "Match specialist roles and autonomy to each workstream.", steps: ["Open Workforce", "Filter by department", "Check autonomy levels"], to: "/workforce", minutes: 6 },
      { code: "COO.3", title: "Bring in a consultant", outcome: "Attach domain expertise where the workforce lacks depth.", steps: ["Open Consultants", "Pick the practice", "Attach to the directive"], to: "/consultants", minutes: 5 },
      { code: "COO.4", title: "Close the loop", outcome: "Log the outcome so future planning improves.", steps: ["Open Learning Loop", "Rate the outcome", "Route the lesson to L4"], to: "/learning", minutes: 5 },
    ],
  ),

  course(
    "CRS-CTO",
    "A-CTO-01",
    "Chief Technology Officer",
    "SYSTEMS ARCHITECT",
    "Assess a migration risk and wire the tools behind it",
    "The CTO course is where you learn the machinery: gateway routing, tool health, retries, and fallbacks.",
    [
      "Every intelligence layer must resolve to a reachable model before use.",
      "Failed tool calls retry under supervision and fall back safely.",
      "Degraded connectivity alerts admins rather than silently failing.",
    ],
    [
      { code: "CTO.1", title: "Validate model routing", outcome: "Confirm each layer resolves to a reachable model.", steps: ["Open Admin", "Run the connectivity matrix"], to: "/admin", minutes: 6 },
      { code: "CTO.2", title: "Read gateway health", outcome: "Interpret P50/P95 latency and error sparklines per layer.", steps: ["Open Gateway Health", "Compare layers", "Spot a degradation"], to: "/gateway-health", minutes: 6 },
      { code: "CTO.3", title: "Extend the platform", outcome: "Define a new specialist archetype without redesign.", steps: ["Open Skills & Training", "Open the Archetype Forge", "Bind a domain pack"], to: "/skills", minutes: 8 },
      { code: "CTO.4", title: "Pre-flight a release", outcome: "Run publish readiness before shipping changes.", steps: ["Open Publish Readiness", "Run all checks", "Clear failures"], to: "/publish", minutes: 5 },
    ],
  ),

  course(
    "CRS-CIO",
    "A-CIO-01",
    "Chief Information Officer",
    "SIGNAL WARDEN",
    "Hold the line on residency, redaction, and retention",
    "Information governance in practice: where data lives, what gets masked, and when it is destroyed.",
    [
      "Residency is per-region and cannot be overridden per directive.",
      "PII handling mode (redact / tokenize / block) applies at the tool boundary.",
      "Purges require a co-approver and always produce audit entries.",
    ],
    [
      { code: "CIO.1", title: "Set residency and redaction", outcome: "Configure regional storage and PII handling mode.", steps: ["Open Security & Compliance", "Set residency", "Set redaction mode"], to: "/security", minutes: 6 },
      { code: "CIO.2", title: "Tune the access matrix", outcome: "Set L1–L6 role permissions and autonomy caps.", steps: ["Open the access policy matrix", "Adjust a role", "Save"], to: "/security", minutes: 6 },
      { code: "CIO.3", title: "Set retention windows", outcome: "Match retention per data category to regulatory floors.", steps: ["Open Retention & Purge", "Adjust the window sliders"], to: "/retention", minutes: 6 },
      { code: "CIO.4", title: "Dry-run a purge", outcome: "Preview deletions and projected audit entries before executing.", steps: ["Run the dry-run simulator", "Review projected entries", "Request co-approval"], to: "/retention", minutes: 7 },
    ],
  ),

  course(
    "CRS-CMO",
    "A-CMO-01",
    "Chief Marketing Officer",
    "MARKET RESONANCE",
    "Produce a positioning brief that survives governance",
    "Creative output still needs evidence. This course covers artifact production and the review gate.",
    [
      "Claims about market size or share must come from ingested sources.",
      "Briefs are artifacts with checksums, not chat output.",
      "Governance review precedes any external-facing delivery.",
    ],
    [
      { code: "CMO.1", title: "Brief the directive", outcome: "Specify audience, segment, and the decision the brief supports.", steps: ["Open the composer", "Name the segment", "Name the decision"], to: "/requests/new", minutes: 6 },
      { code: "CMO.2", title: "Produce the artifact", outcome: "Understand produce_artifact and where the file lands.", steps: ["Open EXPLAIN", "Expand produce_artifact", "Open the ledger entry"], to: "/artifacts", minutes: 6 },
      { code: "CMO.3", title: "Pass governance review", outcome: "Read validator scores for accuracy and completeness.", steps: ["Open Governance", "Read the validator battery"], to: "/governance", minutes: 5 },
    ],
  ),

  course(
    "CRS-CHRO",
    "A-CHRO-01",
    "Chief Human Resources Officer",
    "PEOPLE FABRIC",
    "Run people analytics without exposing people",
    "The most privacy-sensitive executive. This course is mostly about what the platform refuses to do.",
    [
      "Individual-level people data is masked at the tool boundary by default.",
      "CHRO autonomy is Recommend only — no autonomous execution.",
      "Aggregate thresholds prevent re-identification in small cohorts.",
    ],
    [
      { code: "CHRO.1", title: "Understand masking", outcome: "See which people columns are masked and why.", steps: ["Open the scope preview", "Read the masked field list"], to: "/requests", minutes: 5 },
      { code: "CHRO.2", title: "Ask an aggregate question", outcome: "Phrase directives that respect cohort minimums.", steps: ["Aggregate by band, not person", "State the minimum cohort size"], to: "/requests/new", minutes: 6 },
      { code: "CHRO.3", title: "Review the evidence trail", outcome: "Confirm no identifying values reached the artifact.", steps: ["Open EXPLAIN", "Scan tool outputs", "Open the artifact"], to: "/artifacts", minutes: 6 },
    ],
  ),

  course(
    "CRS-CSO",
    "A-CSO-01",
    "Chief Strategy Officer",
    "HORIZON PLANNER",
    "Run a multi-year scenario and compare outcomes",
    "Scenario work is comparative. This course teaches variant directives and side-by-side evidence.",
    [
      "Each scenario is its own directive so evidence stays separable.",
      "Assumptions must be stated in the brief or the validator flags them.",
      "Scenario artifacts are versioned, never overwritten.",
    ],
    [
      { code: "CSO.1", title: "Write the base case", outcome: "A directive with explicit, checkable assumptions.", steps: ["List assumptions", "Set the horizon", "Submit"], to: "/requests/new", minutes: 6 },
      { code: "CSO.2", title: "Fork the variants", outcome: "Create comparable directives that differ by one lever.", steps: ["Duplicate the brief", "Change one assumption", "Submit"], to: "/requests", minutes: 6 },
      { code: "CSO.3", title: "Compare in the ledger", outcome: "Read artifacts side by side with provenance intact.", steps: ["Open the Artifact Ledger", "Filter by directive", "Compare checksums and inputs"], to: "/artifacts", minutes: 6 },
    ],
  ),

  course(
    "CRS-CEO",
    "A-CEO-01",
    "Chief Executive Officer",
    "STRATEGIC VISIONARY",
    "Chair the council and arbitrate between executives",
    "The capstone. The CEO agent synthesizes across the council; you learn to read and steer that synthesis.",
    [
      "The CEO reasons over other executives' artifacts, not raw data.",
      "Conflicting recommendations surface rather than being averaged away.",
      "Council decisions are the highest-value audit records in the ledger.",
    ],
    [
      { code: "CEO.1", title: "Read the council grid", outcome: "Interpret status, load, and autonomy across eleven officers.", steps: ["Open Executive layer", "Read the grid", "Open one officer"], to: "/executives", minutes: 5 },
      { code: "CEO.2", title: "Convene a synthesis", outcome: "A directive that explicitly draws on prior executive artifacts.", steps: ["Reference prior directives", "Ask for a recommendation with trade-offs"], to: "/requests/new", minutes: 7 },
      { code: "CEO.3", title: "Arbitrate a conflict", outcome: "Resolve contradictory recommendations at the decision gate.", steps: ["Open the approval", "Read both positions", "Record the rationale"], to: "/requests", minutes: 7 },
      { code: "CEO.4", title: "Institutionalize the decision", outcome: "Push the outcome back into organizational memory.", steps: ["Open Learning Loop", "Log the lesson", "Route to L2"], to: "/learning", minutes: 5 },
    ],
  ),
];

export const TOTAL_LESSONS = COURSES.reduce((n, c) => n + c.lessons.length, 0);

export function academyKey(userId: string) {
  return `secp.academy.${userId}`;
}

export function loadProgress(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(academyKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function saveProgress(userId: string, codes: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(academyKey(userId), JSON.stringify(codes));
}

export function courseMinutes(c: Course) {
  return c.lessons.reduce((n, l) => n + l.minutes, 0);
}