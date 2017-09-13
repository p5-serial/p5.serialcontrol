# p5.serialcontrol

GUI (Electron) application for use with [p5.serialport](https://github.com/vanevery/p5.serialport)

Runs and controls p5.serialserver (no need to install and run it separately)

Download a release here: [releases](https://github.com/vanevery/p5.serialcontrol/releases)

## Development
**Install dependencies**

1.  `npm install`

**Rebuild serialport library (more on this [here](https://stackoverflow.com/questions/40254287/electron-and-serial-ports))**

1.  `rm -rf node_modules/serialport/build/*`
1.  `node_modules/.bin/electron-rebuild -w serialport -f`

## Compilation
1.  `npm install electron-packager`
1.  `electron-packager ./ p5.serialcontrol --arch=x64 --platform=darwin --overwrite`
