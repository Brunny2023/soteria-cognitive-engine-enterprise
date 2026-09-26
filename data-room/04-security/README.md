# 04 — Security

## Threat model

Read [the formal threat model](../../docs/security/threat-model.md) for tenant isolation, authentication, secrets, AI tools, audit integrity, and operational threats.

## Security controls

The repository includes input validation, organization and role contracts, scoped SQL construction, server-only tool modules, telemetry redaction, audit-integrity helpers, migration policy coverage, release evidence checks, dependency scanning, and SBOM generation.

## RLS architecture

Supabase migrations declare row-level security policies across organization, membership, knowledge, workstream, request, task, artifact, and audit-related tables. `npm run test:security` statically inventories policy declarations. This is not a substitute for live two-organization database tests.

## Authentication and authorization

The public site exposes a configuration-aware authentication entry point. Protected routes redirect unauthenticated users. The authorization matrix and pure security contracts cover null/legacy organization identifiers, role changes, cross-tenant denial contracts, service-role context, and audit-manifest integrity.

## Security testing

The hosted release gate runs typecheck, lint, unit/security-contract tests, RLS migration coverage, sensitive-file checks, dependency audit, SBOM generation, and production build. Live auth, direct API authorization, database RLS behavior, backup/restore, and independent penetration testing remain open.

## Dependency / SBOM reports

Regenerate the inventory with `npm run security:sbom`. The generated CycloneDX report is written to `reports/sbom.cdx.json` and should be attached to the buyer’s release record for the exact transferred revision.

## Known limitations

No claim is made for SOC 2, ISO certification, penetration-test certification, guaranteed security, zero vulnerabilities, production scale, or regulatory compliance. Historical environment-file findings require credential rotation/revocation and provider-log review before transfer.

Primary evidence: [authorization matrix](../../docs/security/authorization-matrix.md), [threat model](../../docs/security/threat-model.md), [IP/provenance dossier](../../docs/legal/IP-PROVENANCE-DOSSIER.md), and [sale-readiness evidence](../05-product-evidence/README.md).
