const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('user', {
  email: DataTypes.STRING,
  password: DataTypes.STRING,
  token: DataTypes.STRING,
  isVerified: DataTypes.BOOLEAN,
});

module.exports = User;