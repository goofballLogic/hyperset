var path = require( "path" );
var utils = require( "./utils" );
var should = require( "chai" ).should();
var fs = require( "fs" );

var repo = require( "../../src/repos/fs-repo" );

module.exports = function() {

	utils.specifyTimeout( this, 500 );

	this.When(/^I call addCollection for "([^"]*)"$/, function( collectionName, callback ) {

		this.repo.addCollection( collectionName, function( err, results ) {

			this.err = err;
			this.results = results;
			callback();

		}.bind( this ) );

	});

	this.When(/^I call deleteCollection for "([^"]*)"$/, function( collectionName, callback ) {

		this.repo.deleteCollection( collectionName, function( err ) {

			this.err = err;
			this.results = null;
			callback();

		}.bind( this ) );

	});

	this.Then(/^I should get an empty collection "([^"]*)" back$/, function( collectionName, callback ) {

		this.results.should.eql( {
			"name" : collectionName,
			"items" : [ ]
		} );
		callback();

	});

};