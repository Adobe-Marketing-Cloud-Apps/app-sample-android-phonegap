#!/bin/sh
rm -rf tmp
mkdir -p tmp
curl -u admin:admin \
-L http://localhost:4502/content/phonegap/geometrixx-webview/shell/jcr:content/pge-app/GeometrixxWebviewDev.zip > tmp/app.zip
unzip tmp/app.zip -d tmp
rm tmp/app.zip
sleep 5
