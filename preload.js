// All of the Node.js APIs are available in the preload process.
const { app } = require('electron');

// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const appVersion = document.getElementById('appVersion');
  // appVersion.innerHTML = app.getVersion();
  // console.log(app.getVersion());
  appVersion.innerHTML = 'v.TODO';
});
