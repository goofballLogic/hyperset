var hyperset = require("../lib/hyperset"),
	repo = require("./utils/test-repo"),
	buster = require("buster")
	;

var SUT = new hyperset.Set(repo);

buster.spec.expose();

describe("Given script with versioned sets", function() {

	before(function() {
	
		repo.flush();
		this.script = require("./scenarios/simple-versioned");
		var endpoints = this.endpoints = {};

		SUT.initialise(this.script, function(verb, uri, callback) {
			endpoints[uri] = endpoints[uri] || {};
			endpoints[uri][verb] = callback;
		});

		this.versionedSetName = this.script.sets[0].name;
		this.unversionedSetName = this.script.sets[1].name;

	});

	describe("When an item is POSTed to the unversioned collection", function() {

		itEventually("it should return representation without added version property");

	});

	describe("When an item is POSTed to the versioned collection", function() {

		itEventually("it should return a self link");

		itEventually("it should return version property");

		itEventually("it should return a link to previous version");

		itEventually("it should return a link from which to GET a prepared Next Version");
		
		describe("and when the previous version is requested", function() {

			itEventually("it should return a representation with next version link to current version");

		});

		describe("and when the version item is POSTed to the unversioned collection", function() {

			itEventually("it should not have its version increased");

		});

		describe("and when the Next Version representation is requested", function() {

			itEventually("it should return an increased version number");

			itEventually("it should return a link to PUT the Next Version");

			describe("and when the prepared Next Version representation is PUT", function() {

				itEventually("it should return the PUT representation");

				describe("and when the PUT is attempted again", function() {

					itEventually("it should return a Conflict error");

				});
			});

		});

	});

});