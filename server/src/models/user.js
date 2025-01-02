const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('user', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      isRITEmail: (value) => {
        if (!value.endsWith('@rit.edu')) {
          throw new Error('Please enter a valid RIT email');
        }
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

module.exports = User;