const express = require('express');
const router = express.Router();
const { verificationCodeController } = require('./controllers/verification-code-controller');

router.post('/verify-email', verificationCodeController.sendVerificationCode);

module.exports = router;