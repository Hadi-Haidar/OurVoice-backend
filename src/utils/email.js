const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1) hon mna3mel transporter byeshtghel ma3 serveret l SMTP taba3 Google
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    // 2) mnhaded el ma3loumet taba3 l email
    const mailOptions = {
        from: `Our Voice <${process.env.SMTP_EMAIL}>`,
        to: options.email,            // l email te3 l user
        subject: options.subject,      // 3enwen l email
        text: options.message,         // el resele yalli b2alba l OTP
    };

    // 3) mnba3at l email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
