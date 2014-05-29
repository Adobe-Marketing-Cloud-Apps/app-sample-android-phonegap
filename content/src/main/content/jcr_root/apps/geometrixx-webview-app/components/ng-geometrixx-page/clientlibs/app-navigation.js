
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