/*
 * Lunchpad Checkin provider
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */



var db = require('./module.dbase.js').dBase,
	cn = 'checking';


var CheckinProvider = function(){};







exports.checkinProvider = new CheckinProvider();