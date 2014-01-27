var rdModule = require( "../../src/dispatch/response-dispatcher" );
var stubRenderer = require( "../stubs/stub-renderer" );
var should = require( "chai" ).should();

module.exports = function() {

	this.Given(/^a response dispatcher is instantiated$/, function(callback) {

		this.config = this.config || { };
		this.responseDispatcher = new rdModule.Dispatcher( this.config );
		callback();

	});

	this.When(/^the response\-dispatcher receives the internal request$/, function(callback) {

		var mockRes = this.mockAppRes = { send: function() { mockRes.lastCall = arguments; } };
		this.responseDispatcher.dispatch( null, this.request, mockRes, callback );

	});

	this.Then(/^it should set the item\-type to "([^"]*)"$/, function(itemType, callback) {

		this.request.response[ "item-type" ].should.equal( itemType );
		callback();

	});

	this.Then(/^it should dispatch the response to the JSON renderer$/, function(callback) {

		var sent = this.mockAppRes.lastCall;
		(function() { JSON.parse( sent[ 1 ] ); }).should.not.throw();
		callback();

	});

	this.Then(/^it should dispatch the response to the stub renderer$/, function(callback) {

		should.exist( stubRenderer.getLastCall() );
		callback();

	});

	this.Then(/^it should send a response with status code and content$/, function(table, callback) {

		var expectedCode = parseInt( table.raw()[ 0 ][ 0 ], 0 );
		var expectedOutput = table.raw()[ 0 ][ 1 ];

		var sent = this.mockAppRes.lastCall;
		sent[ 0 ].should.equal( expectedCode, "code" );
		sent[ 1 ].should.equal( expectedOutput, "output" );
		callback();

	});

};