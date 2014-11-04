/*
 * Lunchpad Time module
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */


var Quando = function(){};

Quando.prototype.today = function(){
	var now = new Date();
	return new Date(now.getFullYear(),now.getMonth(),now.getDate());
}

Quando.prototype.min15 = function(){
	var now = new Date();
	now.setMinutes(now.getMinutes()-15);
	return now;
}

Quando.prototype.weekday = function(){
	return new Date().getDay();
}

Quando.prototype.daysAgo = function(numDays){
	var day = Quando.prototype.today();
	day.setDate(day.getDate()-numDays);
	return day;
}

Quando.prototype.l7d = function(){
	return Quando.prototype.daysAgo(7);
};

Quando.prototype.l30d = function(){
	return Quando.prototype.daysAgo(30);
};

Quando.prototype.l35d = function(){
	return Quando.prototype.daysAgo(35);
};

Quando.prototype.l60d = function(){
	return Quando.prototype.daysAgo(60);
};

exports.quando = new Quando();
