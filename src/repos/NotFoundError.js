/* jslint node: true */
"use strict";

module.exports = NotFoundError;

NotFoundError.prototype = Object.create( Error.prototype );
function NotFoundError() {

	var err = Error.apply(this, arguments);
	this.message = err.message;
	this.stack = err.stack;
	this.code = 404;

}