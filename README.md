# SurplusBid Frontend

Next.js frontend for **SurplusBid**, a B2B auction marketplace for industrial surplus. Verified sellers
list lots, verified buyers place a refundable Stripe deposit hold and bid in timed auctions with
anti-sniping, and admins verify businesses, manage the catalog and resolve disputes.

It consumes the [surplusbid-backend](https://github.com/joynto7/surplusbid-backend) REST API (B7A6).

| | |
| --- | --- |
| Live frontend | `<add your Vercel URL>` |
| Live API | https://surplusbid-api.onrender.com/api/v1 |
| API docs | https://documenter.getpostman.com/view/56417304/2sBYAxPUve |

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, React Compiler), TypeScript strict |
| UI | Tailwind CSS v4, shadcn/ui (Radix primitives), Lucide icons, next-themes (dark mode) |
| Server state | TanStack Query v5 with server prefetch + `HydrationBoundary` |
| Client state | Zustand (watchlist, lot-wizard draft, UI preferences, deposit memory) |
| Forms | React Hook Form + Zod v4 (schemas mirror the backend's Zod rules) |
| Auth | Backend JWTs stored in **httpOnly cookies**, `proxy.ts` route protection, server actions |
| Payments | Stripe Payment Element (test mode), success and cancel redirects |
| Charts | Recharts via shadcn chart, lazily loaded with `next/dynamic` |
| Toasts | Sonner |
| Lint/format | Biome |

## Roles and one-click demo login

The login page has one **Demo login** button per role. The button calls a server action that signs
in with credentials from **server-only env vars**, so the demo passwords never reach the browser.

| Role | Lands on | Can do |
| --- | --- | --- |
| Admin | `/admin` | Platform stats and charts, verification queue, user directory, lots, categories, dispute console, audit log with CSV export |
| Buyer | `/buyer` | Overview, my bids (by standing), watchlist, payments and Stripe checkout, disputes, profile |
| Seller | `/seller` | Overview, listings (publish/edit/delete/relist), 4-step lot wizard, lot performance, earnings with CSV export, disputes, profile and auction defaults |

Demo accounts come from the backend seed: `admin@surplusbid.com`, `seller@surplusbid.com`,
`buyer@surplusbid.com`. The passwords are set in the deployment's env and in the submission form.

## Pages (35 routes)

```
Public (Server Components, static / ISR)
/                         Home: live counts, closing-soon lots, categories
/about  /how-it-works  /faq  /contact
/lots                     Catalog: search, category, status, sort, page in the URL
/lots/[id]                Lot detail: gallery, live price, deposit + bid flow, bid history

Auth
/login                    Email/password, Google, and one-click demo login per role
/register                 Buyer/seller registration (step 1 of 2)
/verify-business          Registration document upload with progress (step 2 of 2)
/verification-status      Review status

Buyer (/buyer/*)          overview · bids · watchlist · payments · checkout/[paymentId] · disputes · profile
Seller (/seller/*)        overview · lots · lots/new · lots/[id] · lots/[id]/edit · earnings · disputes · profile
Admin (/admin/*)          overview · verifications · users · lots · categories · disputes · audit-logs

Payment                   /payment/success  /payment/cancel
Utility                   not-found.tsx, error.tsx (root + per role), global-error.tsx
```

## Architecture

```
src/
  app/
    (public)/        marketing + catalog, shared header/footer layout
    (auth)/          split-screen auth layout
    (dashboard)/     admin | buyer | seller, each with layout, loading and error files
    payment/         Stripe return pages
    api/backend/[...path]/route.ts   BFF proxy (attaches bearer token, refreshes it)
    api/session, api/auth/logout, oauth-callback
  proxy.ts           route protection + token refresh (Next 16's replacement for middleware)
  components/
    ui/              shadcn primitives
    shared/          DataTable, StatCard, StatusBadge, EmptyState, SearchInput, PaginationBar, skeletons…
    forms/           RHF field bindings, file dropzone
    lots/ payments/ auth/ layout/ charts/ dashboard/{admin,buyer,seller,profile,disputes}
  hooks/             useUrlState, useDebounce, useCountdown, useMounted, useLotsByIds, mutations
  lib/
    api/             endpoints (one definition for server and client fetchers), errors, server/client fetchers
    auth/            token helpers, session (server-only), server actions
    validation.ts    all Zod schemas
    query-keys.ts    shared keys for server prefetch and client queries
  stores/            Zustand stores
  types/api.ts       typed API responses
```

### Auth flow

1. Login, register and demo-login are **server actions**. They call the backend and put the access
   and refresh tokens in `httpOnly`, `SameSite=Lax` cookies (`Secure` in production).
2. `src/proxy.ts` runs before protected routes. It refreshes an expired access token, redirects
   signed-out users to `/login?next=…`, and sends a user who opens another role's area back to their
   own dashboard. When `JWT_ACCESS_SECRET` is set it verifies the signature with `jose`.
3. Role layouts re-check the user against `GET /users/me` on the server (defense in depth) and pass
   the profile to client components through a context. The backend authorizes every API call anyway.
4. Browser code never touches tokens. Client requests go to `/api/backend/*`, a route handler that
   adds the bearer token, retries once after a refresh, and returns a new cookie if one was issued.

### Data fetching

- Public pages are Server Components using `fetch` with ISR (`revalidate`).
- Dashboard pages prefetch on the server (`prefetch()` → `HydrationBoundary`) and hand the cache to
  TanStack Query, so the first paint has data and later interactions are client-side.
- Optimistic updates: placing a bid, publishing and deleting drafts, verifying users, creating
  categories.
- Every filter, sort, search and page is URL state (`useUrlState` on top of `useSearchParams`).
- API failures surface as Sonner toasts from one `QueryCache`/`MutationCache` handler. Render
  errors are caught by `error.tsx` boundaries.

## Getting started

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
| `JWT_ACCESS_SECRET` | Optional. Same as the backend's, enables signature verification in the proxy |
| `DEMO_{ADMIN,SELLER,BUYER}_{EMAIL,PASSWORD}` | Server-only credentials for the demo buttons |

Scripts: `npm run build`, `npm run lint` (Biome), `npm run typecheck`.

## Deploying to Vercel

1. Import the repo in Vercel. The framework preset is detected automatically.
2. Add every variable from `.env.example` in Project → Settings → Environment Variables.
3. On the backend (Render), set `CORS_ORIGIN` to the Vercel URL. The Google OAuth callback redirects
   there. Regular API calls are server-to-server through the BFF, so they don't depend on CORS.
4. Stripe test cards: `4242 4242 4242 4242`, any future date, any CVC.

## Backend limitations and how the UI handles them

- **No watchlist, holds list, or "my disputes" endpoints.** These are kept per browser in Zustand
  (persisted) and labelled as such.
- **No dispute list for admins.** The dispute console resolves by dispute ID and shows decision
  history from the audit log.
- **No seller payouts ledger.** Earnings are derived from winning bids and the deposit rule.
- **Photos only at creation** (max 5). The draft editor can't change them.
- **Deposit hold confirmation.** `POST /lots/:id/deposit` creates a manual-capture PaymentIntent but
  doesn't return its `client_secret`, so no card is ever attached to it. If the backend adds
  `clientSecret` to that response, the deposit dialog confirms the card hold with the Payment Element
  automatically (`DepositHold.clientSecret` in `src/types/api.ts`).
