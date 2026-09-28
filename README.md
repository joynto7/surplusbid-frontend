# SurplusBid Frontend

React + TypeScript + Vite frontend for [surplusbid-backend](../surplusbid-backend).
This first milestone implements **Section A — Public & Authentication** from
the Claude Design handoff (`SurplusBid A - Public and Auth.dc.html`):

1. Landing page
2. Login (email/password + Google OAuth)
3. Register (buyer/seller role picker)
4. Forgot password
5. Reset password
6. Business verification submission
7. Verification status (pending / approved)

## Section B — Buyer

From `SurplusBid B - Buyer.dc.html`, plus the buyer screens from
`SurplusBid Standard.dc.html` (browse, lot detail, bid/deposit modal, my bids)
that B depends on. Also includes Section E's 404 / 403 / session-expired states.

| Route | Screen |
| --- | --- |
| `/buyer` | Dashboard |
| `/lots`, `/lots/:id` | Browse, lot detail + bid terminal + deposit/bid modal |
| `/buyer/bids` | My bids & watchlist (Active / Won / Lost / Watching) |
| `/buyer/checkout/:paymentId` (`/success`, `/failed`) | Checkout, payment success, payment failed |
| `/buyer/invoices/:paymentId` | Invoice / receipt (Download PDF = print) |
| `/buyer/settings` | Profile & settings |
| `/buyer/notifications` | Notifications center |
| `/buyer/disputes/new` | File a dispute |

Verified buyers land on `/buyer` after login. The lots catalog is buyer-only
for now because it uses the buyer shell. Other roles get the 403 page.

Checkout uses Stripe's Payment Element in deferred-intent mode: the form renders
without calling the backend, and `POST /payments/initiate` (which captures the
deposit hold) only runs when the buyer clicks Pay. Set
`VITE_STRIPE_PUBLISHABLE_KEY` to enable it.

### Buyer gaps vs. the design

Things the design shows that the backend can't support yet:

- **Watchlist, notification read state and preferences** live in
  `localStorage` (per device). No watchlist or notifications API exists.
- **Notifications are derived** from your bids, lots and payments (outbid,
  closing soon, won, payment due/failed, deposit released) instead of coming
  from a feed. Email/SMS columns were dropped.
- **Deposit amounts** are computed client-side as `DEPOSIT_PERCENT` of the
  starting price (the backend's formula). No endpoint lists your holds, so
  "deposit authorized" is remembered per browser. Keep `VITE_DEPOSIT_PERCENT` /
  `VITE_PAYMENT_DEADLINE_HOURS` in sync with the backend env.
- **Bid/deposit modal** has 3 steps instead of 4: `POST /lots/:id/deposit`
  takes no card details, so the "card for the hold" step was dropped.
- **Order summary / invoice** show hammer price, deposit and balance only. The
  backend has no buyer premium, tax, seller address or removal deadline.
  Removal choice at checkout is not sent anywhere.
- **Saved payment methods, password change, active sessions, dispute evidence
  upload, "Save draft", "Email a copy"** have no endpoints. They're replaced
  with honest empty states or links (e.g. password → forgot-password flow).
- **Browse** has no price filter or bid counts (not in `GET /lots`).
- **Retrying a failed payment**: the backend marks a Payment `FAILED` on
  Stripe's `payment_failed` webhook, and after that `/payments/initiate`
  returns 409 and a later success webhook is ignored. Checkout shows a support
  notice in that case. This needs a backend change to allow retries.

## Section C — Seller

From `SurplusBid C - Seller.dc.html`, plus the Standard file's lot creation
wizard and inventory log. Verified sellers land on `/seller` after login.

| Route | Screen |
| --- | --- |
| `/seller` | Seller dashboard |
| `/seller/listings` | Inventory log (status filter, 7-day bid sparkline, reserve status) |
| `/seller/lots/new` | Lot creation wizard (`?from=<lotId>` relists a closed lot) |
| `/seller/lots/:id/edit` | Edit draft lot (drafts only) |
| `/seller/lots/:id` | Lot performance (bid chart, bid log, bid pace) |
| `/seller/payouts` | Payouts & earnings (closed lots, CSV export) |
| `/seller/settings` | Seller profile & settings |
| `/seller/notifications` | Seller notifications |

Sellers can also open `/lots/:id`, which is what "Preview as buyer" uses.

### Seller gaps vs. the design

- **Photos**: `POST /lots` accepts up to 5 images, and only at creation. There's
  no endpoint to add or reorder them later. The design's "8 minimum" became
  "up to 5", and the draft editor shows photos read-only.
- **Drafts need every field**: `POST /lots` requires all fields, so the wizard
  can only save once every step is valid. There's no partial server-side draft.
- **No review queue**: publishing (`PATCH /lots/:id/publish`) makes a lot LIVE
  immediately, so "Submit for review" became "Publish lot".
- **No payouts, platform fee, views, watchers, unique bidders or bidder
  identities** in the API. The payouts page lists closed lots with the hammer
  price, the buyer deposit (the `DEPOSIT_PERCENT` rule) and the balance due.
  Fee and "net to you" lines were dropped. The payout-account tab points to
  billing. Bid-log rows show bid IDs, not bidder aliases.
- **Location, removal deadline, inspection window, relist-if-unsold, removal
  contact/terms**: no fields on `Lot`/`User`, so they're omitted.
  Anti-sniping is always on in the backend (2 min), so it's shown as a locked
  checkbox.
- **Notifications** are derived from your lots and their bid history, the same
  approach as the buyer side. Read state and preferences are stored in the
  browser only.
- **Reserve isn't enforced at close**: the backend's close job marks any lot
  with a bid as SOLD, even below reserve. The UI shows reserve met/not met but
  can't change that outcome.

## Section D — Admin

From `SurplusBid D - Admin.dc.html`, plus the Standard file's admin console
(verification queue, dispute console, audit log). Operators land on `/admin`
after login and can also open any `/lots/:id`.

| Route | Screen |
| --- | --- |
| `/admin` | Platform overview |
| `/admin/verifications` | Verification queue (quick verify / request changes) |
| `/admin/verifications/:userId` | Verification detail |
| `/admin/users` | User management (filters, paging, CSV, revoke / reinstate) |
| `/admin/categories` | Category management (list + create) |
| `/admin/disputes` | Dispute console |
| `/admin/disputes/:id` | Dispute resolution detail |
| `/admin/audit-log` | Audit log (auto-refreshes on page 1) |
| `/admin/settings` | Platform settings (read-only) |

### Admin gaps vs. the design

- **Disputes can't be listed**: the backend only has `POST /disputes` and
  `PATCH /disputes/:id/resolve`. The dispute console and detail pages call
  `GET /disputes?status=` and `GET /disputes/:id` (see `api.adminDisputes` /
  `api.dispute`) and show a notice while those return 404. Adding the two
  admin-only routes to the backend makes both screens work unchanged.
- **Resolving a dispute moves no money**: the backend only records
  RESOLVED/REJECTED plus a note. Refund, partial-refund and release options
  became "Resolve in the filer's favour" / "Reject". Disputes have no evidence
  attachments.
- **Verification**: there's no user-by-id endpoint (the detail page pages
  through `GET /admin/users`), and the uploaded document (`verificationDocUrl`)
  isn't returned. Automated registry/OCR/bank checks don't exist, so they're
  replaced by a manual review checklist. "Request a document" maps to
  REJECTED, which lets the applicant resubmit. The backend doesn't store or
  send a reason, so the page offers a pre-filled email to the applicant instead.
- **User management**: there's no search endpoint (search filters the current
  page), no suspend endpoint ("Revoke" sets REJECTED, "Reinstate" sets
  VERIFIED), and no volume/dispute counts per user.
- **Categories** can only be created. No rename, nesting, per-category deposit
  or delete/retire.
- **Platform settings** live in the backend env (`DEPOSIT_PERCENT`,
  `PAYMENT_DEADLINE_HOURS`), so the page is read-only. No platform fee or
  buyer premium exists.
- **Overview**: charts and top categories are computed from the 50 most recent
  sold lots (hammer price), since there's no GMV time series. Escrow position was
  replaced with account counts.

## Setup

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend
npm run dev
```

Runs on `http://localhost:3000` by default — matching `surplusbid-backend`'s
default `CORS_ORIGIN` and its Google OAuth callback redirect
(`${CORS_ORIGIN}/oauth-callback`), so no backend config changes are needed for
local dev with both defaults left as-is.

## Wiring to the backend

Real endpoints used:

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- `GET /auth/google` → `GET /auth/google/callback` → redirects to `/oauth-callback?accessToken=&refreshToken=`
- `GET /users/me`, `PATCH /users/me`, `POST /users/verify` (multipart, field `document`)

Tokens are kept in `localStorage` (`src/lib/api.ts`) and attached as
`Authorization: Bearer <accessToken>`. A 401 triggers one
`POST /auth/refresh-token` retry; if that fails, the session-expired overlay
appears over the current page and signing in returns you to it.

The buyer and seller sections also use `/lots/my-listings`, `POST /lots`,
`PATCH /lots/:id`, `PATCH /lots/:id/publish`, `DELETE /lots/:id`, `/categories`, `/lots`, `/lots/:id/bids`,
`/lots/:id/deposit`, `/bids/my-bids`, `/payments/*` and `POST /disputes`.

## Known gaps vs. the design file

The design mockup includes some fields and numbers the backend doesn't
support yet. These were kept visually (per the "match the design" ask) but
don't do anything real:

- **Forgot / reset password** — `surplusbid-backend` has no
  `/auth/forgot-password` or `/auth/reset-password` routes. Both pages run a
  local state machine (form → sent/done) with a `setTimeout` standing in for
  the API call. See the `NOTE:` comments in `ForgotPasswordPage.tsx` and
  `ResetPasswordPage.tsx`.
- **Register's "Your name" field** and **Verify business's entity type /
  registered address / state / phone fields** — the `User` model only has
  `companyName` and `taxId`; these inputs are captured in local state but
  never sent to the API.
- **Verification status "Next steps"** — "Add card" and "Set alerts" are
  disabled placeholders; there's no billing or alerts module yet.
- Multi-file upload with per-file progress/error states from the mockup was
  simplified to a single file input, matching `POST /users/verify` (which
  accepts exactly one `document`).

## Design system

Colors, type scale, and component shapes are ported 1:1 from the design
file's CSS custom properties into `src/styles/tokens.css`. Fonts: Inter for
UI text, JetBrains Mono for all numeric figures (prices, IDs, timestamps).
