const { sendEmail } = require('../services/email-service');
const jwt = require('jsonwebtoken');
// verification-code-controller.js
const verificationCodeController = {
    sendRegisterMagicLink: (req, res) => {

        sendEmail(email, "Continue Sign Up", `Click here to continue signing up: ${url}`);
    },

    sendRegisterMagicLinkCallback: (req, res) => {
    
    }
}

module.exports = {
    verificationCodeController
}