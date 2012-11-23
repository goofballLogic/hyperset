var hyperset = require("../lib/hyperset"),
	repo = require("./utils/test-repo"),
	testServer = require("./utils/test-server"),
	buster = require("buster")
	;

var SUT = new hyperset.Set(repo);

buster.spec.expose();

describe("Given script,", function() {

	before(function() {
		this.script = require("./scenarios/simple");
	});

	describe("When asked to define namespace", function() {

		before(function() {
			this.server = new testServer.Server();
			SUT.initialise(this.script, this.server.build);
		});

		this.forEachSet = function(command) {
			for(var i = 0; i < this.script.sets.length; i++) {
				command.call(this, this.script.sets[i]);
			}
		};

		it("it should create GET endpoints for each collection", function() {
			this.forEachSet(function(set) {
				expect(this.server[set.name]["get-items"]).toBeDefined("GET " + set.name);
			});
		});

		it("it should create GET endpoints for each item in the collection", function() {
			this.forEachSet(function(set) {
				expect(this.server[set.name]["get-item"]).toBeDefined("GET " + set.name.substring(0, set.name.length - 1));
			});
		});

		it("it should create POST endpoints for each collection", function() {
			this.forEachSet(function(set) {
				expect(this.server[set.name]["post-item"]).toBeDefined("POST " + set.name);
			});
		});

		it("it should create PUT endpoints for items in the collection", function() {
			this.forEachSet(function(set) {
				expect(this.server[set.name]["put-item"]).toBeDefined("PUT " + set.name.substring(0, set.name.length - 1));
			});
		});

		it("it should create DELETE endpoints for items in the collection", function() {
			this.forEachSet(function(set) {
				expect(this.server[set.name]["delete-item"]).toBeDefined("DELETE " + set.name.substring(0, set.name.length - 1));
			});
		});

	});

});