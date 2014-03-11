/*
 * Lunchpad Mailer module
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */



var nodemailer = require('nodemailer'),
	config = require('./config.json');



var Mailer = function(){};






exports.mailer = new Mailer();