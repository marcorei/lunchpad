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

	var updateNotifications = function(remind, overv, uid){
		console.log('remind: ');
		console.log(remind);
		socketManager.emit(LpConfig.getEvent('user.update.notifications'),{
			_id: uid,
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

	return {
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
