/*
* Navi module. cotaining navi directive.
*
* @author Markus Riegel <riegel.markus@googlemail.com>
*/

angular.module('lpNavi',[
	'lpConfig',
	'lpUserService',
	'lpUserIdService'
])

.controller('LpNaviController',[
'$scope','LpUserService','LpUserIdService',
function($scope,LpUserService,LpUserIdService){

	$scope.user = {};

	LpUserIdService.getId(function(userId){
		LpUserService.readUser(userId,function(user){
			$scope.user.ava = user.ava;
			$scope.user.nick = user.nick;
			$scope.user.role = user.role;
		});
	});

}])

.directive('lpNavi',[
'LpConfig',
function(LpConfig){
	return {
		restrict: 'A',
		replace: true,
		templateUrl: LpConfig.getTemplate('tmpl.navi'),
		controller: 'LpNaviController'
	}
}]);
