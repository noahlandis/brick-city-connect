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
        .notEmpty().withMessage('This field is required')
        .bail()
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .bail()
        .custom((value, { req }) => {
            if (value !== req.body.confirmPassword) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),
    body('confirmPassword')
        .trim()
        .notEmpty().withMessage('This field is required')
        .bail(),
], authController.register);


router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;