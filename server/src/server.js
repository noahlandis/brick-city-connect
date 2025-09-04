// server.js
require('dotenv').config({ path: '../.env' });
const express = require('express');
const http = require('http');
const { initializeDatabase } = require('./config/database');
const { initializeSignalingServer } = require('./signaling-server');
const Bugsnag = require('./config/bugsnag');
const path = require('path');
const { initializeDiscordBot } = require('./services/discord-service');
// Wrap initialization in IIFE
(async () => {
  await initializeDatabase();
  await initializeDiscordBot();
})();

const middleware = Bugsnag.getPlugin('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const magicLinkRoutes = require('./routes/magic-link-routes');
const authRoutes = require('./routes/auth-routes');
const userRoutes = require('./routes/user-routes');

// prepend 'api' to all routes
app.use('/api', magicLinkRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);

// Apply Bugsnag middleware
app.use(middleware.requestHandler);
app.use(middleware.errorHandler);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'email-templates'));

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