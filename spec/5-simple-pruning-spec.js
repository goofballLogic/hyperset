var utils = require("./utils/utils"),
	buster = require("buster")
	;

buster.spec.expose();

describe("Given pruning config, repo, and set representation", function() {

	before(function(done) {
		require("./utils/test-repo").flush();
		utils.GivenRepoAndConfig.call(this, "simple-pruning");
		var context = this;
		this.setGetLinks.immutables.follow(function(err, result) { context.setResult = result; done(); });
	});

	it("it should contain create link", function() {
		var link = this.setResult.findLink("create");
		expect(link.rel).toEqual("create");
	});

	describe("When an item is created", function() {

		before(function(done) {
			var context = this;
			this.setResult.findLink("create").follow("hello world", function(err, result) {
				context.createdResult = result;
				done();
			});
		});

		it("it should not have a delete link", function() {
			expect(this.createdResult.findLink("delete").path).toBeFalsy();
		});

		it("it should not have an update link", function() {
			expect(this.createdResult.findLink("update").path).toBeFalsy();
		});
	});
});