'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var path = require('path');

// Load config
var configFile = fs.readJsonSync(__dirname + '/config.json');
var serial_port_config = configFile.SERIALPORTDEVICE.value;

// Define the mastercontrol constructor function first
function mastercontrol(context) {
  var self = this;
  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;
  this.serial_port_config = serial_port_config;
  
  // Load commands from JSON file
  try {
    self.commands = require('./commands.json');
    self.logger.info('Loaded commands.json successfully');
  } catch (e) {
    self.logger.error('Error loading commands.json: ' + e.message);
    self.commands = { default: {} };
  }
}

// Then export it
module.exports = mastercontrol;

mastercontrol.prototype.onVolumioStart = function() {
  var self = this;
  return libQ.resolve();
};

mastercontrol.prototype.onStart = function() {
  var self = this;
  var defer = libQ.defer();
  
  try {
    self.logger.info("mastercontrol started with serial port: /dev/" + self.serial_port_config);
    defer.resolve();
  } catch (e) {
    self.logger.error('Error starting mastercontrol plugin: ' + e.message);
    defer.reject(e);
  }
  
  return defer.promise;
};

mastercontrol.prototype.onStop = function() {
  var self = this;
  var defer = libQ.defer();
  
  self.logger.info("mastercontrol stopped");
  defer.resolve();
  return defer.promise;
};

mastercontrol.prototype.onRestart = function() {
  var self = this;
  // Optional restart handler
};

mastercontrol.prototype.getConfigurationFiles = function() {
  return ['config.json'];
};

// Send command to device
mastercontrol.prototype.SendCommand = function(commanddata) {
  var self = this;
  var defer = libQ.defer();
  
  try {
    self.logger.info('SendCommand called with: ' + commanddata);
    
    // Use the Python script directly
    const { exec } = require('child_process');
    exec(`python3 /data/plugins/miscellanea/mastercontrol/BSC.py "${commanddata}" /dev/${self.serial_port_config}`, (error, stdout, stderr) => {
      if (error) {
        self.logger.error(`Error executing Python command: ${error.message}`);
        defer.reject(error);
        return;
      }
      if (stderr) {
        self.logger.warn(`Python command stderr: ${stderr}`);
      }
      self.logger.info(`Python command executed: ${commanddata}, stdout: ${stdout}`);
      defer.resolve();
    });
  } catch (e) {
    self.logger.error('Error in SendCommand: ' + e.message);
    defer.reject(e);
  }
  
  return defer.promise;
};

// Send command to Room 1
mastercontrol.prototype.SendCommandRoom1 = function(commanddata) {
  var self = this;
  var defer = libQ.defer();
  
  try {
    // Append Room 1 to the command
    var roomCommand = commanddata + " Room 1";
    self.SendCommand(roomCommand)
      .then(function() {
        defer.resolve();
      })
      .fail(function(err) {
        defer.reject(err);
      });
  } catch (e) {
    self.logger.error('Error in SendCommandRoom1: ' + e.message);
    defer.reject(e);
  }
  
  return defer.promise;
};

// Send command to Room 2
mastercontrol.prototype.SendCommandRoom2 = function(commanddata) {
  var self = this;
  var defer = libQ.defer();
  
  try {
    // Append Room 2 to the command
    var roomCommand = commanddata + " Room 2";
    self.SendCommand(roomCommand)
      .then(function() {
        defer.resolve();
      })
      .fail(function(err) {
        defer.reject(err);
      });
  } catch (e) {
    self.logger.error('Error in SendCommandRoom2: ' + e.message);
    defer.reject(e);
  }
  
  return defer.promise;
};

// Update configuration
mastercontrol.prototype.saveSettings = function(data) {
  var self = this;
  var defer = libQ.defer();
  
  try {
    var configFile = fs.readJsonSync(__dirname + '/config.json');
    configFile.SERIALPORTDEVICE.value = data.SERIAL_PORT;
    fs.writeJsonSync(__dirname + '/config.json', configFile);
    
    self.serial_port_config = data.SERIAL_PORT;
    self.commandRouter.pushToastMessage('success', "Serial Port Updated", "Set new Serial-Hardware: " + data.SERIAL_PORT);
    
    defer.resolve();
  } catch (e) {
    self.logger.error('Error saving settings: ' + e.message);
    defer.reject(e);
  }
  
  return defer.promise;
};

mastercontrol.prototype.getUIConfig = function() {
  var self = this;
  var defer = libQ.defer();
  
  try {
    var lang_code = self.commandRouter.sharedVars.get('language_code');
    
    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
      __dirname+'/i18n/strings_en.json',
      __dirname + '/UIConfig.json')
      .then(function(uiconf) {
        // Find the serial port setting section
        var serialPortSection = null;
        for (var i = 0; i < uiconf.sections.length; i++) {
          if (uiconf.sections[i].id === 'serialport-setting') {
            serialPortSection = uiconf.sections[i];
            break;
          }
        }
        
        if (serialPortSection) {
          // Find the SERIAL_PORT input field
          for (var j = 0; j < serialPortSection.content.length; j++) {
            if (serialPortSection.content[j].id === 'SERIAL_PORT') {
              // Set the current value
              serialPortSection.content[j].value = self.serial_port_config;
              break;
            }
          }
        }
        
        defer.resolve(uiconf);
      })
      .fail(function(error) {
        self.logger.error('Error loading UI config: ' + error);
        defer.reject(new Error());
      });
  } catch (e) {
    self.logger.error('Error in getUIConfig: ' + e.message);
    defer.reject(e);
  }

  return defer.promise;
};

mastercontrol.prototype.setUIConfig = function(data) {
  var self = this;
  // Optional method
};

mastercontrol.prototype.getConf = function(varName) {
  var self = this;
  // Optional method
};

mastercontrol.prototype.setConf = function(varName, varValue) {
  var self = this;
  // Optional method
};