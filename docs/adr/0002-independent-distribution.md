# ADR 0002: Independent Commercial Distribution

- Status: Accepted
- Date: 2026-09-19

## Decision

The sales distribution uses standard, provider-neutral authentication, email, AI gateway, browser storage, error reporting, and Vite/TanStack build integrations. Product behavior remains configurable through documented environment variables rather than platform-specific packages or preview hooks.

## Rationale

A buyer needs a codebase that can be installed, tested, deployed, and operated independently. Generic adapters reduce platform coupling, make provider substitution explicit, and separate product behavior from development tooling.

## Consequences

The buyer must configure Supabase, an OpenAI-compatible AI gateway, and an optional email provider. The repository retains the standard framework and dependency notices necessary for compliant redistribution. Provider-specific integrations can be added behind the generic interfaces without changing domain modules.
