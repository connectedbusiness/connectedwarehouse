cordova.define("com.connectedbusiness.plugins.airprinter.AirPrinter", function(require, exports, module) {var exec = require("cordova/exec");

var PrintPlugin = function() {};

/*
 ip         - source location of the receipt to be loaded. REQUIRED.
 success    - callback function called if print successful.     {success: true}
 fail       - callback function called if print unsuccessful.  If print fails, {error: reason}. If printing not available: {available: false}
 options    -  {dialogOffset:{left: 0, right: 0}}. Position of popup dialog (iPad only).
 */
PrintPlugin.prototype.print = function(ip, success, fail, printingMode) {
    var _mode = (typeof printingMode == "undefined")? "default-printing" : printingMode;
    exec(success, fail, "AirPrint", "print", [ip, _mode]);
};

var printer = new PrintPlugin();
module.exports = printer;});
