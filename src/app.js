const express = require('express');
const cors = require('cors');

// 3am nimport el routes taba3 el auth
const authRoutes = require('./modules/auth/routes');

const app = express();

// hon mnrakeb el middlewares
app.use(express.json());
// la nesta2bel requests men l frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
}));

// hon mnwasel el routes bl app
app.use('/api/auth', authRoutes);

// el route l asesi bas la nt2akad el server byshtghel
app.get('/', (req, res) => {
    res.send('Your Express Server is running with Domain-Driven Structure! 🚀');
});

// mna3mel export lal app la nesta3mela bi server.js
module.exports = app;
