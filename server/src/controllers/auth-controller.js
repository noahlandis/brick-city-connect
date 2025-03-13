const { validationResult } = require('express-validator');
const { User } = require('../models/index');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { generateToken } = require('../services/jwt-service');
const { getUserWithBackgrounds, giveUserSignUpBackground } = require('../services/user-service');
const DiscordOAuth2 = require('discord-oauth2');
const discordOauth = new DiscordOAuth2();

const authController = {
    register: async (req, res) => {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ where: { username: username } });
        if (existingUser) {
            return res.status(400).json({ errors: [{ msg: 'Account already exists', path: 'username' }] });
        }
        const user = await User.create({
            username: username,
            password: password
        });
        await giveUserSignUpBackground(user);
        const token = generateToken(user);
        const userWithBackgrounds = await getUserWithBackgrounds(user);
        return res.status(201).json({ message: 'User created successfully', token, user: userWithBackgrounds });
    },

    login: async (req, res) => {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username: username } });
        if (!user || !user.password || !(await user.validatePassword(password))) {
            return res.status(401).json({
                errors: [
                    { msg: 'Invalid username or password', path: 'username' },
                    { msg: 'Invalid username or password', path: 'password' }
                ]
            });
        }
        const token = generateToken(user);
        const userWithBackgrounds = await getUserWithBackgrounds(user);
        return res.status(200).json({ message: 'Login successful', token, user: userWithBackgrounds });
    },

    resetPassword: async (req, res) => {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username: username } });
        if (!user) {
            return res.status(404).json({ errors: [{ msg: 'User not found', path: 'username' }] });
        }
        await user.update({ password: password });
        return res.status(200).json({ message: 'Password reset successful' });
    },

    googleCallback: async (req, res) => {
        const { code } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: code,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, hd } = payload;
        if (hd !== 'rit.edu' && hd !== 'g.rit.edu') {
            return res.status(401).json({ errors: [{ msg: 'You must sign in with a RIT email', path: 'email' }] });
        }
        const username = email.split('@')[0];
        let user = await User.findOne({ where: { username: username } });
        let status;
        if (user) {
            // if the user has a googleId and it is not the same as the googleId from the payload, something is wrong
            if (user.googleId && user.googleId !== googleId) {
                return res.status(401).json({ errors: [{ msg: 'You must sign in with a RIT email', path: 'email' }] });
            }

            // in this case, the user manually signed up so we just update the googleId
            user.googleId = googleId;
            await user.save();
            status = 200;
        }
        else {
            // if the user does not exist, we create a new user
            user = await User.create({
                username: username,
                googleId: googleId
            });
            await giveUserSignUpBackground(user);
            status = 201;
        }
        const token = generateToken(user);
        const userWithBackgrounds = await getUserWithBackgrounds(user);
        return res.status(status).json({ message: 'Google callback successful', token, user: userWithBackgrounds });
    },

    discordCallback: async (req, res) => {
        console.log("Callback received");
        const { code } = req.query;
        if (!code) {
            return res.status(400).json({ message: 'No code provided' });
        }
        console.log("Requesting token data");
        const tokenData = await discordOauth.tokenRequest({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            code: code,
            redirectUri: process.env.SERVER_URL + process.env.DISCORD_REDIRECT_ENDPOINT,
            grantType: 'authorization_code'
        });
        console.log("Just got token data");
        const accessToken = tokenData.access_token;
        console.log("Here is the access token");
        console.log(accessToken);
        const userData = await discordOauth.getUser(accessToken);
        console.log("Here is the user data");
        console.log(userData);

        discordOauth.addMember({
            guildId: process.env.DISCORD_SERVER_ID,
            userId: userData.id,
            botToken: process.env.DISCORD_BOT_TOKEN,
            accessToken: accessToken
        });
        return res.status(200).json({ message: 'Discord callback successful' });
    }
}

module.exports = {
    authController
}