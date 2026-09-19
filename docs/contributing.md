# Contribution and Release Discipline

## Ownership

The repository owner remains accountable for all changes. Security-sensitive paths are covered by `.github/CODEOWNERS`. Lovable ownership, attribution, and tracking-history rights remain preserved; contributors must not rewrite published history or force-push the connected branch.

## Changes and commits

Keep changes focused and explain the reason in the commit subject. Use a prefix such as `feat:`, `fix:`, `security:`, `test:`, `docs:`, `build:`, or `chore:` followed by a specific summary. Do not use generic messages such as `Changes` or `Work in progress` for release-bound commits. Pull requests should identify risk, tests run, migration impact, and rollback considerations.

## Architectural decisions

Material choices about tenancy, authorization, AI execution, provider configuration, audit integrity, deployment, or provenance require an ADR under `docs/adr/`. An ADR records the decision, alternatives considered, consequences, and status. Update the release changelog when a decision changes externally visible behavior or operational risk.

## Release gate

A release requires a clean install, typecheck, lint, tests, migration coverage, audit, production build, and documented operational evidence. The owner must review the authorization matrix and provenance schedule before tagging a release.
