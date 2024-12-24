const express = require('express');
const router = express.Router();
const { verificationCodeController } = require('./controllers/verification-code-controller');

router.post('/send-register-magic-link', verificationCodeController.sendRegisterMagicLink);
router.get('/send-register-magic-link/callback', verificationCodeController.sendRegisterMagicLinkCallback);

module.exports = router;