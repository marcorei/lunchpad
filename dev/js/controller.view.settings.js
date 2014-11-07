/*
 * Controller for the settings view.
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */

angular.module('viewSettingsController',[
	'lpUserIdService',
	'lpUserService'
])

.controller('ViewSettingsController',[
'$scope','$routeParams','LpUserIdService','LpUserService',
function($scope,$routeParams,LpUserIdService,LpUserService){

	$scope.user = {};
	$scope.passFormData = {};


	$scope.submitPassForm = function(){
		LpUserService.updatePassword($scope.passFormData.newPass, $scope.passFormData.oldPass, $scope.user.id);
		// reset
		$scope.passFormData.oldPass = '';
		$scope.passFormData.newPass = '';
		$scope.passForm.$setPristine(true);
	};

	$scope.submitNotifications = function(){
		// TODO: push Error ErrorProvider if other User

		LpUserController.updateNotifications($scope.user.remind, $scope.user.overv);
	};

	$scope.submitActiveItem = function(itemId){
		LpUserProvider.updateActiveItem(itemId);
	};



	var loadUserData = function(id){
		LpUserService.readUser(id, function(user){
			$scope.user = user;
		});
	};

	// Startup
	if($routeParams.userId !== 'self'){
		loadUserData($routeParams.userId);
	}else{
		LpUserIdService.getId(function(id){
			loadUserData(id);
		});
	}
}]);

// TODO:
// - Validisierung auf der Settings-page ergänzen.
