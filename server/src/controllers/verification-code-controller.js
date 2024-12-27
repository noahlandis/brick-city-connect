const { sendEmail } = require('../services/email-service');

// verification-code-controller.js
const verificationCodeController = {
    sendRegisterMagicLink: (req, res) => {
        // we are gonna want to check if email is valid and is an RIT email. 
        // For the magic link, do we use JWT or store token in Database?
        // We also need to make sure registration page is only accessible if user came from callback. How should we acomplish this?
        const email = req.body.email;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const url = `http://localhost:3000/send-register-magic-link/callback`;
        sendEmail(email, "Continue Sign Up", `Click here to continue signing up: ${url}`);
    },

    sendRegisterMagicLinkCallback: (req, res) => {
        // we only want to redirect here if the user came from the sendRegisterMagicLink endpoint
        return res.redirect(`${process.env.FRONTEND_URL}/register`);
    }
}

module.exports = {
    verificationCodeController
}