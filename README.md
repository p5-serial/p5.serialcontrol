# p5.serialcontrol

GUI (Electron) application for use with [p5.serialport](https://github.com/vanevery/p5.serialport)

Runs and controls p5.serialserver (no need to install and run it separately)

Download a release here: [releases](https://github.com/vanevery/p5.serialcontrol/releases)

## OSX Development
**Install dependencies**

1.  `npm install`

**Rebuild serialport library (more on this [here](https://stackoverflow.com/questions/40254287/electron-and-serial-ports))**

1.  `rm -rf node_modules/serialport/build/*`
1.  `node_modules/.bin/electron-rebuild -w serialport -f`

## OSX Compilation
1.  `npm install electron-packager`
1.  `electron-packager ./ p5.serialcontrol --arch=x64 --platform=darwin --overwrite`

## Windows Development
**Install dependencies**

1.  `npm install`

**Rebuild serialport library**

1.  `cd p5.serialcontrol/node_modules/p5.serialserver/node_modules/serialport`
1.  `HOME=~/.electron-gyp node-gyp rebuild --target=1.7.8 --arch=x64 --dist-url=https://atom.io/download/atom-shell`

Note: `target` is the Electron version and should match `version` below

## Windows Compilation
1.  `npm install electron-packager`
1.  `electron-packager ./ p5.serialcontrol --version=1.7.8`
