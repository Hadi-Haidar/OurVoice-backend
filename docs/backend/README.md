# Backend Documentation

## Purpose

The backend is a **REST API** built with Node.js and Express 5. It handles all business logic, authentication, data storage, and media uploads for the Our Voice platform.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| **Node.js** | JavaScript runtime |
| **Express 5** | HTTP server and routing |
| **Supabase JS** | Database client (PostgreSQL) + Storage |
| **JWT** | Stateless authentication tokens |
| **bcryptjs** | Password hashing |
| **Multer** | File upload handling (in memory) |
| **Nodemailer** | OTP emails via SMTP |
| **Helmet** | HTTP security headers |
| **CORS** | Cross-origin request control |

---

## Folder Structure

```
src/
├── app.js                  # Express app setup, middleware, routes
├── server.js               # HTTP server entry point
├── config/
│   └── db.js               # Supabase client initialization
├── middleware/
│   └── authMiddleware.js   # JWT verification (protect guard)
├── modules/
│   ├── auth/
│   │   ├── controller.js   # Auth logic (register, login, OTP, reset)
│   │   └── routes.js       # /api/auth routes
│   └── issues/
│       ├── controller.js   # Issue CRUD, upvotes, comments, media
│       └── routes.js       # /api/issues routes
└── utils/
    ├── email.js            # Nodemailer send helper
    └── storage.js          # Supabase Storage upload helper
```

---

## How to Run

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, SMTP_*, FRONTEND_URL

# 3. Run in development mode (with hot reload via nodemon)
npm run dev

# 4. Run in production
npm start
```

The server starts on port `5000` by default (or the `PORT` env variable).

---

## API Modules

| Module | Base Route | Description |
|---|---|---|
| Auth | `/api/auth` | Registration, login, OTP, password reset |
| Issues | `/api/issues` | Issue CRUD, upvotes, comments, media, categories |

---

## 📖 Detailed Docs

| Document | Description |
|---|---|
| [setup.md](./setup.md) | Local setup and environment variables |
| [folder-structure.md](./folder-structure.md) | Directory layout explained |
| [dependencies.md](./dependencies.md) | All packages, purpose, and usage examples |
| [database.md](./database.md) | Tables, fields, and relationships |
| [api-overview.md](./api-overview.md) | All endpoints with request/response examples |
| [authentication.md](./authentication.md) | Auth system deep-dive |
| [error-handling.md](./error-handling.md) | Error response format and strategy |
| [features/auth.md](./features/auth.md) | Auth feature logic |
| [features/issues.md](./features/issues.md) | Issues feature logic |
