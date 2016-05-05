/*
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
 */

window.CQ = window.CQ || {};
CQ.mobile = CQ.mobile || {};
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2014 Adobe Systems Incorporated
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

/**
 * Utility for dealing with Content Sync updates.
 */
CQ.mobile.contentUtils = {

    // Key prefix used to store content package details in localStorage
    contentPackageDetailsKeyPrefix: 'cq.mobile.contentPackage.',

    // Key to indicate in localStorage once app has been initialized
    isAppInitializedKey: 'cq.mobile.appInitialized',

    // Key to indicate where app has been deployed
    pgeDeployPathKey: 'pge.deployPath',

    // Key to indicate a custom server URL
    pgeServerURL: 'pge.serverURL',

    // Key to indicate file transfer options
    pgeTransferOptionsKey: 'pge.transferOptions',
    
    // Key to indicate the run mode
    pgeRunModeKey: 'pge.runMode',

    /**
     * Test if the application has already been initialized.
     */
    isAppInitialized: function() {
        return (this.isAppRunningInSandbox() && this.isPackageDataStored());
    },

    isAppRunningInSandbox: function() {
        var runMode = localStorage.getItem(this.pgeRunModeKey);
        if (runMode === "pge") {
            return true;
        }
        var currentLocation = window.location.href,
            pattern = /\/(Library|files)\/files\/.*www\//;
        //test currentLocation against known cordova.file.applicationStorageDirectory
        //locations on iOS and Android (unable to access File plugin since deviceready has yet to fire)
        return pattern.test(currentLocation);
    },

    /**
     * Test if the app's package data has been stored in localStorage.
     */
    isPackageDataStored: function() {
        return (localStorage.getItem(this.isAppInitializedKey) !== null);
    },

    /**
     * Get the path to the www/ directory.
     * @param {string} currentLocation - current document location
     */
    getPathToWWWDir: function(currentLocation) {
        // check for a deployPath from PGE
        var deployPath = this.getDeployPath(),
            indexOfWWW = currentLocation.indexOf(deployPath + '/www/');
        if (indexOfWWW != -1) {
            return currentLocation.substring(0, indexOfWWW + (deployPath.length + 5));
        }
        return null;
    },

    /**
     * Get the subset of the path following the www/ directory.
     * @param {string} currentLocation - current document location
     */
    getPathToContent: function(currentLocation) {
        var pathToContent = null,
            deployPath = this.getDeployPath(),
            indexOfWWW = currentLocation.indexOf(deployPath + '/www/');
        if (indexOfWWW != -1) {
            pathToContent = currentLocation.substring(indexOfWWW + deployPath.length + 5);
        }
        return pathToContent;
    },

    getDeployPath: function() {
        var deployPath = localStorage.getItem(this.pgeDeployPathKey);
        if (deployPath !== null && deployPath.length > 0) {
            return deployPath;
        }
        return "";
    },

    getServerURL: function() {
        var serverURL = localStorage.getItem(this.pgeServerURL);
        if (serverURL !== null && serverURL.length > 0) {
            return serverURL;
        }
        return undefined;
    },

    /**
     * Request filesystem access.
     * @param {function} callback - called with two parameters: (error, result)
     */
    requestFileSystemRoot: function(callback) {

        var requestFileSystemSuccess = function(fileSystem) {
            return callback(null, fileSystem.root);
        };

        // Failed to access the filesystem
        var requestFileSystemError = function(error) {
            var errorMessage = this.getFileRelatedErrorMessage(error);
            return callback(errorMessage);
        };

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
            requestFileSystemSuccess, requestFileSystemError);
    },

    /**
     * Format a string message from a FileError.
     * @param {FileError} fileError - object containing error details
     */
    getFileRelatedErrorMessage: function(fileError) {
        // Handle error messages passed as strings
        if (!fileError || typeof fileError == 'string' || fileError instanceof String) {
            return 'File error. Message: [' + fileError + ']';
        }

        // Otherwise, extract file related error properties
        var errorCode = fileError.code || 'NO_CODE';
        var errorSource = fileError.source || 'NO_SOURCE';
        var errorTarget = fileError.target || 'NO_TARGET';
        var errorHttpStatus = fileError.http_status || 'NO_HTTP_STATUS';

        return 'File error. Code: [' + errorCode + '] source: [' + errorSource +
               '] target: [' + errorTarget + '] http_status: [' + errorHttpStatus + ']';
    },

    /**
     * Fetch JSON async via an XMLHttpRequest. Inspired by:
     * http://youmightnotneedjquery.com/#json
     * @param {string} url - URL to fetch JSON from
     * @param {function} callback - called with two parameters: (error, result)
     * @param {object} requestHeaders - optional object that contains HTTP
     *      request headers to be sent with the request
     */
    getJSON: function(url, callback, requestHeaders) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);

        // Set request headers if they have been provided
        if (requestHeaders != null &&
            typeof requestHeaders === "object") {
            for (var property in requestHeaders) {
                if (requestHeaders.hasOwnProperty(property)) {
                    request.setRequestHeader(property, requestHeaders[property]);
                }
            }
        }

        request.onload = function() {
            if ((request.status >= 200 && request.status < 400) || request.status === 0){
                // Success
                var data = JSON.parse(request.responseText);
                return callback(null, data);
            } else {
                // We reached our target server, but it returned an error
                return callback('Request to url: [' + url + '] returned status: [' + request.status + '].');
            }
        };

        request.onerror = function() {
            // There was a connection error of some sort
            return callback('Request to url: [' + url + '] resulted in a connection error.');
        };

        request.send();
    },

    /**
     * Get the filesystem path of a resource.
     * @param {string} url - URL of the resource
     * @param {function} callback - called with two parameters: (error, result)
     */
    getLocalFilesystemPath: function(url, callback) {
        callback(null, url);
    },

    /**
     * Store the details - such as timestamp - of a specific content package.
     * @param {string} name - content package name
     * @param {object} contentPackageDetails - details to store
     */
    storeContentPackageDetails: function(name, contentPackageDetails) {
        var key = this.contentPackageDetailsKeyPrefix + name;
        localStorage.setItem(key, JSON.stringify(contentPackageDetails));
    },

    /**
     * Returns the stored details of a specific content package.
     * @param {string} name - content package name
     */
    getContentPackageDetailsByName: function(name) {
        var key = this.contentPackageDetailsKeyPrefix + name;
        var details = localStorage.getItem(key);
        return JSON.parse(details);
    },

    mergeRequestHeaders: function( specRequestHeaders ) {
        if (typeof specRequestHeaders !== "object") {
            specRequestHeaders = {};
        }

        // If both are defined, use PGE headers over those supplied via the config spec
        var pgeHeadersString = localStorage.getItem(this.pgeTransferOptionsKey);
        var pgeHeaders = (pgeHeadersString != null ? JSON.parse(pgeHeadersString) : {});

        for (var propertyName in pgeHeaders) {
            specRequestHeaders[propertyName] = pgeHeaders[propertyName];
        }

        return specRequestHeaders;
    }
};
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2014 Adobe Systems Incorporated
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

/**
 * Functional constructor for CQ.mobile.contentInit. Assumes `deviceready` 
 * event has already fired.
 */
CQ.mobile.contentInit = function(spec) {

    'use strict';

    spec = spec || {};

    // JSON resource containing a list of files to include in initialization
    // process
    var manifestFileName = spec.manifestFileName || 'pge-package.json';

    // JSON resource containing a list of content sync packages included in 
    // the payload
    var contentPackagesFileName = spec.contentPackagesFileName || 'pge-content-packages.json';

    // Additional files to include in initialization process, such as .js
    // resources injected by Cordova plugins 
    var additionalFiles = spec.additionalFiles || [];

    // Location of the current resource 
    var currentLocation = window.location.href;

    // Suffix to identify the default content package timestamp by  
    var defaultContentPackageTimestampSuffix = 'default';

    // Last modified timestamp as read from pge-package.json
    var lastModifiedTimestamp;

    /**
     * Perform app initialization. Once complete, the app will be ready to
     * receive updates over-the-air via Content Sync.
     * @param {function} callback - called with two parameters: (error, result)
     */
    var initializeApplication = function(callback) {

        console.log('[contentInit] determine if initial app copy needs to occur');
        console.log('[contentInit] current location: [' + currentLocation + ']');

        var readManifestFile = function(callback) {
            var manifestFilePath = CQ.mobile.contentUtils.getPathToWWWDir(currentLocation) + manifestFileName;
            console.log('[contentInit] manifest being read from: [' + manifestFilePath + ']');
            // Read from the manifest
            getDataFromManifest(manifestFilePath, callback);
        };
        var contentCopyCallback = function(error, pathToAppEntryPoint) {
            if (error) {
                return callback(error);
            }

            // Content copy has completed! Record the last modified timestamp
            // Kept around for backwards compatibility
            recordLastModifiedTimestamp(CQ.mobile.contentUtils.contentPackageDetailsKeyPrefix + defaultContentPackageTimestampSuffix,
                lastModifiedTimestamp);

            // Record the individual content package timestamps, if available
            recordContentPackageTimestamps(lastModifiedTimestamp, function(error) {
                    if (error) {
                        return callback(error);
                    }
                    callback(null, pathToAppEntryPoint);
                }
            );
        };

        // Check if app is running in LocalFileSystem.PERSISTENT directory
        if (CQ.mobile.contentUtils.isAppRunningInSandbox()) {
            console.log('[contentInit] app is running in sandbox: no content copy necessary.');
            
            if (CQ.mobile.contentUtils.isPackageDataStored() === false) {
                var manifestDigestCallback = function(error, manifestData) {
                    if (error) {
                        //still allow app to complete initialization - callbacks to server just won't work
                        recordAppInitializedFlag(true);
                        return callback(null, currentLocation);
                    }

                    // Store the overall lastModifiedTimestamp for later
                    lastModifiedTimestamp = manifestData.lastModified;
                    console.log('[contentInit] lastModifiedTimestamp is [' + lastModifiedTimestamp + '].');

                    contentCopyCallback(null, currentLocation);
                };

                console.log('[contentInit] package data is missing. recording content package data from manifest.');
                //record timestamps from manifest
                readManifestFile(manifestDigestCallback);
            }
            else {
                return callback();
            }
        }
        else {
            // App is NOT running in LocalFileSystem.PERSISTENT directory
            CQ.mobile.contentUtils.requestFileSystemRoot(function(error, fileSystemRoot) {
                if (error) {
                    var errorMessage = '[contentInit][ERROR] ' + error;
                    console.error(errorMessage);
                    return callback(errorMessage);
                }

                console.log('[contentInit] successfully gained access to the file system');

                // Check to see if there already exists an up-to-date copy of the content
                checkForUpToDateContentCopy(function(error, hasUpToDateContentCopy) {
                    if (error) {
                        return callback(error);
                    }

                    if (hasUpToDateContentCopy) {
                        // Content on device is current.
                        // Redirect to local file system path
                        var redirectTo = fileSystemRoot.toURL() + getAppEntryPoint();
                        callback(null, redirectTo);
                    }
                    else {
                        var manifestDigestCallback = function(error, manifestData) {
                            if (error) {
                                return contentCopyCallback(error);
                            }

                            // Combine the list of files in the manifest with those provided
                            // to the constructor as additionalFiles.
                            var fileList = manifestData.files;
                            if ((fileList instanceof Array) === false) {
                                return callback('[contentInit][ERROR] manifest did not contain a list of files.');
                            }

                            if (additionalFiles instanceof Array) {
                                fileList = fileList.concat(additionalFiles);
                            }

                            // Store the overall lastModifiedTimestamp for later
                            lastModifiedTimestamp = manifestData.lastModified;

                            // Copy the master list of files to the PERSISTENT directory
                            performInitialContentCopy(fileSystemRoot, fileList, contentCopyCallback);
                        };

                        // Content on device is out-of-date
                        readManifestFile(manifestDigestCallback);
                    }
                });
            });
        }
    };

    /*
     * Private helpers
     */
    var checkForUpToDateContentCopy = function(callback) {
        var relativePathToAppEntryPoint = getAppEntryPoint();

        console.log('[contentInit] checking for up-to-date content');

        var appPayloadManifestFilePath = CQ.mobile.contentUtils.getPathToWWWDir(currentLocation) + manifestFileName;
        console.log('[contentInit] manifest being read from: [' + appPayloadManifestFilePath + ']');
        
        // Read from the manifest
        getDataFromManifest(appPayloadManifestFilePath, function(error, data) {
            if (error) {
                return callback(error);
            }

            var newTimestamp = data.lastModified;
            var currentTimestamp = localStorage.getItem(CQ.mobile.contentUtils.contentPackageDetailsKeyPrefix + defaultContentPackageTimestampSuffix);
            console.log('[contentInit] comparing the current timestamp [' + currentTimestamp + ']' +
                'with the new timestamp [' + newTimestamp + '].');
            
            if (currentTimestamp === null || currentTimestamp.length === 0) {
                console.log('[contentInit] first run of the app on this device. initiating contentInit.');
                // Content on device is NOT up-to-date; return false
                callback(null, false);
            }
            else {
                // We have a current timestamp meaning the app has run before.
                // Determine if we have newer content in the app payload.
                newTimestamp = parseInt(newTimestamp);
                currentTimestamp = parseInt(currentTimestamp);
                if (newTimestamp > currentTimestamp) {
                    console.log('[contentInit] new content (timestamp: [' + newTimestamp + ']) will overwrite the current (timestamp: [' + currentTimestamp + ']).');
                    // Content on device is NOT up-to-date; return false
                    callback(null, false);
                }
                else {
                    console.log('[contentInit] content on device is up-to-date (timestamp: [' + newTimestamp + ']). skipping contentInit.');
                    // Content on device IS up-to-date; return true
                    callback(null, true);
                }
            }
        });
    };

    var getDataFromManifest = function(manifestFilePath, callback) {
        // read files from manifest
        CQ.mobile.contentUtils.getJSON(manifestFilePath, function(error, data) {
            if (error) {
                return callback(error);
            }

            return callback(null, data);
        });
    };

    // Copy ALL app content to the PERSISTENT location
    var performInitialContentCopy = function(fileSystemRoot, fileList, callback) {
        console.log('[contentInit] sandbox directory root: [' + fileSystemRoot.toURL() + ']');
        
        fileSystemRoot.getDirectory('www', {create: true},
            // On success, pass the www/ dir to copyFilesToDirectory
            function success(wwwDir) {
                console.log('[contentInit] CREATED the www directory');

                var copyCompleteCallback = function() {
                    // Now, return the path to the app entry point in the new location
                    var redirectTo = fileSystemRoot.toURL() + getAppEntryPoint();
                    console.log('[contentInit] complete! Returning app entry point: [' + redirectTo + ']');
                    
                    // Callback with the app entry point
                    callback(null, redirectTo);
                };

                // First, copy the list of files specified by pge-package.json
                copyFilesToWritableDirectory(fileList, wwwDir, copyCompleteCallback);
            }, 
            // Callback will be invoked on error
            callback
        );
    };

    var copyFilesToWritableDirectory = function(fileList, destinationDirectoryEntry, callback) {
        var totalFileCount = fileList.length,
            copyCount = 0,
            pathToWWWDir = CQ.mobile.contentUtils.getPathToWWWDir(currentLocation);
        
        var copyFiles = function() {
            if (fileList.length === 0) {
                console.log('[contentInit] successfully copied ' + copyCount + ' of ' + totalFileCount + ' files.');
                callback();
                return;
            }

            var relativePathToFile = fileList.shift();
            var absolutePathToFile = pathToWWWDir + relativePathToFile;

            createPath(destinationDirectoryEntry, relativePathToFile, function callback() {
                destinationDirectoryEntry.getFile(relativePathToFile, {create: true},
                    function(newFile) {
                        console.log('[contentInit] successfully CREATED the new file: [' + newFile.name + ']');

                        var fileTransfer = new FileTransfer();
                        console.log('[contentInit] copying file from: [' + absolutePathToFile + '] to: [' + newFile.fullPath + ']');
                        fileTransfer.download(
                            absolutePathToFile,
                            newFile.toURL(),
                            function() {
                                //copy success
                                copyCount++;
                                console.log('[contentInit] successfully COPIED the new file: [' + newFile.name + ']');
                                copyFiles(fileList);
                            },
                            function(error) {
                                console.log('[contentInit][ERROR] failed to COPY the new file: [' + relativePathToFile +
                                    '] error code: [' + error.code + '] source: [' + error.source +
                                    '] target: [' + error.target + '] http_status: [' + error.http_status + ']');
                                copyFiles(fileList);
                            }
                        );
                    },
                    function(error) {
                        console.log('[contentInit][ERROR] failed to GET a handle on the new file: [' + relativePathToFile + '] error code: [' + error.code + ']');
                        copyFiles(fileList);
                    }
                );
            });
        };

        copyFiles(fileList);
    };

    function createPath(directoryEntry, filename, callback) {

        var parentDirectories = filename.split("/");
        if (parentDirectories.length === 1) {
            // There are no directories in this path
            callback();
        }
        else {
            var dirs = [];
            for (var i=1; i<parentDirectories.length; i++) {
                dirs.push(parentDirectories.slice(0, i).join("/"));
            }

            var setupPath = function(dirs) {
                if (dirs.length === 0) {
                    console.log("[contentInit] done creating directories");
                    callback();
                    return;
                }

                var path = dirs.shift();
                directoryEntry.getDirectory(path, { create: true, exclusive: true },
                    function () {
                        console.log('[contentInit] Created directory [' + path + '].');
                        setupPath(dirs);
                    },
                    function(error) {
                        // error in this case means the directory already exists.
                        setupPath(dirs);
                    });
            };

            // fire it up
            setupPath(dirs);
        }
    };

    var getAppEntryPoint = function() {
        var pathName = window.location.pathname;
        return pathName.substring(pathName.indexOf('www/'));
    };

    var recordLastModifiedTimestamp = function(key, timestamp) {
        // Add 5 seconds to the timestamp to ensure the value is > the recorded contentsync time
        var incrementedTimestamp = parseInt(timestamp);
        console.log('[contentInit] recording last modified timestamp: [' + incrementedTimestamp + ']');
        localStorage.setItem(key, incrementedTimestamp);
    };

    var recordAppInitializedFlag = function(value) {
        localStorage.setItem(CQ.mobile.contentUtils.isAppInitializedKey, value);
    };

    var recordContentPackageTimestamps = function(defaultTimestamp, callback) {
        // Read from the file identified by `contentPackagesFileName`
        var manifestFilePath = CQ.mobile.contentUtils.getPathToWWWDir(currentLocation) + contentPackagesFileName;
        getDataFromManifest(manifestFilePath, function(error, data) {
            if (error) {
                console.log('[contentInit] unable to read the content packages manifest: [' + contentPackagesFileName + '].');
                return callback(error);
            }
            var serverURL = CQ.mobile.contentUtils.getServerURL() || data.serverURL;
            if (data && data.content) {
                for (var i = 0; i < data.content.length; i++) {
                    var manifestEntry = data.content[i];
                    // Set the timestamp & serverURL to that of the uber package
                    manifestEntry.timestamp = defaultTimestamp;
                    manifestEntry.serverURL = serverURL;
                    // Record the content package details for each manifest entry
                    CQ.mobile.contentUtils.storeContentPackageDetails(manifestEntry.name, manifestEntry);
                }
            }

            // Set flag indicating the app is initialized
            recordAppInitializedFlag(true);
            callback();
        });
    };

    var fileSystemError = function(error) {
        var errorCode = error.code || 'NO_CODE_AVAILABLE';
        console.error('[contentInit][ERROR] FileError with code [' + errorCode + '].');
    };

    var filesystemRedirect = function(path) {
        window.location.href = path;
    };

    // Exported functions
    var that = {
        initializeApplication: initializeApplication
    };

    return that;
};

/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2014 Adobe Systems Incorporated
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

/**
 * Functional constructor for CQ.mobile.contentUpdate. Assumes `deviceReady`
 * event has already fired.
 */
CQ.mobile.contentUpdate = function(spec) {

    'use strict';

    spec = spec || {};

    // Name to store the .zip update on the device file system
    var localZipName = spec.localZipName || 'content-sync-update-payload.zip';

    // Selector and extension for querying if an update is available
    var isUpdateAvailableSuffix = spec.isUpdateAvailableSuffix || '.pge-updates.json';

    // Extension for requesting an update payload
    // '' (empty string) is acceptable, so our check must be more specific
    var updateExtension = spec.updateExtension;
    if (typeof updateExtension === 'undefined' || updateExtension === null) {
        updateExtension = '.pge-updates.zip';
    }

    // Query parameter for requesting content sync updates
    var contentSyncModifiedSinceParam = spec.contentSyncModifiedSinceParam || '?ifModifiedSince=';

    // Query parameter for including `zipPath` in content sync update queries
    var contentSyncReturnRedirectPathParam = spec.contentSyncReturnRedirectPathParam || '&returnRedirectZipPath=true';

    // JSON resource containing the package timestamp
    var manifestFilePath = spec.manifestFilePath || '/www/pge-package-update.json';

    // Server location for requesting updates from
    var serverURI;

    // HTTP headers to include in each request
    var requestHeaders = CQ.mobile.contentUtils.mergeRequestHeaders( spec.requestHeaders );

    // Optional parameter, defaults to false. If set to true, it accepts all
    // security certificates. This is useful because Android rejects self-signed
    // security certificates. Not recommended for production use.
    var trustAllHosts = spec.trustAllHosts || false;

    /**
     * Update the content package identified by `name`.
     * @param {string} name - the name of the content package to update
     * @param {function} callback - called with two parameters: (error, result).
     *      Returns a path to content if successful, and an error otherwise. 
     */
    var updateContentPackageByName = function(name, callback) {
        var contentPackageDetails = CQ.mobile.contentUtils.getContentPackageDetailsByName(name);
        
        if (contentPackageDetails) {
            // Configure server endpoint from manifest details
            setServerURI( contentPackageDetails.serverURL );

            var destination = CQ.mobile.contentUtils.getPathToContent(window.location.href);

            downloadContentPackage(contentPackageDetails.updatePath, name, destination,
                function(error, result) {
                    if (error && callback) {
                        return callback(error);
                    }

                    if (callback) {
                        return callback(null, result);
                    } else {
                        // For backwards compat: reload the current page in absence of a callback
                        console.log( '[contentUpdate] no callback specified; reloading app' );
                        window.location.reload( true );
                    }
                }
            );
        }
        else {
            var errorMessage = 'no contentPackageDetails set for name: [' + name + ']. Aborting.';
            if (callback) {
                return callback(errorMessage);
            } else {
                console.error('[contentUpdate] ' + errorMessage);
            }
        }
    };

    /**
     * Determine if a content package update is available.
     * @param {string} name - the name of the content package to update
     * @return {function} callback - called with (null, true, zipPath) if a
     *      content package update is available, or if this content package
     *      has not yet been synced to this device. zipPath contains the exact
     *      path to the delta zip payload.
     */
    var isContentPackageUpdateAvailable = function(name, callback) {

        var contentPackageDetails = CQ.mobile.contentUtils.getContentPackageDetailsByName(name);
        
        if (contentPackageDetails) {
            // Configure server endpoint from manifest details
            setServerURI( contentPackageDetails.serverURL );

            var ck = '&' + (new Date().getTime());
            var updatePath = contentPackageDetails.updatePath;

            var contentSyncUpdateQueryURI = serverURI + updatePath + isUpdateAvailableSuffix +
                    contentSyncModifiedSinceParam + getContentPackageTimestamp(name) + ck +
                    contentSyncReturnRedirectPathParam;

            console.log('[contentUpdate] querying for update with URI: [' + contentSyncUpdateQueryURI + '].');

            CQ.mobile.contentUtils.getJSON(contentSyncUpdateQueryURI, function(error, data) {
                if (error) {
                    return callback(error);
                }

                if (data.updates === true && data.zipPath) {
                    console.log('[contentUpdate] update is available for [' + name + '] at the following location: [' + data.zipPath + '].');
                    return callback(null, true, data.zipPath);
                }
                else if (data.updates === true) {
                    console.log('[contentUpdate] update is available for [' + name + '].');
                    return callback(null, true);
                }
                else {
                    console.log('[contentUpdate] NO update is available for [' + name + '].');
                    return callback(null, false);
                }
            },
            requestHeaders);
        }
        else {
            var errorMessage = 'No contentPackageDetails set for name: [' + name + ']. Aborting.';
            console.error('[contentUpdate] ' + errorMessage);
            return callback(errorMessage);
        }
    };

    /**
     * Download and install content for the given content package.
     * @param {string} contentSyncPath - path to the content sync config node
     * @param {string} contentPackageName - the name of the content package to update
     * @param {string} contentPackageRootPage - root page of this content package
     * @param {function} callback - called with two parameters: (error, result)
     */
    var downloadContentPackage = function(contentSyncPath, contentPackageName, contentPackageRootPage, callback) {
        CQ.mobile.contentUtils.requestFileSystemRoot(function(error, fileSystemRoot) {
            if (error) {
                return callback(error);
            }

            // Put together the content sync update URI
            var contentSyncUpdateURI = serverURI + contentSyncPath + updateExtension +
                contentSyncModifiedSinceParam + getContentPackageTimestamp(contentPackageName);

            // Attempt to discover the exact zip location to avoid a 302 redirect
            isContentPackageUpdateAvailable(contentPackageName, function(error, isUpdateAvailable, zipPath) {
                if (error) {
                    return callback(error);
                }

                if (isUpdateAvailable === false) {
                    return callback('[contentUpdate] no update available: aborting.');
                }

                if (zipPath) {
                    // Use the exact path to the zip instead of querying 'ifModifiedSince'
                    contentSyncUpdateURI = serverURI + zipPath;
                    console.log('[contentUpdate] using exact path to zip: [' + contentSyncUpdateURI + '].');
                }

                var encodedContentSyncURI = encodeURI( contentSyncUpdateURI );

                var destinationURI = fileSystemRoot.toURL() + CQ.mobile.contentUtils.getDeployPath() + "/" + localZipName;

                var updateAppliedCallback = function(error) {
                    if (error) {
                        return callback(error);
                    }

                    // else: successfully applied the content payload.
                    var contentPackageEntryFullPath = CQ.mobile.contentUtils.getPathToWWWDir(window.location.href) + contentPackageRootPage;
                    console.log('[contentUpdate] successfully applied the content payload. ');
                    console.log('[contentUpdate] returning path to its entry point: [' + contentPackageEntryFullPath + ']');

                    // return the contentPackageRootPage URI.
                    if (callback) {
                        return callback(null, contentPackageEntryFullPath);
                    }

                    return;
                };

                var fileDownloadSuccess = function(entry) {
                    console.log( '[contentUpdate] successfully downloaded to: ' + entry.fullPath );
                    entry.getParent(function(parent) {
                        // Apply the update to the existing content
                        applyUpdate(entry, parent, contentPackageName, updateAppliedCallback);
                    });
                };
                var fileDownloadError = function(error) {
                    if (error.http_status == 304) {
                        console.log('[contentUpdate] server returned a 304 (Not Modified).');
                        // Not modified. Nothing has changed - no update to apply.
                        return callback();
                    }

                    // A status code other than 304 has been returned
                    var errorMessage = '[contentUpdate] file download error: ' +
                        CQ.mobile.contentUtils.getFileRelatedErrorMessage(error);
                    console.error(errorMessage);
                    return callback(errorMessage);
                };

                console.log( '[contentUpdate] requesting file: ' + encodedContentSyncURI );

                var fileTransfer = new FileTransfer();

                // Begin download
                fileTransfer.download(
                    encodedContentSyncURI,
                    destinationURI,
                    fileDownloadSuccess,
                    fileDownloadError,
                    trustAllHosts,
                    {
                        headers: requestHeaders
                    }
                );
            });
        });
    };

    /*
     * Private helpers
     */
    var applyUpdate = function(zipFileEntry, destinationEntry, contentPackageName, callback) {

        var removeUpdatePayloadSuccess = function() {
            console.log( '[contentUpdate] successfully removed the update payload' );
            
            updateLastUpdatedTimestamp(destinationEntry.nativeURL, contentPackageName, function(error) {
                if (error) {
                    return callback(error);
                }
                // else
                callback();
            } );
        };

        var removeUpdatePayloadError = function( error ) {
            var errorMessage = '[contentUpdate] error: failed to remove update payload. ' + 
                    CQ.mobile.contentUtils.getFileRelatedErrorMessage(error);
            console.error(errorMessage);
            return callback(errorMessage);
        };

        zip.unzip(zipFileEntry.toURL(), destinationEntry.toURL(), function(statusCode) {
            if(statusCode === 0) {
                console.log( '[contentUpdate] successfully extracted the update payload.' );
                zipFileEntry.remove(removeUpdatePayloadSuccess, removeUpdatePayloadError);
            }
            else {
                var errorMessage = '[contentUpdate][ERROR]: failed to extract update payload with status: [' + statusCode + '].';
                console.error(errorMessage);
                return callback(errorMessage);
            }
        });
    };

    var updateLastUpdatedTimestamp = function(path, contentPackageName, callback) {
        var cacheKiller = '?ck=' + (new Date().getTime());

        // Fetch updated timestamp from filesystem
        CQ.mobile.contentUtils.getJSON(path + manifestFilePath + cacheKiller, function(error, data) {
            if (error) {
                return callback(error);
            }

            // Add 5 seconds to the timestamp to ensure the value is > the recorded contentsync time
            var incrementedTimestamp = parseInt(data.lastModified);

            console.log('[contentUpdate] recording timestamp: [' + incrementedTimestamp + '] under the content package manifest named [' + contentPackageName + ']');
            
            // Update stored timestamp for this content package
            var contentPackageDetails = CQ.mobile.contentUtils.getContentPackageDetailsByName(contentPackageName);
            contentPackageDetails.timestamp = incrementedTimestamp;
            CQ.mobile.contentUtils.storeContentPackageDetails(contentPackageName, contentPackageDetails);

            return callback();
        });
    };

    var getContentPackageTimestamp = function(contentPackageName) {
        var packageDetails = CQ.mobile.contentUtils.getContentPackageDetailsByName(contentPackageName);
        var timestamp = packageDetails.timestamp;
        // If timestamp has not yet been set, return 0
        return timestamp || 0;
    };

    var setServerURI = function( newServerURI ) {
        // If the newServerURI ends with a /, remove it
        if (newServerURI.indexOf('/', newServerURI.length -1) !== -1) {
            newServerURI = newServerURI.substring(0, newServerURI.length -1);
            }
        serverURI = newServerURI;
    };

    // Exported functions
    var that = {
        updateContentPackageByName: updateContentPackageByName,
        downloadContentPackage: downloadContentPackage,
        isContentPackageUpdateAvailable: isContentPackageUpdateAvailable
    };

    return that;
};

