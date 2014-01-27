/* jslint node: true */
"use strict";

var utils = require( "./utils" );
var should = require( "chai" ).should();
var fs = require( "fs" );
var here = fs.realpathSync( "./features/step_definitions" );
var repo = require( "../stubs/stub-repo" );

module.exports = function() {

	this.Given(/^a stub policy dispatcher$/, function(callback) {

		this.config = this.config || { };
		this.config[ "policy-dispatcher" ] = here + "/../stubs/stub-policy-dispatcher";
		callback();

	});

	this.Given(/^a stub response dispatcher$/, function(callback) {

		this.config = this.config || { };
		this.config[ "response-dispatcher" ] = here + "/../stubs/stub-response-dispatcher";
		callback();

	});

	this.Given(/^a stub request dispatcher$/, function(callback) {

		this.config = this.config || { };
		this.config[ "request-dispatcher" ] = here + "/../stubs/stub-request-dispatcher";
		callback();

	});

	this.Given( /^repository configuration is supplied$/, function( callback ) {

		this.config = this.config || { };
		this.config.repository = {

			"path" : here + "/../stubs/stub-repo",
			"name" : "stub-repo"

		};
		callback();

	});

	this.Given( /^the configured repository has some collections$/, function( table, callback ) {

		table.raw().forEach( function( row ) {

			var collectionName = row[0];
			repo.addCollection( {

				"name" : collectionName,
				"items" : []

			} );

		} );

		callback();

	});

	this.Given( /^the configured repository has some items$/, function( table, callback ) {

		table.raw().forEach( function( row ) {

			var collectionName = row[ 0 ];
			var itemId = row[ 1 ];
			var content = JSON.parse( row[ 2 ] );
			repo.addItem( collectionName, itemId, content );

		} );
		callback();

	} );

	this.Given(/^a rendererMapping configuration$/, function(table, callback) {

		var mapping = table.raw()[ 0 ];
		this.config = this.config || { };
		this.config.rendererMapping = { };
		this.config.rendererMapping[ mapping[ 0 ] ] = mapping[ 1 ];
		callback();

	});

	this.Then(/^a collection "([^"]*)" "([^"]*)" exist$/, function( collectionName, shouldOrShouldNot, callback ) {

		var actual = repo.getCollection( collectionName );
		if( shouldOrShouldNot == "should" ) {

			should.exist( actual );

		} else {

			should.not.exist( actual );

		}
		callback();

	} );

	this.Then(/^an item "([^"]*)" exist$/, function( shouldOrShouldnt, table, callback ) {

		var expected = table.raw()[ 0 ];
		var collectionName = expected[ 0 ];
		var expectedId = expected[ 1 ];
		var collection = repo.getCollection( collectionName );

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

};