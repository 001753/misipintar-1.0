---
name: Pricing Section Visibility Architecture
description: How landing page pricing section is controlled from the backend
---

## Rule
Landing page pricing is controlled by two JSON fields (no migration needed):
- `AppConfig.data.showPricingSection` (boolean, default: true) — hides/shows entire section
- `Plan.limits.showOnLanding` (boolean, default: true if not set) — hides/shows individual plan card

## How It Works
- `page.tsx` (server component) fetches plans + appConfig on every request (`force-dynamic`)
- Filters: `isActive: true` + `limits.showOnLanding !== false`
- Passes `PricingData` to `LandingPage` → `PricingBanner` as props
- Admin changes call `revalidatePath('/')` → Next.js invalidates cached landing page immediately
- `phaseMode = FULL_FREE` → green gradient "GRATIS" banner (PricingBanner/FullFreeBanner)
- `phaseMode = FREEMIUM|PAID_ONLY` → pricing cards with monthly/yearly toggle (PricingCards)

## Admin Actions (admin.ts)
- `updateShowPricingSection(show)` — writes to AppConfig.data.showPricingSection
- `togglePlanShowOnLanding(planId, show)` — writes to Plan.limits.showOnLanding
- All plan mutation actions now call `revalidatePath('/')` for immediate landing page update

**Why:** Avoids new DB migration (uses existing JSON fields), follows existing architecture pattern.
**How to apply:** When admin toggles section/plan visibility, landing page reflects change immediately on next request.
