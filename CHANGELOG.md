# Changelog

## Unreleased — Enterprise-readiness foundation

This clone-only upgrade preserves Lovable fingerprints, ownership, attribution, and tracking history.

### Added

- Explicit Node 22.13.0 and npm 10.9.2 policy.
- Secret-free `.env.example` and stronger secret/coverage ignore rules.
- Root `typecheck`, security validation, coverage, audit, and release-validation scripts.
- GitHub Actions workflow for install, typecheck, lint, tests, RLS migration coverage, audit, and production build.
- CODEOWNERS, provenance/ownership policy, authorization matrix, ADRs, deployment runbook, and buyer-facing release checklist.
- Executable tenant-boundary, role-change, service-role-context, audit-integrity, and telemetry-redaction tests.
- Synthetic reference-workflow evaluation with grounding, policy, approval, containment, latency, and cost metrics.
- Threat model, incident-response playbook, Cloudflare/local staging manifests, evidence checker, and CycloneDX SBOM generation.

### Changed

- Regenerated `package-lock.json` using npm’s legacy peer-dependency policy because the original lockfile could not be consumed by clean `npm ci`.
- Removed only the tracked `.env` from this local clone; no GitHub or Lovable history was changed.

### Not changed intentionally

- Lovable-specific packages, configuration, metadata, integrations, and fingerprints remain in place.
- No commits were pushed to GitHub.
