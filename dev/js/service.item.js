/*
* Service for items.
*
* @author Markus Riegel <riegel.markus@googlemail.com>
*/


angular.module('lpItemService',[
	'socket',
	'lpConfig',
	'lpError',
	'lpUserIdService'
])

.factory('LpItemService',[
'Socket','LpConfig','LpError','LpUserIdService','$timeout',
function(Socket,LpConfig,LpError,LpUserIdService,$timeout){

	var items = [],
		socketManager = Socket.generateManager(null);

	var createItem = function(item){
		socketManager.emit(LpConfig.getEvent('item.create'),{
			name: item.name,
			url: item.url,
			type: item.type,
			front: item.front
		});
	};

	var deleteItem = function(id){
		socketManager.emit(LpConfig.getEvent('item.delete'),{
			_id:id
		});
	};

	var getItemById = function(id, callback){
		callback(items[findItemIndexById(id)]);
	};

	var loadItems = function(){
		socketManager.emit(LpConfig.getEvent('item.read.list'),{},function(data){
			if(!data.error){

				// clear the items
				items.splice(0,items.length);

				// need to push so that the array object, that controllers bind to won't change.
				for(var i=0; i<data.items.length; i++){
					items.push(data.items[i]);
				}

				if(callback) callback();

			}else{
				LpError.throw(LpError.getMsg(data.error.code) || data.error.msg);
			}
		});
	};

	var findItemIndexById = function(id){
		var i,
			item;
		for(i = 0; i < items.length; i++){
			item = items[i];
			if(item._id === id){
				return i;
			}
		}
		return -1;
	};

	var onUnhandeltModify = function(){
		loadItems();
	};



	loadVenues(function(){
		socketManager.on(LpConfig.getEvent('item.create.done'),onUnhandeltModify);
		socketManager.on(LpConfig.getEvent('item.delete.done'),onUnhandeltModify);
	});


	return {
		items: items,
		createItem: createItem,
		deleteItem: deleteItem
	};


}]);
