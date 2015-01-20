/*
 * Lunchpad Cron module
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */


var CronJob = require('cron').CronJob;

var CronTasks = function(){
	this.tasks = [];
};

CronTasks.prototype.setupTasks = function(tasks){
	var i;
	for(i = 0; i < tasks.length; i++){
		this.tasks.push(new CronJob({
			cronTime: tasks[i].time,
			onTick: tasks[i].fn,
			start: true
		}));
	}
}

CronTasks.prototype.clearTasks = function(){
	while(this.tasks.length > 0){
		this.tasks.splice(i,1).stop();
	}
}


exports.cronTasks = new CronTasks();
