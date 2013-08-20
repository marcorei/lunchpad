/*
 * Imports
 *
 * Put all your passwords in ./config.json
 */

var fs = require('fs');
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

			var user = {};

			if( !err ){

				user.username = rows[0].email;
				user.password = rows[0].password;
				user.notify = rows[0].notify;
				user.image = rows[0].image;

			}

			callback( err, user );

		}
	);

}

getUser( 'mr@19h13.com', function(){});


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



// Login

passport.use( new LocalStrategy(

	function( username, password, done ){

		// query for user in db
		getUser( username, function( err, user ){

			if( err ){ return done( err ); }
			if( !user ){ return done( null, false, {message:'Incorrect username.'} ); }
			if( !passwordHash.verify( password, user.password ) ){ return done( null, false, {message:'Incorrect password.'} ); }

			return done( null, user );

		});

	}

));

app.post( '/login',
	passport.authenticate( 'local', {
		sucessRedirect: '/',
		failureRedirect: '/login',
		failureFlash: true 
	})
);

app.get( '/', function(req, res){
	res.writeHead(200, { "Content-Type": content_type(filename)});
	res.write(data,"binary");
	res.end();
});












/*
 * L(a)unch it!
 */

app.listen(1924);






/*
 * Admin stuff
 */

// adminCreateUser( "mr@19h13.com", "markuslogin", "mr.png" );









