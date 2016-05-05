
;(function (angular,  undefined) {

    "use strict";

    angular.module('geometrixx-banner')

        .directive('geometrixxNavigation',
            [function (lowes, lowesConstants) {

                return {
                    compile: function($element, attr) {
                        var action = attr["geometrixxNavigation"] || "navigate",
                            value = attr["geometrixxNavigationValue"];
                        return function(scope, element, attr) {
                            element.on('click', function(event) {
                                scope.$apply(function() {
                                    console.log("HybridBridge Plugin CALLED " + HybridBridge);
                                    HybridBridge[action](value, function(){
                                        console.log("Hybrid Bridge Success")
                                    },function(e){
                                        console.log("Hybrid Bridge Error" + e)
                                    });
                                });
                            });
                        };
                    }
                };

            }]);

})(angular);