/*
 * Lunchpad frontend main app
 *
 * New Version for socket.io and angular
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */



angular.module('lunchpad',[
	'ngAnimate',
	'ngRoute',

	'viewVenuesController',
	'viewVenueDetailController',
	'viewSettingsController',
	'viewAdminController',

	'lpConfig',
	'lpError',
	'lpNavi'
])

.config(['$routeProvider','LpConfigProvider','$animateProvider',
	function($routeProvider,LpConfigProvider,$animateProvider){
		var LpConfig = LpConfigProvider.$get();

		$routeProvider.
			when('/venues', {

				templateUrl: LpConfig.getTemplate('view.venues'),
				controller: 'ViewVenuesController'

			}).
			when('/venue/:venueId', {

				templateUrl: LpConfig.getTemplate('view.venuedetail'),
				controller: 'ViewVenueDetailController'

			}).
			when('/settings', {

				templateUrl: LpConfig.getTemplate('view.settings'),
				controller: 'ViewSettingsController'

			}).
			when('/admin', {

				templateUrl: LpConfig.getTemplate('view.admin'),
				controller: 'ViewAdminController'

			}).
			otherwise({

				redirectTo: '/venues'

			});

		$animateProvider.classNameFilter(/lunch-animate/);
	}
])
/*
.provider('$anchorScroll',function() {
	this.$get = ['$window', '$location', '$rootScope', function($window, $location, $rootScope) {
		function scroll() {}
		return scroll;
	}];
})
*/
.controller('ViewController',[
'$scope', '$location',
function($scope, $location){

	$scope.$on('$locationChangeStart', function(event, targetRoute, currentRoute){
		// get relevant route from route
		var naviName = targetRoute.split('#')[1].split('/')[1];
		console.log(naviName);
		if( naviName === 'venues'){
			console.log('back!');
			$scope.stateAnimClass = 'back';
		} else {
			console.log('front!');
			$scope.stateAnimClass = '';
		}
	});

}]);
