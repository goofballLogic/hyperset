var engine = require( "../../src/engine" );
var polDisp = require( "../stubs/stub-policy-dispatcher" );
var reqDisp = require( "../stubs/stub-request-dispatcher" );
var respDisp = require( "../stubs/stub-response-dispatcher" );

var should = require( "chai" ).should();

module.exports = function() {

	this.Given( /^an attached coordinator$/, function( callback ) {

		this.config.momento = "jonbrownisg-d";
		this.coordinator = new engine.Coordinator( this.config );
		this.app = { use: function( middleware ) { this.middleware = middleware; } };
		this.coordinator.attach( this.app );
		callback();

	} );

	this.When(/^the coordinator receives a request$/, function(table, callback) {

		var requestJSON = table.raw()[ 0 ][ 0 ];
		this.internalRequest = JSON.parse( requestJSON );
		this.app.middleware( null, { "HSRequest" : this.internalRequest }, { }, this.handleResponse( callback ) );

	});

	this.Then( /^the request dispatcher should be correctly configured$/, function( callback ) {

		var config = reqDisp.getConfiguration();
		should.exist( config, "config" );
		config.momento.should.equal( this.config.momento, "Correct configuration" );
		callback();

	} );

	function shouldHaveAllProps( expected, actual, mess ) {

		for(var key in expected) {

			actual.should.have.property( key );
			actual[ key ].should.eql( expected[ key ], mess = " ( " + key + " ) " );

		}

	}

	this.Then(/^the policy\-dispatcher should receive the request to dispatch$/, function(table, callback) {

		var expectedRequest = JSON.parse( table.raw()[ 0 ][ 0 ] );
		var lastCall = polDisp.getLastCall();
		lastCall.length.should.equal( 4, "policy dispatch argument count" );
		should.equal( lastCall[ 0 ], null, "err" );
		shouldHaveAllProps( expectedRequest, lastCall[ 2 ], "request" );
		callback();

	});

	this.Then(/^the request\-dispatcher should receive the request to dispatch$/, function(table, callback) {

		var expectedRequest = JSON.parse( table.raw()[ 0 ][ 0 ] );
		var lastCall = reqDisp.getLastCall();
		lastCall.length.should.equal( 2, "request-dispatch argument count" );
		shouldHaveAllProps( expectedRequest, lastCall[ 0 ], "request" );
		callback();

	});

	this.Then(/^the response\-dispatcher should receive a response to dispatch$/, function(table, callback) {

		var expectedRequest = JSON.parse( table.raw()[ 0 ][ 0 ] );
		var lastCall = respDisp.getLastCall();
		lastCall.length.should.equal( 4, "response-dispatch argument count" );
		var response = lastCall[ 1 ].response;
		shouldHaveAllProps( expectedRequest, response, "request" );
		callback();

	});

	this.Then(/^the request\-dispatcher should not receive a request$/, function(callback) {

		var lastCall = reqDisp.getLastCall();
		should.not.exist( lastCall );
		callback();

	});

};