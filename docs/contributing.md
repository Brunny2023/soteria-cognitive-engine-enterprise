# Contribution and Release Discipline

The repository owner is accountable for all changes. Security-sensitive paths are covered by .github/CODEOWNERS. Contributors must not rewrite published history or force-push protected branches.

Keep changes focused and explain the reason in the commit subject. Use a prefix such as feat:, fix:, security:, test:, docs:, build:, or chore: followed by a specific summary. Pull requests should identify risk, tests run, migration impact, and rollback considerations.

Material choices about tenancy, authorization, governed execution, provider configuration, audit integrity, deployment, or licensing require an ADR under docs/adr/. Update the release changelog when a decision changes externally visible behavior or operational risk.

A release requires a clean install, typecheck, lint, tests, migration coverage, reference-workflow evaluation, SBOM, audit, production build, and documented operational evidence. The owner must review the authorization matrix and licensing schedule before tagging a release.
