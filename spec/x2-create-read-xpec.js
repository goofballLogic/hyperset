var hyperset = require("../lib/hyperset"),
	repo = require("./utils/test-repo"),
	testServer = require("./utils/test-server"),
	buster = require("buster"),
	utils = require("./utils/utils.js")
	;

var SUT = new hyperset.Set(repo);

buster.spec.expose();

describe("Given initialised script,", function() {

	before(function() {
		repo.flush();
		this.script = require("./scenarios/simple");
		this.server = new testServer.Server();
		SUT.initialise(this.script, this.server.build);
	});

	describe("When I POST an item to a set", function() {
		
		before(function() {
			this.setName = this.script.sets[0].name;
			this.item = { "hello" : "world" };
			this.result = this.server[this.setName]["post-item"](this.item);
		});

		it("it should return a representation with item, id and links", function() {
			expect(this.result.data.links).toBeDefined("Links attribute");
			expect(this.result.data.item).toBeDefined("Item attribute");
			expect(this.result.data.id).toBeDefined("Item id");
		});

		it("it should return the item with a link to get self", function() {
			var selfLink = this.result.data.links[0];
			expect(selfLink.rel).toEqual("self", "link rel");
			expect(selfLink.method).toEqual("get-item", "link method");
			var expectedAction = { id: function() { return true; }, setName: this.setName};
			expect(selfLink.action).toMatch(expectedAction, "link action");
		});

		describe("and when I GET the item", function() {

			before(function() {
				var selfLink = this.result.data.links[0];
				this.getSelfResult = this.server[selfLink.action.setName][selfLink.method](selfLink.action);
			});

			it("it should return the stored item", function() {
				var actual = utils.toJSON(this.getSelfResult.data);
				var expected = utils.toJSON(this.result.data);
				expect(actual).toMatch(expected);
			});
		});

		describe("and when I GET the set", function() {

			before(function() {
				this.getResult = this.server[this.setName]["get-items"]();
			});

			it("it should return set with self link", function() {
				var selfLink = this.getResult.data.links[0];
				var expectedLink = { "rel" : "self", "method" : "get-items", "action" : { "setName" : this.setName }};
				expect(selfLink).toMatch(expectedLink);
			});

			it("it should return set containing the added item", function() {
				expect(this.getResult.data.items).toBeDefined("items collection");
				expect(this.getResult.data.items[0].item).toEqual(this.result.data.item);
			});
		});
	});
});