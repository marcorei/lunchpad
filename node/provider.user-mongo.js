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

		collection.ensureIndex('mail', function(error,indexName){
			if(error) console.log(error);
		});

	},function(error){ console.log(error); });
};



/*
 *
 */

UserProvider.prototype.findAll = function(onSuccess, onError){

	// will probably not be used for now

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




/*
 * Remove an item from all inventories.
 */

UserProvider.prototype.removeItemFromInventories = function(item, onSuccess, onError){
	db.gc(cn, function(collection){

		// TODO later

	},onError);
}




/*
 * Make item active.
 */

UserProvider.prototype.updateAktiveItem = function(id, item, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.update({
			_id: db.oID(id)
		},{
			$set:{
				item: item
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
 * Adjust notification settings
 */

UserProvider.prototype.updateNoti = function(id, noti, onSuccess, onError){
	db.gc(cn, function(collection){

		if( !noti.remind ||
			!noti.overv){
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
 * Save a new row
 *
 * @param user { mail, nick, pass, ava }
 */

UserProvider.prototype.saveUser = function(users, onSuccess, onError){
	db.gc(cn, function(collection){

		var i,
			user;

		if(users.length === 'undefined') users = [users];

		// expected values

		for(i=0;i<users.length;i++){

			user = users[i];

			if( !user.mail ||
				!user.nick ||
				!user.role ||
				!user.pass ||
				!user.ava ){
				callback('data incomplete');
				return;
			}

			// hash passwort
			user.pass = hash.generate( user.pass );

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
		

		collection.insert(users, function(error,results) {
			if(error) onError(error);
			else{
				console.log('User created: '+users.length);
				onSuccess(results);
			}
		});

	},onError);
}






// functions zum Update aller möglichen Eigenschaften.






// Dummy Data

new UserProvider().saveUser([
	{
		mail: '',
		nick: '',
		role: '', // 'admin' or 'user' 
		pass: '',
		ava: ''
	}
], function(users){},function(error){});




exports.userProvider = new UserProvider(); 
