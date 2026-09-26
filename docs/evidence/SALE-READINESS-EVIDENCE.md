# Sale-Readiness Evidence Index

**Assessment date:** 19 September 2026
**Repository baseline:** `c8c8538fd8ffd48ea809fb7c03478800f508b507` before this release-readiness change
**Environment:** Ubuntu sandbox, Node 22.13.x, npm 10.9.x, local Vite server at `http://127.0.0.1:4173`
**External credentials:** none supplied.

## Final Release Identity

This evidence index records the validation performed during the sale-readiness process.

- **Baseline assessed:** `c8c8538fd8ffd48ea809fb7c03478800f508b507`
- **Primary verified implementation commit:** `32f44624b50a8a2105dfa0dcfe66e0f97887f97a`
- **Previously published sale-readiness package:** `676817e5a10fedd852521ab2c855e81baa73711f`
- **Final closure commit:** `176ff0bd9c141ca5da42d53e38ed94afd217230c`
- **Final hosted CI run:** [Enterprise release gate 36224709540](https://github.com/Brunny2023/soteria-cognitive-engine-enterprise/actions/runs/36224709540)

The final closure commit represents the repository state containing the completed sale-readiness documentation and consistency pass. The final CI result was evaluated against that exact revision. Passing static, synthetic, or local tests does not constitute evidence of live production behavior where the relevant external infrastructure was unavailable.

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
| `npm run security:scan`                                                                | Passed            | No high-severity production dependency findings at the configured threshold                           |
| `npm run security:sbom`                                                                | Passed            | CycloneDX SBOM generated at `reports/sbom.cdx.json`                                                   |
| `npm run build`                                                                        | Passed            | Production build completed                                                                            |
| `npm run smoke:local`                                                                  | Passed            | Three HTTP journeys verified                                                                          |
| `python3 tests/playwright/walkthrough_smoke.py http://127.0.0.1:4173`                  | Passed            | Walkthrough metadata, captions, playback, chapters, keyboard navigation, loop, and auth link verified |
| `SECP_BASE_URL=http://127.0.0.1:4173 python3 tests/playwright/scoped_sql_validator.py` | Skipped by design | No injected Supabase session; authenticated assertions unavailable                                    |

## Real-user browser evidence

The isolated browser opened `/`, `/auth`, and `/dashboard`. The public landing page and walkthrough rendered. The authentication page rendered a configuration message when Supabase variables were absent. The protected route redirected to `/auth`. Browser console review after remediation showed no uncaught missing-Supabase exception on the public or auth pages.

## Live production-site evidence

Observed on **26 September 2026** at [https://coxec.soteriatech.pro](https://coxec.soteriatech.pro):

- The public landing page loaded and presented the Soteria SECP product shell, six cognition layers, a 16-chapter walkthrough, sign-in navigation, and visible status cards.
- The public authentication page loaded at `/auth` and displayed a configuration-state message stating that authentication was not configured in the inspected environment.
- No credentials were submitted and no authenticated workflow was claimed.
- Screenshots are preserved in `data-room/05-product-evidence/screenshots/`.

These findings establish public reachability and visible presentation only. They do not establish production telemetry accuracy, customer data, live authentication, tenant isolation, model-provider behavior, production scale, or uptime.

## Tests not executed

Live sign-up, sign-in, session persistence, logout, organization creation, two-user tenant isolation, role downgrade, direct API authorization, database-backed audit integrity, real model-provider responses, backup/restore, and production deployment were not executed because no disposable external credentials or infrastructure were available.

## Interpretation

A passing command is evidence only for the behavior that command actually exercises. Static RLS coverage does not prove live RLS behavior. Synthetic AI evaluation does not prove production model quality. A successful local build does not prove a production deployment. This index intentionally preserves those distinctions.
