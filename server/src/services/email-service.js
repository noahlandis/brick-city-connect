// mailgun setup. Although we can use nodemailer, we want to use mailgun's API in production because it supports tracking
const Mailgun = require('mailgun.js');
const formData = require('form-data');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});
const ejs = require('ejs');
const path = require('path');

// we use nodemailer for local development so we get emails at localhost:1025
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: 'mailpit',  // Change from 'localhost' to 'mailpit'
    port: 1025,
    secure: false,
});

/**
 * Returns the HTML for an email template.
 * @param {string} templateName - The name of the email template.
 * @param {object} data - The data to pass to the email template.
 * @returns {string} - The HTML for the email template.
 */
function getEmailTemplate(templateName, data) {
    const templatePath = path.join(__dirname, '../email-templates', `${templateName}.ejs`);
    return ejs.renderFile(templatePath, data);
}

/**
 * Sends an email to either the recipient or the local mailpit server, depending on the environment.
 * @param {string} recipient - The email address of the recipient.
 * @param {string} subject - The subject of the email.
 * @param {string} text - The body of the email.
 * @param {string} html - The HTML body of the email.
 */
function sendEmail(recipient, subject, text, html) {
    const emailOptions = {
        from: "Brick City Connect <noreply@brickcityconnect.com>",
        to: recipient,
        subject: subject,
        text: text,
        html: html
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

module.exports = { sendEmail, getEmailTemplate };