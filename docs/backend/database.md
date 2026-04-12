# Database Documentation

## Database Type
**PostgreSQL** — hosted and managed by **Supabase**.

Accessed via the Supabase JavaScript client using the **Service Role Key** (admin access — bypasses Row Level Security).

---

## Tables Overview

| Table | Description |
|---|---|
| `users` | Registered citizens |
| `categories` | Issue categories (managed by admin) |
| `issues` | All reported civic issues |
| `issue_comments` | Comments on issues |
| `issue_upvotes` | Upvote records (unique per user per issue) |

---

## Table Definitions

### `users`
Stores citizen accounts. Managed via custom backend logic (not Supabase Auth).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `full_name` | TEXT | Required |
| `email` | TEXT | Required, unique |
| `password` | TEXT | bcrypt hashed |
| `is_verified` | BOOLEAN | Default: `false`. Set to `true` after OTP confirmation |
| `otp_code` | TEXT | 6-digit code, cleared after use |
| `otp_expires_at` | TIMESTAMPTZ | 10 minutes from generation |
| `created_at` | TIMESTAMPTZ | Default: `NOW()` |

---

### `categories`
Predefined issue categories. Seeded on setup, managed by admin.

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL (PK) | Auto-increment |
| `name_en` | TEXT | English name (unique) |
| `name_ar` | TEXT | Arabic name (unique) |
| `icon` | TEXT | Radix UI icon name |
| `created_at` | TIMESTAMPTZ | Default: `NOW()` |

**Seeded categories:**
| English | Arabic | Icon |
|---|---|---|
| Infrastructure | بنية تحتية | HammerIcon |
| Waste Management | نفايات | TrashIcon |
| Electricity | كهرباء | LightningBoltIcon |
| Traffic | سير | ExclamationTriangleIcon |
| Environment | بيئة | LeafIcon |
| Health | صحة | PlusCircledIcon |

---

### `issues`
The core table — every civic issue reported by citizens.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated via `uuid_generate_v4()` |
| `title` | TEXT | Required |
| `description` | TEXT | Required |
| `category_id` | INTEGER (FK → categories) | `ON DELETE SET NULL` |
| `location_text` | TEXT | User-typed location string. Required |
| `lat` | DOUBLE PRECISION | Optional. Latitude for map pin |
| `lng` | DOUBLE PRECISION | Optional. Longitude for map pin |
| `status` | TEXT | Default: `pending`. Values: `pending`, `in_progress`, `solved` |
| `image_url` | TEXT | URL to image in Supabase Storage |
| `video_url` | TEXT | URL to video in Supabase Storage |
| `is_anonymous` | BOOLEAN | Default: `false`. Hides author identity in responses |
| `author_id` | UUID (FK → users) | `ON DELETE CASCADE` |
| `created_at` | TIMESTAMPTZ | Default: `NOW()` |

---

### `issue_comments`
Comments left by citizens on issues.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `issue_id` | UUID (FK → issues) | `ON DELETE CASCADE` |
| `author_id` | UUID (FK → users) | `ON DELETE CASCADE` |
| `text` | TEXT | Required |
| `created_at` | TIMESTAMPTZ | Default: `NOW()` |

---

### `issue_upvotes`
Tracks which user upvoted which issue. Enforces one-upvote-per-user via UNIQUE constraint.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `issue_id` | UUID (FK → issues) | `ON DELETE CASCADE` |
| `user_id` | UUID (FK → users) | `ON DELETE CASCADE` |
| `created_at` | TIMESTAMPTZ | Default: `NOW()` |
| *(unique)* | | `UNIQUE(issue_id, user_id)` |

---

## Relationships

```
users ──< issues          (one user can have many issues)
users ──< issue_comments  (one user can have many comments)
users ──< issue_upvotes   (one user can upvote many issues)
issues ──< issue_comments (one issue can have many comments)
issues ──< issue_upvotes  (one issue can receive many upvotes)
categories ──< issues     (one category contains many issues)
```

---

## Cascade Behavior

When an **issue is deleted**:
- All its comments are automatically deleted (`ON DELETE CASCADE`)
- All its upvotes are automatically deleted (`ON DELETE CASCADE`)

When a **user is deleted**:
- All their issues are deleted (`ON DELETE CASCADE`)
- All their comments are deleted (`ON DELETE CASCADE`)
- All their upvotes are deleted (`ON DELETE CASCADE`)

When a **category is deleted**:
- The `category_id` on its issues is set to `NULL` (`ON DELETE SET NULL`)

---

## Schema File

The full SQL schema is located at:
```
src/db/schema/issues.sql
```

Run it in the Supabase SQL editor to initialize the database.
