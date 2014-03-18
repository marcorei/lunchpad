/*
 * Lunchpad main app
 *
 * New Version for socket.io and mongo based express app.
 * Rewrite everything! Yay!
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
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

	Validator = require('validator').Validator,

	// own modules?

	venueProvider = require('./provider.venue-mongo.js').venueProvider,
	userProvider = require('./provider.user-mongo.js').userProvider,
	itemProvider = require('./provider.item-mongo.js').itemProvider,
	checkinProvider = require('./provider.checking-mongo.js').checkinProvider,
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
	}

	sendErrorToRes: function(res,msg,code,nolog){
		if(!nolog) console.log(msg);
		code = code || 0;

		res.json({
			error: {
				code: 0,
				msg: msg
			}
		});
	}

	sendErrorToSocket: function(socket,msg,code,nolog){
		if(!nolog) console.log(msg);
		code = code || 0;

		socket.emit('error',{
			code: code,
			msg: msg
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

app.get('/tmpl/venuelist', lunchHelper.sendHtml('tmpl.venuelist.html'));
app.get('/tmpl/venuedetail', lunchHelper.sendHtml('tmpl.venuedetail.html'));
app.get('/tmpl/newvenue', lunchHelper.sendHtml('tmpl.newvenue.html'));
app.get('/tmpl/settings', lunchHelper.sendHtml('tmpl.settings.html'));



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
 * Socket.io "Routes"
 */


io.sockets.on('connection', function (socket) {

	// Chat

	socket.on('send chat', function(data){
		lunchAuth.isUser(socket, function(user){
			socket.broadcast.emit('chat msg',{

				user: {
					nick: user.nick
				},
				msg: data.msg

			});
		});
	});




	// Venue

	socket.on('read venue list', function(data){
		lunchAuth.isUser(socket, function(user){
			venueProvider.findAll(function(venues){
				socket.emit('venue list', {

					venues: venues

				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});


	socket.on('read venue', function(data){
		lunchAuth.isUser(socket, function(user){
			venueProvider.findVenue(

			data._id, 

			function(venue){
				socket.emit('venue',{

					venue: venue

				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});


	socket.on('create venue', function(data){
		lunchAuth.isUser(socket, function(user){
			venueProvider.saveVenues({

				name: data.name,
				url: data.url,
				createdBy: data.createdBy

			},function(result){
				socket.broadcast.emit('venue created',{

					result: result

				});
			},function(error){
				sendErrorToSocket(socket,error);
			});			
		});
	});


	socket.on('update venue name', function(data){
		lunchAuth.isAdmin(socket, function(user){
			venueProvider.updateName(

			data._id,
			data.name,

			function(updates){
				socket.broadcast.emit('venue name updated',{

					updates: updates

				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});


	socket.on('update venue url', function(data){
		lunchAuth.isUser(socket, function(user){
			venueProvider.updateUrl(

			data._id,
			data.url,

			function(updates){
				socket.broadcast.emit('venue url updated',{

					updates: updates

				});
			},function(error){
				sendErrorToSocket(socket,error);
			});

		});
	});


	socket.on('delete venue', function(data){
		lunchAuth.isAdmin(socket, function(user){
			venueProvider.deleteVenue(

			data._id,

			function(removed){
				socket.broadcast.emit('venue deleted',{

					removed: removed

				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});




	// Checking

	socket.on('create checkin', function(data){
		lunchAuth.isUser(socket, function(user){
			checkinProvider.delTodayForUid(

			user._id,

			function(numRemoved){
				venueProvider.delUserForToday(

				user._id,

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
						venueProvider.addUserToVenue(

						data._id,
						insert,

						function(updates){
							socket.broadcast.emit('checkin added',{

								_id: data._id,
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

	socket.on('delete checkin', function(data){
		lunchAuth.isUser(socket, function(user){
			checkinProvider.delTodayForUid(

			user._id,

			function(numRemoved){
				venueProvider.delUserForToday(

				user._id,

				function(numRemoved){
					socket.broadcast.emit('checkin added',{

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
	
	socket.on('read comment list', function(data){
		lunchAuth.isUser(socket, function(user){
			commentProvider.findWithVenue(

			data._id,

			function(comments){
				socket.emit('comment list',{

					comments: comments

				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('create comment', function(data){
		lunchAuth.isUser(socket, function(user){
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
			commentProvider.saveComment(
			insert,
			function(results){
				commentProvider.countWithVenue(

				data.vid,

				function(count){
					venueProvider.updateCommentCount(

					data.vid,

					function(updates){
						socket.broadcast.emit('comment created',{

							comment: updates[0]

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

	socket.on('delete comment', function(data){
		lunchAuth.isOwnerOrAdmin(socket, data.uid, function(user){
			commentProvider.deleteComment(

			_id: data._id,

			function(updates){
				socket.broadcast.emit('comment deleted',{

					_id: data._id

				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});




	

	// USer

	socket.on('create user', function(data){
		lunchAuth.isAdmin(socket, function(user){
			userProvider.save({

				mail: data.mail,
				nick: data.nick,
				role: data.role,
				pass: data.pass,
				ava: data.ava

			},function(results){
				socket.emit('user created',{

					_id: results[0]._id,
					nick: results[0].mail

				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('read user list', function(data){
		lunchAuth.isAdmin(socket, function(user){
			userProvider.findAll(function(results){
				socket.emit('user list',{

					users: results

				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('read user', function(data){
		lunchAuth.isOwnerOrAdmin(socket, data._id, function(user){
			userProvider.findUser(

			data._id

			function(result){
				result.pass = null;
				socket.emit('user',{

					users: result

				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('update user password', function(data){
		lunchAuth.isOwnerOrAdmin(socket, data._id, function(user){
			userProvider.updatePass({

				data._id

			},function(updates){
				socket.emit('user pass updated',{

					updated: true

				});
			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('update user notifications', function(data){
		lunchAuth.isOwner(socket, function(user){
			userProvider.updateNoti({
				// !!!!!!! TODO !!!!!!
			},function(results){

			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('update user activeitem', function(data){
		lunchAuth.isOwner(socket, function(user){
			userProvider.updateAktiveItem({
// !!!!!!! TODO !!!!!!
			},function(results){

			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('update user inventory', function(data){
		lunchAuth.isAdmin(socket, function(user){
			userProvider.save({
// !!!!!!! TODO !!!!!!
			},function(results){

			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('delete user', function(data){
		lunchAuth.isAdmin(socket, function(user){
			userProvider.save({
// !!!!!!! TODO !!!!!!
			},function(results){

			},function(error){
				sendErrorToSocket(socket,error);
			});
		});
	});




// !!!!!!! TODO !!!!!!
// I T E M S




	socket.on('disconnect', function () {

	});



});



















