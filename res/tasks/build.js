#!/usr/bin/env node

var sjs = require('shelljs')
    , cd = sjs.cd
    , exec = sjs.exec;

//$ cd temp
cd('tmp');
console.log("Working on: " + sjs.pwd());
// change permissions
exec('chmod -R 777 .cordova');
//$ cordova platform add android
exec('phonegap build android', function (error, stdout, stderr) {
    if (error || stderr || stdout.match(/\[error\]/i)) {
        var code = error ? error.code : 1;
        console.log('error adding android platform. code: [' + code + ']');
        console.log(stdout);
        console.log(stderr);
        process.exit(code);
    } else {
         console.log(stdout);
    }
});