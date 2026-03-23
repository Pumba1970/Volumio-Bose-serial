'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var path = require('path');
var mqtt = require('mqtt');

// Load config
var configFile = fs.readJsonSync(__dirname + '/config.json');
var serial_port_config = configFile.SERIALPORTDEVICE.value;

// MQTT topic → command mapping
var MQTT_TOPIC_MAP = {
  'mastercontrol/room1/power':      'power Room 1',
  'mastercontrol/room1/volumeup':   'volumeplus Room 1',
  'mastercontrol/room1/volumedown': 'volumeminus Room 1',
  'mastercontrol/room1/cabsat':     'cabsat Room 1',
  'mastercontrol/room1/fm':         'fm Room 1',
  'mastercontrol/room1/mute':       'mute Room 1',
  'mastercontrol/room2/power':      'power Room 2',
  'mastercontrol/room2/volumeup':   'volumeplus Room 2',
  'mastercontrol/room2/volumedown': 'volumeminus Room 2',
  'mastercontrol/room2/cabsat':     'cabsat Room 2',
  'mastercontrol/room2/fm':         'fm Room 2',
  'mastercontrol/room2/mute':       'mute Room 2',
  'mastercontrol/poweralloff':      'poweralloff'
};

// Define the mastercontrol constructor function first
function mastercontrol(context) {
  var self = this;
  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;
  this.serial_port_config = serial_port_config;
  this.mqttClient = null;

  // Load MQTT settings from config
  var cfg = fs.readJsonSync(__dirname + '/config.json');
  this.mqtt_host     = (cfg.MQTT_HOST     && cfg.MQTT_HOST.value)     || '192.168.178.65';
  this.mqtt_port     = (cfg.MQTT_PORT     && cfg.MQTT_PORT.value)     || 1883;
  this.mqtt_user     = (cfg.MQTT_USER     && cfg.MQTT_USER.value)     || 'mqtt';
  this.mqtt_password = (cfg.MQTT_PASSWORD && cfg.MQTT_PASSWORD.value) || 'mqtt';

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
    self._startMqtt();
    defer.resolve();
  } catch (e) {
    self.logger.error('Error starting mastercontrol plugin: ' + e.message);
    defer.reject(e);
  }

  return defer.promise;
};

mastercontrol.prototype._startMqtt = function() {
  var self = this;

  var brokerUrl = 'mqtt://' + self.mqtt_host + ':' + self.mqtt_port;
  self.logger.info('mastercontrol: connecting to MQTT broker ' + brokerUrl);

  self.mqttClient = mqtt.connect(brokerUrl, {
    username:    self.mqtt_user,
    password:    self.mqtt_password,
    clientId:    'mastercontrol_' + Math.random().toString(16).slice(2, 8),
    reconnectPeriod: 5000
  });

  self.mqttClient.on('connect', function() {
    self.logger.info('mastercontrol: MQTT connected to ' + brokerUrl);
    var topics = Object.keys(MQTT_TOPIC_MAP);
    self.mqttClient.subscribe(topics, function(err) {
      if (err) {
        self.logger.error('mastercontrol: MQTT subscribe error: ' + err.message);
      } else {
        self.logger.info('mastercontrol: MQTT subscribed to ' + topics.join(', '));
      }
    });
  });

  self.mqttClient.on('message', function(topic, message) {
    var cmd = MQTT_TOPIC_MAP[topic];
    if (!cmd) {
      self.logger.warn('mastercontrol: received unknown MQTT topic: ' + topic);
      return;
    }
    self.logger.info('mastercontrol: MQTT [' + topic + '] → SendCommand("' + cmd + '")');
    self.SendCommand(cmd).fail(function(err) {
      self.logger.error('mastercontrol: error executing MQTT command "' + cmd + '": ' + err);
    });
  });

  self.mqttClient.on('error', function(err) {
    self.logger.error('mastercontrol: MQTT error: ' + err.message);
  });

  self.mqttClient.on('reconnect', function() {
    self.logger.info('mastercontrol: MQTT reconnecting…');
  });

  self.mqttClient.on('offline', function() {
    self.logger.warn('mastercontrol: MQTT client went offline');
  });
};

mastercontrol.prototype.onStop = function() {
  var self = this;
  var defer = libQ.defer();

  if (self.mqttClient) {
    self.mqttClient.end(true, {}, function() {
      self.logger.info('mastercontrol: MQTT client disconnected');
    });
    self.mqttClient = null;
  }

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

    if (data.SERIAL_PORT !== undefined) {
      configFile.SERIALPORTDEVICE.value = data.SERIAL_PORT;
      self.serial_port_config = data.SERIAL_PORT;
    }
    if (data.MQTT_HOST !== undefined)     { configFile.MQTT_HOST.value     = data.MQTT_HOST;     self.mqtt_host     = data.MQTT_HOST; }
    if (data.MQTT_PORT !== undefined)     { configFile.MQTT_PORT.value     = parseInt(data.MQTT_PORT, 10); self.mqtt_port = parseInt(data.MQTT_PORT, 10); }
    if (data.MQTT_USER !== undefined)     { configFile.MQTT_USER.value     = data.MQTT_USER;     self.mqtt_user     = data.MQTT_USER; }
    if (data.MQTT_PASSWORD !== undefined) { configFile.MQTT_PASSWORD.value = data.MQTT_PASSWORD; self.mqtt_password = data.MQTT_PASSWORD; }

    fs.writeJsonSync(__dirname + '/config.json', configFile);

    // Reconnect MQTT with new settings if any MQTT param changed
    var mqttChanged = data.MQTT_HOST !== undefined || data.MQTT_PORT !== undefined ||
                      data.MQTT_USER !== undefined || data.MQTT_PASSWORD !== undefined;
    if (mqttChanged && self.mqttClient) {
      self.mqttClient.end(true, {}, function() {
        self.logger.info('mastercontrol: MQTT reconnecting with new settings…');
        self._startMqtt();
      });
    }

    self.commandRouter.pushToastMessage('success', "Settings Updated", "Master Control settings saved.");
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
        // Populate live values for all settings fields
        var fieldValues = {
          'SERIAL_PORT':    self.serial_port_config,
          'MQTT_HOST':      self.mqtt_host,
          'MQTT_PORT':      self.mqtt_port,
          'MQTT_USER':      self.mqtt_user,
          'MQTT_PASSWORD':  self.mqtt_password
        };

        for (var i = 0; i < uiconf.sections.length; i++) {
          var section = uiconf.sections[i];
          if (section.content) {
            for (var j = 0; j < section.content.length; j++) {
              var field = section.content[j];
              if (field.id && fieldValues.hasOwnProperty(field.id)) {
                field.value = fieldValues[field.id];
              }
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