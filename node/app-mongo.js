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
	passwordHash = require('password-hash'),

	Validator = require('validator').Validator,

	nodemailer = require('nodemailer'),

	VenueProvider = require('./venueprovider-mongo.js').VenueProvider,
	UserProvider = require('./userprovider-mongo.js').UserProvider,
	ItemProvider = require('./itemprovider-mongo.js').ItemProvider,

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
	sendFile = function(fileName){
		return function(req, res){
			res.sendFile( path.join( __dirname, fileName ));
		}
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

passport.deserializeUser(function(_id, done) {
	//( _id, function (err, user) {
		//done(err, user);
	//}); 

	// Find Mongo User
});



// Strategies etc

passport.use('local-login', new LocalStrategy(
	function( username, password, done ){
		console.log('starting auth strategie for user: ' + username);

		// query for user in db
		// needs to be ajusted to userprovider

		/*
		getUserByName( username, function( err, user ){

			if( err ){ 
				console.log( err );
				return done( err ); 
			}
			if( !user ){ 
				console.log('user not found: ' + username);
				return done( null, false, {message:'Incorrect username.'} ); 
			}
			if( !passwordHash.verify( password, user.password ) ){ 
				console.log('password did not match for user: ' + username);
				return done( null, false, {message:'Incorrect password.'} ); 
			}

			console.log('user authenticated: ' + user.username);
			return done( null, user );

		});
*/
	}
));



// Auth Helper
// probably do this inside a provider, zb userProvider.isAdmin(uid, callback)
/*
var lunchAuth = {

	requireUser = function(){
		
	},

	requireGroup = function(groupId){
		
	},

	requireOwnerOrAdmin = function(owner_id){

	}

};
*/














/*
 * Express Routes
 */


// Define details to change in one place

var lunchPages = {
	root: { 
		route: '/',
		tmpl: 'page.app.angular.html'
	}
	login: {
		route: '/login',
		tmpl: 'page.login.html'
	},
	manifesto: {
		route: '/manifesto',
		tmpl: 'page.manifesto.html'
	},



	viewVenuelist: {
		route: '/view/venuelist',
		tmpl: 'view.venuelist.html'
	},
	viewVenueDetail: {
		route: '/view/venuedetail',
		tmpl: 'view.venuedetail.html'
	},
	viewNewVenue: {
		route: '/view/newvenue',
		tmpl: 'view.newvenue.html'
	},
	viewSettings: {
		route: '/view/settings',
		tmpl: 'view.settings.html'
	}
}


var lunchActions = {
	login: '/action/login',
	logout: '/action/logout'
}



// Pages. Just get, no data.

app.get( lunchPages.root.route, 		lunchHelper.sendFile( lunchPages.root.tmpl ) );
app.get( lunchPages.login.route,		lunchHelper.sendFile( lunchPages.login.tmpl ) );
app.get( lunchPages.manifesto.route,	lunchHelper.sendFile( lunchPages.manifesto.tmpl ) );

app.get( lunchPages.viewVenuelist.route, 	lunchHelper.sendFile( lunchPages.viewVenuelist.tmpl ) );
app.get( lunchPages.viewVenueDetail.route, 	lunchHelper.sendFile( lunchPages.viewVenueDetail.tmpl ) );
app.get( lunchPages.viewNewVenue.route,		lunchHelper.sendFile( lunchPages.viewNewVenue.tmpl ) );
app.get( lunchPages.viewSettings.route,		lunchHelper.sendFile( lunchPages.viewSettings.tmpl ) );



// Action-Requests not send via socket (login / logout via passport)

app.post( lunchActions.login, passport.authenticate('local-login'), function(req,res){
	if(req.isAuthenticated())
		res.json({ error: null });
	else
		res.json({ error:{msg:'login failed'} });
});

app.post( lunchActions.logout, function(req,res){
	req.logout();
	res.json({ error: null });
});








/*
 * Socket.io "Routes"
 */











