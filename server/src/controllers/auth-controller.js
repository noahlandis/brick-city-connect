const { validationResult } = require('express-validator');
const { User } = require('../models/index');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { generateToken } = require('../services/jwt-service');
const { getUserWithBackgrounds, giveUserSignUpBackground } = require('../services/user-service');
const DiscordOAuth2 = require('discord-oauth2');
const discordOauth = new DiscordOAuth2();
const { giveUserDiscordBackground } = require('../services/reward-discord-background');
const { isUserInRITStudentHub } = require('../services/discord-service');

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
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ message: 'No code provided' });
        }
        const tokenData = await discordOauth.tokenRequest({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            code: code,
            redirectUri: process.env.FRONTEND_URL + process.env.DISCORD_REDIRECT_ENDPOINT,
            grantType: 'authorization_code'
        });
        const accessToken = tokenData.access_token;

        const userData = await discordOauth.getUser(accessToken);
        const discordId = userData.id;
        const email = userData.email;
        const username = email.split('@')[0];

        if (!email.endsWith('@rit.edu') && !email.endsWith('@g.rit.edu') && !(await isUserInRITStudentHub(accessToken))) {
            return res.status(401).json({ message: 'You must sign in with a RIT email to sign in' });
        }

        let status;
        let user = await User.findOne({ where: { username: username } });
        if (!user) {
            user = await User.create({
                username: username,
                discordId: discordId
            });
            status = 201;
        }
        else {
            user.discordId = discordId;
            await user.save();
            status = 200;
        }

        await discordOauth.addMember({
            guildId: process.env.DISCORD_SERVER_ID,
            userId: discordId,
            botToken: process.env.DISCORD_BOT_TOKEN,
            accessToken: accessToken
        });

        await giveUserDiscordBackground(user);

        const token = generateToken(user);
        const userWithBackgrounds = await getUserWithBackgrounds(user);
        return res.status(status).json({ message: 'Discord callback successful', token, user: userWithBackgrounds });
    }
}

module.exports = {
    authController
}