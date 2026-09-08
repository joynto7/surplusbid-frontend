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
`Authorization: Bearer <accessToken>`. There's no refresh-on-401 interceptor
yet — `POST /auth/refresh-token` exists on the backend but isn't called
anywhere in this milestone.

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
