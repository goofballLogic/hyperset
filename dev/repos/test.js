function newRepo() {

	return new require( process.env.PWD + "/" + process.argv[ 2 ] ).Repo();

}

var testRunId = uuid();

var tests = [ {

	name: "When the repo is instantiated, should return a repo.",
	test: function( done ) { if( !newRepo() ) throw new Error("No repo"); done(); }

}, {

	name: "When getCollections is called, should return collections.",
	test: function( done ) { listCollections( done ); }

}, {

	name: "When add collection is called, should not throw.",
	test: function( done ) {

		testData.addedCollectionName = "added-collection-" + testRunId;

		newRepo().addCollection( testData.addedCollectionName, function( err) {

			if( err ) throw err;
			done();

		} );

	}

}, {

	name: "When getCollections is called, should return a list containing the added collection...",
	test: function( done ) {

		listCollections( function( collections ) {

			var addedCollection = collections.filter( function( item ) { return item.name == testData.addedCollectionName; } );
			if( addedCollection.length != 1 )
				throw new Error( "added collection not found: " + testData.addedCollectionName );

			done();

		} );

	}

}, {

	name: "When getCollection is called for the added item, should return the collection with empty items",
	test: function( done ) {

		findCollection( testData.addedCollectionName, function( collection ) {

			if( collection.name != testData.addedCollectionName ) throw new Error( "missing name" );
			if( !collection.items || collection.items.length !== 0 ) throw new Error( "missing empty array of items" );
			done();

		} );

	}

}, {

	name: "When upsertItem is called against the added collection, should return the input item",
	test: function( done ) {

		testData.item1 = { id : uuid(), content: "hello world" };
		newRepo().upsertItem( testData.addedCollectionName, testData.item1, function( err, item ) {

			if( err ) throw err;
			if( !item ) throw new Error( "No item returned" );
			if( item === testData.item1 ) throw new Error( "A reference to the object sent in as input was received back as the result" );
			if( testData.item1.id != item.id ) throw new Error( "id attributes do not match" );
			if( testData.item1.content != item.content ) throw new Error( "Contents do not match" );
			done();

		} );

	}

}, {

	name: "When the collection is requested again, it should include the new item",
	test: function( done ) {

		findCollection( testData.addedCollectionName, function( collection ) {

			var ids = collection.items.map( function( item ) { return item.id; } );
			if( !~ids.indexOf( testData.item1.id ) ) throw new Error( "Added item was not included" );
			done();

		} );

	}

}, {

	name: "When getItem is called, it should match the added item",
	test: function( done ) {

		newRepo().getItem( testData.addedCollectionName, testData.item1.id, function( err, item ) {

			if( err ) throw err;
			if( !item ) throw new Error( "No item returned" );
			if( item === testData.item1 ) throw new Error( "A reference to the object sent in as input was received back as the result" );
			if( testData.item1.id != item.id ) throw new Error( "id attributes do not match" );
			if( testData.item1.content != item.content ) throw new Error( "Contents do not match" );
			done();

		} );

	}

}, {

	name: "When getItemOrTemplate is called for the id of the added item, it should indicate that it exists",
	test: function( done ) {

		newRepo().getItemOrTemplate( testData.addedCollectionName, testData.item1.id, function( err, item, isExisting ) {

			if( err ) throw err;
			if( !isExisting ) throw new Error( "API reported that the item does not exist" );
			done();

		} );

	}

}, {

	name: "When getItemOrTemplate is called for the id of the added item, it should return the added item",
	test: function( done ) {

		newRepo().getItemOrTemplate( testData.addedCollectionName, testData.item1.id, function( err, item, isExisting ) {

			if( err ) throw err;
			if( !item ) throw new Error( "No item returned" );
			if( item === testData.item1 ) throw new Error( "A reference to the object sent in as input was received back as the result" );
			if( testData.item1.id != item.id ) throw new Error( "id attributes do not match" );
			if( testData.item1.content != item.content ) throw new Error( "Contents do not match" );
			done();

		} );

	}

}, {

	name: "When getItemOrTemplate is called with a new id, it should indicate that the item does not yet exist",
	test: function( done ) {
		var newId = uuid();
		newRepo().getItemOrTemplate( testData.addedCollectionName, newId, function( err, template, isExisting ) {

			if( err ) throw err;
			if( isExisting ) throw new Error( "API reported that the item already exists" );
			done();

		} );

	}

}, {

	name: "When getItemOrTemplate is called with a new id, it should return a template",
	test: function( done ) {
		var newId = uuid();
		newRepo().getItemOrTemplate( testData.addedCollectionName, newId, function( err, template, isExisting ) {

			if( err ) throw err;
			if( !template ) throw new Error( "No template returned" );
			if( template.id != newId ) throw new Error( "id for the template is incorrect" );
			if( template.content !== null ) throw new Error( "content for the template is not a null-valued attribute" );
			done();

		} );

	}

}, {

	name: "When upsertItem is called with a template retrieved for the added collection, it should not throw",
	test: function( done ) {

		var newId = uuid();
		var repo = newRepo();
		repo.getItemOrTemplate( testData.addedCollectionName, newId, function( err, template, isExisting ) {

			if( err ) throw err;
			testData.item2 = template;
			repo.upsertItem( testData.addedCollectionName, template, function( err, item ) {

				if( err ) throw err;
				done();

			} );

		} );

	}

}, {

	name: "When the collection is requested again, it should now include the two added items",
	test: function( done ) {

		newRepo().getCollection( testData.addedCollectionName, function( err, collection ) {

			if( err ) throw err;
			var ids = collection.items.map( function( item ) { return item.id; } );
			if( ids.length != 2 ) throw new Error( "Expected 2 items, but number listed was " + ids.length );
			if( !~ids.indexOf( testData.item1.id ) ) throw new Error( "Item1 not listed" );
			if( !~ids.indexOf( testData.item2.id ) ) throw new Error( "Item2 not listed");
			done();

		} );

	}

}, {

	name: "When deleteItem is called for the second item, should not throw",
	test: function( done ) {

		newRepo().deleteItem( testData.addedCollectionName, testData.item2.id, function( err ) {

			if( err ) throw err;
			done();

		} );

	}

}, {

	name: "When the collection is requested again, it should now only include the first item",
	test: function( done ) {

		newRepo().getCollection( testData.addedCollectionName, function( err, collection ) {

			if( err ) throw err;
			if( collection.items.length != 1 ) throw new Error( "Expected 1 item, but number listed was " + ids.length );
			if( collection.items[ 0 ].id != testData.item1.id ) throw new Error( "The wrong item was deleted" );
			done();

		} );

	}

}, {

	name: "When upsertItem is called with content but no id, it should have created an id for the item",
	test: function( done ) {

		newRepo().upsertItem( testData.addedCollectionName, { content: "hello world" }, function( err, item ) {

			if( err ) throw err;
			if( !item.id ) throw new Error( "Upserted item's id is not valid: " + item.id );
			testData.generatedId = item.id;
			done();

		} );

	}

}, {

	name: "When the added item is requested, it should exist",
	test: function( done ) {

		newRepo().getItemOrTemplate( testData.addedCollectionName, testData.generatedId, function( err, item, isExisting ) {

			if( err ) throw err;
			if( !isExisting ) throw new Error( "API reports that the item does not yet exist" );
			done();

		} );

	}

}, {

	name: "When the collection is deleted, it should no longer exist",
	test: function( done ) {

		newRepo().deleteCollection( testData.addedCollectionName, function( err ) {

			if( err ) throw err;
			done();

		} );

	}

} ];

function listCollections( callback ) {

	newRepo().getCollections( function( err, collections ) {

		if( err ) throw err;
		if( !collections ) throw new Error( "No collections returned" );
		callback( collections );

	} );

}

function findCollection( collectionName, callback ) {

	newRepo().getCollection( collectionName, function( err, collection ) {

		if( err ) throw err;
		if( !collection ) throw new Error( "No collection returned" );
		callback( collection );

	} );

}

var testData = {};

var red   = '\u001b[41m\u001b[37;1m';
var green = '\u001b[42m\u001b[37;1m';
var reset = '\u001b[0m';
// See more at: http://roguejs.com/2011-11-30/console-colors-in-node-js/#sthash.Qf2h2Gao.dpuf
var testFunctionLiteral = "";
var testTimeoutLength = 5000;
var testTimeout;
var success = true;

process.on( "uncaughtException", failStep );

console.log();
step();

function step() {

	var currentTest = tests.shift();
	if( currentTest ) {

		process.stdout.write( "[      ] " + currentTest.name );

		testFunctionLiteral = funcPrint( currentTest.test );

		try {

			testTimeout = setTimeout( failStep, testTimeoutLength );
			currentTest.test( passStep );

		} catch( e ) {

			failStep( e );

		}

	} else {

		if( !success ) process.exit( 1 );
	}

}

function failStep( e ) {

	clearTimeout( testTimeout );
	success = false;
	e = e || "Test timed out";
	console.log( "\r[" + red + " FAIL " + reset + "]\n\n" + ( e.stack || e ) + "\n\n" + testFunctionLiteral + "\n\n");
	step();

}

function passStep() {

	clearTimeout( testTimeout );
	console.log( "\r[" + green + "  OK  " + reset + "]" );
	step();

}

function funcPrint( func ) {

	var body = func.toString().split("\n").filter( function( item, i, all ) {

		if( i === 0 && /\{\s*$/.exec( item ) ) return false;
		if( i === 1 && !item ) return false;
		if( i == all.length - 2 && !item ) return false;
		if( i == all.length - 1 && /^\s*\}\s*$/.exec( item ) ) return false;
		return true;

	} );
	var trimCount = 999;
	body.forEach( function( item, i ) {

		var indent = /^\s*/.exec( item );
		if( indent && indent[ 0 ] !== item && indent[ 0 ].length  < trimCount )
			trimCount = indent[ 0 ].length;

	} );
	body = body.map( function( item ) {

		return " >\t" + item.substring( trimCount, 999 );

	} );
	return body.join("\n");

}

// thanks: http://stackoverflow.com/a/2117523
function uuid() {

	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});

}