#!/bin/bash

echo "Installing mastercontrol Dependencies"
sudo apt-get update
# Install the required packages via apt-get
sudo apt-get -y install python3 python3-pip

# Make sure we're in the right directory
cd /data/plugins/miscellanea/mastercontrol

# Install Python dependencies
echo "Installing Python dependencies..."
sudo pip3 install pyserial

# Install Node.js dependencies
echo "Installing npm dependencies..."
npm install --no-save
npm install fs-extra@11.1.1 rimraf@5.0.1 serialport@11.0.0 --no-save

# Fix permissions
sudo chown -R volumio:volumio /data/plugins/miscellanea/mastercontrol

# Make Python script executable
chmod +x /data/plugins/miscellanea/mastercontrol/BSC.py

echo "Installation completed"

#required to end the plugin install
echo "plugininstallend"