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
/**
 * angular-phonegap-ready v0.0.1
 * (c) 2013 Brian Ford http://briantford.com
 * License: MIT
 */

'use strict';

angular.module( 'btford.phonegap.ready', [] ).
	factory( 'phonegapReady', ['$window', function( $window ) {
		return function( fn ) {
			var queue = [];

			var impl = function() {
				queue.push( Array.prototype.slice.call( arguments ) );
			};

			function onDeviceReady() {
				queue.forEach( function( args ) {
					fn.apply( this, args );
				} );
				impl = fn;
			}

			if( $window.cordova ) {
				document.addEventListener( 'deviceready', onDeviceReady, false );
			} else {
				onDeviceReady();
			}

			return function() {
				return impl.apply( this, arguments );
			};
		};
	}] );

/**
 * https://github.com/jsanchezpando/angular-phonegap
 */

(function() {
	'use strict';
	var deferred_ready = null;

	angular.module( 'irisnet.phonegap', [] )
		.factory( 'deviceready', ['$rootScope', '$q',
			function( $rootScope, $q ) {

				if( !deferred_ready ) {
					deferred_ready = $q.defer();
					angular.element( document ).bind( 'deviceready', function() {
						var device = navigator.device || {};
						device.desktop = typeof window.cordova === 'undefined';
						device.ios = !device.desktop && device.platform === 'iOS';
						device.android = !device.desktop && device.platform === 'Android';

						deferred_ready.resolve( device );
					} );
				}

				return function() {
					return deferred_ready.promise;
				};
			}]
		)
		.factory( 'currentPosition', ['$q', 'deviceready', '$rootScope',
			function( $q, deviceready, $rootScope ) {

				var errorMessages = {
					1: 'Your GPS is probably deactivated or unavailable',
					2: 'Unable to get geo location',
					3: 'Timeout to get geo location'
				};
				return function() {
					var deferred = $q.defer();

					deviceready().then( function() {
						navigator.geolocation.getCurrentPosition( function( position ) {
							deferred.resolve( position );

						}, function( error ) {
							var reason = errorMessages[error.code];
							deferred.reject( reason );
						}, {
							timeout   : 10000,
							maximumAge: 600000
						} );

					} );
					return deferred.promise;
				};
			}]
		)
		.factory( 'localeName', ['$q', 'phonegapReady', 'device', '$rootScope',
			function( $q, phonegapReady, device, $rootScope ) {

				var resolveLang = function( lang ) {
					lang = lang.split( /[_-]+/ )[0];
					if( lang !== 'nl' && lang !== 'fr' ) {
						lang = "fr";
					}
					return lang;
				};

				return function() {
					var deferred = $q.defer();
					deviceready().then( function( device ) {

						if( Constant.isDesktop() ) {
							deferred.resolve( resolveLang( navigator.language ) );
						} else {
							navigator.globalization.getLocaleName(
								function( language ) {
									deferred.resolve( resolveLang( language.value ) );
								}, function() {
									deferred.reject( 'Error getting language' );
								}
							);
						}
					} );
					return deferred.promise;
				};
			}]
		);
})();
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
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
;(function (angular, document, undefined) {

    angular.module('cqContentSync', ['btford.phonegap.ready'])
        .factory('cqContentSync', ['$q', '$http', 'phonegapReady', function($q, $http, phonegapReady) {

            // JSON resource containing a list of files to copy
            var manifestFileName = 'package.json';

            // Key for the last updated timestamp in localstorage
            var appLastUpdatedTimestampKey = 'cq.mobile.appLastUpdatedTimestamp';

            // Additional files to be copied to writable directory
            var additionalFiles;

            function initializeApplication(files) {

                console.log('[content copy] determine if initial app copy needs to occur');
                console.log('[content copy] current location: [' + window.location.href + ']');

                additionalFiles = files;

                if (!appIsRunningInWritableDirectory()) {
                    initializeFileSystem()
                        .then(checkForUpToDateContentCopy)
                        .then(copyContent);
                } else {
                    console.log('[content copy] no content copy necessary');
                }
            }

            function appIsRunningInWritableDirectory() {
                var isRunningInSandbox = window.location.href.indexOf('/Library/files/www/') != -1;
                var isRunningOnAndroid = navigator.userAgent.match(/Android/);
                if (isRunningOnAndroid) {
                    isRunningInSandbox = window.location.href.indexOf('/files/files/www/') != -1;
                }
                return (isRunningInSandbox);
            }

            return {
                initializeApplication: phonegapReady(initializeApplication),
                isAppInitialized: appIsRunningInWritableDirectory
            };

            /*
             * Private helpers
             */
            function initializeFileSystem() {
                var deferred = $q.defer();

                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
                    // Success
                    console.log('[content copy] successfully requested file system access');
                    deferred.resolve(fileSystem.root);
                }, function(error) {
                    // Fail
                    console.log('[content copy][ERROR] failed to request file system access');
                    deferred.reject(error);
                });

                return deferred.promise;
            }

            function checkForUpToDateContentCopy(fileSystemRoot) {
                var deferred = $q.defer();
                var relativePathToAppEntryPoint = getAppEntryPoint();

                console.log('[content copy] checking for up-to-date content');

                var appPayloadManifestFilePath = getPathToWWWDir() + manifestFileName;
                console.log('[content copy] manifest being read from: [' + appPayloadManifestFilePath + ']');
                $http.get(appPayloadManifestFilePath).then(function(response) {
                    var newTimestamp = response.data.lastModified;
                    var currentTimestamp = localStorage.getItem(appLastUpdatedTimestampKey);
                    if (currentTimestamp === null || currentTimestamp.length === 0) {
                        console.log('[content copy] first run of the app on this device. initiating content copy.');
                        deferred.resolve(fileSystemRoot);
                    }
                    else {
                        // We have a current timestamp meaning the app has run before.
                        // Determine if we have newer content in the app payload.
                        newTimestamp = parseInt(newTimestamp);
                        currentTimestamp = parseInt(currentTimestamp);
                        if (newTimestamp > currentTimestamp) {
                            console.log('[content copy] new content (timestamp: ' + newTimestamp + ') will overwrite the old (timestamp: ' + currentTimestamp + ').');
                            deferred.resolve(fileSystemRoot);
                        }
                        else {
                            console.log('[content copy] content on device is up-to-date (timestamp: ' + newTimestamp + '). no need to copy content.');
                            deferred.reject();
                            // Redirect to app entry point
                            getLocalFilesystemPath(fileSystemRoot.toURL() + relativePathToAppEntryPoint).then(filesystemRedirect);
                        }
                    }
                });

                return deferred.promise;
            }

            function copyContent(fileSystemRoot) {
                // Copy all pages over to the writable directory
                console.log('[content copy] sandbox directory root: [' + fileSystemRoot.toURL() + ']');
                var manifestFilePath = getPathToWWWDir() + manifestFileName;
                console.log('[content copy] manifest being read from: [' + manifestFilePath + ']');

                // Create the 'www' dir
                fileSystemRoot.getDirectory('www', {create: true},
                    function(wwwDir) {
                        console.log('[content copy] CREATED the www dir');

                        // read files from manifest
                        $http.get(manifestFilePath).then(function(response) {
                            var fileList = response.data.files;

                            // Record the last modified timestamp
                            var lastModifiedTimestamp = response.data.lastModified;
                            recordLastModifiedTimestamp(lastModifiedTimestamp);

                            copyFilesToWritableDirectory(fileList, wwwDir)
                                .then(copyFilesToWritableDirectory(additionalFiles, wwwDir))
                                .then(function() {
                                    var redirectTo = fileSystemRoot.toURL() + getAppEntryPoint();
                                    console.log('[content copy] redirecting to: [' + redirectTo + ']');
                                    getLocalFilesystemPath(redirectTo).then(filesystemRedirect);
                                });
                        });
                    },
                    function(error) {
                        console.log('[content copy][ERROR] error creating www dir');
                    });

            }

            function copyFilesToWritableDirectory(fileList, destinationDirectoryEntry) {
                var deferred = $q.defer(),
                    fileCount = 0,
                    copyCount = 0;

                for (var i = 0; i < fileList.length; i++) {
                    (function() {
                        var relativePathToFile = fileList[i];
                        var absolutePathToFile = getPathToWWWDir() + relativePathToFile;
                        var createIntermediateFolders = createPath(destinationDirectoryEntry, relativePathToFile);

                        createIntermediateFolders.then(function() {
                            destinationDirectoryEntry.getFile(relativePathToFile, {create: true},
                                function(newFile) {
                                    console.log('[content copy] successfully CREATED the new file: [' + newFile.name + ']');

                                    var fileTransfer = new FileTransfer();
                                    console.log('[content copy] copying file from: [' + absolutePathToFile + '] to: [' + newFile.fullPath + ']');
                                    fileTransfer.download(
                                        absolutePathToFile,
                                        newFile.toURL(),
                                        function() {
                                            //copy success
                                            copyCount++;
                                            console.log('[content copy] successfully COPIED the new file: [' + newFile.name + ']');
                                            checkPosition();
                                        },
                                        function(error) {
                                            console.log('[content copy][ERROR] failed to COPY the new file: [' + relativePathToFile +
                                                '] error code: [' + error.code + '] source: [' + error.source +
                                                '] target: [' + error.target + '] http_status: [' + error.http_status + ']');
                                            checkPosition();
                                        }
                                    )
                                },
                                function(error) {
                                    console.log('[content copy][ERROR] failed to GET a handle on the new file: [' + relativePathToFile + '] error code: [' + error.code + ']');
                                    checkPosition();
                                });
                        });
                    })();
                }

                function checkPosition(position) {
                    // All done?
                    fileCount++;
                    if (fileCount === fileList.length) {
                        console.log('[content copy] successfully copied ' + copyCount + ' of ' + fileList.length + ' files.');
                        deferred.resolve();
                    }
                }

                return deferred.promise;
            }

            function getPathToWWWDir() {
                var currentLocation = window.location.href;
                var pathToWWW = null;
                var indexOfWWW = currentLocation.indexOf('/www/');
                if (indexOfWWW != -1) {
                    pathToWWW = currentLocation.substring(0, indexOfWWW + 5);
                }
                return pathToWWW;
            }

            function getAppEntryPoint() {
                var pathName = window.location.pathname;
                return pathName.substring(pathName.indexOf('www/'));
            }

            function createPath(fileSystem, filename) {
                var deferred = $q.defer();

                var parentDirectories = filename.split("/");
                if (parentDirectories.length === 1) {
                    // There are no directories in this path
                    deferred.resolve();
                }
                else {
                    for (var i = 0, l = parentDirectories.length - 1; i < l; ++i) {
                        (function () { // Create a closure for the path variable to be correct when logging it
                            var path = parentDirectories.slice(0, i+1).join("/");
                            fileSystem.getDirectory(path, { create: true, exclusive: true }, function () {
                                    console.log("Created directory " + path);
                                    deferred.resolve();
                                },
                                function(error) {
                                    // error in this case means the directory already exists.
                                    deferred.resolve();
                                });
                        })();
                    }
                }

                return deferred.promise;
            }

            function recordLastModifiedTimestamp(timestamp) {
                // Add 5 seconds to the timestamp to ensure the value is > the recorded contentsync time
                var incrementedTimestamp = parseInt(timestamp) + 5000;
                console.log('[content copy] recording last modified timestamp: [' + incrementedTimestamp + ']');
                localStorage.setItem(appLastUpdatedTimestampKey, incrementedTimestamp);
            }

            function filesystemRedirect(localpath) {
                window.location.href = localpath;
            }

            function getLocalFilesystemPath(url) {
                var deferred = $q.defer();
                window.cordova.exec(function(path) {
                    console.log('[content copy] local filesystem path obtained: ' + path);
                    deferred.resolve(path);
                }, function(error) {
                    console.log('[content copy][ERROR] failed to obtain local filesystem path');
                    deferred.reject(error);
                }, "File", "_getLocalFilesystemPath", [url]);
                return deferred.promise;
            }

        }]);
}(angular, document));
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
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
;(function( angular, undefined ) {

    "use strict";

	/**
	 * Fetches and applies an AEM content sync delta update to the app.
	 */
	angular.module( 'cqContentSyncUpdate', ['irisnet.phonegap'] )
		.factory( 'cqContentSyncUpdate', ['$q', '$window', '$http', 'deviceready',

			function( $q, $window, $http, deviceready ) {

				// Configuration object
				var appConfig = {
					// zipUrl
					localZipName                 : 'content-sync-update-payload.zip',

					// Key for the last updated timestamp in localstorage
					appLastUpdatedTimestampKey   : 'cq.mobile.appLastUpdatedTimestamp',

					// Param template for requesting content sync updates
					contentSyncModifiedSinceParam: '?ifModifiedSince={{timestamp}}',
					zipUrlTemplate               : '',

					// JSON resource containing the updated timestamp
					manifestFilePath             : '/www/package-update.json'
				};

				/*
				 * Exported methods
				 */
				return {
					// Configure app updater
					setContentSyncUpdateConfiguration: setContentSyncUpdateConfiguration,

					// Perform content sync update
					fetchAndApplyDeltaUpdate         : performDeltaUpdate
				};

				/*
				 * Private helper functions
				 */
				function setContentSyncUpdateConfiguration( contentSyncUpdateUri ) {
					appConfig.zipUrlTemplate = contentSyncUpdateUri + appConfig.contentSyncModifiedSinceParam;
				}

				function performDeltaUpdate() {
					var deferred = $q.defer();

					deviceready().then( function() {
						deferred.notify( 'deviceready' );
						appConfig.zipUrl = getZipUrlWithLatestTimestamp();

						console.log( '[update] starting content sync delta update' );
						console.log( '[update] fetching and installing [' + appConfig.zipUrl + ']' );
						downloadUpdatePayload( appConfig.zipUrl, deferred );
					} );

					return deferred.promise;
				}

				function getZipUrlWithLatestTimestamp() {
					// Pull last updated time from localstorage
					var lastUpdatedTimestamp = localStorage.getItem( appConfig.appLastUpdatedTimestampKey );

					console.log( '[update] current last updated timestamp on device is [' + lastUpdatedTimestamp + ']' );
					if( !lastUpdatedTimestamp ) {
						// If no timestamp, default to an empty string so the entire app is updated
						lastUpdatedTimestamp = '';
					}

					return appConfig.zipUrlTemplate.replace( '{{timestamp}}', lastUpdatedTimestamp );
				}

				function downloadUpdatePayload( updateUrl, deferred ) {
					var fileSystemRoot = null;

					// Ask for access to the persistent file system via PhoneGap
					requestFileSystem( LocalFileSystem.PERSISTENT, 0, requestFileSystemWin, requestFileSystemFail );

					function requestFileSystemWin( fileSystem ) {
						deferred.notify( 'downloading' );

						fileSystemRoot = fileSystem.root;
						var fileTransfer = new FileTransfer();
						var encodedUpdateUrl = encodeURI( updateUrl );

						var destinationURL = fileSystemRoot.toURL() + appConfig.localZipName;

						console.log( '[update] requesting file: ' + encodedUpdateUrl );

						fileTransfer.download(
							encodedUpdateUrl,
							destinationURL,
							fileDownloadWin,
							fileDownloadFail
						);
					}

					function fileDownloadWin( entry ) {
						deferred.notify( 'downloaded' );
						console.log( '[update] successfully downloaded to: ' + entry.fullPath );

						applyUpdate( entry, fileSystemRoot, deferred );
					}

					function fileDownloadFail( error ) {
						deferred.reject( 'download-fail' );

						console.error( '[update] download error source ' + error.source );
						console.error( '[update] download error target ' + error.target );
						console.error( '[update] error code ' + error.code );
					}

					function requestFileSystemFail() {
						deferred.reject( 'filesystem-fail' );
						console.error( "[update] failed to request access to the local file system" );
					}
				}

				/**
				 * Extract the update and reload to display the fresh content.
				 * @param fileEntry - file entry for the update payload
				 * @param destinationEntry - path to persistent storage where this update will be applied
				 * @param deferred
				 */
				function applyUpdate( fileEntry, destinationEntry, deferred ) {
					var filePath, destinationPath;

					//get local paths
					getLocalFilesystemPath( fileEntry.toURL() )
						.then( function( path ) {
							filePath = path;
							getLocalFilesystemPath( destinationEntry.toURL() )
								.then( function( path ) {
									destinationPath = path;
									unzipPayload();
								} );
						} );

					function unzipPayload() {
						deferred.notify( 'unzipping' );

						zip.unzip( filePath, destinationPath, function( statusCode ) {
							if( statusCode === 0 ) {
								deferred.notify( 'unzipped' );
								console.log( '[update] successfully extracted the update payload' );
								fileEntry.remove( removeUpdatePayloadWin, removeUpdatePayloadFail );
							}
							else {
								deferred.reject( 'unzip-failed' );
								console.error( '[update] error: failed to extract update payload' );
							}
						} );
					}

					function removeUpdatePayloadWin() {
						console.log( '[update] successfully removed the update payload' );

						updateLastUpdatedTimestamp( destinationPath, deferred, function() {
							deferred.resolve();
							console.log( '[update] reloading app' );
							window.location.reload( true );
						} );
					}

					function removeUpdatePayloadFail( error ) {
						deferred.reject( 'remove-payload-fail' );
						console.error( '[update] error: failed to remove update payload. code: [' + error.code + ']' );
					}
				}

				function updateLastUpdatedTimestamp( path, deferred, callback ) {
					deferred.notify( 'updating-timestamp' );

					var cacheKiller = '?ck=' + (new Date().getTime());
					// Fetch updated timestamp from filesystem
					$http.get( path + appConfig.manifestFilePath + cacheKiller )
						.then( function( response ) {
							deferred.notify( 'updated-timestamp' );

							// Add 5 seconds to the timestamp to ensure the value is > the recorded contentsync time
							var incrementedTimestamp = parseInt( response.data.lastModified ) + 5000;

							console.log( '[update] recording timestamp: [' + incrementedTimestamp + ']' );
							localStorage.setItem( appConfig.appLastUpdatedTimestampKey, incrementedTimestamp );

							callback();
						} , function() {
                            //catch (using .catch breaks minification)
							deferred.reject( 'update-timestamp-failed' );
						} );
				}

				function getLocalFilesystemPath( url ) {
					var deferred = $q.defer();

					window.cordova.exec( function( path ) {
						console.log( '[update] local filesystem path obtained: ' + path );
						deferred.resolve( path );
					}, function( error ) {
						console.log( '[update][ERROR] failed to obtain local filesystem path' );
						deferred.reject( error );
					}, "File", "_getLocalFilesystemPath", [url] );

					return deferred.promise;
				}

			}
        ]);
}( angular, undefined ));
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
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
;(function (angular, undefined) {

    "use strict";

    /* Filters */
    angular.module('cqFilters', []).

        filter('omit', function() {
            return function(input, count) {
                if (!angular.isArray(input)) return input;

                count = parseInt(count);

                var out = [],
                    i, n;

                // if abs(limit) exceeds maximum length, trim it
                if (count > input.length)
                    count = input.length;
                else if (count < -input.length)
                    count = -input.length;

                if (count > 0) {
                    i = count;
                    n = input.length;
                } else {
                    i = 0
                    n = input.length + count;
                }

                for (; i<n; i++) {
                    out.push(input[i]);
                }

                return out;
            }
        });

}(angular));



/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
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
;(function (angular, undefined) {

    "use strict";

    /* Services */
    angular.module('cqServices', ['btford.phonegap.ready'])

        /**
         * Generic utilities that can be used by any application.
         */
        .factory('cqUtils', [function() {

            return {

                /**
                 * Wrap any object in an array.  A null object will return an empty array. An object that is
                 * already an array will be returned as-is.  Any other object will become the first item in the returned
                 * array.
                 * @param obj
                 * @returns {Array}
                 */
                makeArray: function(obj) {
                    if (obj == null) {
                        return [];
                    }
                    if (angular.isArray(obj)) {
                        return obj;
                    }
                    return [obj];
                }

            };
        }])

        /**
         * Mobile device specific utilities.
         */
        .factory('cqDeviceUtils', ['$window', 'phonegapReady', function($window, phonegapReady) {

            function isConnected() {
                if ($window.navigator.network) {
                    var networkState = $window.navigator.network.connection.type;
                    return (networkState != Connection.UNKNOWN && networkState != Connection.NONE);
                } else {
                    return true;
                }
            }

            function isiOS() {
                if ($window.device) {
                    return ($window.device.platform == "iOS");
                }
            }

            function isAndroid() {
                if ($window.device) {
                    return ($window.device.platform == "Android");
                }
            }


            /**
             *  Returns a Cordova Position object in success handler.
             *  http://docs.phonegap.com/en/3.3.0/cordova_geolocation_geolocation.md.html#Position
             *
             * @param success
             * @param error
             */
            function getPosition(success, error) {

                var options = {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 10000
                };

                var fail = function(err) {
                    //try again
                    navigator.geolocation.getCurrentPosition(success, error, angular.extend(options, {enableHighAccuracy: false}));
                };

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(success, fail, options);
                    console.log("Requesting device location...");
                }
            }

            return {
                /**
                 *
                 * @returns {boolean} true if the device has any type of network connectivity
                 */
                isConnected: isConnected,

                isiOS: phonegapReady(isiOS),
                isAndroid: phonegapReady(isAndroid),

                /**
                 * Requests the current geo-location of the device.  Resulting coordinates will be returned
                 * in the success callback.
                 * @param success callback
                 * @param error callback
                 */
                getPosition: phonegapReady(getPosition)

            };
        }]);


}(angular));



/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
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
;(function (angular,undefined) {

    "use strict";

    /**
     * @doc module
     * @name cqMaps
     *
     * @description
     * Module for embedding Google Maps into CQ mobile apps.
     *
     */
    angular.module("cqMaps", []).

        factory('cqMapDefaults', function() {
            return {
                'precision': 3,
                'mapOptions': {
                    zoom : 8,
                    disableDefaultUI: true,
                    mapTypeControl: false,
                    panControl: false,
                    zoomControl: true,
                    scrollwheel: true
                }
            };
        })

}(angular));
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
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
;(function (angular,undefined) {

    "use strict";

    angular.module("cqMaps").

    /**
     * Google Maps API Utilities
     */
    factory('cqMapUtils', ['$parse', function($parse) {

        function floatEqual (f1, f2) {
            return (Math.abs(f1 - f2) < 0.000001);
        }

        /**
         * @ngdoc function
         * @name #latLngEqual
         * @methodOf cqMaps.service:caMapUtils
         *
         * @param {google.maps.LatLng} l1 first
         * @param {google.maps.LatLng} l2 second
         * @return {boolean} true if l1 and l2 are 'very close'. If either are null
         * or not google.maps.LatLng objects returns false.
         */
        function latLngEqual(l1, l2) {
            if (!(l1 instanceof google.maps.LatLng &&
                l2 instanceof google.maps.LatLng)) {
                return false;
            }
            return floatEqual(l1.lat(), l2.lat()) && floatEqual(l1.lng(), l2.lng());
        }

        /**
         * @ngdoc function
         * @name #boundsEqual
         * @methodOf cqMaps.service:caMapUtils
         *
         * @param {google.maps.LatLngBounds} b1 first
         * @param {google.maps.LatLngBounds} b2 second
         * @return {boolean} true if b1 and b2 are 'very close'. If either are null
         * or not google.maps.LatLngBounds objects returns false.
         */
        function boundsEqual(b1, b2) {
            if (!(b1 instanceof google.maps.LatLngBounds &&
                b2 instanceof google.maps.LatLngBounds)) {
                return false;
            }
            var sw1 = b1.getSouthWest();
            var sw2 = b2.getSouthWest();
            var ne1 = b1.getNorthEast();
            var ne2 = b2.getNorthEast();

            return latLngEqual(sw1, sw2) && latLngEqual(ne1, ne2);
        }

        /**
         * @ngdoc function
         * @name #hasNaN
         * @methodOf cqMaps.service:caMapUtils
         *
         * @param {google.maps.LatLng} latLng the LatLng
         * @return {boolean} true if either lat or lng of latLng is null or isNaN
         */
        function hasNaN(latLng) {
            if (!(latLng instanceof google.maps.LatLng))
                throw 'latLng must be a google.maps.LatLng';

            // google.maps.LatLng converts NaN to null, so check for both
            var isNull = (latLng.lat() == null || latLng.lng() == null);
            var isNotaN =  isNaN(latLng.lat()) || isNaN(latLng.lng());
            return isNull || isNotaN;
        }

        /**
         * @ngdoc function
         * @name #objToLatLng
         * @methodOf cqMaps.service:cqMapUtils
         *
         * @param {Object,String,google.maps.LatLng} obj of the form { lat: 40, lng: -120 } or { latitude: 40, longitude: -120 } or
         *                      comma separated string "40,-120"
         * @return {google.maps.LatLng} returns null if problems with obj (null, NaN, etc.)
         */
        function objToLatLng(obj) {
            var lat,lng;
            if (obj instanceof  google.maps.LatLng) {
                return obj;
            }
            if (angular.isObject(obj)) {
                lat = obj.lat || obj.latitude || null;
                lng = obj.lng || obj.longitude || null;
            } else if (angular.isString(obj)) {
                obj = obj.split(",");
                if (angular.isArray(obj) && obj.length == 2) {
                    lat = parseFloat(obj[0]) || null;
                    lng = parseFloat(obj[1]) || null;
                }
            }

            var ok = !(lat == null || lng == null) && !(isNaN(lat) || isNaN(lng));
            if (ok) {
                return new google.maps.LatLng(lat, lng);
            }
            return null;
        }

        /**
         * @ngdoc function
         * @name #latLngToObj
         * @methodOf cqMaps.service:cqMapUtils
         *
         * @param {google.maps.LatLng}
         * @return {Object} returns null if problems with obj (null, NaN, etc.)
         */
        function latLngToObj(obj) {
            if (obj instanceof  google.maps.LatLng) {
                return {lat:obj.lat(),lng:obj.lng()};
            }
            return null;
        }

        /**
         * @ngdoc function
         * @name #getAddressName
         * @methodOf cqMaps.service:cqMapUtils
         *
         * @param {Object}
         * @return {String} the value of the address component name
         */
        function getAddressComponentName(list, type) {
            if (angular.isArray(list)) {
                for (var i=0; i < list.length; i++) {
                    var value = list[i];
                    if (value.types && value.types.indexOf(type) >= 0) {
                        return value.long_name;
                    }
                }
            }
            return null;
        }

        /**
         * @param {Object} attrs directive attributes
         * @return {Object} mapping from event names to handler fns
         */
        function getEventHandlers(attrs, type) {
            var handlers = {};
            type = type || "";
            if (type.length > 0) {
                type = type.charAt(0).toUpperCase() + type.substring(1);
            }
            // retrieve cq-on-... handlers
            angular.forEach(attrs, function(value, key) {
                if (key.lastIndexOf('cqOn'+type, 0) === 0) {
                    var event = angular.lowercase(
                        key.substring(4+type.length)
                            .replace(/(?!^)([A-Z])/g, '_$&')
                    );
                    var fn = $parse(value);
                    handlers[event] = fn;
                }
            });

            return handlers;
        }

        return {
            latLngEqual: latLngEqual,
            boundsEqual: boundsEqual,
            hasNaN: hasNaN,
            toLatLng: objToLatLng,
            fromLatLng: latLngToObj,
            getAddressName: getAddressComponentName,
            getEventHandlers: getEventHandlers
        };
    }]);

}(angular));
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
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
;(function (angular,undefined) {

    "use strict";

    angular.module("cqMaps").

    /**
     * Directive controller which is owned by the [cqMaps]{@link module:cqMaps} module
     * and shared among all map directives.
     */
    controller('cqMapController',
        ['$scope', '$element', '$timeout', 'cqMapUtils', 'cqMapDefaults',
            function ($scope, $element, $timeout, cqMapUtils, cqMapDefaults) {

                /*
                 * Construct a new controller for the map directive.
                 * @param {angular.Scope} $scope
                 * @param {angular.element} $element
                 * @constructor
                 */
                var constructor = function($scope, $element) {

                    this._markers = {};

                    Object.defineProperties(this, {
                        'precision': {
                            value: cqMapDefaults.precision,
                            writeable: false
                        },
                        'center': {
                            get: function() {
                                return this._map.getCenter();
                            },
                            set: function(center) {
                                if (cqMapUtils.hasNaN(center))
                                    throw 'center contains null or NaN';
                                var changed = !cqMapUtils.latLngEqual(this.center, center);
                                if (changed) {
                                    this._map.panTo(center);
                                }
                            }
                        },
                        'zoom': {
                            get: function() {
                                return this._map.getZoom();
                            },
                            set: function(zoom) {
                                if (!(zoom != null && !isNaN(zoom)))
                                    throw 'zoom was null or NaN';
                                var changed = this.zoom !== zoom;
                                if (changed) {
                                    this._map.setZoom(zoom);
                                }
                            }
                        },
                        'bounds': {
                            get: function() {
                                return this._map.getBounds();
                            },
                            set: function(bounds) {
                                var numbers = !cqMapUtils.hasNaN(bounds.getSouthWest()) &&
                                    !cqMapUtils.hasNaN(bounds.getNorthEast());
                                if (!numbers)
                                    throw 'bounds contains null or NaN';

                                var changed = !(cqMapUtils.boundsEqual(this.bounds, bounds));
                                if (changed) {
                                    this._map.fitBounds(bounds);
                                }
                            }
                        }

                    });

                    $scope.$on('$destroy', angular.bind(this, this._destroy));

                };

                // Retrieve google.maps.MapOptions
                this._getConfig = function(options) {
                    var config = {};
                    angular.extend(config, {
                            zoomControlOptions: {
                                style: google.maps.ZoomControlStyle.SMALL,
                                position: google.maps.ControlPosition.TOP_RIGHT
                            },
                            mapTypeId: google.maps.MapTypeId.ROADMAP
                        },
                        cqMapDefaults.mapOptions,
                        $scope.mapOptions(),
                        options);
                    return config;
                };

                // Create the map
                this.createMap = function(element, options) {
                    options = this._getConfig(options);
                    if (!this._map) {
                        google.maps.visualRefresh = true;
                        this._map = new google.maps.Map(element[0], options);
                    } else {
                        this._map.setOptions(options);
                    }
                };

                this._destroy = function() {

                };

                /**
                 * Alias for google.maps.event.trigger(map, event)
                 * @param {string} event an event defined on google.maps.Map
                 * @ignore
                 */
                this.trigger = function(event) {
                    google.maps.event.trigger(this._map, event);
                };

                /**
                 * Adds a new marker to the map.
                 * @param {number} scope id
                 * @param {number} location
                 */
                this.addMarker = function(scopeId, location, options) {
                    if (!this._map) return;

                    var markerLatLng = cqMapUtils.toLatLng(location.coordinates || location);
                    var marker = new google.maps.Marker(angular.extend({}, {
                        position: markerLatLng
                    }, options));
                    marker.setMap(this._map);

                    var position = marker.getPosition();
                    if (position) {
                        var hash = position.toUrlValue(this.precision);
                        if (this._markers[scopeId] == null) {
                            this._markers[scopeId] = {};
                        }
                        this._markers[scopeId][hash] = {marker:marker, location:location};
                    }

                    return marker;
                };

                /**
                 * Retrieve marker from map.
                 * @param {number} scope id
                 * @param {number} location
                 * @return {google.maps.Marker} the marker at given location, or null if
                 *   no such marker exists
                 * @ignore
                 */
                this.getMarker = function (scopeId, location) {
                    if (location == null)
                        throw 'location was null';

                    var latLng = new google.maps.LatLng(location.coordinates.lat,location.coordinates.lng);
                    var hash = latLng.toUrlValue(this.precision);
                    if (this._markers[scopeId] != null && hash in this._markers[scopeId]) {
                        return this._markers[scopeId][hash].marker;
                    } else {
                        return null;
                    }
                };

                /**
                 * Clear all markers from map
                 * @param {number} scope id
                 * @ignore
                 */
                this.clearMarkers = function (scopeId) {
                    if (this._markers[scopeId] != null) {
                        angular.forEach(this._markers[scopeId], function(object, i) {
                            if (object) {
                                object.marker.setMap(null);
                            }
                        });
                        this._markers[scopeId] = null;
                        delete this._markers[scopeId];
                    }
                };

                /**
                 * Reposition map to fit within bounds defined by provided positions.
                 * @param {array} list of positions to use
                 * @return {google.maps.LatLngBounds} the resulting bounds
                 */
                this.reposition = function(positions) {
                    if (!angular.isArray(positions))
                        throw 'positions is not an array';

                    if (positions.length > 0) {
                        var zoom = this.zoom;
                        var bounds = new google.maps.LatLngBounds();
                        angular.forEach(positions, function(object, i) {
                            bounds.extend(cqMapUtils.toLatLng(object));
                        });
                        this.bounds = bounds;
                        if (positions.length == 1) {
                            this.zoom = zoom;
                        }
                        return bounds;
                    }

                    return null;
                };

                /**
                 * Get current map.
                 * @returns {object}
                 * @ignore
                 */
                this.getMap = function() {
                    return this._map;
                };

                /** Instantiate controller */
                angular.bind(this, constructor)($scope, $element);

            }
        ]);


}(angular));
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
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
;(function (angular,undefined) {

    "use strict";

    angular.module("cqMaps").

    /**
     * @ngdoc directive
     * @name caMaps.directive:cqMap
     * @element ANY
     *
     * @description
     * A directive for embedding google maps into an app.
     *
     */
    directive('cqMap', ['$window', '$timeout', 'cqUtils', 'cqMapUtils', function($window, $timeout, cqUtils, cqMapUtils) {

            var counter = 0,
                prefix = '__cq_gmap_';

            function link(scope, element, attrs, controller) {

                var markerHandlers = cqMapUtils.getEventHandlers(attrs, "marker"); // map events -> handlers

                if ($window.google && $window.google.maps) {
                    initMap();
                } else {
                    injectGoogleAPI();
                }

                function initMap() {

                    scope.$emit('cqMapReady');

                    var mapOptions = {};

                    //zoom as attribute
                    if(attrs.zoom && parseInt(attrs.zoom)) {
                        mapOptions.zoom = parseInt(attrs.zoom);
                    }
                    //maptype as attribute
                    if(attrs.maptype){
                        switch(attrs.maptype.toLowerCase()){
                            case 'hybrid':
                                mapOptions.mapTypeId = google.maps.MapTypeId.HYBRID;
                                break;
                            case 'satellite':
                                mapOptions.mapTypeId = google.maps.MapTypeId.SATELLITE;
                                break;
                            case 'terrain':
                                mapOptions.mapTypeId = google.maps.MapTypeId.TERRAIN;
                                break;
                            case 'roadmap':
                            default:
                                mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
                                break;
                        }
                    }

                    //Create initial map
                    controller.createMap(element, mapOptions);

                    //
                    // Watches
                    //
                    if (attrs.hasOwnProperty("center")) {
                        updateCenter(scope.center);
                        scope.$watch('center', function (newValue) {
                            updateCenter(newValue);
                        }, true);
                    }

                    if (attrs.hasOwnProperty("markers")) {
                        updateMarkers(scope.markers);
                        scope.$watch("markers", function(newMarkers) {
                            updateMarkers(newMarkers);
                        }, true);
                    }

                    if (attrs.hasOwnProperty("refresh")) {
                        if (scope.refresh) {
                            resizeMap();
                        }
                        scope.$watch("refresh", function(value) {
                            if (value) {
                                resizeMap();
                            }
                        }, true);
                    }
                }

                function updateCenter(latLng) {
                    latLng = cqMapUtils.toLatLng(latLng);
                    controller.clearMarkers(scope.$id+"-center");
                    if (latLng) {
                        controller.center = latLng;
                        /*
                        controller.addMarker(scope.$id+"-center", latLng, {
                            icon: {
                                url: '/img/measle_blue.png'
                            }
                        });
                        */
                    }
                }

                function updateMarkers(markers) {
                    controller.clearMarkers(scope.$id);
                    if (markers) {
                        if (!angular.isArray(markers)) {
                            markers = [markers];
                        }
                        //Add new markers to map
                        angular.forEach(markers, function(object, i) {
                            var marker = controller.addMarker(scope.$id, object);
                            // set up marker event handlers
                            angular.forEach(markerHandlers, function(handler, event) {
                                google.maps.event.addListener(marker, event, function() {
                                    $timeout(function() {
                                        handler(scope.$parent, {
                                            object: object,
                                            marker: marker
                                        });
                                    });
                                });
                            });
                        });
                    }
                    controller.reposition(getPositions());
                }

                function resizeMap() {
                    //Trigger a resize event and reposition map based on
                    //current set of positions and markers in scope
                    controller.trigger('resize');
                    controller.reposition(getPositions());
                }

                function getPositions() {
                    var allPositions = cqUtils.makeArray(scope.positions);
                    if (scope.markers && scope.markers.length > 0) {
                        allPositions.push(scope.markers[0].coordinates);
                    }
                    return allPositions;
                }

                function injectGoogleAPI() {
                    //Asynchronously load google api scripts
                    var cbId = prefix + ++counter;
                    $window[cbId] = initMap;

                    var gmap_script = document.createElement('script');
                    gmap_script.src = ('https:' == document.location.protocol ? 'https' : 'http') +
                        '://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&' + 'callback=' + cbId;
                    gmap_script.type = 'text/javascript';
                    gmap_script.async = 'true';
                    var doc_script = document.getElementsByTagName('script')[0];
                    doc_script.parentNode.insertBefore(gmap_script, doc_script);
                }
            }

            return {
                restrict: 'E',
                replace: true,
                scope: {
                    center: '=',
                    markers: '=',
                    positions: '=',
                    refresh: '=',
                    mapOptions: '&'
                },
                template: '<div></div>',
                controller: 'cqMapController',
                link: link
            };
        }]);

}(angular));
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
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
;(function (angular,undefined) {

    "use strict";

    angular.module("cqMaps").

    /**
     * @ngdoc directive
     * @name cqMaps.directive:cqInfoWindow
     * @element ANY
     *
     * @description
     * A directive for creating a google.maps.InfoWindow.
     *
     */
    directive('cqInfoWindow',
        ['$parse', '$compile', '$timeout', function ($parse, $compile, $timeout) {

                function link(scope, element, attrs) {
                    var opts = angular.extend({}, scope.$eval(attrs.cqInfoWindowOptions));
                    opts.content = element[0];
                    var model = $parse(attrs.cqInfoWindow);
                    var infoWindow = model(scope);

                    /**
                     * The info window's contents don't need to be on the dom anymore,
                     * google maps has them stored. So we just replace the infowindow
                     * element with an empty div. (we don't just straight remove it from
                     * the dom because straight removing things from the dom can mess up
                     * angular)
                     */
                    element.replaceWith('<div></div>');

                    scope.$on('cqMapReady', function(event, arg) {
                        if (!infoWindow) {
                            infoWindow = new google.maps.InfoWindow(opts);
                            model.assign(scope, infoWindow);
                        }
                        //Decorate infoWindow.open to $compile contents before opening
                        var _open = infoWindow.open;
                        infoWindow.open = function open(map, anchor) {
                            $compile(element.contents())(scope);
                            _open.call(infoWindow, map, anchor);
                        };
                    });

                }

                return {
                    restrict: 'A',
                    priority: 100,
                    scope: false,
                    link: link
                };

            }]);

}(angular));
;(function (angular, document, undefined) {

    angular.module('phonegapLocation', ["cqServices", "cqMaps"])

        .controller('LocationCtrl', ['$scope', '$timeout', 'cqDeviceUtils', function($scope, $timeout, cqDeviceUtils) {

            $scope.showMap = false;
            $scope.origin = null;
            $scope.locations = [];

            //get current position
            cqDeviceUtils.getPosition(function(position) {
                $scope.origin = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                $scope.locations.push({
                    "coordinates": {
                        "lat": position.coords.latitude,
                        "lng": position.coords.longitude
                    }
                });
                //reverse geocode
                var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({'latLng': latlng}, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results[1]) {
                            $scope.locations[0].label = results[1].formatted_address;
                        } else {
                            $scope.locations[0].label = "No location found";
                        }
                        $scope.$apply();
                    } else {
                        $scope.error = 'Geocoder failed due to: ' + status;
                    }
                });
            }, function(error){
                if (error.POSITION_UNAVAILABLE == error.code || error.PERMISSION_DENIED == error.code) {
                    console.log("Please enable location services and try again.");
                } else {
                    console.log('Location error code: ' + error.code + '\n'+ 'message: ' + error.message);
                }
                $scope.error = "Location unavailable";
            });

        }])

}(angular, document));

;(function (angular, undefined) {

    "use strict";

    /**
     * Module to handle general navigation in the app
     */
    angular.module('cqAppNavigation', ['cqContentSyncUpdate'])

        .controller('AppNavigationController', ['$scope', '$window', '$location', '$timeout', 'cqContentSyncUpdate',

            function ($scope, $window, $location, $timeout, cqContentSyncUpdate) {

                $scope.transition = '';

                // Start a timeout
                var timer = $timeout(function() {
                    $scope.initApp();
                }, 100);

                /**
                 * Trigger an app update
                 */
                $scope.updateApp = function( ) {
                    // don't start updating again if we're already updating.
                    if($scope.updating) return;

                    // Prevent this event from propagating
                    $scope.updating = true;

                    if( window.ADB ) {
                        ADB.trackAction( 'updateApp', {} );
                        ADB.trackTimedActionStart( 'updateAppTimed', {} );
                    }

                    try {
                        cqContentSyncUpdate.fetchAndApplyDeltaUpdate().then(
                            function( result ) {
                                $scope.updating = false;
                            },
                            function( rejection ) {
                                // todo: display error
                                console.error( rejection );
                                $scope.updating = false;
                            }
                        );
                    } catch( err ) {
                        console.log( 'Update Failed: ' + err );
                        if( window.ADB ) {
                            ADB.trackAction( 'updateAppFailed', {} );
                        }
                    }

                    if( window.ADB ) {
                        ADB.trackTimedActionEnd( 'updateAppTimed' );
                    }
                };

                /**
                 * Initialize app on first load
                 */
                $scope.initApp = function() {
                    $timeout.cancel(timer);
                    $scope.updateApp();
                }

            }
        ]);

})(angular);
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
;(function(document, undefined) {


})(document);
