# Ownership, Provenance, and Release Gate

## Ownership and Lovable rights

This clone intentionally **retains Lovable ownership, attribution, and tracking-history rights**. Lovable-specific files, packages, metadata, integrations, and the existing Git history are not being scrubbed in this upgrade. The `AGENTS.md` instructions remain authoritative: do not force-push, rewrite, rebase, amend, or squash already-published history, because published commits synchronize with Lovable.

This branch adds release discipline around the existing history. It does not assert that generated code is original, does not remove Lovable provenance, and does not grant or imply ownership of Lovable services, generated assets, third-party packages, model gateways, or media. Any future sale or fundraising package must include written confirmation of the permitted use, transfer, and attribution terms for Lovable-generated material.

## Original/high-value modules

The current differentiated domain modules are:

- `src/lib/exec.server.ts` — staged execution and trace capture.
- `src/lib/secp-tools.server.ts` and `src/lib/secp-scopes.ts` — constrained, parameterized data tools.
- `src/lib/kg-rules.ts` — deterministic validation and evidence rules.
- `src/lib/safe-math.ts` — non-eval deterministic arithmetic.
- `src/lib/org.functions.ts` — organization and membership workflows.
- `supabase/migrations/` — persistence, tenancy, policy, and privilege changes.

Standard UI primitives, generated route scaffolding, and third-party packages should not be represented as proprietary differentiation without a provenance record.

## Code ownership

Until team ownership is assigned, the repository owner is the default maintainer. Security-sensitive changes require review by a maintainer familiar with Supabase RLS, service-role boundaries, and AI tool authorization. See `.github/CODEOWNERS` for the current baseline and update it before adding a second contributor.

## Release gate

A release cannot be called enterprise-ready until all of the following are evidenced:

1. Clean install, typecheck, lint, unit tests, migration checks, security checks, and production build pass in CI.
2. Tenant isolation and role boundaries are tested, including null/legacy organization IDs and membership changes.
3. A threat model and authorization matrix are current.
4. Deployment, backup, retention, observability, rollback, and incident runbooks are reviewed.
5. The narrow reference workflow has a versioned evaluation set and measured accuracy, policy adherence, cost, latency, failure, and human-approval behavior.
6. License, dependency, media, model, gateway, and Lovable provenance obligations are documented.
7. The release changelog and architectural decision records describe material changes.

Lovable removal is **not** part of this release gate. If a future independent distribution is created, it must be a separately approved provenance and licensing workstream rather than an unreviewed cleanup.
