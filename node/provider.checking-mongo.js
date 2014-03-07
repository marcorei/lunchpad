/*
 * Lunchpad Checkin provider
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */



var db = require('./module.dbase.js').dBase,
	cn = 'checking';


var CheckinProvider = function(){};




/*
 * Get a list of all checkins
 */

CheckinProvider.prototype.findAll = function(onSuccess, onError){

}





/*
 * Find one checkin
 */

CheckinProvider.prototype.findCheckin = function(id, onSuccess, onError){

}





/*
 * Get a list of all checkins
 */

CheckinProvider.prototype.findAll = function(onSuccess, onError){

}



exports.checkinProvider = new CheckinProvider();