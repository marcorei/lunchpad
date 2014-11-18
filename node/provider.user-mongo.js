/*
 * Lunchpad user provider
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */



var db = require('./module.dbase.js').dBase,
	hash = require('password-hash');
	cn = 'user';


var UserProvider = function(){
	db.gc(cn, function(collection){

		collection.ensureIndex('mail',{unique:true},function(error,indexName){
			if(error) console.log(error);
		});

	},function(error){ console.log(error); });
};



/*
 *
 */

UserProvider.prototype.findAll = function(onSuccess, onError){
	db.gc(cn, function(collection){

		collection.find({},{
			fields: {
				_id:1,
				mail:1,
				nick:1,
				ava:1,
				item:1,
				role:1
			}
		}).toArray(function(error,users){
			if(error) onError(error);
			else onSuccess(users);
		});

	},onError);
}




/*
 * Find user by mongo id
 */

UserProvider.prototype.findUser = function(id, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.findOne({
			_id: db.oID(id)
		},{},function(error,result){
			if(error) onError(error);
			else if(!result) onError('user not found!');
			else onSuccess(result);
		});

	},onError);
}




/*
 * Find user by mail.
 */

UserProvider.prototype.findUserByMail = function(mail, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.findOne({
			mail: mail
		},{
			fields:{
				mail:1,
				nick:1,
				pass:1
			}
		},function(error,result){
			if(error) onError(error);
			else if(!result) onError('user not found!');
			else onSuccess(result);
		});

	},onError);
}



/*
* Find users who want to be reminded, but have not listed themselves yet.
*/

UserProvider.prototype.findUsersForReminder = function(exludeIds, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.find({
			_id: { $nin: exludeIds },
			'noti.remind': true
		},{
			fields:{
				mail: 1,
				nick: 1
			}
		}).toArray(function(error,result){
			if(error) onError(error);
			else onSuccess(result);
		});

	},onError);
}




/*
* Find users who want to get overview emails
*/

UserProvider.prototype.findUsersForOverview = function(onSuccess, onError){
	db.gc(cn, function(collection){

		collection.find({
			'noti.overv': true
		},{
			fields:{
				mail: 1,
				nick: 1
			}
		}).toArray(function(error,result){
			if(error) onError(error);
			else onSuccess(result);
		});

	},onError);
}



/*
 * Change the password
 */

UserProvider.prototype.updatePass = function(id, pass, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.update({
			_id: db.oID(id)
		},{
			$set:{
				pass: hash.generate( pass )
			}
		},{
			safe:true,
			multi:false
		},function(error,updates){
			if(error) onError(error);
			else if(!updates) onError('user not found.');
			else onSuccess(updates);
		});

	},onError);
}




/*
 * Add an item to the inventory list.
 */
/*
UserProvider.prototype.saveItemToInventory = function(id, item, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.update({
			_id: db.oID(id)
		},{
			$push:{
				inv: item
			}
		},{
			safe:true,
			multi:false
		},function(error,result){
			if(error) onError(error);
			if(!result) onError('nothing updated, user not found');
			else onSuccess(result);
		});

	},onError);
}
*/



/*
 * Update the inventory of a user
 */
UserProvider.prototype.updateInventoryById = function(id, inv, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.update({
			_id: db.oID(id)
		},{
			$set:{
				inv: inv
			}
		},{
			safe:true,
			multi:false
		},function(error,result){
			if(error) onError(error);
			if(!result) onError('nothing updated, user not found');
			else onSuccess(result);
		});

	},onError);
}



/*
 * Remove an item from all inventories.
 */

UserProvider.prototype.removeItemFromInventories = function(iid, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.update({
			inv:iid
		},{
			$pull:{
				inv:iid
			}
		},{
			multi:true, //only true so that in case of an error multiple entries will be removed
			save:true
		},function(error,updates){
			if(error) onError(error);
			else onSuccess(updates);
		});

	},onError);
}




/*
 * Make item active.
 */

UserProvider.prototype.updateAktiveItem = function(id, item, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.update({},{
			$pull:{
				inv: _id
			}
		},{
			safe:true,
			multi:true
		},function(error,results){
			if(error) onError(error);
			else onSuccess(results);
		});

	},onError);
}





/*
 * Adjust notification settings
 */

UserProvider.prototype.updateNoti = function(id, noti, onSuccess, onError){
	db.gc(cn, function(collection){

		if( noti.remind === undefined ||
			noti.overv === undefined){
			callback('params invalid');
			return null;
		}

		collection.update({
			_id: db.oID(id)
		},{
			$set:{
				noti: noti
			}
		},{
			safe:true,
			multi:false
		},function(error,result){
			if(error) onError(error);
			if(!result) onError('nothing updated, user not found');
			else onSuccess(result);
		});

	},onError);
}





/*
 * Ajust stats
 */

UserProvider.prototype.updateStats = function(id, stats, onSuccess, onError){
	db.gc(cn, function(collection){

		if( !stats.cihs ||
			!stats.cis){
			callback('params invalid');
			return null;
		}

		collection.update({
			_id: db.oID(id)
		},{
			$set:{
				stats: stats
			}
		},{
			safe:true,
			multi:false
		},function(error,result){
			if(error) onError(error);
			if(!result) onError('nothing updated, user not found');
			else onSuccess(result);
		});

	},onError);
}





/*
 * Delete user
 */

UserProvider.prototype.deleteUser = function(id, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.remove({
			_id: id
		},{
			safe: true
		},function(error,numRemoved){
			if(error) onError(error);
			else{
				console.log('User removed: '+numRemoved);
				onSuccess(numRemoved);
			}
		});

	},onError);
}








/*
 * Save a new row
 *
 * @param user { mail, nick, pass, ava }
 */

UserProvider.prototype.save = function(users, onSuccess, onError){
	db.gc(cn, function(collection){

		var i,
			user;

		if(users.length === undefined) users = [users];

		// expected values

		for(i=0;i<users.length;i++){

			user = users[i];

			if( !user.mail ||
				!user.nick ||
				!user.role ||
				!user.pass ||
				!user.ava ){
				onError('data incomplete');
				return;
			}

			// hash passwort
			user.pass = hash.generate( user.pass );
			console.log('generated hash');

			// add missing standard values
			user.item = null; // active item
			user.inv = []; // inventory (all items)

			user.noti = {
				remind: true,
				overv: true
			};
			user.stats = {
				cihs: 0,
				cis: 0
			};

		}

		console.log('for queue completed. users.lenth: '+users.length);


		collection.insert(users, function(error,results) {
			if(error) onError(error);
			else{
				console.log('User created: '+users.length);
				onSuccess(results);
			}
		});

	},onError);
}




exports.userProvider = new UserProvider();
