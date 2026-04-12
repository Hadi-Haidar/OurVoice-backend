# Project Overview

## Purpose

**Our Voice (صوتنا)** exists to solve a real problem in Lebanon: citizens have no centralized, transparent platform to collectively report and track everyday local problems.

Infrastructure is failing — electricity is rationed, roads are damaged, water is interrupted, and public services are unreliable. Yet there is no way for citizens to raise these issues in a structured, visible, and accountable way.

Our Voice fills that gap by giving every citizen a voice, keeping issues public, and letting the community signal what matters most.

---

## The Core Idea

> Citizens report → Community responds → Issues stay visible → Progress is tracked

Unlike social media (which buries issues in algorithmic noise), Our Voice is:
- **Topic-focused** — every post is a civic issue
- **Chronological** — no ranking by popularity
- **Transparent** — upvotes, comments, and status changes are all public
- **No algorithms** — no promotion, no trends, no hidden logic

---

## Target Users

| User Type | Role |
|---|---|
| **Citizens** | Report issues, upvote, comment, track status |
| **Issue Authors** | Manage their own reports (edit, delete, update status) |
| *(Future)* **Admins** | Moderate issues, manage categories |
| *(Future)* **Municipalities** | Respond officially to issues in their district |

---

## Issue Lifecycle

```
Submitted → [pending] → [in_progress] → [solved]
```

- **pending**: Issue reported, waiting for attention
- **in_progress**: Author or relevant party has acknowledged the issue
- **solved**: Issue has been resolved

Status is currently updated by the **issue author only**.

---

## Categories

Issues are organized into predefined categories (managed by admin):

| Category | Arabic | Icon |
|---|---|---|
| Infrastructure | بنية تحتية | HammerIcon |
| Waste Management | نفايات | TrashIcon |
| Electricity | كهرباء | LightningBoltIcon |
| Traffic | سير | ExclamationTriangleIcon |
| Environment | بيئة | LeafIcon |
| Health | صحة | PlusCircledIcon |

---

## Current Status

The project is **actively in development**. The core feature set is implemented. Several planned features are still placeholder pages.

### ✅ Implemented
- User registration, login, email OTP verification, password reset
- Issue CRUD with image/video uploads to Supabase Storage
- Upvotes (toggle, per-user unique)
- Comments (create, edit, delete own)
- Anonymous posting
- Issue status lifecycle
- Bilingual UI (Arabic + English)
- Interactive map for location

### 🚧 Planned / Not Yet Built
- Polls & Votes
- Announcements feed
- Real-time Community Chat (needs WebSocket / Supabase Realtime)
- District Chat
- Admin panel (category management, issue moderation)
- User profile page
- Push/email notifications for upvotes and comments
- Server-side pagination
