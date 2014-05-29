#!/usr/bin/env node

/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/

// List of plugins to install
var pluginlist = [
	{
		id: "org.apache.cordova.file@1.0.1"
    },
	{
		id: "org.apache.cordova.file-transfer@0.4.1"
    },
	{
		id: "org.apache.cordova.geolocation@0.3.6"
    },
	{
		id: "https://github.com/Adobe-Marketing-Cloud/cordova-zip-plugin.git"
    },
	{
		id: "https://github.com/Adobe-Marketing-Cloud/mobile-services.git"
    }
];

var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

// Define endsWith function
String.prototype.endsWith = function (suffix) {
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function pluginIsAlreadyInstalled(pluginId, installedPlugins) {
	for (var i = 0; i < installedPlugins.length; i++) {
		var currentPlugin = installedPlugins[i];
		if (currentPlugin.endsWith(pluginId)) {
			console.log('already installed: ' + pluginId);
			return true;
		}
	}

	console.log('not installed: ' + pluginId);
	return false;
}

function asyncForEach(array, fn, done) {
	array = array.slice(0);

	function processOne() {
		var item = array.pop();
		fn(item, function (result) {
			if (array.length > 0) {
				process.nextTick(processOne); // schedule immediately
			} else {
				done && done(); // Done!
			}
		});
	}
	if (array.length > 0) {
		process.nextTick(processOne); // schedule immediately
	} else {
		done && done(); // Done!
	}
};

// Get current list of plugins
exec('phonegap local plugin list', function (error, stdout, stderr) {
	if (error || stderr || stdout.match(/\[error\]/i)) {
		var code = error ? error.code : 1;
		console.error('error reading plugin list. code: [' + code + ']');
		console.error(stdout);
		process.exit(code);
	} else {
		// Output is expected in the following form:
		// [phonegap] org.apache.cordova.file-transfer
		// [phonegap] org.apache.cordova.splashscreen

		// Split at the newline to get an array of plugin entries
		var pluginListOutput = stdout.split('\n');
		var currentPlugins = [];
		for (var i = 0; i < pluginListOutput.length; i++) {
			var pluginEntry = pluginListOutput[i];

			if (pluginEntry.indexOf('phonegap') !== -1) {
				currentPlugins.push(pluginEntry);
			}
		}

		// Iterate through list of plugins, install those which are missing
		asyncForEach(pluginlist, function (plugin, next) {
			if (pluginIsAlreadyInstalled(plugin.id, currentPlugins) === false) {
				console.log('installing plugin: ' + plugin.id);

				exec('phonegap local plugin add ' + plugin.id, function (error, stdout, stderr) {
					if (error || stderr || stdout.match(/\[error\]/i)) {
						var code = error ? error.code : 1;
						console.error('Error adding plugin ' + plugin.id + '. code: [' + code + ']');
						console.error(stdout);
						process.exit(code);
					}

					console.log(stdout);

					next();
				});
			}
		});
	}
});