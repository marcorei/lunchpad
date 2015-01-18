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

	io = require('socket.io').listen(server),
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
	notificationProvider = require('./provider.notification-mongo.js').notificationProvider,
	cronTasks = require('./module.crontasks.js').cronTasks,
	mailer = require('./module.mailer.js').mailer,
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
			res.sendfile( path.join( __dirname, fileName ));
		}
	},

	sendHtml: function(filename){
		return lunchHelper.sendFile('../templates/'+filename);
	},

	sendErrorToRes: function(res,msg,code,nolog){
		if(!nolog) console.log(msg);
		code = code || 8000;

		res.json({
			error: {
				code: code,
				msg: msg
			}
		});
	},

	sendHintToSocket: function(socket,msg,nolog){
		if(!nolog) console.log(msg);

		socket.emit('hint',{
			hint: {
				msg: msg
			}
		});
	},

	sendErrorToSocket: function(socket,msg,code,nolog){
		if(!nolog) console.log(msg);
		code = code || 8000;

		socket.emit('error',{
			error: {
				code: code,
				msg: msg
			}
		});
	},

	sendErrorToSocketCb: function(fn,msg,code,nolog){
		if(!nolog) console.log(msg);
		code = code || 8000;

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
		else lunchHelper.sendErrorToSocket(socket, 'Not logged in!', 666);
	},

	isAdmin: function(socket, onSuccess){
		if(socket.handshake.user.logged_in && socket.handshake.user.role === 'admin') onSuccess(socket.handshake.user);
		else lunchHelper.sendErrorToSocket(socket, 'Admin rights missing', 403);
	},

	isOwner: function(socket, uid, onSuccess){
		if(socket.handshake.user.logged_in && socket.handshake.user._id == uid) onSuccess(socket.handshake.user);
		else lunchHelper.sendErrorToSocket(socket, 'Owner rights missing', 403);
	},

	isOwnerOrAdmin: function(socket, uid, onSuccess){
		if(socket.handshake.user.logged_in && (socket.handshake.user.role === 'admin' || socket.handshake.user._id == uid)) onSuccess(socket.handshake.user);
		else lunchHelper.sendErrorToSocket(socket, 'Admin or Owner rights missing', 403);
	}

}







/*
 * Session store setup
 */

var mongoStore = new MongoStore({
	host: config.mongodb.host,
	port: config.mongodb.port,
	db: config.mongodb.db
	// stringify: true
});






/*
 * io config
 */

io.set('authorization', passportSocketIo.authorize({
	passport: 	 passport,
	cookieParser: express.cookieParser,
	key:         config.cookie.key,
	secret:      config.cookie.secret,
	store:       mongoStore
	//success:     onAuthorizeSuccess,
	//fail:        onAuthorizeFail
}));
io.set('log level', 1);
//socket.handshake.user
// This property is always available from inside a io.on('connection') handler.







/*
 * Express setup
 */


// www to non www redirect 

var wwwRedirect = function(req, res, next) {
	if (req.headers.host.slice(0, 4) === 'www.') {
		var newHost = req.headers.host.slice(4);
		return res.redirect(req.protocol + '://' + newHost + req.originalUrl);
	}
	next();
};

app.set('trust proxy', true);
app.use(wwwRedirect);


// app setup

app.use( express.cookieParser() );
app.use( express.bodyParser() );
app.use( express.session({
	store: mongoStore,
	secret: config.cookie.secret,
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
	return done(null,user._id);
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
				console.log('pass:      '+pass);
				console.log('user.pass: '+user.pass);
				return done( null, false, {message:'Incorrect password.'} );
			}
			console.log('user authenticated: ' + user.nick + ' (' + mail + ')');

			if(user.inactive === false){
				return done(null, user);
			}else{
				userProvider.updateNoti(user._id.toString(), {
					remind: true,
					overv: true,
					cmts: true
				}, function(result){
					userProvider.setActive(user._id.toString(), false,
					function(result){
						return done(null, user);
					},
					function(error){
						done(error);
					});
				}, function(error){
					done(error);
				});
			}
		},function(error){
			console.log(error);
			return done(error);
		});
	}
));








/*
 * CronTasks
 */

lunchTasks = {

	cleanCheckins: function(){
		console.log('LunchTask: cleaning at '+(new Date().toString()));
		venueProvider.dailyReset(function(venueUpdates){
			notificationProvider.delAll('checkin',function(notiUpdates){
				notificationProvider.delAll('comment',function(notiUpdates){
					console.log('LunchTask: cleaning -- done');
				}, function(error){
					console.log(error);
				});
			}, function(error){
				console.log(error);
			});
		}, function(error){
			console.log(error);
			// consider sending an email to admins.
		});
	},

	sendReminder: function(){
		console.log('LunchTask: send reminders at '+(new Date().toString()));

		checkinProvider.aggregateUserIdsFromToday(function(userIds){
			userProvider.findUsersForReminder(userIds,function(users){
				
				// Wir haben die user. aber was senden wir Ihnen?
				// Haben wir ein neues Venues, das kürzlich eingetragen wurden?
				venueProvider.findUnfeatured(function(venue){
					if(venue != null){
						console.log('found unfeatured');
						console.log(venue);

						mailer.sendMail(
							'mail.reminder.new',
							'A New Venue on Lunchpad!',
							{
								venue: venue
							},users);
					}else{
						var aggrRetries = 0;

						var tryAggr = function(){
							if(aggrRetries < 10){
								aggrRetries++;

								console.log('rolling the dice!');
								// Jetzt würfeln. Was wird es heute sein.
								// Rising, all time Favourite, weekday favourite?
								var dice = Math.floor(Math.random()*3);
								//var dice = 2;
								switch(dice){
									case 0:
										sendAllTimeFav();
										break;
									case 1:
										sendWdFav();
										break;
									case 2:
										sendRising();
										break;
								}
							}
							
						};

						var sendAllTimeFav = function(){
							// send all time favourite
							checkinProvider.aggrAllFavVid(function(venueStats){
								venueProvider.findVenue(venueStats._id, function(venue){

									if(venue.deleted === true){
										tryAgrr();
										return;
									}

									console.log('sending all time fav');
									console.log(venue);
									
									mailer.sendMail(
										'mail.reminder.top',
										'Lunchpad / Your Colleagues Love this Venue!',
										{
											venue: venue
										},users);
									
								}, function(error){
									console.log(error);
									tryAggr();
								});										
							}, function(error){
								console.log(error);
								tryAggr();
							});
						};

						var sendWdFav = function(){
							// send weekday favourite
							checkinProvider.aggrWdFavVid(function(venueStats){
								venueProvider.findVenue(venueStats._id, function(venue){

									if(venue.deleted === true){
										tryAgrr();
										return;
									}

									console.log('sending weekday time fav');
									console.log(venue);
									
									mailer.sendMail(
										'mail.reminder.weekday',
										'Lunchpad / Got Plans for Lunch Today?',
										{
											venue: venue
										},users);
									
								}, function(error){
									console.log(error);
									tryAggr();
								});
							}, function(error){
								console.log(error);
								tryAggr();
							});
						};

						var sendRising = function(){
							// send rising venue
							checkinProvider.aggrRisingVid(function(venueStats){
								venueProvider.findVenue(venueStats.vid, function(venue){

									if(venue.deleted === true){
										tryAgrr();
										return;
									}

									console.log('sending rising');
									console.log(venue);
									
									mailer.sendMail(
										'mail.reminder.rising',
										'Lunchpad / The New Hot Spot for Lunch!',
										{
											venue: venue
										},users);
									
								}, function(error){
									console.log(error);
									tryAggr();
								});
							}, function(error){
								console.log(error);
								tryAggr();
							});
						};

						tryAggr();
					}
				}, function(error){
					console.log(error);
				});
			},function(error){
				console.log(error);
			});
		},function(error){
			console.log(error);
		});
	},

	sendOverview: function(){
		console.log('LunchTask: send overview at '+(new Date().toString()));

		// Hier machen wir es ander herum, um uns gegebenenfalls eine Abfrage zu sparen:
		// erst Notifications cheacken, dann User sammeln.

		notificationProvider.countLt15min('checkin', function(count){
			if(count > 0){

				notificationProvider.aggrTargets('checkin',function(targets){
					//console.log(targets);
					//var util = require('util');
					//console.log(util.inspect(targets, {showHidden: false, depth: null}));
					var i;
					for(i=0; i<targets.length; i++){
						mailer.sendMail(
							'mail.overview',
							'Lunchpad / New Checkins!',
							{
								venues: targets[i].venues
							},
							[targets[i]._id.target]
						);
					}
					notificationProvider.delAll('checkin',function(numRemoved){
						console.log('all notifications for checkins removed');
					},function(error){
						console.log(error);
					});
				},function(error){
					console.log(error);
				});

			}else{
				console.log('nothing older than 15 minutes, aboarding overview');
			}
		},function(error){
			console.log(error);
		});
	},

	sendComments: function(){
		console.log('LunchTask: send comments at '+(new Date().toString()));

		// Hier machen wir es ander herum, um uns gegebenenfalls eine Abfrage zu sparen:
		// erst Notifications cheacken, dann User sammeln.

		notificationProvider.countLt5min('comment', function(count){
			if(count > 0){

				notificationProvider.aggrTargets('comment',function(targets){
					//console.log(targets);
					//var util = require('util');
					//console.log(util.inspect(targets, {showHidden: false, depth: null}));
					var i;
					for(i=0; i<targets.length; i++){
						mailer.sendMail(
							'mail.comments',
							'Lunchpad / New Comments at Your Venues!',
							{
								venues: targets[i].venues
							},
							[targets[i]._id.target]
						);
					}
					notificationProvider.delAll('comment',function(numRemoved){
						console.log('all notifications for comments removed');
					},function(error){
						console.log(error);
					});
				},function(error){
					console.log(error);
				});

			}else{
				console.log('nothing older than 5 minutes, aboarding comments');
			}
		},function(error){
			console.log(error);
		});
	}

};

cronTasks.setupTasks([
	{
		time: '00 00 00 * * 0-6',
		fn: lunchTasks.cleanCheckins
	},
	{
		time: '00 30 10 * * 1-5',
		fn: lunchTasks.sendReminder
	},
	{
		time: '00 */5 9-18 * * 1-5',
		fn: lunchTasks.sendOverview
	},
	{
		time: '00 */2 9-18 * * 1-5',
		fn: lunchTasks.sendComments
	}
]);













/*
 * Express Routes
 */


// Pages. Just get, no data.

app.get('/', function(req,res){
	if(req.isAuthenticated()){
		lunchHelper.sendHtml('page.app.angular.html')(req,res);
	}else{
		res.redirect('/login');
	}
});
app.get('/login', function(req,res){
	if(req.isAuthenticated()){
		res.redirect('/');
	}else{
		lunchHelper.sendHtml('page.login.html')(req,res);
	}
});
//app.get('/logout', lunchHelper.sendHtml('page.logout.html'));
app.get('/logout', function(req,res){
	req.logout();
	//res.json({ error: null });
	res.redirect('/login#hint=loggedout');
});
app.get('/manifesto', lunchHelper.sendHtml('page.manifesto.html'));


// Action-Requests not send via socket (login / logout via passport)

app.post('/auth/login', passport.authenticate('local-login'), function(req,res){
	if(req.isAuthenticated()){
		// res.json({ error: null });
		res.redirect('/');
	}else{
		// sendErrorToRes(res,'Login failed.')();
		res.redirect('/login#error=403');
	}
});

app.post('/auth/logout', function(req,res){
	req.logout();
	//res.json({ error: null });
	res.redirect('/login#hint=loggedout');
});







/*
 * Temporary routes for testing
 */

app.get('/createFirstAdmin',function(req,res){

	userProvider.findUserByMail('mr@19h13.com',
	function(result){
		res.send('First user already exists');
	},function(error){
		userProvider.save([{
			mail: 'mr@19h13.com',
			nick: 'tester',
			role: 'admin',
			pass: 'testlogin',
			ava: 'http://lunchpad.co/static/img/mr.png'
		}],function(results){
			res.send('First user created');
		},function(error){
			sendErrorToRes(res,error,666,false);
		});
	});
});

/*
app.get('/createTestVenues',function(req,res){
	venueProvider.save([{
		name: 'Trololo',
		url: 'www.lol.com',
		createdBy: 'me'
	},{
		name: 'Büro',
		url: 'www.bureau.com',
		createdBy: 'you'
	},{
		name: 'Scheidegger',
		url: 'www.bureau.com',
		createdBy: 'you'
	},{
		name: 'Grenzstein',
		url: 'www.bureau.com',
		createdBy: 'you'
	},{
		name: 'Ingress',
		url: 'www.bureau.com',
		createdBy: 'you'
	},{
		name: 'Fleischboutique',
		url: 'www.bureau.com',
		createdBy: 'you'
	}],function(results){
		res.send('testvenues created');
	},function(error){
		lunchHelper.sendErrorToRes(res,error,666,false);
	});
});
*/
/*
app.get('/sendreminder', function(req,res){
	lunchTasks.sendReminder();
	res.send('reminders sent');
});

app.get('/sendoverview', function(req,res){
	lunchTasks.sendOverview();
	res.send('overview sent');
});

app.get('/sendcomments', function(req,res){
	lunchTasks.sendComments();
	res.send('comments sent');
});

app.get('/cleancheckins', function(req,res){
	lunchTasks.cleanCheckins();
	res.send('checkins cleared');
});
*/
/*
app.get('/addtestitems', function(req,res){
	itemProvider.saveItems({
		name: 'party hat',
		url: 'http://lunchpad.19h13.com/static/img/item-party.png',
		type: 'hat',
		front: true
	},{
		name: 'the mask',
		url: 'http://lunchpad.19h13.com/static/img/item-halloween.png',
		type: 'mask',
		front: true
	},function(results){
		res.send('testitem created');
	},function(error){
		lunchHelper.sendErrorToRes(res,error,666,false);
	});
});

app.get('/addtestitemstousers', function(req,res){
	itemProvider.saveItems({
		name: 'party hat',
		url: 'http://lunchpad.19h13.com/static/img/item-party.png',
		type: 'hat',
		front: true
	},{
		name: 'the mask',
		url: 'http://lunchpad.19h13.com/static/img/item-halloween.png',
		type: 'mask',
		front: true
	},function(results){
		res.send('testitem created');
	},function(error){
		lunchHelper.sendErrorToRes(res,error,666,false);
	});
});
*/


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
				lunchHelper.sendErrorToSocketCb(cb,error);
			});
		});
	});


	socket.on('venue read one', function(data,cb){
		lunchAuth.isUser(socket, function(user){

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'venue.id')
			.e()){
				lunchHelper.sendErrorToSocketCb(cb,e);
				return null;
			}

			venueProvider.findVenue(data._id,
			function(venue){

				cb({
					error: null,
					venue: venue
				});

			},function(error){
				lunchHelper.sendErrorToSocketCb(cb,error);
			});
		});
	});


	socket.on('venue create', function(data){
		lunchAuth.isUser(socket, function(user){

			data.name = Validate.s('escape',[data.name]);

			var e;
			if(e = new Validate()
			.v('isLength',[data.name,2,100],'venue.name.length')
			.v('isURL',[data.url,{require_protocol: true}],'venue.url')
			//.v('isLength',[data.createdBy,24,24],'venue.id')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
				return null;
			}

			venueProvider.save({
				name: data.name,
				url: data.url,
				createdBy: user._id
			},function(result){

				io.sockets.emit('venue create done',{
					venue: {
						name: data.name
					}
				});

			},function(error){
				lunchHelper.sendErrorToSocket(socket,error);
			});
		});
	});


	socket.on('venue update name', function(data){
		lunchAuth.isAdmin(socket, function(user){

			data.name = Validate.s('escape',[data.name]);

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'venue.id')
			.v('isLength',[data.name,2,100],'venue.name.length')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
				return null;
			}

			venueProvider.updateName(data._id, data.name,
			function(updated){

				io.sockets.emit('venue name update done',{
					venue: updated
				});

			},function(error){
				lunchHelper.sendErrorToSocket(socket,error);
			});
		});
	});


	socket.on('venue update url', function(data){
		lunchAuth.isUser(socket, function(user){

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'venue.id')
			.v('isURL',[data.url,{require_protocol: true}],'venue.url')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
				return null;
			}

			venueProvider.updateUrl(data._id, data.url,
			function(updated){

				io.sockets.emit('venue url update done',{
					venue: updated
				});

			},function(error){
				lunchHelper.sendErrorToSocket(socket,error);
			});

		});
	});


	socket.on('venue delete', function(data){
		lunchAuth.isAdmin(socket, function(user){

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'venue.id')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
				return null;
			}

			venueProvider.deleteVenue(data._id,
			function(removed){

				io.sockets.emit('venue delete done',{
					removed: removed
				});

			},function(error){
				lunchHelper.sendErrorToSocket(socket,error);
			});
		});
	});




	// Checking

	socket.on('checkin create', function(data){
		lunchAuth.isUser(socket, function(user){

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'checkin.id')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
				return null;
			}

			// have to reload user in order to get new item
			userProvider.findUser(user._id.toString(),
			function(user){
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
								//console.log('emitting checkin create done')
								io.sockets.emit('checkin create done',{
									vid: data._id,
									user: insert
								});

								// queue notification
								venueProvider.findVenue(data._id, function(venue){

									// notificationProvider.saveAndDel({
									// 	uid: user._id,
									// 	unick: user.nick,
									// 	uava: user.ava,
									// 	vid: venue._id,
									// 	vname: venue.name
									// }, function(noti){
									// 	console.log('notification saved');
									// }, function(error){
									// 	lunchHelper.sendErrorToSocket(socket,error);
									// })

									userProvider.findUsersForOverview([
										user._id
									],function(targets){
										notificationProvider.saveAndDelWithTypeAndUser({
											type: 'checkin',
											venue: venue,
											user: user
										},targets,function(numInserted){
											//console.log('Checkin Notification Insert erfolgreich');
										},function(error){
											lunchHelper.sendErrorToSocket(socket,error);
										});
									},function(error){
										lunchHelper.sendErrorToSocket(socket,error);
									});
								}, function(error){
									lunchHelper.sendErrorToSocket(socket,error);
								});
							},function(error){
								lunchHelper.sendErrorToSocket(socket,error);
							});
						},function(error){
							lunchHelper.sendErrorToSocket(socket,error);
						});
					},function(error){
						lunchHelper.sendErrorToSocket(socket,error);
					});
				},function(error){
					lunchHelper.sendErrorToSocket(socket,error);
				});
			},function(error){
				lunchHelper.sendErrorToSocket(socket,error);
			});			
		});
	});

	socket.on('checkin delete', function(data){
		lunchAuth.isUser(socket, function(user){
			checkinProvider.delTodayForUid(user._id,
			function(numRemoved){
				venueProvider.delUserForToday(user._id,
				function(numRemoved){

					io.sockets.emit('checkin delete done',{
						user: {
							_id: user._id
						}
					});

					// notificationProvider.delWithUid(user._id, function(notiRemoved){
					// 	console.log('notifications for user removed');
					// }, function(error){
					// 	lunchHelper.sendErrorToSocket(socket,error);
					// });

					notificationProvider.delWithTypeAndUser('checkin',user._id,function(numRemoved){
						//console.log('Checkin Notifications removed for: '+user.nick);
					},function(error){
						lunchHelper.sendErrorToSocket(socket,error);
					})
				},function(error){
					lunchHelper.sendErrorToSocket(socket,error);
				});
			},function(error){
				lunchHelper.sendErrorToSocket(socket,error);
			});
		});
	});




	// Comment

	socket.on('comment read list', function(data,cb){
		lunchAuth.isUser(socket, function(user){

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'venue.id')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
				return null;
			}

			commentProvider.findWithVenue(data._id,
			function(comments){
				//console.log('comments found');
				cb({
					error: null,
					comments: comments
				});

			},function(error){
				lunchHelper.sendErrorToSocketCb(cb,error);
			});
		});
	});

	socket.on('comment create', function(data){
		lunchAuth.isUser(socket, function(user){

			data.txt = Validate.s('escape',[data.txt]);

			var e;
			if(e = new Validate()
			.v('isLength',[data.vid,24,24],'venue.id')
			//.v('isLength',[data.name,1,140],'comment.txt.length')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
				return null;
			}

			var insert = {
				vid: data.vid,
				txt: data.txt,
				user: {
					_id: user._id,
					nick: user.nick,
					ava: user.ava
				}
			};

			commentProvider.saveComment(insert,
			function(comment){
				commentProvider.countWithVenue(data.vid,
				function(count){
					venueProvider.updateCommentCount(data.vid,count,
					function(venue){

						io.sockets.emit('comment create done',{
							count: count,
							comment: comment[0]
						});

						// enter notification

						// get all relevant users
						checkinProvider.aggrUserIdsForVenueFromToday(data.vid,
						function(targetsFromCheckins){
							//console.log('targetsFromCheckins');
							//console.log(targetsFromCheckins);

							commentProvider.aggrUsersWithVenue(data.vid,
							function(targetsFromComments){
								//console.log('targetsFromComments');
								//console.log(targetsFromComments);

								var targets = targetsFromCheckins.concat(targetsFromComments);
								//console.log('targets');
								//console.log(targets);

								userProvider.findUsersForComments([user._id],targets,
								function(filteredTargets){
									//console.log('filteredTargets');
									//console.log(filteredTargets);

									user.comment = data.txt;
									if(filteredTargets.length > 0){
										notificationProvider.save({
											type: 'comment',
											venue: venue,
											user: user
										},filteredTargets,function(numInserted){
											//console.log('Comment Notification Insert erfolgreich');
										},function(error){
											lunchHelper.sendErrorToSocket(socket,error);
										});
									}else{
										//console.log('No Notification to insert.');
									}
								},function(error){
									lunchHelper.sendErrorToSocket(socket,error);
								});
							},function(error){
								lunchHelper.sendErrorToSocket(socket,error);
							});
						},function(error){
							lunchHelper.sendErrorToSocket(socket,error);
						});
					},function(error){
						lunchHelper.sendErrorToSocket(socket,error);
					});
				},function(error){
					lunchHelper.sendErrorToSocket(socket,error);
				});
			},function(error){
				lunchHelper.sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('comment delete', function(data){
		lunchAuth.isOwnerOrAdmin(socket, data._id, function(user){

			var e;
			if(e = new Validate()
			.v('inLength',[data._id,24,24],'comment.id')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
				return null;
			}

			commentProvider.deleteComment( data._id,
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
						lunchHelper.sendErrorToSocket(socket,error);
					});
				},function(error){
					lunchHelper.sendErrorToSocket(socket,error);
				});
			},function(error){
				lunchHelper.sendErrorToSocket(socket,error);
			});
		});
	});






	// User

	socket.on('user create', function(data){
		lunchAuth.isAdmin(socket, function(user){

			data.nick = Validate.s('escape',[data.nick]);

			var e;
			if(e = new Validate()
			.v('isEmail',[data.mail],'user.mail')
			.v('isAlphanumeric',[data.nick],'user.nick.alphanumeric')
			.v('isLength',[data.nick,3,15],'user.nick.length')
			.v('isIn',[data.role,['user','admin']],'user.role')
			.v('isLength',[data.pass,5],'user.pass')
			.v('isURL',[data.ava,{require_protocol: true}],'user.ava')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
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
				lunchHelper.sendErrorToSocket(socket,error);
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
				lunchHelper.sendErrorToSocketCb(cb,error);
			});
		});
	});

	socket.on('user read own id', function(data,cb){
		lunchAuth.isUser(socket, function(user){

			cb({
				error: null,
				user:{
					_id: user._id
				}
			});

		});
	})

	socket.on('user read one', function(data,cb){
		lunchAuth.isOwnerOrAdmin(socket, data._id, function(user){

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'user.id')
			.e()){
				lunchHelper.sendErrorToSocketCb(cb,e);
				return null;
			}

			userProvider.findUser( data._id,
			function(result){
				result.pass = null;

				cb({
					error: null,
					user: result
				});

			},function(error){
				lunchHelper.sendErrorToSocketCb(cb,error);
			});
		});
	});

	socket.on('user update password', function(data){
		lunchAuth.isOwnerOrAdmin(socket, data._id, function(user){

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'user.id')
			.v('isLength',[data.pass,5],'user.pass')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
				return null;
			}

			// TODO: check if old pass is matching

			userProvider.updatePass( data._id, data.pass,
			function(updates){

				socket.emit('user update password done',{
					updated: true
				});

			},function(error){
				lunchHelper.sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('user update notifications', function(data){
		lunchAuth.isOwner(socket, data._id, function(user){

			data.remind = Validate.s('toBoolean',[data.remind,true]);
			data.overv = Validate.s('toBoolean',[data.overv,true]);
			data.cmts = Validate.s('toBoolean', [data.cmts,true]);	

			userProvider.updateNoti( data._id, {
				remind: data.remind,
				overv: data.overv,
				cmts: data.cmts
			},
			function(results){

				socket.emit('user update notifications done',{
					updated: true
				});

			},function(error){
				lunchHelper.sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('user update activeitem', function(data){
		lunchAuth.isOwner(socket, data._id, function(user){
			
			var e;
			if(e = new Validate()
			.v('isLength',[data.itemId,24,24],'user.id')
			.e()){
				//lunchHelper.sendErrorToSocket(socket,e);
				//return null;

				// don't return error, delete item instead!
				data.itemId = null;
			}

			// -------------
			//	Currently, there is nothing to prevent users to set items active, which are not in there inventory.
			//  TODO: Add check, if item is indeed in the invetory of the user.
			// -------------
			if(data.itemId){
				itemProvider.findItem(data.itemId,
				function(item){
					userProvider.updateActiveItem( user._id, item,
					function(results){

						socket.emit('user update activeitem done',{
							item: item
						});

					},function(error){
						lunchHelper.sendErrorToSocket(socket,error);
					});
				},function(error){
					lunchHelper.sendErrorToSocket(socket,error);
				});
			}else{
				userProvider.updateActiveItem( user._id, null,
				function(results){

					socket.emit('user update activeitem done',{
						item: null
					});

				},function(error){
					lunchHelper.sendErrorToSocket(socket,error);
				});
			}
		});
	});

	socket.on('user update inventory', function(data){
		lunchAuth.isAdmin(socket, function(user){

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'user.id')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
				return null;
			}

			if( !Array.isArray(data.inv) ){
				lunchHelper.sendErrorToSocket(socket,new Validate().msgs['user.inv']);
				return null;
			}

			userProvider.updateInventoryById( data._id, data.inv,
			function(results){

				// socket.emit('user update inventory done',{
				// 	updated: true
				// });
				lunchHelper.sendHintToSocket(socket,'Inventory updated!');

			},function(error){
				lunchHelper.sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('user delete', function(data){
		lunchAuth.isAdmin(socket, function(user){

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'user.id')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
			}

			userProvider.deleteUser( data._id,
			function(results){

				socket.emit('user delete done',{
					_id: data._id
				});

			},function(error){
				lunchHelper.sendErrorToSocket(socket,error);
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

			data.front = Validate.s('toBoolean',[data.front, true]);

			var e;
			if(e = new Validate()
			.v('isLength',[data.name,2,20],'user.nick.length')
			.v('isLength',[data.type,2,20],'user.nick.length')
			.v('isURL',[data.url,{require_protocol: true}],'user.ava')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
				return null;
			}

			itemProvider.saveItems({
				name: data.name,
				url: data.url,
				type: data.type,
				front: data.front
			},function(results){

				// socket.emit('item create done',{
				// 	results: results
				// });
				lunchHelper.sendHintToSocket(socket,'Item created!');

			},function(error){
				lunchHelper.sendErrorToSocket(socket,error);
			});
		});
	});

	socket.on('item read one', function(data,cb){
		lunchAuth.isUser(socket, function(user){

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'item.id')
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
				lunchHelper.sendErrorToSocketCb(cb,error);
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
				lunchHelper.sendErrorToSocketCb(cb,error);
			});
		});
	});

	socket.on('item read list', function(data,cb){
		lunchAuth.isAdmin(socket, function(user){
			itemProvider.findAll(function(results){

				cb({
					error: null,
					items: results
				});

			},function(error){
				lunchHelper.sendErrorToSocketCb(cb,error);
			});
		});
	});

	socket.on('item delete', function(data){
		lunchAuth.isAdmin(socket, function(user){

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'item.id')
			.e()){
				lunchHelper.sendErrorToSocketCb(cb,e);
				return null;
			}

			userProvider.removeItemFromInventories( data._id,
			function(updates){
				itemProvider.deleteItem( data._id,
				function(results){

					// socket.emit('item delete done',{
					// 	_id: data._id
					// });

					lunchHelper.sendHintToSocket(socket,'Item deleted!');

				},function(error){
					lunchHelper.sendErrorToSocket(socket,error);
				});
			},function(error){
				lunchHelper.sendErrorToSocket(socket,error);
			});
		});
	});




	// Notifications

	socket.on('notification delete venue', function(data){
		lunchAuth.isOwnerOrAdmin(socket, data._id, function(user){

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'item.id')
			.v('isLength',[data.venueId,24,24],'item.id')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
				return null;
			}

			notificationProvider.delWithTargetAndVenue( data._id, data.venueId, undefined,
			function(numRemoved){

				// DEBUG!
				//console.log("all notifications for one venue removed!");

			},function(error){
				lunchHelper.sendErrorToSocket(socket, error);
			});

		});
	});

	socket.on('notification delete all', function(data){
		lunchAuth.isOwnerOrAdmin(socket, data._id, function(user){

			var e;
			if(e = new Validate()
			.v('isLength',[data._id,24,24],'item.id')
			.e()){
				lunchHelper.sendErrorToSocket(socket,e);
				return null;
			}

			notificationProvider.delWithTargetAndVenue( data._id, undefined, 'checkin',
			function(numRemoved){

				// DEBUG!
				//console.log("checkin notifications for all venues removed!");

			},function(error){
				lunchHelper.sendErrorToSocket(socket, error);
			});

		});
	});


	socket.on('disconnect', function(){
	});



});







var initListenTimeout,
	initListenTimeoutCount = 0;
var initListen = function(){
	if(initListenTimeout){
		clearTimeout(initListenTimeout);
	}
	console.log('trying to start server');
	if(initListenTimeoutCount < 5){
		initListenTimeoutCount++;
		try{
			server.listen(1986,function(){
				console.log('listening on 1986');
			});
		}catch(e){
			console.log('Server start failed, starting again in 1000');
			console.log('Fail count: '+initListenTimeoutCount);
			initListenTimeout = setTimeout(initListen,1000);
		}
	}
};

initListen();