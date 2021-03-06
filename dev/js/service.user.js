/*
 * Service to request user data
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */

angular.module('lpUserService',[
	'socket',
	'lpConfig'
])

.factory('LpUserService',[
'Socket','LpConfig','LpError','LpUserIdService',
function(Socket,LpConfig,LpError,LpUserIdService){

	var socketManager = Socket.generateManager(null);

	// No need for a manager because we won't update any of this at real time.

	var createUser = function(user){
		/*
		{
			mail,
			nick,
			role,
			pass,
			ava
		}
		*/
		socketManager.emit(LpConfig.getEvent('user.create'),user);
	};

	var deleteUser = function(id){
		socketManager.emit(LpConfig.getEvent('user.delete'),{
			_id: id
		});
	};

	var readUserList = function(callback){
		socketManager.emit(LpConfig.getEvent('user.read.list'),{},function(data){
			callback(data.users);
		});
	};

	var readUser = function(id, callback){
		console.log('loading user with id: '+id);
		socketManager.emit(LpConfig.getEvent('user.read.one'),{
			_id: id
		},function(data){
			callback(data.user);
		});
	};

	var updatePassword = function(password, oldpassword, id){
		// When id is undefined, get own id.
		socketManager.emit(LpConfig.getEvent('user.update.password'),{
			_id: id,
			pass: password,
			oldpass: oldpassword
		});
	};

	var updateNotifications = function(remind, overv, cmts, uid){
		console.log('remind: ');
		console.log(remind);
		socketManager.emit(LpConfig.getEvent('user.update.notifications'),{
			_id: uid,
			remind: remind,
			overv: overv,
			cmts: cmts
		});
	};

	var updateActiveItem = function(itemId, uid){
		socketManager.emit(LpConfig.getEvent('user.update.activeitem'),{
			_id: uid,
			itemId: itemId
		});
	};

	var updateInventory = function(userId,inventory){
		// the inventory is supposed to be an array with all items.
		socketManager.emit(LpConfig.getEvent('user.update.inventory'),{
			_id: userId,
			inv: inventory
		});
	};


	socketManager.on(LpConfig.getEvent('user.create.done'),function(data){
		LpError.throwHint('user '+data.nick+' ('+data._id+')'+' created.');
	});
	socketManager.on(LpConfig.getEvent('user.delete.done'),function(data){
		LpError.throwHint('user '+data._id+' deleted.');
	});
	// since the password is updated by pressing a button, we will show a notificytion
	socketManager.on(LpConfig.getEvent('user.update.password.done'),function(data){
		LpError.throwHint('password updated.');
	});
	// We will skip further notifications because they will most likely come across as spam.
	// I case of an error, the Error-Service should already catch it.



	var UserManager = function(scope){
		var cache = {
				user: null
			},
			self = this;
		this.userId = -1;
		this.socketManager;

		var markActiveItemInArr = function(arr, item){
			var activeId = (item) ? item._id : 0;
			var i;
			for(i = 0; i < arr.length; i++){
				if(arr[i]._id === activeId){
					arr[i].active = true;
				}else{
					arr[i].active = false;
				}
			}
		}

		var onUpdateActiveItemDone = function(data){
			cache.user.item = data.item;
			markActiveItemInArr(cache.user.inv, data.item);
		}

		if(scope == undefined){
			throw 'scope not defined. UserManager can not work with rootScope';
		}
		this.socketManager = Socket.generateManager(scope);
		this.socketManager.on(LpConfig.getEvent('user.update.activeitem.done'),onUpdateActiveItemDone);

		// API

		this.loadUser = function(userId, callback){
			readUser(userId, function(user){
				cache.user = user;
				markActiveItemInArr(cache.user.inv, cache.user.item);
				if(callback) callback();
			});
		}

		this.updateActiveItem = function(itemId){
			updateActiveItem(itemId, cache.user._id);
		}

		this.data = cache;
	}

	var generateManager = function(scope){
		return new UserManager(scope);
	}


	return {
		generateManager: generateManager,
		createUser: createUser,
		deleteUser: deleteUser,
		readUserList: readUserList,
		readUser: readUser,
		updatePassword: updatePassword,
		updateNotifications: updateNotifications,
		updateActiveItem: updateActiveItem,
		updateInventory: updateInventory
	};

}]);


// TODO für's ui:
// User muss können:
// - Passwort
// - Notifications
// - Item
// Admin muss können:
// - Userliste anzeigen
// - Neuen User hinzufügen
// - User löschen
// - Inventar updaten (eventuell batch-funktion, zB alle Invetare laden und Item X hinzufügen, löschen)
