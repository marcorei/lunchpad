/*
 * Controller for the settings view.
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */

angular.module('viewSettingsController',[
])

.controller('ViewSettingsController',[
'$scope','LpUserService',
function($scope,LpUserService){

	$scope.user = {};
}]);
