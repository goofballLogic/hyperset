/* jslint node: true */
"use strict";

var requestDispatcher = require( "./../../src/dispatch/request-dispatcher" );
var utils = require( "./utils" );
var should = require( "chai" ).should();

module.exports = function() {

	this.Given(/^a request\-dispatcher has been instantiated$/, function( callback ) {

		this.requestDispatcher = new requestDispatcher.Dispatcher( this.config );
		callback();

	});

	this.When(/^the request is dispatched to the request\-dispatcher$/, function( callback ) {

		this.requestDispatcher.dispatch( this.request, this.handleResponse( callback ) );

	});


};