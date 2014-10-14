/*
* Service for items.
*
* @author Markus Riegel <riegel.markus@googlemail.com>
*/


angular.module('lpItemService',[
	'socket',
	'lpConfig',
	'lpError',
	'lpUserIdService'
])

.factory('LpItemService',[
'Socket','LpConfig','LpError','LpUserIdService','$timeout',
function(Socket,LpConfig,LpError,LpUserIdService,$timeout){


}]);
