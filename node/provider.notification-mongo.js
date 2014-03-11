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

NotificationProvider.prototype.countLt15min = function(onSuccess, onError){
	db.gc(cn, function(collection){

		collection.count({
			date: {$gt: quando.min15()}
		}, function(error,count){
			if(error) onError(error);
			else onSuccess(count);
		});

	},onError);
}





/*
 * Delete for uid
 */

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



/*
 * Delete all
 */

NotificationProvider.prototype.delAll = function(onSuccess, onError){
	db.gc(cn, function(collection){

		collection.remove({},{
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
 * Save one or more new notifications
 */

NotificationProvider.prototype.save = function(notis, onSuccess, onError){
	db.gc(cn, function(collection){

		var i,
			noti;

		if(notis.length === 'undefined') notis = [notis];

		// expected values
		
		for(i=0;i<notis.length;i++){

			noti = notis[i];

			if( !noti.uid ||
				!noti.unick ||
				!noti.uava ||
				!noti.vid ||
				!noti.vname ){
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

NotificationProvider.prototype.saveAndDel = function(noti, onSuccess, onError){
	NotificationProvider.prototype.delWithUid(noti.uid,function(numRemoved){
		NotificationProvider.prototype.save(noti,onSuccess,onError);
	},onError);
}






exports.notificationProvider = new NotificationProvider();