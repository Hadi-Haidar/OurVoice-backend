const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// 3am nimport el routes taba3 el auth
const authRoutes = require('./modules/auth/routes');
const issueRoutes = require('./modules/issues/routes');

const app = express();

// Security Headers
app.use(helmet());

// hon mnrakeb el middlewares
app.use(express.json({ limit: '10mb' })); // Lowered limit for production safety
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// la nesta2bel requests men l frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));

// hon mnwasel el routes bl app
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

// el route l asesi bas la nt2akad el server byshtghel
app.get('/', (req, res) => {
    res.send('Your Express Server is running with Domain-Driven Structure! 🚀');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        // Only show error stack in development
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// mna3mel export lal app la nesta3mela bi server.js
module.exports = app;

