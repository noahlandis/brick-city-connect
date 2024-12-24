const { sendEmail } = require('../services/email-service');
const jwt = require('jsonwebtoken');
// verification-code-controller.js
const verificationCodeController = {
    sendRegisterMagicLink: (req, res) => {
        const email = req.body.email;
        // generate a jwt with the user's email
        const token = jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const url = `http://localhost:3000/send-register-magic-link/callback?token=${token}`;
        sendEmail(email, "Continue Sign Up", `Click here to continue signing up: ${url}`);
    },

    sendRegisterMagicLinkCallback: (req, res) => {
        const token = req.query.token;
        const email = jwt.verify(token, process.env.JWT_SECRET).email;
        console.log("verified email");
        console.log(email);
        res.send("Email verified");
    }
}

module.exports = {
    verificationCodeController
}