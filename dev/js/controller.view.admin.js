/*
* Controller for the admin view.
*
* @author Markus Riegel <riegel.markus@googlemail.com>
*/

angular.module('viewAdminController',[
	'socket',
	'lpError'
])

.controller('ViewAdminController',[
'$scope','Socket','LpError',
function($scope,Socket,LpError){

	var defaultResponse = 'No callback response';

	$scope.events = [{ 
		'name': 'chat send',
		'snippet': '{}' 
	},

	{
		'name': 'venue read list',
		'snippet': '{}'
	},{
		'name': 'venue read one',
		'snippet': '{}'
	},{
		'name': 'venue create',
		'snippet': '{ \n\t\"name\": \"\", \n\t\"url": \"\" \n}'
	},


	{
		'name': 'venue update name',
		'snippet': '{}'
	},{
		'name': 'venue update url',
		'snippet': '{}'
	},{
		'name': 'venue delete',
		'snippet': '{}'
	},


	{
		'name': 'checkin create',
		'snippet': '{}'
	},
	{
		'name': 'checkin delete',
		'snippet': '{}'
	},

	{
		'name': 'comment read list',
		'snippet': '{ \n\t\"_id\": \"\" \n}'
	},
	{
		'name': 'comment create',
		'snippet': '{}'
	},
	{
		'name': 'comment delete',
		'snippet': '{}'
	},


	{
		'name': 'user read list',
		'snippet': '{}'
	},
	{
		'name': 'user read own id',
		'snippet': '{}'
	},
	{
		'name': 'user read one',
		'snippet': '{ \n\t\"_id\": \"\" \n}'
	},
	{
		'name': 'user create',
		'snippet': '{ \n\t\"ava\": \"http://lunchpad.co/static/img/user/newAcc.png\", \n\t\"mail\": \"@19h13.com\", \n\t\"nick\": \"\", \n\t\"role\": \"user\", \n\t\"pass\": \"\" \n}'
	},
	{
		'name': 'user update password',
		'snippet': '{}'
	},
	{
		'name': 'user update notifications',
		'snippet': '{}'
	},
	{
		'name': 'user update activeitem',
		'snippet': '{}'
	},
	{
		'name': 'user update inventory',
		'snippet': '{ \n\t\"_id\": \"\", \n\t\"inv\":[ \n\t\t \n\t] \n}'
	},
	{
		'name': 'user delete',
		'snippet': '{}'
	},


	{
		'name': 'item read list',
		'snippet': '{}'
	},
	{
		'name': 'item read one',
		'snippet': '{ \n\t\"_id\": \"\" \n}'
	},
	{
		'name': 'item read multiple',
		'snippet': '{}'
	},
	{
		'name': 'item create',
		'snippet': '{ \n\t\"name\": \"\", \n\t\"url\": \"http://lunchpad.co/static/img/item/.png\", \n\t\"type\": \"\", \n\t\"front\": true \n}'
	},
	{
		'name': 'item delete',
		'snippet': '{}'
	},

	{
		'name': 'notification delete venue',
		'snippet': '{ \n\t\"_id\": \"\", \n\t\"_venueId\": \"\" \n}'
	},
	{
		'name': 'notification delete all',
		'snippet': '{ \n\t\"_id\": \"\"}'
	},

	{
		'name': 'stats innovator',
		'snippet': '{}'
	},

	{
		'name': 'clear all',
		'snippet': '{}'
	}];

	$scope.model = {
		event: {},
		eventData: ''
	}

	$scope.response = defaultResponse;


	$scope.emit = function(){
		var jsonString = $scope.model.eventData,
			json;
		if (/^[\],:{}\s]*$/.test(jsonString.replace(/\\["\\\/bfnrtu]/g, '@').
			replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
			replace(/(?:^|:|,)(?:\s*\[)+/g, ''))){
			if(jsonString === ''){
				jsonString = '{}';
			}
			try{
				console.log(jsonString);
				json = JSON.parse(jsonString);
				$scope.response = defaultResponse;
				Socket.emit($scope.model.event.name, json, function(response){
					$scope.response = JSON.stringify(response, undefined, 2);
				});
			}catch(e){
				console.log(e);
				LpError.throwError('Parsing JSON failed! (Invalid JSON?)');
			}
			// $scope.response = defaultResponse;
			// Socket.emit($scope.model.eventName, JSON.parse(json), function(response){
			// 	$scope.response = JSON.stringify(response, undefined, 2);
			// });
		}else{
			LpError.throwError('JSON invalid!');
		}
	}

	$scope.snippetPlease = function(){
		$scope.model.eventData = $scope.model.event.snippet;
	}

	/*
	$scope.users;
	$scope.items;

	LpUserService.readUserList(function(users){
		$scope.users = users;
	});

	LpItemService.loadItems(function(items){
		$scope.items = items;
	});
	*/

}])


// Code Snippet from:
// http://stackoverflow.com/questions/6637341/use-tab-to-indent-in-textarea

.directive('ngAllowTab', function () {
    return function (scope, element, attrs) {
        element.bind('keydown', function (event) {
            if (event.which == 9) {
                event.preventDefault();
                var start = this.selectionStart;
                var end = this.selectionEnd;
                element.val(element.val().substring(0, start) 
                    + '\t' + element.val().substring(end));
                this.selectionStart = this.selectionEnd = start + 1;
                element.triggerHandler('change');
            }
        });
    };
});
