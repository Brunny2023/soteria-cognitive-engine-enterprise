# Authorization & Tenant-Isolation Validation

**Audit target:** `Brunny2023/soteria-cognitive-engine-enterprise`

**Audit date:** 2026-10-07

## Executive Result

**PASS WITH FINDINGS — remediation is staged locally; connected Supabase application was blocked by management-channel timeouts and must be re-verified before release.**

Authentication has been implemented and previously demonstrated to work for account creation, sign-in, session persistence, onboarding redirect, profile provisioning, and role provisioning. This audit found authorization and isolation defects in the pre-remediation implementation. Narrow corrective changes were made in the audit clone, but they are not represented as applied production changes in this report until the connected Supabase migration and hosted application deployment are confirmed.

## Scope

The review covered:

- Supabase Auth client and server middleware;
- authenticated route protection and direct-route behavior;
- platform role storage and administrator boundaries;
- organization membership, ownership, and tenant checks;
- Supabase RLS migrations and policy semantics;
- insert/update/delete ownership checks;
- onboarding state handling;
- service-role usage and client-bundle boundaries;
- session listeners, refresh behavior, and logout implementation;
- the previously requested super-admin policy for `manifoldgraceltd@gmail.com`.

This was not a penetration test, certification audit, or complete production black-box assessment. No destructive cross-user test data was created.

## Git Baseline

| Item | Result |
|---|---|
| Branch | `main` |
| Baseline HEAD audited | `761970c707a65aa991530d324bf91544c37ebedc` |
| Baseline working tree | Clean at the start of the audit clone |
| Audit clone | `/home/ubuntu/repo-evaluation/sale-readiness/audit-clone` |
| Local changes | Authorization middleware/UI changes and an RLS hardening migration are staged in the audit clone; not yet published |

## Authentication

| Control | Result | Evidence / limitation |
|---|---|---|
| Account creation | **Demonstrated previously** | Supabase `signUp` path in `src/routes/auth.tsx`; prior live user flow succeeded |
| Email/password sign-in | **Demonstrated previously** | `signInWithPassword` path; prior live sign-in succeeded |
| Profile provisioning | **Demonstrated previously** | `handle_new_user` trigger creates `public.profiles` |
| Default role provisioning | **Implemented** | Current trigger provisions `operator`; historical first-user-admin behavior was replaced by migration `20260929224630_enforce_super_admin_platform_roles.sql` |
| Immediate email confirmation | **Not proven in this audit** | Current project settings previously reported `mailer_autoconfirm=false` |
| Session restoration | **Source-supported; live retest blocked** | `useAuth` subscribes to `onAuthStateChange` and calls `getSession`; browser lifecycle retest was not repeated after the sandbox reset |
| Logout | **Not independently re-demonstrated** | Auth client integration must be tested with a real session |
| Unauthenticated protected route | **Source-supported** | `src/routes/_authenticated/route.tsx` calls `supabase.auth.getUser()` and redirects to `/auth` |

Authentication is not authorization. The authenticated route layout only establishes identity; it does not establish platform-admin permission.

## Authorization Model

The application combines:

1. Supabase Auth identity (`auth.uid()` / bearer-token claims);
2. `public.user_roles` for platform roles (`admin`, `operator`, `viewer`);
3. `public.super_admins` for the designated super-admin control plane;
4. `public.organization_members` for tenant roles (`owner`, `admin`, `member`, `viewer`);
5. ownership columns such as `owner_id`, `uploader_id`, and `author_id`;
6. Supabase RLS policies;
7. frontend role profiles and navigation metadata.

The frontend is not an authoritative authorization layer. A backend/database check is required for each privileged operation.

## Administrator Boundary

### Baseline finding

The baseline `/admin` route was nested under the authenticated layout but had no platform-role check. Any authenticated user who knew `/admin` could render the administrator page. More importantly, `pingLayerFn` used only `requireSupabaseAuth`, so any authenticated user could call the underlying AI-gateway validation action directly, bypassing the UI.

### Corrective change staged locally

- Added `requirePlatformAdmin` server middleware that checks the RLS-protected `user_roles` table for the caller's `admin` role.
- Applied that middleware to `pingLayerFn`.
- Added a frontend redirect for non-admin users who navigate directly to `/admin`.

These changes are in the audit clone and are not yet published because the audit clone was rehydrated after a sandbox reset and the connected Supabase management channel timed out during migration application.

### Super-admin role boundary

The previously published migration establishes:

- `manifoldgraceltd@gmail.com` as the sole current super admin;
- new users as `operator`, not `admin`;
- database trigger protection against non-super-admin admin assignment;
- protection against demoting/removing the designated super admin.

The live database record was previously verified as `admin=true` and `is_super_admin=true`. A fresh live policy query was blocked by the current Supabase connection timeout.

## RLS Audit

The following results are from the repository migrations at the audited baseline and should be treated as actual policy semantics, not intended behavior.

| Table / operation | Baseline policy behavior | Assessment | Corrective status |
|---|---|---|---|
| `profiles` SELECT | `USING (true)` for all authenticated users | Cross-user profile disclosure | Hardening migration staged locally |
| `user_roles` SELECT | Own role only, later expanded for super admin | **Pass for ordinary-user role read** | Previously applied super-admin policy retained |
| `secp_requests` SELECT | `USING (true)` | Cross-user / cross-tenant request disclosure | Hardening migration staged locally |
| `secp_requests` INSERT | `owner_id = auth.uid()` | **Pass for ownership on insert** | No change required |
| `secp_requests` UPDATE | Owner or platform admin; `WITH CHECK` retains owner/admin condition | **Mostly enforced**, but tenant read baseline was broad | Read hardening staged locally |
| `secp_archetypes` SELECT | `USING (true)` | Cross-user / cross-tenant disclosure | Hardening migration staged locally |
| `knowledge_sources` SELECT | `USING (true)` | Cross-user / cross-tenant disclosure | Hardening migration staged locally |
| `knowledge_sources` INSERT | `uploader_id = auth.uid()` | **Pass for uploader ownership** | No change required |
| `learning_entries` SELECT | `USING (true)` | Cross-user / cross-tenant disclosure | Hardening migration staged locally |
| `learning_entries` INSERT | `author_id = auth.uid()` | **Pass for author ownership** | No change required |
| `retention_audit_entries` SELECT | `USING (true)` | Audit ledger disclosure | Hardening migration staged locally |
| `retention_audit_entries` INSERT | Only `auth.uid() IS NOT NULL`; caller can submit another `actor_id` | Audit attribution forgery | Hardening migration staged locally |
| `secp_pack_state` INSERT/UPDATE | Historical `true` policies were replaced with admin/operator role checks | Role check exists, but `updated_by` was not constrained | Hardening migration adds actor constraint |
| `organization_members` INSERT | Allows self-viewer, owner/admin, or first member | Intended join/create paths, but owner/admin role assignment needs dedicated negative tests | Not proven with two live users |
| `organization_members` UPDATE | Owner/admin of organization | Tenant role mutation is database-protected, but owner promotion semantics need product decision | Not changed |
| Tenant-scoped records | Later policies use organization membership for several tables | **Mixed** because legacy broad SELECT policies remain on other tables | Hardening migration staged locally |

### Important insert/update result

The baseline correctly constrained many owner identifiers on INSERT, but broad SELECT policies still defeat tenant isolation for several tables. `retention_audit_entries` also allowed an authenticated caller to forge `actor_id`, which is a data-integrity defect even though the caller could not forge a valid Auth identity.

## Cross-User Isolation

**Status: BLOCKED / NOT PROVEN in this run.**

The audit did not create User A/User B production records or execute destructive mutations. The migration review demonstrates that the baseline broad SELECT policies would allow authenticated users to read rows from several tables outside their ownership or organization. This is a source-confirmed finding, not a claim that a live exploit was executed.

Required follow-up after the migration is applied:

1. create two ordinary test users in an isolated test project or disposable tenant;
2. create User A-owned records;
3. query, update, delete, and spoof ownership as User B through PostgREST and application server functions;
4. record HTTP status and row counts;
5. delete test users and records.

## Role-Escalation Test

**Result: PARTIAL PASS.**

The previously applied super-admin migrations provide database trigger and RLS protections around `user_roles`:

- ordinary users can read their own role only;
- ordinary users cannot insert/update/delete role rows through the RLS policies;
- the database trigger rejects non-super-admin attempts to assign `admin`;
- new-user provisioning assigns `operator`.

The local source audit also found that the original frontend admin page was not itself an authorization boundary. That is corrected locally with a UI gate and, more importantly, a server-side gate on the administrator gateway action.

A live ordinary-user direct-request test remains unproven because no isolated second account was created for this audit.

## Service-Role Exposure

The service-role client is defined in `src/integrations/supabase/client.server.ts` and reads `SUPABASE_SERVICE_ROLE_KEY` only from server environment variables. No service-role key literal was found in the source tree.

The only reviewed dynamic service-role use is the invite-code lookup in `src/lib/org.functions.ts`. It is executed inside a server function handler and returns only the matched organization id/name before the caller is enrolled through the caller-authenticated client. This is a defense-in-depth-sensitive path and should remain server-only.

**Finding:** no demonstrated credential exposure to the browser in source inspection; final client-bundle verification and deployed runtime inspection remain recommended.

## Protected Route Audit

| Route / action | Unauthenticated | Ordinary authenticated user | Platform admin |
|---|---|---|---|
| Authenticated route group | Redirect to `/auth` | Allowed into group | Allowed into group |
| `/admin` baseline | Redirect to `/auth` | Baseline rendered admin UI if URL known | Rendered admin UI |
| `pingLayerFn` baseline | Middleware rejects | Baseline accepted any authenticated bearer | Accepted |
| `pingLayerFn` after local fix | Middleware rejects | Server middleware rejects | Accepted |
| Data queries | Auth middleware / RLS | Subject to table policy; several baseline tables were over-broad | Admin role may see intended platform scope |

## Onboarding Boundary

Onboarding reads `user_roles` from Supabase and derives the primary role from the database. The completion marker is stored in browser `localStorage` under a user-specific key. It controls routing convenience, not the database role and not the authenticated route-group check.

**Assessment:** local onboarding completion is not a privilege boundary. It can be changed by the user in their own browser, but it does not grant `admin`; the role is still read from `user_roles`. The main limitation is that onboarding completion is not server-verifiable or cross-device durable.

## Session Lifecycle

Source evidence supports session restoration through `getSession` and `onAuthStateChange`. The authenticated route uses `getUser()` before rendering protected routes. Full refresh, logout/back-button, expiration, and account-switching tests were not repeated after the sandbox reset and are therefore unproven in this audit.

## Findings

| Severity | Finding | Evidence | Impact | Remediation |
|---|---|---|---|---|
| HIGH | Administrator route and gateway action were authentication-only | `src/routes/_authenticated/admin.tsx`; `src/lib/gateway.functions.ts` | Any authenticated user could reach admin UI and invoke gateway validation | Local `requirePlatformAdmin` middleware and UI redirect; deploy and retest |
| HIGH | Legacy RLS policies exposed request, archetype, knowledge, learning, profile, and audit rows to all authenticated users | Migration policy definitions with `USING (true)` | Cross-user and cross-tenant disclosure | Local hardening migration; apply to connected project and execute User A/B tests |
| HIGH | Retention audit actor attribution was caller-controlled | `ra_insert_authed` checked only that a user was authenticated | Audit records could be forged as another actor | Local `actor_id = auth.uid()` policy; apply and retest |
| MEDIUM | Organization role mutation semantics allow an owner/admin to submit `owner` for a member | `setMemberRoleFn` accepts all tenant roles; policy checks caller authority but not target role transition | Possible overbroad tenant governance depending on intended policy | Define whether only owners may grant/revoke owner; add explicit transition policy and tests |
| MEDIUM | Onboarding completion is browser-local | `localStorage` in `src/lib/onboarding.ts` | Cross-device state is inconsistent; not a privilege escalation | Store completion server-side only if durable onboarding state is required |
| LOW | Admin dashboard contains representative/static enterprise metrics | `src/routes/_authenticated/admin.tsx` | Users may mistake demo values for telemetry | Label as demonstration data or connect to live sources |
| INFORMATIONAL | Full live lifecycle and User A/B tests were not completed | Connected management channel timed out; no disposable test tenant | Evidence gap, not a demonstrated exploit | Repeat in isolated test project after migration deployment |

## Database Application Status

The audit clone contains `supabase/migrations/20261007175800_harden_authorization_tenant_isolation.sql`. An attempt to apply the migration to the connected Supabase project failed during migration-history initialization with a connection timeout. Therefore:

- do **not** treat the live project as remediated;
- do **not** claim the new RLS policies are active in production;
- apply the migration through the connected Supabase channel or Supabase CLI with an authorized management credential;
- re-run the live policy inventory afterward.

## Security Conclusion

### Proven

- Supabase Auth identity is used by the client and server middleware.
- Protected route-group navigation checks authenticated identity.
- The previously implemented super-admin migration provisions new users as operators and protects platform-admin role assignment at the database layer.
- The source baseline contains multiple broad RLS policies that are insufficient for defensible tenant isolation.
- The baseline administrator gateway action lacked a server-side platform-admin check.
- Narrow corrective code and SQL changes have been prepared in the audit clone.

### Unproven

- Live User A/User B cross-tenant isolation after remediation.
- Live ordinary-user direct invocation of the administrator action after deployment.
- Logout invalidation, expiration handling, and account switching in a fresh browser session.
- Final client-bundle absence of service-role code in the deployed artifact.

### Required fixes before claiming authorization readiness

1. Apply `20261007175800_harden_authorization_tenant_isolation.sql` to the connected project.
2. Publish the local server/UI authorization changes.
3. Run the complete release gate and hosted CI.
4. Run isolated two-user direct PostgREST and application-function tests.
5. Re-audit organization owner/admin role transitions.
6. Repeat logout, refresh, expiration, and account-switching tests.

## Final Decision

- **AUTHENTICATION:** PASS WITH FINDINGS
- **AUTHORIZATION:** PASS WITH FINDINGS
- **TENANT ISOLATION:** FAIL at baseline; remediation pending application and live test
- **ROLE ESCALATION RESISTANCE:** PARTIAL
- **SESSION LIFECYCLE:** PASS WITH FINDINGS / live lifecycle retest pending
- **OVERALL STATUS:** PASS WITH FINDINGS — **not release-ready for a security claim until the database migration, deployment, and live isolation tests are completed**

**Recommended next validation step:** restore a responsive Supabase management connection, apply the staged RLS migration, deploy the staged server-side admin guard, and execute the isolated User A/User B test matrix without using production customer data.
