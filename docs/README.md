# Our Voice 🇱🇧 — صوتنا

A civic engagement platform that empowers Lebanese citizens to report local problems, support each other through upvotes and comments, and track the status of issues transparently.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, TailwindCSS, Framer Motion, Leaflet |
| **Backend** | Node.js, Express 5, JWT, Multer, Nodemailer |
| **Database** | Supabase (PostgreSQL + File Storage) |
| **Deployment** | Vercel (both frontend & backend) |

---

## ✨ Main Features

- 📋 **Issue Reporting** — Citizens report local problems with title, description, category, location, and optional media
- 👍 **Community Upvoting** — One upvote per user per issue to signal importance
- 💬 **Comments** — Citizens can comment, edit, and delete their own comments on any issue
- 🔒 **Authentication** — Register, login, email OTP verification, and password reset
- 🕵️ **Anonymous Posting** — Report issues without revealing your identity
- 🗺️ **Map Integration** — Pin exact location on a map when reporting an issue
- 📊 **Live Stats** — Platform-wide statistics shown on the landing page
- 🌐 **Bilingual** — Full Arabic and English support with RTL layout

---

## 📁 Repositories

| Repo | Description |
|---|---|
| `Our-voice Backend` | Node.js + Express REST API |
| `our-voice` | React frontend SPA |

---

## 📖 Documentation

| Section | Link |
|---|---|
| Project Overview | [project-overview.md](./project-overview.md) |
| Architecture | [architecture.md](./architecture.md) |
| Backend Docs | [backend/README.md](./backend/README.md) |
| Frontend Docs | *(lives in the frontend repo)* `our-voice/docs/frontend/README.md` |

---

## ▶️ How to Run Locally

### Backend
```bash
cd "Our-voice Backend"
npm install
# Copy .env.example to .env and fill in your values
cp .env.example .env
npm run dev
# Runs on http://localhost:5000
```

### Frontend
```bash
cd our-voice
npm install
# Set VITE_API_BASE_URL in .env
npm run dev
# Runs on http://localhost:5173
```

---

## 🌍 Deployment

Both apps are deployed on **Vercel**.

- Backend: configured via `vercel.json` as a serverless Express app
- Frontend: static build with client-side routing via `vercel.json` rewrites
