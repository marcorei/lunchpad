/*
 * Lunchpad Mailer module
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */



var path = require('path'),
	nodemailer = require('nodemailer'),
	emailTemplates = require('email-templates'),
	// require templating engine
	config = require('./config.json'),
	from = config.mailer.from;



var Mailer = function(){
	this.templatesDir = path.join(__dirname,'/../templates'); 
	this.transport = nodemailer.createTransport('SMTP', {
		host: config.mailer.smtp.host,
		auth: {
			user: config.mailer.smtp.user,
			pass: config.mailer.smtp.pass
		}
	});
};


// TODO: consider sending via dedicated SMTP Service later on.
// with queuing and stuff.

Mailer.prototype.sendMail = function(templateName, subject, locals, users){
	var self = this;
	emailTemplates(self.templatesDir, function(err, template){
		if(err){
			console.log(err);
		}else{
			var i,
				tmpLocals,
				user;
			for(i = 0; i < users.length; i++){
				user = users[i];
				tmpLocals = copyObj(locals);
				tmpLocals.user = users[i];
				template(templateName, tmpLocals, function(err, html, txt){
					if(err){
						console.log(err);
					}else{
						self.transport.sendMail({
							from: from,
							to: user.mail,
							subject: subject,
							html: html,
							txt: txt
						}, function(err, response){
							if(err){
								console.log(err);
							}else{
								console.log('message sent: ' + response.message);
							}
						})
					}
				});
			}
		}
	});
};

var copyObj = function(sourceObj){
	var copy = {},
		key;
	for(key in sourceObj){
		if(sourceObj.hasOwnProperty(key)){
			copy[key] = sourceObj[key];
		}
	}
	return copy;
}

exports.mailer = new Mailer();
