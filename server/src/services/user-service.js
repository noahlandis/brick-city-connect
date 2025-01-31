const Background = require('../models/background');

/**
 * This function gets a user and returns a user with the backgrounds attached to them, along with the lock status of each background
 * @param {*} user the user to get the backgrounds for
 * @returns a user with the backgrounds attached to them, along with the lock status of each background
 */
async function getUserWithBackgrounds(user) {

    // we get all the backgrounds
    const allBackgrounds = await Background.findAll(
        {
            order: [['requiredLevel', 'ASC']],
            attributes: ['id', 'name', 'url'] // we exclude createdAt and updatedAt
        }
    );

    // we get the user's unlocked backgrounds
    const userBackgrounds = await user.getBackgrounds();

    // Then we map all the backgrounds and mark them as locked/unlocked.
    // Note that although we know the user's level and the required level for each background,
    // this allows us for flexibility if we gift backgrounds to users.
    const backgrounds = allBackgrounds.map(background => {
        return {
            ...background.toJSON(), // Convert Sequelize instance to plain object
            locked: !userBackgrounds.some(userBackground => userBackground.id === background.id),
        };
    });
    user = user.toJSON();
    user.backgrounds = backgrounds;
    return user;
}

module.exports = {
    getUserWithBackgrounds
}