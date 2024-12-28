// server.js
require('dotenv').config({ path: '../.env' });
const express = require('express');
const http = require('http');
const { Sequelize } = require('sequelize');

const sequelize = require('./config/database');
const Bugsnag = require('./config/bugsnag');
const User = require('./models/user');

// Wrap the database connection in an async function
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// Call the initialization function
initializeDatabase();

sequelize.sync().then(() => {
  console.log('Database & tables created!');
}).catch((error) => {
  console.error('Error syncing database:', error);
});

const middleware = Bugsnag.getPlugin('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 


// Import routes
const routes = require('./routes');

// prepend 'api' to all routes
app.use('/api', routes);

// Apply Bugsnag middleware
app.use(middleware.requestHandler);
app.use(middleware.errorHandler);

// Create the HTTP server from the express app
const server = http.createServer(app);

// Import and initialize signaling server
const { initializeSignalingServer } = require('./signaling-server');
initializeSignalingServer(server);

// Launch server
server.listen(3000, () => {
  console.log('Server is running on port 3000');
});

module.exports = {
  server,
  app
}