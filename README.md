# SurplusBid Frontend

Next.js frontend for **SurplusBid**, a B2B auction marketplace for industrial surplus. Verified sellers
list lots, verified buyers place a refundable Stripe deposit hold and bid in timed auctions with
anti-sniping, and admins verify businesses, moderate the marketplace and resolve disputes. An AI layer
(Claude through the backend) powers search, recommendations, a chat assistant, listing writing and
admin insights.

It consumes the [surplusbid-backend](https://github.com/joynto7/surplusbid-backend) REST API.

| | |
| --- | --- |
| Live frontend | https://surplusbid-frontend.vercel.app |
| Live API | https://surplusbid-api.onrender.com/api/v1 |
| API docs | https://documenter.getpostman.com/view/56417304/2sBYAxPUve |

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, React Compiler), TypeScript strict |
| UI | Tailwind CSS v4, shadcn/ui (Radix primitives), react-icons, next-themes (light/dark) |
| Server state | TanStack Query v5 with server prefetch + `HydrationBoundary` |
| Client state | Zustand (watchlist, lot-wizard draft, UI preferences, deposit memory) |
| Forms | React Hook Form + Zod v4 (schemas mirror the backend's Zod rules) |
| Auth | Backend JWTs in **httpOnly cookies**, `proxy.ts` route protection, server actions, Google OAuth |
| Payments | Stripe Payment Element (test mode), success and cancel redirects |
| Charts | Recharts via shadcn chart, lazily loaded with `next/dynamic` |
| AI | Claude via the backend's `/ai/*` endpoints, with built-in fallbacks when no API key is set |
| Toasts / lint | Sonner, Biome |

### Design system

Three brand colours plus a neutral: **blue** (primary actions, links, charts), **emerald** (success,
live lots), **amber** (highlights, ratings, warnings) on a **slate** neutral. Every colour is a CSS
token in `src/app/globals.css` with a light and a dark value, so both themes keep their contrast.
Cards, tables, empty states and skeletons are shared components, so every page looks the same.

## Roles and demo login

The login page has a **demo account** button per role. Clicking one fills the email and password
fields in front of you, then signs in through the normal login form. The credentials come from
server-only env vars (`DEMO_*`), so each deployment can rotate them. Google sign-in sits next to them.

| Role | Lands on | Sidebar |
| --- | --- | --- |
| Buyer | `/buyer` | Overview, browse auctions, my bids, watchlist, payments, my reviews, disputes, profile |
| Seller | `/seller` | Overview, my listings, create lot (AI listing assistant), earnings, reviews, disputes, profile |
| Admin | `/admin` | Overview, AI insights, verification queue, users, lots, categories, disputes, reviews, messages, audit log, profile |

Demo accounts come from the backend seed: `admin@surplusbid.com`, `seller@surplusbid.com` and
`buyer@surplusbid.com`. The passwords are in the deployment's env and in the submission form.

## Features

**Public site**
- Sticky full-width navbar: 6 routes signed out (Home, Explore, How it works, Blog, About, Contact)
  plus a Categories dropdown. Signed in it shows Home, Explore, Dashboard and two role links, with
  Blog, FAQ, About and Contact under a Resources dropdown, and an avatar menu with profile and sign
  out. A ⌘K search dialog is on every public page.
- Home page with 15 sections: a personalised hero slider (65% of the screen, auto-rotating, with AI
  search), live stats, categories, closing soon, recommended for you, trending, how it works,
  features, recent results, top sellers, testimonials, blog, FAQ, newsletter and a call to action.
- Explore (`/lots`): keyword or natural-language search, filters for category, status, price range,
  location and condition, five sort orders, grid/list view and numbered pagination, all in the URL.
- Lot cards: photo, title, short description, price, location, closing countdown, rating and a
  View details button, four per row on desktop, with skeleton loaders.
- Lot details: photo gallery with lightbox, overview, specifications, seller profile, reviews, live
  bid panel, bid history, "Ask AI about this lot" and related lots.
- Blog with category filter and search, plus About, How it works, FAQ (with section links), Contact
  (saved to the admin inbox), Privacy and Terms pages, and a footer with contact details and social links.

**Dashboards**
- Overview cards and charts from real data for every role (bids per day, sales per month, sign-ups,
  lots by status, category performance, top buyers).
- Tables with search, filters and pagination: users, messages, reviews, disputes, my reviews,
  received reviews, payments, earnings, listings, bids, categories and the audit log.
- Editable profile (company, tax ID, contact person, phone, location, bio) for every role.
- Profile dropdown in the dashboard top bar and in the sidebar.

## AI features

| Feature | Where | How it works |
| --- | --- | --- |
| Shopping assistant | "Ask AI" button on public pages | Claude answers with tools that search lots and read lot details; it knows which lot you're viewing. Falls back to a built-in knowledge base and lot search. |
| Natural-language search | Hero, Explore, ⌘K | "forklifts under $20k in Texas" becomes category, price, location and sort filters, shown as chips you can remove. |
| Smart suggestions | Every search box | Typo-tolerant suggestions for lots, categories and searches as you type. |
| Recommendations | Home "Recommended for you" | TF-IDF similarity to the lots you viewed; trending lots for new visitors. |
| Personalised hero | Home | The slide for your most-viewed category comes first. |
| Listing assistant | Seller → Create lot | Writes the description and specs from your title and notes, and suggests start, reserve and increment prices from comparable sales. |
| Admin insights | Admin → AI insights, overview briefing | A written summary of the week, ranked insights with links, and anomaly detection (bid spikes, rapid bidding, stalled lots, overdue payments). |

Every AI endpoint returns a `mode` (`ai` when Claude wrote it, `smart` for the built-in engine), so
the app works fully without an Anthropic key.

## Pages (45 routes)

```
Public (Server Components, static / ISR)
/                         Home (15 sections)
/lots  /lots/[id]         Explore and lot details
/blog  /blog/[slug]       Guides, statically generated
/about  /how-it-works  /faq  /contact  /privacy  /terms

Auth
/login                    Email/password, Google, demo accounts that fill in the form
/register                 Buyer/seller registration (step 1 of 2)
/verify-business          Registration document upload with progress (step 2 of 2)
/verification-status      Review status

Buyer (/buyer/*)          overview · bids · watchlist · payments · checkout/[paymentId] · reviews · disputes · profile
Seller (/seller/*)        overview · lots · lots/new · lots/[id] · lots/[id]/edit · earnings · reviews · disputes · profile
Admin (/admin/*)          overview · insights · verifications · users · lots · categories · disputes · reviews · messages · audit-logs · profile

Payment                   /payment/success  /payment/cancel
Utility                   not-found.tsx, error.tsx (root + per role), global-error.tsx, loading.tsx skeletons
```

## Architecture

```
src/
  app/
    (public)/        marketing, catalog and blog; shared header/footer layout and the AI assistant
    (auth)/          split-screen auth layout
    (dashboard)/     admin | buyer | seller, each with layout, loading and error files
    payment/         Stripe return pages
    api/backend/[...path]/route.ts   BFF proxy (attaches bearer token, refreshes it)
    api/session, api/auth/logout, oauth-callback
  proxy.ts           route protection + token refresh (Next 16's replacement for middleware)
  components/
    ui/              shadcn primitives
    shared/          DataTable, StatCard, StatusBadge, FilterTabs, EmptyState, SearchInput, skeletons…
    ai/              chat assistant, smart search, ⌘K dialog
    home/ blog/ lots/ payments/ auth/ layout/ charts/ forms/
    dashboard/       admin, buyer, seller, reviews, profile, disputes
  content/blog.ts    blog articles
  hooks/             useUrlState, useDebounce, useCountdown, useMounted, mutations
  lib/
    api/             endpoints (one definition for server and client fetchers), errors, fetchers
    auth/            token helpers, session (server-only), server actions
    validation.ts    all Zod schemas
    query-keys.ts    shared keys for server prefetch and client queries
    activity.ts      recently viewed lots, used for recommendations
  stores/            Zustand stores
  types/api.ts       typed API responses
```

### Auth flow

1. Login, register and the demo buttons are **server actions**. They call the backend and put the
   access and refresh tokens in `httpOnly`, `SameSite=Lax` cookies (`Secure` in production).
2. `src/proxy.ts` runs before protected routes. It refreshes an expired access token, redirects
   signed-out users to `/login?next=…`, and sends a user who opens another role's area back to their
   own dashboard. When `JWT_ACCESS_SECRET` is set it verifies the signature with `jose`, so it must
   match the backend's value.
3. Role layouts re-check the user against `GET /users/me` on the server (defense in depth) and pass
   the profile to client components through a context. The backend authorizes every API call anyway.
4. Browser code never touches tokens. Client requests go to `/api/backend/*`, a route handler that
   adds the bearer token, retries once after a refresh, and returns a new cookie if one was issued.

### Data fetching

- Public pages are Server Components using `fetch` with ISR (`revalidate`).
- Dashboard pages prefetch on the server (`prefetch()` → `HydrationBoundary`) and hand the cache to
  TanStack Query, so the first paint has data and later interactions are client-side.
- Optimistic updates: placing a bid, publishing and deleting drafts, verifying users, creating
  categories, and marking messages read.
- Every filter, sort, search and page is URL state (`useUrlState` on top of `useSearchParams`).
- API failures surface as Sonner toasts from one `QueryCache`/`MutationCache` handler. Render
  errors are caught by `error.tsx` boundaries.

## Getting started

Run the backend first (see its README), then:

```bash
cp .env.example .env.local   # fill in the values below
npm install
npm run dev                  # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL including `/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | This frontend's public URL (metadata) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` from the **same** Stripe account as the backend |
| `NEXT_PUBLIC_DEPOSIT_PERCENT`, `NEXT_PUBLIC_PAYMENT_DEADLINE_HOURS` | Keep in sync with the backend |
| `JWT_ACCESS_SECRET` | Optional. Must equal the backend's; enables signature verification in the proxy |
| `DEMO_{ADMIN,SELLER,BUYER}_{EMAIL,PASSWORD}` | Credentials the demo buttons fill in |

Scripts: `npm run build`, `npm run lint` (Biome), `npm run typecheck`.

## Deploying to Vercel

1. Import the repo in Vercel. The framework preset is detected automatically.
2. Add every variable from `.env.example` in Project → Settings → Environment Variables.
3. On the backend (Render), set `CORS_ORIGIN` to the Vercel URL. The Google OAuth callback redirects
   there. Regular API calls are server-to-server through the BFF, so they don't depend on CORS.
4. Stripe test cards: `4242 4242 4242 4242`, any future date, any CVC.

## Notes

- **Watchlist** is kept per browser (Zustand, persisted); the backend has no watchlist endpoint.
- **Seller earnings** are derived from winning bids and the deposit rule; there is no payout ledger.
- **Photos only at creation** (max 5). The draft editor can't change them.
- **Deposit holds.** `POST /lots/:id/deposit` returns the manual-capture PaymentIntent's
  `clientSecret`, and the bid panel confirms the card hold with the Stripe Payment Element before the
  first bid is allowed.
