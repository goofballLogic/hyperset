/* jslint node: true */
"use strict";

var utils = require( "./utils" );
var should = require( "chai" ).should();

module.exports = function() {

	this.Given(/^a rendererMapping configuration$/, function(table, callback) {

		var mapping = table.raw()[ 0 ];
		this.config = this.config || { };
		this.config.rendererMapping = { };
		this.config.rendererMapping[ mapping[ 0 ] ] = mapping[ 1 ];
		callback();

	});

	this.Given(/^configuration with appUrl of "([^"]*)"$/, function( appUrl, callback ) {

		this.config = this.config || { };
		this.config.appUrl = appUrl;
		callback();

	});

	this.Given(/^configuration with application name of "([^"]*)"$/, function( appName, callback) {

		this.config = this.config || { };
		this.config.name = appName;
		callback();

	});

	this.Given(/^a protocol configuration$/, function(callback) {

		this.config = this.config || { };
		this.config.protocols = [

			__dirname + "/../stubs/mock-protocol"

		];
		callback();

	});

	this.Given(/^a protocolMapping configuration$/, function(callback) {

		this.config = this.config || { };
		this.config.protocolMapping = [

			[ "mock", ".*mock.*" ]

		];
		callback();

	});

};