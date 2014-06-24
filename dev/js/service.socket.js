/*
 * Socket service
 * You can either use it directly: inject, add listeners with on and remove them with off.
 * Or: generate a manager that removes sockets automaticly as the scope gets destroyed.
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */

angular.module('socket',[
])

.factory('Socket',[
'$rootScope',
function($rootScope){

	var socket = io.connect();

	var on = function(event, callback){
		socket.on(event, function(){
			var args = arguments;
			$rootScope.$apply(function(){
				callback.apply(this, args);
			});
		});
	}

	var off = function(event, callback){
		socket.removeListener(event, callback);
	}

	var emit = function(event, data, callback){
		socket.emit(event, data, function(){
			var args = arguments;
			$rootScope.$apply(function(){
				callback.apply(this, args);
			});
		});
	}



	var SocketManager = function(scope){
		var listeners = [];
		this.listeners = listeners;

		if(!scope){
			scope = $rootScope;
		}

		scope.$on('$destroy',function(){
			var i;
			for(i=0;i<listeners.length;i++){
				off(listeners[i][0],listeners[i][1]);
			}
		});
	}

	SocketManager.prototype.on = function(event, callback){
		this.listeners.push([event,callback]);
		on(event,callback);
	}

	SocketManager.prototype.emit = emit;

	var generateManager = function(){
		return new SocketManager();
	}


	return {
		on: on,
		off: off,
		emit: emit,
		generateManager: generateManager
	}
}]);
