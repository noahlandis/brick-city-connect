const User = require('./user');
const Background = require('./background');

User.belongsToMany(Background, { through: 'user_backgrounds' });
Background.belongsToMany(User, { through: 'user_backgrounds' });

module.exports = { User, Background };