/* jslint node: true */
"use strict";

// a countdown latch which given a specified number of calls to "count", executes the onSuccess handler
// a call to "bust" will immediately execute the onFailure handler
// only one of the two callbacks will ever be called, and that only once.
module.exports = function( latchCount, onSuccess, onFailure ) {

	this.dispose = function() {

		this.bust = this.count = function() { };

	}.bind(this);

	this.bust = function( err ) {

		latchCount = 0;
		this.dispose();
		onFailure( err );

	}.bind(this);

	this.count = function() {

		if( (--latchCount) > 0 ) return;
		this.dispose();
		onSuccess();

	}.bind(this);

	if( latchCount === 0) {

		this.dispose();
		onSuccess();

	}

};