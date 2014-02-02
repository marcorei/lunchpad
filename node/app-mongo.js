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
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	passwordHash = require('password-hash'),
	Validator = require('validator').Validator,
	nodemailer = require('nodemailer'),
	VenueProvider = require('./venueprovider-memory').VenueProvider,
	UserProvider = require('./userprovider-memory').UserProvider,
	ItemProvider = require('./itemprovider-memory').UserItemProvider,
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








/*
 * App basics
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









/*
 * Passport stuff
 */


// Strategies etc


// Auth Middleware

var lunchAuth = {

	requireUser = function(){
		return passport.authenticate('local');
	}

	requireGroup = function(group){
		return [
			passport.authenticate('local'),
			function(req, res, next) {
				if (req.user && req.user.group === group){
					next();
				}else{
					res.send(401, 'Unauthorized');
				}
			}
		]
	},

	requireOwnerOrAdmin = function(owner_id){

	}

};








/*
 * Routes
 */










