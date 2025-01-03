const express = require('express');
const router = express.Router();
const { authController } = require('../controllers/auth-controller');
const { body } = require('express-validator');

router.post('/register', [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .bail(),
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .bail()
        .isLength({ min: 6, max: 255 }).withMessage('Password must be at least 6 characters long')
        .bail()
        .custom((value, { req }) => {
            if (value !== req.body.confirmPassword) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),
    body('confirmPassword')
        .trim()
        .notEmpty().withMessage('Confirm Password is required')
        .bail(),
], authController.register);


router.post('/login', [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .bail(),
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .bail(),
], authController.login);

module.exports = router;