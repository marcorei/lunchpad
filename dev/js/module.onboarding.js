/*
* Module for onboarding. Requires shepherd.js
*
* @author Markus Riegel <riegel.markus@googlemail.com>
*/

angular.module('mrShepherd',[
])

.provider('MrShepherdTour', function(){

	this.options = {
		name: 'default',
		defaults: {
			classes: "shepherd-element shepherd-open",
			showCancelLink: true
		},
		steps: [
			/*
			{
				name: '',
				options: {
					title: '',
					text: '',
					buttons: [
						{
							text: '',
							classes: '',
							action: shepherd.back // shepherd.next
						}
					]
				}
			}
			*/
		]
	};

	this.$get = function(){
		var options = this.options;
		return {
			name: function(){
				return options.name;
			},
			defaults: function(){
				return options.defaults;
			},
			steps: function(){
				return options.steps;
			},
			tour: function(){
				var tour = new Shepherd.Tour({
						defaults: options.defaults
					}),
					i,
					j,
					step,
					button;
				for(i = 0; i < options.steps.length; i++){
					step = options.steps[i];
					// check buttons for actions
					for(j = 0; j < step.options.buttons.length; j++){
						button = step.options.buttons[j];
						switch(button.action){
							case 'next':
								button.action = tour.next; break;
							case 'back':
								button.action = tour.back; break;
						}
					}
					tour.addStep(step.name, step.options);
				}
				return tour;
			}
		}
	};

	this.setName = function(name){
		this.options.name = name;
	};

	this.setDefaults = function(defaults){
		this.options.defaults = defaults;
	};

	this.addStep = function(id, options){
		this.options.steps.push({
			id: id,
			options: options
		});
	};
})

.directive('mrShepherd',[
'MrShepherdTour',
function(MrShepherdTour){

	var createCookie = function(name, value, days) {
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		}
		else var expires = "";
		document.cookie = name+"="+value+expires+"; path=/";
	};

	var readCookie = function(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	};

	var eraseCookie = function(name) {
		createCookie(name,"",-1);
	}

	return {
		restrict: 'A',
		link: function(scope, elm, attr){
			if(readCookie(MrShepherdTour.name()) !== 'completed'){
				var tour = MrShepherdTour.tour();

				var tourComplete = function(){
					createCookie(MrShepherdTour.name(), "completed", 999999);
				}

				tour.on('complete', tourComplete);
				tour.on('cancel', tourComplete);

				tour.start();
			}
		}
	}
}]);