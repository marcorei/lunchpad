/*
* Promo module. Loading promo templates.
*
* @author Markus Riegel <riegel.markus@googlemail.com>
*/


angular.module('lpPromo',[
	'lpConfig'
])

.directive('lpPromo',[
'LpConfig',
function(LpConfig){
	return {
		restrict: 'A',
		replace: true,
		templateUrl: function(tElem, tAttr){
			return tAttr.lpPromo || './static/promo/tmpl.manifesto.html';
		}
	}
}]);

//LpConfig.getServer('promo.template')