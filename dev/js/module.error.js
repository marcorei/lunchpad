/*
 * Error module. cotaining error service and directive.
 * Please configure hints and the corresponding message codes in the sevirces.
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
		dump.push({
			msg: msg,
			type: 'error'
		});
		console.log('added Error: '+msg);
		console.log('length: '+dump.length);
	};

	var throwHint = function(msg){
		dump.push({
			msg: msg,
			type: 'hint'
		});
	}

	var getMsg = function(errorCode){
		return messages['e'+errorCode] || errorCode;
	};

	var setMsg = function(errorCode, msg){
		messages[errorCode] = msg;
	};

	var clear = function(){
		while(dump.length > 0){
			dump.pop();
		}
	};

	socketManager.on(LpConfig.getEvent('error'), function(data){
		console.log('Error: ' + data);
		throwError(data.error.msg);

		/*
		if(data.error.code === 666){
			$window.location.href = LpConfig.getPage('logout');
		}else{
			throwError(getMsg(data.error.code));
		}
		*/
	});

	socketManager.on(LpConfig.getEvent('hint'), function(data){
		console.log('Hint: ' + data);
		throwHint(data.hint.msg);
	});

	return {
		dump: dump,
		throwError: throwError,
		throwHint: throwHint,
		getMsg: getMsg,
		setMsg: setMsg,
		clear: clear
	}
}])

.controller('LpErroralertController',[
'$scope','LpError',
function($scope,LpError){

	$scope.errors = LpError.dump;

	/*
	$scope.close = function(index){
		$scope.messages.splice(index,1);
	}
	*/

	$scope.closeAll = function(){
		LpError.clear();
	}

	// Test
	//LpError.throwError('This is an error!');
	//LpError.throwHint('This is a hint.');

}])

.directive('lpErroralert',[
'LpConfig',
function(LpConfig){
	return {
		restrict: 'A',
		replace: true,
		scope: true,
		templateUrl: LpConfig.getTemplate('tmpl.erroralert'),
		controller: 'LpErroralertController'
	}
}]);
