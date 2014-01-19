/* jslint node: true */
"use strict";

var fs = require( "fs" );
var path = require( "path" );
var CDL = require( "./CDL" );
var NotFoundError = require( "./NotFoundError" );
var ConflictError = require( "./ConflictError" );
var generators = require( "./generators" );
var rr = require( "rimraf" );

/*
	Using revealing module pattern here. Only one of these objects is likely to be instantiated,
	so I'm not worried about functions being duplicated.
*/

module.exports.Repo = Repo;

function Repo( config ) {

	if( !config ) throw new Error( "No configuration supplied" );
	var root = config.root;
	if( !root ) throw new Error( "No root directory specified in configuration" );
	root = path.resolve( root );

	// public API for the repo
	return {
		// queries
		"getCollections" : repoGetCollections,
		"getCollection" : repoGetCollection,
		"getItem" : repoGetItem,
		"getItemOrTemplate" : repoGetItemOrTemplate,
		// commands
		"addCollection" : repoAddCollection,
		"deleteCollection" : repoDeleteCollection,
		"upsertItem" : repoUpsertItem,
		"deleteItem" : repoDeleteItem
	};

	function repoGetCollections( callback ) {

		// list of directories
		var ret = [];
		var succeed = succeedFor(ret, callback);
		forEachFile( root, function( file, stats, next ) {

			if( stats.isDirectory() ) ret.push( file );
			next();

		}, succeed, callback );

	}

	function repoGetCollection( collectionName, callback ) {

		// list of items in a directory
		var ret = {

			name: collectionName,
			items: [ ]

		};
		var succeed = succeedFor(ret, callback);
		var collectionPath = path.join( root, collectionName );

		forEachFile( collectionPath, function( file, stats, next ) {

			if( stats.isFile() ) ret.items.push( file );
			next();

		}, succeed, callback );

	}

	function repoGetItem( collectionName, itemId, callback ) {

		var ret = {

			id: itemId,
			content: null

		};
		var succeed = succeedFor(ret, callback);
		var collectionPath = path.join( root, collectionName );

		var collection = repoGetCollection( collectionName, function( err, coll ) {

			// collection not found
			if ( err instanceof NotFoundError )
				return callback( new ConflictError( "Collection not found" ) );

			// other error
			if ( err ) return callback( err );

			fs.readFile( path.join( root, collectionName, itemId ), "utf8", function( err, data ) {

				// collection found, item not found
				if( err ) return callback( recognise( err ) );

				// item
				ret.content = JSON.parse( data );
				succeed();

			} );

		} );

	}

	function repoGetItemOrTemplate( collectionName, itemId, callback ) {

		repoGetItem( collectionName, itemId, function( err, item ) {

			if( err && err instanceof NotFoundError ) {

				// repoGetItem returns NotFoundError
				callback( null, { id: itemId, content: null } );

			} else {

				// repoGetItem returns anything other than NotFoundError
				callback( err, item );

			}

		} );

	}

	function repoAddCollection( collectionName, callback ) {

		var collectionPath = path.join( root, collectionName );
		fs.mkdir( collectionPath, function( err ) {

			if( !err ) return callback(); // success
			if( err.code == "EEXIST" ) return callback( new ConflictError( "Collection already exists" ) );
			callback( err );

		} );

	}

	function repoDeleteCollection( collectionName, callback ) {

		var collectionPath = path.join( root, collectionName );
		fs.stat( collectionPath, function( err, stats ) {

			if( err ) {

				if( err.code == "ENOENT" ) return callback( new NotFoundError( "Collection not found" ) );
				return callback( err ); // unknown error

			}
			rr( collectionPath, callback ); // ok do it

		} );

	}

	function repoUpsertItem( collectionName, item, callback ) {

		var collectionPath = path.join( root, collectionName );
		repoGetCollection( collectionName, function( err, collection ) {

			if( err ) {

				if( err instanceof NotFoundError ) return callback( new ConflictError( "Collection not found" ) );
				return callback( err ); // unknown error

			}

			// get or make id
			var id = item.id || generators.uuid();

			var itemPath = path.join( collectionPath, id );
			// create/overwrite the item
			fs.writeFile( itemPath, JSON.stringify( item ), function( err ) {

				if( err ) return callback( err ); // unkonwn error
				repoGetItem( collectionName, id, callback );

			} );

		} );

	}

	function repoDeleteItem( collectionName, itemId, callback ) {

		// collection does not exist
		callback( new ConflictError() );

		// collection exists, item does not
		callback( new NotFoundError() );

		// item was deleted
		callback();

	}

}

// curries the return variable for callback success
function succeedFor( ret, callback ) {

	return function() { callback( null, ret ); };

}

function recognise( err ) {

	if( err && err.code == "ENOENT" )
		return new NotFoundError( "Not found" );
	return err;

}

// iterates through the files in a given directory, calling back onEach with ( name, stats ) for each.
// if an error occurs, onFailure will be called
// otherwise, when the iteration is complete, onSuccess will be called
function forEachFile( dirpath, onEach, onSuccess, onFailure ) {

	fs.readdir( dirpath, function( err, files ) {

		if( err ) return onFailure( recognise( err ) );

		var latch = new CDL( files.length, onSuccess, onFailure );

		files.forEach( function( file ) {

			fs.stat( path.join(dirpath, file), function( err, stats ) {

				if( err ) return latch.bust( recognise( err ) );
				onEach( file, stats, latch.count );

			} );

		} );

	} );

}