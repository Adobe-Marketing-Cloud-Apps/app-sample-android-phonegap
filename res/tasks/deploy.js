#!/usr/bin/env node

var sjs = require('shelljs')
  , cp = sjs.cp;
var platformPath = "platforms/android";

//reset platform
//rm('-rf', platformPath+'/assets/www');
// copy assets to android app
cp('-Rf', 'tmp/www/*', platformPath+'/assets/www');
cp('-Rf', 'tmp/www/config.xml', platformPath+'/res/xml');
//cp('-Rf', 'tmp/'+platformPath+'/src/com', platformPath+'/src/main/java');
//cp('-Rf', 'tmp/'+platformPath+'/src/org', platformPath+'/src/main/java');
//cp('-Rf', 'tmp/'+platformPath+'/libs/*.jar', platformPath+'/libs');
