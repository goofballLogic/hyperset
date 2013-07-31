require( "chai" ).should();
var utils = require( "./utilities" );
var cheerio = require( "cheerio" );

describe( "Given an app", function() {

	beforeEach( function( ) {

		utils.configureRepo( this );
		utils.configureWidgets( this );

	} );

	describe( "When an item for a non-existent collection is requested", function() {

		beforeEach( function(done) {

			var context = this;
			utils.behaviours.runThenRequest( this, this.config.appUrl, function() {

				utils.behaviours.submitFormWithValues( context, "form", { "collectionName" : "createdCollection"}, function() {

					utils.behaviours.request( context, context.res.headers[ "location" ], function() {

						utils.behaviours.submitFormWithValues( context, "form#add-item", { "content" : "something" }, function() {

							var location = context.res.headers["location"].replace(/createdCollection/, "nonexistentCollection");
							utils.behaviours.request( context, location, done );

						} );

					} );

				} );

			} );

		} );

		it( "it returns 409 Conflict", function() {

			this.res.statusCode.should.equal( 409 );

		} );

	} );

	describe( "When an item is submitted to be added to a non-existent collection", function() {

		beforeEach( function(done) {

			var context = this;
			utils.behaviours.runThenRequest( this, this.config.appUrl, function() {

				utils.behaviours.submitFormWithValues( context, "form", { "collectionName" : "createdCollection"}, function() {

					utils.behaviours.request( context, context.res.headers[ "location" ], function() {

						var $form = context.res.$body.find( "form#add-item" );
						$form.attr( "action", $form.attr( "action" ).replace( /createdCollection/, "nonexistentCollection" ) );
						utils.behaviours.submitFormWithValues( context, "form#add-item", { "content" : "something" }, done );

					} );

				} );

			} );

		} );

		it( "it returns 409 Conflict", function() {

			this.res.statusCode.should.equal( 409 );

		} );

	} );

	describe( "When an attempt is made to add a collection which already exists", function() {

		beforeEach( function( done ) {

			var context = this;
			utils.behaviours.runThenRequest( this, this.config.appUrl, function() {

				var initialResponse = context.res;
				var formData = { "collectionName" : "collectionA" };
				utils.behaviours.submitFormWithValues( context, "form", formData, function() {

					context.res = initialResponse;
					utils.behaviours.submitFormWithValues( context, "form", formData, done );

				} );

			} );

		} );

		it( "it returns 409 Conflict", function() {

			this.res.statusCode.should.equal( 409 );

		} );

	} );

	describe( "and an item in a collection", function() {

		beforeEach( function( done ) {

			var context = this;
			utils.behaviours.runThenRequest( this, this.config.appUrl, function() {

				utils.behaviours.submitFormWithValues( context, "form", { "collectionName" : "createdCollection" }, function() {

					utils.behaviours.request( context, context.res.headers[ "location" ], function() {

						utils.behaviours.submitFormWithValues( context, "form#add-item", { "content" : "hello" }, function() {

							utils.behaviours.request( context, context.res.headers[ "location" ], done );

						} );

					} );

				} );

			} );

		} );

		describe( "when delete is called for a non-existent item", function() {

			beforeEach( function( done ) {

				utils.behaviours.submitFormWithValues( this, "form", { "itemId" : "idontexist" }, done );

			} );

			it( "should respond with 404 NotFound", function() {

				this.res.statusCode.should.equal( 404 );

			} );

		} );

		describe( "when delete is called for a non-existent collection", function() {

			beforeEach( function( done ) {

				var $form = this.res.$body.find( "form" );
				$form.attr( "action", $form.attr( "action" ).replace( /createdCollection/, "nonexistentCollection" ) );
				utils.behaviours.submitFormWithValues( this, "form", {}, done );

			} );

			it( "should respond with 409 Conflict", function() {

				this.res.statusCode.should.equal( 409 );

			} );

		} );

	} );

	afterEach( function() {

		this.server.close();

	} );

} );