const { validationResult } = require('express-validator');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

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
        if (!user || !(await user.validatePassword(password))) {
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
    }
}

module.exports = {
    authController
}