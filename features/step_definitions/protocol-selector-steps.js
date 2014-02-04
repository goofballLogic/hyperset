var ps = require( "../../src/protocol-selector" );

module.exports = function() {

	this.Given(/^a protocol\-selector attached to the application$/, function(callback) {

		new ps.ProtocolSelector( this.config ).attach( this.app );
		callback();

	});

};