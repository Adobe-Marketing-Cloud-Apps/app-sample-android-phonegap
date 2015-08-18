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

//
// This hook copies various files from our version control system directories
// into the appropriate platform specific location

var filestocopy = {
///////////////////////////
//          iOS
///////////////////////////
    ios : [
        {
            "www/ADBMobileConfig.json": "platforms/ios/Geometrixx/Resources/ADBMobileConfig.json"
        }
    ],
///////////////////////////
//          ANDROID
///////////////////////////
    android: [
        {
            "www/ADBMobileConfig.json": "platforms/android/assets/ADBMobileConfig.json"
        }
    ]
};

var fs = require('fs');
var path = require('path');

// no need to configure below
var rootdir = process.argv[2];
var platforms = fs.readdirSync('platforms');

for(var i in platforms) {
    var platform = platforms[i];

    if (filestocopy[platform] == undefined) {
        continue;
    }

    filestocopy[platform].forEach(function(obj) {
        Object.keys(obj).forEach(function(key) {
            var val = obj[key];
            var srcfile = path.join(rootdir, key);
            var destfile = path.join(rootdir, val);

            console.log('Copying ' + srcfile + ' to ' + destfile);

            var destdir = path.dirname(destfile);
            if (fs.existsSync(srcfile) && fs.existsSync(destdir)) {
                fs.createReadStream(srcfile).pipe(
                    fs.createWriteStream(destfile));
            }
        });
    });
};
