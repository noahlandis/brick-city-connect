const express = require('express');
const router = express.Router();
const { authController } = require('../controllers/auth-controller');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validate-request');

router.post('/register', [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .bail(),
    body('password')
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
        .notEmpty().withMessage('Confirm Password is required')
        .bail(),
    validateRequest,
], authController.register);


router.post('/login', [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .bail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .bail(),
    validateRequest,
], authController.login);

router.put('/reset-password', [
    body('password')
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
        .notEmpty().withMessage('Confirm Password is required')
        .bail(),
    validateRequest,
], authController.resetPassword);

router.post('/google-callback', authController.googleCallback);


module.exports = router;