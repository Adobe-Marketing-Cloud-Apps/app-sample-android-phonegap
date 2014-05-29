;(function (angular, document, undefined) {

    'use strict';

    // Cache killer is used to ensure we get the very latest content after an app update
    var cacheKiller = '?ck=' + (new Date().getTime());

    /**
     * Controllers
     */
    angular.module('cqAppControllers', ['ngRoute'])

// Controller for page 'home'
.controller('contentphonegapgeometrixxappsnggeometrixxwebviewsplashhome', ['$scope', '$http',
function($scope, $http) {
    var data = $http.get('home.angular.json' + cacheKiller);

    /* ng_text component controller (path: content-par/ng_text) */
    data.then(function(response) {
        $scope.contentparngtext = response.data["content-par/ng_text"].items;
    });
    
}])

}(angular, document));