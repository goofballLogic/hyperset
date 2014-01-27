/* jslint node: true */
"use strict";

var requestDispatcher = require( "./../../src/dispatch/request-dispatcher" );
var utils = require( "./utils" );
var should = require( "chai" ).should();

module.exports = function() {

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

};