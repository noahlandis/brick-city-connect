const { validationResult } = require('express-validator');
const User = require('../models/user');

const authController = {
    register: async (req, res) => {
        console.log("just did register controller");
        await User.create({
            email: req.body.email,
            password: req.body.password
        });
        return res.status(200).json({ message: 'Register controller called' });
    },

    login: (req, res) => {
        console.log("just did login controller");
        return res.status(200).json({ message: 'Login controller called' });
    },

    logout: (req, res) => {
        console.log("just did logout controller");
        return res.status(200).json({ message: 'Logout controller called' });
    }
}

module.exports = {
    authController
}