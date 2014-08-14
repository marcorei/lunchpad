/*
 * Service to store the user id for queries.
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */

angular.module('lpUserIdService',[
	'socket',
	'lpConfig'
])

.factory('LpUserIdService',[
'Socket','LpConfig',
function(Socket,LpConfig){

	var id = null,
		queue = [],
		socketManager = Socket.generateManager(null);

	var getId = function(callback){
		if(id !== null){
			callback(id);
		}else{
			queue.push(getId,[callback]);
		}
	}

	var loadId = function(callback){
		socketManager.emit(LpConfig.getEvent('user.read.own.id'),{},function(data){
			id = data.user.id;
			if(callback) callback();
		});
	}

	loadId(function(){
		var queueItem;
		while(queue.length > 0){
			queueItem = queue.pop();
			queueItem[0].apply(this,queueItem[1]);
		}
	});


	return {
		getId : getId
	};

}]);
