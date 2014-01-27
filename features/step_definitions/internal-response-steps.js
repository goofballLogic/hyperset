/* jslint node: true */
"use strict";

var requestDispatcher = require( "./../../src/dispatch/request-dispatcher" );
var utils = require( "./utils" );
var should = require( "chai" ).should();

module.exports = function() {

	this.Given(/^an internal response on the request of$/, function(table, callback) {

		var request = this.request = this.request || { };
		request.response = JSON.parse( table.raw()[ 0 ][ 0 ] );
		callback();

	});

	this.Then( /^the result should have a response containing$/, function( table, callback ) {

		table.raw().forEach( function( row ) {

			var propName = row[ 0 ];
			var expected = JSON.parse( row[ 1 ] );

			var actual = this.results.response;
			should.exist( actual[ propName ] );
			actual[ propName ].should.eql( expected );

		}.bind( this ) );
		callback();

	} );

	this.Then(/^the result should be an error$/, function( callback ) {

		should.exist( this.err );
		callback();

	});


	this.Then(/^the result should have a response containing an item template$/, function( callback ) {

		should.exist( this.results.response.itemOrTemplate );
		should.exist( this.results.response.itemOrTemplate.id, "id");
		should.equal( this.results.response.itemOrTemplate.content, null );
		callback();

	} );

};