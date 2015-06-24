#!/bin/sh
cd platforms/android/libs
mvn install:install-file -Dfile=cordova-4.0.0.jar -DgroupId=org.apache.cordova -DartifactId=cordova -Dversion=4.0.0 -Dpackaging=jar
mvn install:install-file -Dfile=adobeMobileLibrary.jar -DgroupId=com.adobe.mobile -DartifactId=mobile-services -Dversion=4.5.1 -Dpackaging=jar
