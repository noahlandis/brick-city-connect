const { User } = require('../models/index');

/**
 * Reward the user with xp based on the duration of the time they spent in the video chat lobby
 * @param {*} userID 
 * @param {*} duration 
 */
async function rewardUser(userID, duration) {
  const user = await User.findByPk(userID);
  user.addXP(duration);
}

module.exports = { rewardUser };