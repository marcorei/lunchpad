/*
 * Service for venues. Queries and storesthe venue list, handels updates and sorting
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */


angular.module('lpVenueService',[
	'socket',
	'lpConfig',
	'lpError',
	'lpUserIdService'
])

.factory('LpVenueService',[
'Socket','LpConfig','LpError','LpUserIdService',
function(Socket,LpConfig,LpError,LpUserIdService){

	var venues = [],
		queue = [],
		loaded = false,
		socketManager = Socket.generateManager(null);

	var getVenueById = function(id, callback){
		if(loaded){
			callback(venues[findVenueById(id)]);
		}else{
			queue.push([getVenueById,[id,callback]]);
		}
	};

	var checkIn = function(id){
		socketManager.emit(LpConfig.getEvent('checkin.create'),{
			_id:id
		});
	};

	var checkOut = function(id){
		socketManager.emit(LpConfig.getEvent('checkin.delete'),{});
	};

	var loadVenues = function(callback){
		socketManager.emit(LpConfig.getEvent('venue.read.list'),{},function(data){
			if(!data.error){
				LpUserIdService.getId(function(userId){

					// need to push so that the array object, that controllers bind to won't change.
					for(var i=0; i<data.venues.length; i++){
						venues.push(data.venues[i]);
					}

					// TODO: CHECK FOR ATTENDED!

					loaded = true;
					if(callback) callback();
				});
			}else{
				LpError.throw(LpError.getMsg(data.error.code) || data.error.msg);
			}
		});
	};

	var findVenueIndexById = function(id){
		var i,
			venue,
			length = venues.length;
		for(i = 0; i < venues.length; i++){
			venue = venues[i];
			if(venue._id === id) return i;
		}
		return -1;
	};

	var checkPositionForIndex = function(index){
		var c = venues[index].guests.length,
			d,
			tc,
			i,
			span;

		span = index;
		for(i = 0; i < span; i++){
			d = venues[index - (1 + i)].guests.length;
			if(c < d){
				tc = index - (1 + i);
			}else{
				break;
			}
		}

		if(tc){	return tc; }

		span = venues.length - index;
		for(i = 0; i < span; i++){
			d = venue[index + (i + 1)].guest.length;
			if(c > d){
				tc = index + (i + 1);
			}else{
				break;
			}
		}

		return tc || index;
	}

	var rearrangeVenue = function(index){
		var tc = checkPositionForIndex(index);
		if(tc != index){
			venues.splice(tc,0,venues.splice(index,1)[0]);
		}
	}






	var onUnhandeltModify = function(){
		if(loaded){
			loaded = false;
			loadVenues();
		}
	};

	var onCheckinCreateDone = function(data){
		var index = findVenueIndexById(data.vid);
		if(index < 0){
			onUnhandeltModify;
			return null;
		}
		venues[index].guests.push(data.user);
		rearrangeVenue(index);
	};

	var onCheckinDeleteDone = function(data){
		var index,
			venue,
			i,
			j;
		for(i = 0; i < venues.length; i++){
			guests = venues[i].guests;
			for(j = 0; j < guests.length; j++){
				if(guests[j]._id === data.user._id){
					index = i;
					guests.splice(j,1);
					break;
				}
			}
			if(index !== 'undefined'){
				break;
			}
		}
		rearrangeVenue(index);
	};

	var onVenueUpdateNameDone = function(data){
		var index = findVenueIndexById(data.venue._id);
		if(index < 0){
			onUnhandeltModify;
			return null;
		}
		venues[index].name = data.venue.name;
	};

	var onVenueUpdateUrlDone = function(data){
		var index = findVenueIndexById(data.venue._id);
		if(index < 0){
			onUnhandeltModify;
			return null;
		}
		venues[index].url = data.venue.url;
	};

	var onCommentCreateDone = function(data){
		var index = findVenueIndexById(data.comment.vid);
		if(index < 0){
			onUnhandeltModify;
			return null;
		}
		venues[index].comc = data.count;
	};

	var onCommentDeleteDone = function(data){
		var index = findVenueIndexById(data.comment.vid);
		if(index < 0){
			onUnhandeltModify;
			return null;
		}
		venues[index].comc = data.count;
	};




	loadVenues(function(){
		var queueItem;
		while(queue.length > 0){
			queueItem = queue.pop();
			queueItem[0].apply(this,queueItem[1]);
		}

		socketManager.on(LpConfig.getEvent('checkin.create.done'),onCheckinCreateDone);
		socketManager.on(LpConfig.getEvent('checkin.delete.done'),onCheckinDeleteDone);
		socketManager.on(LpConfig.getEvent('venue.update.name.done'),onVenueUpdateNameDone);
		socketManager.on(LpConfig.getEvent('venue.update.url.done'),onVenueUpdateUrlDone);
		socketManager.on(LpConfig.getEvent('comment.create.done'),onCommentCreateDone);
		socketManager.on(LpConfig.getEvent('comment.delete.done'),onCommentDeleteDone);

		socketManager.on(LpConfig.getEvent('venue.create'),onUnhandeltModify);
		socketManager.on(LpConfig.getEvent('venue.delete'),onUnhandeltModify);
	});


	return {
		venues: venues, // bind to this
		getVenueById: getVenueById, // shortcut with queuing and callback
		checkIn: checkIn,
		checkOut: checkOut
	};

}]);
