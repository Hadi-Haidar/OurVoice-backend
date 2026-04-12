# Backend Setup

## Prerequisites

- Node.js v18 or later
- npm v9 or later
- A Supabase project (free tier works)
- An SMTP email account (Gmail, Brevo, Mailgun, etc.)

---

## Step 1 — Clone and Install

```bash
git clone <backend-repo-url>
cd "Our-voice Backend"
npm install
```

---

## Step 2 — Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role key from Supabase (Settings → API) |
| `JWT_SECRET` | A long random string for signing tokens |
| `JWT_EXPIRES_IN` | Token expiry (e.g., `1d`, `7d`) |
| `FRONTEND_URL` | The frontend's origin for CORS (e.g., `http://localhost:5173`) |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port (usually `587` for TLS) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `PORT` | Server port (optional, default: `5000`) |
| `NODE_ENV` | `development` or `production` |

---

## Step 3 — Set Up the Database

1. Open [Supabase Dashboard](https://supabase.com)
2. Go to your project → SQL Editor
3. Run the contents of `src/db/schema/issues.sql`
4. This creates all tables and seeds the default categories

---

## Step 4 — Run the Dev Server

```bash
npm run dev
```

The server starts at `http://localhost:5000`.

Test it: Open `http://localhost:5000` in your browser → should see "Your Express Server is running... 🚀"

---

## Step 5 — Run in Production

```bash
npm start
```

Or deploy to Vercel using the included `vercel.json`.

---

## Vercel Deployment

The `vercel.json` routes all requests to the Express app:

```json
{
  "version": 2,
  "builds": [{ "src": "src/server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/server.js" }]
}
```

Set all environment variables in the Vercel project dashboard under Settings → Environment Variables.
