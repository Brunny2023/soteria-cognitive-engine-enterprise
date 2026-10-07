# Soteria Cognitive Engine Enterprise — Transaction Data Room

**Data-room status:** Acquisition-preparation package assembled 26 September 2026
**Repository:** `Brunny2023/soteria-cognitive-engine-enterprise`
**Live public site:** [coxec.soteriatech.pro](https://coxec.soteriatech.pro)
**Public-site observation:** Landing page and authentication entry point were inspected without submitting credentials.
**Important:** This repository contains a technical diligence package, not confidential legal, financial, customer, or credential material.

## Buyer navigation

| Section | Contents | Primary use |
| --- | --- | --- |
| [01 — Executive](data-room/01-executive/README.md) | Summary, product, thesis, demo, roadmap | Orient the buyer |
| [Coxec Acquisition Brief](data-room/01-executive/COXEC-ACQUISITION-BRIEF.md) | Enterprise software asset acquisition brief | Understand the asset and buyer value proposition |
| [02 — Commercial](data-room/02-commercial/README.md) | Asset thesis, capability evidence, commercial hypotheses, competition, GTM | Assess asset value without inventing traction |
| [03 — Technology](data-room/03-technology/README.md) | Architecture, diligence, diagrams, infrastructure, dependencies, APIs, deployment | Assess technical transferability |
| [04 — Security](data-room/04-security/README.md) | Threat model, controls, RLS, auth, testing, SBOM, limitations | Assess security risk |
| [05 — Product Evidence](data-room/05-product-evidence/README.md) | Test results, CI, browser evidence, live screenshots, AI evaluation, performance boundaries | Separate proof from claims |
| [Buyer Diligence Index](data-room/05-product-evidence/BUYER-DILIGENCE-INDEX.md) | Claim-to-evidence map with evidence states and remaining actions | Verify material claims efficiently |
| [06 — Operations](data-room/06-operations/README.md) | Deployment, monitoring, backup, incident response, disaster recovery, runbooks | Plan operating handoff |
| [07 — IP & Legal](data-room/07-ip-legal/README.md) | Ownership, provenance, licenses, dependencies, domain/brand, buyer license | Establish chain of title |
| [08 — Transaction](data-room/08-transaction/README.md) | Acquisition perimeter, excluded assets, structures, transfer, support | Define the deal perimeter |

## Proposed Coxec acquisition perimeter

Subject to definitive agreement, legal review, chain-of-title verification, and third-party transfer restrictions, the proposed acquisition asset includes Coxec source code and repository/archive; Coxec-specific schema and migrations; tests and validation suites; deployment/configuration templates; CI/CD and release workflows; architecture, technical, security, operations, and product documentation; SBOM/dependency evidence; Coxec-specific IP/provenance; Coxec domain/brand only if separately designated for transfer; and expressly agreed transition assistance.

Explicit exclusions include Soteria AI Technologies Limited, Soteria AI Technologies Inc., unrelated Soteria products, unrelated repositories and domains, unrelated intellectual property, corporate accounts, customer/private data, credentials/secrets/tokens/API keys, third-party cloud/provider accounts, non-transferable third-party rights, Soteria corporate trademarks/brand rights unless expressly included, seller liabilities, and guarantees concerning revenue, customers, uptime, scale, certification, or AI performance.

## Data-room rules

1. Every material claim is classified as **Verified**, **Environment-dependent**, **Documented but not independently verified**, or **Outstanding**.
2. No credentials, private customer information, confidential agreements, or personal information belong in this repository.
3. Historical provenance is preserved; cosmetic history rewriting is not a substitute for chain-of-title evidence.
4. Financial, customer, legal, domain, and trademark materials should be added to a restricted transaction room only after redaction and counsel review.
5. A buyer should not infer production certification, revenue, scale, SOC 2/ISO certification, penetration testing, or guaranteed security from this package.

## Current readiness

- **Sale-presentable technical asset:** Yes.
- **Production-certified enterprise service:** Not independently verified.
- **Revenue-generating business:** Not evidenced in this repository.
- **Chain of title:** Requires signed assignment and third-party rights confirmation.
- **Credential remediation:** Closing prerequisite; historical and current credentials must be rotated, revoked, or confirmed inactive before transfer.
- **Public metrics:** Historical status-card values were presentation-only; the source and live deployment now label them as demonstration/example values. A public smoke check on 27 September 2026 returned HTTP 200 and confirmed `DEMO_STATUS` and `EXAMPLE_*` markers; no `SYSTEM_STATUS`, `ACTIVE_SPECIALISTS`, or `OPEN_REQUESTS` markers were found.

## Authoritative transaction release identity

The authoritative transaction release remains unchanged and is the only release identity for the transaction evidence package. Later commits and runs are preparation or validation work and must not be interpreted as replacing it.

- **Exact authoritative transaction release commit:** `176ff0bd9c141ca5da42d53e38ed94afd217230c`
- **Exact authoritative hosted release gate:** [Enterprise release gate 36224709540](https://github.com/Brunny2023/soteria-cognitive-engine-enterprise/actions/runs/36224709540)
- **Exact authoritative evidence package:** `docs/evidence/SALE-READINESS-EVIDENCE.md`, `PRODUCTION-READINESS-REPORT.md`, `BUYER-TECHNICAL-DUE-DILIGENCE.md`, `SALE-READINESS-REPORT.md`, `data-room/01-08/`, and the checked-in release/security evidence referenced by those documents.
- **Primary implementation commit:** `32f44624b50a8a2105dfa0dcfe66e0f97887f97a`
- **Subsequent acquisition-preparation validation — not the transaction release identity:** commit `b26126695b70495f2451c090985e3d89eccf059b`, hosted release gate [36226067198](https://github.com/Brunny2023/soteria-cognitive-engine-enterprise/actions/runs/36226067198).
- **Prior historical package:** `676817e5a10fedd852521ab2c855e81baa73711f`; retained for provenance only.

## Private transaction-room material

The private pricing workpaper and closing checklist are maintained outside the public repository at `/home/ubuntu/repo-evaluation/sale-readiness/private-transaction-room/`. They are not part of the public technical data room.

## Restricted-room additions before closing

- Signed IP assignments and contributor declarations.
- Revenue, customer, retention, margin, and production-scale evidence, if any.
- Domain registrar and trademark records.
- Cloud, Supabase, model-provider, email, and monitoring contracts.
- Redacted incident and backup/restore records.
- Buyer-specific offer, definitive agreement, escrow, and transition documents.
- Credential-remediation evidence and provider-log review.

## Authorization and tenant-isolation milestone — 2026-10-07

**Status: Published remediation with live verification outstanding.**

- Final repository `main`: `dabccea9b8e4ad18a6fc13ace5aefd902016486f`.
- Published remediation ancestor: `ca002740d4cefcd5c6b4ee76f005308f758c8104`.
- Required migration is present in `supabase/migrations/20261007175800_harden_authorization_tenant_isolation.sql`.
- Server-side admin authorization and the `/admin` frontend access gate are published.
- Hosted release gate passed: [run 37663777012](https://github.com/Brunny2023/soteria-cognitive-engine-enterprise/actions/runs/37663777012).
- Connected Supabase project: `ragjpjkkagrfbcwfrefm`.
- **Live database status:** not verified. The Supabase management channel timed out on read-only migration inventory and migration application attempts.
- **Two-user isolation status:** not verified. No customer data was used.

Buyers should treat the RLS migration as a closing/deployment prerequisite until effective policies and controlled User A/User B tests are independently recorded. See `docs/AUTHORIZATION-TENANT-ISOLATION-VALIDATION.md` for the detailed matrix and historical findings.
