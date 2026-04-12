# Folder Structure

```
Our-voice Backend/
├── .env                    # Environment variables (not committed)
├── .env.example            # Template for environment variables
├── .gitignore
├── package.json
├── vercel.json             # Vercel deployment config
└── src/
    ├── app.js              # Express app: middleware, routes, global error handler
    ├── server.js           # Starts the HTTP server (listens on PORT)
    │
    ├── config/
    │   └── db.js           # Initializes and exports the Supabase admin client
    │
    ├── middleware/
    │   └── authMiddleware.js  # protect(): verifies JWT and attaches req.user
    │
    ├── modules/
    │   ├── auth/
    │   │   ├── controller.js  # registerUser, loginUser, verifyEmail, forgotPassword, resetPassword
    │   │   └── routes.js      # POST /register, /login, /verify-email, /forgot-password, /reset-password
    │   │
    │   └── issues/
    │       ├── controller.js  # createIssue, getAllIssues, getIssueById, toggleUpvote,
    │       │                  # addComment, updateComment, deleteComment,
    │       │                  # updateIssue, deleteIssue, updateIssueStatus,
    │       │                  # getCategories, uploadMedia
    │       └── routes.js      # All /api/issues routes (public + protected)
    │
    ├── db/
    │   └── schema/
    │       └── issues.sql     # PostgreSQL schema (run in Supabase SQL editor)
    │
    └── utils/
        ├── email.js           # sendEmail({ email, subject, message }) via Nodemailer
        └── storage.js         # uploadToSupabase(buffer, filename, mimetype) → public URL
```

---

## Key Files Explained

### `src/app.js`
The Express application instance. Responsible for:
- Applying global middleware (helmet, cors, express.json)
- Mounting route modules (`/api/auth`, `/api/issues`)
- Defining the global error handler

### `src/server.js`
The entry point. Imports `app` from `app.js` and calls `app.listen(PORT)`.

### `src/config/db.js`
Creates and exports a single `supabaseAdmin` client using the Service Role Key. This bypasses Supabase Row Level Security and gives the backend full DB access.

### `src/middleware/authMiddleware.js`
The `protect` function — a middleware applied to any route that requires authentication. It:
1. Reads the `Authorization: Bearer <token>` header
2. Verifies the JWT using `JWT_SECRET`
3. Fetches the current user from DB
4. Attaches the user to `req.user`

### `src/utils/email.js`
A standalone helper that sends an email using Nodemailer SMTP. Called from the auth controller for OTP delivery.

### `src/utils/storage.js`
A standalone helper that uploads a file Buffer to Supabase Storage and returns the public URL. Used in issue creation/update and the media upload endpoint.

### `src/db/schema/issues.sql`
The SQL schema file for the database. Run this once in the Supabase SQL editor to create all tables and seed categories.
