const express = require('express');
const router = express.Router();
const { magicLinkController } = require('../controllers/magic-link-controller');
const { body, query } = require('express-validator');
const validateRequest = require('../middleware/validate-request');
require('dotenv').config({ path: '../.env' });

router.post('/send-register-magic-link', 
  body('username')
    .trim()
    .notEmpty()
    .withMessage('RIT Username is required')
    .bail()
    .customSanitizer(value => {
      if (process.env.WHITELIST_EMAILS.split(',').includes(value)) {
        return value;
      }
      return `${value}@rit.edu`;
    })
    .bail()
    .isEmail()
    .withMessage("We didn't recognize that email"),
  validateRequest,
  magicLinkController.sendRegisterMagicLink
);

router.post('/send-forgot-password-magic-link', 
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .bail()
    .customSanitizer(value => `${value}@rit.edu`)
    .bail()
    .isEmail()
    .withMessage("We didn't recognize that email"),
  validateRequest,
  magicLinkController.sendForgotPasswordMagicLink
);

router.get('/verify-token', query('token').notEmpty().withMessage('Token is required'), magicLinkController.verifyToken);

module.exports = router;