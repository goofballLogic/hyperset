/* jslint node: true */
"use strict";

var NotFoundError = require( "../../src/errors/NotFoundError" );
var ConflictError = require( "../../src/errors/ConflictError" );

module.exports = {

	"Repo" : Repo,
	"addCollection" : addCollection,
	"addItem" : addItem,
	"getCollection" : getCollection

};

global.collections = { };

function addItem( collectionName, itemId, content ) {

	global.collections[ collectionName ].items[ itemId ] = content;

}

function addCollection( collection ) {

	global.collections[ collection.name ] = collection;

}

function getCollection( collectionName ) {

	return global.collections[ collectionName ];

}

function Repo() {

	// reinitialise the static repo
	global.collections = [];
	this.getItem = function( collectionName, itemId, callback ) {

		var collection = global.collections[ collectionName ];
		if( !collection ) {

			return callback( new ConflictError(), null );

		}
		var item = { "id" : itemId, "content" : collection.items[ itemId ] };
		if( !item ) {

			return callback( new NotFoundError(), null );

		} else {

			return callback( null, item );

		}

	};

	this.getCollection = function( collectionName, callback ) {

		var collection = global.collections[ collectionName ];
		if( !collection )
			return callback( new NotFoundError(), null );

		var items = [];
		for( var itemId in collection.items ) items.push( itemId );
		return callback( null, {
			"name" : collection.name,
			"items" : items
		} );

	};

	this.getItemOrTemplate = function( collectionName, itemId, callback ) {

		var collection = global.collections[ collectionName ];
		if( !collection )
			return callback( new ConflictError(), null, null );
		var isExistingItem = collection.items.hasOwnProperty( itemId );
		var content = collection.items[ itemId ];
		var item = buildTemplate( itemId );
		if( isExistingItem ) item.content = collection.items[ itemId ];
		return callback( null, item, isExistingItem );

	};

	function buildTemplate( id ) {

		return { "id" : id, "content" : null };

	}

	this.addCollection = function( collectionName, callback ) {

		global.collections[ collectionName ] = { items: [ ] };
		callback( null );

	};

	this.deleteCollection = function( collectionName, callback ) {

		delete global.collections[ collectionName ];
		callback( null );

	};

	this.upsertItem = function( collectionName, item, callback ) {

		global.collections[ collectionName ].items[ item.id ] = item.content;
		callback( null );

	};

	this.deleteItem = function( collectionName, itemId, callback ) {

		delete global.collections[ collectionName ].items[ itemId ];
		callback( null );

	}

}