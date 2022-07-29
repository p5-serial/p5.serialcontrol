// app - Module to control application life.
// BrowserWindow - Module to create native browser window.
// const electron = require('electron');
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const os = require('os');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 700,
    minWidth: 500,
    minHeight: 700,
    title: 'p5.serialcontrol',
    icon: `${__dirname}/../assets/icons/png/icon_32x32@2.png`,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // mainWindow.loadFile('index.html');
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  mainWindow.webContents.on('did-finish-load', () => {
    let interfaces = os.networkInterfaces();
    let addresses = [];
    for (let k in interfaces) {
      for (let k2 in interfaces[k]) {
        let address = interfaces[k][k2];
        if (address.family === 'IPV4' && !address.internal) {
          addresses.push(address.address);
        }
      }
    }
  });

  mainWindow.webContents.send('send-ip', `${addresses}`);
  mainWindow.webContents.send('send-ip', 'placeholder');

  // mainWindow.webContents.setWindowOpenHandler(
  //   ({ url, franeName }) => {
  //     shell.openExternal(url);
  //     return { action: 'deny' };
  //   },
  // );
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  let template = [
    {
      label: app.getName(),
      submenu: [
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          selector: 'copy:',
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          selector: 'paste:',
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          selector: 'selectAll:',
        },
        {
          label: 'Toggle Developer Tools',
          accelerator:
            process.platform === 'darwin'
              ? 'Alt+Command+I'
              : 'Ctrl+Shift+I',
          click(item, focusedWindow) {
            if (focusedWindow)
              focusedWindow.webContents.toggleDevTools();
          },
        },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: function () {
            app.quit();
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// let serialserver = require('p5.serialserver');
// serialserver.start(8081);
// console.log('p5.serialserver is running');
