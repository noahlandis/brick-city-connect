const { validationResult } = require('express-validator');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authController = {
    register: async (req, res) => {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ where: { username: username } });
        if (existingUser) {
            return res.status(400).json({ errors: [{ msg: 'Account already exists', path: 'username' }] });
        }
        const user = await User.create({
            username: username,
            password: password
        });
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        return res.status(201).json({ message: 'User created successfully', token });
    },

    login: async (req, res) => {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username: username }});
        if (!user || !user.password || !(await user.validatePassword(password))) {
            return res.status(401).json({
                errors: [
                    { msg: 'Invalid username or password', path: 'username' },
                    { msg: 'Invalid username or password', path: 'password' }
                ]
            });
        }
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        return res.status(200).json({ message: 'Login successful', token });
    },

    resetPassword: async (req, res) => {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username: username } });
        if (!user) {
            return res.status(404).json({ errors: [{ msg: 'User not found', path: 'username' }] });
        }
        await user.update({ password: password });
        return res.status(200).json({ message: 'Password reset successful' });
    },

    googleCallback: async (req, res) => {
        const { code } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: code,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, hd } = payload;
        if (hd !== 'rit.edu' && hd !== 'g.rit.edu') {
            return res.status(401).json({ errors: [{ msg: 'You must sign in with a RIT email', path: 'email' }] });
        }
        const username = email.split('@')[0];
        let user = await User.findOne({ where: { username: username } });

        if (user) {
            // if the user has a googleId and it is not the same as the googleId from the payload, something is wrong
            if (user.googleId && user.googleId !== googleId) {
                return res.status(401).json({ errors: [{ msg: 'You must sign in with a RIT email', path: 'email' }] });
            }
            else {
                // in this case, the user manually signed up so we just update the googleId
                user.googleId = googleId;
                await user.save();
            }
        }
        else {
            // if the user does not exist, we create a new user
            user = await User.create({
                username: username,
                googleId: googleId
            });
        }
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        return res.status(200).json({ message: 'Google callback successful', token });
    }
}

module.exports = {
    authController
}