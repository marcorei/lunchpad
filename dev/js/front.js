/*
 * @author Markus Riegel <mr@19h13.com>
 */




(function (window, angular, undefined) {





	/* 
	 * --------------------------
	 * APP
	 * --------------------------
	 */

	 var lunchpadApp = angular.module('lunchpadApp', [
	 	'ngAnimate',
	 	'ngRoute',
	 	'lunchpadControllers'
	 ]);



	lunchpadApp.config(['$routeProvider',
		function($routeProvider){
			$routeProvider.
				when('/venues', {

					templateUrl: './view.venuelist.html',
					controller: 'VenueListCtrl'

				}).
				when('/venue/:venueId', {

					templateUrl: './view.venuedetail.html',
					controller: 'VenueCtrl'

				}).
				when('/settings', {

					templateUrl: './view.settings.html',
					controller: 'SettingsCtrl'

				}).
				otherwise({

					redirectTo: '/venues'

				});
		}

	]);



	// kill the default scrolling behaviour

	var $AnchorScrollProvider = function() {
		this.$get = ['$window', '$location', '$rootScope', function($window, $location, $rootScope) {
			function scroll() {
			}
			return scroll;
		}];
	}
	angular.module('lunchpadApp').provider('$anchorScroll', $AnchorScrollProvider);












	/* 
	 * --------------------------
	 * CONTROLLER
	 * --------------------------
	 */




	var lunchpadControllers = angular.module('lunchpadControllers', []);




	/*
	 * Root view controller
	 */



	// View Controller, watches over changes in the view state

	lunchpadControllers.controller('ViewCtrl', [ '$scope','$location',

		function($scope,$location){

			$scope.goto = function(path){
				$location.path(path);
			}

			// Custom Animations for different states

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

		}

	]);


	// Migthy Detail Controller just wants to know your details once

	lunchpadControllers.controller('DetailsCtrl', [ '$scope', 

		function($scope){

			$scope.details = {
				"user": {
					"id": "0",
					"name": "Alfons",
					"img": "../static/img/mr.png"
				},
				"day": "Thursday"

			};

		}
	]);



	// Ze Error Ctrl will hopefully never be used. Yet it exists.

	lunchpadControllers.controller('ErrorCtrl', [ '$scope',

		function($scope){

			$scope.errors = [
				/*
				{
					"msg":"Trolololo"
				},
				{
					"msg":"Hi!"
				}
				*/
			];

		}
	]);








	/*
	 * Sub view controller
	 */



	// Venue List aka all venues

	lunchpadControllers.controller('VenueListCtrl', [ '$scope', 

		function($scope){

			window.testscope = $scope;


			$scope.removeUser = function( userId ){
				
			}


			// Example Data for now

			$scope.venues = [
				{
			    	"id" : "0",
			    	"attending": "0",
			    	"commentcount": "13",
			        "name": "aoöshgölkjhgkajgföklj",
			        "url": "http://www.foursquare.com",
			        "users": [
			            {
			                "name" : "mr@19h13.com",
			                "img" : "/static/img/mr.png",
			                
			            },
			            {
			                "name" : "mk@19h13.com",
			                "img" : "/static/img/mk.png"
			            },
			            {
			                "name" : "mrz@19h13.com",
			                "img" : "/static/img/mrz.png"
			            }
			        ]
			    },
			    {
			    	"id" : "3",
			    	"attending": "1",
			        "name": "Scheidegger",
			        "url": "http://www.scheidegger-schwabing.com",
			        "users": [
			            {
			                "name" : "kb@19h13.com",
			                "img" : "/static/img/kb.png"
			            },
			            {
			                "name" : "kh@19h13.com",
			                "img" : "/static/img/kh.png"
			            }
			        ]
			    },
			    {
			    	"id": "4",
			    	"attending": "0",
			        "name": "Alfons Cafe",
			        "url": "http://www.alfons.com",
			        "users": []
			    },
			    {
			    	"id": "5",
			    	"attending": "0",
			        "name": "TestVenue2",
			        "commentcount": "19",
			        "url": "http://www.foursquare.com",
			        "users": [
			            {
			                "name" : "mr@19h13.com",
			                "img" : "/static/img/mr.png"
			            },
			            {
			                "name" : "mr@19h13.com",
			                "img" : "/static/img/mr.png"
			            },
			            {
			                "name" : "mr@19h13.com",
			                "img" : "/static/img/mr.png"
			            },
			            {
			                "name" : "mr@19h13.com",
			                "img" : "/static/img/mr.png"
			            },
			            {
			                "name" : "mr@19h13.com",
			                "img" : "/static/img/mr.png"
			            },
			            {
			                "name" : "mr@19h13.com",
			                "img" : "/static/img/mr.png"
			            },
			            {
			                "name" : "mr@19h13.com",
			                "img" : "/static/img/mr.png"
			            },
			            {
			                "name" : "mr@19h13.com",
			                "img" : "/static/img/mr.png"
			            },
			            {
			                "name" : "mr@19h13.com",
			                "img" : "/static/img/mr.png"
			            },
			            {
			                "name" : "mr@19h13.com",
			                "img" : "/static/img/mr.png"
			            },
			            {
			                "name" : "mk@19h13.com",
			                "img" : "/static/img/mk.png"
			            },
			            {
			                "name" : "mrz@19h13.com",
			                "img" : "/static/img/mrz.png"
			            }
			        ]
			    },
			    {
			    	"id": "6",
			    	"attending": "0",
			        "name": "Berta's Bookshop",
			        "url": "http://www.alfons.com",
			        "users": []
			    }
			];





		}
	]);



	// single venue aka detail view

	lunchpadControllers.controller('VenueCtrl', [ '$scope', '$routeParams',

		function($scope, $routeParams){

			$scope.venueId = $routeParams.venueId;

		}

	]);



	// settings

	lunchpadControllers.controller('SettingsCtrl', [ '$scope', 

		function($scope){



		}

	]);







})(window, window.angular);


