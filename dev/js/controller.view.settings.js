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

	var userManager = LpUserService.generateManager($scope);

	// Model
	//$scope.user = {};
	$scope.data = userManager.data;
	$scope.passFormData = {};
	$scope.itemUpdated = false;


	$scope.submitPassForm = function(){
		LpUserService.updatePassword($scope.passFormData.newPass, $scope.passFormData.oldPass, $scope.data.user._id);
		// reset
		$scope.passFormData.oldPass = '';
		$scope.passFormData.newPass = '';
		$scope.passForm.$setPristine(true);
	};

	$scope.submitNotifications = function(){
		// TODO: push Error ErrorProvider if other User
		LpUserService.updateNotifications($scope.data.user.noti.remind, $scope.data.user.noti.overv, $scope.data.user._id);
	};

	$scope.submitActiveItem = function(itemId){
		if($scope.data.user.item == null || itemId !== $scope.data.user.item._id){
			userManager.updateActiveItem(itemId);
		}else{
			userManager.updateActiveItem(null);
		}
		$scope.itemUpdated = true;
	};



	var loadUserData = function(id){
		// LpUserService.readUser(id, function(user){
		// 	$scope.user = user;
		// });
		userManager.loadUser(id);
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
