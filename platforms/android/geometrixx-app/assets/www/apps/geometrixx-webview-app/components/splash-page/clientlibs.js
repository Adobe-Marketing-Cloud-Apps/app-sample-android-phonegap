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



