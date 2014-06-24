/*
 * Error module. cotaining error service and directive
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */


angular.module('lpError',[
	'lpConfig',
	'socket'
])

.factory('LpError',[
'$window','Socket','LpConfig',
function($window,Socket,LpConfig){

	var messages = {
		'e8000' : 'Something went wrong on the server.'
	};

	var dump = [],
		socketManager = Socket.generateManager(null);

	var throwError = function(msg){
		dump.push(msg);
	}

	var getMsg = function(errorCode){
		return messages['e'+errorCode] || errorCode;
	}

	socketManager.on(LpConfig.getEvent('error'),function(data){
		console.log('Error: '+data.error.code+' - '+data.error.msg);

		if(data.error.code === 666){
			$window.location.href = LpConfig.getPage('logout');
		}else{
			throwError(getMsg(data.error.code));
		}
	});

	return {
		dump: dump,
		throw: throwError,
		getMsg: getMsg
	}
}])

.controller('LpErroralertController',[
'$scope','LpError',
function($scope,LpError){

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
