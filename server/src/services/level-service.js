const { User } = require('../models/index');
const { Background } = require('../models/index');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const MILLISECONDS_PER_SECOND = 1000;

/**
 * Reward the user with xp based on the duration of the time they spent in the video chat lobby
 * @param {*} userID 
 * @param {*} millisecondsActive 
 */
async function rewardUser(userID, millisecondsActive) {
  await sequelize.transaction(async (transaction) => {

    const user = await User.findByPk(userID, { transaction });
    const xp = Math.floor(User.XP_PER_SECOND * (millisecondsActive / MILLISECONDS_PER_SECOND)); // Convert ms to seconds
    user.xp += xp;

    // if the user has enough xp to level up, we update the level and reset the xp (and carry over the remainder)
    if (user.xp >= User.XP_PER_LEVEL) {
      user.level += Math.floor(user.xp / User.XP_PER_LEVEL);
      user.xp = user.xp % User.XP_PER_LEVEL;

      // get all backgrounds that are now available to the user
      const backgroundsToAdd = await Background.findAll({
        where: {
          requiredLevel: {
            [Op.lte]: user.level,
          },
          isExclusive: false,
        },
        transaction,
      });

      // we add the backgrounds to the user
      await user.addBackgrounds(backgroundsToAdd, { transaction });
    }
    await user.save({ transaction });
  });
}

module.exports = { rewardUser };
