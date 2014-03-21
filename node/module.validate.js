/*
 * Lunchpad Validation chaining wrapper module
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */


var validatorjs = require('validator');


var Validate = function(){
	this.errors = [];
};

Validate.prototype.e = function(){
	return (this.errors.length > 0) ? 'Validation failed: '+this.errors.join(',') : null;
};

Validate.prototype.v = function(valFnName,params,errorKey){
	if(params.length === 'undefined')
		params = [params];
	if(!validatorjs[valFnName].apply(this,params)){
		var errorMsg = this.msgs[errorKey] || errorKey;
		this.errors.push(errorMsg);
	}

		
	return this;
}

Validate.s = function(valFnName,params){
	return validatorjs[valFnName].apply(this,params);
}

Validate.prototype.msgs = {
	'user.id' : 'User ID is invalid',
	'user.mail' : 'User eMail is invalid',
	'user.nick.alphanumeric' : 'User nick may contain only letters and numbers',
	'user.nick.length' : 'User nick has to be between 3 and 15 letters',
	'user.role' : 'User role is invalid',
	'user.pass' : 'User password is too short',
	'user.ava' : 'User avatar is not a valid URL',
	'user.inv' : 'User invetory has to be an array',

	'venue.id' : 'Venue ID is invalid',
	'venue.url' : 'Venue URL is invalid',
	'venue.name.length' : 'Venue name has to be between 2 and 100 letters',

	'checkin.id' : 'Check-In ID is invalid',

	'comment.id' : 'Comment ID is invalid',
	'comment.txt.length' : 'Comment text to long',

	'item.id' : 'Item ID invalid'
}


exports.Validate = Validate;