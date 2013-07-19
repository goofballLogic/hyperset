var util = require( "util" );

module.exports = {
	"Repo" : Repo
};

util.inherits( NotFoundError, Error );
function NotFoundError( message ) {

	Error.captureStackTrace( this, NotFoundError );
	this.message = message || "Error";
	this.code = 404;

}

function Repo() {

	// inspect
	this.getCollections = getCollections;
	this.getCollection = getCollection;
	this.getItem = getItem;
	this.getItemOrTemplate = getItemOrTemplate;
	// mutate
	this.addCollection = addCollection;
	this.upsertItem = upsertItem;
	this.deleteItem = deleteItem;

	var collections = { };

	function findCollection( collectionName, callback ) {

		var collection = collections[ collectionName ];
		if( !collection ) return callback( new NotFoundError( "Collection does not exist") );
		callback( null, collection );

	}

	function addCollection( collection, callback ) {

		collections[ collection.name ] = clone( collection );
		getCollection( collection.name, callback );

	}

	function upsertItem( collectionName, item, callback ) {

		findCollection( collectionName, function( err, collection ) {

			if(err) return callback( err );

			collection.items = collection.items || { };
			var newItem = { };
			for( var k in item ) newItem[ k ] = item[ k ];
			newItem.id = newItem.id || generateUUID();
			collection.items[ newItem.id ] = newItem;

			getItem( collectionName, newItem.id, callback );

		} );

	}

	function getCollections( callback ) {

		var ret = [];
		var collectionNames = Object.keys( collections );
		var latch = new Latch( collectionNames.length, function() {

			callback( null, ret );

		} );
		collectionNames.forEach( function( name ) {

			getCollection( name, function( err, collection ) {

				if( err ) {
					callback( err );
					callback = new Function();
				}
				ret.push( collection );
				latch.countdown();

			} );

		} );

	}

	function getCollection( collectionName, callback ) {

		findCollection( collectionName, function( err, collection ) {

			if( err ) return callback( err );

			var ret = clone( collection );
			ret.items = Object.keys( ret.items || { } ).map( function( itemId ) { return { "id" : itemId }; } );
			callback( null, ret );

		} );

	}

	function getItem( collectionName, itemId, callback ) {

		findCollection( collectionName, function( err, collection ) {

			if( err ) return callback( err );
			if( !( itemId in ( collection.items || { } ) ) )
				return callback( new NotFoundError( "Item does not exist" ) );
			callback( null, clone( collection.items[ itemId ] ) );

		} );

	}

	function getItemOrTemplate( collectionName, itemId, callback ) {

		findCollection( collectionName, function( err, collection ) {

			if( err ) return callback( err );
			var exists = itemId in ( collection.items || { } );
			var ret = exists ? collection.items[ itemId ] : { id: itemId };
			callback( null, clone( ret ), exists );

		} );

	}

	function deleteItem( collectionName, itemId, callback ) {

		findCollection( collectionName, function( err, collection ) {

			if( err ) return callback( err );
			if( !( itemId in ( collection.items || { } ) ) )
				return callback( new NotFoundError( "Item does not exist") );

			delete collection.items[ itemId ];
			callback( null );

		} );

	}
}

function Latch( countdown, done ) { if(countdown===0) done(); this.countdown = function() { if(--countdown === 0) done(); }; }

function clone( jsonObject ) {

	return JSON.parse( JSON.stringify( jsonObject ) );

}

function generateUUID() {

	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function( c ) {

		var r = Math.random() * 16 | 0, v = c == 'x' ? r : ( r & 0x3 | 0x8);
		return v.toString( 16 );

	} );

}