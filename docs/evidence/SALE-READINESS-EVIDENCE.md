# Sale-Readiness Evidence Index

**Assessment date:** 19 September 2026
**Repository baseline:** `c8c8538fd8ffd48ea809fb7c03478800f508b507` before this release-readiness change
**Environment:** Ubuntu sandbox, Node 22.13.x, npm 10.9.x, local Vite server at `http://127.0.0.1:4173`
**External credentials:** none supplied.

## Executed commands

| Command                                                                                | Result            | Evidence                                                                                              |
| -------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `npm ci --ignore-scripts --no-audit --no-fund --legacy-peer-deps`                      | Passed            | Fresh clone dependency installation                                                                   |
| `npm run typecheck`                                                                    | Passed            | No TypeScript errors                                                                                  |
| `npm run lint`                                                                         | Passed            | No lint failure                                                                                       |
| `npm test`                                                                             | Passed            | 3 files and 23 tests passed                                                                           |
| `npm run test:security`                                                                | Passed            | Static RLS migration coverage                                                                         |
| `npm run test:ai-eval`                                                                 | Passed            | Synthetic grounding, policy, approval, and containment metrics all 1                                  |
| `npm run release:evidence`                                                             | Passed            | 16 required artifacts present                                                                         |
| `npm run security:files`                                                               | Passed            | 197 tracked files inspected; no current-revision high-confidence secret finding                       |
| `npm run security:scan`                                                                | Passed            | 0 reported production vulnerabilities at high severity threshold                                      |
| `npm run security:sbom`                                                                | Passed            | CycloneDX SBOM generated at `reports/sbom.cdx.json`                                                   |
| `npm run build`                                                                        | Passed            | Production build completed                                                                            |
| `npm run smoke:local`                                                                  | Passed            | Three HTTP journeys verified                                                                          |
| `python3 tests/playwright/walkthrough_smoke.py http://127.0.0.1:4173`                  | Passed            | Walkthrough metadata, captions, playback, chapters, keyboard navigation, loop, and auth link verified |
| `SECP_BASE_URL=http://127.0.0.1:4173 python3 tests/playwright/scoped_sql_validator.py` | Skipped by design | No injected Supabase session; authenticated assertions unavailable                                    |

## Real-user browser evidence

The isolated browser opened `/`, `/auth`, and `/dashboard`. The public landing page and walkthrough rendered. The authentication page rendered a configuration message when Supabase variables were absent. The protected route redirected to `/auth`. Browser console review after remediation showed no uncaught missing-Supabase exception on the public or auth pages.

## Tests not executed

Live sign-up, sign-in, session persistence, logout, organization creation, two-user tenant isolation, role downgrade, direct API authorization, database-backed audit integrity, real model-provider responses, backup/restore, and production deployment were not executed because no disposable external credentials or infrastructure were available.

## Interpretation

A passing command is evidence only for the behavior that command actually exercises. Static RLS coverage does not prove live RLS behavior. Synthetic AI evaluation does not prove production model quality. A successful local build does not prove a production deployment. This index intentionally preserves those distinctions.
