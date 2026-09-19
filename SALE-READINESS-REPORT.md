# Sale-Readiness Report

**Product:** Soteria Cognitive Engine Enterprise
**Assessment date:** 19 September 2026
**Baseline assessed:** `c8c8538fd8ffd48ea809fb7c03478800f508b507`
**Final release commit:** To be recorded after the verified release commit is created.

## Executive summary

The repository was audited from a fresh clone and upgraded where a safe repository-level fix was available. The main functional remediation was a configuration-safe authentication boundary: public and authentication pages no longer fail with an unhandled Supabase exception when the external backend is not configured, and protected routes redirect to the configuration-aware sign-in page.

The release process now includes a tracked-file sensitive-content audit and a deterministic HTTP smoke test. Buyer-facing evidence was added through technical diligence, implementation-status, production-readiness, provenance, and sale-readiness documents. The README now explains what is verified, what is environment-dependent, and what a buyer must configure.

The result is **sale-presentable as a technical software asset**. It is not represented as production-certified, revenue-generating, SOC 2 compliant, independently penetration-tested, or proven at enterprise scale.

## Engineering

The application is a TypeScript/TanStack Start application with React, Supabase, server functions, organization-scoped data concepts, governed execution stages, AI gateway adapters, deployment templates, and release evidence scripts. The repository uses Node 22.13.x and npm 10.9.x with a lockfile and `npm ci` policy.

The fresh-clone release gate passed typecheck, lint, 23 unit and security-contract tests, static RLS migration coverage, synthetic AI evaluation, release-evidence checks, sensitive-file audit, dependency audit, SBOM generation, and production build. The current workflow also executes the sensitive-file audit in GitHub Actions.

## Functional validation

The running local application was tested as a real user in an isolated browser and over HTTP.

1. The public landing page rendered the product overview and walkthrough without external backend credentials.
2. The authentication page rendered the sign-in and registration interface and clearly explained that Supabase configuration is required in the current environment.
3. An unauthenticated request to `/dashboard` redirected to `/auth` instead of exposing protected content or raising an unhandled missing-backend error.
4. Browser console review after the remediation showed no uncaught Supabase configuration exception on the landing or authentication pages.
5. The deterministic smoke test verified all three journeys against the running application.

The live authenticated organization workflow, including sign-up, session persistence, organization creation, membership, organization switching, and human-approved cognitive execution, was not executed because no disposable external credentials were available.

## Security

Executed checks include TypeScript typechecking, ESLint, unit tests, pure authorization contracts, telemetry-redaction tests, static RLS migration coverage, synthetic AI safety evaluation, current-revision sensitive-file scanning, production dependency audit, and SBOM generation.

The current revision contains no tracked environment file and the sensitive-file audit found no high-confidence secret pattern. This is not a historical secret-clearance claim. If a secret was ever committed, it must be treated as compromised and rotated.

The reachable history contains two `.env` revisions with Supabase project, URL, and publishable-key variable names. Values were not copied into the release artifacts. A targeted search found no `SUPABASE_SERVICE_ROLE_KEY=` or `AI_GATEWAY_API_KEY=` assignment in those historical `.env` revisions. The associated Supabase project credentials should nevertheless be rotated or revoked before a commercial transfer, and provider logs should be reviewed.

No SOC 2, ISO certification, penetration-test certification, guaranteed security, or zero-vulnerability claim is made. The repository’s threat model and authorization matrix identify live-database and independent-review requirements that remain outstanding.

## Data isolation

The repository contains organization and membership migrations, role contracts, scoped SQL construction, server-only tools, and static RLS policy coverage. Pure security-contract tests cover null and legacy organization cases, cross-tenant denial contracts, role changes, service-role context, and audit-manifest integrity.

Live database-level proof was blocked by the absence of a disposable Supabase project and credentials. Before production use, the buyer must run direct API and database tests for two organizations, manipulated organization IDs, membership removal, role downgrade, service-role exposure, storage paths, and prompt/tool scope.

## Operations

A clean clone installed successfully with the documented Node/npm policy. The production build succeeded. Cloudflare and staging deployment templates, a runbook, incident-response playbook, evidence template, and rollback guidance are present.

Backup/restore, deployment to a real target, health checks behind a production domain, monitoring, provider failure alerts, and measured RPO/RTO were not executed. The repository makes no achieved RPO/RTO or production-uptime claim.

## IP and provenance

The current tree contains a commercial license notice, third-party schedule, buyer license schedule, and the new non-confidential IP/provenance dossier. Historical provenance is intentionally preserved. The dossier identifies contributor assignments, platform-rights confirmations, external asset records, dependency notices, and service-provider terms as required diligence items.

No confidential assignment, credential, personal information, or private legal agreement was added to the repository. Counsel must approve the final commercial license and transaction representations.

## Documentation created or improved

- `BUYER-TECHNICAL-DUE-DILIGENCE.md`
- `IMPLEMENTATION-STATUS.md`
- `PRODUCTION-READINESS-REPORT.md`
- `SALE-READINESS-REPORT.md`
- `docs/legal/IP-PROVENANCE-DOSSIER.md`
- README current-status and buyer-entry section
- `scripts/check-sensitive-files.mjs`
- `scripts/smoke-local.mjs`
- Package and GitHub Actions integration for the new checks

## Remaining limitations

The following remain environment-dependent or externally governed:

- Live authentication and session behavior.
- Multi-user organization and database-level RLS isolation.
- Real AI-provider valid, malformed, timeout, empty, and failure responses.
- Model cost, latency, and quality measurement.
- Email and webhook delivery.
- Backup/restore rehearsal and recovery measurements.
- Production deployment, monitoring, rollback, and incident exercise.
- Independent security review or penetration testing.
- Contributor IP assignments and platform-rights confirmations.
- Final commercial license, dependency notices, and external-asset clearance.
- Customer, revenue, retention, margin, and production-scale evidence.

## Buyer prerequisites

A buyer should provide separate staging and production infrastructure, a disposable Supabase project, managed secrets, OAuth configuration, a selected AI gateway and model, email and monitoring services, domain and hosting configuration, backup and restore ownership, support access controls, and an independent security reviewer. The buyer should execute the blocked tests and attach their transcripts to a release record before production claims are made.

## Evidence index

| Claim                                               | Evidence location                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Fresh clone and baseline                            | Git commit `c8c8538fd8ffd48ea809fb7c03478800f508b507`; `PRODUCTION-READINESS-REPORT.md`                       |
| Public and auth pages render without backend config | `scripts/smoke-local.mjs`; browser execution recorded in `PRODUCTION-READINESS-REPORT.md`                     |
| Protected route redirects safely                    | `src/routes/_authenticated/route.tsx`; `scripts/smoke-local.mjs`                                              |
| Configuration gate                                  | `src/integrations/supabase/client.ts`; `src/routes/index.tsx`; `src/routes/auth.tsx`; `src/routes/__root.tsx` |
| Typecheck and lint                                  | `npm run typecheck`; `npm run lint`                                                                           |
| Unit and security contracts                         | `src/lib/__tests__/`; `npm test`                                                                              |
| Static RLS coverage                                 | `npm run test:security`; `scripts/check-rls-coverage.mjs`                                                     |
| AI evaluation                                       | `npm run test:ai-eval`; `evaluations/reference-workflow.json`                                                 |
| Current revision sensitive-file audit               | `npm run security:files`; `scripts/check-sensitive-files.mjs`                                                 |
| Dependency audit and SBOM                           | `npm run security:scan`; `npm run security:sbom`; `reports/sbom.cdx.json`                                     |
| Production build                                    | `npm run build`                                                                                               |
| Hosted CI                                           | `.github/workflows/enterprise-release.yml`; future release run URL                                            |
| Capability status                                   | `IMPLEMENTATION-STATUS.md`                                                                                    |
| Environment blockers                                | `PRODUCTION-READINESS-REPORT.md`                                                                              |
| Rights and provenance                               | `docs/legal/IP-PROVENANCE-DOSSIER.md`; `docs/legal/third-party-and-provenance.md`                             |

## Final sale-readiness status

**Sale-presentable technical asset: Yes.**
**Production-ready enterprise service: Not verified.**
**Revenue-generating SaaS: Not evidenced.**
**Rights and chain of title: Pending external confirmation.**

The final release commit SHA must be inserted into this file after the verified commit is created. The release response must report that same SHA and the hosted CI result.
