require( "chai" ).should();
var utils = require( "./utilities" );
var cheerio = require( "cheerio" );

describe( "Given an app", function() {

	beforeEach( function( ) {

		utils.configureRepo( this );
		utils.configureWidgets( this );

	} );

	describe( "When the entry point is requested", function() {

		beforeEach( function(done) {

			utils.behaviours.runThenRequest( this, this.config.appUrl, done );

		} );

		it( "it returns 200 OK", function() {

			this.res.statusCode.should.equal( 200 );

		} );

		it( "it returns html content", function() {

			this.res.headers[ "content-type" ].should.contain( "text/html" );

		} );

		it( "it has the app name in the title", function() {

			this.res.$body.find( "title" ).text().should.equal( "Widgets application" );

		} );

		it( "it has the app name and self link in the h1", function() {

			this.res.$body.find( "h1" ).text().should.equal( "Widgets" );
			this.res.$body.find( "h1 a" ).attr( "href" ).should.equal( this.config.appUrl );

		} );

		it( "it has a form to add a collection", function() {

			this.res.$body.find( "form" ).attr( "method" ).should.equal( "POST" );
			this.res.$body.find( "form" ).attr( "action" ).should.equal( this.config.appUrl );
			this.res.$body.find( "form input:submit" ).attr( "value" ).should.equal( "Add collection" );

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

			it( "it returns 200 OK", function() {

				this.res.statusCode.should.equal( 200 );

			} );

			it( "it returns a list of two collections", function() {

				this.res.$body.find( "ul li" ).length.should.equal( 2 );

			} );

			it( "it returns the collection name inside the li", function() {

				this.res.$body.find( "ul li" ).eq( 1 ).text().should.contain( "collection2" );

			} );

			it( "it returns a link to get the collection inside the li", function() {

				this.res.$body.find( "ul li" ).eq( 1 ).find( "a" ).attr( "href" ).should.contain( "collection2" );

			} );

			it( "it returns a form to add a collection", function() {

				this.res.$body.find( "form" ).length.should.equal( 1 );

			} );

			describe( "and the add-collection form is submitted", function() {

				beforeEach( function( done ) {

					utils.behaviours.submitFormWithValues( this, { "collectionName" : "collection3" }, done );

				} );

				it( "it returns a 201 Created", function() {

					this.res.statusCode.should.equal( 201 );

				} );

				it( "it returns a Location for the collection", function() {

					this.res.headers[ "location" ].should.contain( "collection3" );

				} );

				describe( "and the entry point is requested again", function() {

					beforeEach( function( done ) {

						this.returnedCollectionLocation = this.res.headers["location"];
						utils.behaviours.request( this, this.config.appUrl, done );

					} );

					it( "it returns a list of three collections including the new collection", function() {

						var items = this.res.$body.find( "ul li" );
						items.length.should.equal( 3 );
						items.toString().should.contain( this.returnedCollectionLocation );

					} );

				} );

				describe( "and the new collection is requested", function() {

					beforeEach( function( done ) {

						utils.behaviours.request( this, this.returnedCollectionLocation, done );

					} );

					it( "it returns 200 OK", function() {

						this.res.statusCode.should.equal( 200 );

					} );

					it( "it returns html content", function() {

						this.res.headers[ "content-type" ].should.contain( "text/html" );

					} );

					it( "it has the app and collection name in the title", function() {

						var title = this.res.$body.find( "title" ).text();
						title.should.contain( "Widgets" );
						title.should.contain( "collection3" );

					} );

					it( "it has the app name and link in the h1", function() {

						this.res.$body.find( "h1" ).text().should.equal( "Widgets" );
						this.res.$body.find( "h1 a" ).attr( "href" ).should.equal( this.config.appUrl );

					} );

					it( "it has the collection name and self-link in the h2", function() {

						this.res.$body.find( "h2" ).text().should.equal( "collection3" );
						this.res.$body.find( "h2 a" ).attr( "href" ).should.equal( this.returnedCollectionLocation );

					} );

					it( "it has a form to locate the item upsert", function() {

						this.res.$body.find( "form#locate-upsert-item" ).attr( "method" ).should.equal( "POST" );

					} );

					it( "it has a form to add an item", function() {

						var form = this.res.$body.find( "form#add-item" );
						form.attr( "method" ).should.equal( "POST" );
						form.attr( "action" ).should.equal( this.returnedCollectionLocation );
						form.find( "input:submit" ).val().should.equal( "Add item" );

					} );

					it( "it has an empty list of items", function() {

						this.res.$body.find( "ul" ).find( "*" ).length.should.equal( 0 );

					} );

					describe( "and the locate-upsert-item form is submitted for a non-existant item id", function() {

						beforeEach( function( done ) {

							this.newItemId = Math.random().toString().match( /\.(.*)/ )[ 1 ];
							utils.behaviours.submitFormWithValues( this, "form#locate-upsert-item", { "itemId" : this.newItemId }, done );

						} );

						it( "it returns 302 Found", function() {

							this.res.statusCode.should.equal( 302 );

						} );

						describe( "and the upsert-item form is requested", function() {

							beforeEach( function( done ) {

								utils.behaviours.request( this, this.res.headers[ "location" ], done );

							} );

							it( "it returns 200 OK", function() {

								this.res.statusCode.should.equal( 200 );

							} );

							it( "it has the app and collection name in the title", function() {

								var title = this.res.$body.find( "title" ).text();
								title.should.contain( "Widgets" );
								title.should.contain( "item" );

							} );

							it( "it has the app name and link in the h1", function() {

								this.res.$body.find( "h1" ).text().should.equal( "Widgets" );
								this.res.$body.find( "h1 a" ).attr( "href" ).should.equal( this.config.appUrl );

							} );

							it( "it has the collection name and link in the h2", function() {

								this.res.$body.find( "h2" ).text().should.equal( "collection3" );
								this.res.$body.find( "h2 a" ).attr( "href" ).should.equal( this.returnedCollectionLocation );

							} );

							it( "it has the item id and self-link in the h3", function() {

								var link = this.res.$body.find( "h3 a" );
								link.attr( "href" ).should.contain( link.text() );

							} );

							it( "it has a form with a label indicating that this is a create", function() {

								this.res.$body.find( "form" ).length.should.equal( 1 );
								this.res.$body.find( "form label").eq( 0 ).text().should.contain( "Create" );

							} );

							it( "it has an empty textarea", function() {

								this.res.$body.find( "form textarea" ).length.should.equal( 1 );
								this.res.$body.find( "form textarea" ).val().should.equal( "" );

							} );

							it( "it has a submit button labelled Update", function() {

								this.res.$body.find( "form input:submit" ).val().should.equal( "Create" );

							} );

							describe( "and the form is submitted with changed content", function() {

								beforeEach( function( done ) {

									utils.behaviours.submitFormWithValues( this, { "content" : "a new thing" }, done );

								} );

								it( "it returns a 200 OK", function() {

									this.res.statusCode.should.equal( 200 );

								} );


								it( "it has the app and collection name in the title", function() {

									var title = this.res.$body.find( "title" ).text();
									title.should.contain( "Widgets" );
									title.should.contain( "item" );

								} );

								it( "it has the app name and link in the h1", function() {

									this.res.$body.find( "h1" ).text().should.equal( "Widgets" );
									this.res.$body.find( "h1 a" ).attr( "href" ).should.equal( this.config.appUrl );

								} );

								it( "it has the collection name and link in the h2", function() {

									this.res.$body.find( "h2" ).text().should.equal( "collection3" );
									this.res.$body.find( "h2 a" ).attr( "href" ).should.equal( this.returnedCollectionLocation );

								} );

								it( "it has the item id and self-link in the h3", function() {

									var link = this.res.$body.find( "h3 a" );
									link.attr( "href" ).should.contain( link.text() );

								} );

								it( "it has a form with a label indicating that this is an update", function() {

									this.res.$body.find( "form" ).length.should.equal( 1 );
									this.res.$body.find( "form label").eq( 0 ).text().should.contain( "Update" );

								} );

								it( "it has a textarea with the created item's content", function() {

									this.res.$body.find( "form textarea" ).length.should.equal( 1 );
									this.res.$body.find( "form textarea" ).val().should.equal( "a new thing" );

								} );

								it( "it has a submit button labelled Update", function() {

									this.res.$body.find( "form input:submit" ).val().should.equal( "Update" );

								} );

							} );

						} );

					} );

					describe( "and the add-item form is submitted", function() {

						beforeEach( function( done ) {

							this.collectionResponse = this.res; // save this for later
							utils.behaviours.submitFormWithValues( this, "form#add-item", { "content" : "my new item content" }, done );

						} );

						it( "it returns 201 Created", function() {

							this.res.statusCode.should.equal( 201 );

						} );

						describe( "and the new item is requested", function() {

							beforeEach( function( done ) {

								this.returnedItemLocation = this.res.headers[ "location" ];
								utils.behaviours.request( this, this.returnedItemLocation, done );

							} );

							it( "it returns 200 OK", function() {

								this.res.statusCode.should.equal( 200 );

							} );

							it( "it returns html content", function() {

								this.res.headers[ "content-type" ].should.contain( "text/html" );

							} );

							it( "it has the app and collection name in the title", function() {

								var title = this.res.$body.find( "title" ).text();
								title.should.contain( "Widgets" );
								title.should.contain( "item" );

							} );

							it( "it has the app name and link in the h1", function() {

								this.res.$body.find( "h1" ).text().should.equal( "Widgets" );
								this.res.$body.find( "h1 a" ).attr( "href" ).should.equal( this.config.appUrl );

							} );

							it( "it has the collection name and link in the h2", function() {

								this.res.$body.find( "h2" ).text().should.equal( "collection3" );
								this.res.$body.find( "h2 a" ).attr( "href" ).should.equal( this.returnedCollectionLocation );

							} );

							it( "it has the item id and self-link in the h3", function() {

								var link = this.res.$body.find( "h3 a" );
								link.attr( "href" ).should.contain( link.text() );

							} );

							it( "it has the item content", function() {

								this.res.$body.find( "div#content" ).text().should.equal( "my new item content" );

							} );

							it( "it has a link to edit the content", function() {

								this.res.$body.find( "div#content + a" ).text().should.equal( "Edit" );

							} );

							it( "it has a form to delete the item", function() {

								this.res.$body.find( "form input[type=submit]" ).val().should.equal( "Delete" );

							} );

							describe( "and the locate-upsert-item form of the collection is submitted with the id of the created item", function() {

								beforeEach( function( done ) {

									this.createdItemId = this.res.$body.find( "h3 a" ).text();
									this.returnedEditUrl = this.res.$body.find( "div#content + a" ).attr( "href" );
									this.res = this.collectionResponse;
									utils.behaviours.submitFormWithValues( this, "form#locate-upsert-item", { "itemId" : this.createdItemId }, done );

								} );

								it( "it returns a 302 Found", function() {

									this.res.statusCode.should.equal( 302 );

								} );

								it( "it returns a location matching the URL of the edit page", function() {

									this.res.headers[ "location" ].should.equal( this.returnedEditUrl );

								} );

								describe( "and the upsert page is requested", function() {

									beforeEach( function( done ) {

										utils.behaviours.request( this, this.res.headers.location, done );

									} );

									it( "it returns a 200 OK", function() {

										this.res.statusCode.should.equal( 200 );

									} );

									it( "it has the app and collection name in the title", function() {

										var title = this.res.$body.find( "title" ).text();
										title.should.contain( "Widgets" );
										title.should.contain( "item" );

									} );

									it( "it has the app name and link in the h1", function() {

										this.res.$body.find( "h1" ).text().should.equal( "Widgets" );
										this.res.$body.find( "h1 a" ).attr( "href" ).should.equal( this.config.appUrl );

									} );

									it( "it has the collection name and link in the h2", function() {

										this.res.$body.find( "h2" ).text().should.equal( "collection3" );
										this.res.$body.find( "h2 a" ).attr( "href" ).should.equal( this.returnedCollectionLocation );

									} );

									it( "it has the item id and self-link in the h3", function() {

										var link = this.res.$body.find( "h3 a" );
										link.attr( "href" ).should.contain( link.text() );

									} );

									it( "it has a form with a label indicating that this is an update", function() {

										this.res.$body.find( "form" ).length.should.equal( 1 );
										this.res.$body.find( "form label").eq( 0 ).text().should.contain( "Update" );

									} );

									it( "it has a textarea with the current item content", function() {

										this.res.$body.find( "form textarea" ).length.should.equal( 1 );
										this.res.$body.find( "form textarea" ).val().should.equal( "my new item content" );

									} );

									it( "it has a submit button labelled Update", function() {

										this.res.$body.find( "form input:submit" ).val().should.equal( "Update" );

									} );

									describe( "and the form is submitted with changed content", function() {

										beforeEach( function( done ) {

											utils.behaviours.submitFormWithValues( this, { "content" : "some updated content" }, done );

										} );

										it( "it returns a 200 OK", function() {

											this.res.statusCode.should.equal( 200 );

										} );


										it( "it has the app and collection name in the title", function() {

											var title = this.res.$body.find( "title" ).text();
											title.should.contain( "Widgets" );
											title.should.contain( "item" );

										} );

										it( "it has the app name and link in the h1", function() {

											this.res.$body.find( "h1" ).text().should.equal( "Widgets" );
											this.res.$body.find( "h1 a" ).attr( "href" ).should.equal( this.config.appUrl );

										} );

										it( "it has the collection name and link in the h2", function() {

											this.res.$body.find( "h2" ).text().should.equal( "collection3" );
											this.res.$body.find( "h2 a" ).attr( "href" ).should.equal( this.returnedCollectionLocation );

										} );

										it( "it has the item id and self-link in the h3", function() {

											var link = this.res.$body.find( "h3 a" );
											link.attr( "href" ).should.contain( link.text() );

										} );

										it( "it has a form with a label indicating that this is an update", function() {

											this.res.$body.find( "form" ).length.should.equal( 1 );
											this.res.$body.find( "form label").eq( 0 ).text().should.contain( "Update" );

										} );

										it( "it has a textarea with the updated item content", function() {

											this.res.$body.find( "form textarea" ).length.should.equal( 1 );
											this.res.$body.find( "form textarea" ).val().should.equal( "some updated content" );

										} );

										it( "it has a submit button labelled Update", function() {

											this.res.$body.find( "form input:submit" ).val().should.equal( "Update" );

										} );

									} );

								} );

							} );

						} );


						describe( "and the collection is requested again", function() {

							beforeEach( function( done ) {

								this.returnedItemLocation = this.res.headers[ "location" ];
								utils.behaviours.request( this, this.returnedCollectionLocation, done );

							} );

							it( "it has a list of the added item", function() {

								this.res.$body.find( "ul li" ).length.should.equal( 1 );
								this.returnedItemLocation.should.contain(
									this.res.$body.find( "ul li" ).text()
								);
								this.res.$body.find( "ul li a" ).attr( "href" ).should.equal( this.returnedItemLocation );

							} );

							describe( "and the link to the item is followed", function() {

								beforeEach( function( done ) {

									utils.behaviours.request( this, this.returnedItemLocation, done );

								} );

								describe( "and the delete form is submitted", function() {

									beforeEach( function( done ) {

										utils.behaviours.submitFormWithValues( this, "form", { }, done );

									} );

									it( "it returns a 302 Found", function() {

										this.res.statusCode.should.equal( 302 );

									} );

									describe( "and the location is followed back to the collection", function() {

										beforeEach( function( done ) {

											utils.behaviours.request( this, this.res.headers[ "location" ], done );

										} );

										it( "it no longer has the deleted item in the list", function() {

											this.res.$body.find( "ul li" ).length.should.equal( 0 );

										} );

										describe( "and requesting the item again", function() {

											beforeEach( function( done ) {

												utils.behaviours.request( this, this.returnedItemLocation, done );

											} );

											it( "it returns a 404 Not Found", function() {

												this.res.statusCode.should.equal( 404 );

											} );

										} );

									} );

								} );

							} );

						} );

					} );

				} );

			} );

		} );

	} );

	afterEach( function() {

		this.server.close();

	} );

} );