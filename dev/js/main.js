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
	'viewVenueEditController',
	'viewSettingsController',
	'viewAdminController',

	'lpConfig',
	'lpError',
	'lpNavi',

	'angularMoment',
	'mrShepherd'
])

.config(['$routeProvider','LpConfigProvider','$animateProvider','MrShepherdTourProvider'
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
			when('/edit/:venueId', {

				templateUrl: LpConfig.getTemplate('view.venueedit'),
				controller: 'ViewVenueEditController'

			}).
			when('/settings/:userId', {

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

		MrShepherdTourProvider.setName('onboardingMain');
		MrShepherdTourProvider.addStep('welcome', {
			title: 'Even Better!',
			text: 'Welcome to the new Lunchpad!',
			buttons: [
				{
					text: 'Next',
					classes: 'lunch-button',
					action: 'next'
				}
			]
		});
		MrShepherdTourProvider.addStep('detail', {
			title: 'Venue Detail',
			text: 'Click on a venue name! <br>You can add comments on the detail page!',
			attachTo: '.lunch-venue-title bottom',
			buttons: [
				{
					text: 'Back',
					classes: 'lunch-button shepherd-button-secondary',
					action: 'back'
				}, {
					text: 'Next',
					classes: 'lunch-button',
					action: 'next'
				}
			]
		});
		MrShepherdTourProvider.addStep('notifications', {
			title: 'Improved Notifications',
			text: 'We added new and improved notifications! <br>Go to your profile to update your settings.',
			attachTo: '.lunch-fn-settings left',
			buttons: [
				{
					text: 'Back',
					classes: 'lunch-button shepherd-button-secondary',
					action:'back'
				}, {
					text: 'Next',
					classes: 'lunch-button',
					action: 'next'
				}
			]
		});
		MrShepherdTourProvider.addStep('profile', {
			title: 'Items',
			text: 'Pimp your Character with items! <br>You can earn new items through contests and on special occasions.',
			attachTo: '.lunch-fn-settings left',
			buttons: [
				{
					text: 'Back',
					classes: 'lunch-button shepherd-button-secondary',
					action: 'back'
				}, {
					text: 'Done',
					classes: 'lunch-button',
					action: 'next'
				}
			]
		});
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
