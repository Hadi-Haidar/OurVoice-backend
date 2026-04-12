# Auth Feature

## Purpose
Handles all user identity operations: account registration, email verification via OTP, login with JWT, forgot password, and password reset.

---

## Files

| File | Role |
|---|---|
| `src/modules/auth/controller.js` | All auth logic |
| `src/modules/auth/routes.js` | Route definitions |
| `src/middleware/authMiddleware.js` | JWT guard middleware |
| `src/utils/email.js` | Email sending utility |

---

## Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new citizen account |
| POST | `/api/auth/verify-email` | Confirm email with OTP code |
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/forgot-password` | Request OTP for password reset |
| POST | `/api/auth/reset-password` | Submit OTP + new password |

All auth endpoints are **public** (no token required).

---

## Controllers

### `registerUser`
1. Validate `full_name`, `email`, `password` (min 6 chars)
2. Check email is not already taken
3. Hash password with bcrypt (salt: 10)
4. Generate 6-digit OTP, set expiry to 10 minutes
5. Insert user into `users` table with `is_verified: false`
6. Send OTP email via `sendEmail()`
7. Return success (no token at this stage)

### `verifyEmail`
1. Find user by email
2. Confirm not already verified
3. Check OTP matches and is not expired
4. Update user: `is_verified = true`, clear OTP fields
5. Return success

### `loginUser`
1. Find user by email
2. Block if `is_verified === false`
3. Compare password with bcrypt hash
4. Sign JWT with `{ id, email }` payload
5. Remove sensitive fields (`password`, `otp_code`, `otp_expires_at`) from response
6. Return `{ token, user }`

### `forgotPassword`
1. Find user by email
2. Generate new OTP + expiry
3. Update user record with new OTP fields
4. Send OTP email
5. Return success

### `resetPassword`
1. Find user by email
2. Verify OTP matches and is not expired
3. Hash new password
4. Update user: new hashed password, clear OTP fields
5. Return success

---

## Database Tables Used
- `users`

## Dependencies Used
- `bcryptjs` — password hashing
- `jsonwebtoken` — JWT generation (login)
- `nodemailer` — OTP email sending
- `@supabase/supabase-js` — DB queries

---

## Notes
- No refresh token is implemented — tokens expire based on `JWT_EXPIRES_IN`
- OTPs are shared for both email verification and password reset (same `otp_code` field on user)
- Sensitive fields are always stripped before returning the user object
- Login is gated behind email verification — unverified users cannot log in
