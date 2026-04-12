# Backend Dependencies

All packages used in the backend, what they do, where they are used, and how.

---

## express
### Purpose
The core HTTP server framework. Used to define routes, middleware, and handle requests/responses.

### Where it is used
- `src/app.js` — app setup, middleware registration, route mounting
- `src/modules/auth/routes.js`
- `src/modules/issues/routes.js`

### Example
```js
const app = express();
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
```

---

## @supabase/supabase-js
### Purpose
The official Supabase JavaScript client. Used to interact with the PostgreSQL database (select, insert, update, delete) and to upload files to Supabase Storage.

### Where it is used
- `src/config/db.js` — client initialization with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `src/modules/auth/controller.js` — user queries
- `src/modules/issues/controller.js` — issues, comments, upvotes queries
- `src/utils/storage.js` — file upload to bucket

### Example
```js
const { data, error } = await supabaseAdmin
    .from('issues')
    .select('*, author:author_id (id, full_name)')
    .order('created_at', { ascending: false });
```

---

## jsonwebtoken
### Purpose
Creates and verifies JWT tokens for stateless authentication. A token is signed on login and sent to the client, then verified on every protected request.

### Where it is used
- `src/modules/auth/controller.js` — `jwt.sign()` on login
- `src/middleware/authMiddleware.js` — `jwt.verify()` on protected routes
- `src/modules/issues/controller.js` — optional token decode on public routes

### Example
```js
// Sign (on login)
const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
);

// Verify (in middleware)
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = { id: decoded.id };
```

---

## bcryptjs
### Purpose
Hashes passwords before storing them in the database and compares plain passwords against stored hashes during login.

### Where it is used
- `src/modules/auth/controller.js` — `bcrypt.hash()` on register, `bcrypt.compare()` on login and reset password

### Example
```js
// Hash
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Compare
const isMatch = await bcrypt.compare(password, user.password);
```

---

## nodemailer
### Purpose
Sends transactional emails via SMTP. Currently used exclusively to send OTP codes for email verification and password reset.

### Where it is used
- `src/utils/email.js` — the main `sendEmail()` helper function
- `src/modules/auth/controller.js` — called in `registerUser` and `forgotPassword`

### Example
```js
await sendEmail({
    email: user.email,
    subject: 'Our Voice - Account Verification Code',
    message: `Your 6-digit code is: ${otpCode}`
});
```

---

## multer
### Purpose
Parses `multipart/form-data` requests (file uploads). Files are held in memory (as Buffer) and then forwarded to Supabase Storage.

### Where it is used
- `src/modules/issues/routes.js` — `upload.single('file')` middleware on upload-media route and `upload.single('image_url')` on create/update issue

### Example
```js
const upload = multer({ storage: multer.memoryStorage() });
router.post('/upload-media', protect, upload.single('file'), uploadMedia);
```

---

## helmet
### Purpose
Sets secure HTTP response headers automatically to protect against common web vulnerabilities (XSS, clickjacking, MIME sniffing, etc.).

### Where it is used
- `src/app.js` — applied globally

### Example
```js
app.use(helmet());
```

---

## cors
### Purpose
Allows the frontend (on a different origin) to make requests to the backend. Restricted to the `FRONTEND_URL` environment variable.

### Where it is used
- `src/app.js` — applied globally

### Example
```js
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
```

---

## dotenv
### Purpose
Loads environment variables from the `.env` file into `process.env`.

### Where it is used
- `src/server.js` — loaded at startup

### Example
```js
require('dotenv').config();
const secret = process.env.JWT_SECRET;
```

---

## nodemon *(dev only)*
### Purpose
Automatically restarts the server when source files change. Only used in development.

### Where it is used
- `npm run dev` script

### Example
```bash
nodemon src/server.js
```
