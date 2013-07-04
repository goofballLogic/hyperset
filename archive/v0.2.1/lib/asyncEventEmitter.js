var events = require("events");

(function(context) {

	// when an event is emitted, it should step through each event handler, calling each handler in turn before calling the callback
	context.AsyncEventEmitter = function() {
		var listeners = {};
		this.on = function(evt, listener) {
			if(!listeners.hasOwnProperty(evt)) listeners[evt] = [];
			listeners[evt].push(listener);
		};
		this.emit = function(evt, arg1, argN, callback) {
			// event to emit
			if(arguments.length<1) throw new Error("No event specified");
			var args = Array.prototype.slice.call(arguments, 0);
			evt = args.shift();
			
			// callback?
			callback = (typeof args[args.length-1] == "function") ? args.pop() : function() { };
			
			// listeners?
			if(listeners.hasOwnProperty(evt)) {
				var handlers = listeners[evt];
				callChain(handlers, this, args, callback);
			} else {
				// callback for no listeners
				callback();
			}
		};
	};

	function callChain(handlers, context, callArgs, onComplete) {
		if(handlers.length === 0) onComplete();
		else {
			handlers = handlers.slice(0);
			var handler = handlers.shift();
			var args = callArgs.slice(0);
			args.push(function() { callChain(handlers, context, callArgs, onComplete); });
			handler.apply(this, args);
		}
	}


})(module.exports);