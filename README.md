# Mastercontrol Plugin for Volumio

This plugin allows you to control your audio equipment via serial commands from your Volumio system.

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

## Features

- Control power, volume, and source selection
- Support for multiple rooms/zones
- Customizable commands via commands.json

## Troubleshooting

If you encounter issues:
- Check your serial port configuration
- Ensure proper permissions for the serial device
- Review Volumio logs for error messages