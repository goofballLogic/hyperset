require( "chai" ).should();
var utils = require( "./utilities" );
var cheerio = require( "cheerio" );

describe( "Given an app", function() {

	beforeEach( function() {

		utils.configureWidgets( this );
		utils.configureRepo( this );

	} );

	describe( "and two collections", function() {

		beforeEach( function() {

			utils.configureWidgetsCollections( this );

		} );

		describe( "When the entry point is requested", function() {

			beforeEach( function( done ) {

				utils.behaviours.runThenRequest( this, this.config.appUrl, done );

			} );

			it( "Should return a list of two collections", function() {

				this.res.$body.find( "ul li" ).length.should.equal( 2 );

			} );

			it( "Should return the collection name inside the li", function() {

				this.res.$body.find( "ul li" ).eq( 1 ).text().should.contain( "collection2" );

			} );

			it( "Should return a link to get the collection inside the li", function() {

				this.res.$body.find( "ul li" ).eq( 1 ).find( "a" ).attr( "href" ).should.contain( "collection2" );

			} );

			describe( "and the add-collection form is submitted", function() {

				beforeEach( function( done ) {

					utils.behaviours.submitFormWithValues( this, { "collectionName" : "collection3" }, done );

				} );

				it( "Should return a 201 Created", function() {

					this.res.statusCode.should.equal( 201 );

				} );

				it( "Should return a Location for the collection", function() {

					this.res.headers[ "location" ].should.contain( "collection3" );

				} );

				describe( "and the entry point is requested again", function() {

					beforeEach( function( done ) {

						this.returnedCollectionLocation = this.res.headers["location"];
						utils.behaviours.request( this, this.config.appUrl, done );

					} );

					it( "Should return a list of three collections including the new collection", function() {

						var items = this.res.$body.find( "ul li" );
						items.length.should.equal( 3 );
						items.toString().should.contain( this.returnedCollectionLocation );

					} );

				} );

				describe( "and the new collection is requested", function() {

					beforeEach( function( done ) {

						utils.behaviours.request( this, this.returnedCollectionLocation, done );

					} );

					it( "Should return html content", function() {

						this.res.headers[ "content-type" ].should.contain( "text/html" );

					} );

					it( "Should have the app and collection name in the title", function() {

						var title = this.res.$body.find( "title" ).text();
						title.should.contain( "Widgets" );
						title.should.contain( "collection3" );

					} );

					it( "Should have the app name and link in the h1", function() {

						this.res.$body.find( "h1" ).text().should.equal( "Widgets" );
						this.res.$body.find( "h1 a" ).attr( "href" ).should.equal( this.config.appUrl );

					} );

					it( "Should have the collection name and self-link in the h2", function() {

						this.res.$body.find( "h2" ).text().should.equal( "collection3" );
						this.res.$body.find( "h2 a" ).attr( "href" ).should.equal( this.returnedCollectionLocation );

					} );

					it( "Should have a form to locate the item upsert", function() {

						this.res.$body.find( "form#upsert-item" ).attr( "method" ).should.equal( "POST" );

					} );

					it( "Should have a form to add an item", function() {

						var form = this.res.$body.find( "form#add-item" );
						form.attr( "method" ).should.equal( "POST" );
						form.attr( "action" ).should.equal( this.returnedCollectionLocation );
						form.find( "input:submit" ).val().should.equal( "Add item" );

					} );

					it( "Should have an empty list of items", function() {

						this.res.$body.find( "ul" ).find( "*" ).length.should.equal( 0 );

					} );

					describe( "and the add-item form is submitted", function() {

						beforeEach( function( done ) {

							utils.behaviours.submitFormWithValues( this, "form#add-item", { "content" : "my new item content" }, done );

						} );

						it( "Should respond with 201 Created", function() {

							this.res.statusCode.should.equal( 201 );

						} );

						describe( "and the new item is requested", function() {

							beforeEach( function( done ) {

								this.returnedItemLocation = this.res.headers[ "location" ];
								utils.behaviours.request( this, this.returnedItemLocation, done );

							} );

							it( "Should return 200 OK", function() {

								this.res.statusCode.should.equal( 200 );

							} );

							it( "Should return html content", function() {

								this.res.headers[ "content-type" ].should.contain( "text/html" );

							} );

							it( "Should have the app and collection name in the title", function() {

								var title = this.res.$body.find( "title" ).text();
								title.should.contain( "Widgets" );
								title.should.contain( "item" );

							} );

							it( "Should have the app name and link in the h1", function() {

								this.res.$body.find( "h1" ).text().should.equal( "Widgets" );
								this.res.$body.find( "h1 a" ).attr( "href" ).should.equal( this.config.appUrl );

							} );

							it( "Should have the collection name and link in the h2", function() {

								this.res.$body.find( "h2" ).text().should.equal( "collection3" );
								this.res.$body.find( "h2 a" ).attr( "href" ).should.equal( this.returnedCollectionLocation );

							} );

							it( "Should have the item id and self-link in the h3", function() {

								var link = this.res.$body.find( "h3 a" );
								link.attr( "href" ).should.contain( link.text() );

							} );

							it( "Should contain the item content", function() {

								this.res.$body.find( "div#content" ).text().should.equal( "my new item content" );

							} );

						} );

					} );

				} );

			} );

		} );

	} );

	describe( "When the entry point is requested", function() {

		beforeEach( function(done) {

			utils.behaviours.runThenRequest( this, this.config.appUrl, done );

		} );

		it( "Should return html content", function() {

			this.res.headers[ "content-type" ].should.contain( "text/html" );

		} );

		it( "Should have the app name in the title", function() {

			this.res.$body.find( "title" ).text().should.equal( "Widgets application" );

		} );

		it( "Should have the app name and self link in the h1", function() {

			this.res.$body.find( "h1" ).text().should.equal( "Widgets" );
			this.res.$body.find( "h1 a" ).attr( "href" ).should.equal( this.config.appUrl );

		} );

		it( "Should have a form to add a collection", function() {

			this.res.$body.find( "form" ).attr( "method" ).should.equal( "POST" );
			this.res.$body.find( "form" ).attr( "action" ).should.equal( this.config.appUrl );
			this.res.$body.find( "form input:submit" ).attr( "value" ).should.equal( "Add collection" );

		} );

	} );


	afterEach( function() {

		this.server.close();

	} );

} );