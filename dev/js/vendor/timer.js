/**
 * Timer.js
 * Substitute for the AS3 Timer class
 *
 * @author: Markus Riegel 
 */

(function(window) {

    window.marcorei = window.marcorei || {};
    window.marcorei.tools = window.marcorei.tools || {};

    var EventDispatcher = window.marcorei.tools.EventDispatcher;

 	/**
 	 * @requires EventDispatcher
 	 * @dispatches onTimer
 	 * @dispatches onTimerComplete
 	 * @param t time between timer events
 	 * @param m max counts; 0 = indefinite
 	 */
    var Timer = function(t,m) {
    	this._t = t;
    	this._m = ( typeof m === "number" ) ? m : 0;
        this._id;
        this._c;
    }
    Timer.prototype = new EventDispatcher();
    Timer.prototype._iv = function() {
        this.dispatchEvent("onTimer");
        this._c ++;
        if( this._c === this._m ){
        	this.stop();
        	this.dispatchEvent("onTimerComplete");
        }
    }
    /**
     * Starts the timer.
     */
    Timer.prototype.start = function() {
        this.stop();
        var that = this;
        this._id = window.setInterval( function(){ that._iv() }, this._t);
    }
    /**
 	 * Stops the timer; no events will be dispatched.
 	 */
    Timer.prototype.stop = function() {
        window.clearInterval(this._id);
        this._c = 0;
    }
    /**
 	 * Resets the timer; stops and restarts it; no additional event will be dispatched.
 	 */
    Timer.prototype.reset = function() {
        this.stop();
        this.start();
    }


    window.marcorei.tools.Timer = Timer;

})(window);