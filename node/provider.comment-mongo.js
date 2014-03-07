/*
 * Lunchpad comments provider
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */



var db = require('./module.dbase.js').dBase,
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
		},{},function(error,comments){
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

CommentProvider.prototype.findWidthVenue = function(vid, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.find({
			vid: vid,
			del: false
		},{
			sort:[[date:1]]
		},function(error,venues){
			if(error) onError(error);
			else onSuccess(venues);
		});

	},onError);
}




/*
 * Set comment to deleted
 */

CommentProvider.prototype.deleteComment = function(id, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.update({
			_id: db.oID(id),
			del: false
		},{
			$set:{
				del: true
			}
		},{
			save: true,
			multi: false
		},function(error,updates){
			if(error) onError(error);
			else if(!updates) onError('comment not found.');
			else onSuccess(updates);
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

		if(comments.length === 'undefined') comments = [comments];

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
				console.log('User created: '+comments.length);
				onSuccess(null,results);
			}
		});

	},onError);
}






exports.commentProvider = new CommentProvider(); 