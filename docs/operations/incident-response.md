# Incident Response Playbook

## Severity

**SEV-1** is an active or suspected cross-tenant disclosure, service-role exposure, unauthorized external action, destructive data event, or material audit-integrity failure. **SEV-2** is a major availability, provider, cost, or authentication event without confirmed cross-tenant exposure. **SEV-3** covers isolated defects with a documented workaround.

## First 15 minutes

Freeze non-essential deployments, preserve logs and audit manifests, record the current commit and migration version, identify affected organizations and time window, and appoint an incident commander. Do not delete or rewrite evidence. If a secret may be exposed, revoke and rotate it through the provider’s secret mechanism. If tenant isolation is uncertain, disable the affected workflow or read path rather than continuing normal operation.

## Containment

Use the application kill switch or provider-side rate limit to stop AI execution and external actions. Disable affected accounts or membership paths through an approved operator workflow. For a suspected cross-tenant issue, isolate the affected organization set and preserve the exact request, policy, query, trace, and audit records. Do not use a service-role key for ad hoc data edits without a recorded change ticket and explicit organization/user scope.

## Investigation

Compare audit manifests before and after the incident, review authorization events, inspect migration and deployment changes, search for service-role imports in client bundles, and reproduce the request using synthetic identities from separate organizations. Record whether data was accessed, altered, exported, or transmitted to a provider.

## Recovery and communication

Apply a reviewed forward fix or rollback-compatible application artifact. Validate RLS, membership, workflow approval, audit integrity, backup restore, and provider configuration in staging before production re-enable. Notify affected stakeholders according to contractual and legal requirements. Close only after the root cause, timeline, impact, containment, corrective actions, and evidence links are recorded.

## Required tabletop exercise

Before enterprise launch, run one tabletop covering a cross-tenant read, one exposed provider key, one failed migration, and one provider outage. Record participants, timestamps, decisions, recovery-point and recovery-time results, and follow-up owners.
