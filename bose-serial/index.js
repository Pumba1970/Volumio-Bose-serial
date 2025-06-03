onStart() {
  const discoveryPlugin = this.context.coreCommand.pluginManager.getPlugin('system_controller', 'volumiodiscovery');
  const socket = discoveryPlugin ? discoveryPlugin.socket : undefined;

  if (!socket) {
    this.context.coreCommand.logger.error("Bose Serial: Could not obtain Volumio Discovery socket. Plugin will not function.");
    return false;
  }

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
