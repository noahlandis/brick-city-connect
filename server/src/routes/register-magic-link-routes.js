const express = require('express');
const router = express.Router();
const { registerMagicLinkController } = require('../controllers/register-magic-link-controller');
const { body, query } = require('express-validator');

router.post('/send-register-magic-link', body('email').isEmail().withMessage('Please enter a valid email').bail().custom(value => {
  if (!value.endsWith('@rit.edu')) {
    throw new Error('Please enter a valid RIT email');
  }
  return true;
}).withMessage('Please enter a valid RIT email'), registerMagicLinkController.sendRegisterMagicLink);

router.get('/verify-token', query('token').notEmpty().withMessage('Token is required'), registerMagicLinkController.verifyToken);

module.exports = router;