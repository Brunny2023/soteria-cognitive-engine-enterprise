// Chapter map for the landing-page walkthrough loop (public/secp-demo.webm).
// Kept in sync with public/secp-demo.vtt.
export type WalkthroughChapter = {
  start: number;
  end: number;
  title: string;
  text: string;
};

export const WALKTHROUGH_DURATION = 57.8;

export const WALKTHROUGH_CHAPTERS: WalkthroughChapter[] = [
  {
    start: 0.0,
    end: 5.0,
    title: "Landing overview",
    text: "Soteria SECP landing page: the cognitive operating system for modern organizations.",
  },
  {
    start: 5.0,
    end: 9.0,
    title: "Sign-in checkpoint",
    text: "An operator signs in at the credential checkpoint to reach Mission Control.",
  },
  {
    start: 9.0,
    end: 13.0,
    title: "Mission Control",
    text: "Mission Control shows cognitive load, active specialists, and the executive council grid.",
  },
  {
    start: 13.0,
    end: 17.0,
    title: "L1 Organizational layer",
    text: "Layer one indexes organizational identity, entities, and the knowledge corpus.",
  },
  {
    start: 17.0,
    end: 21.0,
    title: "Knowledge ingestion",
    text: "Documents and managed connectors feed the ingestion pipeline into layer one.",
  },
  {
    start: 21.0,
    end: 25.0,
    title: "L2 Executive council",
    text: "Eleven AI officers reason over strategy, each with autonomy level and cognitive load.",
  },
  {
    start: 25.0,
    end: 29.0,
    title: "L3 Consultant tier",
    text: "Domain consultants supply deep expertise on demand across fifteen practices.",
  },
  {
    start: 29.0,
    end: 32.5,
    title: "L4 Program management",
    text: "Programs break work down into workstreams, acceptance criteria, and a risk register.",
  },
  {
    start: 32.5,
    end: 36.0,
    title: "L5 Specialist workforce",
    text: "The specialist workforce executes tasks under autonomy policy.",
  },
  {
    start: 36.0,
    end: 41.0,
    title: "L6 Validation & governance",
    text: "Validator batteries score accuracy and completeness, and log every decision to the audit trail.",
  },
  {
    start: 41.0,
    end: 44.0,
    title: "Request queue",
    text: "The request queue tracks active directives through the twelve-stage reasoning pipeline.",
  },
  {
    start: 44.0,
    end: 47.0,
    title: "Learning loop",
    text: "Operators log lessons and outcome ratings that tune future reasoning.",
  },
  {
    start: 47.0,
    end: 50.0,
    title: "Skills & training",
    text: "The archetype forge defines new specialist roles and domain packs without redesign.",
  },
  {
    start: 50.0,
    end: 53.0,
    title: "Knowledge graph",
    text: "The knowledge graph visualizes over one million edges between organizational entities.",
  },
  {
    start: 53.0,
    end: 55.5,
    title: "Security & compliance",
    text: "Data residency, PII redaction, and SOC 2 style evidence are managed in one surface.",
  },
  {
    start: 55.5,
    end: 57.8,
    title: "Retention & purge",
    text: "Retention windows and compliant purges close the governance loop.",
  },
];
