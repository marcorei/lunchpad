/*
 * @author Markus Riegel <mr@19h13.com>
 */




 var lunchpadApp = angular.module('lunchpadApp', ['ngAnimate']);


lunchpadApp.controller('VenueListCtrl', function($scope){

	
	$scope.removeUser = function( userId ){
		
	}



	// Local data

	$scope.venues = [
		{
	    	"id" : "0",
	    	"attending": "0",
	        "name": "void",
	        "url": "http://www.foursquare.com",
	        "users": [
	            {
	                "name" : "mr@19h13.com",
	                "img" : "/static/img/mr.png",
	                "status": "i love angular.js!"
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





});



lunchpadApp.controller('DetailsCtrl', function($scope){

	$scope.details = {
		"user": {
			"id": "0",
			"name": "Alfons",
			"img": "../static/img/mr.png"
		},
		"day": "Thursday"

	};

});



lunchpadApp.controller('ErrorCtrl', function($scope){

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

});




















