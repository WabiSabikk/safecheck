# SafeCheck Security Audit Report

**Date:** 2026-02-19
**Auditors:** security-guidance, audit, data-privacy-engineer, api-tester plugins
**Scope:** Full codebase + API routes + data privacy
**Framework:** OWASP Top 10 2021

---

## Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 2 | Must fix before promotion |
| HIGH | 8 | Fix within 1 week |
| MEDIUM | 10 | Fix within 2 weeks |
| LOW | 7 | Backlog |

---

## CRITICAL

### C1. PIN Login Does Not Establish Authentication Session
**OWASP:** A07 - Identification and Authentication Failures
**File:** `src/app/api/auth/login-pin/route.ts`

PIN login returns `{ success: true, user: { id, displayName } }` but does NOT create a Supabase session token. Staff users cannot access protected routes after PIN login. Additionally, on failed PIN, ALL non-locked staff profiles get `pin_attempts` incremented — 5 failures lock ALL staff (DoS vector).

**Fix:**
- Use `supabaseAdmin.auth.admin.generateLink()` or custom JWT for session
- Track failed attempts per-profile, not globally
- Use `locationId` from pinLoginSchema (currently validated but unused)

### C2. `pin_hash` Exposed to Client via `select('*')`
**OWASP:** A01 - Broken Access Control
**File:** `src/app/(dashboard)/settings/team/page.tsx:38`

Team page fetches `select('*')` from `profiles` table, exposing bcrypt PIN hash to browser. 4-digit PIN = only 10,000 combinations, brute-forceable offline.

Same `select('*')` pattern in:
- `src/lib/hooks/use-auth.ts` (lines 22, 39)
- `src/lib/hooks/use-location.ts` (line 17)

**Fix:** Replace `select('*')` with explicit column lists everywhere.

---

## HIGH

### H1. SQL Filter Injection in Admin Search
**OWASP:** A03 - Injection
**File:** `src/app/api/admin/users/route.ts:23`
```typescript
query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
```
`search` param interpolated into PostgREST filter string. Attacker can manipulate filter logic.

**Fix:** Sanitize search or use separate `.ilike()` calls.

### H2. Missing Content-Security-Policy (CSP) Header
**OWASP:** A05 - Security Misconfiguration
**File:** `next.config.ts`

No CSP header = no XSS protection. Primary defense against script injection.

**Fix:** Add CSP:
```
default-src 'self'; script-src 'self' 'unsafe-inline' js.stripe.com; connect-src 'self' *.supabase.co api.stripe.com; frame-src js.stripe.com;
```

### H3. Missing HSTS Header
**OWASP:** A05 - Security Misconfiguration
**File:** `next.config.ts`

No `Strict-Transport-Security` header. SSL stripping possible.

**Fix:** Add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

### H4. Cron Endpoints Architecture Issues
**OWASP:** A01 - Broken Access Control
**Files:** `src/app/api/alerts/checklist-reminder/route.ts`, `weekly-digest/route.ts`

- CRON_SECRET not set in .env.local
- Uses `createClient()` (user-scoped) instead of `supabaseAdmin` for cross-org operations
- RLS blocks all data when no user session
- `export { POST as GET }` bypasses CSRF

**Fix:** Use `supabaseAdmin` for cron, set CRON_SECRET in Vercel, add to middleware public routes.

### H5. Password Policy Too Weak (6 chars min)
**OWASP:** A07 - Identification and Authentication Failures
**File:** `src/lib/validations/auth.ts:5`

6 characters, no complexity. NIST recommends 8+ characters.

**Fix:** Increase to 8 chars minimum.

### H6. Supabase Error Messages Exposed (22 instances)
**OWASP:** A04 - Insecure Design
**Files:** 20+ API routes

`return NextResponse.json({ error: error.message }, { status: 500 })` — reveals table/column names.

**Fix:** Return generic errors, log details server-side.

### H7. No Data Export / Account Deletion (GDPR/CCPA)
**OWASP:** Privacy compliance
**Impact:** No "Download My Data" or "Delete Account" features.

**Fix:** Implement data export (JSON/CSV) and account deletion with Stripe cleanup.

### H8. Data Retention Not Enforced
**OWASP:** Privacy compliance
**File:** `supabase/migrations/010_data_retention.sql`

Cleanup function exists but pg_cron schedule is commented out. Tier-based limits (free=7d, starter=60d, pro=365d) defined in config but never enforced.

**Fix:** Activate pg_cron, make cleanup tier-aware.

---

## MEDIUM

### M1. In-Memory Rate Limiter Useless in Serverless
**File:** `src/lib/utils/rate-limit.ts`
In-memory Map doesn't persist across Vercel function instances. Rate limiting is effectively disabled.

**Fix:** Use Vercel KV / Upstash Redis.

### M2. No CSRF Protection
State-changing POST/PATCH/DELETE routes have no Origin/Referer verification or CSRF tokens. SameSite=Lax allows form submissions from other domains.

**Fix:** Add Origin header verification in middleware.

### M3. Missing Input Validation on Several Routes
- `src/app/api/checklists/[id]/respond/route.ts` — no Zod schema, `note` unvalidated
- `src/app/api/checklists/[id]/route.ts` — UUID not validated
- `src/app/api/corrective-actions/route.ts:53` — `locationId` unvalidated
- `src/app/api/temperature-logs/trends/route.ts` — `days` param unbounded
- `src/app/api/reports/pdf/route.ts` — date params not validated

**Fix:** Add Zod schemas, UUID validation, parameter bounds.

### M4. Certification DELETE Missing Role Check
**File:** `src/app/api/certifications/route.ts`
POST requires owner/manager but DELETE has no role check.

**Fix:** Add role check to DELETE.

### M5. Stripe IDs Exposed in Admin Frontend
**File:** `src/app/api/admin/organizations/route.ts`, `admin/payments/route.ts`
Customer/subscription IDs sent to browser.

**Fix:** Obfuscate or show on-demand only.

### M6. Offline IndexedDB Stores Unencrypted Data
**File:** `src/lib/offline/db.ts`
Pending actions stored in cleartext IndexedDB. Shared kitchen tablets = risk.

**Fix:** Clear after sync, add data expiry.

### M7. No Admin Action Audit Logging
Admin bypasses RLS with service_role_key but no audit trail of data access.

**Fix:** Log admin actions to a dedicated table.

### M8. User Enumeration via Registration
**File:** `src/app/api/auth/register/route.ts:51`
`authError.message` reveals "User already registered".

**Fix:** Return generic message.

### M9. No Email Unsubscribe Mechanism
Weekly digest has no one-click unsubscribe (CAN-SPAM / GDPR required).

**Fix:** Add unsubscribe link, check `notification_preferences` before sending.

### M10. Rate Limiting Missing on 24/32 Routes
Only 8 routes have rate limiting. All admin routes unprotected.

**Fix:** Add rate limiting to all routes (after fixing M1).

---

## LOW

### L1. X-XSS-Protection Header Deprecated
**File:** `next.config.ts:19` — Set to `0` instead. Rely on CSP.

### L2. Dev Dependency Vulnerabilities (16 in eslint)
Not exploitable in production. Run `npm audit fix`.

### L3. Location ID in localStorage
**File:** `src/lib/hooks/use-location.ts` — UUID only, low risk.

### L4. Cookie Security Implicit
Supabase SSR defaults are good but not explicitly verified.

### L5. Registration Returns Internal IDs
**File:** `src/app/api/auth/register/route.ts:137` — Return only `{ success: true }`.

### L6. Admin Stats Loads 1000 Users to Memory
**File:** `src/app/api/admin/stats/route.ts:21` — Paginate or use DB-level count.

### L7. Email Notifications Contain Business Data
Temp violations, weekly digests include operational data via Resend. Expected but document in privacy policy.

---

## Positive Security Findings

1. Stripe webhook signature verification properly implemented
2. Zod validation on most POST endpoints
3. UUID validation with `isValidUuid()` on DELETE operations
4. HTML escaping with `escapeHtml()` in email templates
5. Photo upload: MIME whitelist, 5MB limit, extension from MIME not filename
6. RLS enabled on ALL tables with org-scoped policies
7. Admin double-check: middleware JWT claim + API-level `checkAdmin()`
8. `.gitignore` properly excludes `.env*`
9. No analytics/tracking scripts
10. Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy

---

## Priority Remediation Roadmap

| # | Finding | Effort | Impact |
|---|---------|--------|--------|
| 1 | C2. Replace `select('*')` with explicit columns | 1h | Stops pin_hash leak |
| 2 | H2+H3. Add CSP + HSTS headers | 30min | Major XSS/SSL protection |
| 3 | H6+M8. Generic error messages | 2h | Stops info disclosure |
| 4 | H1. Sanitize admin search | 30min | Prevents filter injection |
| 5 | C1. Fix PIN login session + DoS | 3h | Fixes broken auth flow |
| 6 | H4. Fix cron with supabaseAdmin | 1h | Fixes broken cron jobs |
| 7 | H5. Password 8+ chars | 15min | Stronger passwords |
| 8 | M2. CSRF protection | 1h | Cross-site protection |
| 9 | M3. Input validation gaps | 2h | Prevents injection |
| 10 | M1. Distributed rate limiting | 2-3h | Production-grade limits |
| 11 | H7. Data export + account deletion | 4-6h | GDPR/CCPA compliance |
| 12 | H8. Activate data retention | 2h | Privacy compliance |
