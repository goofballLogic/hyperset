var protocolModule = require( "../../src/protocol" );

module.exports = function() {


	this.When(/^the protocol is instantiated$/, function(callback) {

		this.protocol = new protocolModule.Protocol( this.config, this.app );
		callback();

	});

	this.Then(/^it should have a hyperset "([^"]*)" of "([^"]*)"$/, function( key, value, callback) {

		this.hyperset[ key ].should.equal( value, key );
		callback();

	});

	this.Then(/^the hyperset "([^"]*)" function should return "([^"]*)" when called with$/, function( funcName, expectedResult, table, callback) {

		var result = this.hyperset[ funcName ].apply( this, table.raw()[ 0 ] );
		result.should.equal( expectedResult, funcName );
		callback();

	});

};