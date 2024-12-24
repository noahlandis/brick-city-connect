const { sendEmail } = require('../services/email-service');

// verification-code-controller.js
const verificationCodeController = {
    sendVerificationCode: (req, res) => {
        sendEmail("noahlandis980@gmail.com", "Your Verification Code", "This is a test email from brick city connect");
    }
}

module.exports = {
    verificationCodeController
}