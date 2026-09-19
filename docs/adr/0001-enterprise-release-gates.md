# ADR 0001: Enterprise Release Gates

- Status: Accepted
- Date: 2026-09-19

## Decision

Soteria will not be marketed as enterprise-ready until reproducible installation, CI validation, tenant isolation evidence, security review, operational runbooks, AI evaluation, and provenance documentation are present. The release gate is evidence-based and blocks release on critical security or build failures.

## Rationale

The product handles organizational data and server-side AI orchestration. Source-code breadth is not evidence of safe operation. A buyer needs repeatable proof that the system can be built, tested, deployed, and audited independently.
