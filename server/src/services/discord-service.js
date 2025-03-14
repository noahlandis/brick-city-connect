const { Client, GatewayIntentBits } = require('discord.js');
const { User } = require('../models');
const { giveUserDiscordBackground } = require('./reward-discord-background');

async function initializeDiscordBot() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
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
            // in this case, this event is triggered by a user who joined the discord server without using our oauth flow, so we can't give them the  background
            return;
        }

        await giveUserDiscordBackground(user);
    });

    await client.login(process.env.DISCORD_BOT_TOKEN);
}

module.exports = { initializeDiscordBot };