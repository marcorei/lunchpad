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

UserProvider.prototype.findAll = function(callback){

	// will probably not be used for now

}




/*
 * Find user by mongo id
 */

UserProvider.prototype.findUser = function(id, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.findOne({
			_id: db.oID(id)
		},{},
		function(error,result){
			if(error) onError(error);
			else if(!result) onError('user not found!');
			else onSuccess(null,result);
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
		},{},
		function(error,result){
			if(error) onError(error);
			else if(!result) onError('user not found!');
			else onSuccess(null,result);
		});

	},onError);
}





/*
 * Add an item to the inventory list.
 */

UserProvider.prototype.addItemToInventory = function(id, item, onSuccess, onError){
	db.gc(cn, function(collection){

		

	},onError);
}




/*
 * Make item active.
 */

UserProvider.prototype.makeItemActive = function(id, item, onSuccess, onError){
	db.gc(cn, function(collection){

		// lol

	},onError);
}





/*
 * Adjust notification settings
 */

UserProvider.prototype.changeNoti = function(id, noti, onSuccess, onError){
	db.gc(cn, function(collection){

		// lol

	},onError);
}





/*
 * Ajust stats
 */

UserProvider.prototype.changeStats = function(id, stats, onSuccess, onError){
	db.gc(cn, function(collection){

		// lol

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
				onSuccess(null,results);
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
], function(error, users){});




exports.userProvider = new UserProvider(); 
