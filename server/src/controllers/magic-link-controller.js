const { sendEmail } = require('../services/email-service');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const { getEmailTemplate } = require('../services/email-service');
// register-magic-link-controller.js
const magicLinkController = {
    sendRegisterMagicLink: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("the errors are", errors);
            return res.status(400).json({ error: errors.array()[0].msg });
        }
     
        const email = req.body.username;
        const username = email.split('@')[0];
        const existingUser = await User.findOne({ where: { username: username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Account already exists' });
        }

        const token = jwt.sign(
            { username: username, type: 'register' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '5m' }  // Token expires in 5 minutes
        );
        const url = `${process.env.FRONTEND_URL}/register/callback?token=${token}`;
        const html = await getEmailTemplate('register-email', { url });
        sendEmail(email, "Continue Sign Up", `Click here to finish creating your Brick City Connect account: ${url}`, html);
        return res.status(200).json({ message: 'Magic link sent' });
       
    },

    sendForgotPasswordMagicLink: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("the errors are", errors);
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        const email = req.body.username;
        const username = email.split('@')[0];
        const existingUser = await User.findOne({ where: { username: username } });
        if (!existingUser) {
            return res.status(400).json({ error: 'We couldn\'t find an account with that username.' });
        }

        const token = jwt.sign(
            { username: username, type: 'reset-password' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '5m' }  // Token expires in 5 minutes
        );
        const url = `${process.env.FRONTEND_URL}/forgot-password/callback?token=${token}`;
        const html = await getEmailTemplate('forgot-password-email', { url });
        sendEmail(email, "Reset Password", `Click here to reset your password: ${url}`, html);
        return res.status(200).json({ message: 'Magic link sent' });
    },

    verifyToken: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("the errors are", errors);
            return res.status(401).json({ error: errors.array()[0].msg });
        }

        
        const { token, type } = req.query;

        try {
            // Verify the token using the same secret used to sign it
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.type !== type) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
            
            // You can pass the email to the frontend as a query parameter if needed
            return res.status(200).json({ username: decoded.username });
        } catch (error) {
            // Token is invalid or expired
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    }
}

module.exports = {
    magicLinkController
}