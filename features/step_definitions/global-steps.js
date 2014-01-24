/* jslint node: true */
"use strict";

var utils = require( "./utils" );

module.exports = function() {

	utils.specifyTimeout( this, 500 );
	utils.buildHandleResponse( this );
	utils.setStackSize( 10 );

};