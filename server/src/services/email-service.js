// mailgun setup. Although we can use nodemailer, we want to use mailgun's API in production because it supports tracking
const Mailgun = require('mailgun.js');
const formData = require('form-data');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});

// we use nodemailer for local development so we get emails at localhost:1025
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: 'mailpit',  // Change from 'localhost' to 'mailpit'
    port: 1025,
    secure: false,
});

/**
 * Sends an email to either the recipient or the local mailpit server, depending on the environment.
 * @param {string} recipient - The email address of the recipient.
 * @param {string} subject - The subject of the email.
 * @param {string} text - The body of the email.
 */
function sendEmail(recipient, subject, text) {
    const emailOptions = {
        from: "Brick City Connect <noreply@brickcityconnect.com>",
        to: recipient,
        subject: subject,
        text: text
    };
    if (process.env.ENV === 'local') {
        sendLocalMail(emailOptions);
    } else {
        sendProdMail(emailOptions);
    }
}

function sendProdMail(emailOptions) {
    mg.messages.create('mg.brickcityconnect.com', emailOptions)
    console.log("prod email sent");
}

function sendLocalMail(emailOptions) {
    transporter.sendMail(emailOptions);
    console.log("local email sent");
}

module.exports = { sendEmail };