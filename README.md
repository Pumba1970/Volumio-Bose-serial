# Mastercontrol Plugin for Volumio

This plugin allows you to control your Bose lifestyle 38 or 48 audio equipment via serial commands from your Volumio system. (Don't know if the files in node_modules.zip are necessary.
Other wise un zip then to folder node_modules.)

## Installation

1. Create a folder for the plugin:
   ```
   mkdir -p /home/volumio/mastercontrol
   ```

2. Copy all plugin files to the folder:
   ```
   cp -r * /home/volumio/mastercontrol/
   ```

3. Navigate to the plugin directory:
   ```
   cd /home/volumio/mastercontrol
   ```

4. Install the plugin:
   ```
   volumio plugin install
   ```

5. Restart Volumio:
   ```
   systemctl restart volumio
   ```

## Configuration

After installation, configure the plugin through the Volumio web interface:
1. Go to Settings > Plugins
2. Find "Master Control" in the Miscellanea section
3. Configure your serial port (e.g., ttyAMA0 or ttyUSB0)
4. configure MQTT settings
## Features

- Control power, volume, and source selection
- Support for multiple rooms/zones
- Customizable commands via commands.json

## 🔔 MQTT Doorbell (Audio Notification) (option)

This plugin supports playing a local audio file when an MQTT message is received. This can be used for a doorbell or other notification sounds on a Volumio device.

When a message is published to the following MQTT topic: mastercontrol/deurbel
the plugin executes a shell command to play a WAV file.
'mastercontrol/deurbel': '/usr/bin/aplay -q /home/volumio/ding-dong2.wav'
      🔊 Audio device (optional)
      To specify an audio output device explicitly:
      mastercontrol/deurbel': '/usr/bin/aplay -D default -q /home/volumio/ding-dong2.wav' 

## Troubleshooting

If you encounter issues:
- Check your serial port configuration
- Ensure proper permissions for the serial device
- Review Volumio logs for error messages
- sudo journalctl -u volumio -f | grep mastercontrol
