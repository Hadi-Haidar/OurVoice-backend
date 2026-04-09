const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/db');

// @desc    Middleware la net2akad eza l user 3ando token sahh w logged in
const protect = async (req, res, next) => {
    let token;

    // 1. mnshouf eza l token mawjoud bel headers (Authorization: Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // 2. mnshouf eza l token sahh (verify token)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. mnjib l user mnel database bas bidoun l password
            const { data: user, error } = await supabaseAdmin
                .from('users')
                .select('id, email, full_name, is_verified')
                .eq('id', decoded.id)
                .single();

            if (error || !user) {
                return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
            }

            // 4. mnhamed l user object bel request kermel nest3mlo bel routes l jeye
            req.user = user;
            next();

        } catch (error) {
            console.error(error);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
