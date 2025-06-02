
const SerialPort = require('serialport');

module.exports = class BoseSerialPlugin {
  constructor(context) {
    this.context = context;
    this.config = this.context.config;
  }

  onStart() {
    const socket = this.context.coreCommand.pluginManager.getPlugin('system_controller', 'volumiodiscovery').socket;

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

    for (const [event, hex] of Object.entries(commands)) {
      socket.on(event, () => this.sendCommand(hex, event));
    }

    this.sendCommand(commands.sendNow, "Auto Power On bij start");
    return true;
  }

  sendCommand(hexString, description) {
    const logger = this.context.coreCommand.logger;
    const portPath = this.config.get('portPath') || '/dev/ttyUSB0';
    const baudRate = parseInt(this.config.get('baudRate') || '9600');

    let buffer;
    try {
      buffer = Buffer.from(hexString.trim().split(' ').map(b => parseInt(b, 16)));
    } catch {
      logger.error(`Fout bij verwerken commando voor ${description}`);
      return;
    }

    const port = new SerialPort(portPath, { baudRate, autoOpen: false });
    port.open(err => {
      if (err) {
        logger.error(`Kan poort niet openen (${description}): ` + err.message);
        return;
      }
      port.write(buffer, err => {
        if (err) logger.error(`Fout bij verzenden (${description}): ` + err.message);
        else logger.info(`Verzonden: ${description}`);
        port.close();
      });
    });
  }

  onStop() {
    return true;
  }

  onUninstall() {
    this.context.coreCommand.logger.info("Bose RS232 plugin wordt verwijderd. Opruimen...");
    this.context.coreCommand.deleteConfigValue('bose-serial');
    return true;
  }

  getUIConfig() {
    return {};
  }
};
