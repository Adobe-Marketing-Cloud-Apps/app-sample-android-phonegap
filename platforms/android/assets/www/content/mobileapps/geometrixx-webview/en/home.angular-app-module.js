;(function (angular, undefined) {

    "use strict";

    // Cache killer is used to ensure we get the very latest content after an app update
    var cacheKiller = '?ck=' + (new Date().getTime());

    /**
     * Main app module
     */
    angular.module('AEMAngularApp', [
'ngRoute',
'ngTouch',
'ngAnimate',
'ngSanitize',
'cqContentSyncUpdate',
'cqAppControllers',
'cqAppNavigation',
'phonegapLocation',
'geometrixx-banner'
])

        .controller('AppController', ['$scope', '$rootScope',
            function ($scope, $rootScope) {
                
                    
                    $scope.wcmMode = false;
                

                //set the server URL into the scope
                $scope.publishServer = 'http:\/\/localhost:4503\/';

                // Store the content package name in the scope
                $scope.contentPackageName = 'en';
            }
        ])
        .config(['$routeProvider',
            function($routeProvider) {
                $routeProvider
                .when('/content/mobileapps/geometrixx-webview/en/home', {
                    templateUrl: 'home.template.html' + cacheKiller,
                    controller: 'contentmobileappsgeometrixxwebviewenhome'
                })

                    .otherwise({
                        redirectTo: '/content/mobileapps/geometrixx-webview/en/home'
                    });
            }
        ]);

}(angular));
