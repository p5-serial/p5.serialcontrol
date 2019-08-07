// Declare a "SerialPort" object
let serial = [];
let portListDiv;
let portSelect;
let rescanPorts;
let connectButton;

function setup() {
	noCanvas();

	portListDiv = select("#serialports");
	
	// GUI controls
	portSelect = createSelect();
	portSelect.option("No Ports Found");
	portSelect.parent(select("#portselectdiv"));

	rescanPorts = select("#rescan");
	rescanPorts.mousePressed(function() {
		serial[0].serial.list();
	});

	connectButton = select("#connect");
	connectButton.mousePressed(connectPressed);
	
	// Instantiate our SerialPort object
	serial.push(new SerialPortClient());

}

// We are connected and ready to go
function serverConnected() {
  serial[0].seriallog("Connected to Server");
}

// Got the list of ports
function gotList(thelist) {
	serial[0].seriallog("Available Serial Ports:");
		
	if (portSelect) {
		portSelect.remove();
	}
	
	portSelect = createSelect();
	portSelect.parent(select("#portselectdiv"));
	// console.log(portSelect);
	portSelect.elt.setAttribute('id','portselect');
	portSelect.elt.setAttribute('aria-label','selected port');

	//This isn't working - Looks like p5.dom bug
	//newPortSelect.changed(portSelected);
	portSelect.elt.addEventListener('change', portSelected);
	
	if (portListDiv) {
		portListDiv.elt.innerHTML = "";
	}

	for (let i = 0; i < thelist.length; i++) {
		serial[0].seriallog(i + " " + thelist[i]);

		portSelect.option(thelist[i]);

		if (portListDiv) {
			portListDiv.elt.innerHTML += "<p class='port-options' id='option-" + thelist[i] + "'>" + thelist[i]+ "</p>\n";
		}
	}

	for(let i = 0; i < serial.length; i++){
		if(serial[i].portName != null){
            select("#option-" + serial[i].portName).style("color", "#ffeb3b");
            select("#option-" + serial[i].portName).elt.innerHTML += " <-- connected";
		}

        for(let j = 0; j < portSelect.elt.childElementCount; j++){
            if(portSelect.elt.children[j].innerHTML == serial[i].portName){
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
	serial[0].seriallog("Opening: " + portSelect.value());

	if(serial[serial.length - 1].portName != null){
        serial.push(new SerialPortClient());

        console.log('create new serial port client');
	}

	serial[serial.length - 1].connectPort(portSelect.value());
	serial[serial.length - 1].createPanel();

	//remove connected port off the list

    //connectButton.hide();
    // disconnectButton.show();
}

function checkSerialClientClose(){
	for(let i = 1; i < serial.length; i++){
		if(serial[i].portName == null){
			serial.splice(i, 1);
		}
	}
}


// Methods available
// serial.read() returns a single byte of data (first in the buffer)
// serial.readChar() returns a single char 'A', 'a'
// serial.readBytes() returns all of the data available as an array of bytes
// serial.readBytesUntil('\n') returns all of the data available until a '\n' (line break) is encountered
// serial.readString() retunrs all of the data available as a string
// serial.readStringUntil('\n') returns all of the data available as a string until a specific string is encountered
// serial.readLine() calls readStringUntil with "\r\n" typical linebreak carriage return combination
// serial.last() returns the last byte of data from the buffer
// serial.lastChar() returns the last byte of data from the buffer as a char
// serial.clear() clears the underlying serial buffer
// serial.available() returns the number of bytes available in the buffer
// serial.write(somelet) writes out the value of somelet to the serial device


class SerialPortClient{

	constructor(){
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
        this.readAsciiEnabledCheckbox;
        this.readAsciiEnabled = false;
        this.serialConsole;
        this.clearButton;
        this.sendMessage;
        this.sendButton;
        this.consoleBuffer = [];
        this.lastConsoleLogTime = Date.now();
        this.LOGWAIT = 50;

	}

	connectPort(portName){
		this.portName = portName;
		this.serial.open(portName);
	}

	createPanel(){
        this.portPanel = createDiv().class('port-control-panel');
        this.portPanel.id(this.portName);

        this.portPanel.elt.innerHTML = "<div class='wrapper'><h2 class='panel-name'>Control Panel: " + this.portName + "</h2>\n" +
            "<button type=\"button\" class='close' id=\"disconnect-" + this.portName + "\" value=\"Close\" aria-labelledby=\"disconnect portselect\">Close</button>\n" +
            "</div>\n" +
            "<div class=\"info-inline\">\n" +
            "<div class=\"serial-console\">\n" +
            "<div class=\"serial-monitor\">\n" +
            "<label class=\"info-static\" id=\"consolelabel\" for=\"serialconsole\">Serial Console:</label>\n" +
            "<div class=\"wrapper\">\n" +
            "<textarea id=\"serialconsole-" + this.portName + "\" cols=80 rows=20></textarea>\n" +
            "</div>\n" +
            "<div class=\"wrapper\">\n" +
            "<input id=\"serialconsoleenabled-" + this.portName + "\" type=\"checkbox\" value=\"true\" checked=\"\"><label for=\"serialconsoleenabled-" + this.portName + "\">console enabled</label>\n" +
            "<input id=\"readascii-" + this.portName + "\" type=\"checkbox\" value=\"true\" checked=\"\"><label for=\"readascii-" + this.portName + "\">read in ASCII</label>\n" +
            "<button type=\"button\" class='clear' id=\"clear-" + this.portName + "\" value=\"Clear\" aria-labelledby=\"clear consolelabel\">Clear</button>\n" +
            "</div>\n" +
            "</div>\n" +
            "<div class=\"serial-sender\">\n" +
            "<label class=\"info-static\" id=\"sendserial\" for=\"message\">Data to Arduino(ASCII) :</label>\n" +
            "<div class=\"wrapper\">\n" +
            "<input type=\"text\" class='message' id=\"message-" + this.portName + "\" size=80>\n" +
            "<button type=\"button\" class='send' id=\"send-" + this.portName + "\" value=\"Send\" aria-labelledby=\"send sendserial\">Send</button>\n" +
            "</div>\n" +
            "<div class=\"wrapper\">\n" +
            "</div>\n" +
            "</div>\n" +
            "</div>\n" +
            "</div>";

        this.portPanel.parent(select('#connected-ports'));

        for(let i = 0; i < portSelect.elt.childElementCount; i++){
        	if(portSelect.elt.children[i].innerHTML == this.portName){
        		portSelect.elt.children[i].remove();
			}
		}

        select("#option-" + this.portName).style("color", "#ffeb3b");
        select("#option-" + this.portName).elt.innerHTML += " <-- connected";

        this.serialConsole = select("#serialconsole-" + this.portName);
        this.serialConsoleEnabledCheckbox = select("#serialconsoleenabled-" + this.portName);
        this.serialConsoleEnabledCheckbox.elt.checked = false;
        this.serialConsoleEnabledCheckbox.elt.addEventListener('change', this.serialConsoleSwitch.bind(this));
        this.readAsciiEnabledCheckBox = select("#readascii-" + this.portName);
        this.readAsciiEnabledCheckBox.elt.checked = false;
        this.readAsciiEnabledCheckBox.elt.addEventListener('change', this.readAsciiSwitch.bind(this));

        this.clearButton = select("#clear-" + this.portName);
        this.clearButton.elt.addEventListener('click', this.clearPressed.bind(this));
        //clearButton.mousePressed("clearPressed");

        this.sendButton = select("#send-" + this.portName);
        this.sendMessage = select("#message-" + this.portName);
        this.sendButton.elt.addEventListener('click', this.sendPressed.bind(this));

        this.disconnectButton = select("#disconnect-" + this.portName);
        this.disconnectButton.mousePressed(this.disconnectPressed.bind(this));


	}

	disconnectPressed(){
		console.log("disconnecting " + this.portName);

        this.seriallog("Closing: " + this.portName);

        alert(`Closing ${this.portName}`);

        this.portName = null;

        this.consoleBuffer = [];
        this.asciiConsole = "";
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

    readAsciiSwitch(){
		console.log('change to ascii');
        if (this.readAsciiEnabledCheckBox.checked()) {
            this.seriallog("console changed to ASCII mode" + "\n");
            this.readAsciiEnabled = true;
        } else {
            this.readAsciiEnabled = false;
            this.seriallog("console changed to RAW mode" + "\n");
        }
	}

    clearPressed() {
        this.serialConsole.elt.value = "";
    }

    sendPressed() {
        this.serial.write(this.sendMessage.elt.value);
        this.sendMessage.elt.value = "";
    }

    seriallog(txt) {
        if (this.serialConsoleEnabled) {

            this.consoleBuffer.push(txt);

            if (this.lastConsoleLogTime + this.LOGWAIT < Date.now()) {

                if(this.readAsciiEnabled){
                    this.serialConsole.elt.value += this.asciiConsole + "\n";
                }else{
                    if (this.serialConsole.elt.value.length >= 800) {
                        this.serialConsole.elt.value = this.serialConsole.elt.value.substring(400);
                    }
                    this.serialConsole.elt.value += this.consoleBuffer.join("\n");
                }

                this.serialConsole.elt.scrollTop = this.serialConsole.elt.scrollHeight;

                this.lastConsoleLogTime = Date.now();
                this.consoleBuffer.length = 0;
            }
        }
    }

    gotClose(){
	    if(this.portName != null){
            console.log(`${this.portName} has been closed`);
            alert(`${this.portName} has been closed`);

            this.disconnectPressed();
        }

        this.portPanel.remove();
	    console.log("removing panel");

        checkSerialClientClose();
    }

    gotOpen() {
        this.seriallog("Serial Port is Open");
    }

// Ut oh, here is an error, let's log it
    gotError(theerror) {
        this.seriallog(theerror);
    }

// There is data available to work with from the serial port
     gotData() {
	    let currentString = this.serial.readLine();  // read the incoming string
 	    trim(currentString);                    // remove any trailing whitespace
 	    if (!currentString) return;             // if the string is empty, do no more

        this.asciiConsole = currentString;
    }

// We got raw from the serial port
    gotRawData(thedata) {
        this.seriallog(thedata);
    }

}
