/*
 * Lunchpad Database module
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */




var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

var config = require('./config.json');

var db;




var DBase = function(){

	db = new Db(config.mongodb.db, new Server(config.mongodb.host, config.mongodb.port, {auto_reconnect: true}, {}));
	db.open(function(){});

};

DBase.prototype.gc = function(collectionName,onSuccess,onError){

	db.collection(collectionName, function(error, collection) {
		if( error ) onError(error);
		else onSuccess(collection);
	});

}

DBase.prototype.oID = function(id){
	if(typeof id !== 'string' || id.length !== 24){
		id = '000000000000000000000000';
		console.log('Trying to generate OnjectID: Invalid id');
	}
	return ObjectID(id);
};



exports.dBase = new DBase();
