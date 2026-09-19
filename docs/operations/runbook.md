# Soteria Operations Runbook

This runbook is a release-gate baseline. It must be completed with environment-specific values and tested in a disposable staging project before enterprise deployment.

The Cloudflare deployment contract is represented by `infra/cloudflare/wrangler.toml.example`; the local staging rehearsal contract is `infra/docker/compose.staging.yml`. Neither file contains credentials. Use the provider secret store for all secret values.

## Environment policy

Local development uses synthetic data and a local or disposable Supabase project. Staging uses a separate Supabase project, separate OAuth credentials, disposable users, and non-production AI/email credentials. Production uses managed secrets, restricted operators, backups, monitoring, and an approved change window. The tracked `.env` file is not a valid configuration source; copy `.env.example` into an ignored local file or configure a managed secret store.

## Initial setup

Use Node 22.13.0 and npm 10.9.2. The repository uses `npm ci`, and `.npmrc` records the peer-resolution policy required by the current dependency graph. Run `npm ci`, copy `.env.example` to an ignored environment file, fill only the target environment’s values, and run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:security`, and `npm run build`.

## Supabase and migrations

Create a target Supabase project, configure the project URL and publishable key, and keep the service-role key server-side only. Apply migrations in order using the project’s approved migration process. The migration gate must run before deployment. Verify RLS is enabled on every tenant-scoped table, verify policy coverage, and run disposable-database authorization tests before promoting a release.

## AI gateway and external providers

Provider credentials must be stored in the target environment’s managed secret store. Record model, endpoint, timeout, token budget, safety settings, and cost assumptions for each environment. Do not use production customer data in development or tests.

## Backup and retention

Define backup frequency, retention period, restore owner, and recovery-point and recovery-time objectives for each environment. Perform a restore test before the enterprise release. Document how a customer requests export or deletion, how AI traces and artifacts are retained, and how support access is audited.

## Observability and incident response

Capture structured request, authorization, AI execution, tool-call, validation, latency, token/cost, and error events without logging secrets or unnecessary personal data. `src/lib/observability.server.ts` provides recursive redaction for secret-like telemetry keys. Alert on failed migrations, authentication spikes, cross-tenant authorization failures, AI budget overruns, elevated refusal/error rates, and queue or provider failures. Follow `docs/operations/incident-response.md` and maintain an incident log and escalation path.

## Rollback

A release is rollback-ready only when the prior application artifact, migration compatibility, configuration snapshot, and rollback owner are documented. Never roll back database migrations blindly. Use additive migrations, feature flags, or a forward-fix plan where data compatibility requires it. Disable AI execution or external actions with the approved kill switch when safety or cost controls are degraded.

## Release evidence

Attach the CI run URL, commit SHA, dependency lock hash, migration version, build artifact hash, test report, security scan report, deployment smoke-test result, backup/restore result, and known-risk register to each release record. The release changelog must summarize material domain and security changes.

Generate and review the CycloneDX SBOM with `npm run security:sbom`. Complete `docs/operations/evidence-template.md`; blank evidence rows are release blockers rather than assumptions.
