cordova.define("cordova-plugin-hybrid.HybridBridge", function(require, exports, module) {
var exec = require('cordova/exec'),
    cordova = require('cordova');

function HybridBridge() {

}

HybridBridge.prototype.navigate = function(item, successCallback, errorCallback) {
    exec(successCallback, errorCallback, "HybridBridge", "navigate", [item]);
};

module.exports = new HybridBridge();


});
