/*
 * Lunchpad Mailer module
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */



var nodemailer = require('nodemailer'),
	// require mailer-templates
	// require templating engine
	config = require('./config.json');



var Mailer = function(){};


// TODO: consider sending via dedicated SMTP Service later on.
// with queuing and stuff.

// TODO: write wrapper for node-mailer-templates and nodemailer
// as well as batch-sending loop

exports.mailer = new Mailer();
