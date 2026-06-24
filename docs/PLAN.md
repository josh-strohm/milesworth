# MilesWorth Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a privacy-first PWA that auto-logs business miles for self-employed workers (trades, real estate, consultants, 1099s) and generates IRS-ready reports at tax time.

**Architecture:** Offline-first PWA with Supabase for sync + auth + RLS, Stripe for billing, Vercel for hosting. Foreground GPS detection (no background tracking on iOS) plus excellent manual entry. Reports generated client-side as PDFs.

**Tech Stack:**
- Frontend: Vite + React 18 + TypeScript + Tailwind CSS + React Router
- Backend: Supabase (Postgres + Auth + RLS)
- Billing: Stripe Checkout + Customer Portal + webhooks
- Hosting: Vercel
- PWA: Vite PWA plugin (service worker, manifest, install prompt)
- PDF: jsPDF + html2canvas for client-side IRS-ready reports
- Geolocation: Browser Geolocation API directly (no library)
- Project location: `/home/ubuntu/.hermes/workspace/milesworth/`

**IRS 2026 standard mileage rate:** $0.725/mile (business). Stored in `src/config/irs-rate.ts` so it's a one-line annual update.

---

## Decisions table

| # | Decision | Choice | Why | Status |
|---|---|---|---|---|
| 1 | Name | MilesWorth (working) | Ties to IRS deduction value, ownable, matches the two-word descriptive naming pattern | REVIEW |
| 2 | Domain | milesworth.io or mileworth.io | Short, on-brand; `.com` likely taken | REVIEW |
| 3 | Auth | Supabase Auth (email + Google) | Free, works with RLS, no password management | CONFIRMED |
| 4 | Database | Supabase Postgres with RLS | Multi-device sync, real isolation between users | CONFIRMED |
| 5 | Billing | Stripe Checkout + Customer Portal | Self-serve, no support burden for cancel/update card | CONFIRMED |
| 6 | GPS strategy | Foreground only in V1 | iOS PWA background geolocation is unreliable; honest UX over magic that doesn't work | CONFIRMED |
| 7 | Map view | None in V1 | Text-based trip log is sufficient for IRS; saves dev time and API costs | CONFIRMED |
| 8 | Offline support | Full (service worker + IndexedDB queue) | Trades work in dead zones; this is a real differentiator | CONFIRMED |
| 9 | Pricing | $5/mo or $39/yr | Annual kills the Stripe fee problem ($0.45 vs $1.43 per customer) | CONFIRMED |
| 10 | Free tier | 5 trips/month forever | Lead magnet, no card required, manual entry only | CONFIRMED |
| 11 | Target launch | 3 weeks from kickoff | Realistic for solo founder with this stack | CONFIRMED |

---

## Product positioning

**For:** Self-employed workers in the US who drive for work and want to maximize their tax deduction without monthly anxiety. Trades (HVAC, plumbing, electrical, roofing, real estate), consultants, 1099 contractors, mobile services.

**Why $5/mo:** Below the "impulse buy" threshold. Less than a fast-food lunch. Pays for itself in 8 miles per month of correctly logged business drives.

**Why now:** The 2026 IRS rate is $0.725/mile. A tradesperson driving 100 business miles/week misses ~$3,770/year in deductions if they don't log properly. MilesWorth exists to capture that.

**Differentiation vs MileIQ / Everlance / Hurdlr:**
- Privacy-first: never see your trips in a human-readable way; bank linking forbidden by design
- Cheaper ($5 vs $5.99-$10)
- Simpler (no investment tracking, no tax filing integration, no upsell to financial advisor)
- Anti-hype copy: sounds like a real tool, not a SaaS landing page
- Trades-friendly: works offline, works on a $200 Android phone, no learning curve

---

## V1 scope (ruthlessly scoped)

### In (must ship)

- Email + Google auth via Supabase
- Manual trip entry: date, start/end address, miles, category (business/personal/medical/charity), purpose, vehicle
- One-tap "Start Trip" with GPS capture (foreground only)
- Trip review/edit/delete with bulk-classify
- Vehicle profiles (multiple vehicles, one default)
- IRS-ready PDF report (date range, totals by category, vehicle, IRS rate used)
- Quarterly estimated tax export (CSV with month, miles, deduction)
- YTD dashboard (total miles, total deduction at current IRS rate, monthly breakdown)
- Stripe subscription ($5/mo or $39/yr) with 7-day free trial
- Free tier enforcement: 5 trips/month cap for non-paying users
- Email receipt via Stripe
- Privacy policy + terms (single page each, plain language)
- Landing page + pricing page on milesworth.io

### Out (called out so we don't scope-creep)

- Background GPS / always-on tracking (iOS PWA limitation, defer to native app V2)
- Map view of trip routes
- Automatic address geocoding (manual entry is fine for V1)
- Multi-user / team features
- Receipt photo attachments
- Mileage split (personal/business at midpoint of a single drive)
- IFTTT / Zapier integrations
- Mobile native app (Capacitor wrapper for V2)
- Receipt OCR
- Tax form autofill
- Accountant export formats beyond PDF + CSV

### Anti-features (explicitly NOT building)

- AI "smart" categorization — just a dropdown
- Gamification / streaks — this is a tax tool, not a fitness app
- Social features — private by design
- Bank linking — privacy-first positioning requires NEVER doing this
- Push notifications beyond a weekly summary email
- Ads — subscription-only model
- Investment tracking, expense tracking, time tracking — stay focused on mileage

---

## Database schema

```sql
-- profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  business_name text,
  default_vehicle_id uuid,
  stripe_customer_id text unique,
  subscription_status text default 'none'
    check (subscription_status in ('none','trialing','active','past_due','canceled')),
  subscription_period_end timestamptz,
  created_at timestamptz default now()
);

-- vehicles
create table vehicles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  license_plate text,
  starting_odometer numeric,
  is_default boolean default false,
  archived boolean default false,
  created_at timestamptz default now()
);

-- trips
create table trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  vehicle_id uuid references vehicles(id) on delete restrict not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  start_address text,
  end_address text,
  start_lat numeric,
  start_lng numeric,
  end_lat numeric,
  end_lng numeric,
  distance_miles numeric not null default 0,
  category text not null default 'business'
    check (category in ('business','personal','medical','charity')),
  purpose text,
  notes text,
  auto_detected boolean default false,
  user_confirmed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_trips_user_date on trips(user_id, started_at desc);
create index idx_trips_user_category on trips(user_id, category);

-- RLS: users see only their own data
alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table trips enable row level security;

create policy "users see own profile" on profiles
  for all using (id = auth.uid());
create policy "users manage own vehicles" on vehicles
  for all using (user_id = auth.uid());
create policy "users manage own trips" on trips
  for all using (user_id = auth.uid());
```

Reports are computed on demand from `trips` — no stored aggregation table to keep in sync.

---

## UI flow

**5 screens, mobile-first:**

1. **Dashboard** (`/`) — YTD miles, YTD deduction at $0.725/mi, monthly chart, "Start Trip" big button, recent trips list
2. **Active Trip** (`/trip/active`) — Big start/stop button, live distance, current GPS readout, save button
3. **Trips** (`/trips`) — Filterable list (date range, category, vehicle), bulk-edit, edit/delete
4. **Reports** (`/reports`) — Date range picker, "Generate IRS PDF", "Quarterly Tax CSV", preview
5. **Settings** (`/settings`) — Profile, vehicles, billing portal link, sign out

**Onboarding:** Sign up → "Add your first vehicle" → "Log your first trip" → "Try a 7-day free trial" CTA. Three steps, no tutorial screens.

---

## Build phases (3 weeks)

### Week 1: Foundation + manual trip entry

| Day | Deliverable | Vibe-coded? |
|---|---|---|
| 1 | Project scaffold (Vite + React + TS + Tailwind + PWA plugin), Supabase project + tables + RLS policies, basic auth (email + Google), empty dashboard route | Scaffold with vibe; SQL + RLS manually |
| 2 | Add Vehicle screen, vehicles table CRUD, default vehicle logic | Vibe UI; RLS-tested manually |
| 3 | Add Trip screen (manual entry form): date, start/end addresses, miles, category, purpose, vehicle | Vibe the form |
| 4 | Trips list screen with filters, edit/delete, bulk select | Vibe the table |
| 5 | Dashboard with YTD totals (live from trips table) and monthly breakdown | Vibe |

**End of Week 1:** A working app where a signed-in user can add vehicles, log trips manually, see them on a dashboard. No GPS, no billing, no PDF yet.

### Week 2: GPS + reports + polish

| Day | Deliverable | Vibe-coded? |
|---|---|---|
| 6 | Foreground GPS capture: "Start Trip" button gets current location, "End Trip" gets destination, calculate distance via Haversine, save with auto_detected=true | Manual — math is important |
| 7 | Trip review screen (post-GPS) where user confirms/edits the detected trip | Vibe UI |
| 8 | IRS PDF report (jsPDF): header, date range, totals by category, IRS rate displayed, vehicle summary | Manual — IRS formatting matters |
| 9 | Quarterly tax CSV export: month, total miles, total deduction, business miles | Vibe |
| 10 | Onboarding flow (3 steps), empty states, error states, mobile responsiveness audit | Vibe |

**End of Week 2:** A working app with GPS, manual, PDF, CSV, onboarding. Still no billing.

### Week 3: Billing + launch

| Day | Deliverable | Vibe-coded? |
|---|---|---|
| 11 | Stripe products ($5/mo, $39/yr), Stripe Checkout integration, webhook handler for subscription state | Manual — money path |
| 12 | Free tier gate (5 trips/mo for non-paying), paywall modal, Customer Portal link | Vibe |
| 13 | Landing page (milesworth.io) with hero, "how it works", pricing, FAQ, footer. Privacy policy + terms pages. | Vibe — use dark-mode brand system |
| 14 | Beta: 5 friendly tradespeople + 5 from the existing network. Email them directly. | Manual outreach |
| 15 | Bug bash + onboarding polish based on beta feedback | Mixed |
| 16 | Product Hunt prep + Reddit post + LinkedIn announcement | Manual distribution |
| 17 | Public launch + daily Notion log of new signups, conversions, churn | Manual |

**End of Week 3:** Public launch. Goal: 10 paying users in month 1, 30 by month 3, 100 by month 6.

---

## Pricing & Stripe setup

```
Product: MilesWorth Pro
  - $5.00/month
  - $39.00/year (save 35%)

Free tier:
  - 5 trips/month forever
  - No card required
  - Manual entry only (no GPS auto-detect)
  - PDF report available (capped at 30 days of data)
  - All features unlocked EXCEPT unlimited trips + GPS auto-detect

Trial:
  - 7-day free trial on first subscription signup
  - Card required upfront
  - Auto-cancels if not converted

Stripe Customer Portal:
  - Self-serve cancel
  - Update card
  - Switch monthly ↔ annual
  - No support burden for the operator
```

**Stripe fees at $5/mo:** $0.45 to Stripe → $4.55 net. At $39/yr: $1.43 → $37.57 net. Annual is the better business. Push it in the pricing copy.

**Unit economics sanity check:**

| Scale | Gross MRR | Stripe fees | Supabase Pro | Vercel Pro | Net |
|---|---|---|---|---|---|
| 10 users | $50 | $4.50 | $0 (free) | $0 (free) | ~$45 |
| 100 users | $500 | $45 | $25 | $20 | ~$409 |
| 500 users | $2,500 | $225 | $25 | $20 | ~$2,229 |

Sustainable above 50 users. Break-even against hosting costs around 20 users.

---

## Risks (read these before you start)

**R1 — iOS PWA background GPS doesn't work.** This is the #1 feature users will expect ("just like MileIQ"). Reality: Safari will kill background geolocation after a few minutes. The honest path is foreground GPS + "keep app open while driving" UX, and a V2 native Capacitor wrapper. Document this loudly. Don't lie about it.

**R2 — IRS rules change.** The $0.725/mile rate is 2026. Rates change annually. Bake this into a single config file (`src/config/irs-rate.ts`) so it's a one-line change each January.

**R3 — Support burden.** At $5/mo, every support email costs money. Build for self-serve: great empty states, FAQ, no email support. If users demand email support, point them to annual plan + a support tier at $99/yr.

**R4 — Churn math.** A user who pays $5/mo and churns in month 2 cost $10 lifetime. Drive them to the "week 4 moment" where the app has earned its place (4 weeks of trips logged, IRS report visible).

**R5 — Free tier abuse.** "5 trips/month free" is fine. But people will create multiple accounts. Mitigation: email confirmation required + per-account trip count + rate-limit by IP.

**R6 — Vibe coding breaks at multi-file integration.** OpenCode/GLM-5.2 will struggle at the seams. The data model, auth, billing, and PDF generation get manual review passes. UI features get vibe-coded.

**R7 — Battery drain.** Even foreground GPS can drain battery. Show battery-conscious defaults (medium accuracy), give user control, and document "keep your phone plugged in for long drives."

---

## Open questions for you

1. **Name: MilesWorth, MileLedger, or something else?** Plan uses MilesWorth throughout. Swap is a 5-minute find-and-replace before launch.
2. **Domain: milesworth.io or mileworth.io?** `.app` is the more on-brand choice for a productivity app.
3. **iOS strategy in V1?** Option A: PWA only (works on iOS as a home-screen app, but no background GPS). Option B: Add Capacitor wrapper for App Store (adds 1 week + Apple Developer fee $99/yr). Default recommendation: A.
4. **Privacy positioning copy:** "We never see your trips. They're stored in your account only. No bank linking. No ads. No upsells. Cancel anytime." Does this match the anti-hype voice?
5. **Beta recruitment list:** Who are the first 10 people you can email with a free Pro year in exchange for honest feedback? Tradespeople in your father's network + your own friends.

---

## "Review these" (post-build, before launch)

- Pricing copy (the "save 35% with annual" framing)
- Privacy policy (use a plain-language template, get a lawyer to skim if you care)
- Terms of service (same)
- IRS disclaimer ("you are not a tax advisor, consult a professional")
- Logo + brand colors (use the Strohm Partners dark-mode system as a starting point)
- Landing page hero copy
- First 10 email outreach targets (friends, tradespeople in the network)
- Tax rate wording — make sure you say "2026 IRS standard rate of $0.725/mile" not "always $0.725/mile" because it changes

---

## What I'd do first

1. **Pick the name** (5-second decision)
2. **Create the project folder** at `/home/ubuntu/.hermes/workspace/milesworth/` and run webapp-scaffolding to scaffold Vite + React + TS + Tailwind
3. **Create the Supabase project** (free tier) and run the SQL schema above
4. **Build the manual trip entry** end-to-end (this is the hardest UX, and proves the data model works before GPS complexity)
5. **Get 3 friends to log 5 trips each** before touching GPS or Stripe

That last step is the most important. If real humans won't log trips manually, GPS auto-detect won't save you.

---

## Next steps from Hermes

Available on request:

- Scaffold Week 1, Day 1 (Vite + React + TS + Tailwind + Supabase project + auth) using subagent-driven-development
- Sketch the landing page copy in anti-hype voice
- Design the database schema in more detail with TypeScript types and Supabase client wrapper
- Set up the project README with the brand-system tokens

Just say the word.
