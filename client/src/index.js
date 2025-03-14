import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ReactGA from 'react-ga4';
var Bugsnag = require('@bugsnag/js');
var BugsnagPluginReact = require('@bugsnag/plugin-react');

ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_ID);

Bugsnag.start({
  apiKey: process.env.REACT_APP_BUGSNAG_API_KEY,
  releaseStage: process.env.REACT_APP_ENV,
  plugins: [new BugsnagPluginReact()],
  notifyReleaseStages: ['staging','production']
})

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
