/*
 * Controller for the venue list view.
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */


angular.module('viewVenuesController',[
'lpVenueService'
])

.controller('ViewVenuesController',[
'$scope','$location','LpVenueService',
function($scope,$location,LpVenueService){

	// Bind to Model
	$scope.venues = LpVenueService.venues;

	// Interact
	$scope.checkIn = function(id){
		LpVenueService.checkIn(id);
	}

	$scope.checkOut = function(id){
		LpVenueService.checkOut(id);
	}

	$scope.showDetail = function(id){
		$location.path('/venue/'+id);
	}

}]);
