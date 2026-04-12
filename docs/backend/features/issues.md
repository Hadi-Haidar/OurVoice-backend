# Issues Feature

## Purpose
The core feature of the platform. Handles all civic issue operations: creating, reading, editing, deleting issues, managing their status, upvoting, commenting, and uploading media.

---

## Files

| File | Role |
|---|---|
| `src/modules/issues/controller.js` | All issue logic |
| `src/modules/issues/routes.js` | Route definitions |
| `src/utils/storage.js` | Supabase Storage upload helper |

---

## Endpoints

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/issues` | Public | List all issues with filters |
| GET | `/api/issues/categories` | Public | Get all categories |
| GET | `/api/issues/:id` | Public | Get issue details + comments |
| POST | `/api/issues` | 🔒 Auth | Create a new issue |
| PATCH | `/api/issues/:id` | 🔒 Author | Edit an issue |
| DELETE | `/api/issues/:id` | 🔒 Author | Delete an issue |
| PATCH | `/api/issues/:id/status` | 🔒 Author | Change issue status |
| POST | `/api/issues/:id/upvote` | 🔒 Auth | Toggle upvote |
| POST | `/api/issues/:id/comments` | 🔒 Auth | Add comment |
| PATCH | `/api/issues/:id/comments/:cid` | 🔒 Comment Author | Edit comment |
| DELETE | `/api/issues/:id/comments/:cid` | 🔒 Comment Author | Delete comment |
| POST | `/api/issues/upload-media` | 🔒 Auth | Upload image/video |

---

## Controllers

### `getAllIssues`
- Supports query filters: `category_id`, `status`, `search`
- Joins: `author`, `category`, `upvotes_count`, `comments_count`
- Ordered by `created_at DESC`
- **Optional auth:** Decodes JWT header (if present) to check `has_upvoted` per issue
- **Anonymity:** If `is_anonymous=true`, replaces `author` with `{ id: null, full_name: "Anonymous" }`
- Transforms Supabase count objects into plain numbers

### `getIssueById`
- Joins: `author`, `category`, full `comments` array (with author), full `upvotes` array
- Calculates `upvotes_count` and `comments_count`
- Sets `has_upvoted` based on `req.user` (if authenticated)
- Applies anonymity mask if `is_anonymous=true`

### `createIssue`
- Required: `title`, `description`, `category_id`, `location_text`
- Optional: `lat`, `lng`, `image_url`, `video_url`, `is_anonymous`
- If a file is attached via multipart: uploads to Supabase Storage via `uploadToSupabase()`
- Sets `author_id = req.user.id`

### `updateIssue`
- Verifies ownership (`author_id === req.user.id`) → 403 if not
- Supports updating all content fields and replacing image

### `deleteIssue`
- Verifies ownership → 403 if not
- Cascade deletes comments and upvotes via DB schema

### `updateIssueStatus`
- Validates status is one of: `pending`, `in_progress`, `solved`
- Verifies ownership → 403 if not

### `toggleUpvote`
- Checks if the user already upvoted this issue
- If yes: deletes the upvote (unvote)
- If no: inserts a new upvote
- Returns `{ upvoted: true/false }`

### `addComment`
- Inserts comment linked to `issue_id` and `author_id = req.user.id`
- Returns the new comment with author info

### `updateComment`
- Verifies comment exists and belongs to this issue
- Verifies ownership → 403 if not
- Updates the text

### `deleteComment`
- Verifies comment exists and belongs to this issue
- Verifies ownership → 403 if not
- Deletes the comment

### `getCategories`
- Fetches all categories ordered alphabetically by `name_en`

### `uploadMedia`
- Accepts file from Multer (in-memory buffer)
- Calls `uploadToSupabase()` → returns public URL
- Used for pre-uploading before issue submission

---

## Database Tables Used
- `issues`
- `categories`
- `issue_comments`
- `issue_upvotes`

## Dependencies Used
- `@supabase/supabase-js` — all DB operations
- `multer` — file upload parsing
- `jsonwebtoken` — optional token decode in public routes

---

## Notes
- The `getAllIssues` route does **optional auth** — it works without a token but enriches the response with `has_upvoted` if a token is provided. This is done by manually decoding the header inside the controller (not using the `protect` middleware).
- Media uploads happen in two modes:
  1. **Pre-upload**: Client calls `/upload-media` first, gets a URL, then includes it in the issue body as `image_url`
  2. **Direct upload**: Client sends image as `multipart/form-data` directly to `POST /issues`
- Status can only be changed by the **issue author** — there is no admin override yet
