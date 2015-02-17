/*
* Promo module. Loading promo templates.
*
* @author Markus Riegel <riegel.markus@googlemail.com>
*/


angular.module('lpPromo',[
	'lpConfig',
	'angular.css.injector'
])

.directive('lpPromo',[
'LpConfig','cssInjector',
function(LpConfig,cssInjector){
	return {
		restrict: 'A',
		replace: true,
		templateUrl: function(tElem, tAttr){
			return (tAttr.lpPromo) ? '/static/promo/' + tAttr.lpPromo + '/tmpl.teaser.html' : '/static/promo/manifesto/tmpl.teaser.html';
		},
		link: function(scope, elm, attr){
			var cssPath = (attr.lpPromo) ? '/static/promo/' + attr.lpPromo + '/style.teaser.css' : './static/promo/manifesto/style.teaser.css';
			cssInjector.add(cssPath);
		}
	}
}]);

//LpConfig.getServer('promo.template')