var should = require( "chai" ).should();
var utils = require( "./utilities" );
var cheerio = require( "cheerio" );

var itAlso = {

	returnsA200OK: function() {

		it( "it returns a 200 OK", function() {

			this.res.statusCode.should.equal( 200 );

		} );

	},
	returnsA201Created: function() {

		it( "it returns a 201 Created", function() {

			this.res.statusCode.should.equal( 201 );
			this.res.body.should.equal( "Created" );

		} );

	},
	returnsA302Redirect: function() {

		it( "it returns a 302 Redirect", function() {

			this.res.statusCode.should.equal( 302 );
			should.exist( this.res.headers.location );

		} );

	},
	returnsA403Forbidden: function() {

		it( "it returns a 403 Forbidden", function() {

			this.res.statusCode.should.equal( 403 );

		} );

	},
	returnsNo: function( selector, description ) {

		description = description || selector + " element";
		it( "it returns no " + description, function() {

			this.res.$body.find( selector ).length.should.equal( 0 );

		} );

	},
	returns: function( count, selector, description ) {

		description = description || "returns " + count + " " + selector + " elements";
		it( "it " + description, function() {

			this.res.$body.find( selector ).length.should.equal( count );

		} );

	}

};

var when = {

	theEntryPointIsRequested: function() {

		beforeEach( function( done ) {

			utils.behaviours.runThenRequest( this, this.config.appUrl, done );

		} );

	},
	theUserIsAnonymous: function() {

		beforeEach( function() {

			utils.configureUserProfile( this, { } );

		} );
	},
	theUserIsUser1: function() {

		beforeEach( function() {

			utils.configureUserProfile( this, this.userProfile1 );

		} );

	},
	theUserIsUser2: function() {

		beforeEach( function() {

			utils.configureUserProfile( this, this.userProfile2 );

		} );

	},
	collectionIsRequestedForUser: function( uid ) {

		beforeEach( function( done ) {

			utils.behaviours.runThenRequest( this, this.config.appUrl + "/user-" + uid + "-stuff", done );

		} );

	},
	staticContentIsRequested: function() {

		beforeEach( function( done ) {

			utils.behaviours.runThenRequest( this, this.config.appUrl + "/static-content", done );

		} );

	},
	theMatchingLinkIsFollowed: function( selector ) {

		beforeEach( function( done ) {

			var href = this.res.$body.find( selector ).attr( "href" );
			utils.behaviours.request( this, href, done );

		} );

	},
	formIsSubmitted: function( selector, values ) {

		beforeEach( function( done ) {

			var currentValues = ("function" === typeof(values)) ? values.call(this) : values;
			utils.behaviours.submitFormWithValues( this, selector, currentValues, done );

		} );

	},
	redirectIsFollowed : function() {


		beforeEach( function( done ) {

			if( this.res.statusCode !== 302 ) throw new Error("Expected redirect was not found: " + this.res.statusCode );
			utils.behaviours.request( this, this.res.headers[ "location" ], done );

		} );

	}

};

describe( "Given an app configured for HTML (by default)", function() {

	beforeEach( function( done ) {

		utils.configureRepo( this );
		utils.configureWidgets( this );
		utils.configureWidgetsCollections( this, done );

	} );

	describe( "and an empty access policy", function() {

		beforeEach( function() {

			utils.configurePolicy( this, "empty" );

		} );

		describe( "When the entry point is requested", function() {

			when.theEntryPointIsRequested();

			itAlso.returnsA200OK();

			itAlso.returnsNo( "form" );

			itAlso.returnsNo( "ul" );

		} );

	} );

	describe( "and the admin-only policy", function() {

		beforeEach( function() {

			utils.configurePolicy( this, "admin-only" );

		} );

		describe( "for a user without admin role", function() {

			beforeEach( function() {

				utils.configureUserProfile( this, { "roles" : [ "editor" ] } );

			} );

			describe( "When the entry point is requested", function() {

				when.theEntryPointIsRequested();

				itAlso.returnsNo( "form" );

				itAlso.returnsNo( "ul" );

			} );

		} );

		describe( "for an admin user", function() {

			beforeEach( function() {

				utils.configureUserProfile( this, { "roles" : [ "editor", "admin", "clown" ] } );

			} );

			describe( "When the entry point is requested", function() {

				when.theEntryPointIsRequested();

				itAlso.returnsA200OK();

				itAlso.returns( 1, "form" );

				itAlso.returns( 1, "ul" );

			} );

		} );

	} );

	describe( "and the three-level access policy", function() {

		beforeEach( function( done ) {

			utils.configurePolicy( this, "three-level" );
			this.userProfile1 = { "id" : "123412341234", "roles" : [ "editor" ] };
			this.userProfile2 = { "id" : "432143214321", "roles" : [ "reviewer" ] };
			this.adminProfile = { "id" : "090909090909", "roles" : [ "admin" ] };
			// new repo for each test
			utils.configureRepo( this );
			var latch = new utils.Latch( 4, done );
			utils.configureUserCollection( this, this.userProfile1, latch.count );
			utils.configureUserCollection( this, this.userProfile2, latch.count );
			utils.configureUserCollection( this, this.adminProfile, latch.count );
			utils.configureStaticContentCollection( this, latch.count );

		} );

		describe( "for anon user", function() {

			when.theUserIsAnonymous();

			describe( "When the entry point is requested", function() {

				when.theEntryPointIsRequested();

				itAlso.returnsA200OK();

				itAlso.returnsNo( "form" );

				itAlso.returnsNo( "ul" );

			} );

			describe( "When static content is requested", function() {

				when.staticContentIsRequested();

				itAlso.returnsA200OK();

			} );

			describe( "When a user's collection is requested", function() {

				when.collectionIsRequestedForUser( "123412341234" );

				itAlso.returnsA403Forbidden();

			} );

		} );


		describe( "for user1", function() {

			when.theUserIsUser1();

			describe( "When the entry point is requested", function() {

				when.theEntryPointIsRequested();

				itAlso.returnsA200OK();

				itAlso.returns( 1, "form" );

				itAlso.returnsNo( "ul" );

				describe( "and then she tries to add a collection containing her own id", function() {

					beforeEach( function( done ) {

						this.collectionName = "user-" + this.userProfile1.id + "-newcollection";
						var payload = { "collectionName" : this.collectionName };
						utils.behaviours.submitFormWithValues( this, "form", payload, done );

					} );

					itAlso.returnsA201Created();

				} );

				describe( "and she tries to add a collection which doesn't contain her id", function() {

					beforeEach( function( done ) {

						utils.behaviours.request( this, this.config.appUrl, function( ) {

							this.collectionName = "user-77777-newcollection";
							var payload = { "collectionName" : this.collectionName };
							utils.behaviours.submitFormWithValues( this, "form", payload, done );

						}.bind( this ) );

					} );

					itAlso.returnsA403Forbidden();

				} );

			} );


			describe( "When static content is requested", function() {

				when.staticContentIsRequested();

				itAlso.returnsA200OK();

				itAlso.returnsNo( "form" );

				itAlso.returnsNo( "a:contains(Delete)", "link to delete the item" );

				describe( "and an item link is followed", function() {

					beforeEach( function( done ) {

						this.firstItemLink = this.res.$body.find( "li > a" ).first();
						var href = this.firstItemLink.attr( "href" );
						utils.behaviours.request( this, href, done );

					} );

					itAlso.returnsA200OK();

					itAlso.returnsNo( "a:contains(Edit)", "edit link" );

					itAlso.returnsNo( "form" );

				} );

			} );

			describe( "When her collection is requested", function() {

				when.collectionIsRequestedForUser( "123412341234" );

				itAlso.returnsA200OK();

				itAlso.returns( 1, "form[id=locate-upsert-item]" );

				itAlso.returns( 1, "form[id=add-item]" );

				itAlso.returns( 1, "a:contains(Delete collection)" );

				itAlso.returns( 1, "ul li a" );

				describe( "and the item link is followed", function() {

					when.theMatchingLinkIsFollowed( "ul li a" );

					itAlso.returnsA200OK();

					itAlso.returns( 1, "a:contains(Edit)" );

					itAlso.returns( 1, "form input:submit[value=Delete]" );

					describe( "and she tries to submit the delete item form", function() {

						when.formIsSubmitted( "form", { } );

						itAlso.returnsA302Redirect();

						describe( "and the redirect back to the collection is followed", function() {

							when.redirectIsFollowed();

							itAlso.returnsA200OK();

							itAlso.returnsNo( "ul li a", "item link" );

						} );

					} );

					describe( "and another user tries to submit the delete item form", function() {

						when.theUserIsUser2();

						when.formIsSubmitted( "form", { } );

						itAlso.returnsA403Forbidden();

					} );

				} );

				describe( "and she tries to add a new item using the add-item form", function() {

					when.formIsSubmitted( "form#add-item", { "content" : "well here goes" } );

					itAlso.returnsA201Created();

				} );

				describe( "and she submits the locate-upsert-item form", function() {

					when.formIsSubmitted( "form#locate-upsert-item", function() {

						return { "itemId" : this.res.$body.find("ul li a").text() };

					} );

					describe( "and the redirect is followed", function() {

						when.redirectIsFollowed();

						itAlso.returnsA200OK();

						itAlso.returns( 1, "form input:submit[value=Update]" );

					} );

				} );


				describe( "When she tries to DELETE her collection", function() {

					when.theMatchingLinkIsFollowed( "a:contains(Delete)" );

					itAlso.returnsA200OK();

					describe( "and the confirm delete form is submitted", function() {

						when.formIsSubmitted( "form#delete-collection" );

						itAlso.returnsA302Redirect();

						describe( "and the redirect is followed", function() {

							when.redirectIsFollowed();

							itAlso.returnsA200OK();

							itAlso.returnsNo( "ul li a" );

						} );

					} );

					describe( "and another user tries to submit the confirm delete form", function() {

						when.theUserIsUser2();

						when.formIsSubmitted( "form#delete-collection" );

						itAlso.returnsA403Forbidden();

					} );

				} );

				describe( "and another user tries to use the controls", function() {

					when.theUserIsUser2();

					describe( "and she tries to add a new item using the add-item form", function() {

						when.formIsSubmitted( "form#add-item", { "content" : "this shouldn't happen" } );

						itAlso.returnsA403Forbidden();

					} );

					describe( "and she tries to follow the delete collection link", function() {

						when.theMatchingLinkIsFollowed( "a:contains(Delete collection)" );

						itAlso.returnsA403Forbidden();

					} );

					describe( "when they try to GET the linked resource", function() {

						when.theMatchingLinkIsFollowed( "ul li a" );

						itAlso.returnsA403Forbidden();

					} );

					describe( "when they submit the locate upsert item form", function() {

						when.formIsSubmitted( "form#locate-upsert-item", { } );

						itAlso.returnsA403Forbidden();

					} );

				} );

			} );

			describe( "When another user's collection is requested", function() {

				when.collectionIsRequestedForUser( "432143214321" );

				itAlso.returnsA403Forbidden();

			} );

		} );

	} );

	afterEach( function() {

		utils.dispose( this );

	} );

} );