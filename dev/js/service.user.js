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
		socketManager.emit(LpConfig.getEvent('user.read.one'),{
			_id: id
		},function(data){
			callback(data.user);
		});
	};

	var updatePassword = function(password, id){
		// When id is undefined, get own id.
		socketManager.emit(LpConfig.getEvent('user.update.password'),{
			_id: id,
			pass: password
		});
	};

	var updateNotifications = function(remind, overv){
		socketManager.emit(LpConfig.getEvent('user.update.notifications'),{
			remind: remind,
			overv: overv
		});
	};

	var updateActiveItem = function(itemId){
		socketManager.emit(LpConfig.getEvent('user.update.activeitem'),{
			_id: itemId
		});
	};

	var updateInventory = function(userId,inventory){
		// the inventory is supposed to be an array with all items.
		socketManager.emit(LpConfig.getEvent('user.update.inventory'),{
			_id: userId,
			inv: inventory
		});
	};


	Socket.on(LpConfig.getEvent('user.create.done'),function(data){
		LpError.throwHint('user '+data.nick+' ('+data._id+')'+' created.');
	});
	Socket.on(LpConfig.getEvent('user.delete.done'),function(data){
		LpError.throwHint('user '+data._id+' deleted.');
	});
	// since the password is updated by pressing a button, we will show a notificytion
	Socket.on(LpConfig.getEvent('user.update.password.done'),function(data){
		LpError.throwHint('password updated.');
	});
	// We will skip further notifications because they will most likely come across as spam.
	// I case of an error, the Error-Service should already catch it.

	return {
		createUser: createUser,
		deleteUser: delteUser,
		readUserList: readUserList,
		readUser: readUser,
		updatePassword: updatePassword,
		updateNotification: updateNotification,
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
