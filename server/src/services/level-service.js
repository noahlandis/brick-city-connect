const { User } = require('../models/index');
const { Background } = require('../models/index');
const { Op } = require('sequelize');
/**
 * Reward the user with xp based on the duration of the time they spent in the video chat lobby
 * @param {*} userID 
 * @param {*} duration 
 */
async function rewardUser(userID, duration) {
  const user = await User.findByPk(userID);
  user.addXP(duration);
  await user.addBackgrounds(await Background.findAll({ where: {
      requiredLevel: {
        [Op.lte]: user.level,
      },
    }})
  );
}

module.exports = { rewardUser };