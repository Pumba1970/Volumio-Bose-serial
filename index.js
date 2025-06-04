console.log("DEBUG: Plugin file loaded");
const fs = require('fs');
const path = require('path');
console.log("DEBUG: typeof path = " + typeof path);
const { SerialPort } = require('serialport');

module.exports = class BoseSerialPlugin {
  constructor(context) {
    this.context = context;
    this.coreCommand = context.coreCommand;
    // Load config from config.json in plugin folder
    this.configFile = path.join(__dirname, 'config.json');
    if (fs.existsSync(this.configFile)) {
      try {
        this.config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      } catch (e) {
        this.config = {};
        this.coreCommand.logger.error("Error reading config.json: " + e.message);
      }
    } else {
      this.config = {};
    }
  }

  onStart() {
    const commands = {
      sendNow:       "4D 4D 4A 41 01",
      sendOff:       "4D 4D 4A 43 01",
      roomAVolPlus:  "4D 4D 44 41 00",
      roomAVolMin:   "4D 4D 44 42 00",
      roomAMute:     "4D 4D 43 41 01",
      roomAUnmute:   "4D 4D 43 40 01",
      roomBVolPlus:  "4D 4D 44 41 01",
      roomBVolMin:   "4D 4D 44 42 01",
      roomBMute:     "4D 4D 43 41 02",
      roomBUnmute:   "4D 4D 43 40 02",
      roomASetAux:   "4D 4D 42 40 01 03",
      roomBSetAux:   "4D 4D 42 40 02 03"
    };

    // Send the power-on command at start
    this.sendCommand(commands.sendNow, "Auto Power On bij start");
    return Promise.resolve();
	this.coreCommand.logger.info('DEBUG typeof path: ' + typeof path);

  }

  onStop() {
    return Promise.resolve();
  }

  sendCommand(hexString, description) {
    const logger = this.coreCommand.logger;
    const portPath = this.config.portPath || '/dev/ttyUSB0';
    const baudRate = parseInt(this.config.baudRate || '9600', 10);

    let buffer;
    try {
      buffer = Buffer.from(hexString.trim().split(' ').map(b => parseInt(b, 16)));
    } catch (err) {
  logger.error(`Error processing command (${description}): ` + err.message);
	}

    const port = new SerialPort(portPath, { baudRate, autoOpen: false });
    port.open(err => {
      if (err) {
        logger.error(`Cannot open port (${description}): ` + err.message);
        return;
      }
      port.write(buffer, err => {
        if (err) logger.error(`Error sending (${description}): ` + err.message);
        else logger.info(`Sent: ${description}`);
        port.close();
      });
    });
  }

  getUIConfig() {
    const path = require('path');
    const configPath = path.join(__dirname, 'UIConfig.json');
    let config = {};
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      this.coreCommand.logger.error("Failed to load UIConfig: " + e.message);
    }
    return config;
  }
};