/**
 * EventDispatcher.js
 * Abstract class for event based apps
 *
 * @author: Markus Riegel 
 */

(function(window) {

	window.marcorei = window.marcorei || {};
	window.marcorei.tools = window.marcorei.tools || {};

	var EventDispatcher = function(){
		this._evs = {};
	}
	/**
	 * @param e event name as String
	 * @param t target on which the listener will be called
	 * @param f name of listener function as String
	 */
	EventDispatcher.prototype.addEventListener = function(e,t,f){
		if( typeof f === "string" && typeof e === "string"){
			if( typeof this._evs[e] !== "object" ) this._evs[e] = [];
			this._evs[e].push( [f,t] );
		}else{
			throw "Type Error";
		}
	}
	/**
	 * @param e event name as String
	 * @param f name of listener function as String
	 */
	EventDispatcher.prototype.removeEventListener = function(e,f){
		var ev = this._evs[e];
		if( typeof ev === "object" ){
			for( var i = 0; i < ev.length; i++){
    			if( ev[i][0] === f ){
    				ev.splice(i,1);
    			}
    			
			}
			
		}
	}
	/**
	 * @param e event name
	 */
	EventDispatcher.prototype.dispatchEvent = function(e){
		var ev = this._evs[e];
		if( typeof ev === "object" ){
			for( var i = 0; i < ev.length; i++){
		    	ev[i][1][ ev[i][0] ]();
			}
		}
	}
	
	window.marcorei.tools.EventDispatcher = EventDispatcher;


})(window);