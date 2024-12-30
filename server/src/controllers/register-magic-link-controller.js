const { sendEmail } = require('../services/email-service');
const jwt = require('jsonwebtoken');

// register-magic-link-controller.js
const registerMagicLinkController = {
    sendRegisterMagicLink: (req, res) => {
        // we are gonna want to check if email is valid and is an RIT email. 
        // For the magic link, do we use JWT or store token in Database?
        // We also need to make sure registration page is only accessible if user came from callback. How should we acomplish this?
        const email = req.body.email;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        if (!email.endsWith('@rit.edu')) {
            return res.status(400).json({ error: 'Please enter a valid RIT email' });
        }
        const token = jwt.sign(
            { email: email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '5m' }  // Token expires in 5 minutes
        );
        const url = `${process.env.FRONTEND_URL}/register?token=${token}`;
        sendEmail(email, "Continue Sign Up", `Click here to continue signing up: ${url}`);
    },

    verifyToken: (req, res) => {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        try {
            // Verify the token using the same secret used to sign it
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // You can pass the email to the frontend as a query parameter if needed
            return res.status(200).json({ email: decoded.email });
        } catch (error) {
            // Token is invalid or expired
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    }
}

module.exports = {
    registerMagicLinkController
}