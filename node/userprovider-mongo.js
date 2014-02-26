/*
 * Lunchpad user provider
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */



var UserProvider = function(){};



/*
 *
 */

UserProvider.prototype.findAll = function(callback){

	// will probably not be used for now

}




/*
 *
 */

UserProvider.prototype.findUser = function(u_id, callback){

}




/*
 * Save a new row
 */

UserProvider.prototype.saveUsers = function(users, callback){

	// create a new entry for the collection

}






// functions zum Update aller möglichen Eigenschaften.






// Dummy Data

new UserProvider().saveUsers([
	{
		first: '',
		last: '',
		pass: '',
		ava: '',
		item: {
			cur: '',
			all: []
		},
		noti: {
			remind: true,
			overv: true
		},
		stats: {
			idle: '', // last active
			c: '', // check in count
			wc: '' // checkin count this week, will be reset by babo cron job
		}
	}
], function(error, users){});




exports.UserProvider = UserProvider; 
