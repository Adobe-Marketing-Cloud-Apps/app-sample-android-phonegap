#!/usr/bin/env node

var sjs = require('shelljs')
  , cp = sjs.cp
  , rm = sjs.rm;
var platformPath = "platforms/android";

//reset platform
rm('-rf', platformPath+'/assets/www');
// copy assets to android app
cp('-Rf', 'tmp/'+platformPath+'/assets', platformPath);
cp('-Rf', 'tmp/'+platformPath+'/res/xml', platformPath+'/res');
cp('-Rf', 'tmp/'+platformPath+'/src/com', platformPath+'/src/main/java');
cp('-Rf', 'tmp/'+platformPath+'/src/org', platformPath+'/src/main/java');
cp('-Rf', 'tmp/'+platformPath+'/libs/*.jar', platformPath+'/libs');
