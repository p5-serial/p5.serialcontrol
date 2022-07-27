import processing.net.*;

import processing.serial.*;

Server webServer;
int port = 5204;

int leftMargin = 10;
int deltaVertical = 30;

String ipAddress = "TODO";

Serial serialport;

String[] availableSerialPorts;

void setup() {
  size(600, 600);

  webServer = new Server(this, port);

  availableSerialPorts = Serial.list();
}

void draw() {
  background(255);
  fill(0);
  text("p5.serialcontrol", leftMargin, deltaVertical*1);
  text("IP address: " + ipAddress, leftMargin, deltaVertical*2);
  text("available serial ports: ", leftMargin, deltaVertical*3);
  for (int i = 0; i < availableSerialPorts.length; i++) {
    text(availableSerialPorts[i], leftMargin, deltaVertical*(4 + i));
  }
}
