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
- Each user pastes their own **auth token** (from Postman's
  `authorization: Bearer <token>` header) into the form, tucked behind
  a collapsed "Auth params" toggle so it's out of the way by default.
  It's sent with each request and, optionally, saved in that browser's
  `localStorage` so people don't have to repaste it every time.
  Nothing is stored on the server or in any database.
- The **session cookie** (`Cookie: sails.sid=...`) is a shared service
  credential, so it's not in the UI at all — it's baked into the
  deployment as a Vercel environment variable (see below) and used for
  every request automatically.
- "Additional headers" (collapsed by default) lets you paste any other
  header as raw JSON, in case the endpoint ever needs more than
  Authorization + Cookie.

## Required environment variable

Set this in the Vercel project settings (Settings → Environment
Variables):

| Name                  | Value                                  |
|------------------------|-----------------------------------------|
| `SPYNE_SESSION_COOKIE` | `sails.sid=s%3A...` (the full cookie value from Postman) |

Redeploy after adding it. If it's ever missing, the app returns a
clear error instead of silently failing.

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

- The session cookie is shared across the team, but it's still a real
  session credential — if it ever gets rotated or invalidated, update
  `SPYNE_SESSION_COOKIE` in Vercel and redeploy (or just save the env
  var again, no code change needed).
- The bearer token you showed decodes to include `enterprise_id` /
  `team_id` / `device_id`. If that's also meant to be shared rather
  than per-user, say the word and I'll move it into an env var too and
  drop the "Auth params" section from the UI entirely.
- `crmStatus` is currently restricted to the four values you showed:
  `qc_unassigned`, `qc_assigned`, `qc_inprogress`, `qc_done`. Add more
  in `app/page.tsx` (`CRM_OPTIONS`) if there are others.
- Don't commit real tokens/cookies into the repo or into any example
  `.env` file — set them only in Vercel's environment variable UI.
