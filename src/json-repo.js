/* jslint node: true */
"use strict";

( function( context ) {

	var fs = require( "fs" );

	context.Repo = Repo;

	function Repo( repoDir ) {

		repoDir = repoDir || process.env.PWD + "/hyperset-json-store";
		repoDir = repoDir.replace( /\/*$/, "" );

		return {

			"getCollections" : getCollections,
			"getCollection" : getCollection,
			"getItem" : getItem,
			"getItemOrTemplate" : getItemOrTemplate,
			"upsertItem" : upsertItem,
			"addCollection" : addCollection,
			"deleteCollection" : deleteCollection,
			"deleteItem" : deleteItem

		};

		function getCollections( callback ) {

			ensureRepoFolder( function( err ) {

				if( err ) return callback( err );
				fs.readdir( repoDir, function( err, files ) {

					var ret = files.map( function( item ) {

						return { "name" : item };

					} );

					var caught = null;
					if( ret.length > 0 ) {

						var latch = new Latch( ret.length, thenReturn );
						ret.forEach( function( item ) { findCollectionItems( item, thenCount ); } );

					} else {

						thenReturn();

					}

					function thenCount( err ) {

						if( err ) {

							caught = err;
							latch.bust();

						} else {

							latch.count();

						}

					}

					function thenReturn() {

						callback( caught, ret );

					}

				} );

			} );

		}

		function getCollection( collectionName, callback ) {

			var ret = { name: collectionName };
			findCollectionItems( ret, function( err ) {

				if( err ) callback( err );
				callback( null, ret );

			} );

		}

		function getItem( collectionName, itemId, callback ) {

			ensureRepoFolder( function( err ) {

				if( err ) callback( err );
				var filePath = itemPath( collectionName, itemId );
				fs.readFile( filePath, function( err, data ) {

					if( err ) callback( err );
					try {

						var parsed = JSON.parse( data );
						callback( null, parsed );

					} catch( e ) {

						callback( e );

					}

				} );

			} );

		}

		function getItemOrTemplate( collectionName, itemId, callback ) {

			var filePath = itemPath( collectionName, itemId );
			fs.exists( filePath, function( exists ) {

				if( exists ) getItem( collectionName, itemId, function( err, item ) {

					if( err ) callback( err );
					callback( null, item, true );

				} );
				else {

					callback( null, { "id" : itemId, "content" : null } );

				}

			} );

		}

		function addCollection( collectionName, callback ) {

			ensureRepoFolder( function( err ) {

				if( err ) return callback( err );
				fs.mkdir( repoDir + "/" + collectionName, callback );

			} );

		}

		function upsertItem( collectionName, item, callback ) {

			ensureRepoFolder( function( err ) {

				if( err ) return callback( err );
				if( !item.id ) item.id = uuid();
				var json = JSON.stringify( item );
				var filePath = itemPath( collectionName, item.id );

				fs.writeFile( filePath, json, function( err ) {

					if( err ) callback( err );
					getItem( collectionName, item.id, callback );

				} );

			} );

		}

		function deleteItem( collectionName, itemId, callback ) {

			ensureRepoFolder( function( err ) {

				if( err ) return callback( err );
				var filePath = itemPath( collectionName, itemId );
				fs.unlink( filePath, callback );

			} );

		}

		// recursive rmdir
		function recursiveRmDir(dirPath) {

			var files;
			try { files = fs.readdirSync(dirPath); }
			catch(e) { return; }
			if (files.length > 0)
				for (var i = 0; i < files.length; i++) {

					var filePath = dirPath + '/' + files[i];
					if (fs.statSync(filePath).isFile())
						fs.unlinkSync(filePath);
					else
						recursiveRmDir(filePath);

				}
			fs.rmdirSync(dirPath);

		}

		function deleteCollection( collectionName, callback ) {

			ensureRepoFolder( function( err ) {

				if( err ) return callback( err );
				recursiveRmDir( repoDir + "/" + collectionName );
				callback();

			} );

		}

		function ensureRepoFolder( callback ) {

			fs.exists( repoDir, function( exists ) {

				if( exists ) callback();
				else fs.mkdir( repoDir, callback );

			} );

		}

		function findCollectionItems( collection, callback ) {

			fs.readdir(  collectionPath( collection.name ), function( err, files ) {

				if( err ) return callback( err );
				collection.items = files.map( function( filename ) {

					return { id: filename.substring( 0, filename.length - 5 ) };

				} );
				callback();

			} );

		}

		function collectionPath( collectionName ) {

			return repoDir + "/" + collectionName;

		}

		function itemPath( collectionName, itemId ) {

			return collectionPath( collectionName ) + "/" + itemId + ".json";
		}

	}

	function Latch(countdown, callback) {

		this.count = function() { countdown--; if( countdown === 0 ) callback(); };
		this.bust = function() { if(countdown <= 0) return; countdown = 0; callback(); };

	}

	// thanks: http://stackoverflow.com/a/2117523
	function uuid() {

		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});

	}

} ( module.exports ) );