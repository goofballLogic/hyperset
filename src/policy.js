var fs = require( "fs" );

( function( context ) {
	"use strict";

	context.attach = policyAttach;
	context.entitlements = {

		// queries
		listCollections: "list-collections",
		viewCollection: "view-collection",
		listItems: "list-items",
		viewItem: "view-item",
		// updates
		addCollection: "add-collection",
		deleteCollection: "delete-collection",
		addItem: "add-item",
		upsertItem: "upsert-item",
		deleteItem: "delete-item"

	};
	var allEntitlements = [];
	for( var k in context.entitlements ) allEntitlements.push( context.entitlements[ k ] );
	allEntitlements = JSON.stringify( allEntitlements );

	var readonlyEntitlements = JSON.stringify( [

		context.entitlements.listCollections,
		context.entitlements.viewCollection,
		context.entitlements.listItems,
		context.entitlements.viewItem

	] );


	return;

	function policyAttach( app, config ) {

		if( config.policy ) {

			// on attaching the policy (once per app life), load and compile the policy
			var policyConfig = loadAndCompilePolicy( config );
			var rules = policyConfig.rules;

			// attach middleware to run on each request
			app.use( config.pathname, function( req, res, next ) {

				// for each request, determine which rules meet the given pre-conditions
				var validRules = [ ];
				for( var i = 0; i < rules.length; i++ ) {

					if( rules[ i ].evaluateGivens( req ) ) validRules.push( rules[ i ] );

				}
				// and build the entitlement context factory
				req.entitlementContext = buildEntitlementContextFactory( validRules );
				return next();

			} );

		} else {

			return next( new Error( "No policy configured" ) );

		}

	}
	function loadAndCompilePolicy( config ) {

		var policy = fs.readFileSync( config.policy, "utf8" );
		var ret = JSON.parse( policy );
		ret.rules = ret.rules || [];
		for( var i = 0; i < ret.rules.length; i++ ) {

			var rule = ret.rules[ i ];
			var givenStrategies = [ ];
			if( rule.given ) for(var givenStrategyName in rule.given ) {

				switch( givenStrategyName ) {

					case "roles":
						givenStrategies.push( givenRolesStrategy.bind( rule ) );
						break;

					case "user-id":
						givenStrategies.push( buildGivenUserIdStrategy( rule.given[ givenStrategyName ] ).bind( rule ) );
						break;

					default:

						throw new Error( "Unrecognised policy 'given' section: " + givenStrategyName + ".");

				}

			}
			rule.evaluateGivens = buildEvaluateGivens( givenStrategies );

			var whenStrategies = [ ];
			if( rule.when ) for( var whenStrategyName in rule.when ) {

				switch( whenStrategyName ) {

					case "collection-name":
						whenStrategies.push( buildWhenCollectionNameStrategy( rule.when[ whenStrategyName ] ).bind( rule ) );
						break;

					default:
						throw new Error( "Unrecognised policy 'when' section: " + whenStrategyName + "." );

				}

			}
			var thenStrategies = [ ];
			if( rule.then ) for( var thenStrategyName in rule.then ) {

				switch( thenStrategyName ) {

					case "grant":
						thenStrategies.push( buildThenGrantStrategy( rule.then[ thenStrategyName ] ).bind( rule ) );
						break;

					case "grant-read-only":
						thenStrategies.push( buildThenGrantReadonlyStrategy( rule.then[ thenStrategyName ] ).bind( rule ) );
						break;

					default:
						throw new Error( "Unrecognised policy 'then' section: " + thenStrategyName + "." );

				}

			}
			rule.resolveEntitlements = buildResolveEntitlements( whenStrategies, thenStrategies );

		}
		return ret;

	}
	function buildEvaluateGivens( givenStrategies ) {

		return function( req ) {

			// do any of the givens fail?
			for( var i = 0; i < givenStrategies.length; i++ )
				if( !givenStrategies[ i ]( req ) ) return false;
			return true;

		};

	}
	function buildEntitlementContextFactory( rules ) {

		return function( req, collectionName, itemId ) {

			var actual = rules
				.map( function( rule ) { return rule.resolveEntitlements( req, collectionName, itemId ); } )
				.reduce( function( previous, current ) { return previous.concat( current ); }, [ ] );

			return {

				check: function( permission ) {

					if( !permission ) throw new Error( "Invalid permission request: " + permission );
					return !!~actual.indexOf( permission );

				}

			};

		};

	}
	function buildResolveEntitlements( whenStrategies, thenStrategies ) {

		return function( req, collectionName, itemId ) {

			for( var i = 0; i < whenStrategies.length; i++ ) {

				if( !whenStrategies[ i ]( req, collectionName, itemId ) ) return [];

			}
			return thenStrategies
				.map( function( strategy ) { return strategy( req, collectionName, itemId ); } )
				.reduce( function( previous, current ) { return previous.concat( current ); } );

		};

	}
	function buildThenGrantStrategy( entitlements ) {

		if( entitlements == "*" ) entitlements = JSON.parse( allEntitlements );
		return function() { return [].concat( entitlements ); };

	}
	function buildThenGrantReadonlyStrategy( enabled ) {

		if( !enabled ) return function() { return []; };
		return function() { return JSON.parse( readonlyEntitlements ); };

	}
	function buildWhenCollectionNameStrategy( pattern ) {

		if( pattern === null ) {

			return function( req, collectionName ) {

				if( typeof collectionName == "undefined" ) return true;
				if( collectionName === null ) return true;
				return false;

			};

		}
		if( typeof pattern == "string" ) {

			var matchRegExp = new RegExp( pattern );
			return function( req, collectionName ) {

				return matchRegExp.test( collectionName );

			};

		}
		if( "user-id-match" in pattern ) {

			var userIdExtractor = new RegExp( pattern[ "user-id-match" ] );
			return function( req, collectionName ) {

				var actual = req.userProfile.id;
				var match = userIdExtractor.exec( collectionName );
				if( !match ) return false;
				return actual == match[ 1 ];

			};

		}
		throw new Error( "Unrecognised 'when/collection-name' configuration: " + JSON.stringify( pattern ) );

	}
	function buildGivenUserIdStrategy( pattern ) {

		var regex = new RegExp( pattern );
		return function( req ) {

			if( !req.userProfile.id ) return false;
			return regex.test( req.userProfile.id );

		};

	}
	function givenRolesStrategy( req ) {
		/* jshint validthis: true */

		var actual = req.userProfile.roles || [ ];
		var required = this.given.roles;
		for( var i = 0; i < required.length; i++ ) {

			if( !~actual.indexOf( required[ i ] ) ) return false;

		}
		return true;

	}



} ( module.exports ) );