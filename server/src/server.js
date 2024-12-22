// server.js
require('dotenv').config({ path: '../.env' });
const express = require('express');
const http = require('http');

// Bugsnag configuration
var Bugsnag = require('@bugsnag/js');
var BugsnagPluginExpress = require('@bugsnag/plugin-express');
Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  releaseStage: process.env.ENV,
  plugins: [BugsnagPluginExpress]
});

const middleware = Bugsnag.getPlugin('express');
const cors = require('cors');
const app = express();
app.use(cors());


// Import routes
const routes = require('./routes');
app.use(routes);

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