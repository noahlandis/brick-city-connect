const Bugsnag = require('@bugsnag/js');
const BugsnagPluginExpress = require('@bugsnag/plugin-express');

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  releaseStage: process.env.ENV,
  plugins: [BugsnagPluginExpress],
  notifyReleaseStages: ['local','staging','production']
});

module.exports = Bugsnag;