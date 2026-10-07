# Buyer Technical Due Diligence

**Product:** Soteria Cognitive Engine Enterprise
**Assessment date:** 19 September 2026
**Baseline:** `c8c8538fd8ffd48ea809fb7c03478800f508b507`
**Purpose:** Give a technically competent buyer a factual map of the current software, its evidence, its dependencies, and its limitations.

**Transaction data room:** [DATA-ROOM-INDEX.md](DATA-ROOM-INDEX.md). The live public shell was observed at [coxec.soteriatech.pro](https://coxec.soteriatech.pro) on 26 September 2026; screenshots and scoped observations are preserved in `data-room/05-product-evidence/`.

## Executive summary

Soteria Cognitive Engine Enterprise is a TypeScript/TanStack Start application backed by Supabase. It models organizational intelligence, executive and specialist workflows, governed execution, validation, artifacts, and audit-oriented records. The repository contains meaningful domain logic, database migrations, release automation, deployment templates, and buyer-facing security documentation.

The repository is **not represented as a production-certified or revenue-generating system**. The current environment proved public landing-page rendering, configuration-safe authentication entry, unauthenticated protected-route redirection, deterministic security contracts, synthetic AI evaluation, dependency auditing, SBOM generation, and production build. A live multi-user Supabase test, real-provider AI workflow, backup/restore rehearsal, and production deployment were blocked by the absence of disposable external credentials and infrastructure.

## Verified and implemented

The current revision has a reproducible Node/npm policy, a locked npm install, strict TypeScript typechecking, ESLint, unit and contract tests, a static RLS migration coverage check, synthetic reference-workflow evaluation, release-evidence checks, a current-revision sensitive-file scan, a production dependency audit, CycloneDX SBOM generation, and a successful production build.

The application’s public landing page renders without backend configuration. Authentication entry renders a clear configuration message when Supabase is unavailable. Protected routes redirect to the authentication page rather than exposing route content or throwing an unhandled backend-configuration error. These behaviors were verified through a running local application and the smoke command.

The codebase includes organization and membership schema, role contracts, scoped query construction, server-only tool modules, audit-integrity functions, telemetry redaction, deployment examples, an incident-response playbook, a threat model, and an authorization matrix. These are implemented artifacts; they are not equivalent to independent production certification.

## Implemented but environment-dependent

Authentication, organization creation, membership, role changes, persistence, storage, AI gateway execution, provider failure handling, human approval, audit persistence, email delivery, and deployment manifests are implemented or represented in code. They require a configured Supabase project, disposable users, model-provider credentials, any selected email provider, a hosting target, and secrets stored outside the repository.

The runtime supports provider-neutral OpenAI-compatible configuration. Provider independence is limited to the adapter contract. Model behavior, structured-output reliability, latency, token cost, content policy, retention, and data residency depend on the selected gateway and model.

## Documented but not independently verified

The repository documents backup and restore, incident response, migration controls, rollback, retention, observability, and enterprise security acceptance criteria. No claim is made that these have been proven in a live customer-like environment. A buyer should run the exact staging rehearsals described in the runbook before production use.

The authorization matrix states required tests for cross-tenant access, role downgrade, service-role context, storage paths, audit mutation, and prompt/tool scope. Pure contracts and static migration checks are available. Live database-level RLS evidence remains outstanding.

## Not implemented or not evidenced

No production deployment, paid customer, customer contract, ARR, MRR, retention, gross-margin schedule, support history, SOC 2 report, ISO certificate, penetration-test report, or independent code audit is included. No RPO or RTO is claimed. No live-provider AI quality or cost benchmark is claimed.

## External configuration requirements

A buyer must provide a Supabase project with migrations applied in order, an authentication configuration, storage configuration, backup/export policy, and separate staging and production projects. The buyer must provide `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and a server-only `SUPABASE_SERVICE_ROLE_KEY` through a managed secret store.

The buyer must select and configure an OpenAI-compatible gateway through `AI_GATEWAY_BASE_URL`, `AI_GATEWAY_API_KEY`, and `AI_MODEL`. Optional email and error-reporting integrations require `EMAIL_PROVIDER_URL`, `EMAIL_PROVIDER_API_KEY`, and `ERROR_REPORTING_DSN`. A hosting target and domain are required for deployment. OAuth provider credentials, redirect URLs, monitoring, alert routing, and a support access process are also required for a production deployment.

## Reproduction instructions

Use Node.js 22.13.x and npm 10.9.x.

```sh
npm ci
npm run validate:release
npm run dev -- --host 0.0.0.0 --port 4173
# in a second terminal
npm run smoke:local
```

For a configured environment, copy `.env.example` into an ignored local environment file, provide disposable credentials, apply Supabase migrations, and run the live authentication and tenant-isolation test plan before calling the system production-ready.

## Evidence locations

| Claim                                       | Evidence                                                                            |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| Public and auth configuration-safe behavior | `scripts/smoke-local.mjs`; browser run recorded in `PRODUCTION-READINESS-REPORT.md` |
| Type safety and lint                        | `npm run typecheck`; `npm run lint`                                                 |
| Unit and security contracts                 | `src/lib/__tests__/`; `npm test`                                                    |
| Static RLS coverage                         | `scripts/check-rls-coverage.mjs`; `npm run test:security`                           |
| AI safety fixture                           | `evaluations/reference-workflow.json`; `npm run test:ai-eval`                       |
| Current revision secret scan                | `scripts/check-sensitive-files.mjs`; `npm run security:files`                       |
| Dependency and supply-chain evidence        | `npm run security:scan`; `npm run security:sbom`                                    |
| Build                                       | `npm run build`                                                                     |
| Security model and required live tests      | `docs/security/threat-model.md`; `docs/security/authorization-matrix.md`            |
| Operations and deployment                   | `docs/operations/runbook.md`; `infra/`                                              |
| Capability state                            | `IMPLEMENTATION-STATUS.md`                                                          |

## Buyer acceptance conditions

Before closing or production adoption, the buyer should obtain written IP assignments and provenance confirmations, complete the license and dependency schedule, run disposable Supabase authorization tests, exercise a real model-provider workflow, perform backup/restore and rollback rehearsals, review the SBOM, configure branch protection and security scanning, and approve the production threat model through an independent reviewer.

## Final authorization validation status — 2026-10-07

| Control | Status | Evidence state |
|---|---|---|
| Published branch and clean `main` | **PASS** | `dabccea9b8e4ad18a6fc13ace5aefd902016486f`; clean and synchronized with `origin/main` |
| Platform-admin server authorization | **PASS — source-verified** | `pingLayerFn` checks the caller's RLS-protected `user_roles` record before gateway execution |
| Direct `/admin` ordinary-user rejection | **SOURCE-SUPPORTED / LIVE NOT VERIFIED** | Published frontend gate exists; controlled ordinary-user browser test remains pending |
| RLS hardening | **PUBLISHED / LIVE NOT VERIFIED** | `supabase/migrations/20261007175800_harden_authorization_tenant_isolation.sql` is in `main`; Supabase management channel timed out |
| User A/User B isolation | **NOT VERIFIED** | Disposable two-user test has not been run; no customer data was used |
| Role escalation and super-admin protection | **PARTIAL** | Existing super-admin migrations and source checks support the controls; fresh live recheck is blocked |
| Service-role source boundary | **SOURCE-VERIFIED** | No committed service-role credential found; final deployed bundle inspection remains pending |
| Release gate | **PASS** | Hosted run [37663777012](https://github.com/Brunny2023/soteria-cognitive-engine-enterprise/actions/runs/37663777012) |

The authoritative control record is `docs/AUTHORIZATION-TENANT-ISOLATION-VALIDATION.md`. Buyer acceptance should require live migration application, effective-policy inspection, and a disposable two-user negative/positive test matrix before production authorization claims.
