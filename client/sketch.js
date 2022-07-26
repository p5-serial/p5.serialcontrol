const shell = require('electron').shell;

// declare a "SerialPort" object
let serial = [];
let portListDiv;
let portSelect;
let rescanPorts;
let connectButton;

if (document.readyState != 'complete') {
  document.addEventListener(
    'DOMContentLoaded',
    function () {
      prepareTags();
    },
    false,
  );
} else {
  prepareTags();
}

function prepareTags() {
  aTags = document.getElementsByTagName('a');
  for (let i = 0; i < aTags.length; i++) {
    aTags[i].setAttribute(
      'onclick',
      "shell.openExternal('" + aTags[i].href + "')",
    );
    aTags[i].href = 'javascript:void(0);';
  }
  return false;
}

function setup() {
  noCanvas();

  portListDiv = select('#serialports');
  // portListDiv = window.document.getElementById('serialports');

  // GUI controls
  portSelect = createSelect();
  portSelect.option('No Ports Found');
  portSelect.parent(select('#portselectdiv'));

  rescanPorts = select('#rescan');
  rescanPorts.mousePressed(function () {
    serial[0].serial.list();
  });

  connectButton = select('#connectPort');
  connectButton.mousePressed(connectPressed);

  // Instantiate our SerialPort object
  serial.push(new SerialPortClient());
}

// We are connected and ready to go
function serverConnected() {
  serial[0].seriallog('Connected to Server');
}

// Got the list of ports
function gotList(thelist) {
  serial[0].seriallog('Available Serial Ports:');

  if (portSelect) {
    portSelect.remove();
  }

  portSelect = createSelect();
  portSelect.parent(select('#portselectdiv'));

  portSelect.elt.setAttribute('id', 'portselect');
  portSelect.elt.setAttribute('aria-label', 'selected port');

  //This isn't working - Looks like p5.dom bug
  //newPortSelect.changed(portSelected);
  portSelect.elt.addEventListener('change', portSelected);

  if (portListDiv) {
    portListDiv.elt.innerHTML = '';
  }

  for (let i = 0; i < thelist.length; i++) {
    serial[0].seriallog(i + ' ' + thelist[i]);

    portSelect.option(thelist[i]);

    if (portListDiv) {
      portListDiv.elt.innerHTML +=
        "<p class='port-options' id='option-" +
        thelist[i] +
        "'>" +
        thelist[i] +
        '</p>\n';
    }
  }

  for (let i = 0; i < serial.length; i++) {
    if (serial[i].portName != null) {
      select('#option-' + serial[i].portName).style(
        'color',
        '#ffeb3b',
      );
      select('#option-' + serial[i].portName).elt.innerHTML +=
        ' <-- connected';
    }

    for (let j = 0; j < portSelect.elt.childElementCount; j++) {
      if (
        portSelect.elt.children[j].innerHTML == serial[i].portName
      ) {
        portSelect.elt.children[j].remove();
      }
    }
  }
}

function portSelected() {
  selectedPort = portSelect.value();
  connectButton.show();
}

function connectPressed() {
  // if (!selectedPort) {
  // 	selectedPort = portSelect.value();
  // }
  serial[0].seriallog('Opening: ' + portSelect.value());

  if (serial[serial.length - 1].portName != null) {
    serial.push(new SerialPortClient());

    console.log('create new serial port client');
  }

  serial[serial.length - 1].connectPort(portSelect.value());
  serial[serial.length - 1].createPanel();

  updateStartCode();

  //remove connected port off the list

  //connectButton.hide();
  // disconnectButton.show();
}

function updateStartCode() {
  let serialPortsArray = [];

  for (let i = 0; i < serial.length; i++) {
    if (serial[i].portName != null) {
      serialPortsArray.push("'" + serial[i].portName + "'");
    }
  }

  if (serialPortsArray.length < 2) {
    select('#start-code').elt.innerHTML = `
        let serial;<br>
        let latestData = "waiting for data";<br>
        <br>
        function setup() {<br>
        &nbsp;createCanvas(windowWidth, windowHeight);<br>
        <br>
        &nbsp;serial = new p5.SerialPort();<br>
        <br>
        &nbsp;serial.list();<br>
        &nbsp;serial.open(${serialPortsArray[0]});<br>
        <br>
        &nbsp;serial.on('connected', serverConnected);<br>
        <br>
        &nbsp;serial.on('list', gotList);<br>
        <br>
        &nbsp;serial.on('data', gotData);<br>
        <br>
        &nbsp;serial.on('error', gotError);<br>
        <br>
        &nbsp;serial.on('open', gotOpen);<br>
        <br>
        &nbsp;serial.on('close', gotClose);<br>
}<br>
<br>
function serverConnected() {<br>
  &nbsp;print("Connected to Server");<br>
}<br>
<br>
function gotList(thelist) {<br>
  &nbsp;print("List of Serial Ports:");<br>
  <br>
  &nbsp;for (let i = 0; i < thelist.length; i++) {<br>
  &nbsp;&nbsp;print(i + " " + thelist[i]);<br>
  &nbsp;}<br>
}<br>
<br>
function gotOpen() {<br>
  &nbsp;print("Serial Port is Open");<br>
}<br>
<br>
function gotClose(){<br>
    &nbsp;print("Serial Port is Closed");<br>
    &nbsp;latestData = "Serial Port is Closed";<br>
}<br>
<br>
function gotError(theerror) {<br>
  &nbsp;print(theerror);<br>
}<br>
<br>
function gotData() {<br>
  &nbsp;let currentString = serial.readLine();<br>
  &nbsp; trim(currentString);<br>
  &nbsp;if (!currentString) return;<br>
  &nbsp;console.log(currentString);<br>
  &nbsp;latestData = currentString;<br>
}<br>
<br>
function draw() {<br>
  &nbsp;background(255,255,255);<br>
  &nbsp;fill(0,0,0);<br>
  &nbsp;text(latestData, 10, 10);<br>
  &nbsp;// Polling method<br>
  &nbsp;/*<br>
  &nbsp;if (serial.available() > 0) {<br>
  &nbsp;&nbsp;let data = serial.read();<br>
  &nbsp;&nbsp;ellipse(50,50,data,data);<br>
  &nbsp;}<br>
  &nbsp;*/<br>
}<br>`;

    select('#start-code').elt.style.display = 'block';
  } else {
    serialPortsArray = serialPortsArray.join(',');

    select('#start-code').elt.innerHTML = `
        let serialPorts = [${serialPortsArray}];<br>
        let serials = [];<br>
        let data = [];<br>
        <br>
        function setup() {<br>
        &nbsp;createCanvas(windowWidth, windowHeight);<br>
        &nbsp;for(let i = 0; i < serialPorts.length; i++){<br>
        &nbsp;&nbsp;let newPort = new p5.SerialPort();<br>
        <br>
        &nbsp;&nbsp;newPort.open(serialPorts[i]);<br>
        <br>
        &nbsp;&nbsp;newPort.on('connected', serverConnected);<br>
        &nbsp;&nbsp;newPort.on('list', gotList);<br>
        &nbsp;&nbsp;newPort.on('data', gotData.bind(this, i));<br>
        &nbsp;&nbsp;newPort.on('error', gotError);<br>
        &nbsp;&nbsp;newPort.on('open', gotOpen);<br>
        &nbsp;&nbsp;newPort.on('gotClose', gotClose);<br>
        <br>
        &nbsp;&nbsp;serials.push(newPort);<br>
        &nbsp;}<br>
        <br>
        &nbsp;serials[0].list();<br>
}<br>
<br>
function serverConnected() {<br>
  &nbsp;print("Connected to Server");<br>
}<br>
<br>
function gotList(thelist) {<br>
  &nbsp;print("List of Serial Ports:");<br>
  <br>
  &nbsp;for (let i = 0; i < thelist.length; i++) {<br>
  &nbsp;&nbsp;print(i + " " + thelist[i]);<br>
  &nbsp;}<br>
}<br>
<br>
function gotOpen() {<br>
  &nbsp;print("Serial Port is Open");<br>
}<br>
<br>
function gotClose(){<br>
    &nbsp;print("Serial Port is Closed");<br>
    &nbsp;latestData = "Serial Port is Closed";<br>
}<br>
<br>
function gotError(theerror) {<br>
  &nbsp;print(theerror);<br>
}<br>
<br>
function gotData(index) {<br>
  &nbsp;let currentString = serial[index].readLine();<br>
  &nbsp; trim(currentString);<br>
  &nbsp;if (!currentString) return;<br>
  &nbsp;console.log(currentString);<br>
  &nbsp;data[index] = currentString;<br>
}<br>
<br>
function draw() {<br>
  &nbsp;background(255,255,255);<br>
  &nbsp;fill(0,0,0);<br>
  &nbsp;text(latestData, 10, 10);<br>
  &nbsp;// Polling method<br>
  &nbsp;/*<br>
  &nbsp;if (serial.available() > 0) {<br>
  &nbsp;&nbsp;let data = serial.read();<br>
  &nbsp;&nbsp;ellipse(50,50,data,data);<br>
  &nbsp;}<br>
  &nbsp;*/<br>
}<br>`;
    select('#start-code').elt.style.display = 'block';
  }
}

function checkSerialClientClose() {
  for (let i = 1; i < serial.length; i++) {
    if (serial[i].portName == null) {
      serial.splice(i, 1);
    }
  }
}

class SerialPortClient {
  constructor() {
    this.serial = new p5.SerialPort();
    // Callback for list of ports available
    this.serial.on('list', gotList);

    // Get a list the ports available
    // You should have a callback defined to see the results
    this.serial.list();

    // Here are the callbacks that you can register

    // When we connect to the underlying server
    this.serial.on('connected', serverConnected);

    // When we get a list of serial ports that are available
    // OR
    //serial.onList(gotList);

    // When we some data from the serial port
    this.serial.on('data', this.gotData.bind(this));
    // OR
    //serial.onData(gotData);

    this.serial.on('close', this.gotClose.bind(this));

    // When or if we get an error
    this.serial.on('error', this.gotError.bind(this));
    // OR
    //serial.onError(gotError);

    // When our serial port is opened and ready for read/write
    this.serial.on('open', this.gotOpen.bind(this));
    // OR
    //serial.onOpen(gotOpen);

    // Callback to get the raw data, as it comes in for handling yourself
    this.serial.on('rawdata', this.gotRawData.bind(this));
    // OR
    //serial.onRawData(gotRawData);

    this.portName = null;

    this.portPanel;

    this.disconnectButton;
    this.serialConsoleEnabledCheckbox;
    this.serialConsoleEnabled = false;
    this.asciiConsole = '';
    this.readAsciiEnabledCheckbox;
    this.readAsciiEnabled = false;
    this.serialConsole;
    this.clearButton;
    this.sendMessage;
    this.sendButton;
    this.consoleBuffer = [];
    this.lastConsoleLogTime = Date.now();
    this.LOGWAIT = 100;
  }

  connectPort(portName) {
    this.portName = portName;
    this.serial.open(portName);
  }

  createPanel() {
    this.portPanel = createDiv().class('port-control-panel');
    this.portPanel.id(this.portName);

    this.portPanel.elt.innerHTML =
      "<div class='wrapper'><h2 class='panel-name'>Control Panel: " +
      this.portName +
      '</h2>\n' +
      '<button type="button" class=\'close\' id="disconnect-' +
      this.portName +
      '" value="Close" aria-labelledby="disconnect portselect">Close</button>\n' +
      '</div>\n' +
      '<div class="info-inline">\n' +
      '<div class="serial-console">\n' +
      '<div class="serial-monitor">\n' +
      '<label class="info-static" id="consolelabel" for="serialconsole">Serial Console:</label>\n' +
      '<div class="wrapper">\n' +
      '<textarea id="serialconsole-' +
      this.portName +
      '" cols=80 rows=20></textarea>\n' +
      '</div>\n' +
      '<div class="wrapper">\n' +
      '<input id="serialconsoleenabled-' +
      this.portName +
      '" type="checkbox" value="true" checked=""><label for="serialconsoleenabled-' +
      this.portName +
      '">console enabled</label>\n' +
      '<input id="readascii-' +
      this.portName +
      '" type="checkbox" value="true" checked=""><label for="readascii-' +
      this.portName +
      '">read in ASCII</label>\n' +
      '<button type="button" class=\'clear\' id="clear-' +
      this.portName +
      '" value="Clear" aria-labelledby="clear consolelabel">Clear</button>\n' +
      '</div>\n' +
      '</div>\n' +
      '<div class="serial-sender">\n' +
      '<label class="info-static" id="sendserial" for="message">Data to Arduino(ASCII) :</label>\n' +
      '<div class="wrapper">\n' +
      '<input type="text" class=\'message\' id="message-' +
      this.portName +
      '" size=80>\n' +
      '<button type="button" class=\'send\' id="send-' +
      this.portName +
      '" value="Send" aria-labelledby="send sendserial">Send</button>\n' +
      '</div>\n' +
      '<div class="wrapper">\n' +
      '</div>\n' +
      '</div>\n' +
      '</div>\n' +
      '</div>';

    this.portPanel.parent(select('#connected-ports'));

    for (let i = 0; i < portSelect.elt.childElementCount; i++) {
      if (portSelect.elt.children[i].innerHTML == this.portName) {
        portSelect.elt.children[i].remove();
      }
    }

    select('#option-' + this.portName).style('color', '#ffeb3b');
    select('#option-' + this.portName).elt.innerHTML +=
      ' <-- connected';

    this.serialConsole = select('#serialconsole-' + this.portName);
    this.serialConsoleEnabledCheckbox = select(
      '#serialconsoleenabled-' + this.portName,
    );
    this.serialConsoleEnabledCheckbox.elt.checked = false;
    this.serialConsoleEnabledCheckbox.elt.addEventListener(
      'change',
      this.serialConsoleSwitch.bind(this),
    );
    this.readAsciiEnabledCheckBox = select(
      '#readascii-' + this.portName,
    );
    this.readAsciiEnabledCheckBox.elt.checked = false;
    this.readAsciiEnabledCheckBox.elt.addEventListener(
      'change',
      this.readAsciiSwitch.bind(this),
    );
    this.readAsciiEnabledCheckBox.elt.disabled = true;

    this.clearButton = select('#clear-' + this.portName);
    this.clearButton.elt.addEventListener(
      'click',
      this.clearPressed.bind(this),
    );
    //clearButton.mousePressed("clearPressed");

    this.sendButton = select('#send-' + this.portName);
    this.sendMessage = select('#message-' + this.portName);
    this.sendButton.elt.addEventListener(
      'click',
      this.sendPressed.bind(this),
    );

    this.disconnectButton = select('#disconnect-' + this.portName);
    this.disconnectButton.mousePressed(
      this.disconnectPressed.bind(this),
    );
  }

  disconnectPressed() {
    console.log('disconnecting ' + this.portName);

    this.seriallog('Closing: ' + this.portName);

    // alert(`Closing ${this.portName}`);

    this.portName = null;

    this.consoleBuffer = [];
    this.asciiConsole = '';
    this.lastConsoleLogTime = Date.now();
    this.serialConsoleEnabled = false;
    this.readAsciiEnabled = false;

    gotList(this.serial.list());

    this.serial.close();

    //wait for close confirmation from serialport before removing portPanel
  }

  serialConsoleSwitch() {
    if (this.serialConsoleEnabledCheckbox.checked()) {
      this.serialConsoleEnabled = true;
    } else {
      this.serialConsoleEnabled = false;
    }
  }

  readAsciiSwitch() {
    console.log('change to ascii');
    if (this.readAsciiEnabledCheckBox.checked()) {
      this.serialConsole.elt.value =
        'console changed to ASCII mode' + '\n';
      this.readAsciiEnabled = true;
    } else {
      this.serialConsole.elt.value =
        'console changed to RAW mode' + '\n';
      this.readAsciiEnabled = false;
    }
  }

  clearPressed() {
    this.serialConsole.elt.value = '';
  }

  sendPressed() {
    this.serial.write(this.sendMessage.elt.value);
    this.sendMessage.elt.value = '';
  }

  seriallog(txt) {
    if (this.serialConsoleEnabled) {
      this.consoleBuffer.push(txt);

      if (
        this.consoleBuffer[this.consoleBuffer.indexOf(13) + 1] == 10
      ) {
        if (this.readAsciiEnabledCheckBox.elt.disabled == true) {
          this.readAsciiEnabledCheckBox.elt.disabled = false;
        }
      }

      if (this.lastConsoleLogTime + this.LOGWAIT < Date.now()) {
        if (this.serialConsole.elt.value.length >= 800) {
          //this.serialConsole.elt.innerHTML = "";
          this.serialConsole.elt.value =
            this.serialConsole.elt.value.substring(400);
          //
          //     //console.log("this.serialConsole.elt.innerHTML.length >= 800: " + this.serialConsole.elt.innerHTML.length);
        }

        if (this.readAsciiEnabled) {
          this.serialConsole.elt.value += this.asciiConsole + '\n';
        } else {
          this.serialConsole.elt.value +=
            this.consoleBuffer.join('\n');
        }

        this.serialConsole.elt.scrollTop =
          this.serialConsole.elt.scrollHeight;

        this.lastConsoleLogTime = Date.now();
        this.consoleBuffer.length = 0;
      }
    }
  }

  gotClose() {
    if (this.portName != null) {
      console.log(`${this.portName} has been closed`);
      alert(`${this.portName} has been closed`);

      this.disconnectPressed();
    }

    this.portPanel.remove();
    console.log('removing panel');

    if (
      serial.length > 0 &&
      serial[serial.length - 1].portName != null
    ) {
      updateStartCode();
    } else {
      select('#start-code').elt.innerHTML = '';
      select('#start-code').elt.style.display = 'none';
    }

    checkSerialClientClose();
  }

  gotOpen() {
    this.seriallog('Serial Port is Open');
  }

  // Uh oh, here is an error, let's log it
  gotError(theerror) {
    alert(`Error on ${this.portName}: ${theerror} - Closing Port`);
    this.seriallog(theerror);

    this.gotClose();
  }

  // There is data available to work with from the serial port
  gotData() {
    if (this.readAsciiEnabled) {
      // read the incoming string
      let currentString = this.serial.readLine();
      // remove any trailing whitespace
      trim(currentString);
      if (!currentString) return;

      this.asciiConsole = currentString;
    }
  }

  // we got raw from the serial port
  gotRawData(thedata) {
    this.seriallog(thedata);
  }
}
