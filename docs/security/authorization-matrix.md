# Authorization Matrix and Security Test Plan

This document is the release-gate baseline for organization boundaries. It is intentionally explicit about what must be tested before an enterprise-readiness claim is made.

## Actors

| Actor                    | Expected access                                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Anonymous                | No private application data, organization metadata, artifacts, or privileged functions                                                        |
| Authenticated non-member | Own profile/session operations only; no organization data until membership is established                                                     |
| Viewer/member            | Read only the active organization’s permitted data; no cross-tenant reads or writes                                                           |
| Manager                  | Viewer permissions plus approved workflow management within the active organization                                                           |
| Admin/owner              | Organization administration, membership changes, policy configuration, and approved exports within the active organization                    |
| Service role             | Server-only maintenance and trusted operations; never reachable from client bundles and never used without explicit organization/user context |

## Required test cases

Every tenant-scoped table and storage object must have automated database-level tests covering:

1. A member can read permitted rows from their own organization.
2. A member cannot read, infer, update, delete, or export another organization’s rows.
3. A client-supplied organization ID cannot override the authenticated membership context.
4. Null organization IDs are rejected for active tenant-scoped records or handled by an explicit, tested legacy migration path.
5. Legacy records cannot become visible across tenants after migration.
6. Membership removal immediately revokes access.
7. Role changes take effect without stale authorization decisions.
8. Admin-only writes reject viewers and non-members.
9. Service-role functions enforce explicit user and organization context and cannot be imported into client bundles.
10. Storage paths are bound to organization and user identity.
11. Audit records are append-only or protected against undetected mutation.
12. Prompt/tool inputs cannot request tables, columns, rows, or actions outside the authorization scope.

The current `npm run test:security` check statically verifies that every migration-declared RLS-enabled table has at least one policy declaration. The `enterprise-security.test.ts` suite exercises null/legacy tenant rejection, cross-tenant denial, role changes, membership removal, service-role context requirements, and audit-manifest tamper detection. These are application contracts; they are not a substitute for disposable-database integration tests. Those database tests remain mandatory before the enterprise release gate is passed.

## Review ownership

Changes to RLS policies, security-definer functions, service-role clients, organization membership logic, AI tools, or audit records require review by the repository owner and a security-capable reviewer. The owner map is maintained in `.github/CODEOWNERS`.
