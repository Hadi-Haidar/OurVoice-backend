# Authentication System

## Purpose
Handles all user identity operations: registration, email verification, login, and password reset.

All authentication uses a **custom JWT-based system** (not Supabase Auth). Passwords are hashed with bcrypt and stored in the `users` table.

---

## Files

| File | Role |
|---|---|
| `src/modules/auth/controller.js` | Auth business logic |
| `src/modules/auth/routes.js` | Route definitions |
| `src/middleware/authMiddleware.js` | JWT verification guard |
| `src/utils/email.js` | Nodemailer email sender |

---

## OTP System

OTPs are used in two flows:
1. **Email verification** (after registration)
2. **Password reset** (forgot password)

Properties:
- 6-digit numeric code: `Math.floor(100000 + Math.random() * 900000)`
- Expires in **10 minutes**
- Stored in `users.otp_code` and `users.otp_expires_at`
- Cleared from DB after use (`set to null`)

---

## Registration Flow

```
1. Client sends: { full_name, email, password }
2. Validate: all fields present, password >= 6 chars
3. Check: email not already registered
4. Hash password with bcrypt (salt rounds: 10)
5. Generate 6-digit OTP + expiry (10 min)
6. Insert new user into `users` table with is_verified: false
7. Send OTP via email using Nodemailer
8. Return success (no token yet — user must verify first)
```

---

## Email Verification Flow

```
1. Client sends: { email, otp_code }
2. Find user by email
3. Check: user is not already verified
4. Check: OTP matches
5. Check: OTP not expired (otp_expires_at > now)
6. Update user: is_verified = true, otp_code = null, otp_expires_at = null
7. Return success — user can now log in
```

---

## Login Flow

```
1. Client sends: { email, password }
2. Find user by email
3. Check: user exists
4. Check: is_verified === true (block unverified accounts)
5. Compare password with bcrypt hash
6. Sign JWT: { id, email } + JWT_SECRET, expires in JWT_EXPIRES_IN
7. Remove sensitive fields (password, otp_code, otp_expires_at) from user object
8. Return: { token, user }
```

---

## Forgot Password Flow

```
1. Client sends: { email }
2. Find user by email
3. Generate new 6-digit OTP + expiry (10 min)
4. Update user: otp_code + otp_expires_at
5. Send OTP via email
6. Return success
```

---

## Reset Password Flow

```
1. Client sends: { email, otp_code, new_password }
2. Validate: all fields present, new_password >= 6 chars
3. Find user by email
4. Check: OTP matches
5. Check: OTP not expired
6. Hash new password with bcrypt
7. Update user: password = hashed, otp_code = null, otp_expires_at = null
8. Return success — user can now log in with new password
```

---

## authMiddleware (protect)

The `protect` middleware is applied to any route that requires a logged-in user.

**How it works:**
```js
// 1. Extract token from Authorization header
const token = req.headers.authorization.split(' ')[1]; // Bearer <token>

// 2. Verify the JWT
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// 3. Fetch full user from DB (to get latest data)
const user = await supabase.from('users').select('*').eq('id', decoded.id).single();

// 4. Attach to request
req.user = user;
```

If verification fails (missing token, invalid token, expired token), responds with `401 Unauthorized`.

---

## Security Notes

- Passwords are **never returned** in API responses (deleted before `res.json()`)
- OTP codes are **never returned** in API responses
- Login is **blocked** for unverified accounts
- The JWT payload only contains `id` and `email` (minimal exposure)
- Tokens expire — no refresh token mechanism yet
