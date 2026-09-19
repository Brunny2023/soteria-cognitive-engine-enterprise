# Commercial Distribution Hardening Report

## Scope

This revision prepares the enterprise distribution for an independent buyer. It removes platform-specific development tooling, preview-domain hooks, metadata, provider headers, and provenance language that is not part of the product. The original repository remains unchanged by this sales sanitization pass.

## Product-preserving changes

Authentication now uses the standard Supabase OAuth API. Browser sessions use local browser storage. AI calls use a generic OpenAI-compatible gateway configured with AI_GATEWAY_BASE_URL and AI_GATEWAY_API_KEY. Alert email delivery uses a generic HTTP provider configured with EMAIL_PROVIDER_URL and EMAIL_PROVIDER_API_KEY. Runtime errors use a local structured reporter. The TanStack Start build uses standard Vite, Nitro, React, Tailwind, and path-resolution plugins.

No domain workflows, organization boundaries, RLS migrations, audit-integrity logic, evaluation fixtures, or product AI capabilities were removed. Product-facing AI terminology remains where it describes runtime behavior rather than source-code provenance.

## Sales controls

The repository contains a secret-free environment template, reproducible npm policy, CODEOWNERS, threat model, authorization matrix, operations runbook, incident response playbook, deployment manifests, third-party licensing schedule, SBOM generation, release evidence checks, and synthetic reference-workflow evaluation.

## Buyer configuration

A buyer must configure Supabase, an OpenAI-compatible AI endpoint, a model identifier, and an optional email provider. The buyer must complete provider terms, data-processing review, backup/restore rehearsal, production observability verification, contributor IP assignments, and any independent security review before making enterprise or regulatory claims.
