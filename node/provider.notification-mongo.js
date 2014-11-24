/*
 * Lunchpad Notification provider
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */



var db = require('./module.dbase.js').dBase,
	quando = require('./module.quando.js').quando,
	cn = 'notification';


var NotificationProvider = function(){};






/*
 * find all
 */

NotificationProvider.prototype.findAll = function(onSuccess, onError){
	db.gc(cn, function(collection){

		collection.find({},{
			sort:[['date','desc']]
		}).toArray(function(error,results){
			if(error) onError(error);
			else onSuccess(results);
		});

	},onError);
}





/*
 * Count older then 15min
 */

NotificationProvider.prototype.countLt15min = function(type, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.count({
			type: type,
			date: {$lte: quando.min15()}
		}, function(error,count){
			if(error) onError(error);
			else onSuccess(count);
		});

	},onError);
}



/*
 * Count older then 5min
 */
NotificationProvider.prototype.countLt5min = function(type, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.count({
			type: type,
			date: {$lte: quando.min5()}
		}, function(error,count){
			if(error) onError(error);
			else onSuccess(count);
		});

	},onError);
}





/*
 * Delete for uid
 */
/*
NotificationProvider.prototype.delWithUid = function(uid, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.remove({
			uid: uid
		},{
			safe: true
		},function(error,numRemoved){
			if(error) onError(error);
			else{
				console.log('Notis removed: '+numRemoved);
				onSuccess(numRemoved);
			}
		});

	},onError);
}
*/

NotificationProvider.prototype.delWithTypeAndUser = function(type, userId, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.remove({
			'user.id': userId,
			type: type
		},{
			safe: true
		},function(error,numRemoved){
			if(error) onError(error);
			else{
				console.log('Notis removed: '+numRemoved);
				onSuccess(numRemoved);
			}
		});

	},onError);
}


/*
 * Delete all
 */

NotificationProvider.prototype.delAll = function(type, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.remove({
			type: type
		},{
			safe: true
		},function(error,numRemoved){
			if(error) onError(error);
			else{
				console.log('Notis removed: '+numRemoved);
				onSuccess(numRemoved);
			}
		});

	},onError);
}


/*
 * Aggregate all comments
 */
NotificationProvider.prototype.aggrTargets = function(type, onSuccess, onError){
	db.gc(cn, function(collection){

		// ????

		collection.aggregate([
			{$match:{
				type: type
			}},
			{$group:{
				_id: {
					target: '$target',
					venue: '$venue'
				},
				users: {
					'$addToSet': user
				}
			}},
			{$group:{
				_id: {
					target: '$target'
				},
				venues: {
					'$push': {
						venue: '$venue',
						users: '$users'
					}
				}
			}}
		], function(error, results){
			if(error) onError(error);
			else onSuccess(results);
		});

	},onError);
}

// So.
// Zum Eintragen sollten wir eine shortcut fn schreiben,
// die uns eine noti für einen array von usern erstellen lässt.

// Der UserProvider muss uns noch die Infos holen, welche User denn
// jeweils für Eintragen der Notification relvant sind.




/*
 * Save one or more new notifications
 */

NotificationProvider.prototype.save = function(notis, onSuccess, onError){
	db.gc(cn, function(collection){

		var i,
			noti;

		if(notis.length === undefined) notis = [notis];

		// expected values

		for(i=0;i<notis.length;i++){

			noti = notis[i];

			if( !noti.target || // that's a user
				!noti.target._id ||
				!noti.target.nick ||
				!noti.type || //either comment or checkin
				!noti.venue ||
				!noti.venue._id ||
				!noti.venue.name ||
				!noti.user ||
				!noti.user._id ||
				!noti.user.nick ||
				!noti.user.ava){
				// there is no parameter for commets.
				// place additional data as attributes of existing objects.
				// this way they wont get lost in the pipeline
				// noti.user.comment
				callback('data incomplete');
				return;
			}

			// fill auto values
			noti.date = new Date();
		}


		collection.insert(notis, function(error,results) {
			if(error) onError(error);
			else{
				console.log('Checkins created: '+notis.length);
				onSuccess(results);
			}
		});

	},onError);
}




/*
 * Save one checkin and delete others from the same user from today
 */
/*
NotificationProvider.prototype.saveAndDel = function(noti, onSuccess, onError){
	NotificationProvider.prototype.delWithUid(noti.uid,function(numRemoved){
		NotificationProvider.prototype.save(noti,onSuccess,onError);
	},onError);
}
*/





exports.notificationProvider = new NotificationProvider();
