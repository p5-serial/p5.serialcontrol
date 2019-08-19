const electron = require('electron');
// app - Module to control application life.
// BrowserWindow - Module to create native browser window.
const {app, BrowserWindow, Menu, Tray} = electron;
const path = require('path');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    app.quit();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {

    let appIcon = new Tray(path.join(__dirname, "/../assets/icons/png/icon.png"));
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 960,
        height: 700,
        minWidth: 520,
        minHeight: 600,
        title: "p5.serialcontrol",
        icon: `${__dirname}/../assets/icons/png/icon_32x32@2.png`,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // and load the index.html of the app.
    //${ } is ES6 syntax for a Javascript variable—in this case, the directory name
    mainWindow.loadURL(`file://${__dirname}/../index.html`);
    // mainWindow.webContents.openDevTools();

    // When the page is done loading, get the IP address of the Electron app (the server side)
    // and send it to the client side so users can see it
    mainWindow.webContents.on('did-finish-load', () => {
        // https://stackoverflow.com/questions/10750303/how-can-i-get-the-local-ip-address-in-node-js
        let os = require('os');
        let interfaces = os.networkInterfaces();
        let addresses = [];
        for (let k in interfaces) {
            for (let k2 in interfaces[k]) {
                let address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }
        mainWindow.webContents.send('send-ip', `${addresses}`)
    });

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    let template = [{
        label: app.getName(),
        submenu: [
            { label: 'API Documentation', click(){require('electron').shell.openExternal('https://p5-serial.github.io/')}},
            { label: 'Project Github Repo', click(){require('electron').shell.openExternal('https://github.com/p5-serial')}},
            { label: 'Code Examples', click(){require('electron').shell.openExternal('https://github.com/p5-serial/p5.serialport#examples')}},
            { label: 'License', click(){require('electron').shell.openExternal('https://github.com/p5-serial/p5.serialcontrol/blob/master/LICENSE.txt')}},
            { type: "separator"},
            { label: "Quit", accelerator: "CmdOrCtrl+Q", click: function() { app.quit(); }}
        ]}, {
        label: "View",
        submenu: [
            { label: "Reload", accelerator: "CmdOrCtrl+R", click(item, focusedWindow){
                    if(focusedWindow) focusedWindow.relaod();
                }},
            {label: "Toggle Developer Tools", accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : "Ctrl+Shift+I", click(item, focusedWindow) {
                    if(focusedWindow) focusedWindow.webContents.toggleDevTools()
                }},
            {type: 'separator'},
            {role: 'resetzoom'},
            {role: 'zoomin'},
            {role: 'zoomout'},
            {type: 'separator'},
            {role: 'togglefullscreen'}
        ]}, {
        label: "Edit",
        submenu: [
            { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
            { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
        ]}
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
});


let serialserver = require('p5.serialserver');
serialserver.start();
console.log("p5.serialserver is running");

/*
  let sp = require('serialport');

  sp.list(function(err, ports) {
    console.log(ports);
  });
*/
