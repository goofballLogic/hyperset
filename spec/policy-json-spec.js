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
	returnsA204NoContent: function() {

		it( "it returns a 204 No Content", function() {

			this.res.statusCode.should.equal( 204 );
			should.not.exist( this.res.body );

		} );

	},
	returnsA403Forbidden: function() {

		it( "it returns a 403 Forbidden", function() {

			this.res.statusCode.should.equal( 403 );

		} );

	},
	returnsOnlyASelfLink: function() {

		it( "it only returns a self link", function() {

			this.res.json.links.length.should.equal( 1 );
			this.res.json.links[ 0 ].rel.should.equal( "self" );

		} );

	},
	returnsOneLink: function( rel, description, verifyLink ) {

		if( typeof description == "function" ) {
			verifyLink = description;
			description = "with the expected format";
		}
		it( "it returns a single " + rel + " link" + (verifyLink ? " " + description : ""), function() {

			var links = utils.findLinks( this.res.json, rel );
			links.length.should.equal( 1 );
			if( verifyLink ) verifyLink( links[ 0 ] );

		} );

	},
	returnsNoLink: function( rel ) {

		it( "it does not return a " + rel + " link", function() {

			utils.findLinks( this.res.json, rel ).length.should.equal( 0 );

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

	}

};

describe( "Given an app configured for JSON", function() {

	beforeEach( function( done ) {

		utils.configureRepo( this );
		utils.configureWidgets( this );
		utils.configureWidgetsCollections( this, done );
		utils.configureForJSON( this );

	} );

	describe( "and an empty access policy", function() {

		beforeEach( function() {

			utils.configurePolicy( this, "empty" );

		} );

		describe( "When the entry point is requested", function() {

			when.theEntryPointIsRequested();

			itAlso.returnsA200OK();

			itAlso.returnsOnlyASelfLink();

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

				itAlso.returnsA200OK();

				itAlso.returnsOnlyASelfLink();

			} );

		} );

		describe( "for an admin user", function() {

			beforeEach( function() {

				utils.configureUserProfile( this, { "roles" : [ "editor", "admin", "clown" ] } );

			} );

			describe( "When the entry point is requested", function() {

				when.theEntryPointIsRequested();

				itAlso.returnsA200OK();

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

				itAlso.returnsOnlyASelfLink();

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

				itAlso.returnsOneLink( "self" );

				itAlso.returnsOneLink( "add-collection" );

				it( "it only returns two links", function() {

					this.res.json.links.length.should.equal( 2 );

				} );

				describe( "and then she tries to add a collection containing her own id", function() {

					beforeEach( function( done ) {

						this.collectionName = "user-" + this.userProfile1.id + "-newcollection";
						var addCollectionLink = utils.firstLink( this.res.json, "add-collection" );
						var payload = { "collectionName" : this.collectionName };
						utils.behaviours.request( this, "POST", payload, addCollectionLink.href, done );

					} );

					itAlso.returnsA201Created();

				} );

				describe( "and then she tries to add a collection which doesn't contain her id", function() {

					beforeEach( function( done ) {

						this.collectionName = "user-77777-newcollection";
						var addCollectionLink = utils.firstLink( this.res.json, "add-collection" );
						var payload = { "collectionName" : this.collectionName };
						utils.behaviours.request( this, "POST", payload, addCollectionLink.href, done );

					} );

					itAlso.returnsA403Forbidden();

				} );

			} );

			describe( "When static content is requested", function() {

				when.staticContentIsRequested();

				itAlso.returnsA200OK();

				itAlso.returnsNoLink( "add-item" );

				itAlso.returnsNoLink( "upsert-item-template" );

				describe( "and an item link is followed", function() {

					beforeEach( function( done ) {

						utils.behaviours.request( this, utils.firstLink( this.res.json, "item" ).href, done );

					} );

					itAlso.returnsA200OK();

					itAlso.returnsOneLink( "self", "with only a GET verb available", function( link ) {

						link.verbs.should.eql( [ "GET" ] );

					} );

					itAlso.returnsOneLink( "collection", "with only a GET verb available", function( link ) {

						link.verbs.should.eql( [ "GET" ] );

					} );

				} );

			} );



			describe( "When her collection is requested", function() {

				when.collectionIsRequestedForUser( "123412341234" );

				itAlso.returnsA200OK();

				itAlso.returnsOneLink( "item", "with GET, PUT and DELETE verbs", function( link ) {

					link.verbs.should.eql( [ "GET", "PUT", "DELETE" ] );

				} );

				itAlso.returnsOneLink( "add-item" );

				itAlso.returnsOneLink( "upsert-item-template" );

				describe( "and the item link is followed", function() {

					beforeEach( function( done ) {

						utils.behaviours.request( this, utils.firstLink( this.res.json, "item" ).href, done );

					} );

					itAlso.returnsA200OK();

					itAlso.returnsOneLink( "self", "with GET, PUT and DELETE verbs", function( link ) {

						link.verbs.should.eql( [ "GET", "PUT", "DELETE" ] );

					} );

				} );

				describe( "and she tries to POST a new item using the add-item link", function() {

					beforeEach( function( done ) {

						utils.behaviours.request( this, "POST", { "content" : "well here goes" }, utils.firstLink( this.res.json, "add-item" ).href, done );

					} );

					itAlso.returnsA201Created();

				} );

				describe( "and she tries to PUT a new representation of the linked resource", function() {

					beforeEach( function( done ) {

						utils.behaviours.request( this, "PUT", { "content" : "a modified thing" }, utils.firstLink( this.res.json, "item").href, done );

					} );

					itAlso.returnsA204NoContent();

				} );

				describe( "and she tries to DELETE the resource", function() {

					beforeEach( function( done ) {

						utils.behaviours.request( this, "DELETE", null, utils.firstLink( this.res.json, "item" ).href, done );

					} );

					itAlso.returnsA204NoContent();

				} );

				describe( "When she tries to DELETE her collection", function() {

					beforeEach( function( done ) {

						utils.behaviours.request( this, "DELETE", null, utils.firstLink( this.res.json, "self" ).href, done );

					} );

					itAlso.returnsA204NoContent();

				} );

				describe( "and another user tries to use the links", function() {

					when.theUserIsUser2();

					beforeEach( function() {

						this.itemLink = utils.firstLink( this.res.json, "item" );

					} );

					describe( "and she tries to POST a new item using the add-item link", function() {

						beforeEach( function( done ) {

							utils.behaviours.request( this, "POST", { "content" : "well here goes" }, utils.firstLink( this.res.json, "add-item" ).href, done );

						} );

						itAlso.returnsA403Forbidden();

					} );

					describe( "When they try to DELETE the collection", function() {

						beforeEach( function( done ) {

							utils.behaviours.request( this, "DELETE", null, utils.firstLink( this.res.json, "self" ).href, done );

						} );

						itAlso.returnsA403Forbidden();

					} );

					describe( "when they try to GET the linked resource", function() {

						beforeEach( function( done ) {

							utils.behaviours.request( this, this.itemLink.href, done );

						} );

						itAlso.returnsA403Forbidden();

					} );

					describe( "when they try to PUT a new representation of the linked resource", function() {

						beforeEach( function( done ) {

							utils.behaviours.request( this, "PUT", { "content" : "a modified thing" }, this.itemLink.href, done );

						} );

						itAlso.returnsA403Forbidden();

					} );

					describe( "when they try to DELETE the linked resource", function() {

						beforeEach( function( done ) {

							utils.behaviours.request( this, "DELETE", null, this.itemLink.href, done );

						} );

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