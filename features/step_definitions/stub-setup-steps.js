var stubReqDisp = require( "../stubs/stub-request-dispatcher" );
var stubPolDisp = require( "../stubs/stub-policy-dispatcher" );
var fs = require( "fs" );
var here = fs.realpathSync( "./features/step_definitions" );
var stubRenderer = require( "../stubs/stub-renderer" );

module.exports = function() {

	this.Given(/^the request\-dispatcher will return a response of$/, function(table, callback) {

		var responseJSON = table.raw()[ 0 ][ 0 ];
		stubReqDisp.setNextResponse( JSON.parse( responseJSON ) );
		callback();

	});

	this.Given(/^the stub policy dispatcher will pre\-empt request evaluation with a response$/, function(table, callback) {

		var responseJSON = table.raw()[ 0 ][ 0 ];
		var preemptiveResponse = JSON.parse( responseJSON );
		stubPolDisp.setNextResponse( preemptiveResponse );
		callback();

	});

	this.Given(/^the stub policy dispatcher will respond with an error$/, function(table, callback) {

		stubPolDisp.willReturnError( table.raw()[ 0 ][ 0 ] );
		callback();

	});

	this.Given(/^the stub request dispatcher will respond with an error$/, function(table, callback) {

		stubReqDisp.willReturnError( table.raw()[ 0 ][ 0 ] );
		callback();

	});

	this.Given(/^a stub renderer is configured named "([^"]*)"$/, function(stubName, callback) {

		this.config = this.config || { };
		var renderers = this.config.renderers = this.config.renderers || { };
		renderers[ "json" ] = here + "/../stubs/stub-renderer";
		callback();

	});

	this.Given(/^the stub renderer will respond with status code and content$/, function(table, callback) {

		var code = parseInt( table.raw()[ 0 ][ 0 ], 0 );
		var output = table.raw()[ 0 ][ 1 ];

		stubRenderer.setNextResponse( { "code": code, "output": output } );
		callback();

	});


};