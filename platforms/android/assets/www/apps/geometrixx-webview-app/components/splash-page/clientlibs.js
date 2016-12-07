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

/* globals LocalFileSystem */

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
        if (indexOfWWW !== -1) {
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
        if (indexOfWWW !== -1) {
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
        if (!fileError || typeof fileError === 'string' || fileError instanceof String) {
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
        if (requestHeaders !== null &&
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
                var data;
                try {
                    data = JSON.parse(request.responseText);
                } catch (e) {
                    // error during json parsing
                    return callback('Parsing response from url: [' + url + '] failed: ' + e);
                }
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
     * Will only overwrite the existing data if the contentPackageDetails.timestamp
     * value is > than the existing stored timestamp.
     * @param {string} name - content package name
     * @param {object} contentPackageDetails - details to store
     * @param {boolean} overwrite - if true, existing contentPackageDetails for
     *        `name` will be overwritten
     */
    storeContentPackageDetails: function(name, contentPackageDetails, overwrite) {
        var key = this.contentPackageDetailsKeyPrefix + name;

        // Do not overwrite existing data, unless the timestamp has increased or
        // the overwrite parameter is true
        var existingContentPackageDetails = this.getContentPackageDetailsByName(name);
        if (overwrite === true ||
                existingContentPackageDetails === null ||
                (contentPackageDetails.timestamp > existingContentPackageDetails.timestamp)) {
            // There is either no existing details String at this key, or
            // the existing timestamp is less than the new one
            localStorage.setItem(key, JSON.stringify(contentPackageDetails));
        }
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

    /**
     * Removes the stored package information
     * @param {string} name - content package name
     */
    removeContentPackageDetails: function(name) {
        localStorage.removeItem(this.contentPackageDetailsKeyPrefix + name);
    },

    /**
     * Reads the specified request headers with the ones defined in the local storage. If a header is
     * present in both locations, the one in the local storage takes precedence.
     * @param {object} [specRequestHeaders] Optional object of request headers
     * @returns {object} The merged request headers
     */
    mergeRequestHeaders: function( specRequestHeaders ) {
        // copy the headers so we don't mess with the user's object
        var ret = {};
        if (typeof specRequestHeaders === 'object') {
            for (var name in specRequestHeaders) {
                if (specRequestHeaders.hasOwnProperty(name)) {
                    ret[name] = specRequestHeaders[name];
                }
            }
        }

        // If both are defined, use PGE headers over those supplied via the config spec
        var pgeHeadersString = localStorage.getItem(this.pgeTransferOptionsKey);
        var pgeHeaders = (pgeHeadersString !== null ? JSON.parse(pgeHeadersString) : {});

        for (var propertyName in pgeHeaders) {
            if (pgeHeaders.hasOwnProperty(propertyName)) {
                ret[propertyName] = pgeHeaders[propertyName];
            }
        }

        return ret;
    }
};
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2014-2015 Adobe Systems Incorporated
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

/* globals ContentSync */

/**
 * Functional constructor for CQ.mobile.contentInit. Assumes `deviceready` 
 * event has already fired.
 *
 * @constructor
 *
 * @param {object} spec Initialization options
 * @param {string} [spec.manifestFileName='pge-package.json']
 *          Name of the package manifest JSON.
 *          The manifest contains a list of files to include in initialization
 *
 * @param {string} [spec.contentPackagesFileName='pge-content-packages.json']
 *          Name of the content packages JSON.
 *          Resource containing a list of content sync packages included in the payload.
 *
 * @param {string} [spec.id='default']
 *          Unique identifier to reference the cached content
 *
 * @param {string} [spec.idPrefix]
 *         Prefix to prepend to the {@code spec.id} before invoking the content sync plugin.
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

    // Location of the current resource 
    var currentLocation = window.location.href;

    // Suffix to identify the default content package timestamp by  
    var defaultContentPackageTimestampSuffix = 'default';

    // Last modified timestamp as read from pge-package.json
    var lastModifiedTimestamp;

    // Unique identifier to reference the cached content
    var id = spec.id || 'default';
    var idPrefix = spec.idPrefix || '';

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
        var manifestDigestCallback;
        if (CQ.mobile.contentUtils.isAppRunningInSandbox()) {
            console.log('[contentInit] app is running in sandbox: no content copy necessary.');
            var wwwDirPath = CQ.mobile.contentUtils.getPathToWWWDir(currentLocation);

            if (CQ.mobile.contentUtils.isPackageDataStored() === false) {
                manifestDigestCallback = function(error, manifestData) {
                    if (error) {
                        //still allow app to complete initialization - callbacks to server just won't work
                        recordAppInitializedFlag(true);
                        return callback(null, wwwDirPath);
                    }

                    // Store the overall lastModifiedTimestamp for later
                    lastModifiedTimestamp = manifestData.lastModified;
                    console.log('[contentInit] lastModifiedTimestamp is [' + lastModifiedTimestamp + '].');

                    return contentCopyCallback(null, wwwDirPath);
                };

                console.log('[contentInit] package data is missing. recording content package data from manifest.');
                //record timestamps from manifest
                readManifestFile(manifestDigestCallback);
            }
            else {
                return callback(null, wwwDirPath);
            }
        }
        else {
            manifestDigestCallback = function(error, manifestData) {
                if (error) {
                    return contentCopyCallback(error);
                }

                // Store the overall lastModifiedTimestamp for later
                lastModifiedTimestamp = manifestData.lastModified;

                // Begin app ContentSync initialization
                var sync = ContentSync.sync({
                    type: 'local',
                    id: idPrefix + id + '/www',
                    copyRootApp: true,
                    manifest: manifestFileName
                });

                sync.on('complete', function(data) {
                    return contentCopyCallback(null, data.localPath);
                });

                sync.on('error', function(e) {
                    return contentCopyCallback(e);
                });
            };

            readManifestFile(manifestDigestCallback);
        }
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
 *  Copyright 2014-2016 Adobe Systems Incorporated
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

/* globals ContentSync */

/**
 * Functional constructor for CQ.mobile.contentUpdate. Assumes `deviceReady`
 * event has already fired.
 *
 * @param {object} spec Initialization options
 *
 * @param {string} [spec.id='default']
 *          Suffix to identify the default content package timestamp by
 *
 * @param {string} [spec.idPrefix]
 *         Prefix to prepend to the {@code spec.id} before invoking the content sync plugin.
 *
 * @param {string} [spec.isUpdateAvailableSuffix='.pge-updates.json']
 *          Selector and extension for querying if an update is available
 *
 * @param {string} [spec.updateExtension='.pge-updates.zip']
 *          Selector and extension for requesting an update payload
 *
 * @param {string} [spec.contentSyncModifiedSinceParam='?ifModifiedSince=']
 *          Query parameter for requesting content sync updates
 *
 * @param {string} [spec.contentSyncReturnRedirectPathParam='&returnRedirectZipPath=true']
 *          Query parameter for including `zipPath` in content sync update queries
 *
 * @param {string} [spec.manifestFilePath='/www/pge-package-update.json']
 *          JSON resource containing the package timestamp
 *
 * @param {object} [spec.requestHeaders]
 *          HTTP headers to include in each request
 *
 * @param {boolean} [spec.trustAllHosts=false]
 *          If set to true, it accepts all security certificates.
 *          This is useful because Android rejects self-signed security certificates.
 *          Not recommended for production use.
 *
 * @param {string} [spec.localStorageAppIdKey='pge.appId']
 *          Pull app ID from localStorage, if available
 *
 * @param {string} [spec.serverURL]
 *          URL of the server to use for checking for content package updates. If not defined, the
 *          'serverURL' defined in the local storage is used.
 *
 * @constructor
 */
CQ.mobile.contentUpdate = function(spec) {

    'use strict';

    spec = spec || {};

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

    // JSON resource containing the package timestamp and package updates
    var manifestFilePath = spec.manifestFilePath || '/www/pge-package-update.json';

    // HTTP headers to include in each request
    var requestHeaders = CQ.mobile.contentUtils.mergeRequestHeaders( spec.requestHeaders );

    // Optional parameter, defaults to false. If set to true, it accepts all
    // security certificates. This is useful because Android rejects self-signed
    // security certificates. Not recommended for production use.
    var trustAllHosts = spec.trustAllHosts || false;

    // Pull app ID from localStorage, if available
    var localStorageAppIdKey = spec.localStorageAppIdKey || 'pge.appId';

    // Unique identifier to reference the cached content
    var id = localStorage.getItem(localStorageAppIdKey) || spec.id || 'default';
    var idPrefix = spec.idPrefix || '';

    // List of deleted error files, for reporting
    var deletedErrorFileList = [];

    // Starting path for deleting files
    var localUrl;

    // List of files to compare to files to be deleted
    var packageFiles = [];

    /**
     * Update the content package identified by `name`.
     * @param {string} name - the name of the content package to update
     * @param {function} callback - called with two parameters: (error, result).
     *      Returns a path to content if successful, and an error otherwise.
     */
    var updateContentPackageByName = function(name, callback) {
        var contentPackageDetails = CQ.mobile.contentUtils.getContentPackageDetailsByName(name);

        if (!contentPackageDetails) {
            return callback('[contentUpdate] no contentPackageDetails set for name: [' + name + ']. Aborting.');
        }

        isContentPackageUpdateAvailable(name, function(error, isUpdateAvailable, zipPath) {
            if (error) {
                return callback(error);
            }

            if (isUpdateAvailable === false) {
                return callback('[contentUpdate] no update available: aborting.');
            }

            // Prepare URI to request update payload
            var updateServerURI = getServerURL(contentPackageDetails);
            var contentSyncUpdateURI = updateServerURI + contentPackageDetails.updatePath + updateExtension +
                contentSyncModifiedSinceParam + getContentPackageTimestamp(name);

            // Use exact path to zip if available
            if (zipPath) {
                contentSyncUpdateURI = updateServerURI + zipPath;
                console.log('[contentUpdate] using exact path to zip: [' + contentSyncUpdateURI + '].');
            }

            // Update app content using the ContentSync plugin
            var sync = ContentSync.sync({
                src: contentSyncUpdateURI,
                id: idPrefix + id,
                type: 'merge',
                headers: requestHeaders,
                trustHost: trustAllHosts
            });

            sync.on('complete', function(data) {
                var syncOperationComplete = function(error) {
                    if (error) {
                        return callback(error);
                    }

                    if (callback) {
                        var localContentPath = CQ.mobile.contentUtils.getPathToContent(window.location.href);
                        return callback(null, data.localPath + localContentPath);
                    }
                    else {
                        // For backwards compat: reload the current page in absence of a callback
                        console.log('[contentUpdate] no callback specified; reloading app' );
                        window.location.reload( true );
                    }
                };

                /**
                 * handler for overall success in deleting files
                 */
                var removeDeletedContentSuccess = function() {
                    console.log("[contentUpdate] Completed removal of unused files.");

                    updateLastUpdatedTimestamp(data.localPath, name, syncOperationComplete);
                };

                /**
                 * handler for overall success in deleting files
                 */
                var removeDeletedContentError = function() {

                    console.error("[contentUpdate] failed to remove the following unused files:");

                    for (var i = 0; i < deletedErrorFileList.length; i++) {
                        console.error("[contentUpdate] - " + deletedErrorFileList[i]);
                    }

                    updateLastUpdatedTimestamp(data.localPath, name, syncOperationComplete);
                };

                localUrl = 'file://' + data.localPath;
                initializePackageFiles(removeDeletedContentSuccess, removeDeletedContentError);
            });

            sync.on('error', function(e) {
                return callback(e);
            });
        });
    };

    /**
     * Determine if a content package update is available.
     * @param {string} name - the name of the content package to update
     * @param {function} callback - called with (null, true, zipPath) if a
     *      content package update is available, or if this content package
     *      has not yet been synced to this device. zipPath contains the exact
     *      path to the delta zip payload.
     */
    var isContentPackageUpdateAvailable = function(name, callback) {

        var contentPackageDetails = CQ.mobile.contentUtils.getContentPackageDetailsByName(name);

        if (contentPackageDetails) {
            // Check if the content package is already installed
            isContentPackageAlreadyInstalled(contentPackageDetails, function(isInstalled) {
                if (isInstalled === false) {
                    // Because this package is not installed, the next query should use a timestamp of 0.
                    // Update the timestamp to 0
                    contentPackageDetails.timestamp = 0;
                    CQ.mobile.contentUtils.storeContentPackageDetails(name, contentPackageDetails, true);
                }

                // Configure server endpoint from manifest details
                var updateServerURI = getServerURL(contentPackageDetails);

                var ck = '&' + (new Date().getTime());
                var updatePath = contentPackageDetails.updatePath;

                var contentSyncUpdateQueryURI = updateServerURI + updatePath + isUpdateAvailableSuffix +
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
            });
        }
        else {
            var errorMessage = 'No contentPackageDetails set for name: [' + name + ']. Aborting.';
            console.error('[contentUpdate] ' + errorMessage);
            return callback(errorMessage);
        }
    };

    /*
     * Private helpers
     */
    var updateLastUpdatedTimestamp = function(path, contentPackageName, callback) {
        var cacheKiller = '?ck=' + (new Date().getTime());

        // Fetch updated timestamp from filesystem
        CQ.mobile.contentUtils.getJSON(path + manifestFilePath + cacheKiller, function(error, data) {
            if (error) {
                return callback(error);
            }

            var newTimestamp = parseInt(data.lastModified);

            console.log('[contentUpdate] recording timestamp: [' + newTimestamp + '] under the content package manifest named [' + contentPackageName + ']');

            // Update stored timestamp for this content package
            var contentPackageDetails = CQ.mobile.contentUtils.getContentPackageDetailsByName(contentPackageName);
            contentPackageDetails.timestamp = newTimestamp;
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

    /**
     * Returns the server URL of the package details.
     * The URL can be overridden by the spec.serverURL property.
     * @param {object} packageDetails The package details from the local storage
     * @returns {string}
     */
    var getServerURL = function(packageDetails) {
        // check if spec wants to override the url
        var url = spec.serverURL || packageDetails.serverURL;

        // remove trailing slash
        if (url.charAt(url.length-1) === '/') {
            url = url.substring(0, url.length - 1);
        }

        return url;
    };

    /**
     * Populate the packageFiles array with a list of filename from the pge-package-update.json file,
     * first prepending them with '/www/' to facilitate matching with the pge_deletions file.
     */
    var initializePackageFiles = function(successCallback, failureCallback) {
        if (packageFiles && (Array === packageFiles.constructor) && (packageFiles.length > 0)) {
            removeDeletedContent(successCallback, failureCallback);
        } else {
            window.resolveLocalFileSystemURL(localUrl + manifestFilePath, function (fileEntry) {
                CQ.mobile.contentUtils.getJSON(fileEntry.toURL(), function (error, jsonData) {
                    if (jsonData && jsonData.files) {
                        packageFiles = jsonData.files;
                        // For each packageFile file, prepend it with '/www/'
                        packageFiles.forEach(function(item, index) {
                            packageFiles[index] = '/www/' + item;
                        });
                    }
                    removeDeletedContent(successCallback, failureCallback);
                }, function (error) {
                    console.error('[contentUpdate] Error reading the ' + manifestFilePath + ' file.  Error Code: ' + error.code);
                    removeDeletedContent(successCallback, failureCallback);
                });
            }, function (error) {
                console.error('[contentUpdate] Error resolving the ' + manifestFilePath + ' file.  Error Code: ' + error.code);
                removeDeletedContent(successCallback, failureCallback);
            });

        }
    };

    /**
     * Read and handle the files in the deletion directory.
     * There could be zero, one, or several such files.  Each one contains in json a list of files to delete.
     */
    var removeDeletedContent = function(successCallback, failureCallback) {
        console.log('[contentUpdate] Looking for files to remove, in ' + localUrl + '/www/pge-deletions');

        window.resolveLocalFileSystemURL(localUrl + '/www/pge-deletions', function(dirEntry) {
            // Empty error file list in case it's not empty.
            deletedErrorFileList = [];
            var directoryReader = dirEntry.createReader();

            console.log('[contentUpdate] Reading pge_deletions files.');
            directoryReader.readEntries(function(entries){
                readDeletionFiles(entries, successCallback, failureCallback);
            },
                function (error) {
                console.error('[contentUpdate] Error reading deletion directory.  Error Code: ' + error.code);
            });
        }, function(error) {
            console.log('[contentUpdate] No pge-deletions folder in ' + localUrl + '/www.  Error Code: ' + error.code);
            return successCallback();
        });
    };


    /**
     * Given a list of deletion files (FileEntries), recursively read the content of each file, and act on it.
     */
    var readDeletionFiles = function(entries, successCallback, failureCallback) {

        if (entries.length === 0) {
            if (deletedErrorFileList.length === 0) {
                return successCallback();
            } else {
                return failureCallback();
            }
        }

        var deletionFile = entries.pop();
        if (deletionFile.isFile && deletionFile.name.match(/pge_deletions_.*\.json/)) {

            console.log('[contentUpdate] Reading pge_deletions file: ' + deletionFile.name);
            CQ.mobile.contentUtils.getJSON(deletionFile.toURL(), function (error, jsonData) {
                if (jsonData && jsonData.files) {
                    removeFiles(jsonData.files, deletionFile, entries, successCallback, failureCallback);
                }
            }, null);
        } else {
            readDeletionFiles(entries, successCallback, failureCallback);
        }
    };

    /**
     * Given a list of files to delete, delete one and then recursively delete the rest
     * (each file is a string).  When done, remove the deletion file.
     */
    var removeFiles = function(files, deletionFileEntry, entries, successCallback, failureCallback) {
        var deleteFile = function(files) {
            if (files.length === 0) {
                console.log("[contentUpdate] " + deletionFileEntry.name + ": content files processed for removal.");

                // Once finished, remove the deletion file
                deletionFileEntry.remove(function() {
                    console.log('[contentUpdate] Removed ' + deletionFileEntry.name);
                    readDeletionFiles(entries, successCallback, failureCallback);
                }, function(error) {
                    console.error('[contentUpdate] Could not remove deletion file: ' + deletionFileEntry.name + '.  Error Code: ' + error.code);
                    readDeletionFiles(entries, successCallback, failureCallback);
                });
            } else {

                var file = files.pop();
                window.resolveLocalFileSystemURL(localUrl + file, function (fileEntry) {
                    if (packageFiles.indexOf(file) < 0) {
                        fileEntry.remove(function () {
                            console.log('[contentUpdate] Successfully removed ' + localUrl + file);
                            deleteFile(files);
                        }, function (error) {
                            console.error('[contentUpdate] Could not remove ' + localUrl + file + '.  Error Code: ' + error.code);
                            deletedErrorFileList.push(file);
                            deleteFile(files);
                        });
                    } else {
                        console.log('[contentUpdate] Did not remove ' + localUrl + file +
                            ' because it is included in the latest update');
                        deleteFile(files);
                    }
                }, function (error) {
                    console.error('[contentUpdate] Could not find ' + localUrl + file + '.  Error Code: ' + error.code);
                    deleteFile(files);
                });
            }
        };

        // start recursion
        deleteFile(files);
    };

    /**
     * Check if the given content package is already installed.
     * @param {object} packageDetails The package details from local storage
     * @returns {boolean}
     */
    var isContentPackageAlreadyInstalled = function(packageDetails, callback) {
        var relativePathToHtmlContent = packageDetails.path.substring(1) + '.html';

        console.log('[contentUpdate] looking for existing content for package: [' +
        packageDetails.name + '] at path: [' + relativePathToHtmlContent + '].');

        var absolutePathToHtmlContent = CQ.mobile.contentUtils.getPathToWWWDir(window.location.href) +
            relativePathToHtmlContent;

        window.resolveLocalFileSystemURL(absolutePathToHtmlContent,
            function success() {
                console.log('[contentUpdate] package [' + packageDetails.name + '] ' +
                'root detected: package is already installed.');
                callback(true);
            },
            function fail() {
                console.log('[contentUpdate] package [' + packageDetails.name + '] ' +
                'is NOT already installed.');
                callback(false);
            }
        );
    };



    // Exported functions
    var that = {
        updateContentPackageByName: updateContentPackageByName,
        isContentPackageUpdateAvailable: isContentPackageUpdateAvailable
    };

    return that;
};

