#!/bin/sh
cd platforms/android/libs
mvn install:install-file -Dfile=cordova-3.6.4.jar -DgroupId=org.apache.cordova -DartifactId=cordova -Dversion=3.6.4 -Dpackaging=jar
mvn install:install-file -Dfile=adobeMobileLibrary.jar -DgroupId=com.adobe.mobile -DartifactId=mobile-services -Dversion=4.1.1 -Dpackaging=jar
