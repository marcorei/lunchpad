/*
* Controller for creating new venue or editing them
*
* @author Markus Riegel <riegel.markus@googlemail.com>
*/

angular.module('viewVenueEditController',[
'lpVenueService'
])

.controller('ViewVenueEditController',[
'$scope','$location','LpVenueService',
function($scope,$location,LpVenueService){

	$scope.venueFormData = {};

	$scope.submitVenueForm = function(){
		LpVenueService.createVenue($scope.venueFormData.venueName, $scope.venueFormData.venueURL);
		//reset;
		$scope.venueFormData.venueName = '';
		$scope.venueFormData.venueURL = '';
		$scope.venueForm.$setPristine(true);
	};

}]);
