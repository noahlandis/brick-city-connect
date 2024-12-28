const express = require('express');
const router = express.Router();
const { registerMagicLinkController } = require('./controllers/register-magic-link-controller');

router.post('/send-register-magic-link', registerMagicLinkController.sendRegisterMagicLink);
router.get('/verify-token', registerMagicLinkController.verifyToken);

module.exports = router;