/*
 * Lunchpad main app
 *
 * New Version for socket.io and mongo based express app.
 * Rewrite everything! Yay!
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */




var path = require('path'),
	express = require('express'),
	app = express(),
	server = require('http').createServer(app),

	io = require('socket.io')(server),
	MongoStore = require('connect-mongo')(express),
	passportSocketIo = require('passport.socketio'),

	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	hash = require('password-hash'),

	Validate = require('./module.validate.js').Validate,

	// own modules?

	venueProvider = require('./provider.venue-mongo.js').venueProvider,
	userProvider = require('./provider.user-mongo.js').userProvider,
	itemProvider = require('./provider.item-mongo.js').itemProvider,
	checkinProvider = require('./provider.checkin-mongo.js').checkinProvider,
	commentProvider = require('./provider.comment-mongo.js').commentProvider,
	// wait and see what else we'll need

	config = require('./config.json');










/*
 * Pimped Date
 * Thank you http://blog.justin.kelly.org.au/!
 */

Date.prototype.yyyymmdd = function() {         
                                
    var yyyy = this.getFullYear().toString(),                                    
    	mm = (this.getMonth()+1).toString(),      
    	dd  = this.getDate().toString();             
                        
    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);

}; 







/*
 * Helper functions
 */

var lunchHelper = {

	sendFile: function(fileName){
		return function(req, res){
			res.sendFile( path.join( __dirname, fileName ));
		}
	},

	sendHtml: function(filename){
		sendFile('../templates/'+filename);
	},

	sendErrorToRes: function(res,msg,code,nolog){
		if(!nolog) console.log(msg);
		code = code || 0;

		res.json({
			error: {
				code: 0,
				msg: msg
			}
		});
	},

	sendErrorToSocket: function(socket,msg,code,nolog){
		if(!nolog) console.log(msg);
		code = code || 0;

		socket.emit('error',{
			code: code,
			msg: msg
		});
	},

	sendErrorToSocketCb: function(fn,msg,code,nolog){
		if(!nolog) console.log(msg);
		code = code || 0;

		fn({
			error:{
				code: code,
				msg: msg
			}
		});
	}


}


var lunchAuth = {

	isUser: function(socket, onSuccess){
		if(socket.handshake.user.logged_in) onSuccess(socket.handshake.user);
		else sendErrorToSocket('User not authenticated', 403);
	},

	isAdmin: function(socket, onSuccess){
		if(socket.handshake.user.logged_in && socket.handshake.user.role === 'admin') onSuccess(socket.handshake.user);
		else sendErrorToSocket('Admin rights missing', 403);
	},

	isOwner: function(socket, uid, onSuccess){
		if(socket.handshake.user.logged_in && socket.handshake.user._id == uid) onSuccess(socket.handshake.user);
		else sendErrorToSocket('Owner rights missing', 403);
	},

	isOwnerOrAdmin: function(socket, uid, onSuccess){
		if(socket.handshake.user.logged_in && (socket.handshake.user.role === 'admin' || socket.handshake.user._id == uid)) onSuccess(socket.handshake.user);
		else sendErrorToSocket('Admin or Owner rights missing', 403);
	}

}







/*
 * Session store setup
 */

var mongoStore = new MongoStore({
	host: config.mongo.host,
	port: config.mongo.port,
	db: config.mongo.db
	// stringify: true
});






/*
 * io config
 */

io.set('authorization', passportSocketIo.authorize({
	cookieParser: express.cookieParser,
	key:         config.cookie.key,
	secret:      config.secret,
	store:       mongoStore
	//success:     onAuthorizeSuccess,
	//fail:        onAuthorizeFail
}));

//socket.handshake.user
// This property is always available from inside a io.on('connection') handler.







/*
 * Express setup
 */


// app setup

app.use( express.cookieParser() );
app.use( express.bodyParser() );
app.use( express.session({ 
	store: MongoStore,
	secret: config.secret,
	key: config.cookie.key
}));
app.use( passport.initialize() );
app.use( passport.session() );


// Static content

app.use('/static', express.static(__dirname + '/../static'));
app.use('/templates', express.static(__dirname + '/../templates'));









/*
 * Passport setup
 */


// Serialization

passport.serializeUser(function(user, done) {
	done(null, user._id);
});

passport.deserializeUser(function(id, done){
	userProvider.findUser(id,function(user){
		done(null,user);
	},function(error){
		done(error);
	})
});



// Strategies etc

passport.use('local-login', new LocalStrategy(
	function( mail, pass, done ){
		console.log('starting auth strategie for user: ' + mail);
		userProvider.findUserByMail( mail, function(user){

			if(!hash.verify(pass, user.pass)){
				console.log('password did not match for user: ' + mail);
				return done( null, false, {message:'Incorrect password.'} ); 
			}
			console.log('user authenticated: ' + user.nick + ' (' + mail + ')');
			return done( null, user );

		},function(error){
			console.log(error);
			return done(error); 
		});	
	}
));



















/*
 * Express Routes
 */


// Pages. Just get, no data.

app.get('/', lunchHelper.sendHtml('page.app.angular.html'));
app.get('/login', lunchHelper.sendHtml('page.login.html'));
app.get('/manifesto', lunchHelper.sendHtml('page.manifesto.html'));


// Action-Requests not send via socket (login / logout via passport)

app.post('/auth/login', passport.authenticate('local-login'), function(req,res){
	if(req.isAuthenticated()) res.json({ error: null });
	else sendErrorToRes(res,'Login failed.')();
});

app.post('/auth/logout', function(req,res){
	req.logout();
	res.json({ error: null });
});







/*
 * Socket.io Events
 */


io.sockets.on('connection', function (socket) {

	// Chat

	socket.on('chat send', function(data){
		lunchAuth.isUser(socket, function(user){
			socket.broadcast.emit('chat message',{
				user: {
					nick: user.nick
				},
				msg: data.msg
			});
		});
	});




	// Venue

	socket.on('venue read list', function(data,cb){
		lunchAuth.isUser(socket, function(user){
			venueProvider.findAll(function(venues){

				cb({
					error: null,
					venues: venues
				});

			},function(error){
				sendErrorToSocketCb(cb,error);
			});
		});
	});


	socket.on('venue read one', function(data,cb){
		lunchAuth.isUser(socket, function(user){

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'venue.id')
			.e()){
				sendErrorToSocketCb(cd,e);
				return null;
			}

			venueProvider.findVenue(data._id, 
			function(venue){

				cb({
					error: null,
					venue: venue
				}); 	 

			},function(error){
				sendErrorToSocketCb(cb,error);
			});
		});
	});


	socket.on('venue create', function(data){
		lunchAuth.isUser(socket, function(user){

			data.name = Validate.s('escape',[data.name]);

			var e;
			if(e = new Validate()
			.v('isLength',[data.name,2,100],'venue.name.length')
			.v('isURL',[data.url,{require_protocol: true},'venue.url')
			.v('isLength',[data.createdBy,24,24],'venue.id')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}

			venueProvider.saveVenues({
				name: data.name,
				url: data.url,
				createdBy: data.createdBy
			},function(result){

				socket.broadcast.emit('venue create done',{
					result: result
				});

			},function(error){
				sendErrorToSocket(socket,error);
			});			
		});
	});


	socket.on('venue update name', function(data){
		lunchAuth.isAdmin(socket, function(user){

			data.name = Validate.s('escape',[data.name]);

			var e;
			if(e = new Validate()
			.v('inLength',[data._id,24,24],'venue.id')
			.v('isLength',[data.name,2,100],'venue.name.length')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}

			venueProvider.updateName(data._id, data.name,
			function(updated){

				socket.broadcast.emit('venue name update done',{
					venue: updated
				});

			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});


	socket.on('venue update url', function(data){
		lunchAuth.isUser(socket, function(user){

			var e;
			if(e = new Validate()
			.v('inLength',[data._id,24,24],'venue.id')
			.v('isURL',[data.url,{require_protocol: true},'venue.url')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}			

			venueProvider.updateUrl(data._id, data.url,
			function(updated){

				socket.broadcast.emit('venue url update done',{
					venue: updated
				});

			},function(error){
				sendErrorToSocket(socket,error);
			});

		});
	});


	socket.on('venue delete', function(data){
		lunchAuth.isAdmin(socket, function(user){

			var e;
			if(e = new Validate()
			.v('inLength',[data._id,24,24],'venue.id')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}

			venueProvider.deleteVenue(data._id,
			function(removed){

				socket.broadcast.emit('venue delete done',{
					removed: removed
				});

			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});




	// Checking

	socket.on('checkin create', function(data){
		lunchAuth.isUser(socket, function(user){

			var e;
			if(e = new Validate()
			.v('inLength',[data._id,24,24],'checkin.id')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}

			checkinProvider.delTodayForUid(user._id,
			function(numRemoved){
				venueProvider.delUserForToday(user._id,
				function(numRemoved){
					
					checkinProvider.save({
						uid: user._id,
						vid: data._id
					},function(results){
						
						var insert = {
							_id: user._id,
							nick: user.nick,
							item: user.item,
							ava: user.ava
						};

						venueProvider.addUserToVenue(data._id, insert,
						function(updates){

							socket.broadcast.emit('checkin create done',{
								vid: data._id,
								user: insert
							});

						},function(error){
							sendErrorToSocket(socket,error);
						});
					},function(error){
						sendErrorToSocket(socket,error);
					});
				},function(error){
					sendErrorToSocket(socket,error);
				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('checkin delete', function(data){
		lunchAuth.isUser(socket, function(user){
			checkinProvider.delTodayForUid(user._id,
			function(numRemoved){
				venueProvider.delUserForToday(user._id,
				function(numRemoved){

					socket.broadcast.emit('checkin delete done',{
						user: {
							_id: user._id
						}
					});

				},function(error){
					sendErrorToSocket(socket,error);
				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});


	

	// Comment
	
	socket.on('comment read list', function(data,cb){
		lunchAuth.isUser(socket, function(user){

			var e;
			if(e = new Validate()
			.v('inLength',[data._id,24,24],'venue.id')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}

			commentProvider.findWithVenue(data._id,
			function(comments){

				cb({
					error: null,
					comments: comments
				});

			},function(error){
				sendErrorToSocketCb(cb,error);
			});
		});
	});

	socket.on('comment create', function(data){
		lunchAuth.isUser(socket, function(user){

			data.txt = Validate.s('escape',[data.txt]);

			var e; 
			if(e = new Validate()
			.v('inLength',[data.vid,24,24],'venue.id')
			.v('isLength',[data.name,1,140],'comment.txt.length')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}

			var insert = {
				user: {
					_id: user._id,
					nick: user.nick,
					item: user.item,
					ava: user.ava
				},
				vid: data.vid,
				txt: data.txt
			};

			commentProvider.saveComment(insert,
			function(comment){
				commentProvider.countWithVenue(data.vid,
				function(count){
					venueProvider.updateCommentCount(data.vid,count,
					function(venue){

						socket.broadcast.emit('comment create done',{
							count: count,
							comment: comment
						});

					},function(error){
						sendErrorToSocket(socket,error);
					});
				},function(error){
					sendErrorToSocket(socket,error);
				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('comment delete', function(data){
		lunchAuth.isOwnerOrAdmin(socket, data._id, function(user){

			var e;
			if(e = new Validate
			.v('inLength',[data._id,24,24],'comment.id')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}

			commentProvider.deleteComment( _id: data._id,
			function(comment){
				commentProvider.countWithVenue(comment.vid,
				function(count){
					venueProvider.updateCommentCount(comment.vid,count,
					function(venue){

						socket.broadcast.emit('comment delete done',{
							count: count,
							comment: comment
						});

					},function(error){
						sendErrorToSocket(socket,error);
					});
				},function(error){
					sendErrorToSocket(socket,error);
				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});




	

	// User

	socket.on('user create', function(data){
		lunchAuth.isAdmin(socket, function(user){

			data.nick = Validate.s('escape',[data.nick]);

			var e;
			if(e = new Validate
			.v('isEmail',[data.mail],'user.mail')
			.v('isAlphanumeric',[data.nick],'user.nick.alphanumeric')
			.v('isLength',[data.nick,3,15],'user.nick.length')
			.v('isIn',[data.role,['user','admin']],'user.role')
			.v('isLength',[data.pass,5],'user.pass')
			.v('isURL',[data.ava,{require_protocol: true}],'user.ava')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}

			userProvider.save({
				mail: data.mail,
				nick: data.nick,
				role: data.role,
				pass: data.pass,
				ava: data.ava
			},function(results){

				socket.emit('user create done',{
					_id: results[0]._id,
					nick: results[0].nick
				});

			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('user read list', function(data,cb){
		lunchAuth.isAdmin(socket, function(user){
			userProvider.findAll(function(results){

				cb({
					error: null,
					users: results
				});

			},function(error){
				sendErrorToSocketCb(cb,error);
			});
		});
	});

	socket.on('user read one', function(data,cb){
		lunchAuth.isOwnerOrAdmin(socket, data._id, function(user){

			var e;
			if(e = new Validate
			.v('inLength',[data._id,24,24],'user.id')
			.e()){
				sendErrorToSocketCb(cb,e);
				return null;
			}

			userProvider.findUser( data._id
			function(result){
				result.pass = null;

				cb({
					error: null,
					users: result
				});

			},function(error){
				sendErrorToSocketCb(cb,error);
			});
		});
	});

	socket.on('user update password', function(data){
		lunchAuth.isOwnerOrAdmin(socket, data._id, function(user){

			var e;
			if(e = new Validate
			.v('inLength',[data._id,24,24],'user.id')
			.v('isLength',[data.pass,5],'user.pass')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}

			userProvider.updatePass( data._id, data.pass,
			function(updates){

				socket.emit('user update password done',{
					updated: true
				});

			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('user update notifications', function(data){
		lunchAuth.isOwner(socket, function(user){

			data.remind = Validate.s('toBoolean',[data.remind,true]);
			data.overv = Validate.s('toBoolean',[data.overv,true]);

			userProvider.updateNoti( user._id, {
				remind: data.remind,
				overv: data.overv
			},
			function(results){

				socket.emit('user update notifications done',{
					updated: true
				});

			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('user update activeitem', function(data){
		lunchAuth.isOwner(socket, function(user){

			var e;
			if(e = new Validate
			.v('inLength',[data._id,24,24],'user.id')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}

			// -------------
			//	Currently, there is nothing to prevent users to set items active, which are not in there inventory.
			//  TODO: Add check, if item is indeed in the invetory of the user.
			// -------------

			itemProvider.findItem(data._id,
			function(item){
				userProvider.updateAktiveItem( user._id, item,
				function(results){

					socket.emit('user update active item done',{
						updated: true
					});

				},function(error){
					sendErrorToSocket(socket,error);
				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('user update inventory', function(data){
		lunchAuth.isAdmin(socket, function(user){

			var e;
			if(e = new Validate
			.v('inLength',[data._id,24,24],'user.id')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}

			if( !Array.isArray(data.inv) ){
				sendErrorToSocket(socket,new Validate().msgs['user.inv']);
				return null;
			}

			userProvider.updateInventoryById( data._id, data.inv,
			function(results){

				socket.emit('user update invetory done',{
					updated: true
				});

			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('user delete', function(data){
		lunchAuth.isAdmin(socket, function(user){

			var e;
			if(e = new Validate()
			.v('inLength',[data._id,24,24],'user.id')
			.e()){
				sendErrorToSocket(socket,e);
			}

			userProvider.deleteUser( data._id,
			function(results){

				socket.emit('user delete done',{
					_id: data._id
				});

			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});




	// Items

	socket.on('item create', function(data){
		lunchAuth.isAdmin(socket, function(user){

			// -------------
			//	No validation 'cause Admind
			//  TODO: Add validation
			// -------------

			itemProvider.saveItems({
				name: data.name,
				url: data.url,
				type: data.type,
				front: data.front
			},function(results){

				socket.emit('item create done',{
					results: results
				});

			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('item read one', function(data,cb){
		lunchAuth.isUser(socket, function(user){

			var e;
			if(e = new Validate()
			.v('inLength',[data._id,24,24],'item.id')
			.e()){
				sendErrorToSocketCb(cb,e);
				return null;
			}

			itemProvider.findItem( data._id,
			function(item){

				cb({
					error: null,
					item: item
				});

			},function(error){
				sendErrorToSocketCb(cb,error);
			});
		});
	});

	socket.on('item read multiple', function(data,cb){
		lunchAuth.isAdmin(socket, function(user){

			var v = new Validate(),
				e,
				i;

			if( !Array.isArray(data.ids) ){
				sendErrorToSocketCb(cb,v.msgs['item.id']);
				return null;
			}

			for(i=0; i<data.ids.length; i++){
				v.v('inLength',[data.ids[i],24,24],'item.id')
			}
			if(e = v.e()){
				sendErrorToSocketCb(cb,e);
				return null;
			}

			itemProvider.findItems( data.ids,
			function(results){

				cb({
					error: null,
					items: items
				});

			},function(error){
				sendErrorToSocketCb(cb,error);
			});
		});
	});

	socket.on('item read list', function(data,cb){
		lunchAuth.isAdmin(socket, function(user){
			itemProvider.findAll(function(results){

				cb({
					error: null,
					items: items
				});

			},function(error){
				sendErrorToSocketCb(cb,error);
			});
		});
	});

	socket.on('item delete', function(data){
		lunchAuth.isAdmin(socket, function(user){

			var e;
			if(e = new Validate()
			.v('inLength',[data._id,24,24],'item.id')
			.e()){
				sendErrorToSocketCb(cb,e);
				return null;
			}
			
			userProvider.removeItemFromInventories(	data._id,
			function(updates){
				itemProvider.deleteItem( data._id
				function(results){

					socket.emti('item delete done',{
						_id: data._id
					});

				},function(error){
					sendErrorToSocket(socket,error);
				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});





	socket.on('disconnect', function(){
	});



});



















