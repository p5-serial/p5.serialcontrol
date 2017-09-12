'use strict';

const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.

const {Menu} = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    app.quit();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  //${ } is ES6 syntax for a Javascript variable—in this case, the current working directory
  // var path = `file://${process.cwd()}/index.html`

  // uncomment this for compiling because Electron can't read ES6
  var path = 'file:///Users/jkagan/Desktop/p5.serialcontrol/index.html'

  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600});

  // and load the index.html of the app.
  mainWindow.loadURL(path);

  // When the page is done loading, get the IP address of the Electron app (the server side)
  // and send it to the client side so users can see it
  mainWindow.webContents.on('did-finish-load', () => {
    // https://stackoverflow.com/questions/10750303/how-can-i-get-the-local-ip-address-in-node-js
    var os = require('os');
    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }
    mainWindow.webContents.send('send-ip', `${addresses}`)
  })

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
  
	var template = [{
		label: "Application",
		submenu: [
			{ label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
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


var serialserver = require('p5.serialserver');
serialserver.start();
console.log("p5.serialserver is running");

/*
  var sp = require('serialport');

  sp.list(function(err, ports) {
    console.log(ports);
  });
*/
