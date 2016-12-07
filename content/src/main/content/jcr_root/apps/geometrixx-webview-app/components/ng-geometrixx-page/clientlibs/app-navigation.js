
;(function (angular, contentUpdate, undefined) {

    "use strict";

    /**
     * Module to handle general navigation in the app
     */
    angular.module('cqAppNavigation', [])

        .controller( 'AppNavigationController', ['$scope', '$window', '$location', '$timeout', '$rootElement',
            function( $scope, $window, $location, $timeout, $rootElement) {

                $scope.updating = false;
                $scope.transition = '';

                // Start a timeout
                var timer = $timeout(function() {
                    $scope.initApp();
                }, 100);

                // Request headers for Content Sync
                var reqHeaderObject = {
                };

                // Use app name as ContentSync package ID
                var appName = $rootElement.attr('ng-app');
                var contentUpdater = contentUpdate({
                    id: appName,
                    requestHeaders: reqHeaderObject,
                    // Indicate that self-signed certificates should be trusted
                    // should be set to `false` in production.
                    trustAllHosts: false
                });

                /**
                 * Trigger an app update
                 */
                $scope.updateApp = function() {
                    // don't start updating again if we're already updating.
                    if($scope.updating) return;

                    // Check if an update is available
                    contentUpdater.isContentPackageUpdateAvailable($scope.contentPackageName,
                        function callback(error, isUpdateAvailable) {
                            if (error) {
                                // Alert the error details.
                                return navigator.notification.alert(error, null, 'Content Update Error');
                            }

                            if (isUpdateAvailable) {
                                // Confirm if the user would like to update now
                                navigator.notification.confirm('Update is available, would you like to install it now?',
                                    function onConfirm(buttonIndex) {
                                        if (buttonIndex == 1) {
                                            // user selected 'Update'
                                            $scope.updating = true;
                                            contentUpdater.updateContentPackageByName($scope.contentPackageName,
                                                function callback(error, pathToContent) {
                                                    if (error) {
                                                        return navigator.notification.alert(error, null, 'Error');
                                                    }
                                                    // else
                                                    console.log('Update complete; reloading app.');
                                                    window.location.reload( true );
                                                });
                                        }
                                        else {
                                            // user selected Later
                                            // no-op
                                        }
                                    },
                                    'Content Update',       // title
                                    ['Update', 'Later'] // button labels
                                );
                            }
                            else {
                                navigator.notification.alert('App is up to date.', null, 'Content Update', 'Done');
                            }
                        }
                    );
                };

                /*
                $scope.updateApp2 = function( ) {
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
                */

                /**
                 * Initialize app on first load
                 */
                $scope.initApp = function() {
                    $timeout.cancel(timer);
                    $scope.updateApp();
                }

            }
        ]);

})(angular, CQ.mobile.contentUpdate);