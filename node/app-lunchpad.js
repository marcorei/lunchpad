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

	sendErrorToSocket: function(socket,msg,code,nolog){
		if(!nolog) console.log(msg);
		code = code || 8000;

		socket.emit('error',{
			code: code,
			msg: msg
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
		else sendErrorToSocket('Not logged in!', 666);
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
			return done(null, user);

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
		console.log('LunchTask: cleaning');
		venueProvider.dailyReset(function(venueUpdates){
			console.log('LunchTask: cleaning -- done');
		}, function(error){
			console.log(error);
			// consider sending an email to admins.
		});
	},

	sendRemindes: function(){
		console.log('LunchTask: send reminders');
		venueProvider.findUnfeatured(function(venue){
			console.log('found unfeatured');
			console.log(venue);
		}, function(error){
			console.log(error);
		});
	},

	sendOverview: function(){
		console.log('LunchTask: send overview');
	}

};

cronTasks.setupTasks([
	{
		time: '00 00 00 * * 1-7',
		fn: lunchTasks.cleanCheckins
	},
	{
		time: '00 00 11 * * 1-5',
		fn: lunchTasks.sendReminder
	},
	{
		time: '00 */5 9-18 * * 1-5',
		fn: lunchTasks.sendOverview
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

app.get('/createTestUser',function(req,res){
	userProvider.save([{
		mail: 'mr@19h13.com',
		nick: 'tester',
		role: 'admin',
		pass: 'testlogin',
		ava: 'http://lunchpad.19h13.com/static/img/mr.png'
	},{
		mail: 'jf@19h13.com',
		nick: 'alf',
		role: 'admin',
		pass: 'testlogin',
		ava: 'http://lunchpad.19h13.com/static/img/jf.png'
	},{
		mail: 'mrz@19h13.com',
		nick: 'MMRZ',
		role: 'admin',
		pass: 'testlogin',
		ava: 'http://lunchpad.19h13.com/static/img/mrz.png'
	}],function(results){
		res.send('testuser created');
	},function(error){
		sendErrorToRes(res,error,666,false);
	});
});

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
		sendErrorToRes(res,error,666,false);
	});
});

app.get('/sendreminder', function(req,res){
	lunchTasks.sendReminder();
});

app.get('/sendoverview', function(req,res){
	lunchTasks.sendOverview();
});

app.get('/cleancheckins', function(req,res){
	lunchTasks.cleanCheckins();
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
			.v('isURL',[data.url,{require_protocol: true}],'venue.url')
			.v('isLength',[data.createdBy,24,24],'venue.id')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}

			venueProvider.save({
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
			.v('isURL',[data.url,{require_protocol: true}],'venue.url')
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
			.v('isLength',[data._id,24,24],'checkin.id')
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
							console.log('emitting checkin create done')
							io.sockets.emit('checkin create done',{
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

					io.sockets.emit('checkin delete done',{
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
			.v('isLength',[data._id,24,24],'venue.id')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}

			commentProvider.findWithVenue(data._id,
			function(comments){
				console.log('comments found');
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
				sendErrorToSocket(socket,e);
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
			if(e = new Validate()
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
			.v('inLength',[data._id,24,24],'user.id')
			.v('isLength',[data.pass,5],'user.pass')
			.e()){
				sendErrorToSocket(socket,e);
				return null;
			}

			// TODO: check if old pass is matching

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
			if(e = new Validate()
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
			if(e = new Validate()
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

			userProvider.removeItemFromInventories( data._id,
			function(updates){
				itemProvider.deleteItem( data._id,
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



server.listen(1986,function(){
	console.log('listening on 1986');
});
