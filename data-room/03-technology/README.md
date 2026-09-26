# 03 — Technology

## Architecture

The application is a TypeScript/TanStack Start and React application with Supabase integration, server functions, organization-scoped data concepts, governed execution stages, AI gateway adapters, audit-oriented records, deployment templates, and release validation scripts.

## Technical diligence

Primary repository evidence:

- [Buyer technical diligence](../../BUYER-TECHNICAL-DUE-DILIGENCE.md)
- [Implementation status](../../IMPLEMENTATION-STATUS.md)
- [Production-readiness report](../../PRODUCTION-READINESS-REPORT.md)
- [Operations runbook](../../docs/operations/runbook.md)
- [Threat model](../../docs/security/threat-model.md)
- [Authorization matrix](../../docs/security/authorization-matrix.md)

## System diagrams

The source architecture is represented through the route structure, domain modules, migration files, and security documents. A buyer should create a deployment-specific diagram during handoff showing:

```text
Browser -> hosted TanStack application -> Supabase Auth/Database/Storage
                                      -> model gateway/provider
                                      -> email/monitoring/backup services
```

The diagram must identify trust boundaries, secret locations, tenant scope, service-role paths, backup boundaries, and failure handling.

## Infrastructure

Templates and operating contracts are included for:

- Local development and clean installation
- Staging rehearsal via Docker Compose
- Cloudflare deployment configuration
- Supabase migrations and environment variables
- Model gateway configuration
- Backups, retention, rollback, and incident response

Production infrastructure has not been independently deployed or measured in this diligence environment.

## Dependencies

- Node.js 22.13.x
- npm 10.9.x with lockfile and clean-install policy
- React and TanStack Start
- Supabase client/server integration
- AI SDK/provider adapters
- Vitest, ESLint, Prettier, and build tooling

Run `npm run security:sbom` to regenerate the CycloneDX inventory at `reports/sbom.cdx.json`.

## API documentation

The buyer should treat server functions, validation schemas, Supabase migrations, and the typed client/server adapters as the API contract. Before transfer, generate a deployment-specific endpoint inventory including authentication, authorization, request validation, rate limits, error semantics, and data retention.

## Deployment documentation

- [Operations runbook](../../docs/operations/runbook.md)
- [Incident response](../../docs/operations/incident-response.md)
- [Evidence template](../../docs/operations/evidence-template.md)
- `infra/cloudflare/wrangler.toml.example`
- `infra/docker/compose.staging.yml`
- `.env.example`
