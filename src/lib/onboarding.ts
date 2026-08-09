import type { AppRole } from "@/hooks/useAuth";

export type OnboardingStep = {
  code: string;
  title: string;
  detail: string;
  to: string;
};

export type RoleProfile = {
  role: AppRole;
  label: string;
  blurb: string;
  /** Route the operator lands on after sign-in. */
  home: string;
  /** Rail destinations this role may open. */
  nav: string[];
  steps: OnboardingStep[];
};

const ALL_NAV = [
  "/dashboard",
  "/organizational",
  "/ingest",
  "/executives",
  "/consultants",
  "/program",
  "/workforce",
  "/governance",
  "/requests",
  "/learning",
  "/academy",
  "/skills",
  "/knowledge",
  "/artifacts",
  "/security",
  "/retention",
  "/policy-sim",
  "/admin",
  "/gateway-health",
  "/audit-integrity",
  "/publish",
];

export const ROLE_PROFILES: Record<AppRole, RoleProfile> = {
  admin: {
    role: "admin",
    label: "Platform administrator",
    blurb: "Full control of routing, autonomy caps, governance evidence, and deployment gates.",
    home: "/admin",
    nav: ALL_NAV,
    steps: [
      { code: "AD.0", title: "Validate model routing", detail: "Confirm every intelligence layer resolves to a reachable model.", to: "/admin" },
      { code: "GH.1", title: "Check gateway health", detail: "Review per-layer latency and error trends before opening the platform.", to: "/gateway-health" },
      { code: "SC.1", title: "Review security posture", detail: "Data residency, PII redaction, and the per-layer access matrix.", to: "/security" },
      { code: "RT.1", title: "Set retention windows", detail: "Match retention per data category to your regulatory floors.", to: "/retention" },
      { code: "PB.1", title: "Run publish readiness", detail: "Pre-flight auth, database, exports, and audit completeness.", to: "/publish" },
    ],
  },
  operator: {
    role: "operator",
    label: "Cognition operator",
    blurb: "Submit directives, steer the reasoning pipeline, and close the learning loop.",
    home: "/dashboard",
    nav: [
      "/dashboard",
      "/organizational",
      "/ingest",
      "/executives",
      "/consultants",
      "/program",
      "/workforce",
      "/governance",
      "/requests",
      "/learning",
      "/academy",
      "/skills",
      "/knowledge",
      "/artifacts",
      "/policy-sim",
    ],
    steps: [
      { code: "M0", title: "Scan Mission Control", detail: "Cognitive load, open directives, and the executive council at a glance.", to: "/dashboard" },
      { code: "IN", title: "Feed the knowledge corpus", detail: "Upload policies and documents, or attach a managed connector.", to: "/ingest" },
      { code: "RQ", title: "Submit your first directive", detail: "Define intent, priority, and autonomy — the pipeline does the rest.", to: "/requests/new" },
      { code: "L6", title: "Review validation results", detail: "Validator batteries and the decision audit trail.", to: "/governance" },
      { code: "L∞", title: "Log a lesson", detail: "Rate outcomes so future reasoning improves.", to: "/learning" },
    ],
  },
  viewer: {
    role: "viewer",
    label: "Read-only reviewer",
    blurb: "Observe reasoning, validation evidence, and organizational knowledge without write access.",
    home: "/governance",
    nav: [
      "/dashboard",
      "/organizational",
      "/executives",
      "/consultants",
      "/program",
      "/workforce",
      "/governance",
      "/requests",
      "/academy",
      "/knowledge",
      "/artifacts",
    ],
    steps: [
      { code: "L6", title: "Open the governance ledger", detail: "Validator scores and the immutable audit trail.", to: "/governance" },
      { code: "RQ", title: "Follow a live directive", detail: "Watch the twelve-stage reasoning timeline for any request.", to: "/requests" },
      { code: "KG", title: "Explore the knowledge graph", detail: "See how entities, policies, and decisions connect.", to: "/knowledge" },
    ],
  },
};

export function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("operator")) return "operator";
  return "viewer";
}

export function onboardingKey(userId: string) {
  return `secp.onboarding.${userId}`;
}

export function isOnboarded(userId: string) {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(onboardingKey(userId)) === "done";
}

export function markOnboarded(userId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(onboardingKey(userId), "done");
}
