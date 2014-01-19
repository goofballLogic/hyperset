var path = require( "path" );
var utils = require( "./utils" );
var should = require( "chai" ).should();
var fs = require( "fs" );

var repo = require( "../../src/repos/fs-repo" );

module.exports = function() {

	utils.specifyTimeout( this, 500 );
	utils.buildHandleResponse( this );

	this.When(/^I call addCollection for "([^"]*)"$/, function( collectionName, callback ) {

		this.repo.addCollection( collectionName, this.handleResponse( callback ) );

	});

	this.When(/^I call deleteCollection for "([^"]*)"$/, function( collectionName, callback ) {

		this.repo.deleteCollection( collectionName, this.handleResponse( callback ) );

	});

	this.When(/^I call upsertItem$/, function(table, callback) {

		var details = table.raw()[ 0 ];
		var item = { "id" : details[ 1 ], "content" : JSON.parse( details [ 2 ] ) };
		var collectionName = details[ 0 ];
		this.repo.upsertItem( collectionName, item, this.handleResponse( callback ) );

	});

	this.When(/^I call getItem with the returned if for collection "([^"]*)"$/, function(collectionName, callback) {

		var upsertItemId = this.results.id;
		this.repo.getItem( collectionName, upsertItemId, this.handleResponse( callback ) );

	});

	this.When(/^I call deleteItem for item "([^"]*)" in collection "([^"]*)"$/, function(itemId, collectionName, callback) {

		this.repo.deleteItem( collectionName, itemId, this.handleResponse( callback ) );

	});

	this.Then(/^I should get an empty collection "([^"]*)" back$/, function( collectionName, callback ) {

		this.results.should.eql( {
			"name" : collectionName,
			"items" : [ ]
		} );
		callback();

	});

};