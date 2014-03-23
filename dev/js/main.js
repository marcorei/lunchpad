/*
 * Lunchpad frontend main app
 *
 * New Version for socket.io and angular
 *
 * @author Markus Riegel <riegel.markius@googlemail.com>
 */



angular.module('lunchpad',[
	'ngAnimate',
	'ngRoute',

	'viewVenuesController',
	'viewVenueDetailController',
	'viewSettingsController'
])

.config(['$routeProvider',
	function($routeProvider){
		$routeProvider.
			when('/venues', {

				templateUrl: './view.venuelist.html',
				controller: 'ViewVenuesController'

			}).
			when('/venue/:venueId', {

				templateUrl: './view.venuedetail.html',
				controller: 'ViewVenuesDetailController'

			}).
			when('/settings', {

				templateUrl: './view.settings.html',
				controller: 'ViewSettingsController'

			}).
			otherwise({

				redirectTo: '/venues'

			});
	}
])

.provider('$anchorScroll',function() {
	this.$get = ['$window', '$location', '$rootScope', function($window, $location, $rootScope) {
		function scroll() {}
		return scroll;
	}];
});






