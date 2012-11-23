var hyperset = require("../lib/hyperset"),
	repo = require("./utils/test-repo"),
	testServer = require("./utils/test-server"),
	buster = require("buster")
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

		it("it should return a representation with item and links", function() {
			expect(this.result.data.links).toBeDefined("Links attribute");
			expect(this.result.data.item).toBeDefined("Item attribute");
		});

		it("it should return the item with a link to self", function() {
			expect(this.result.data.links[0].rel).toEqual("self");
			expect(this.result.data.links[0].href).toMatch(this.setName + "/", "self link should start with container");
		});

		describe("and when I GET the item", function() {

			before(function() {
				var selfLink = this.result.data.links[0].href;
				var params = { "id" : selfLink.substring(selfLink.lastIndexOf("/")+1) };
				this.getSelfResult = this.server[this.setName]["get-item"](params);
			});

			it("it should return me", function() {
				expect(this.getSelfResult.data).toMatch(this.result.data);
			});
		});

		describe("and when I GET the set", function() {

			before(function() {
				this.getResult = this.server[this.setName]["get-items"]();
			});

			it("it should return set with self link", function() {
				expect(this.getResult.data.links[0].href).toEqual(this.setName);
			});

			it("it should return set containing the added item", function() {
				expect(this.getResult.data.items).toBeDefined("items collection");
				expect(this.getResult.data.items[0]).toEqual(this.result.data);
			});
		});
	});
});