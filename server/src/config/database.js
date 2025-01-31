const { Sequelize } = require('sequelize');

// Check if we should enable SSL (e.g., in production with RDS)
const ssl =
  process.env.ENV !== 'local'
    ? { require: true, rejectUnauthorized: false }
    : false;

const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      ssl
    }
  }
);

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await sequelize.sync({ alter: true });
    console.log('Database & tables created!');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

module.exports = { initializeDatabase, sequelize };
