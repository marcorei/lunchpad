/*
 * Imports
 *
 * Put all your passwords in ./config.json
 */

var path = require('path'),
	express = require('express'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	passwordHash = require('password-hash'),
	mysql = require('mysql'),
	Validator = require('validator').Validator,
	nodemailer = require("nodemailer"),
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
	id = id.toString();
	return mysql.escapeId( id );
}


// callback() err, user )
function getUserById( id, callback ){

	console.log('trying to get user by id: ' + id + ' ... escape: ' + esc(id));

	connection.query("SELECT * FROM  `users` WHERE  `id` = " + esc(id) + " LIMIT 0 , 1;",
		function( err, rows ) {

			if( err ){
				console.log( err );
			}

			composeUserObj( err, rows, callback );

		}
	);

}

// callback( err,user )
function getUserBySid( sid, callback ){

	connection.query("SELECT * FROM  `users` WHERE  `sid` = " + esc(sid) + " LIMIT 0 , 1;",
		function( err, rows ) {

			if( err ){
				console.log( err );
			}

			composeUserObj( err, rows, callback );

		}
	);

}


// callback( err,user )
function getUserByName( username, callback ){

	connection.query("SELECT * FROM  `users` WHERE  `email` = " + esc(username) + " LIMIT 0 , 1;",
		function( err, rows ) {

			if( err ){
				console.log( err );
			}

			composeUserObj( err, rows, callback );

		}
	);

}


function composeUserObj( err, rows, callback )
{

	//console.log('comopising user: ' + rows[0].id);

	var user = {};

	if( !err ){

		if( rows.length > 0 )
		{
			//console.log('found user: ' + rows[0].sid);

			user.id = rows[0].id;
			user.sid = rows[0].sid;
			user.username = rows[0].email;
			user.password = rows[0].password;
			user.notify = rows[0].notify;
			user.image = rows[0].image;
		}else{
			err = "user not found."
			callback( err, null );
		}

		

	}else{
		console.log( err );
	}

	//console.log('calling callback: ' + callback);

	callback( err, user );
}


// callback( err, count )
function checkUserExists( username, callback ){

	connection.query("SELECT count(*) AS `numusers` FROM  `users` WHERE  `email` = " + esc(username) + ";",
		function( err, rows ) {

			if( err ){
				console.log( err );
			}

			callback( err, rows[0].numusers );

		}
	);

}


function createUser( username, passwort, image ){

	console.log("host: " + config.mysql.host);

	// Insert User into db
	connection.query("INSERT INTO `"+
		config.mysql.database+
		"`.`users` (`id`, `sid`, `email`, `password`, `notify`, `image`) VALUES (NULL, '" + 
		passwordHash.generate( username ) + 
		"', " + 
		esc(username) + 
		", '" + 
		passwordHash.generate( passwort ) +
		"', '0', " +
		esc(image) +
		")" ,

		function( err ) {

			if( err ) {
				console.log( err );
			}else{
				console.log( 'user created');
			}
			
		}
	);

}


// callback(err,notify)
function changeUserNotify( userid, notify, callback ){

	var notifyUint = (notify === 'true') ? 1 : 0;
	
	connection.query("UPDATE  `"+
		config.mysql.database+
		"`.`users` SET  `notify` =  '"+
		notifyUint +
		"' WHERE  `users`.`id` ="+
		esc(userid)+
		";", 

		function( err ){

			if( err ){
				console.log( err );
			}
			callback( err, notify );

		}
	);



}



// callback(err,venue)
// @param venue object {name,url,userid}
function createVenue( venue, callback ){

	// check if venue with that name exists.
	checkVenueExists( venue.name, function( err, count ){

		if( !err )
		{
			console.log('trying to insert new venue. venuename: ' + venue.name);

			if( 0 == count ){

				connection.query("INSERT INTO  `"+
					config.mysql.database+
					"`.`venues` (`id` ,`name` ,`url` ,`createdby`)VALUES (NULL ,  "+
					esc(venue.name)+
					",  "+
					esc(venue.url)+
					",  "+
					esc(venue.userid)+
					");",

					function( err ){
						if( err ){
							console.log( err );
						}

						console.log( 'New Venue:' + venue.name );

						callback( err, venue );
					}
				);

			}else{
				var err = "venue already exists!";
				console.log(err);
				callback( err, venue.name );
			}
		}else{
			callback( err, "" );
		}

		

	});

	// query etc

}


// callback( err, count )
function checkVenueExists( venuename, callback ){

	console.log( 'checking for existing venue' );

	connection.query("SELECT count(*) AS `numvenues` FROM  `venues` WHERE  `name` = " + esc(venuename) + ";",
		function( err, rows ) {

			if( err ){
				console.log( err );
			}

			callback( err, rows[0].numvenues );

		}
	);

}



// callback(err,obj)
function getVenueList( callback ){

	// Date for mysql
	var datestr = (new Date()).yyyymmdd();
	var usersSorted = {};
	var answer = {};

	answer.error = "";
	answer.venues = [];
	answer.voidvenue = null;


	// list all visits of the day
	connection.query("SELECT * FROM  `visits` WHERE  `date` = '" + datestr + "';",

		function( err, rows ){

			if(err){
				console.log(err);
				callback(err, null);
			}else{


				var i = 0;
				var iMax = rows.length;


				// compose visits

				var sq1 = function(){

					var venueId = rows[i].vid;

					//console.log('composing visits. venueId: ' + venueId + ' , uid:' + rows[i].uid );

					// get user data
					getUserById( rows[i].uid, function( err, user ){

						if( err ){
							console.log( err );
						}

						//visits[i] = {
						//	vid: vid,
						//	user: user
						//};

						//console.log('reaffirming venueId: ' + venueId );
						//console.log('reaffirming user.id ' + user.id);

						// and push the visit where it belongs
						if( !usersSorted['v'+venueId] )
						{
							usersSorted['v'+venueId] = [];
						}

						// push visit obj.
						usersSorted['v'+venueId].push({
							name: user.username,
							img: user.image

						});


						// node for loop
						i++;
						if( i < iMax ) {
							sq1();
						}else{
							sq2();
						}

					});


					

				}
				




				// compose venues

				var sq2 = function(){


					connection.query("SELECT * FROM  `venues`;", function( err, rows ){

						var i,
							tmpVenue;

						for( i = 0; i < rows.length; i++ )
						{

							// users?
							var tmpUsers = (usersSorted['v'+rows[i].id]) ? usersSorted['v'+rows[i].id] : [];

							// check if void venue with conversion
							if( rows[i].name == "void" ){

								// compose void venue
								tmpVenue = {
									users: tmpUsers
								}

								answer.voidvenue = tmpVenue;

							}else{

								// compose normal venue
								tmpVenue = {
									id: rows[i].id,
									name: rows[i].name,
									url: rows[i].url,
									users: tmpUsers
								}

								answer.venues.push( tmpVenue );

							};

						}

						// callback!
						callback( err, answer );

					});				



				}



				if( iMax > i ){
					sq1();
				}else{
					sq2();
				}
				
			}
		}

	);
}



// callback(err,venueid)
function addVisit( userid, venueid, callback ){

	// Date for mysql
	var datestr = (new Date()).yyyymmdd();

	checkVisitExists( userid, datestr, function(err,count){
		if( 0 == count ){

			console.log( 'New visit! ' + userid + ' visits venue ' + venueid );

			//new entry
			connection.query("INSERT INTO `"+
				config.mysql.database+
				"`.`visits` (`id`, `date`, `uid`, `vid`) VALUES (NULL, '"+
				datestr+
				"', "+
				esc(userid)+
				", "+
				esc(venueid)+
				");",

				function( err, rows ){
					if( err ){
						console.log( err );
					}
					callback( err, venueid );
				}
			);

		}else{

			console.log( 'Update! ' + userid + ' visits now venue ' + venueid );

			//update entry
			connection.query("UPDATE  `"+
				config.mysql.database+
				"`.`visits` SET  `vid` =  "+
				esc(venueid)+
				" WHERE  `uid` = " + 
				esc(userid) + 
				" AND `date` = '" + 
				datestr + 
				"';",

				function( err ){
					if( err ){
						console.log( err );
					}

					callback( err, venueid );
				}
			);

		}
	});

}

// callback( err, count )
function checkVisitExists( userid, datestr, callback ){

	//console.log( 'checking if visit exists' );

	connection.query("SELECT count(*) AS `numvisits` FROM  `visits` WHERE  `uid` = " + 
		esc(userid) + 
		" AND `date` = '" + 
		datestr + 
		"';",

		function( err, rows ) {
			if( err ){
				console.log( err );
			}

			callback( err, rows[0].numvisits );

		}
	);

}





/*
 * Mail Stuff
 */

var smtpTransport = nodemailer.createTransport("SMTP",{
    host: config.smtp.host,
    auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
    }
});



function sendNotifications( userid, venueid ){

	console.log('sending notifications; userid: '+userid+' venueid: '+venueid);

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


// enable callback for local cross computer testing
// app.enable('jsonp callback');










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




// manifesto

app.get( '/manifesto', function(req,res){

	var file = '../templates/page.manifesto.html';
	res.sendfile( path.join( __dirname, file ) );

});




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
		
		getVenueList( function(err, answer){

			if(err){
				console.log(err);
				res.json({ error: "venue list could not be created."});
			}else{
				res.json(
					answer
				);
			}
		});

	});

});


// get user
// no data required, returns always the logged in user.

app.get( '/get/user', function(req, res){

	requireAuthJSON( req, res, function(){

		var a = {};
		a.name = req.user.username;
		a.img = req.user.image;
		a.error = "";

		if( req.user.notify == 1 ){
			a.notify = 1;
		}

		res.json(a);

	});

});


// post venue
// data: venuename, venueurl

app.post( '/post/venue', function(req, res){

	requireAuthJSON( req, res, function(){


		// Validation

		var v = new Validator(),
			errors = [];
		v.error = function(msg){ errors.push(msg); };

		v.check( req.body.venuename, 'Venue name is too short.').len(2);
		v.check( req.body.venueurl, 'Venue url is no valid url').isUrl();

		if( errors.length > 0 ){
			res.json({
				error: errors.join(' ')
			})
			return;
		}

		// Response

		var v = {
			name: req.body.venuename,
			url: req.body.venueurl,
			userid: req.user.id
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


// post notification
// data: notify (true or false)

app.post( '/post/notify', function(req, res){

	requireAuthJSON( req, res, function(){

		// Validation

		var v = new Validator(),
			errors = [];
		v.error = function(msg){ errors.push(msg); };

		v.check( req.body.notify, 'Notify is not a boolean value.').isIn(['true','false']);

		if( errors.length > 0 ){
			res.json({
				error: errors.join(' ')
			})
			return;
		}

		// Response

		changeUserNotify( req.user.id, req.body.notify, function(err, notify){

			if(err){
				res.json({ error: "Could not change notify option"});
			}else{
				res.json({
					error: "",
					notify: notify
				});
			}
		});

	});

});


// post visit
// data: venueid

app.post( '/post/visit', function(req, res){

	requireAuthJSON( req, res, function(){

		// Validation

		var v = new Validator(),
			errors = [];
		v.error = function(msg){ errors.push(msg); };

		v.check( req.body.venueid, 'Venue id is not an integer.').isInt();

		if( errors.length > 0 ){
			res.json({
				error: errors.join(' ')
			})
			return;
		}

		// Response

		addVisit( req.user.id, req.body.venueid, function(err,venueid){

			if( err ){
				res.json({ error: "Could not register visit."});
			}else{

				res.json({
					error: "",
					venueid: venueid
				});

				// SEND NOTIFICATIONS

				sendNotifications( req.user.id, venueid );

			}

		});

		

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

//createUser( "test2@19h13.com", "test2", "test2.png" );
//createUser( "test3@19h13.com", "test3", "test3.png" );









