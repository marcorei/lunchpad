/*
 * Error module. cotaining error service and directive
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */


angular.module('lpError',[
	'lpConfig'
])

.factory('LpError',[
function(){

	return {
		throw: function(){},
		getMsg: function(){return null}
	}
}])

.directive('lpError',[
function(){

}]);