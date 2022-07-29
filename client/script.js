const { ipcRenderer } = window.require('electron');

ipcRenderer.on('send-ip', (event, message) => {
  document.getElementById('serialIp').innerHTML = message;
  console.log('send-ip arrived');
});
