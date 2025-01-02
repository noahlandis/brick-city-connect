const { validationResult } = require('express-validator');
const User = require('../models/user');
const bcrypt = require('bcrypt');


const authController = {
    register: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username, password } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            username: username,
            password: hashedPassword
        });
        return res.status(201).json({ message: 'User created successfully' });
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