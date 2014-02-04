var coordinator = require( "../../src/coordinator" );
var polDisp = require( "../stubs/stub-policy-dispatcher" );
var reqDisp = require( "../stubs/stub-request-dispatcher" );
var respDisp = require( "../stubs/stub-response-dispatcher" );
var utils = require( "./utils" );

var should = require( "chai" ).should();

module.exports = function() {

	this.Given( /^an attached coordinator$/, function( callback ) {

		this.config.momento = "jonbrownisg-d";
		this.coordinator = new coordinator.Coordinator( this.config );
		this.app = { use: function( middleware ) { this.middleware = middleware; } };
		this.coordinator.attach( this.app );
		callback();

	} );

	this.When(/^the coordinator receives a request$/, function(table, callback) {

		var requestJSON = table.raw()[ 0 ][ 0 ];
		this.internalRequest = JSON.parse( requestJSON );
		this.app.middleware( null, { "HSRequest" : this.internalRequest }, { }, this.handleResponse( callback ) );

	});

	this.When(/^the coordinator receives a request without an internal request$/, function(callback) {

		this.app.middleware( null, { }, { }, this.handleResponse( callback ) );

	});

	this.Then(/^it should call next with an error$/, function(callback) {

		this.lastArguments[ 0 ].should.be.instanceOf( Error );
		callback();

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

	this.Then(/^the request\-dispatcher should not receive a request$/, function(callback) {

		var lastCall = reqDisp.getLastCall();
		should.not.exist( lastCall );
		callback();

	});

	this.Then(/^the response object after coordinator is finished should include$/, function(table, callback) {

		var actual = this.internalRequest.response;
		var expected =  JSON.parse( table.raw()[ 0 ] );

		var compMess = utils.compMess( actual, expected );

		for( var prop in expected ) {

			actual[ prop ].should.eql( expected[ prop ], expected[ prop ], compMess );

		}

		callback();

	});

};