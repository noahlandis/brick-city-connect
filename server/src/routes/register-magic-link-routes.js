const express = require('express');
const router = express.Router();
const { registerMagicLinkController } = require('../controllers/register-magic-link-controller');
const { body, query } = require('express-validator');

router.post('/send-register-magic-link', 
  body('username')
    .trim()
    .notEmpty()
    .withMessage('RIT Username is required')
    .bail()
    .customSanitizer(value => `${value}@rit.edu`)
    .bail()
    .isEmail()
    .withMessage("We didn't recognize that email"),
  registerMagicLinkController.sendRegisterMagicLink
);

router.get('/verify-token', query('token').notEmpty().withMessage('Token is required'), registerMagicLinkController.verifyToken);

module.exports = router;