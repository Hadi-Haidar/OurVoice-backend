# Architecture

## System Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  Browser / User Device                        │
│                                                              │
│   ┌────────────────────────────────────────────────────┐    │
│   │             React SPA (our-voice)                   │    │
│   │        Vite + TailwindCSS + React Router            │    │
│   │           Deployed on Vercel (static)               │    │
│   └─────────────────────┬──────────────────────────────┘    │
└─────────────────────────┼────────────────────────────────────┘
                          │ HTTPS REST API (Axios)
                          │ Authorization: Bearer <JWT>
┌─────────────────────────▼────────────────────────────────────┐
│               Express.js API (Our-voice Backend)              │
│              Node.js + Express 5 + Multer + JWT              │
│               Deployed on Vercel (serverless)                 │
│                                                              │
│    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐   │
│    │  /api/auth  │    │ /api/issues  │    │  /api/stats │   │
│    └──────┬──────┘    └──────┬───────┘    └──────┬──────┘   │
│           │                  │                   │           │
│    ┌──────▼──────────────────▼───────────────────▼──────┐   │
│    │              Supabase JS Client (Admin)              │   │
│    └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────┐
│                    Supabase (BaaS)                            │
│                                                              │
│   ┌──────────────────────┐   ┌──────────────────────────┐   │
│   │   PostgreSQL DB       │   │    Storage Buckets        │   │
│   │  - users             │   │  - issue-images           │   │
│   │  - categories        │   │  - issue-videos           │   │
│   │  - issues            │   └──────────────────────────┘   │
│   │  - issue_comments    │                                   │
│   │  - issue_upvotes     │   ┌──────────────────────────┐   │
│   └──────────────────────┘   │    Email (Nodemailer)     │   │
│                              │  OTP codes via SMTP       │   │
│                              └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Request Flow

### Unauthenticated Request (Browse Issues)
```
Browser → GET /api/issues → Express Router → Controller → Supabase DB → Response
```

### Authenticated Request (Report Issue)
```
Browser
  → POST /api/issues (with Bearer token)
  → Express Router
  → authMiddleware (verify JWT)
  → Controller
  → Supabase DB (insert issue)
  → If file: Multer → uploadToSupabase() → Storage URL
  → JSON Response
```

### Auth Flow (Register)
```
Browser
  → POST /api/auth/register
  → Controller: validate → hash password → generate OTP → insert user → send email via Nodemailer
  → Response: "Check your email"
→ Browser: POST /api/auth/verify-email (with OTP)
  → Controller: verify OTP + expiry → mark is_verified=true → clear OTP
  → Response: "Email verified"
→ Browser: POST /api/auth/login
  → Controller: check email → check is_verified → compare bcrypt hash → sign JWT
  → Response: { token, user }
```

---

## Security Layers

| Layer | Mechanism |
|---|---|
| **HTTP Security Headers** | `helmet.js` on all routes |
| **CORS** | Restricted to `FRONTEND_URL` env variable |
| **Authentication** | JWT signed with `JWT_SECRET`, expires in `JWT_EXPIRES_IN` |
| **Password Storage** | `bcryptjs` with salt rounds = 10 |
| **Authorization** | Controller-level ownership check (author_id === req.user.id) |
| **Body Size Limit** | `10mb` max on JSON and form data |
| **Sensitive Field Removal** | `password`, `otp_code`, `otp_expires_at` deleted before response |

---

## Deployment

| Service | Platform | Config File |
|---|---|---|
| Backend | Vercel (serverless) | `vercel.json` |
| Frontend | Vercel (static SPA) | `vercel.json` (with rewrites → `index.html`) |
| Database | Supabase (managed PostgreSQL) | Supabase dashboard |
| File Storage | Supabase Storage | Supabase dashboard |
| Email | Nodemailer (SMTP) | `.env` SMTP credentials |

---

## Environment Variables

### Backend (`.env`)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:5173
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
NODE_ENV=development
```

### Frontend (`.env`)
```
VITE_API_BASE_URL=http://localhost:5000/api
```
