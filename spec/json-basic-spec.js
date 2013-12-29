var should = require( "chai" ).should();
var utils = require( "./utilities" );
var cheerio = require( "cheerio" );

describe( "Given an app and default content type request of application/json", function() {

	beforeEach( function( ) {

		utils.configureRepo( this );
		utils.configureWidgets( this );
		utils.configureForJSON( this );
		utils.configurePolicy( this, "open-door" );

	} );

	var itAlso = {

		returnsA200OK: function() {

			it( "returns a 200 OK", function() {

				this.res.statusCode.should.equal( 200 );

			} );

		},
		returnsA201Created: function() {

			it( "returns a 201 Created", function() {

				this.res.statusCode.should.equal( 201 );
				this.res.body.should.equal( "Created" );

			} );

		},
		returnsA204NoContent: function() {

			it( "returns a 204 No Content", function() {

				this.res.statusCode.should.equal( 204 );
				should.not.exist( this.res.body );

			} );

		},
		returnsAnItem: function( content ) {

			it( "it returns the item with id", function() {

				if( this.itemId )
					this.res.json.id.should.equal( this.itemId );
				else
					this.res.json.id.length.should.be.gt( 1 );

			} );

			it( "it returns the item with an app link", function() {

				var link = utils.firstLink( this.res.json, "app" );
				should.exist( link );
				link.href.should.equal( this.config.appUrl );
				link.name.should.equal( this.config.name );
				link.type.should.equal( "application/vnd.hyperset.application+json" );

			} );

			it( "it returns the item with a self link", function() {

				var link = utils.firstLink( this.res.json, "self" );
				should.exist( link );
				link.href.should.equal( this.itemURL );
				link.name.should.equal( this.itemId || this.res.json.id );
				link.type.should.equal( "application/vnd.hyperset.item+json" );
				link.verbs.should.contain( "GET" );
				link.verbs.should.contain( "PUT" );
				link.verbs.should.contain( "DELETE" );
				link.verbs.length.should.equal( 3 );

			} );

			it( "it returns the item with a collection link", function() {

				var link = utils.firstLink( this.res.json, "collection" );
				should.exist( link );
				link.href.should.equal( this.collectionURL );
				link.name.should.equal( this.collectionName );
				link.type.should.equal( "application/vnd.hyperset.collection+json" );
				link.verbs.should.contain( "GET" );
				link.verbs.should.contain( "DELETE" );
				link.verbs.length.should.equal( 2 );

			} );

			it( "it returns the item with the stored content", function() {

				this.res.json.content.should.equal( content );

			} );

		}
	};

	describe( "When the entry point is requested", function() {

		beforeEach( function(done) {

			utils.behaviours.runThenRequest( this, this.config.appUrl, done );

		} );

		itAlso.returnsA200OK();

		it( "it returns application/vnd.hyperset.application+json content", function() {

			this.res.headers[ "content-type" ].should.contain( "application/vnd.hyperset.application+json" );

		} );

		it( "it has the app name", function() {

			this.res.json.name.should.equal( "Widgets" );

		} );

		it( "it has a self link with correct url, name and type", function() {

			var link = utils.first( this.res.json.links, { "rel" : "self" } );
			link.href.should.equal( this.config.appUrl );
			link.name.should.equal( "Widgets" );
			link.type.should.equal( "application/vnd.hyperset.application+json" );

		} );

		it( "it has a link to add a collection", function() {

			var addCollectionLink = utils.firstLink( this.res.json, "add-collection" );
			addCollectionLink.href.should.equal( this.config.appUrl );
			addCollectionLink.name.should.equal( "Add collection" );
			addCollectionLink.type.should.equal( "application/vnd.hyperset.collection+json" );
			addCollectionLink.verbs.should.eql( [ "POST" ] );

		} );

	} );

	describe( "and two collections", function() {

		beforeEach( function( done ) {

			utils.configureWidgetsCollections( this, done );

		} );

		describe( "When the entry point is requested", function() {

			beforeEach( function( done ) {

				utils.behaviours.runThenRequest( this, this.config.appUrl, done );

			} );

			itAlso.returnsA200OK();

			it( "it includes links to the two collections", function() {

				var collectionLinks = utils.where( this.res.json.links, { "rel" : "collection" } );
				collectionLinks.length.should.equal( 2 );

			} );

			it( "it returns the collection name inside the collection link", function() {

				var collectionLinks = utils.where( this.res.json.links, { "rel" : "collection" } );
				collectionLinks[ 1 ].name.should.equal( "collection2" );

			} );

			it( "it returns the url for each collection", function() {

				var collectionLinks = utils.where( this.res.json.links, { "rel" : "collection" } );
				collectionLinks[ 1 ].href.should.contain( "collection2" );
				collectionLinks[ 1 ].href.should.contain( this.config.appUrl );

			} );

			describe( "and a collection is POSTED via the add-collection link", function() {

				beforeEach( function( done ) {

					this.collectionName = "collection3";
					var addCollectionLink = utils.firstLink( this.res.json, "add-collection" );
					var payload = { "collectionName" : this.collectionName };
					utils.behaviours.request( this, "POST", payload, addCollectionLink.href, done );

				} );

				itAlso.returnsA201Created();

				it( "it returns a Location for the collection", function() {

					this.res.headers[ "location" ].should.contain( "collection3" );

				} );

				describe( "and the entry point is requested again", function() {

					beforeEach( function( done ) {

						this.collectionURL = this.res.headers["location"];
						utils.behaviours.request( this, this.config.appUrl, done );

					} );

					it( "it returns a list containing the three collections, including the new one", function() {

						var collectionLinks = utils.findLinks( this.res.json, "collection" );
						collectionLinks.length.should.equal( 3 );
						var hrefs = collectionLinks.map( function( item ) { return item.href; } );
						hrefs.should.contain( this.collectionURL );

					} );

				} );

				describe( "and the new collection is requested", function() {

					beforeEach( function( done ) {

						utils.behaviours.request( this, this.collectionURL, done );

					} );

					it( "it returns 200 OK", function() {

						this.res.statusCode.should.equal( 200 );

					} );

					it( "it returns application/vnd.hyperset.collection+json content", function() {

						this.res.headers[ "content-type" ].should.contain( "application/vnd.hyperset.collection+json" );

					} );

					it( "it has the collection name", function() {

						this.res.json.name.should.equal( "collection3" );

					} );

					it( "it has the href, name and type in the application link", function() {

						var appLink = utils.firstLink( this.res.json, "application" );
						appLink.name.should.equal( "Widgets" );
						appLink.href.should.equal( this.config.appUrl );
						appLink.type.should.contain( "application/vnd.hyperset.application+json" );

					} );

					it( "it has the href, name, type and verbs in the self link", function() {

						var link = utils.firstLink( this.res.json, "self" );
						link.name.should.equal( "collection3" );
						link.href.should.contain( this.config.appUrl );
						link.href.should.contain( "collection3" );
						link.type.should.equal( "application/vnd.hyperset.collection+json" );
						link.verbs.should.eql( [ "GET", "DELETE" ] );

					} );

					it( "it has the name, type and verbs in the upsert-item-template link template", function() {

						var upsertItemTemplateLink = utils.firstLink( this.res.json, "upsert-item-template" );
						upsertItemTemplateLink.name.should.equal( "Add/update item" );
						upsertItemTemplateLink.type.should.contain( "application/vnd.hyperset.item+json" );
						upsertItemTemplateLink.verbs.should.eql( [ "PUT" ] );

					} );

					it( "it has the href, name, type and verbs in the add-item link", function() {

						var addItemLink = utils.firstLink( this.res.json, "add-item" );
						addItemLink.name.should.equal( "Add item" );
						addItemLink.href.should.contain( this.config.appUrl );
						addItemLink.href.should.contain( "collection3" );
						addItemLink.type.should.equal( "application/vnd.hyperset.item+json" );
						addItemLink.verbs.should.eql( [ "POST" ] );

					} );

					describe( "and a new item is POSTed using the add-item link", function() {

						beforeEach( function( done ) {

							var link = utils.firstLink( this.res.json, "add-item" );
							this.newItem = { "content" : "an added thing" };
							utils.behaviours.request( this, "POST", this.newItem, link.href, done );

						} );

						itAlso.returnsA201Created();

						describe( "and the URI in the location header is requested", function() {

							beforeEach( function( done ) {

								this.itemURL = this.res.headers[ "location" ];
								utils.behaviours.request( this, this.res.headers[ "location" ], done );

							} );

							itAlso.returnsAnItem( "an added thing" );

						} );

					} );

					describe( "and a new item is PUT using the upsert-item-template", function() {

						beforeEach( function( done ) {

							var linkTemplate = utils.firstLink( this.res.json, "upsert-item-template" );
							this.itemId = Math.random().toString().match( /\.(.*)/ )[ 1 ];
							this.itemURL = linkTemplate.href.replace( "{{itemId}}", this.itemId );
							var newItem = {	"content" : "a new thing" };
							utils.behaviours.request( this, "PUT", newItem, this.itemURL, done );

						} );

						itAlso.returnsA201Created();

						it( "it returns a location header matching the PUT URI", function() {

							this.res.headers[ "location" ].should.equal( this.itemURL );

						} );

						describe( "and the URI in the location header is requested", function() {

							beforeEach( function( done ) {

								var location = this.res.headers[ "location" ];
								utils.behaviours.request( this, location, done );

							} );

							itAlso.returnsA200OK();

							itAlso.returnsAnItem( "a new thing" );

						} );

						describe( "and the collection is requested again", function() {

							beforeEach( function( done ) {

								utils.behaviours.request( this, this.collectionURL, done );

							} );

							it( "it has a link to the added item", function() {

								var criteria = { "rel" : "item", "name" : this.itemId };
								var links = utils.where( this.res.json.links, criteria );
								links.length.should.equal( 1 );
								links[ 0 ].href.should.equal( this.itemURL );
								links[ 0 ].type.should.equal( "application/vnd.hyperset.item+json" );
								links[ 0 ].verbs.length.should.equal( 3 );
								links[ 0 ].verbs.should.contain( "GET" );
								links[ 0 ].verbs.should.contain( "PUT" );
								links[ 0 ].verbs.should.contain( "DELETE" );

							} );

						} );

						describe( "and a modified form of the item is PUT to the same URI", function() {


							beforeEach( function( done ) {

								utils.behaviours.request( this, "PUT", { "content" : "a modified thing" }, this.itemURL, done );

							} );

							itAlso.returnsA204NoContent();

							describe( "and the URI is requested", function() {

								beforeEach( function( done ) {

									utils.behaviours.request( this, this.itemURL, done );

								} );

								itAlso.returnsAnItem( "a modified thing" );

							} );

						} );

						describe( "and the item is DELETED", function() {

							beforeEach( function( done ) {

								utils.behaviours.request( this, "DELETE", null, this.itemURL, done );

							} );

							itAlso.returnsA204NoContent();

							describe( "and the item is requested again", function() {

								beforeEach( function( done ) {

									utils.behaviours.request( this, this.itemURL, done );

								} );

								it( "it returns 404 Not Found", function() {

									this.res.statusCode.should.equal( 404 );

								} );

							} );

						} );

					} );

				} );

			} );

		} );

	} );

	afterEach( function() {

		utils.dispose( this );

	} );

} );