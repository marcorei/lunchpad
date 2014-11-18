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

	$scope.events = [
		'chat send',

		'venue read list',
		'venue read one',
		'venue create',

		'venue update name',
		'venue update url',
		'venue delete',

		'checkin create',
		'checkin delete',

		'comment read list',
		'comment create',
		'comment delete',

		'user read list',
		'user read own id',
		'user read one',
		'user create',
		'user update password',
		'user update notifications',
		'user update activeitem',
		'user update inventory',
		'user delete',

		'item read list',
		'item read one',
		'item read multiple',
		'item create',
		'item delete'
	];

	$scope.model = {
		eventName: '',
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
				Socket.emit($scope.model.eventName, json, function(response){
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
