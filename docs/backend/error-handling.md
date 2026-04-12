# Error Handling

## Strategy

The backend uses two levels of error handling:

1. **Controller-level try/catch** — each controller function catches its own errors
2. **Global error handler middleware** — catches any unhandled errors passed via `next(err)`

---

## Standard Error Response

All error responses follow this format:

```json
{
  "success": false,
  "message": "Human-readable description of the error."
}
```

In development mode, an additional `error` field may be included with technical details:
```json
{
  "success": false,
  "message": "Server error",
  "error": "relation \"users\" does not exist"
}
```

---

## HTTP Status Codes Used

| Code | Meaning | When Used |
|---|---|---|
| `200` | OK | Successful GET, PATCH, DELETE |
| `201` | Created | Successful POST (new resource created) |
| `400` | Bad Request | Missing fields, invalid input, duplicate email |
| `401` | Unauthorized | Invalid credentials, missing/expired token |
| `403` | Forbidden | Authenticated but not the owner (e.g., editing someone else's issue) |
| `404` | Not Found | Issue, comment, or user not found |
| `500` | Internal Server Error | Unexpected server or database error |

---

## Global Error Handler

Located at the bottom of `src/app.js`:

```js
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
```

This catches any error passed via `next(err)` that was not handled inline.

---

## Controller Pattern

Each controller uses a consistent try/catch:

```js
const createIssue = async (req, res) => {
    try {
        // Validation
        if (!title) {
            return res.status(400).json({ success: false, message: 'Title is required.' });
        }

        // DB operation
        const { data, error } = await supabase.from('issues').insert({...});
        if (error) throw error; // caught by catch block

        return res.status(201).json({ success: true, data });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
```

---

## Ownership Errors

Before modifying or deleting a resource (issue or comment), the controller checks ownership:

```js
if (issue.author_id !== req.user.id) {
    return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this issue.'
    });
}
```

This returns `403 Forbidden` (not `401`) because the user **is** authenticated, but **lacks permission** for this specific resource.

---

## Notes

- There is currently **no centralized validation library** (e.g., Joi, Zod). Validation is done manually in each controller.
- Supabase errors are re-thrown with `throw error` and caught by the outer `catch`, responding with `500`.
- No logging service is used currently — errors are logged to `console.error`.
