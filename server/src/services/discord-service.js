const { Client, GatewayIntentBits } = require('discord.js');

async function initializeDiscordBot() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
        ],
    });

    client.on('guildMemberAdd', (member) => {
        console.log("User joined! Here is their discord ID: " + member.id);
    });

    await client.login(process.env.DISCORD_BOT_TOKEN);
}

module.exports = { initializeDiscordBot };