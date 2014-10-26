/*
 * Lunchpad Checkin provider
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */



var db = require('./module.dbase.js').dBase,
	quando = require('./module.quando.js').quando,
	cn = 'checking';


var CheckinProvider = function(){
	db.gc(cn, function(collection){

		collection.ensureIndex({uid:1, date:1}, function(error,indexName){
			if(error) console.log(error);
		});

	},function(error){ console.log(error); });
};




/*
 * Get a list of all checkins
 */

CheckinProvider.prototype.findAll = function(onSuccess, onError){

}





/*
 * Find one checkin
 */

CheckinProvider.prototype.findCheckin = function(id, onSuccess, onError){

}








/*
 * Aggregate the favorite venue for the current weekday
 */

CheckinProvider.prototype.aggrWdFavVid = function(onSuccess, onError){
	db.gc(cn, function(collection){

		collection.aggregate([
			{$match:{
				wd: quando.weekday(),
				date: { $gte: quando.l60d() }
			}},
			{$group:{
				_id: '$vid',
				num: { $sum: 1 }
			}},
			{$sort:{
				_id: -1
			}},
			{$limit: 1}
		],function(error,results){
			if(error) onError(error);
			else if(!results || results.length === 0) onError('nothing to aggregate');
			else onSuccess(results[0]);
		});

	},onError);
}




/*
 * Aggregate the favorite venue
 */

CheckinProvider.prototype.aggrAllFavVid = function(onSuccess, onError){
	db.gc(cn, function(collection){

		collection.aggregate([
			{$match:{
				date: { $gte: quando.l30d() }
			}},
			{$group:{
				_id: '$vid',
				num: { $sum: 1 }
			}},
			{$sort:{
				_id: -1
			}},
			{$limit: 1}
		],function(error,results){
			if(error) onError(error);
			else if(!results || results.length === 0) onError('nothing to aggregate');
			else onSuccess(results[0]);
		});

	},onError);
}



/*
 * Aggregate the rising venue
 */

CheckinProvider.prototype.aggrRisingVid = function(onSuccess, onError){
	db.gc(cn, function(collection){

		// Aggregate last week

		collection.aggregate([
			{$match:{
				date: { $gte: quando.l7d() }
			}},
			{$group:{
				_id: '$vid',
				num: { $sum: 1 }
			}},
			{$match:{
				num: { $gt: 0 }
			}}
		],function(error,results1){
			if(error) onError(error);
			else if(!results1 || results1.length === 0) onError('nothing to aggregate');
			else {

				// aggregate last 4 weeks

				collection.aggregate([
					{$match:{
						date: { $gte: quando.l35d() }
					}},
					{$group:{
						_id: '$vid',
						num: { $sum: 1 }
					}},
					{$match:{
						num: { $gt: 0 }
					}}
				], function(error,results2){
					if(error) onError(error);
					else if(!results2 || results2.length === 0) onError('nothing to aggregate');
					else {

						var i,
							mapped35 = {},
							vid,
							high = { vid:'', percent: -9001, num: -1 },

							tmpPercent,
							tmpLast4WeekAvg;


						// map second array

						for(i=0;i<results2.length;i++){
							mapped35[results2[i]._id] = results2[i].num;
						}
						results2 = null;

						// compare growth

						for(i=0;i<results1.length;i++){

							vid = results1[i]._id;
							tmpLast4WeekAvg = (mapped35[vid] - results1[i].num) / 4;

							// calcuate

							if(tmpLast4WeekAvg > 0){
								tmpPercent = (100 / tmpLast4WeekAvg) * (results1[i].num - tmpLast4WeekAvg);
								tmpPercent = (tmpPercent > 9000) ? 9000 : tmpPercent;
								tmpPercent = (tmpPercent < -9000) ? -9000 : tmpPercent;
							}else{
								// it's over 9000!
								tmpPercent = 9001;
							}

							// compare

							if(high.percent < tmpPercent || (high.percent === tmpPercent && high.num < results1[i].num)){
								high.percent = tmpPercent;
								high.vid = vid;
								high.num = results1[i].num;
							}

						}

						// return high

						onSuccess(high);

					}
				})

			}
		});

	},onError);
}




/*
 * Aggregate babbo
 */

CheckinProvider.prototype.aggrBabo = function(onSuccess, onError){
	db.gc(cn, function(collection){

		collection.aggregate([
			{$match:{
				date: { $gte: quando.l30d() }
			}},
			{$group:{
				_id: '$uid',
				num: { $sum: 1 }
			}},
			{$sort:{
				_id: -1
			}},
			{$limit: 1}
		],function(error,results){
			if(error) onError(error);
			else if(!results || results.length === 0) onError('nothing to aggregate');
			else onSuccess(results[0]);
		});

	},onError);
}









/*
 * Delete todays checkins for a uid
 */

CheckinProvider.prototype.delTodayForUid = function(uid, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.remove({
			uid: uid,
			date: { $gte: quando.today() }
		},function(error,numRemoved){
			if(error) onError(error);
			else{
				console.log('Checkins removed: '+numRemoved);
				onSuccess(numRemoved);
			}
		});

	},onError);
}




/*
 * Save one or more new checkins
 */

CheckinProvider.prototype.save = function(checkins, onSuccess, onError){
	db.gc(cn, function(collection){

		var i,
			checkin;

		if(checkins.length === undefined) checkins = [checkins];

		// expected values

		for(i=0;i<checkins.length;i++){

			checkin = checkins[i];

			if( !checkin.uid ||
				!checkin.vid ){
				callback('data incomplete');
				return;
			}

			// fill auto values
			checkin.date = new Date();
			checkin.wd = quando.weekday();
		}


		collection.insert(checkins, function(error,results) {
			if(error) onError(error);
			else{
				console.log('Checkins created: '+checkins.length);
				onSuccess(results);
			}
		});

	},onError);
}



/*
 * Save one checkin and delete others from the same user from today
 */

CheckinProvider.prototype.saveAndDelToday = function(checkin, onSuccess, onError){
	CheckinProvider.prototype.delTodayForUid(checkin.uid,function(numRemoved){
		CheckinProvider.prototype.save(checkin,onSuccess,onError);
	},onError);
}







exports.checkinProvider = new CheckinProvider();
