/*
 * Service to request and cache a comment thread.
 * You can use the service directly to create or delete comments.
 * Or you can generate a Manager to load a thread and do the above.
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


	var loadComments = function(venueId, callback, manager){
		manager.socketManager.emit(LpConfig.getEvent('comment.read.list'),{
			_id: venueId
		},function(data){
			LpUserIdService.getId(function(userId){
				for(var i=0; i<data.comments.length; i++){
					/*
					if(data.comments[i].user._id == userId){
						data.comments[i].owner = true;
					}else{
						data.comments[i].owner = false;
					}
					*/
					data.comments[i].owner = (data.comments[i].user._id == userId);

					manager.comments.push(data.comments[i]);
				}

				manager.venueId = venueId;
				if(callback) callback();
			});

		})
	};

	var clearComments = function(manager){
		manager.venueId = -1;
		comments.splice(0,comments.length);
	};

	var createComment = function(txt, venueId){
		Socket.emit(LpConfig.getEvent('comment.create'),{
			vid: venueId,
			txt: txt
		});
	}

	var deleteComment = function(commentId){
		Socket.emit(LpConfig.getEvent('comment.delete'),{
			_id: commentId
		});
	}

	var createCommentDone = function(data, manager){
		if(data.comment.vid == manager.venueId ){
			LpUserIdService.getId(function(userId){
				data.comment.owner = (data.comment.user._id == userId);
				manager.comments.push(data.comment);
			});
		}
	};

	var deleteCommentDone = function(data, manager){
		if(data.comment.vid == manager.venueId ){
			var index = findCommentIndexById(data.comment._id, manager);
			if(index !== -1){
				manager.comments[index].deleted = true;
			}else{
				fixUnhandledModify(manager);
			}
		}

	};

	var fixUnhandledModify = function(manager){
		clearComments(manager);
		if(manager.venueId !== -1)
		{
			loadComments(manager.venueId, manager);
		}
	};

	var findCommentIndexById = function(id, manager){
		var i,
			comment;
		for(i = 0; i < manager.comments.length; i++){
			comment = manager.comments[i];
			if(comment._id === id){
				return i;
			}
		}
		return -1;
	};



	var CommentsManager = function(scope){
		var comments = [],
			self = this;
		this.venueId = -1;
		this.socketManager;

		var onCommentCreateDone = function(data){
			createCommentDone(data, self);
		}

		var onCommentDeleteDone = function(data){
			deleteCommentDone(data, self);
		}

		if(scope == undefined){
			throw 'scope not defined. CommentsManager can not work with rootScope';
		}
		this.socketManager = Socket.generateManager(scope);
		this.socketManager.on(LpConfig.getEvent('comment.create.done'),onCommentCreateDone);
		this.socketManager.on(LpConfig.getEvent('comment.delete.done'),onCommentDeleteDone);

		// API

		this.loadComments = function(venueId, callback){
			loadComments(venueId, callback, self);
		}

		this.createComment = function(txt){
			createComment(txt, self.venueId);
		}

		this.deleteComment = deleteComment;
		this.comments = comments;
	}

	var generateManager = function(scope){
		return new CommentsManager(scope);
	}

	return {
		generateManager: generateManager,
		createComment: createComment,
		deleteComment: deleteComment
	};

}]);
