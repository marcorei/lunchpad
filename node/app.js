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
	return mysql.escapeId( id );
}


// callback() err, user )
function getUserById( id, callback ){

	connection.query("SELECT * FROM  `users` WHERE  `id` = " + escId(id) + " LIMIT 0 , 1;",
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

	//console.log('comopising user: ' + rows[0].sid);

	var user = {};

	if( !err ){

		//console.log('found user: ' + rows[0].sid);

		user.id = rows[0].id;
		user.sid = rows[0].sid;
		user.username = rows[0].email;
		user.password = rows[0].password;
		user.notify = rows[0].notify;
		user.image = rows[0].image;

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
		escId(userid)+
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

		if( 0 == count ){

			connection.query("INSERT INTO  `"+
				config.mysql.database+
				"`.`venues` (`id` ,`name` ,`url` ,`createdby`)VALUES (NULL ,  "+
				esc(venue.name)+
				",  "+
				esc(venue.url)+
				",  "+
				escId(venue.userid)+
				");",

				function( err ){
					if( err ){
						console.log( err );
					}
					callback( err, venue );
				}
			);

		}else{
			var err = "venue already exists!";
			console.log(err);
			callback( err, venue.name );
		}

	});

	// query etc

}


// callback( err, count )
function checkVenueExists( venuename, callback ){

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

				// compose visits
				var i;
				for( i = 0; i < rows.length; i++ ){

					var venueId = rows[i].vid;

					// get user data
					getUserById( rows[i].uid, function( err, user ){

						//visits[i] = {
						//	vid: vid,
						//	user: user
						//};

						// and push the visit where it belongs
						if( !usersSorted['v'+vid] )
						{
							usersSorted['v'+vid] = [];
						}

						// push visit obj.
						usersSorted['v'+vid].push({
							name: user.username,
							img: user.image

						});


					});

				}


				// hopefully this will work sequentially due to the nature of mysql XD

				// next get all venues.
				connection.query("SELECT * FROM  `venues`;",
				function( err, rows ){

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

							answer.voidvenue = tempVenue;

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
		}

	);
}



// callback(err,venueid)
function addVisit( userid, venueid, callback ){

	// Date for mysql
	var datestr = (new Date()).yyyymmdd();

	checkVisitExists( userid, datestr, function(err,count){
		if( 0 == count ){
			//new entry
			connection.query("INSERT INTO `"+
				config.mysql.database+
				"`.`visits` (`id`, `date`, `uid`, `vid`) VALUES (NULL, '"+
				datestr+
				"', '"+
				escId(userid)+
				"', '"+
				escId(venueid)+
				"');",

				function( err, rows ){
					if( err ){
						console.log( err );
					}
					callback( err, venueid );
				}
			);

		}else{
			//update entry
			connection.query("UPDATE  `"+
				config.mysql.database+
				"`.`visits` SET  `vid` =  '"+
				escId(venueId)+
				"' WHERE  `uid` = '" + 
				escId(userid) + 
				"' AND `date` = '" + 
				datestr + 
				"' LIMIT 0 , 1;",

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

	connection.query("SELECT count(*) AS `numvisits` FROM  `visits` WHERE  `uid` = '" + 
		escId(userid) + 
		"' AND `date` = '" + 
		datestr + 
		"'",

		function( err, rows ) {
			if( err ){
				console.log( err );
			}

			callback( err, rows[0].numvisits );

		}
	);

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


// post venue
// data: venuename, venueurl

app.post( '/post/venue', function(req, res){

	requireAuthJSON( req, res, function(){

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

		changeUserNotify( req.user.id, req.body.notify, function(err, notify){

			if(err){
				res.json({ error: "could not change notify option"});
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

		addVisit( req.user.id, req.body.venueid, function(err,venueid){

			if( err ){
				res.json({ error: "could not register visit."});
			}else{

				// SEND NOTIFICATIONS
				res.json({
					error: "",
					venueid: venueid
				})

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

//createUser( "test@19h13.com", "test", "test.png" );









