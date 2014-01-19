var path = require( "path" );
var utils = require( "./utils" );
var should = require( "chai" ).should();
var fs = require( "fs" );

var repo = require( "../../src/repos/fs-repo" );

module.exports = function() {

	utils.specifyTimeout( this, 500 );

	this.After( function( callback ) {

		utils.ensureNoDir( "./temp", callback );

	} );

	this.Given(/^some empty collections on disk$/, function(table, callback) {

		var root = "./temp/test-fs-repo";
		this.config = { "root" : root };
		this.existingCollections = table.raw().map( function( x ) { return x[ 0 ]; } );
		var args = this.existingCollections.map( function( x ) {

			return path.join( root, x );

		} );
		args.unshift( root );
		args.push( callback );
		utils.ensureCleanDirs.apply( this, args );

	});

	this.Given(/^a repo object is instantiated$/, function(callback) {

		this.repo = new repo.Repo( this.config );
		callback();

	});


	function addItems( collectionPath, items, onComplete ) {

		if( items.length === 0 ) return onComplete();
		var item = items.pop();
		fs.writeFile( path.join( collectionPath, item[ 0 ] ), item[ 1 ], function( err ) {

			if( err ) return onComplete( err );
			// else
			addItems( collectionPath, items, onComplete );

		} );

	}

	this.Given(/^some items in the "([^"]*)" collection$/, function(collectionName, table, callback) {

		var collectionPath = path.join( this.config.root, collectionName );
		addItems( collectionPath, table.raw(), callback );

	});

	this.When(/^I call getCollections$/, function(callback) {

		this.repo.getCollections( function( err, results ) {

			this.results = results;
			callback( err );

		}.bind( this ) );

	});

	this.When(/^I call getCollection for "([^"]*)"$/, function( collectionName, callback ) {

		this.repo.getCollection( collectionName, function( err, results ) {

			this.err = err;
			this.results = results;
			callback();

		}.bind( this ) );

	});

	this.When(/^I call getItem for item "([^"]*)" in collection "([^"]*)"$/, function(itemId, collectionName, callback) {

		this.repo.getItem( collectionName, itemId, function( err, results ) {

			this.err = err;
			this.results = results;
			callback();

		}.bind( this ) );

	});

	this.When(/^I call getItemOrTemplate for item "([^"]*)" in collection "([^"]*)"$/, function(itemId, collectionName, callback) {

		this.repo.getItemOrTemplate( collectionName, itemId, function( err, item ) {

			this.err = err;
			this.results = item;
			callback();

		}.bind( this ) );

	} );

	this.Then(/^I should get a list of the items back$/, function(table, callback) {

		var itemIds = table.raw()[0];
		this.results.items.should.have.members( itemIds );
		callback();

	});

	this.Then(/^I should get a NotFoundError back$/, function(callback) {

		this.err.code.should.equal( 404 );
		callback();

	} );

	this.Then(/^I should see a list of the existing collections$/, function(callback) {

		this.results.should.have.members( this.existingCollections );
		callback();

	});

	this.Then(/^I should get a ConflictError back$/, function(callback) {

		this.err.code.should.equal( 409 );
		callback();

	});

	this.Then(/^I should get the item back$/, function(table, callback) {

		should.exist( this.results, "results" );
		var item = table.raw()[0];

		this.results.should.eql( {

			id : item[ 0 ],
			content: JSON.parse( item[ 1 ] )

		} );
		callback();

	});

	this.Then(/^I should get back a template with itemId "([^"]*)"$/, function(itemId, callback) {

		should.exist( this.results, "results" );
		this.results.should.eql( {
			"id" : itemId,
			"content" : null
		} );
		callback();

	});

};