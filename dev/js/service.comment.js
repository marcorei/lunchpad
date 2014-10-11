/*
 * Service to request and cache a comment thread
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */

angular.module('lpCommentService',[
	'socket',
	'lpConfig'
])

.factory('LpCommentService',[
'Socket','LpConfig','LpError','LpUserIdService',
function(Socket,LpConfig,LpError,LpUserIdService){

	var comments = [],
		currentVenueId = -1,
		socketManager = Socket.generateManager(null);


	var loadComments = function(venueId, callback){
		socketManager.emit(LpConfig.getEvent('comment.read.list'),{
			_id: venueId
		},function(data){
			for(var i=0; i<data.comments.length; i++){
				comments.push(data.comments[i]);
			}

			currentVenueId = venueId;
			addListeners();
			if(callback) callback();
		})
	};

	var clearComments = function(){
		currentVenueId = -1;
		removeListeners();
		comments.splice(0,comments.length);
	};

	var createComment = function(txt){
		socketManager.emit(LpConfig.getEvent('comment.create'),{
			vid: currentVenueId,
			txt: txt
		});
	}

	var onCommentCreateDone = function(comment){
		comments.push(comment);
	};

	var onCommentDeleteDone = function(comment){
		var index = findCommentIndexById(comment._id);
		comments[index].deleted = true;
	};

	var onUnhandeltModify = function(){
		if(loaded){
			loaded = false;
			clearComments();
			if(currentVenueId >= 0)
			{
				loadComments(currentVenueId);
			}
		}
	};


	var findCommentIndexById = function(id){
		var i,
			comment;
		for(i = 0; i < comments.length; i++){
			comment = comments[i];
			if(comment._id === id){
				return i;
			}
		}
		return -1;
	};

	var addListeners = function(){
		socketManager.on(LpConfig.getEvent('comment.create.done'),onCheckinCreateDone);
		socketManager.on(LpConfig.getEvent('comment.delete.done'),onCheckinDeleteDone);
	};

	var removeListeners = function(){
		socketManager.off(LpConfig.getEvent('comment.create.done'),onCheckinCreateDone);
		socketManager.off(LpConfig.getEvent('comment.delete.done'),onCheckinDeleteDone);
	};

	return {
		comments: comments,
		loadComments: loadComments,
		clearComments: clearComments
	};

}]);
