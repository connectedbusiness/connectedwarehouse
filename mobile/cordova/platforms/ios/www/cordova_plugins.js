cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "com.connectedbusiness.plugins.airprinter.AirPrinter",
      "file": "plugins/com.connectedbusiness.plugins.airprinter/www/airprinter.js",
      "pluginId": "com.connectedbusiness.plugins.airprinter",
      "clobbers": [
        "plugins.airprinter"
      ]
    },
    {
      "id": "cordova-plugin-dialogs.notification",
      "file": "plugins/cordova-plugin-dialogs/www/notification.js",
      "pluginId": "cordova-plugin-dialogs",
      "merges": [
        "navigator.notification"
      ]
    },
    {
      "id": "org.apache.cordova.console.console",
      "file": "plugins/org.apache.cordova.console/www/console-via-logger.js",
      "pluginId": "org.apache.cordova.console",
      "clobbers": [
        "console"
      ]
    },
    {
      "id": "org.apache.cordova.console.logger",
      "file": "plugins/org.apache.cordova.console/www/logger.js",
      "pluginId": "org.apache.cordova.console",
      "clobbers": [
        "cordova.logger"
      ]
    },
    {
      "id": "org.apache.cordova.network-information.network",
      "file": "plugins/org.apache.cordova.network-information/www/network.js",
      "pluginId": "org.apache.cordova.network-information",
      "clobbers": [
        "navigator.connection",
        "navigator.network.connection"
      ]
    },
    {
      "id": "org.apache.cordova.network-information.Connection",
      "file": "plugins/org.apache.cordova.network-information/www/Connection.js",
      "pluginId": "org.apache.cordova.network-information",
      "clobbers": [
        "Connection"
      ]
    }
  ];
  module.exports.metadata = {
    "com.connectedbusiness.plugins.airprinter": "1.0.0",
    "cordova-plugin-dialogs": "2.0.2-dev",
    "org.apache.cordova.console": "0.2.13",
    "org.apache.cordova.network-information": "0.2.15"
  };
});