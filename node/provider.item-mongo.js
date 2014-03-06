/*
 * Lunchpad item provider
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */



var db = require('./module.dbase.js').dBase,
	cn = 'item';


var ItemProvider = function(){};





/*
 * Get a list of all venues
 */

ItemProvider.prototype.findAll = function(onSuccess, onError){
	db.gc(cn, function(collection){

		collection.find({},{},function(error,items){
			if(error) onError(error);
			else onSuccess(items);
		});

	},onError);
}



/*
 * Get one item
 */

ItemProvider.prototype.findItem = function(id, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.findOne({
			_id: db.oID(id)
		},{},function(error,item){
			if(!error) onError(error);
			else if(!item) onError('item not found!');
			else onSuccess(item);
		})

	},onError);
}




/*
 * Save items
 */

ItemProvider.prototype.saveItems = function(items, onSuccess, onError){
	db.gc(cn, function(collection){

		var i,
			item;

		if(items.length === 'undefined') items = [items];

		// expected values

		for(i=0;i<items.length;i++){

			item = items[i];

			if( !item.name ||
				!item.url ||
				!item.type ||
				!item.front ){
				callback('data incomplete');
				return;
			}

		}
		
		collection.insert(items, function(error,results) {
			if(error) onError(error);
			else{
				console.log('items created: '+items.length);
				onSuccess(null,results);
			}
		});

	},onError);
}







exports.itemProvider = new ItemProvider(); 