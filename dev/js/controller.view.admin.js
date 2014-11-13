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
'$scope',
function($scope){

	$scope.events = [
		'chat send',

		'venue read list',
		'venue read one',
		'venue create',

		'venue update name',
		'venue update url',
		'venue delete',

		'checkin create',
		'checkin delete',

		'comment read list',
		'comment create',
		'comment delete',

		'user read list',
		'user read own id',
		'user read one',
		'user create',
		'user update password',
		'user update notifications',
		'user update activeitem',
		'user update inventory',
		'user delete',

		'item read list',
		'item read one',
		'item read multiple',
		'item create',
		'item delete'
	];

	$scope.model = {
		eventName: '',
		eventData: ''
	}

	$scope.response = 'Sample Text';




	/*
	$scope.users;
	$scope.items;

	LpUserService.readUserList(function(users){
		$scope.users = users;
	});

	LpItemService.loadItems(function(items){
		$scope.items = items;
	});
	*/

}]);
