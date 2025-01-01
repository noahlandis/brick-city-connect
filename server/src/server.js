// server.js
require('dotenv').config({ path: '../.env' });
const express = require('express');
const http = require('http');
const { initializeDatabase } = require('./config/database');
const { initializeSignalingServer } = require('./signaling-server');
const Bugsnag = require('./config/bugsnag');

// Wrap initialization in IIFE
(async () => {
  await initializeDatabase();
})();

const middleware = Bugsnag.getPlugin('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// Import routes
const magicLinkRoutes = require('./routes/register-magic-link-routes');
const authRoutes = require('./routes/auth-routes');

// prepend 'api' to all routes
app.use('/api', magicLinkRoutes);
app.use('/api', authRoutes);

// Apply Bugsnag middleware
app.use(middleware.requestHandler);
app.use(middleware.errorHandler);

// Create the HTTP server from the express app
const server = http.createServer(app);

// Import and initialize signaling server
initializeSignalingServer(server);

// Launch server
server.listen(3000, () => {
  console.log('Server is running on port 3000');
});

module.exports = {
  server,
  app
}