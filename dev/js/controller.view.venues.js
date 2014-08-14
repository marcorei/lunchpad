/*
 * Controller for the venue list view.
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */

angular.module('viewVenuesController',[
'lpVenueService'
])

.controller('ViewVenuesController',[
'$scope','LpVenueService',
function($scope,LpVenueService){

    $scope.venues = LpVenueService.venues;

}]);
