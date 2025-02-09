const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Background = sequelize.define('background', {
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  requiredLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isExclusive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
});

module.exports = Background;