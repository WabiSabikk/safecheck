# SafeCheck — Task Tracker

## Phase 0: Select Idea
- [x] Дослідження 15 micro-SaaS ніш
- [x] Scoring та вибір Food Safety Checklist

## Phase 1: Research
- [x] Конкурентний аналіз (Jolt, FoodDocs, SafetyCulture, iAuditor)
- [x] FDA/HACCP вимоги
- [x] User voice (Reddit, restaurant forums)
- [x] Tech stack дослідження

## Phase 2: Planning
- [x] ARCHITECTURE.md — повна архітектура
- [x] Database schema (10 таблиць, RLS, triggers)
- [x] API routes design
- [x] UI/UX flow

## Phase 3: Development
- [x] Scaffold Next.js 16 + Tailwind + shadcn/ui
- [x] Base layout (Sidebar, Header, MobileNav)
- [x] Database migrations (001-006)
- [x] Auth (login, register, PIN login)
- [x] Dashboard (stats, quick actions, today's checklists)
- [x] Checklists (list, detail, respond, submit)
- [x] Temperature logging (new, history, trend charts)
- [x] Landing page + PWA manifest
- [x] Settings (restaurant, team, equipment)
- [x] Supabase project created (bpbgdnighhdubueysvmw)
- [x] All migrations deployed (001-010)
- [x] Fix: handle_new_user trigger removed (profile created in register API)
- [x] Fix: RLS circular dependency (006_fix_rls_circular_dependency.sql)
- [x] GitHub repo created (WabiSabikk/safecheck, private)
- [x] Full flow tested: register → dashboard → checklist → temp log
- [x] Photo capture component (camera + upload, max 5MB)
- [x] Corrective actions CAPA workflow (create, assign, track)
- [x] Reports page (weekly summary, PDF export stub, Recharts)
- [x] Temperature trends API with FDA compliance zones
- [x] Receiving log (deliveries, temp check, accept/reject)
- [x] Certification tracking (ServSafe, CFP, expiry alerts)
- [x] Checklist templates management (create, duplicate, delete)
- [x] Checklist scheduling (daily/weekly/monthly auto-create)
- [x] Data retention function (auto-cleanup old records)
- [x] Storage bucket "photos" created with RLS policies

## Phase 3.5: Feature Parity (БЛОКЕРИ перед Phase 4)

Дослідження (`FOOD_SAFETY_APP_RESEARCH.md`) визначило ці фічі як MUST/SHOULD HAVE.
Конкуренти їх мають. Без них продукт не viable — "дешевше" це не value proposition.

### MUST HAVE (БЛОКЕРИ) — ВИКОНАНО
- [x] **Offline mode** — Service Worker (sw.js) + IndexedDB, OfflineBanner, auto-sync on reconnect
- [x] **Auto-alerts** — email via Resend коли temp out of range, автоматично при POST /api/temperature-logs
- [x] **Auto-reminders** — API /api/alerts/checklist-reminder (cron-compatible), email менеджерам
- [x] **Food labeling** — /labels page, create + print labels, FDA Big 9 allergens, save as templates

### SHOULD HAVE — ВИКОНАНО
- [x] **Allergen tracking** — /allergens page, FDA FSMA compliant, cross-contact risk, search by allergen
- [x] **Spanish language** — i18n (EN/ES), 200+ strings, language toggle in header
- [x] **Email digest** — /api/alerts/weekly-digest, weekly compliance summary via Resend
- [x] **Multi-location** — location switcher in header, per-location data, saved preference

### Feature Parity Matrix

| Фіча | Jolt | FoodDocs | SafetyCulture | SafeCheck | Статус |
|-------|:---:|:---:|:---:|:---:|--------|
| Чеклісти | + | + | + | + | OK |
| Temp logging | + | + | + | + | OK |
| Corrective actions | + | + | + | + | OK |
| Photo evidence | - | - | + | + | OK |
| Receiving log | - | - | - | + | ПЕРЕВАГА |
| Cert tracking | - | - | - | + | ПЕРЕВАГА |
| Reports/PDF | + | + | + | + | OK |
| **Offline mode** | - | - | **+** | **+** | **OK** |
| **Auto-alerts** | **+** | **+** | **+** | **+** | **OK** |
| **Auto-reminders** | **+** | **+** | **+** | **+** | **OK** |
| **Food labeling** | **+** | - | - | **+** | **OK** |
| **Allergen tracking** | - | **+** | - | **+** | **OK** |
| **Spanish i18n** | + | - | + | **+** | **OK** |
| Bluetooth sensors | + | + | + | - | НЕ ПОТРІБНО (Jolt провалився) |
| AI HACCP builder | - | + | + | - | НЕ ПОТРІБНО (enterprise) |
| Employee scheduling | + | - | - | - | НЕ ПОТРІБНО (окремий продукт) |

---

## Phase 4: Security Testing
- [x] OWASP Top 10 review — XSS в email шаблонах (escapeHtml), path traversal (photo upload), string interpolation в queries
- [x] Input validation audit — Zod schemas для всіх 24 API endpoints (receiving, labels, allergens, certs, equipment, checklist templates)
- [x] RLS policy verification — migration 014: fix circular dependency (get_user_org_id() замість subquery)
- [x] Auth flow security — PIN brute-force lockout (5 attempts → 15min lock), rate limiting на auth
- [x] API rate limiting — in-memory rate limiter (auth: 5/min, pin: 5/5min, api: 60/min, upload: 10/min)
- [x] Environment variables check — .env.example повний, service role key з throw Error замість fallback, .gitignore covers .env*
- [x] Security headers — X-Frame-Options DENY, X-Content-Type-Options nosniff, CSP via Permissions-Policy, API no-cache
- [x] pin_hash прибрано з team API response

### Знайдені та виправлені проблеми (14 issues)

| # | Рівень | Проблема | Виправлення |
|---|--------|----------|-------------|
| 1 | CRITICAL | XSS в email HTML templates | escapeHtml() utility, всі user data екрановані |
| 2 | CRITICAL | PIN login без lockout | 5 attempts → 15min lock + rate limit 5/5min |
| 3 | HIGH | Відсутня валідація 5+ endpoints | Zod schemas для receiving, labels, allergens, certs, equipment, templates |
| 4 | HIGH | Service role key fallback на anon | throw Error якщо не встановлений |
| 5 | HIGH | String interpolation в queries | Замінено на окремі параметризовані запити |
| 6 | HIGH | Photo upload path traversal | Whitelist entity types, extension з MIME type |
| 7 | HIGH | Team API повертає pin_hash | Прибрано з SELECT |
| 8 | MEDIUM | RLS circular dependency (нові таблиці) | Migration 014: get_user_org_id() |
| 9 | MEDIUM | No rate limiting | In-memory rate limiter з preset configs |
| 10 | MEDIUM | Weekly digest без org filter | RLS захищає (cron потребує user session) |
| 11 | LOW | .env.example неповний | Додано SERVICE_ROLE_KEY, CRON_SECRET, VAPID |
| 12 | LOW | No security headers | next.config.ts з 5 security headers + API no-cache |
| 13 | LOW | Weak password policy | Прийнятно для MVP (6 chars min) |
| 14 | LOW | UUID validation | isValidUuid() перевірка в DELETE/PATCH endpoints |

## Phase 4.5: Production Readiness
- [x] **PWA icons** — SVG icon + 3 PNG sizes (72, 192, 512), manifest.json updated
- [x] **Vercel config** — vercel.json with cron jobs (checklist-reminder hourly, weekly-digest Mon 13:00 UTC)
- [x] **Cron GET handlers** — Vercel Cron sends GET, added `export { POST as GET }` to both alert endpoints
- [x] **Email sender fix** — configurable sender (default onboarding@resend.dev), centralized in lib/email/config.ts
- [x] **Test infrastructure** — vitest + 50 unit tests (sanitize, rate-limit, validations, temperature logic)
- [x] **PDF cleanup** — removed unused @react-pdf/renderer (PDF works via browser print dialog)
- [x] **Deploy to Vercel** — deployed at https://safecheck-sigma.vercel.app
- [x] **Resend API key** — configured and working
- [ ] Offline mode verification — test with Playwright in real browser

**Pending migrations:** 014 (RLS fix) + 015 (Stripe + admin) потрібно деплоїти через Supabase Dashboard SQL Editor

## Phase 5: Onboarding & Help
- [x] Onboarding wizard (3-step: create restaurant → add staff → first checklist)
- [x] Food Safety Guide (/help) — searchable knowledge base
- [x] Interactive documentation

## Phase 6: Payments & Admin Dashboard ← **CURRENT**
- [x] **Stripe integration** — stripe v20, checkout sessions, customer portal, webhook handler
- [x] **Billing page** — /settings/billing with current plan, upgrade/downgrade, manage subscription
- [x] **Pricing on landing** — PricingCards component (Free/Starter $19/Professional $39)
- [x] **Admin dashboard** — /admin with platform metrics (Recharts), users, organizations, payments, system health
- [x] **Admin auth** — admin_users table + JWT custom claims + middleware protection
- [x] **Tier enforcement** — TIER_LIMITS config, canAccessFeature(), UpgradePrompt component
- [x] **PDF export gating** — free tier shows upgrade prompt instead of PDF download
- [x] **Build verification** — `npm run build` passes (59 pages, 0 errors)

### New Files Created (Phase 6)

| Category | Files |
|----------|-------|
| Stripe | `lib/stripe/index.ts`, `lib/stripe/config.ts`, `lib/stripe/tier-check.ts`, `lib/validations/stripe.ts` |
| Stripe API | `api/stripe/checkout/route.ts`, `api/stripe/portal/route.ts`, `api/webhooks/stripe/route.ts` |
| Admin API | `api/admin/stats/route.ts`, `api/admin/users/route.ts`, `api/admin/organizations/route.ts`, `api/admin/payments/route.ts`, `api/admin/system/route.ts` |
| Admin UI | `(admin)/layout.tsx`, `admin/page.tsx`, `admin/users/page.tsx`, `admin/organizations/page.tsx`, `admin/payments/page.tsx`, `admin/system/page.tsx` |
| Admin Components | `admin/admin-sidebar.tsx`, `admin/admin-header.tsx` |
| Billing Components | `billing/pricing-cards.tsx`, `billing/upgrade-prompt.tsx` |
| Billing Page | `settings/billing/page.tsx` |
| Shared | `lib/supabase/admin.ts`, `lib/admin/check-admin.ts`, `types/admin.ts` |
| Migration | `supabase/migrations/015_stripe_and_admin.sql` |

### Modified Files (Phase 6)

| File | Change |
|------|--------|
| `package.json` | +stripe dependency |
| `.env.example` | +Stripe env vars |
| `types/database.ts` | +stripe_subscription_status, stripe_current_period_end |
| `lib/supabase/middleware.ts` | +admin route protection |
| `lib/hooks/use-auth.ts` | +isAdmin boolean |
| `components/layout/sidebar.tsx` | +Billing link in settings |
| `components/layout/header.tsx` | +Admin Panel link for admins |
| `app/page.tsx` | +PricingCards section on landing |
| `app/(dashboard)/reports/page.tsx` | +tier check, UpgradePrompt for free users |

## Phase 7: Promotion Setup
- [ ] Content strategy (blog posts, social media)
- [ ] SEO optimization (landing page meta, sitemap)
- [ ] Product Hunt preparation
- [ ] Reddit/community outreach plan
- [ ] Email sequence (Resend integration)

## Phase 8: Metrics & Monitoring
- [ ] Custom domain setup
- [ ] Umami/Plausible analytics
- [ ] Error monitoring (Sentry)
- [ ] Performance baseline

## Phase 9: GO/PIVOT/KILL Decision
- [ ] 2 weeks of data collection
- [ ] Metrics review (signups, activation, retention)
- [ ] Decision: GO / PIVOT / KILL

---

## Pending User Actions

1. **Deploy migrations 014 + 015** to Supabase Dashboard SQL Editor
2. **Seed admin user:** `INSERT INTO admin_users (user_id, email) VALUES ('<YOUR_UUID>', 'wabisabik1364@gmail.com');`
3. **Add Stripe env vars** to Vercel + .env.local:
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
   - `STRIPE_PRICE_STARTER_MONTHLY=price_...`
   - `STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...`
4. **Configure Stripe** — create products + prices in Stripe Dashboard (test mode)
5. **Set up Stripe webhook** — endpoint: `https://safecheck-sigma.vercel.app/api/webhooks/stripe`

## Known Issues
- HTML nesting warning (p inside p in checklist) — cosmetic
- Migration 014 (RLS fix) — потрібно деплоїти
- Migration 015 (Stripe + admin) — потрібно деплоїти
- Stripe не працює поки не додані env vars та не створені products в Stripe Dashboard
- Free tier працює повністю без Stripe (graceful fallback)

## Test Accounts
- demo@safecheck-test.com / demo123456 (Demo Owner, Demo Grill)
- test@safecheck-demo.com / test123456 (Maria Garcia, Marias Kitchen)

## Supabase
- Project ID: bpbgdnighhdubueysvmw
- Region: us-east-1
- 13+ tables, 25+ RLS policies, 2 seed templates
- Storage: "photos" bucket (5MB limit, jpeg/png/webp)
- Migrations: 001-013 deployed, 014-015 pending

## Production
- URL: https://safecheck-sigma.vercel.app
- Vercel scope: wabisabiks-projects
- 59 pages (static + dynamic)
- 40+ API routes
