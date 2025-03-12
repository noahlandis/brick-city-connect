const { User } = require('../models/index');
const { sendEmail, getEmailTemplate } = require('../services/email-service');

async function sendUpcomingChatNotification() {
    try {
        const users = await User.findAll();

        const emailHtml = await getEmailTemplate('upcoming-chat', {
            url: process.env.FRONTEND_URL
        });

        const plainText = `The next chat is about to begin. Click here to join: ${process.env.FRONTEND_URL}`;

        for (const user of users) {
            try {
                await sendEmail(
                    user.username + '@rit.edu',
                    'Chat Starts Soon!',
                    plainText,
                    emailHtml
                );
            } catch (error) {
                console.error('Error sending notification:', error);
            }
            console.log(`Email sent to ${user.username}`);
        }
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

// Run the function
sendUpcomingChatNotification();
