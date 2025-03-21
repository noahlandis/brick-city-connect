const { Background } = require('../models');

/**
 * This function gives the user the exclusive Library background if they join the discord server
 * @param {*} user the user to give the Library background to
 */
async function giveUserDiscordBackground(user) {
    const discordBackground = await Background.findOne({
        where: {
            name: 'Library'
        }
    });
    await user.addBackground(discordBackground);
}

module.exports = {
    giveUserDiscordBackground
}