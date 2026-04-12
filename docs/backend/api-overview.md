# API Overview

## Base URL

| Environment | URL |
|---|---|
| Development | `http://localhost:5000/api` |
| Production | `https://<your-backend>.vercel.app/api` |

---

## Authentication

Protected routes require a **Bearer token** in the `Authorization` header.

```
Authorization: Bearer <jwt_token>
```

The token is returned from `POST /auth/login`.

Tokens expire based on the `JWT_EXPIRES_IN` environment variable (default: `1d`).

---

## Response Format

All responses follow this structure:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Success (message only)
{
  "success": true,
  "message": "Action completed successfully."
}

// Error
{
  "success": false,
  "message": "Human-readable error message."
}
```

---

## Auth Endpoints (`/api/auth`)

### `POST /auth/register`
Register a new user. Sends an OTP to the provided email.

**Body:**
```json
{
  "full_name": "Ali Haidar",
  "email": "ali@example.com",
  "password": "secret123"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "User registered successfully! Please check your email for the verification code."
}
```

---

### `POST /auth/verify-email`
Confirm the user's email using the 6-digit OTP.

**Body:**
```json
{
  "email": "ali@example.com",
  "otp_code": "482910"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Email successfully verified! You can now log in."
}
```

---

### `POST /auth/login`
Login with email and password. Returns a JWT token and user object.

**Body:**
```json
{
  "email": "ali@example.com",
  "password": "secret123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "full_name": "Ali Haidar",
    "email": "ali@example.com",
    "is_verified": true,
    "created_at": "2026-04-01T..."
  }
}
```

---

### `POST /auth/forgot-password`
Request a password reset OTP. Sends OTP to user's email.

**Body:**
```json
{
  "email": "ali@example.com"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Password reset OTP sent to email."
}
```

---

### `POST /auth/reset-password`
Reset password using the OTP.

**Body:**
```json
{
  "email": "ali@example.com",
  "otp_code": "739021",
  "new_password": "newSecret456"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Password successfully reset! You can now log in with your new password."
}
```

---

## Issues Endpoints (`/api/issues`)

### `GET /issues`
Get all issues. Supports optional query filters. Public.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `category_id` | number | Filter by category |
| `status` | string | Filter by status (`pending`, `in_progress`, `solved`) |
| `search` | string | Search in title, description, location |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Pothole on Hamra Street",
      "description": "...",
      "location_text": "Beirut, Hamra",
      "lat": 33.8938,
      "lng": 35.5018,
      "status": "pending",
      "image_url": "https://...",
      "is_anonymous": false,
      "upvotes": 12,
      "comments": 4,
      "has_upvoted": false,
      "author": { "id": "uuid", "full_name": "Ali Haidar" },
      "category": { "id": 1, "name_en": "Infrastructure", "name_ar": "بنية تحتية" },
      "created_at": "2026-04-01T..."
    }
  ]
}
```

> **Note:** If `is_anonymous=true`, the `author` field becomes `{ id: null, full_name: "Anonymous" }`.

---

### `GET /issues/categories`
Get all categories sorted alphabetically. Public.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "id": 3, "name_en": "Electricity", "name_ar": "كهرباء", "icon": "LightningBoltIcon" },
    ...
  ]
}
```

---

### `GET /issues/:id`
Get full details of a single issue including comments and upvote count. Public.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "upvotes": 12,
    "upvotes_count": 12,
    "has_upvoted": true,
    "comments": [
      {
        "id": "uuid",
        "text": "This is a known problem.",
        "created_at": "...",
        "author": { "id": "uuid", "full_name": "Sara K." }
      }
    ],
    ...
  }
}
```

---

### `POST /issues` 🔒
Create a new issue. Supports `multipart/form-data` for image upload.

**Body (form-data or JSON):**
```
title         (required)
description   (required)
category_id   (required)
location_text (required)
lat           (optional)
lng           (optional)
image_url     (optional, URL string if pre-uploaded)
video_url     (optional)
is_anonymous  (optional, boolean, default: false)
```

**Response `201`:**
```json
{
  "success": true,
  "data": { /* newly created issue object */ }
}
```

---

### `POST /issues/upload-media` 🔒
Upload an image or video to Supabase Storage and get back a public URL.

**Body (form-data):**
```
file  (required, file)
```

**Response `200`:**
```json
{
  "success": true,
  "url": "https://supabase.io/storage/v1/object/public/..."
}
```

---

### `PATCH /issues/:id` 🔒 *(Author only)*
Update an existing issue's content. Same body fields as `POST /issues`.

**Response `200`:**
```json
{
  "success": true,
  "data": { /* updated issue */ }
}
```

---

### `PATCH /issues/:id/status` 🔒 *(Author only)*
Update the status of an issue.

**Body:**
```json
{
  "status": "in_progress"
}
```

Valid values: `pending`, `in_progress`, `solved`

**Response `200`:**
```json
{
  "success": true,
  "data": { /* updated issue */ }
}
```

---

### `DELETE /issues/:id` 🔒 *(Author only)*
Delete an issue and all its comments/upvotes (via cascade).

**Response `200`:**
```json
{
  "success": true,
  "message": "Issue deleted successfully."
}
```

---

### `POST /issues/:id/upvote` 🔒
Toggle upvote on an issue. Adds upvote if not present, removes if already upvoted.

**Response `200` (removed):**
```json
{ "success": true, "message": "Upvote removed", "upvoted": false }
```

**Response `201` (added):**
```json
{ "success": true, "message": "Upvote added", "upvoted": true }
```

---

### `POST /issues/:id/comments` 🔒
Add a comment to an issue.

**Body:**
```json
{ "text": "I've noticed this too!" }
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "text": "I've noticed this too!",
    "created_at": "...",
    "author": { "id": "uuid", "full_name": "Ali Haidar" }
  }
}
```

---

### `PATCH /issues/:id/comments/:comment_id` 🔒 *(Comment author only)*
Edit a comment.

**Body:**
```json
{ "text": "Updated comment text." }
```

**Response `200`:**
```json
{ "success": true, "data": { /* updated comment */ } }
```

---

### `DELETE /issues/:id/comments/:comment_id` 🔒 *(Comment author only)*
Delete a comment.

**Response `200`:**
```json
{ "success": true, "message": "Comment deleted successfully." }
```
