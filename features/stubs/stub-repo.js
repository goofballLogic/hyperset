/* jslint node: true */
"use strict";

var NotFoundError = require( "../../src/errors/NotFoundError" );
var ConflictError = require( "../../src/errors/ConflictError" );

module.exports = {

	"Repo" : Repo,
	"addCollection" : addCollection,
	"addItem" : addItem,
	"getCollection" : getCollection,
	"getConfiguration" : getConfiguration,
	"getLastCall" : getLastCall

};

global.collections = { };

function getLastCall() {

	return global.stubRepoLastCall;

}

function addItem( collectionName, itemId, content ) {

	global.collections[ collectionName ].items[ itemId ] = content;

}

function addCollection( collection ) {

	global.collections[ collection.name ] = collection;

}

function getCollection( collectionName ) {

	return global.collections[ collectionName ];

}

function getConfiguration() {

	return global.stubRepoConfiguration;

}

function setLastCall( op, arg1, argN ) {

	var args = Array.prototype.slice.call( arguments, 0 );
	global.stubRepoLastCall = { "op" : args.shift(), "args" : args };

}

function Repo( config ) {
	delete global.stubRepoLastCall;
	global.stubRepoConfiguration = config;

	// reinitialise the static repo
	global.collections = [];
	this.getItem = function( collectionName, itemId, callback ) {
		setLastCall( "get-item", collectionName, itemId );

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
		setLastCall( "get-collection", collectionName );

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
		setLastCall( "get-item-or-template", collectionName, itemId );

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
		setLastCall( "add-collection", collectionName );

		global.collections[ collectionName ] = { items: [ ] };
		callback( null );

	};

	this.deleteCollection = function( collectionName, callback ) {
		setLastCall( "delete-collection", collectionName );

		delete global.collections[ collectionName ];
		callback( null );

	};

	this.upsertItem = function( collectionName, item, callback ) {
		setLastCall( "upsert-item", collectionName, JSON.parse( JSON.stringify( item ) ) );

		global.collections[ collectionName ].items[ item.id ] = item.content;
		callback( null );

	};

	this.deleteItem = function( collectionName, itemId, callback ) {
		setLastCall( "delete-item", collectionName, itemId );

		delete global.collections[ collectionName ].items[ itemId ];
		callback( null );

	};

}