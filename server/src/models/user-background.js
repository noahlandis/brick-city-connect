const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User_Background = sequelize.define('user_background', {
  isUnlocked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

module.exports = User_Background;