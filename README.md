# Spyne CRM Status Tool

A tiny internal webapp that updates a video's CRM/QC status via the
Spyne video-service API, so people without Postman access can do it too.

## What it does

- Simple form: Video ID, CRM status, Unhide toggle, Reject toggle.
- On submit, the browser calls this app's own `/api/update-video-state`
  route (Next.js API route running on Vercel), which then calls
  `https://api.spyne.ai/video-service/v1/studio/qc/update-video-states`
  server-side. This avoids CORS issues and keeps the actual upstream
  call off the client's network tab.
- Each user pastes their own **auth token** and **session cookie**
  (both from Postman: the `authorization: Bearer <token>` header and
  the `Cookie: sails.sid=...` header) into the form. Both are required
  by this endpoint. They're sent with each request and, optionally,
  saved in that browser's `localStorage` so people don't have to
  repaste them every time. Nothing is stored on the server or in any
  database.
- "Additional headers" (collapsed by default) lets you paste any other
  header as raw JSON, in case the endpoint ever needs more than
  Authorization + Cookie.

## Local dev

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## Deploy to Vercel

```bash
npm install -g vercel   # if not already installed
vercel
```

Or push this to a GitHub repo and import it in the Vercel dashboard,
same as your other dashboards (vin-tracker-delivery, spyne-qc-hub, etc).

No environment variables are required — auth is supplied per-request
by whoever is using the form, not baked into the deployment. If you'd
rather have one shared service token for everyone instead of
per-user tokens, let me know and I can wire that in as a Vercel env
var instead (simpler for users, but everyone shares one identity for
audit-log purposes).

## Notes / things to double check

- Auth is confirmed as two headers: `Authorization: Bearer <token>` and
  `Cookie: sails.sid=...`. The token that decodes from the JWT-looking
  string includes `enterprise_id` / `team_id` / `device_id`, so it's
  tied to a specific user session — each person needs their own,
  copied fresh from their own Postman/browser session (it will expire
  like any session token).
- `crmStatus` is currently restricted to the four values you showed:
  `qc_unassigned`, `qc_assigned`, `qc_inprogress`, `qc_done`. Add more
  in `app/page.tsx` (`CRM_OPTIONS`) if there are others.
- Don't commit real tokens/cookies into the repo or into any example
  `.env` file — they're per-user session credentials, not app config.
