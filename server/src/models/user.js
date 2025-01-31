const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const XP_PER_LEVEL = 1000;
const XP_PER_SECOND = XP_PER_LEVEL / 1800;

const User = sequelize.define('user', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [6, 255]
    }
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  xp: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  validate: {
    eitherPasswordOrGoogleId() {
      if (!this.password && !this.googleId) {
        throw new Error('Either password or googleId must be provided');
      }
    }
  },
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.password && user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.XP_PER_LEVEL = XP_PER_LEVEL;
User.XP_PER_SECOND = XP_PER_SECOND;

module.exports = User;
