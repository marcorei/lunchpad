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


// callback( err,user )

function getUser( username, callback ){

	connection.query("SELECT * FROM  `users` WHERE  `email` = '" + username + "' LIMIT 0 , 1",
		function( err, rows ) {

			//console.log('getting user: ' + username);

			var user = {};

			if( !err ){

				//console.log('found user: ' + username);

				user.id = rows[0].id;
				user.username = rows[0].email;
				user.password = rows[0].password;
				user.notify = rows[0].notify;
				user.image = rows[0].image;

			}

			//console.log('calling callback: ' + callback);

			callback( err, user );

		}
	);

}


// callback( err, count )
function checkUserExists( username, callback ){

	connection.query("SELECT count(*) AS `numusers` FROM  `users` WHERE  `email` = '" + username + "'",
		function( err, rows ) {

			callback( err, rows[0].numusers );

		}
	);

}


function createUser( username, passwort, image ){

	console.log("host: " + config.mysql.host);

	// Insert User into db
	connection.query("INSERT INTO `project130820db`.`users` (`id`, `email`, `password`, `notify`, `image`) VALUES (NULL, '" + 
		username + 
		"', '" + 
		passwordHash.generate( passwort ) +
		"', '0', '" +
		image +
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










/*
 * App
 */

 var app = express();


// Static content

app.use('/static', express.static(__dirname + '/../static'));



// passport fixes

passport.serializeUser(function(user, done) {
	done(null, user.username);
});

passport.deserializeUser(function(username, done) {
	getUser( username, function (err, user) {
		done(err, user);
	}); 

	//User.findOne(id, function (err, user) {
	//	done(err, user);
	//});
});


// passport setup

app.use( express.cookieParser() );
app.use( express.bodyParser() );
app.use( express.session({ secret: 'Juergen', maxAge: 360*5 }) );
app.use( passport.initialize() );
app.use( passport.session() );

passport.use( new LocalStrategy(

	function( username, password, done ){

		console.log('starting auth strategie for user: ' + username);

		// query for user in db
		getUser( username, function( err, user ){

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

/* ONLY FOR REGISTRATION IT SEEMS
function authUserExist( req, res, next ) {

	

	checkUserExists( req.body.username, function( err, count){

		if( count == 0) {
			next();
		}else{
			res.redirect('/signup');
		}

	});

}
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


/*
app.get( '/', 
	passport.authenticate('local'), 
	function(req, res){

		var file = '../templates/page.app.html';
		res.sendfile( path.join( __dirname, file ) );

	});

*/










/*
 * L(a)unch it!
 */

app.listen(1924);






/*
 * Admin stuff
 */

// adminCreateUser( "mr@19h13.com", "markuslogin", "mr.png" );









