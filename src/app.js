const express = require('express');
const cors = require('cors');

// 3am nimport el routes taba3 el auth
const authRoutes = require('./modules/auth/routes');
const issueRoutes = require('./modules/issues/routes');

const app = express();

// hon mnrakeb el middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// la nesta2bel requests men l frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
}));

// hon mnwasel el routes bl app
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

// el route l asesi bas la nt2akad el server byshtghel
app.get('/', (req, res) => {
    res.send('Your Express Server is running with Domain-Driven Structure! 🚀');
});

// mna3mel export lal app la nesta3mela bi server.js
module.exports = app;
