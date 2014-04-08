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

	$scope.messages = [];
	$scope.dump = LpError.dumb;

	$scope.close = function(index){
		$scope.messages.splice(index,1);
	}

	$scope.$watch('dump',function(){
		while($scope.dump.length > 0){
			$scope.messages.push($scope.dump.pop());
		}
	});

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