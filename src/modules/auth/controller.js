const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../../config/db');
const sendEmail = require('../../utils/email');

// @desc    Register a new user (la n2ayed user jdid)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        // 1. la nt2akad eza l user dakhal el ma3loumet l matloube
        if (!full_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide full_name, email, and password.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        // 2. mnshouf eza l user mawjoud aslan bi Supabase
        // (hasab l email taba3o)
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
        }

        // 3. hon bmshafer l password kermel l security bi bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. hon mna3mel generate la OTP men 6 arkam
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // mnhaded wa2et expire lal OTP ba3ed 10 da2aye2 men halla2
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // 5. mndakhel el user l jdid 3al database
        const { data: newUser, error } = await supabaseAdmin.from('users').insert({
            full_name,
            email,
            password: hashedPassword,
            otp_code: otpCode,
            otp_expires_at: otpExpiresAt,
            is_verified: false
        }).select().single();

        if (error) {
            throw error; // mnkhalli el catch block yestelmol error eza sar chi
        }

        // 6. mnba3at el OTP code bel email 
        const message = `Hi ${full_name},\n\nWelcome to Our Voice! Your 6-digit verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nThank you!`;
        await sendEmail({
            email: newUser.email,
            subject: 'Our Voice - Account Verification Code',
            message: message
        });

        // 7. mnraje3 success response la nbayen eno mshi l hal
        return res.status(201).json({
            success: true,
            message: 'User registered successfully! Please check your email for the verification code.'
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Login a user (la ysajel doukhoul l user)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. la nt2akad mnel input
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        // 2. mnfattesh 3al user bel database
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        // eza l user mesh mawjoud aw fih error bel database
        if (error || !user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // 3. mnemna3 l login eza l email mesh m2akad
        if (!user.is_verified) {
            return res.status(401).json({ success: false, message: 'Please verify your email address before logging in.' });
        }

        // 4. mnkaren l password yalli dakhala w yalli mshafera
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // 5. mna3mel generate lal JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email }, // hon l payload yalli bykoun mkhaba bl token
            process.env.JWT_SECRET,             // l secret yalli mnsta3mela lal token
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } // wa2et l expiry te3o
        );

        // 6. mnshil l ma3loumet l haseese abel ma nb3at l user l resp
        delete user.password;
        delete user.otp_code;
        delete user.otp_expires_at;

        // 7. mnraje3 response eno kelshi tamam
        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
            user
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Verify user email with OTP (n2aked el email bel OTP)
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
    try {
        const { email, otp_code } = req.body;

        if (!email || !otp_code) {
            return res.status(400).json({ success: false, message: 'Please provide email and otp_code.' });
        }

        // 1. mnfattesh 3al user hasab l email
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(400).json({ success: false, message: 'User not found.' });
        }

        // 2. nt2akad eza l user m2akad aslan
        if (user.is_verified) {
            return res.status(400).json({ success: false, message: 'User is already verified.' });
        }

        // 3. nt2akad eza l OTP byenmotabe2
        if (user.otp_code !== otp_code) {
            return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
        }

        // 4. nt2akad eza l OTP ba3do shaghal (not expired)
        const now = new Date();
        const expiresAt = new Date(user.otp_expires_at);
        if (now > expiresAt) {
            return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new one.' });
        }

        // 5. mna3mela update lal user ysir verified wa mnshil l OTP
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                is_verified: true,
                otp_code: null,
                otp_expires_at: null
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        return res.status(200).json({
            success: true,
            message: 'Email successfully verified! You can now log in.'
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Forgot Password (ntale3 OTP jdid lal nesyen el password)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide an email.' });
        }

        // 1. mnfattesh 3al user hasab l email
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(400).json({ success: false, message: 'User not found.' });
        }

        // 2. mna3mel generate la OTP jdid lal password reset
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // 3. mnhot l OTP l jdid lal user
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                otp_code: otpCode,
                otp_expires_at: otpExpiresAt
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        // 4. mnba3at el OTP bel email
        const message = `Hi ${user.full_name},\n\nYou requested a password reset. Your 6-digit verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nThank you!`;
        await sendEmail({
            email: user.email,
            subject: 'Our Voice - Password Reset Code',
            message: message
        });

        // 5. mnraje3 success response
        return res.status(200).json({
            success: true,
            message: 'Password reset OTP sent to email.'
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Reset Password with OTP (nghayer l password)
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { email, otp_code, new_password } = req.body;

        if (!email || !otp_code || !new_password) {
            return res.status(400).json({ success: false, message: 'Please provide email, otp_code, and new_password.' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        // 1. mnfattesh 3al user hasab l email
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(400).json({ success: false, message: 'User not found.' });
        }

        // 2. nt2akad eza l OTP byenmotabe2
        if (user.otp_code !== otp_code) {
            return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
        }

        // 3. nt2akad eza l OTP sahhih w mesh expired
        const now = new Date();
        const expiresAt = new Date(user.otp_expires_at);
        if (now > expiresAt) {
            return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new one.' });
        }

        // 4. bmshafer l password l jdid
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        // 5. mn8ayer l password w mnshil l OTP
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                password: hashedPassword,
                otp_code: null,
                otp_expires_at: null
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        return res.status(200).json({
            success: true,
            message: 'Password successfully reset! You can now log in with your new password.'
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get current logged-in user (njib l user l halli logged in)
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        // req.user is populated by the protect middleware
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name, is_verified, created_at')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
    getMe
};
