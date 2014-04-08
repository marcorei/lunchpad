/*
 * Controller for the venue detail view.
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */

angular.module('viewVenueDetailController',[
'lpVenueService'
])

.controller('ViewVenueDetailController',[
'LpVenueService',
function(LpVenueService){

	$scope.venues = LpVenueService.venues;

	

}]);