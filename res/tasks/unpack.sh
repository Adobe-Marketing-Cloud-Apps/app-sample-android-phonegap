#!/bin/sh
mkdir -p tmp
cp GeometrixxWebviewDev*.zip tmp/file.zip
unzip -o tmp/file.zip -d tmp && \
rm tmp/file.zip
