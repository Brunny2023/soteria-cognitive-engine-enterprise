# 05 — Product Evidence

## Live production-site observation

**Observed:** 26 September 2026 at `https://coxec.soteriatech.pro`.

The public landing page loaded successfully and presented the Soteria SECP product overview. Visible content included the six cognition layers, a 16-chapter walkthrough, a live walkthrough control, navigation to sign-in, and status cards showing hard-coded presentation values. The inspected historical capture showed `SYSTEM_STATUS · NOMINAL`, `ACTIVE_SPECIALISTS · 1,284`, `OPEN_REQUESTS · 47`, `VALIDATION_PASS · 98.3%`, and `ENTITIES_INDEXED · 42,981`.

These displayed values are **live-site presentation evidence only**. They were not independently reconciled to a production database or customer telemetry.

As an acquisition-preparation correction, the source now labels these values as `DEMO_STATUS` and `EXAMPLE_*` metrics. The public deployment must be rebuilt and redeployed before the correction is visible at the live domain.

The public authentication page also loaded successfully. It displayed the sign-in form and explicitly stated that authentication was not configured in the inspected environment. No credentials were submitted and no authenticated workflow was claimed.

## Screenshots

| Artifact                                                      | Description                                                     |
| ------------------------------------------------------------- | --------------------------------------------------------------- |
| [Live landing page](screenshots/live-landing-2026-09-26.webp) | Public product shell, status cards, walkthrough, and navigation |
| [Live auth page](screenshots/live-auth-2026-09-26.webp)       | Credential checkpoint and configuration-state message           |

## Test results

- Clean `npm ci`: passed.
- Typecheck and lint: passed.
- Unit/security contracts: 23 tests passed across 3 files.
- Static RLS coverage: passed.
- Synthetic AI evaluation: grounding, policy adherence, approval, and containment metrics all `1`.
- Current-revision sensitive-file audit: passed.
- Dependency audit at configured threshold: no high-severity production dependency findings.
- SBOM generation: passed.
- Production build: passed.
- HTTP smoke test: passed for landing, auth, and protected-route redirect.
- Playwright walkthrough smoke test: passed.
- Authenticated SQL validator: skipped because no injected Supabase session was available.

Full command evidence is in [SALE-READINESS-EVIDENCE.md](../../docs/evidence/SALE-READINESS-EVIDENCE.md).

## CI evidence

- **Authoritative transaction release:** [Enterprise release gate 36224709540](https://github.com/Brunny2023/soteria-cognitive-engine-enterprise/actions/runs/36224709540), testing commit `176ff0bd9c141ca5da42d53e38ed94afd217230c`.
- Earlier release-gate runs are historical provenance only and are not the transaction release identity.

## Demo recordings

The live product shell contains a continuously looping walkthrough with 16 transcript chapters. No separate downloadable recording is asserted in this data room. Buyers may record or receive a controlled demo during diligence.

## Performance measurements

No production load, latency, throughput, RPO/RTO, or model-cost benchmark is asserted. The synthetic reference workflow records local evaluation values only and must not be treated as production performance evidence.

## AI evaluation results

The checked-in reference workflow evaluates grounding, policy adherence, human approval behavior, latency, cost, and table containment against synthetic cases. It is useful as a reproducible safety contract; it does not establish live provider quality or customer outcomes.
