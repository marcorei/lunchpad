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
 * Get multiple items
 */

ItemProvider.prototype.findItems = function(ids, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.find({
			_id: {
				$in: ids
			}
		},{}).toArray(function(error,items){
			if(!error) onError(error);
			else if(!items) onError('no items found');
			else onSuccess(items);
		})

	},onError);
}




/*
 * Delete item
 */

ItemProvider.prototype.deleteItem = function(id, onSuccess, onError){
	db.gc(cn, function(collection){

		collection.remove({
			_id: id
		},{
			safe: true
		},function(error,numRemoved){
			if(error) onError(error);
			else{
				console.log('Item removed: '+numRemoved);
				onSuccess(numRemoved);
			}
		});

	},onError);
}






/*
 * Save items
 */

ItemProvider.prototype.saveItems = function(items, onSuccess, onError){
	db.gc(cn, function(collection){

		var i,
			item;

		if(items.length === undefined) items = [items];

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
				onSuccess(results);
			}
		});

	},onError);
}







exports.itemProvider = new ItemProvider(); 