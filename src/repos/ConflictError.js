/* jslint node: true */
"use strict";

module.exports = ConflictError;

ConflictError.prototype = Object.create( Error.prototype );
function ConflictError() {

	var err = Error.apply(this, arguments);
	this.message = err.message;
	this.stack = err.stack;
	this.code = 409;

}