const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');


const XP_PER_LEVEL = 1000; 
const XP_PER_SECOND = XP_PER_LEVEL / 1800;
const MILLISECONDS_PER_SECOND = 1000;

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

User.prototype.addXP = async function(millisecondsActive) {
  const xp = Math.floor(XP_PER_SECOND * (millisecondsActive / MILLISECONDS_PER_SECOND)); // Convert ms to seconds
  this.xp += xp;

  // if the user has enough xp to level up, we update the level and reset the xp (and carry over the remainder)
  if (this.xp >= XP_PER_LEVEL) {
    this.level += Math.floor(this.xp / XP_PER_LEVEL);
    this.xp = this.xp % XP_PER_LEVEL;
  }
  await this.save();
};


module.exports = User;