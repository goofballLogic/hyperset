/* jslint node: true */
"use strict";

var requestDispatcher = require( "./../../src/dispatch/request-dispatcher" );
var utils = require( "./utils" );
var should = require( "chai" ).should();

module.exports = function() {

	this.Given(/^the request has a content\-type of "([^"]*)"$/, function( arg1, callback ) {

		this.req = this.req || { };
	});

	this.Given(/^the request has an accept header of "([^"]*)"$/, function( acceptHeader, callback ) {

		var req = this.externalRequest = this.externalRequest || { };
		var headers = req.headers = req.headers || { };
		headers[ "accept" ] = acceptHeader;
		callback();

	});

	this.Given(/^an internal request to view an item "([^"]*)" in collection "([^"]*)"$/, function( itemId, collectionName, callback ) {

		this.request = this.request || { };
		this.request[ "collectionName" ] = collectionName;
		this.request[ "id" ] = itemId;
		callback();

	});


	this.Given(/^an internal request to view a collection "([^"]*)"$/, function( collectionName, callback ) {

		this.request = this.request || { };
		this.request[ "collectionName" ] = collectionName;
		callback();

	});

	this.Given(/^an internal request to get an item or template with id "([^"]*)" in collection "([^"]*)"$/, function( itemId, collectionName, callback ) {

		this.request = this.request || { };
		this.request[ "id" ] = itemId;
		this.request[ "collectionName" ] = collectionName;
		this.request[ "command" ] = "get-or-template";
		callback();

	});

	this.Given(/^an internal request to "([^"]*)" a collection "([^"]*)"$/, function( command, collectionName, callback ) {

		this.request = this.request || { };
		this.request[ "collectionName" ] = collectionName;
		this.request[ "command" ] = command;
		callback();

	});

	this.Given(/^an internal request to "([^"]*)" an item$/, function( command, table, callback ) {

		var row = table.raw()[ 0 ];
		this.request = this.request || { };
		this.request[ "collectionName" ] = row[ 0 ];
		this.request[ "id" ] = row[ 1 ];
		if( row[ 2 ] )
			this.request[ "content" ] = JSON.parse( row[ 2 ] );
		this.request[ "command" ] = command;
		callback();

	});

	this.Given(/^an internal request with type "([^"]*)"$/, function(requestType, callback) {

		this.request = this.request || { };
		this.request.type = requestType;
		callback();

	});

	this.Given(/^an internal request to view the application$/, function(callback) {

		this.request = this.request || { };
		callback();

	});

	this.When(/^the stub application receives the request$/, function(callback) {

		this.app.receive( this.externalRequest, function( req, res ) {

			this.externalRequest = req;
			this.internalRequest = req.HSRequest;

			callback();

		}.bind( this ) );

	});

	this.Then(/^it should create an internal request$/, function(callback) {

		should.exist( this.internalRequest );
		callback();

	});

	this.Then(/^the internal request type should be "([^"]*)"$/, function(reqType, callback) {

		this.internalRequest.type.should.equal( reqType );
		callback();

	});

};