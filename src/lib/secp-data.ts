// Mock organizational cognition data for SECP milestone 1.
// Everything here is illustrative; a future backend milestone will replace
// these constants with real agent runtimes and knowledge graph queries.

export type Autonomy = 1 | 2 | 3 | 4;

export const AUTONOMY_LABELS: Record<Autonomy, string> = {
  1: "Recommend only",
  2: "Execute on approval",
  3: "Autonomous within policy",
  4: "End-to-end autonomous",
};

export type LayerId =
  | "organizational"
  | "executive"
  | "consultant"
  | "program"
  | "workforce"
  | "governance";

export interface LayerMeta {
  id: LayerId;
  code: string;
  name: string;
  role: string;
  route: string;
}

export const LAYERS: LayerMeta[] = [
  { id: "organizational", code: "L1", name: "Organizational", role: "Cognitive foundation", route: "/organizational" },
  { id: "executive", code: "L2", name: "Executive", role: "Leadership reasoning", route: "/executives" },
  { id: "consultant", code: "L3", name: "Consultant", role: "Domain expertise", route: "/consultants" },
  { id: "program", code: "L4", name: "Program", role: "Plan & orchestrate", route: "/program" },
  { id: "workforce", code: "L5", name: "Workforce", role: "Specialist execution", route: "/workforce" },
  { id: "governance", code: "L6", name: "Governance", role: "Validate & audit", route: "/governance" },
];

export interface Executive {
  id: string;
  title: string;
  codename: string;
  status: "active" | "deliberating" | "hibernating";
  focus: string;
  load: number; // 0..1
  autonomy: Autonomy;
}

export const EXECUTIVES: Executive[] = [
  { id: "A-CEO-01", title: "Chief Executive Officer", codename: "STRATEGIC VISIONARY", status: "active", focus: "Synthesizing Q3 fiscal projections against specialist capability vectors.", load: 0.88, autonomy: 3 },
  { id: "A-COO-01", title: "Chief Operating Officer", codename: "OPERATIONAL GRAPH", status: "active", focus: "Allocating workforce for Project Sovereign validation cycles.", load: 0.42, autonomy: 3 },
  { id: "A-CFO-01", title: "Chief Financial Officer", codename: "CAPITAL ALLOCATOR", status: "hibernating", focus: "Awaiting input from Governance layer on Q4 capex envelope.", load: 0.0, autonomy: 2 },
  { id: "A-CTO-01", title: "Chief Technology Officer", codename: "SYSTEMS ARCHITECT", status: "active", focus: "Reviewing platform migration risk model for EMEA region.", load: 0.61, autonomy: 3 },
  { id: "A-CIO-01", title: "Chief Information Officer", codename: "SIGNAL WARDEN", status: "hibernating", focus: "Idle. Last event: data-classification drift report.", load: 0.0, autonomy: 2 },
  { id: "A-CDO-01", title: "Chief Data Officer", codename: "PRIMARY LEDGER", status: "deliberating", focus: "Reconciling customer graph against Q3 revenue attribution.", load: 0.55, autonomy: 3 },
  { id: "A-CLO-01", title: "Chief Legal Officer", codename: "COVENANT KEEPER", status: "active", focus: "Interpreting DSA amendments against ad-serving policy.", load: 0.34, autonomy: 2 },
  { id: "A-CRO-01", title: "Chief Risk Officer", codename: "THREAT MODEL", status: "deliberating", focus: "Escalation review — supplier concentration exceeds risk appetite.", load: 0.72, autonomy: 2 },
  { id: "A-CHRO-01", title: "Chief Human Resources Officer", codename: "PEOPLE FABRIC", status: "hibernating", focus: "Idle. Compensation calibration scheduled for Friday.", load: 0.0, autonomy: 1 },
  { id: "A-CMO-01", title: "Chief Marketing Officer", codename: "MARKET RESONANCE", status: "active", focus: "Positioning brief for SEA expansion — draft under governance review.", load: 0.49, autonomy: 3 },
  { id: "A-CSO-01", title: "Chief Strategy Officer", codename: "HORIZON PLANNER", status: "deliberating", focus: "Three-year scenario planning against competitor telemetry.", load: 0.66, autonomy: 3 },
];

export interface Consultant {
  id: string;
  domain: string;
  name: string;
  expertise: string[];
  engagements: number;
}

export const CONSULTANTS: Consultant[] = [
  { id: "C-DAT", domain: "Data", name: "Data Consultant", expertise: ["Warehouse design", "Data contracts", "Governance"], engagements: 14 },
  { id: "C-FIN", domain: "Finance", name: "Finance Consultant", expertise: ["FP&A", "M&A modeling", "Treasury"], engagements: 9 },
  { id: "C-MKT", domain: "Marketing", name: "Marketing Consultant", expertise: ["Positioning", "Attribution", "Lifecycle"], engagements: 12 },
  { id: "C-HR", domain: "People", name: "HR Consultant", expertise: ["Org design", "Comp bands", "L&D"], engagements: 6 },
  { id: "C-LGL", domain: "Legal", name: "Legal Consultant", expertise: ["Contracts", "Privacy", "Regulatory"], engagements: 11 },
  { id: "C-OPS", domain: "Operations", name: "Operations Consultant", expertise: ["Process design", "S&OP", "Throughput"], engagements: 8 },
  { id: "C-MFG", domain: "Manufacturing", name: "Manufacturing Consultant", expertise: ["Line balancing", "OEE", "Quality"], engagements: 3 },
  { id: "C-HLT", domain: "Healthcare", name: "Healthcare Consultant", expertise: ["Clinical ops", "HIPAA", "Payor mix"], engagements: 4 },
  { id: "C-AVI", domain: "Aviation", name: "Aviation Consultant", expertise: ["Fleet ops", "Safety mgmt", "Regulatory"], engagements: 2 },
  { id: "C-EDU", domain: "Education", name: "Education Consultant", expertise: ["Curriculum", "Assessment", "Learning ops"], engagements: 3 },
  { id: "C-RTL", domain: "Retail", name: "Retail Consultant", expertise: ["Assortment", "Store ops", "Omni-channel"], engagements: 5 },
  { id: "C-ENR", domain: "Energy", name: "Energy Consultant", expertise: ["Load forecast", "Grid ops", "Emissions"], engagements: 4 },
  { id: "C-SCM", domain: "Supply Chain", name: "Supply Chain Consultant", expertise: ["Network design", "Inventory", "Logistics"], engagements: 7 },
  { id: "C-SEC", domain: "Cybersecurity", name: "Cybersecurity Consultant", expertise: ["Threat model", "IR", "Zero trust"], engagements: 10 },
  { id: "C-SWE", domain: "Software", name: "Software Engineering Consultant", expertise: ["Architecture", "Delivery", "SRE"], engagements: 15 },
];

export interface Specialist {
  id: string;
  role: string;
  department: Department;
  level: number;
  status: "active" | "idle" | "reserved";
  autonomy: Autonomy;
}

export type Department =
  | "Data & AI"
  | "Software"
  | "Finance"
  | "Marketing"
  | "HR"
  | "Legal"
  | "Operations";

export const DEPARTMENTS: Department[] = [
  "Data & AI",
  "Software",
  "Finance",
  "Marketing",
  "HR",
  "Legal",
  "Operations",
];

export const SPECIALISTS: Specialist[] = [
  { id: "S-DA-014", role: "Data Analyst", department: "Data & AI", level: 4, status: "active", autonomy: 3 },
  { id: "S-DS-002", role: "Data Scientist", department: "Data & AI", level: 5, status: "active", autonomy: 3 },
  { id: "S-ML-007", role: "Machine Learning Engineer", department: "Data & AI", level: 4, status: "reserved", autonomy: 2 },
  { id: "S-DE-021", role: "Data Engineer", department: "Data & AI", level: 3, status: "active", autonomy: 3 },
  { id: "S-SQ-004", role: "SQL Specialist", department: "Data & AI", level: 3, status: "idle", autonomy: 3 },
  { id: "S-PY-011", role: "Python Specialist", department: "Data & AI", level: 4, status: "active", autonomy: 3 },
  { id: "S-ST-003", role: "Statistician", department: "Data & AI", level: 5, status: "idle", autonomy: 2 },
  { id: "S-FC-002", role: "Forecasting Expert", department: "Data & AI", level: 4, status: "active", autonomy: 3 },
  { id: "S-DB-009", role: "Dashboard Developer", department: "Data & AI", level: 3, status: "active", autonomy: 3 },
  { id: "S-BI-006", role: "BI Developer", department: "Data & AI", level: 3, status: "idle", autonomy: 3 },
  { id: "S-NLP-001", role: "NLP Specialist", department: "Data & AI", level: 5, status: "reserved", autonomy: 2 },
  { id: "S-CV-001", role: "Computer Vision Specialist", department: "Data & AI", level: 4, status: "idle", autonomy: 2 },

  { id: "S-SA-002", role: "Solution Architect", department: "Software", level: 6, status: "active", autonomy: 3 },
  { id: "S-FE-018", role: "Frontend Engineer", department: "Software", level: 3, status: "active", autonomy: 3 },
  { id: "S-BE-014", role: "Backend Engineer", department: "Software", level: 4, status: "active", autonomy: 3 },
  { id: "S-MOB-005", role: "Mobile Engineer", department: "Software", level: 3, status: "idle", autonomy: 3 },
  { id: "S-DVO-007", role: "DevOps Engineer", department: "Software", level: 4, status: "active", autonomy: 3 },
  { id: "S-CLD-003", role: "Cloud Engineer", department: "Software", level: 4, status: "reserved", autonomy: 3 },
  { id: "S-SEC-004", role: "Security Engineer", department: "Software", level: 5, status: "active", autonomy: 2 },
  { id: "S-QA-010", role: "QA Engineer", department: "Software", level: 3, status: "active", autonomy: 3 },

  { id: "S-ACC-006", role: "Accountant", department: "Finance", level: 3, status: "idle", autonomy: 2 },
  { id: "S-FA-008", role: "Financial Analyst", department: "Finance", level: 4, status: "active", autonomy: 3 },
  { id: "S-BUD-002", role: "Budget Planner", department: "Finance", level: 4, status: "reserved", autonomy: 2 },
  { id: "S-INV-003", role: "Investment Analyst", department: "Finance", level: 5, status: "idle", autonomy: 2 },
  { id: "S-TAX-001", role: "Tax Specialist", department: "Finance", level: 4, status: "idle", autonomy: 2 },

  { id: "S-MR-004", role: "Market Research Analyst", department: "Marketing", level: 3, status: "active", autonomy: 3 },
  { id: "S-SEO-002", role: "SEO Specialist", department: "Marketing", level: 3, status: "active", autonomy: 3 },
  { id: "S-CS-005", role: "Content Strategist", department: "Marketing", level: 4, status: "active", autonomy: 3 },
  { id: "S-CW-011", role: "Copywriter", department: "Marketing", level: 2, status: "active", autonomy: 3 },
  { id: "S-CM-003", role: "Campaign Manager", department: "Marketing", level: 4, status: "reserved", autonomy: 2 },
  { id: "S-BS-002", role: "Brand Strategist", department: "Marketing", level: 5, status: "idle", autonomy: 2 },

  { id: "S-REC-006", role: "Recruiter", department: "HR", level: 3, status: "idle", autonomy: 3 },
  { id: "S-LRN-002", role: "Learning Specialist", department: "HR", level: 4, status: "idle", autonomy: 3 },
  { id: "S-HRBP-003", role: "HR Business Partner", department: "HR", level: 5, status: "reserved", autonomy: 2 },
  { id: "S-COMP-001", role: "Compensation Analyst", department: "HR", level: 4, status: "idle", autonomy: 2 },

  { id: "S-CR-004", role: "Contract Reviewer", department: "Legal", level: 4, status: "active", autonomy: 2 },
  { id: "S-CA-006", role: "Compliance Analyst", department: "Legal", level: 4, status: "active", autonomy: 2 },
  { id: "S-REG-002", role: "Regulatory Specialist", department: "Legal", level: 5, status: "reserved", autonomy: 2 },
  { id: "S-PA-002", role: "Policy Analyst", department: "Legal", level: 4, status: "idle", autonomy: 2 },

  { id: "S-OA-008", role: "Operations Analyst", department: "Operations", level: 3, status: "active", autonomy: 3 },
  { id: "S-PROC-004", role: "Procurement Specialist", department: "Operations", level: 4, status: "reserved", autonomy: 2 },
  { id: "S-SCP-003", role: "Supply Chain Planner", department: "Operations", level: 5, status: "active", autonomy: 3 },
  { id: "S-INVA-005", role: "Inventory Analyst", department: "Operations", level: 3, status: "idle", autonomy: 3 },
];

export type Stage =
  | "intent"
  | "context"
  | "executive"
  | "consultant"
  | "strategy"
  | "plan"
  | "assign"
  | "execute"
  | "validate"
  | "review"
  | "deliver"
  | "learn";

export interface StageStep {
  stage: Stage;
  layer: LayerId;
  title: string;
  agent: string;
  status: "complete" | "active" | "pending";
  reasoning: string;
  artifact?: string;
  toolCalls?: {
    name: string;
    input: string;
    output: string;
    ms: number;
    ok: boolean;
  }[];
}

export interface RequestRecord {
  id: string;
  title: string;
  origin: string;
  autonomy: Autonomy;
  progress: number; // 0..1
  priority: "P0" | "P1" | "P2";
  updated: string;
  brief: string;
  steps: StageStep[];
  validators: {
    name: string;
    status: "passed" | "pending" | "failed";
    detail: string;
  }[];
}

export const REQUESTS: RequestRecord[] = [
  {
    id: "RE-892",
    title: "SEA market expansion diligence",
    origin: "CEO directive",
    autonomy: 3,
    progress: 0.62,
    priority: "P0",
    updated: "14:05 UTC",
    brief:
      "Assess market entry into Southeast Asia across regulatory, capital, workforce, and channel dimensions. Deliver a phased entry proposal with risk-adjusted NPV.",
    steps: [
      { stage: "intent", layer: "organizational", title: "Intent ingested", agent: "SIGNAL WARDEN", status: "complete", reasoning: "Directive parsed. Success criteria bound to Q4 board review and risk envelope from Chief Risk Officer." },
      { stage: "context", layer: "organizational", title: "Organizational context retrieved", agent: "PRIMARY LEDGER", status: "complete", reasoning: "Loaded APAC historical projects, supplier concentration policy, brand guidelines, and the 3-year strategic plan." },
      { stage: "executive", layer: "executive", title: "Executive deliberation", agent: "STRATEGIC VISIONARY", status: "complete", reasoning: "CEO/CFO/CRO deliberated. Preferred phased entry through Singapore node; risk budget Level 3, capex ceiling $12M." },
      { stage: "consultant", layer: "consultant", title: "Domain consultation", agent: "Supply Chain Consultant", status: "complete", reasoning: "Recommended 2-warehouse hub-and-spoke, 3PL partnership shortlist, customs posture aligned to ISPM-15." },
      { stage: "strategy", layer: "consultant", title: "Execution strategy", agent: "HORIZON PLANNER", status: "complete", reasoning: "Three-track plan: (1) legal entity formation, (2) supply node bring-up, (3) demand generation pilot in TH/SG." },
      { stage: "plan", layer: "program", title: "Project plan generated", agent: "Program Manager v3", status: "active", reasoning: "WBS: 47 tasks across 6 workstreams; critical path 11 weeks; budget envelope $9.4M with $1.6M contingency.", artifact: "SEA-EXP-WBS-v3.plan" },
      { stage: "assign", layer: "workforce", title: "Specialist assignment", agent: "OPERATIONAL GRAPH", status: "pending", reasoning: "Awaiting CFO capital sign-off before dispatching Legal Consultant, Supply Chain Planner, and Market Research Analyst." },
      { stage: "execute", layer: "workforce", title: "Workforce execution", agent: "Specialist mesh", status: "pending", reasoning: "Blocked on assignment." },
      { stage: "validate", layer: "governance", title: "Multi-stage validation", agent: "COVENANT KEEPER", status: "pending", reasoning: "Compliance, brand, financial, and reproducibility checks queued." },
      { stage: "review", layer: "executive", title: "Executive review", agent: "STRATEGIC VISIONARY", status: "pending", reasoning: "Board-ready summary pending." },
      { stage: "deliver", layer: "executive", title: "Deliver results", agent: "COVENANT KEEPER", status: "pending", reasoning: "Package with audit trail." },
      { stage: "learn", layer: "organizational", title: "Capture feedback", agent: "PRIMARY LEDGER", status: "pending", reasoning: "Outcome loop feeds organizational memory." },
    ],
    validators: [
      { name: "Regulatory compliance", status: "pending", detail: "APAC entity formation checklist queued." },
      { name: "Financial correctness", status: "pending", detail: "NPV sensitivity gate awaits CFO." },
      { name: "Brand consistency", status: "passed", detail: "Positioning aligned to global brand system." },
      { name: "Reproducibility", status: "passed", detail: "All inputs versioned; reasoning trace intact." },
    ],
  },
  {
    id: "RE-891",
    title: "Platform tech-stack audit",
    origin: "CTO directive",
    autonomy: 2,
    progress: 0.31,
    priority: "P1",
    updated: "13:47 UTC",
    brief: "Audit the platform's current dependency surface, licensing posture, and runtime cost model. Recommend consolidation opportunities.",
    steps: [
      { stage: "intent", layer: "organizational", title: "Intent ingested", agent: "SIGNAL WARDEN", status: "complete", reasoning: "Objective bound to Q4 platform review." },
      { stage: "context", layer: "organizational", title: "Context retrieved", agent: "PRIMARY LEDGER", status: "complete", reasoning: "Loaded architecture decision records, vendor contracts, and cost ledger." },
      { stage: "executive", layer: "executive", title: "Executive deliberation", agent: "SYSTEMS ARCHITECT", status: "active", reasoning: "CTO reviewing risk profile against migration budget." },
      { stage: "consultant", layer: "consultant", title: "Domain consultation", agent: "Software Engineering Consultant", status: "pending", reasoning: "Queued." },
      { stage: "strategy", layer: "consultant", title: "Execution strategy", agent: "HORIZON PLANNER", status: "pending", reasoning: "Queued." },
      { stage: "plan", layer: "program", title: "Project plan generated", agent: "Program Manager v3", status: "pending", reasoning: "Queued." },
      { stage: "assign", layer: "workforce", title: "Specialist assignment", agent: "OPERATIONAL GRAPH", status: "pending", reasoning: "Queued." },
      { stage: "execute", layer: "workforce", title: "Workforce execution", agent: "Specialist mesh", status: "pending", reasoning: "Queued." },
      { stage: "validate", layer: "governance", title: "Validation", agent: "COVENANT KEEPER", status: "pending", reasoning: "Queued." },
      { stage: "review", layer: "executive", title: "Executive review", agent: "SYSTEMS ARCHITECT", status: "pending", reasoning: "Queued." },
      { stage: "deliver", layer: "executive", title: "Deliver results", agent: "COVENANT KEEPER", status: "pending", reasoning: "Queued." },
      { stage: "learn", layer: "organizational", title: "Capture feedback", agent: "PRIMARY LEDGER", status: "pending", reasoning: "Queued." },
    ],
    validators: [
      { name: "License compliance", status: "pending", detail: "SBOM cross-check queued." },
      { name: "Security posture", status: "pending", detail: "CVE sweep queued." },
    ],
  },
  {
    id: "RE-890",
    title: "Q3 revenue attribution reconciliation",
    origin: "CFO directive",
    autonomy: 3,
    progress: 1.0,
    priority: "P1",
    updated: "12:02 UTC",
    brief: "Reconcile Q3 revenue attribution across CRM, billing, and marketing platforms; produce audit-ready statement.",
    steps: [
      { stage: "intent", layer: "organizational", title: "Intent ingested", agent: "SIGNAL WARDEN", status: "complete", reasoning: "Directive parsed." },
      { stage: "context", layer: "organizational", title: "Context retrieved", agent: "PRIMARY LEDGER", status: "complete", reasoning: "Loaded revenue policy, customer graph." },
      { stage: "executive", layer: "executive", title: "Executive deliberation", agent: "CAPITAL ALLOCATOR", status: "complete", reasoning: "Materiality threshold set at 0.5% of quarterly revenue." },
      { stage: "consultant", layer: "consultant", title: "Domain consultation", agent: "Finance Consultant", status: "complete", reasoning: "Reconciliation methodology confirmed against ASC 606." },
      { stage: "strategy", layer: "consultant", title: "Execution strategy", agent: "HORIZON PLANNER", status: "complete", reasoning: "Three-way reconciliation plan approved." },
      { stage: "plan", layer: "program", title: "Project plan generated", agent: "Program Manager v3", status: "complete", reasoning: "WBS complete." },
      { stage: "assign", layer: "workforce", title: "Specialist assignment", agent: "OPERATIONAL GRAPH", status: "complete", reasoning: "Assigned Financial Analyst, Data Engineer, SQL Specialist." },
      { stage: "execute", layer: "workforce", title: "Workforce execution", agent: "Specialist mesh", status: "complete", reasoning: "All variances explained; $14.2k unattributed traced to timing.", artifact: "Q3-ATTRIB-recon.pdf" },
      { stage: "validate", layer: "governance", title: "Validation", agent: "COVENANT KEEPER", status: "complete", reasoning: "All gates passed." },
      { stage: "review", layer: "executive", title: "Executive review", agent: "CAPITAL ALLOCATOR", status: "complete", reasoning: "CFO approved." },
      { stage: "deliver", layer: "executive", title: "Deliver results", agent: "COVENANT KEEPER", status: "complete", reasoning: "Delivered to audit committee." },
      { stage: "learn", layer: "organizational", title: "Capture feedback", agent: "PRIMARY LEDGER", status: "complete", reasoning: "Attribution rule updated in org memory." },
    ],
    validators: [
      { name: "Financial correctness", status: "passed", detail: "Trial-balance tie-out clean." },
      { name: "Regulatory compliance", status: "passed", detail: "ASC 606 compliant." },
      { name: "Reproducibility", status: "passed", detail: "Full SQL lineage captured." },
      { name: "Explainability", status: "passed", detail: "Variance rationale attached to each line." },
    ],
  },
];

export const KPIS = {
  cognitiveLoad: 0.428,
  activeSpecialists: 1204,
  entitiesIndexed: 42109,
  connectivity: 0.94,
  validationPassRate: 0.997,
  openRequests: REQUESTS.filter((r) => r.progress < 1).length,
};

export interface AuditEntry {
  time: string;
  actor: string;
  layer: LayerId;
  action: string;
  requestId?: string;
}

export const AUDIT_LOG: AuditEntry[] = [
  { time: "14:05:22", actor: "Program Manager v3", layer: "program", action: "Generated WBS for RE-892 (47 tasks, $9.4M envelope).", requestId: "RE-892" },
  { time: "14:02:11", actor: "HORIZON PLANNER", layer: "consultant", action: "Produced three-track execution strategy for RE-892.", requestId: "RE-892" },
  { time: "13:58:47", actor: "STRATEGIC VISIONARY", layer: "executive", action: "Approved Level 3 autonomy for SEA expansion diligence.", requestId: "RE-892" },
  { time: "13:47:03", actor: "SYSTEMS ARCHITECT", layer: "executive", action: "Opened RE-891 platform tech-stack audit.", requestId: "RE-891" },
  { time: "13:33:19", actor: "COVENANT KEEPER", layer: "governance", action: "Flagged ethical variance in data source #4 (RE-890 predecessor).", },
  { time: "12:02:08", actor: "CAPITAL ALLOCATOR", layer: "executive", action: "Approved final Q3 revenue attribution reconciliation (RE-890).", requestId: "RE-890" },
  { time: "11:44:51", actor: "PRIMARY LEDGER", layer: "organizational", action: "Updated attribution rule ATTR-2024-Q3 in organizational memory." },
];

export interface KnowledgeNode {
  id: string;
  label: string;
  kind: "policy" | "project" | "department" | "product" | "regulation" | "decision" | "team";
  edges: number;
}

export const KNOWLEDGE_NODES: KnowledgeNode[] = [
  { id: "POL-BRAND-01", label: "Global brand system", kind: "policy", edges: 42 },
  { id: "POL-RISK-04", label: "Supplier concentration policy", kind: "policy", edges: 28 },
  { id: "PRJ-SEA-892", label: "SEA expansion", kind: "project", edges: 34 },
  { id: "PRJ-Q3-890", label: "Q3 revenue reconciliation", kind: "project", edges: 21 },
  { id: "DEP-ENG", label: "Engineering", kind: "department", edges: 61 },
  { id: "DEP-FIN", label: "Finance", kind: "department", edges: 47 },
  { id: "PRD-CORE", label: "Core platform", kind: "product", edges: 88 },
  { id: "REG-DSA", label: "EU Digital Services Act", kind: "regulation", edges: 19 },
  { id: "REG-ASC606", label: "ASC 606 revenue standard", kind: "regulation", edges: 24 },
  { id: "DEC-ARCH-14", label: "ADR-14 workers migration", kind: "decision", edges: 13 },
  { id: "TEAM-GTM-SEA", label: "SEA go-to-market squad", kind: "team", edges: 17 },
];

export function getRequest(id: string): RequestRecord | undefined {
  return REQUESTS.find((r) => r.id.toLowerCase() === id.toLowerCase());
}