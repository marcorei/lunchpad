/*
 * Lunchpad comments provider
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */



var db = require('./module.dbase.js').dBase,
	quando = require('./module.quando.js').quando,
	cn = 'comment';


var CommentProvider = function(){
	db.gc(cn, function(collection){

		collection.ensureIndex('vid', function(error,indexName){
			if(error) console.log(error);
		});

	},function(error){ console.log(error); });
};




/*
 * Get a list of all comments
 */

CommentProvider.prototype.findAll = function(onSuccess, onError){
	db.gc(cn, function(collection){

		collection.find({
			del:false
		},{}).toArray(function(error,comments){
			if(error) onError(error);
			else onSuccess(comments);
		})

	},onError);
}



/*
 * Find one comment via id
 */

CommentProvider.prototype.findComment = function(id, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.findOne({
			id: db.oID(id)
		},{},function(error,comment){
			if(!error) onError(error);
			else if(!comment) onError('comment not found!');
			else onSuccess(comment);
		})

	},onError);
}



/*
 * Find all comments from a venue id
 */

CommentProvider.prototype.findWithVenue = function(vid, onSuccess, onError){
	db.gc(cn, function(collection){
		
		collection.find({
			vid: vid,
			del: false,
			date: { '$gte': quando.today() }
		},{
			sort:[['date',1]]
		}).toArray(function(error,comments){
			if(error) onError(error);
			else onSuccess(comments);
		});

	},onError);
}


/*
 * Count all comments from a venue id
 */

CommentProvider.prototype.countWithVenue = function(vid, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.count({
			vid: vid,
			del: false,
			date: { '$gte': quando.today() }
		},function(error,count){
			if(error) onError(error);
			else onSuccess(count);
		});

	},onError);
}



/*
 * Get all user ids that commented on a venue
 */

CommentProvider.prototype.aggrUsersWithVenue = function(vid, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.aggregate([
			{$match:{
				vid: vid
			}},
			{$group:{
				_id: '$vid',
				users: {
					'$push': '$user._id'
				}
			}}
		], function(error, results){
			if(error) onError(error);
			else{
				if(results.length > 0){
					onSuccess(results[0].users);
				}else{
					onSuccess([]);
				}	
			}
		});

	},onError);
}




/*
 * Set comment to deleted
 */

CommentProvider.prototype.deleteComment = function(id, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.findAndModify({
			_id: db.oID(id),
			del: false
		},[],{
			$set:{
				del: true
			}
		},{
			save: true,
			multi: false
		},function(error,comment){
			if(error) onError(error);
			else if(!comment) onError('comment not found.');
			else onSuccess(comment);
		});

	},onError);
}




/*
 * Save a new comment / or more
 */

CommentProvider.prototype.saveComment = function(comments, onSuccess, onError){
	db.gc(cn, function(collection){

		var i,
			comment;

		if(comments.length === undefined) comments = [comments];

		// expected values

		for(i=0;i<comments.length;i++){

			comment = comments[i];

			if( !comment.user ||
				!comment.txt ||
				!comment.vid ){
				callback('data incomplete');
				return;
			}

			// fill auto values
			comment.date = new Date();
			comment.del = false;
		}


		collection.insert(comments, function(error,results) {
			if(error) onError(error);
			else{
				onSuccess(results);
			}
		});

	},onError);
}






exports.commentProvider = new CommentProvider();
