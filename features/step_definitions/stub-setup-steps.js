var stubReqDisp = require( "../stubs/stub-request-dispatcher" );
var stubPolDisp = require( "../stubs/stub-policy-dispatcher" );
var fs = require( "fs" );
var stubRenderer = require( "../stubs/stub-renderer" );
var stubRepo = require( "../stubs/stub-repo" );
var should = require( "chai" ).should();

module.exports = function() {

	this.Given(/^the stub request\-dispatcher will return a response of$/, function(table, callback) {

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
		renderers[ "json" ] = __dirname + "/../stubs/stub-renderer";
		callback();

	});

	this.Given(/^the stub renderer will respond with status code and content$/, function(table, callback) {

		var code = parseInt( table.raw()[ 0 ][ 0 ], 0 );
		var output = table.raw()[ 0 ][ 1 ];

		stubRenderer.setNextResponse( { "code": code, "output": output } );
		callback();

	});

	this.Given(/^a stub policy dispatcher$/, function(callback) {

		this.config = this.config || { };
		this.config[ "policy-dispatcher" ] = __dirname + "/../stubs/stub-policy-dispatcher";
		callback();

	});

	this.Given(/^a stub response dispatcher$/, function(callback) {

		this.config = this.config || { };
		this.config[ "response-dispatcher" ] = __dirname + "/../stubs/stub-response-dispatcher";
		callback();

	});

	this.Given(/^a stub request dispatcher$/, function(callback) {

		this.config = this.config || { };
		this.config[ "request-dispatcher" ] = __dirname + "/../stubs/stub-request-dispatcher";
		callback();

	});

	this.Given( /^stub repository configuration is supplied$/, function( callback ) {

		this.config = this.config || { };
		this.config.repository = {

			"path" : __dirname + "/../stubs/stub-repo",
			"name" : "stub-repo"

		};
		callback();

	});

	this.Given( /^the stub repository has some collections$/, function( table, callback ) {

		table.raw().forEach( function( row ) {

			var collectionName = row[0];
			stubRepo.addCollection( {

				"name" : collectionName,
				"items" : []

			} );

		} );
		callback();

	});


	this.Given( /^the stub repository has some items$/, function( table, callback ) {

		table.raw().forEach( function( row ) {

			var collectionName = row[ 0 ];
			var itemId = row[ 1 ];
			var content = JSON.parse( row[ 2 ] );
			stubRepo.addItem( collectionName, itemId, content );

		} );
		callback();

	} );


	this.Then(/^a collection "([^"]*)" "([^"]*)" exist in the stub repository$/, function( collectionName, shouldOrShouldNot, callback ) {

		var actual = stubRepo.getCollection( collectionName );
		if( shouldOrShouldNot == "should" ) {

			should.exist( actual );

		} else {

			should.not.exist( actual );

		}
		callback();

	} );


	this.Then(/^an item "([^"]*)" exist in the stub repository$/, function( shouldOrShouldnt, table, callback ) {

		var expected = table.raw()[ 0 ];
		var collectionName = expected[ 0 ];
		var expectedId = expected[ 1 ];
		var collection = stubRepo.getCollection( collectionName );

		if( shouldOrShouldnt == "should" ) {

			var expectedContent = JSON.parse( expected[ 2 ] );
			should.exist( collection, "collection" );
			should.exist( collection.items[ expectedId ], "item" );
			collection.items[ expectedId ].should.eql( expectedContent );

		} else {

			should.not.exist( collection.items[ expectedId ] );

		}
		callback();

	});

	this.Given(/^a stub application$/, function(callback) {

		this.app = this.app || { };
		this.app.use = function( middleware ) {

			this.middleware = this.middleware || [];
			this.middleware.push( middleware );

		}.bind( this );
		this.app.receive = function( req, callback ) {

			var handlers =  Array.prototype.slice.call( (this.middleware || []), 0 );
			var handler = handlers.shift();
			var res = null;
			if( handler.length == 2 ) {

				handler( req, res );
				callback( req, res );

			} else if( handler.length == 3 ) {

				handler( req, res, callback );

			} else {

				handler( null, req, res, callback );

			}

		}.bind( this );

		callback();

	});

};