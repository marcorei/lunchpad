/*
 * Controller for the venue detail view.
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */

angular.module('viewVenueDetailController',[
'lpVenueService',
'lpCommentService'
])

.controller('ViewVenueDetailController',[
'$scope','$location','$routeParams','LpVenueService','LpCommentService',
function($scope,$location,$routeParams,LpVenueService,LpCommentService){

	var commentsManager = LpCommentService.generateManager($scope);

	// Model
	$scope.venue = {};
	$scope.comments = commentsManager.comments;
	$scope.formInputTxt;
	$scope.formSending = false;


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

	$scope.sendComment = function(){
		if($scope.formInputTxt && $scope.formInputTxt.length > 0){
			commentsManager.createComment($scope.formInputTxt);
			$scope.formInputTxt = '';
		}
		// TODO: implement error message
	}

	$scope.deleteComment = function(id){
		LpCommentServices.deleteComment(id);
	}


	// Startup
	if($routeParams.venueId !== 'undefined'){
		LpVenueService.getVenueById($routeParams.venueId,function(venue){
			if(!venue){
				$location.path('/venues');
			}else{
				$scope.venue = venue;

				//load comments
				commentsManager.loadComments(venue._id);

				//mark venue as visited
				LpVenueService.markOneAsVisited(venue._id);
			}
		});

		//$timeout(function(){
		//	$scope.startup = true;
		//},100);
	}else{
		$location.path('/venues');
	}


	// TODO: watch for changes in the comments array and reset sending

}]);
