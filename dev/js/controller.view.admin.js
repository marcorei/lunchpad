/*
* Controller for the admin view.
*
* @author Markus Riegel <riegel.markus@googlemail.com>
*/

angular.module('viewAdminController',[
	'lpUserService',
	'lpItemService'
])

.controller('ViewAdminController',[
'$scope','LpUserService','LpItemService',
function($scope,LpUserService,LpItemService){

	$scope.users;
	$scope.items;

	LpUserService.readUserList(function(users)){
		$scope.users = users;
	}

	LpItemService.loadItems(function(items){
		$scope.items = items;
	})

}]);
