const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { User } = require('../models');
const { giveUserDiscordBackground } = require('./reward-discord-background');

async function initializeDiscordBot() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
        ],
    });

    client.on('guildMemberAdd', async (member) => {
        console.log("User joined! Here is their discord ID: " + member.id);

        // since a user joined, we find the user in our database and give them the Library background
        // 
        const user = await User.findOne({
            where: {
                discordId: member.id
            }
        });

        if (!user) {
            // use an embed to send a message to the user that they have been given the Library background
            const embed = new EmbedBuilder()
                .setTitle('Link your Brick City Connect account')
                .setDescription('It looks like you haven\'t linked your Brick City Connect account yet. Click here to unlock an exclusive background!')
                .setURL(process.env.DISCORD_OAUTH_LINK)
                .setImage('https://brickcityconnect.com/tiger.png');
            await member.send({ embeds: [embed] });
            return;
        }

        await giveUserDiscordBackground(user);
    });

    await client.login(process.env.DISCORD_BOT_TOKEN);
}

module.exports = { initializeDiscordBot };