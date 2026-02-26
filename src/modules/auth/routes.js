const express = require('express');
const router = express.Router();

// 3am nimport el functions yalli mn 3eyzinon mnel controller
const { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword } = require('./controller');

// hon mna3ref el routes w mnorbotoun bel functions taba3on
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// mna3mel export lal router
module.exports = router;
