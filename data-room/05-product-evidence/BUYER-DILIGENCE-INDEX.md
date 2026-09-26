# Buyer Diligence Index

This index maps material buyer questions to the evidence state used in the data room. No evidence state is upgraded by this document.

| Buyer claim or diligence question | Evidence state | Primary verification location | Remaining action |
| --- | --- | --- | --- |
| Coxec is an implemented enterprise application foundation | **Verified** | Source tree, `package.json`, `data-room/03-technology/README.md`, production build evidence | Buyer code review and architecture walkthrough |
| Governed execution, validation, artifacts, and audit-oriented records exist in the codebase | **Verified** | Domain modules, tests, `docs/security/`, `IMPLEMENTATION-STATUS.md` | Buyer review of domain behavior and acceptance criteria |
| Organization and membership architecture is implemented | **Environment-dependent** | Supabase migrations, organization-scoped modules, authorization matrix | Run two-user/two-organization tests in buyer-controlled staging |
| Public landing page and configuration-safe auth entry render | **Verified** | `scripts/smoke-local.mjs`, `PRODUCTION-READINESS-REPORT.md`, live screenshots | Reproduce against the transferred commit |
| Live authentication, session persistence, logout, and OAuth work in production | **Outstanding** | No live credentials were supplied | Configure disposable identity-provider credentials and test |
| AI gateway/provider abstraction exists | **Implemented but environment-dependent** | `src/lib/ai-gateway.server.ts`, provider configuration, technical diligence report | Configure a non-production gateway and test valid/error/timeout/refusal cases |
| Live AI quality, cost, latency, retention, or data-residency behavior is acceptable | **Outstanding** | No live provider evidence | Buyer model/provider evaluation and contractual review |
| Authorization and RLS controls are designed and statically covered | **Verified** | Threat model, authorization matrix, migrations, `npm run test:security` | Execute live database-level tenant and role tests |
| Live tenant isolation and direct API authorization are proven | **Outstanding** | No authenticated Supabase session available | Run disposable two-tenant authorization suite |
| Release engineering and production build are reproducible | **Verified** | Hosted release gate [36226067198](https://github.com/Brunny2023/soteria-cognitive-engine-enterprise/actions/runs/36226067198) for commit `b26126695b70495f2451c090985e3d89eccf059b`; local `npm run validate:release` | Re-run for buyer-controlled transfer archive if required |
| Dependency audit and SBOM evidence exist | **Verified** | `reports/sbom.cdx.json`, security scripts, hosted release gate | Buyer legal and security review of dependency terms |
| Deployment, monitoring, backup, restore, and rollback are production-proven | **Documented but not independently verified** | `docs/operations/runbook.md`, `data-room/06-operations/README.md` | Rehearse in buyer-controlled staging and record evidence |
| Independent security certification or penetration test exists | **Outstanding** | No report included | Commission independent review if required |
| Revenue, customers, ARR/MRR, retention, margin, or market share exist | **Outstanding** | No source-backed commercial evidence included | Seller/buyer to exchange restricted commercial evidence if available |
| Coxec chain of title is complete | **Outstanding** | `data-room/07-ip-legal/README.md`, IP/provenance dossier | Obtain signed assignments and third-party rights confirmations |
| Historical credentials are remediated | **Outstanding pending closing evidence** | Sensitive-file check covers current revision only; transaction checklist | Rotate, revoke, or confirm inactive every historical/current credential and retain evidence |
| Coxec domain/brand rights transfer with the software | **Environment-dependent / contract-dependent** | Domain and brand notes in IP/legal and transaction sections | Expressly list rights in definitive agreement and verify ownership |
| The public status-card values are production telemetry | **Not claimed** | Product evidence records them as presentation evidence only | Current public source labels them as demonstration/example values |
