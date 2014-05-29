<%--
  ADOBE CONFIDENTIAL
  __________________

   Copyright 2013 Adobe Systems Incorporated
   All Rights Reserved.

  NOTICE:  All information contained herein is, and remains
  the property of Adobe Systems Incorporated and its suppliers,
  if any.  The intellectual and technical concepts contained
  herein are proprietary to Adobe Systems Incorporated and its
  suppliers and are protected by trade secret or copyright law.
  Dissemination of this information or reproduction of this material
  is strictly forbidden unless prior written permission is obtained
  from Adobe Systems Incorporated.
--%><%
%><%@ page session="false"
           import="com.day.cq.wcm.api.components.IncludeOptions" %><%
%><%@include file="/libs/foundation/global.jsp" %><%
%><%
    // Prevent wrapping of module .js content
    IncludeOptions opts = IncludeOptions.getOptions(request, true);
    opts.setDecorationTagName("");
    opts.forceSameContext(Boolean.TRUE);

%>[
"cordova.js",
"cordova_plugins.js",
"plugins/org.apache.cordova.file/www/android/FileSystem.js",
"plugins/org.apache.cordova.file/www/DirectoryEntry.js",
"plugins/org.apache.cordova.file/www/DirectoryReader.js",
"plugins/org.apache.cordova.file/www/Entry.js",
"plugins/org.apache.cordova.file/www/File.js",
"plugins/org.apache.cordova.file/www/FileEntry.js",
"plugins/org.apache.cordova.file/www/FileError.js",
"plugins/org.apache.cordova.file/www/FileReader.js",
"plugins/org.apache.cordova.file/www/FileSystem.js",
"plugins/org.apache.cordova.file/www/FileUploadOptions.js",
"plugins/org.apache.cordova.file/www/FileUploadResult.js",
"plugins/org.apache.cordova.file/www/FileWriter.js",
"plugins/org.apache.cordova.file/www/Flags.js",
"plugins/org.apache.cordova.file/www/LocalFileSystem.js",
"plugins/org.apache.cordova.file/www/Metadata.js",
"plugins/org.apache.cordova.file/www/ProgressEvent.js",
"plugins/org.apache.cordova.file/www/requestFileSystem.js",
"plugins/org.apache.cordova.file/www/resolveLocalFileSystemURI.js",
"plugins/org.apache.cordova.file-transfer/www/FileTransfer.js",
"plugins/org.apache.cordova.file-transfer/www/FileTransferError.js",
"plugins/org.apache.cordova.geolocation/www/Coordinates.js",
"plugins/org.apache.cordova.geolocation/www/geolocation.js",
"plugins/org.apache.cordova.geolocation/www/Position.js",
"plugins/org.apache.cordova.geolocation/www/PositionError.js",
"plugins/org.chromium.zip/zip.js",
"plugins/ADBMobile/sdks/Cordova/ADBMobile/Shared/ADBHelper.js"
]