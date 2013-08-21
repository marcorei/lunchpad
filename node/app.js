/*
 * Imports
 *
 * Put all your passwords in ./config.json
 */

var path = require('path');
	express = require('express'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	passwordHash = require('password-hash'),
	mysql = require('mysql'),
	config = require('./config.json');









/*
 * MySQL stuff
 */


var	connection = mysql.createConnection({
	host: 		config.mysql.host,
	user: 		config.mysql.user,
	database: 	config.mysql.database,
	password: 	config.mysql.password
});



function esc( str ){
	return connection.escape( str );
}

function escId( id ){
	return mysql.escapeId( id ;
}


// callback( err,user )
function getUserBySid( sid, callback ){

	connection.query("SELECT * FROM  `users` WHERE  `sid` = '" + esc(sid) + "' LIMIT 0 , 1",
		function( err, rows ) {

			composeUserObj( err, rows, callback );

		}
	);

}


// callback( err,user )
function getUserByName( username, callback ){

	connection.query("SELECT * FROM  `users` WHERE  `email` = '" + esc(username) + "' LIMIT 0 , 1",
		function( err, rows ) {

			composeUserObj( err, rows, callback );

		}
	);

}


function composeUserObj( err, rows, callback )
{
	//console.log('getting user: ' + username);

	var user = {};

	if( !err ){

		//console.log('found user: ' + username);

		user.id = rows[0].id;
		user.sid = rows[0].sid;
		user.username = rows[0].email;
		user.password = rows[0].password;
		user.notify = rows[0].notify;
		user.image = rows[0].image;

	}

	//console.log('calling callback: ' + callback);

	callback( err, user );
}


// callback( err, count )
function checkUserExists( username, callback ){

	connection.query("SELECT count(*) AS `numusers` FROM  `users` WHERE  `email` = '" + esc(username) + "'",
		function( err, rows ) {

			callback( err, rows[0].numusers );

		}
	);

}


function createUser( username, passwort, image ){

	console.log("host: " + config.mysql.host);

	// Insert User into db
	connection.query("INSERT INTO `project130820db`.`users` (`id`, `sid`, `email`, `password`, `notify`, `image`) VALUES (NULL, '" + 
		passwordHash.generate( username ) + 
		"', '" + 
		esc(username) + 
		"', '" + 
		passwordHash.generate( passwort ) +
		"', '0', '" +
		esc(image) +
		"')" ,

		function( err ) {

			if( err ) {
				console.log( err );
			}else{
				console.log( 'user created');
			}
			
		}
	);

}


// callback(err)
function changeUserNotify( username, notify, callback ){

	// Authentification is done.
	// So check if there is something to change and change it.

}



// callback(err,venue)
// @param venue object {name,url}
function createVenue( venue, callback ){

	// check if venue with that nam exists.

	// query etc

}


// callback(err,venues)
function getVenueList( callback ){

	// recursive checks that list all venues, corresponding users with images.

}









/*
 * App
 */

var app = express();


// app setup

app.use( express.cookieParser() );
app.use( express.bodyParser() );
app.use( express.session({ secret: 'Juergen', maxAge: 360*5 }) );
app.use( passport.initialize() );
app.use( passport.session() );


// Static content

app.use('/static', express.static(__dirname + '/../static'));












// passport fixes

passport.serializeUser(function(user, done) {
	done(null, user.sid);
});

passport.deserializeUser(function(sid, done) {
	getUserBySid( sid, function (err, user) {
		done(err, user);
	}); 
});


// passport setup

passport.use( new LocalStrategy(

	function( username, password, done ){

		console.log('starting auth strategie for user: ' + username);

		// query for user in db
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

	}

));

// passport helper

function requireAuth( req, res, next ){

    if( req.isAuthenticated() ){
        next();
    }else{
        res.redirect( '/login' );
    }

}

function requireAuthJSON( req, res, next ){

	if( req.isAuthenticated() ){
        next();
    }else{

    	var error = { error: "authentification required" }
        res.json(error);
    }

}











/*
 *
 * Routes
 *
 */





// login page

app.get( '/login', function(req, res){

	if( req.isAuthenticated() ){
		res.redirect( '/' );
	}else{

		var file = '../templates/page.login.html';
		res.sendfile( path.join( __dirname, file ) );

	}


});

app.post( '/login', 

	passport.authenticate( 'local' ),

	function(req, res){

		if( req.isAuthenticated() ){
			res.redirect( '/' );
		}else{
			var file = '../templates/page.login.html';
			res.sendfile( path.join( __dirname, file ) );
		}
		
	}
);


// logout

app.get( '/logout', function(req, res){

	req.logout();
	res.redirect('/login');

});














// Root

app.get( '/', function(req, res){

	requireAuth( req, res, function(){
		
		var file = '../templates/page.app.html';
		res.sendfile( path.join( __dirname, file ) );

	});

});


app.post( '/', function(req, res){

	requireAuth( req, res, function(){


		// MAKE VISIT ENTRIES AND STUFF
		
		var file = '../templates/page.app.html';
		res.sendfile( path.join( __dirname, file ) );

	});

});













// Put, Get Change stuff


// get venues

app.get( '/get/venues', function(req, res){

	requireAuthJSON( req, res, function(){
		
		getVenueList( function(err, venues){

			if(err){
				console.log(err);
				res.json({ error: "venue list could not be created."});
			}else{
				res.json({
					error: "",
					venues: venues
				});
			}
		});

	});

});


// post venue
// data: venuename, venueurl

app.post( '/post/venue', function(req, res){

	requireAuthJSON( req, res, function(){

		var v = {
			name: req.body.venuename,
			url: req.body.venueurl
		}
		createVenue( v, function(err,venue){

			if( err ){
				console.log(err);
				res.json({ error: "venue could not be created."});
			}else{
				res.json({
					error: "",
					venuename: venue.name
				});
			}

		});

	});

});


// change notification

app.post( '/post/notify', function(req, res){

	requireAuthJSON( req, res, function(){

		//req.body.notify
		//req.user.username

	});

});


// add / change visit

app.post( '/post/visit', function(req, res){

	requireAuthJSON( req, res, function(){

		//req.body.venueid

		//req.user.username

		//check if existing connection (on that date): change, or create.
		//function callback with (err)


		// SEND NOTIFICATIONS

	});

})


// 











/*
 * L(a)unch it!
 */

app.listen(1924);






/*
 * Admin stuff
 */

// adminCreateUser( "mr@19h13.com", "markuslogin", "mr.png" );









