var should = require( "chai" ).should();
var utils = require( "./utilities" );
var cheerio = require( "cheerio" );

var itAlso = {

	returnsA200OK: function() {

		it( "it returns a 200 OK", function() {

			this.res.statusCode.should.equal( 200 );

		} );

	},
	returnsA302Redirect: function() {

		it( "it returns a 302 Redirect", function() {

			this.res.statusCode.should.equal( 302 );
			should.exist( this.res.headers.location );

		} );

	},
	returnsA403Forbidden: function( message ) {

		if( message ) {

			it( "it returns a 403 Forbidden, and message containing [" + message + "]", function() {

				this.res.statusCode.should.equal( 403 );
				this.res.body.should.contain( message );

			} );

		} else {

			it( "it returns a 403 Forbidden", function() {

				this.res.statusCode.should.equal( 403 );

			} );

		}
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

	}

};

describe( "Given an app configured for HTML (by default)", function() {

	beforeEach( function( done ) {

		utils.configureRepo( this );
		utils.configureWidgets( this );
		utils.configureWidgetsCollections( this, done );

	} );

	describe( "and a policy checking the user's profile", function() {

		beforeEach( function() {

			utils.configurePolicy( this, "check-user-profile" );
			var expiredEntitlement = {

				entitlement: "test-app-subscription",
				startDate: "2012-01-01",
				endDate: "2012-06-01"

			};
			var currentEntitlement = {

				entitlement: "test-app-subscription",
				startDate: "2013-06-01",
				endDate: "2033-06-01"

			};
			this.userProfile1 = { "id" : "123412341234", entitlements: [ expiredEntitlement, currentEntitlement ] };
			this.userProfile2 = { "id" : "432143214321", entitlements: [ expiredEntitlement ] };

		} );

		describe( "and the user is user 1 (with an active subscription)", function() {

			when.theUserIsUser1();

			describe( "When the entry point is requested", function() {

				when.theEntryPointIsRequested();

				itAlso.returnsA200OK();

			} );

		} );


		describe( "and the user is user 2 (with an inactive subscription)", function() {

			when.theUserIsUser2();

			describe( "When the entry point is requested", function() {

				when.theEntryPointIsRequested();

				itAlso.returnsA403Forbidden( "subscription has expired" );

			} );

		} );

	} );


	afterEach( function() {

		utils.dispose( this );

	} );

} );