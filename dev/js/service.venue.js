/*
 * Service for venues. Queries and storesthe venue list, handels updates and sorting
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */


angular.module('venueService',[
	'socket',
	'lpConfig'
])

.factory('VenueService',[
'Socket','LpConfig'
function(Socket){

	var venues = [],
		queue = [],
		loaded = false,
		socketManager = Socket.generateManager();

	var getVenueById = function(id, callback){
		// check if loaded, else push to queue

	}

	var loadVenues = function(callback){
		socketManager.emit(LpConfig.getEvent('venue.read.list'),{},function(data){
			if(!data.error){
				venues = data.venues;
				if(callback) callback();
			}else{
				console.log(data.error);
				// Send to Error!
			}
		});
	}

	var onUnhandeltModify = function(){

	}

	var onCheckinCreateDone = function(){

	}

	var onCheckinDeleteDone = function(){

	}

	// init:load venues
		// subscribe to events


	loadVenues(function(){
		loaded = true;
		// work the queue
		// add events

	});


	return {
		venues = venues, // bind to this
		getVenueById = getVenueById
	};

}]);