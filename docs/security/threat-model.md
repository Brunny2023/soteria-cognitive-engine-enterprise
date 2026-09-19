# Soteria Threat Model

## Scope

The system is a multi-tenant web application that stores organization data in Supabase, executes bounded AI workflows, persists artifacts and audit records, and uses Supabase authentication and a configurable AI gateway. This model covers the browser, application server, Supabase/Postgres, storage, AI gateway, CI/CD, operators, and external providers.

## Assets

The primary assets are organization records, uploaded knowledge sources, AI prompts and responses, execution traces, artifacts, membership and role records, retention decisions, service credentials, model-provider credentials, audit manifests, and deployment configuration. Confidentiality, tenant isolation, integrity, availability, provenance, and cost control are material properties.

## Trust boundaries

The browser is untrusted and may submit manipulated organization IDs, role claims, prompts, tool parameters, file metadata, and replayed requests. The application server is trusted only for operations that validate authenticated user and organization context. Supabase RLS is the authoritative database boundary. The service-role key bypasses RLS and must remain server-only. The AI gateway is an external processor and must receive only the minimum permitted data. CI and deployment systems are privileged supply-chain boundaries.

## Threats and controls

| Threat                          | Control                                                                                   | Evidence or remaining action                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Cross-tenant read/write         | RLS, organization membership checks, explicit active-organization context, scoped tools   | Static migration gate plus pure authorization tests; disposable Supabase tests remain required |
| Null/legacy organization escape | Reject null tenant records in application contracts; migration and backfill plan          | Contract tests exist; production backfill evidence required                                    |
| Role downgrade race             | Membership lookup on each server operation; no client-trusted roles                       | Contract tests exist; integration test with live policy required                               |
| Service-role leakage            | Server-only imports, secret-free templates, CI tracked-secret check                       | Bundle inspection and production deployment review required                                    |
| Prompt/tool injection           | Zod input validation, table/column allowlists, row caps, SELECT-only scoped query builder | Existing scoped SQL tests and reference evaluation; adversarial red-team set required          |
| Unauthorized external action    | Human approval requirement in workflow state and evaluation fixture                       | Live workflow approval test required                                                           |
| Audit tampering                 | Canonical row hashing and chained manifest comparison                                     | Unit tests added; independent storage/append-only review required                              |
| Supply-chain compromise         | Lockfile, npm audit, SBOM, CI permissions, CODEOWNERS                                     | CI evidence; dependency-owner review required                                                  |
| Secret exposure                 | Ignored env files, secret scan, server-only configuration, redacted logging               | Runtime secret scan and provider rotation evidence required                                    |
| Availability/cost runaway       | Timeouts, bounded retries, row/token caps, kill switch, alerts                            | Load test and provider budget alert evidence required                                          |
| Data retention breach           | Retention audit records, backup/restore and deletion runbook                              | Live restore/deletion rehearsal required                                                       |

## Security acceptance criteria

A release may be called security-ready only when all controls have passing automated evidence, a disposable Supabase authorization run has passed, a dependency/SBOM review is attached, and an independent reviewer has signed the threat model. The local clone can provide the automated baseline but cannot self-certify independent review or production controls.
