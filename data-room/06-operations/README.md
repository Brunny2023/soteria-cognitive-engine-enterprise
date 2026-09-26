# 06 — Operations

## Deployment

The repository includes local setup instructions, staging compose configuration, Cloudflare deployment configuration, environment templates, migrations, build commands, and release validation. A buyer must reproduce deployment in buyer-owned staging and record the exact runtime, hosting, domain, and secret-management configuration.

## Monitoring

The application includes redacted structured observability helpers and operational guidance. Production dashboards, alert thresholds, log retention, on-call ownership, and provider-specific monitors remain buyer configuration items.

## Backup and restore

The runbook describes backup, retention, restore, and rollback responsibilities. No live backup/restore rehearsal or measured recovery objective was completed in the available environment.

## Incident response

See [incident response](../../docs/operations/incident-response.md) for severity, containment, credential rotation, tenant-isolation, provider failure, communication, and post-incident requirements.

## Disaster recovery

A buyer should define infrastructure redundancy, backup locations, restore authorization, recovery-point objective, recovery-time objective, dependency failure modes, and a tested rollback path. No production RPO/RTO claim is made.

## Runbooks

- [Operations runbook](../../docs/operations/runbook.md)
- [Incident response](../../docs/operations/incident-response.md)
- [Evidence template](../../docs/operations/evidence-template.md)
- [Production readiness](../../PRODUCTION-READINESS-REPORT.md)
