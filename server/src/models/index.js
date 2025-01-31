const User = require('./user');
const Background = require('./background');
const User_Background = require('./user-background');

User.belongsToMany(Background, { through: User_Background });
Background.belongsToMany(User, { through: User_Background });

module.exports = { User, Background, User_Background };