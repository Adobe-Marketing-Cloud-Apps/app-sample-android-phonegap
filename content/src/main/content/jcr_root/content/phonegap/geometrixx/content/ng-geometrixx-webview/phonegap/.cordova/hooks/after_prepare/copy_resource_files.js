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
// This hook copies various resource files
// from our version control system directories
// into the appropriate platform specific location
//

var filestocopy = {
///////////////////////////
//          ANDROID
///////////////////////////
    android: [
// Android base Icon
        {
            "www/icon.png":
                "platforms/android/res/drawable/icon.png"
        },
// Android Icons
        {
            "www/res/icons/android/icon-36-ldpi.png":
                "platforms/android/res/drawable-ldpi/icon.png"
        },
        {
            "www/res/icons/android/icon-48-mdpi.png":
                "platforms/android/res/drawable-mdpi/icon.png"
        },
        {
            "www/res/icons/android/icon-72-hdpi.png":
                "platforms/android/res/drawable-hdpi/icon.png"
        },
        {
            "www/res/icons/android/icon-96-xhdpi.png":
                "platforms/android/res/drawable-xhdpi/icon.png"
        },
// Android Screens
        {
            "www/res/screens/android/screen-xhdpi-portrait_bg.png" :
                "platforms/android/res/drawable/screen.png"
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

            var destdir = path.dirname(destfile);
            if (fs.existsSync(srcfile) && fs.existsSync(destdir)) {
                fs.createReadStream(srcfile).pipe(
                    fs.createWriteStream(destfile));
            }
        });
    });
};
