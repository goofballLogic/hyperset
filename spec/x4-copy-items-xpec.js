var hyperset = require("../lib/hyperset"),
	repo = require("./utils/test-repo"),
	testServer = require("./utils/test-server"),
	buster = require("buster")
	;

var SUT = new hyperset.Set(repo);

buster.spec.expose();

describe("Given script with COPY transitions and item in set", function() {

	before(function() {
	
		repo.flush();
		this.script = require("./scenarios/simple-copying");
		this.server = new testServer.Server();
		SUT.initialise(this.script, this.server.build);
		
		this.item = { "copying" : "world" };
		
		this.postResult = this.server["forms"]["post-item"](this.item);

	});

	describe("When the item is read", function() {

		before(function() {
			this.getResult = this.server["forms"]["get-item"]({ id: this.postResult.data.id });
		});

		it("it should contain a link to GET a transition", function() {
			var found = this.getResult.data.links.findByRel("copy-to-publishedForms");
			expect(found).not.toBeNull();
		});

		describe("and when the transition link is followed", function() {

			before(function() {
				this.getTransition = this.server["forms"]["copy-to-publishedForms"];
			});

			it("it should return a representation of a copy with a link to the target set", function() {
				expect(this.getTransition.data.id).not.toEqual(this.getResult.data.id);
			});

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