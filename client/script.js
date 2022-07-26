const { ipcRenderer } = require('electron');

ipcRenderer.on('send-ip', (event, message) => {
  document.getElementById('serialIp').innerHTML = message;
});
