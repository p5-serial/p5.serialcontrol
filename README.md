# p5.serialcontrol

## About

This repository is part of the p5-serial project, created in 2015 at [New York University](https://www.nyu.edu/)'s [Interactive Telecommunications Program](https://tisch.nyu.edu/itp) by [Shawn van Every](https://github.com/vanevery/), [Jen Kagan](https://github.com/kaganjd), and [Tom Igoe](https://github.com/tigoe). For more info please visit the repository at https://github.com/p5-serial/p5.serial.github.io/
GUI (Electron) application for use with the [p5.serialport](https://github.com/p5-serial/p5.serialport) library.

Runs and controls p5.serialserver (no need to install and run it separately)

Download a release here: [releases](https://github.com/p5-serial/p5.serialcontrol/releases)

## OSX Development

**Install dependencies**

1.  `npm install`

**Rebuild serialport library (more on this [here](https://stackoverflow.com/questions/40254287/electron-and-serial-ports))**

1.  `rm -rf node_modules/serialport/build/*`
1.  `node_modules/.bin/electron-rebuild -w serialport -f`

## OSX Compilation

1.  `npm install electron-packager`
1.  `electron-packager ./ p5.serialcontrol --arch=x64 --platform=darwin --overwrite` OR `npm run package-mac`

## Windows Development

**Install dependencies**

1.  `npm install`

**Rebuild serialport library**

1.  `cd p5.serialcontrol/node_modules/p5.serialserver/node_modules/serialport`
1.  `HOME=~/.electron-gyp node-gyp rebuild --target=1.7.8 --arch=x64 --dist-url=https://atom.io/download/atom-shell`

Note: `target` is the Electron version and should match `version` below

## Windows Compilation

1.  `npm install electron-packager`
1.  `electron-packager ./ p5.serialcontrol --version=1.7.8` OR `npm run package-win`
