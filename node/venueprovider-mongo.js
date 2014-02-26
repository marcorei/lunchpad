/*
 * Lunchpad venue provider
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */




var VenueProvider = function(){};






/*
 * Get a list of all venues, only data of today
 */

VenueProvider.prototype.findAll = function(callback){

	// Get a list of all venues
	// map reduce to:
	// v_id, name, url, users (name, avatar, item), numcomments

}



/*
 * Get one venue with all details
 */

VenueProvider.prototype.findVenue = function(v_id, callback){

	// get one venue
	// reduce to:
	// v_id, name, url, users(name, avatar, item) !!only from today!!, comments(id, time, text, user(id, name, avatar, item))

}


/*
 * Get top venue for weekday
 */

VenueProvider.prototype.findWeekdayFavVenue = function(wd, callback){

	// map reduce the venues for stats.weekday
	// return the best!

}


/*
 * Save a new venue
 */

VenueProvider.prototype.saveVenues = function(venues, callback){

	// get all the info
	// (validation will be done up front) ... or not
	// insert new data

}










/*
 * Add a new user for today
 */

VenueProvider.prototype.addUserToVenue = function(v_id, user, callback){

	this.removeUserFromAll(user);

	// update new venue

	// add to stats?
	// add to history provider?

}



/*
 * Remove user entry
 */

VenueProvider.prototype.removeUserFromAll = function(user, callback){

	// search for venue with user
	// delete user entry from venue

	// remove from stats?

}











/*
 * Find a comment.
 * For example to check if user is authorized to delete it.
 */

VenueProvider.prototype.findComment = function(v_id, c_pos, callback){

	// this.findVenueById(v_id);
	// get comment
	// return comment

}



/*
 * Add comment
 */

VenueProvider.prototype.addComment = function(v_id, comment, callback){

	// user should be provided with comment object

	// update venue and add new comment
}



/*
 * Delete comment
 */

VenueProvider.prototype.deleteComment = function(v_id, c_pos, callback){

	// don't actually delete the comment
	// just replace the values with "deleted" (like reddit)

}









// Dummy data

new VenueProvider.saveVenues([
	{
		name: 'Testvenue0',
		url: 'http://www.alf.de',
		users: [],
		comment: [],
		stats:{
			wdvs:[0,0,0,0,0,0,0],
			vs: 0
		}
	}
], function(error, venues));






exports.VenueProvider = VenueProvider; 