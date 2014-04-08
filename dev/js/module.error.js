/*
 * Error module. cotaining error service and directive
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */


angular.module('lpError',[
	'lpConfig'
])

.factory('LpError',[
function(){

	var messages = {
		'e8000' : 'Something went wrong on the server.'
	};

	var dump = [];

	return {
		dump: dump,
		throw: function(msg){
			dump.push(msg);
		},
		getMsg: function(errorCode){
			return messages['e'+errorCode] || errorCode;
		}
	}
}])

.controller('LpErroralertController',[
'LpError',
function(LpError){

	$scope.messages = LpError.dumb;

	$scope.close = function(index){
		$scope.messages.splice(index,1);
	}

	$scope.closeAll = function(){
		while($scope.messages.length > 0){
			$scope.messages.pop();
		}
	}

}])

.directive('lpErroralert',[
'LpConfig',
function(LpConfig){
	return {
		restrict: 'A',
		replace: true,
		templateUrl: LpConfig.getTemplate('tmpl.erroralert'),
		controller: 'LpErroralertController'
	}
}]);