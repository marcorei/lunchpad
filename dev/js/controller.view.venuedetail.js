/*
 * Controller for the venue detail view.
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */

angular.module('viewVenueDetailController',[
'lpVenueService'
])

.controller('ViewVenueDetailController',[
'$scope','$location','$routeParams','LpVenueService',
function($scope,$location,$routeParams,LpVenueService){

	// Model
	$scope.venue = {};

	// Interact
	$scope.checkIn = function(id){
		LpVenueService.checkIn(id);
	}

	$scope.checkOut = function(id){
		LpVenueService.checkOut(id);
	}

	$scope.back = function(){
		$location.path('/venues');
	}

	$scope.edit = function(id){
		alert('edit my ass!');
	}


	// Startup
	if($routeParams.venueId !== 'undefined'){
		LpVenueService.getVenueById($routeParams.venueId,function(venue){
			if(!venue){
				$location.path('/venues');
			}else{
				$scope.venue = venue;
			}
		});

		//$timeout(function(){
		//	$scope.startup = true;
		//},100);
	}else{
		$location.path('/venues');
	}

}]);