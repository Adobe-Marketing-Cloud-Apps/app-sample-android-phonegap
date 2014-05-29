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