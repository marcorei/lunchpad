/*
 * Lunchpad venue provider
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */



var db = require('./module.dbase.js').dBase,
	cn = 'venue';


var VenueProvider = function(){
	db.gc(cn, function(collection){

		collection.ensureIndex('name',{unique:true},function(error,indexName){
			if(error) console.log(error);
		});

	},function(error){
		console.log(error);
	});
};






/*
 * Get a list of all venues
 */

VenueProvider.prototype.findAll = function(onSuccess, onError){
	db.gc(cn, function(collection){

		collection.find({},{
			fields:{
				name:1,
				url:1,
				guests:1,
				comc:1
			},
			sort: [['guest',-1],['name',1]]
		}).toArray(function(error,results){
			if(error) onError(error);
			else onSuccess(results);
		});

	},onError);
}



/*
 * Get one venue with all details
 */

VenueProvider.prototype.findVenue = function(id, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.findOne({
			_id: db.oID(id)
		},{},function(error,result){
			if(error) onError(error);
			else if(!result) onError('venue not found');
			else onSuccess(result);
		});

	},onError);
}




/*
 * Add a new user for today
 */

VenueProvider.prototype.addUserToVenue = function(id, user, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.findAndModify({
			_id: db.oID(id)
		},[],{
			$push: {
				guests:user
			}
		},{
			multi:false,
			save: true
		},function(error,venue){
			if(error) onError(error);
			else if(!venue) onError('Could not add user to venue.');
			else onSuccess(venue);
		});

	},onError);
}


/*
 * Remove a user for today
 */

VenueProvider.prototype.delUserForToday = function(user, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.update({
			'guests.uid':user._id
		},{
			$pull:{
				guests:{ uid:user._id }
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
 * Update comment count
 */

VenueProvider.prototype.updateCommentCount = function(id, count, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.findAndModify({
			_id: db.oID(id)
		},[],{
			$set:{
				comc: count
			}
		},{
			multi: false,
			save: true
		},function(error,venue){
			if(error) onError(error);
			else if(!venue) onError('venue not found');
			else onSuccess(venue);
		});

	},onError);
}




/*
 * Update name
 */

VenueProvider.prototype.updateName = function(id, name, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.findAndModify({
			_id: db.oID(id)
		},[],{
			$set:{
				name: name
			}
		},{
			multi: false,
			save: true
		},function(error,venue){
			if(error) onError(error);
			else if(!venue) onError('venue not found');
			else onSuccess(venue);
		});

	},onError);
}




/*
 * Update url
 */

VenueProvider.prototype.updateUrl = function(id, url, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.findAndModify({
			_id: db.oID(id)
		},[],{
			$set:{
				url: url
			}
		},{
			multi: false,
			save: true
		},function(error,venue){
			if(error) onError(error);
			else if(!venue) onError('venue not found');
			else onSuccess(venue);
		});

	},onError);
}




/*
 * Get venue, that has not been featured yet, venue that have been requested this way once will appear as featured and won't be returned a second time
 */

VenueProvider.prototype.findUnfeatured = function(onSuccess, onError){
	db.gc(cn, function(collection){

		collection.findAndModify({
			featured: false
		},[
			{date:-1}
		],{
			$set: {
				featured: true
			}
		},{
			save:true
		},function(error,venue){
			if(error) onError(error);
			else onSuccess(venue);
		});

	},onError);
}




/*
 * Reset daily data
 */

VenueProvider.prototype.dailyReset = function(onSuccess, onError){
	db.gc(cn, function(collection){

		collection.update({},{
			$set:{
				guests: [],
				comc: 0
			}
		},{
			multi: true,
			save: true
		},function(error,updates){
			if(error) onError(error);
			else if(!updates) onError('nothing to reset');
			else onSuccess(updates);
		});

	},onError);
}



/*
 * Delete venue
 */

VenueProvider.prototype.deleteVenue = function(id, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.remove({
			_id: db.oID(id)
		},{
			save:true,
			single:true
		},function(error,removed){
			if(error) onError(error);
			else if(!removed) onError('nothing to remove');
			else onSuccess(removed);
		});

	},onError);
}







/*
 * Save a new venue
 */

VenueProvider.prototype.save = function(venues, onSuccess, onError){
	db.gc(cn, function(collection){

		var i,
			venue;

		if(venues.length === 'undefined') venues = [venues];

		// expected values

		for(i=0;i<venues.length;i++){

			venue = venues[i];

			if( !venue.name ||
				!venue.url ||
				!venue.createdBy ){
				callback('data incomplete');
				return;
			}

			// add attrs
			venue.createdAt = new Date();
			venue.guests = [];
			venue.comc = 0; //comment count
			venue.featured = false; // relevant for info mail

		}


		collection.insert(venues, function(error,results) {
			if(error) onError(error);
			else{
				console.log('Venues created: '+venues);
				onSuccess(results);
			}
		});

	},onError);
}










// Dummy data

// new VenueProvider.saveVenues([
// 	{
// 		name: 'Testvenue0',
// 		url: 'http://www.alf.de',
// 		createdBy: ''
// 	}
// ], function(error, venues));






exports.venueProvider = new VenueProvider();
