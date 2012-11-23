var hyperset = require("../lib/hyperset"),
	repo = require("./utils/test-repo"),
	buster = require("buster")
	;

var SUT = new hyperset.Set(repo);

buster.spec.expose();

describe("Given script with COPY transitions and item in set", function() {

	before(function() {
	
		repo.flush();
		this.script = require("./scenarios/simple-copying");
		var endpoints = this.endpoints = {};

		SUT.initialise(this.script, function(verb, uri, callback) {
			endpoints[uri] = endpoints[uri] || {};
			endpoints[uri][verb] = callback;
		});

		this.setName = this.script.sets[0].name;
		this.item = { "copying" : "world" };
		this.postResult = endpoints[this.setName].post(this.item);

	});

	describe("When the item is read", function() {

		itEventually("it should contain a link to GET a transition");

		describe("and when the transition link is followed", function() {

			itEventually("it should return a representation of a copy with a link to the target set");

			itEventually("it should return a representation of a copy with a link to the original's set");

			itEventually("it should have a new self link");

			itEventually("it should return a representation of a copy with a link to the original");

			describe("and when the representation is POSTed to the target set", function() {

				itEventually("it should return what was posted");

				describe("and when the resource is requested again", function() {

					itEventually("it should return what was posted");

				});

			});

		});

	});

});