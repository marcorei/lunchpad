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
'Socket','LpConfig','LpError','LpUserIdService','$timeout',
function(Socket,LpConfig,LpError,LpUserIdService,$timeout){

	var venues = [],
		queue = [],
		loaded = false,
		socketManager = Socket.generateManager(null);


	var createVenue = function(name, url){
		socketManager.emit(LpConfig.getEvent('venue.create'),{
			name: name,
			url: url
		});
	}

	var getVenueById = function(id, callback){
		if(loaded){
			callback(venues[findVenueIndexById(id)]);
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
		console.log('logging out');
		socketManager.emit(LpConfig.getEvent('checkin.delete'),{});
	};

	var loadVenues = function(callback){
		socketManager.emit(LpConfig.getEvent('venue.read.list'),{},function(data){
			if(!data.error){
				LpUserIdService.getId(function(userId){

					// clear the venues
					venues.splice(0,venues.length);

					// need to push so that the array object, that controllers bind to won't change.
					for(var i=0; i<data.venues.length; i++){
						//check for every guest, check if it's the current user
						for(var j=0; j<data.venues[i].guests.length; j++)
						{
							//console.log('checking if loggend in at: '+i+','+j);
							//console.log('ze user id ist: '+data.venues[i].guests[j]._id+' -- my user id ist: '+userId);
							if(data.venues[i].guests[j]._id == userId){
								//console.log('yes! i am here! at: '+i+','+j);
								data.venues[i].attending = true;
								break;
							}
						}
						venues.push(data.venues[i]);
					}

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
			//console.log('matching vnue ids: '+venue._id+' - '+id);
			//console.log(id);
			if(venue._id === id){
				//console.log('found venue id: '+i);
				return i;
			}
		}
		//console.log('venue id not found');
		return -1;
	};

	var checkPositionForIndex = function(index){
		//console.log('checking position for index: '+ index);
		var c = venues[index].guests.length,
			d,
			tc = -1,
			i;
		//console.log('c == '+c);

		for(i = index -1; i >= 0; i--){
			//console.log('starting iteration for up, comparing to index: '+i);
			d = venues[i].guests.length;
			//console.log('d == '+d);
			if(c > d){
				//console.log('saving upwards movement');
				tc = i;
			}else{
				//console.log('breaking up');
				break;
			}
		}

		if(tc != -1){
			//console.log('going up! new index: '+tc);
			return tc;
		}

		for(i = index+1; i < venues.length; i++){
			//console.log('starting iteration for down, comparing to index: '+i);
			d = venues[i].guests.length;
			//console.log('d == '+d);
			if(c < d){
				//console.log('saving downwards movement');
				tc = i;
			}else{
				//console.log('breaking up');
				break;
			}
		}

		if(tc != -1){
			//console.log('going down! new index: '+tc);
			return tc;
		}else{
			//console.log('staying at index: '+index);
			return index;
		}
	}

	var rearrangeVenue = function(index){
		var tc = checkPositionForIndex(index);
		if(tc != index){
			var tempVenue = venues.splice(index,1)[0];
			$timeout(function(){
				venues.splice(tc,0,tempVenue);
			},0);
		}
	}






	var onUnhandledModify = function(){
		console.log('unhandled modify, reloading');
		if(loaded){
			loaded = false;
			loadVenues();
		}
	};

	var onCheckinCreateDone = function(data){
		// delete the user
		onCheckinDeleteDone(data);
		// put in the new one
		var index = findVenueIndexById(data.vid);
		if(index < 0){
			onUnhandeltModify;
			return null;
		}

		LpUserIdService.getId(function(userId){
			venues[index].guests.push(data.user);
			// attending or not, here i come
			if(data.user._id == userId){
				venues[index].attending = true;
			}
			//console.log('rearranging after inserting');
			rearrangeVenue(index);
		});
	};

	var onCheckinDeleteDone = function(data){
		console.log('registering delete done');
		LpUserIdService.getId(function(userId){
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
						// attending or not, here i leave
						if(data.user._id == userId){
							venues[i].attending = false;
						}
						break;
					}
				}
				if(index !== undefined){
					//console.log('rearranging after deletion');
					rearrangeVenue(index);
					break;
				}
			}
		});
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

	var onVenueCreateDone = function(data){
		LpError.throwHint('The new venue ' + data.venue.name + ' has been created!');
		onUnhandledModify();
	}




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

		socketManager.on(LpConfig.getEvent('venue.create.done'),onVenueCreateDone);
		socketManager.on(LpConfig.getEvent('venue.delete.done'),onUnhandledModify);
	});


	return {
		venues: venues, // bind to this
		getVenueById: getVenueById, // shortcut with queuing and callback
		checkIn: checkIn,
		checkOut: checkOut,
		createVenue: createVenue
	};

}]);
