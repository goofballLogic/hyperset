var express = require( "express" );
var sa = require( "superagent" );
var http = require( "http" );

module.exports = function() {

	this.After( function( callback ) {

		if( this.server ) {

			this.server.close();
			delete this.server;

		}
		callback();

	} );

	this.Given(/^an express application on port "([^"]*)"$/, function( port, callback) {

		this.app = express();
		this.server = http.createServer( this.app );
		this.server.listen( parseInt( port, 0 ), callback );

	});

	this.When(/^a request is received by the application$/, function( table, callback ) {

		// after all other middleware executes, log the hyperset object
		this.app.use( function( req, res, next ) {

			this.hyperset = req.hyperset;
			next();

		}.bind( this ) );

		var bits = table.raw()[ 0 ];
		var verb = bits[ 0 ].toLowerCase();
		var url = bits[ 1 ];

		// create the request
		var req = sa[ verb ]( url );
		// send it
		req.end( function( err, res ) {

			// store the response
			this.lastResponse = res;
			callback();

		}.bind( this ) );

	});

	this.Then(/^the response should have a status code of "([^"]*)"$/, function( statusCode, callback) {

console.log( this.lastResponse );
		this.lastResponse.statusCode.should.equal( parseInt( statusCode, 0 ) );
		callback();

	});

};