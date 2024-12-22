// mailgun setup
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});

// verification-code-controller.js
const verificationCodeController = {
    sendVerificationCode: (req, res) => {
        console.log("sendVerificationCode was hit. sending email...");
        mg.messages.create('mg.brickcityconnect.com', {
            from: "Brick City Connect <noreply@brickcityconnect.com>",
            to: "noahlandis980@gmail.com", // Replace with the recipient's email
            subject: "Your Verification Code",
            text: "This is a test email from brick city connect",
        })
        console.log("email sent");
    }
}

module.exports = {
    verificationCodeController
}