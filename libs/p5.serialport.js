// p5.serialport.js
// Shawn Van Every (shawn.van.every@nyu.edu)
// NYU ITP
// LGPL
// https://github.com/p5-serial/p5.serialport

(function (root, factory) {
  if (typeof define === 'function' && define.amd)
    define('p5.serialport', ['p5'], function (p5) {
      factory(p5);
    });
  else if (typeof exports === 'object') factory(require('../p5'));
  else factory(root['p5']);
})(this, function (p5) {
  /**
   //  SerialPort base class
   // creates an instance of the serial library
   // and prints "hostname":"serverPort" in the console.
   * @param {String} [hostname] Name of the host. Defaults to 'localhost'.
   * @param {Number} [serverPort] Port number. Defaults to 8081.
   */
  p5.SerialPort = function (_hostname, _serverport) {
    let self = this;
    this.version = '0.0.32';
    // How much to buffer before sending data event
    this.bufferSize = 1;
    this.serialBuffer = [];
    //this.maxBufferSize = 1024;
    this.serialConnected = false;
    this.serialport = null;
    this.serialoptions = null;
    this.emitQueue = [];
    this.clientData = {};
    this.serialportList = [];

    if (typeof _hostname === 'string') {
      this.hostname = _hostname;
    } else {
      this.hostname = 'localhost';
    }

    if (typeof _serverport === 'number') {
      this.serverport = _serverport;
    } else {
      this.serverport = 8081;
    }

    try {
      this.socket = new WebSocket(
        'ws://' + this.hostname + ':' + this.serverport,
      );
      console.log('ws://' + this.hostname + ':' + this.serverport);
    } catch (err) {
      if (typeof self.errorCallback !== 'undefined') {
        self.errorCallback(
          "couldn't connect to the server, is it running?",
        );
      }
    }

    this.socket.onopen = function (event) {
      console.log('opened socket');
      serialConnected = true;

      if (typeof self.connectedCallback !== 'undefined') {
        self.connectedCallback();
      }

      if (self.emitQueue.length > 0) {
        for (let i = 0; i < self.emitQueue.length; i++) {
          self.emit(self.emitQueue[i]);
        }
        self.emitQueue = [];
      }
    };

    this.socket.onmessage = function (event) {
      let messageObject = JSON.parse(event.data);
      // MESSAGE ROUTING
      if (typeof messageObject.method !== 'undefined') {
        if (messageObject.method == 'echo') {
        } else if (messageObject.method === 'openserial') {
          if (typeof self.openPortCallback !== 'undefined') {
            self.openPortCallback();
          }
        } else if (messageObject.method === 'data') {
          // Add to buffer, assuming this comes in byte by byte
          self.serialBuffer.push(messageObject.data);
          if (typeof self.dataCallback !== 'undefined') {
            // Hand it to sketch
            if (self.serialBuffer.length >= self.bufferSize) {
              self.dataCallback();
            }
          }
          if (typeof self.rawDataCallback !== 'undefined') {
            self.rawDataCallback(messageObject.data);
          }
        } else if (messageObject.method === 'list') {
          self.serialportList = messageObject.data;
          if (typeof self.listCallback !== 'undefined') {
            self.listCallback(messageObject.data);
          }
        } else if (messageObject.method === 'close') {
          if (typeof self.closePortCallback !== 'undefined') {
            self.closePortCallback();
          }
        } else if (messageObject.method === 'write') {
          // Success Callback?
        } else if (messageObject.method === 'error') {
          //console.log(messageObject.data);
          if (typeof self.errorCallback !== 'undefined') {
            self.errorCallback(messageObject.data);
          }
        } else {
          // Got message from server without known method
          console.log('Unknown Method: ' + messageObject);
        }
      } else {
        console.log('Method Undefined: ' + messageObject);
      }
    };

    this.socket.onclose = function (event) {
      if (typeof self.closePortCallback !== 'undefined') {
        self.closePortCallback();
      }
    };

    this.socket.onerror = function (event) {
      if (typeof self.errorCallback !== 'undefined') {
        self.errorCallback();
      }
    };
  };

  // method emit
  p5.SerialPort.prototype.emit = function (data) {
    if (this.socket.readyState == WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      this.emitQueue.push(data);
    }
  };

  // tells you whether p5 is connected to the serial port
  p5.SerialPort.prototype.isConnected = function () {
    if (self.serialConnected) {
      return true;
    } else {
      return false;
    }
  };

  // method list
  // lists serial ports available to the server.
  // synchronously returns cached list, asynchronously returns updated list via callback.
  // must be called within the p5 setup() function.
  p5.SerialPort.prototype.list = function (cb) {
    if (typeof cb === 'function') {
      this.listCallback = cb;
    }
    this.emit({
      method: 'list',
      data: {},
    });

    return this.serialportList;
  };

  // method openPort
  // opens the serial port to enable data flow
  // Use the {[serialOptions]} parameter to set the baudrate
  // if it's different from the p5 default, 9600.
  // @param  {String} serialPort Name of the serial port, something like '/dev/cu.usbmodem1411'
  // @param  {Object} [serialOptions] Object with optional options as {key: value} pairs.
  // pptions include 'baudrate'.
  // @param  {Function} [serialCallback] Callback function when open completes
  p5.SerialPort.prototype.openPort = function (
    _serialport,
    _serialoptions,
    cb,
  ) {
    if (typeof cb === 'function') {
      this.openCallback = cb;
    }

    this.serialport = _serialport;

    if (typeof _serialoptions === 'object') {
      this.serialoptions = _serialoptions;
    } else {
      //console.log("typeof _serialoptions " + typeof _serialoptions + " setting to {}");
      this.serialoptions = {};
    }
    // If our socket is connected, we'll do this now,
    // otherwise it will happen in the socket.onopen callback
    this.emit({
      method: 'openserial',
      data: {
        serialport: this.serialport,
        serialoptions: this.serialoptions,
      },
    });
  };

  // method write
  // sends a byte to a webSocket server
  //  which sends the same byte out through a serial port
  // @param  {String, Number, Array} Data Writes bytes, chars, ints, bytes[], and strings
  // to the serial port.
  p5.SerialPort.prototype.write = function (data) {
    //Writes bytes, chars, ints, bytes[], Strings to the serial port
    let toWrite = null;
    if (typeof data == 'number') {
      // This is the only one I am treating differently, the rest of the clauses are meaningless
      toWrite = [data];
    } else if (typeof data == 'string') {
      toWrite = data;
    } else if (Array.isArray(data)) {
      toWrite = data;
    } else {
      toWrite = data;
    }

    this.emit({
      method: 'write',
      data: toWrite,
    });
  };

  // method read
  // returns a number between 0 and 255 for the next byte that's waiting in the buffer.
  // returns -1 if there is no byte,
  // although this should be avoided by first checking available() to see if data is available.
  p5.SerialPort.prototype.read = function () {
    if (this.serialBuffer.length > 0) {
      return this.serialBuffer.shift();
    } else {
      return -1;
    }
  };

  // method readChar
  // Returns the next byte in the buffer as a char.
  // return {String} Value of the Unicode-code unit character byte
  // waiting in the buffer, converted from bytes
  // returns - 1 or 0xffff if there is no byte
  p5.SerialPort.prototype.readChar = function () {
    if (this.serialBuffer.length > 0) {
      /*let currentByte = this.serialBuffer.shift();
      console.log("p5.serialport.js: " + currentByte);
      let currentChar = String.fromCharCode(currentByte);
      console.log("p5.serialport.js: " + currentChar);
      return currentChar;
      */
      return String.fromCharCode(this.serialBuffer.shift());
    } else {
      return -1;
    }
  };

  // method readBytes
  // Returns a number between 0 and 255 for the next byte
  // that's waiting in the buffer,
  // and then clears the buffer of data.
  // Returns - 1 if there is no byte,
  // although this should be avoided
  // by first checking available() to see if data is available.
  p5.SerialPort.prototype.readBytes = function () {
    if (this.serialBuffer.length > 0) {
      let returnBuffer = this.serialBuffer.slice();

      // Clear the array
      this.serialBuffer.length = 0;

      return returnBuffer;
    } else {
      return -1;
    }
  };

  // method readBytesUntil
  // Returns all of the data available, up to and including a particular character.
  // If the character isn't in the buffer, 'null' is returned.
  // The version without the byteBuffer parameter returns a byte array
  // of all data up to and including the interesting byte.
  //  This is not efficient, but is easy to use.
  // The version with the byteBuffer parameter is more efficient in terms of time and memory.
  // It grabs the data in the buffer and puts it into the byte array passed in and returns an integer value for the number of bytes read.
  // If the byte buffer is not large enough, -1 is returned and an error is printed to the message area.
  // If nothing is in the buffer, 0 is returned.
  p5.SerialPort.prototype.readBytesUntil = function (charToFind) {
    console.log('Looking for: ' + charToFind.charCodeAt(0));
    let index = this.serialBuffer.indexOf(charToFind.charCodeAt(0));
    if (index !== -1) {
      // What to return
      let returnBuffer = this.serialBuffer.slice(0, index + 1);
      // Clear out what was returned
      this.serialBuffer = this.serialBuffer.slice(
        index,
        this.serialBuffer.length + index,
      );
      return returnBuffer;
    } else {
      return -1;
    }
  };

  // method readString
  // returns all the data from the buffer as a String.
  // This method assumes the incoming characters are ASCII.
  // If you want to transfer Unicode data:
  // first, convert the String to a byte stream in the representation of your choice
  // (i.e.UTF8 or two - byte Unicode data).
  // Then, send it as a byte array.
  p5.SerialPort.prototype.readString = function () {
    //let returnBuffer = this.serialBuffer;
    let stringBuffer = [];
    //console.log("serialBuffer Length: " + this.serialBuffer.length);
    for (let i = 0; i < this.serialBuffer.length; i++) {
      //console.log("push: " + String.fromCharCode(this.serialBuffer[i]));
      stringBuffer.push(String.fromCharCode(this.serialBuffer[i]));
    }
    // Clear the buffer
    this.serialBuffer.length = 0;
    return stringBuffer.join('');
  };

  // method readStringUntil
  // returns all of the data available as an ASCII-encoded string
  p5.SerialPort.prototype.readStringUntil = function (stringToFind) {
    let stringBuffer = [];
    //console.log("serialBuffer Length: " + this.serialBuffer.length);
    for (let i = 0; i < this.serialBuffer.length; i++) {
      //console.log("push: " + String.fromCharCode(this.serialBuffer[i]));
      stringBuffer.push(String.fromCharCode(this.serialBuffer[i]));
    }
    stringBuffer = stringBuffer.join('');
    //console.log("stringBuffer: " + stringBuffer);

    let returnString = '';
    let foundIndex = stringBuffer.indexOf(stringToFind);
    //console.log("found index: " + foundIndex);
    if (foundIndex > -1) {
      returnString = stringBuffer.substr(0, foundIndex);
      this.serialBuffer = this.serialBuffer.slice(
        foundIndex + stringToFind.length,
      );
    }
    //console.log("Sending: " + returnString);
    return returnString;
  };

  // method readStringUntil
  // returns all of the data available as an ASCII-encoded string
  // until a line break is encountered
  p5.SerialPort.prototype.readLine = function () {
    return this.readStringUntil('\r\n');
  };

  // method available
  // returns the length of the serial buffer array,
  // in terms of number of bytes in the buffer
  p5.SerialPort.prototype.available = function () {
    return this.serialBuffer.length;
  };

  // method last
  // returns the last byte of data from the buffer.
  p5.SerialPort.prototype.last = function () {
    //Returns last byte received
    let last = this.serialBuffer.pop();
    this.serialBuffer.length = 0;
    return last;
  };

  // method lastChar
  // returns the last byte of data from the buffer as a char
  p5.SerialPort.prototype.lastChar = function () {
    return String.fromCharCode(this.last());
  };

  // method clear
  // Clears the underlying serial buffer.
  p5.SerialPort.prototype.clear = function () {
    // empty the buffer, removes all the data stored there
    this.serialBuffer.length = 0;
  };

  // method stop
  // stops data communication on this port
  p5.SerialPort.prototype.stop = function () {};

  // method closePort
  // tell server to close the serial port.
  // This functions the same way as serial.on('close', portClose).
  p5.SerialPort.prototype.closePort = function (cb) {
    //
    if (typeof cb === 'function') {
      this.closePortCallback = cb;
    }
    this.emit({
      method: 'close',
      data: {},
    });
  };

  // method registerClient
  // register clients that connect to the serial server
  // note that calling this method does not log the list of registered clients.
  // to do that you'd use: serial.on('registerClient', logClientData)
  // p5.SerialPort.prototype.registerClient = function(cb) {
  //   if (typeof cb === 'function') {
  //     this.registerCallback = cb;
  //   }
  //   this.emit({
  //     method: 'registerClient',
  //     data: {}
  //   });
  //   return this.clientData;
  // };

  // Register callback methods from sketch
  p5.SerialPort.prototype.onData = function (_callback) {
    this.on('data', _callback);
  };

  p5.SerialPort.prototype.onOpen = function (_callback) {
    this.on('open', _callback);
  };

  p5.SerialPort.prototype.onClose = function (_callback) {
    this.on('close', _callback);
  };

  p5.SerialPort.prototype.onError = function (_callback) {
    this.on('error', _callback);
  };

  p5.SerialPort.prototype.onList = function (_callback) {
    this.on('list', _callback);
  };

  p5.SerialPort.prototype.onConnected = function (_callback) {
    this.on('connected', _callback);
  };

  p5.SerialPort.prototype.onRawData = function (_callback) {
    this.on('rawdata', _callback);
  };

  // Version 2
  p5.SerialPort.prototype.on = function (_event, _callback) {
    if (_event == 'open') {
      this.openPortCallback = _callback;
    } else if (_event == 'data') {
      this.dataCallback = _callback;
    } else if (_event == 'close') {
      this.closePortCallback = _callback;
    } else if (_event == 'error') {
      this.errorCallback = _callback;
    } else if (_event == 'list') {
      this.listCallback = _callback;
    } else if (_event == 'connected') {
      this.connectedCallback = _callback;
    } else if (_event == 'rawdata') {
      this.rawDataCallback = _callback;
    }
  };
});
