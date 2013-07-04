var utils = require("./utils/utils"),
	buster = require("buster")
	;

buster.spec.expose();

describe("Given moving config, repo, and created item", function() {

	beforeAll(function() {
		this.start = new Date();
	});
	afterAll(function() {
		console.log(new Date() - this.start);
	});
	
	before(function(done) {
		require("./utils/test-repo").flush();
		utils.GivenRepoAndConfig.call(this, "simple-moving");
		var context = this;
		this.data = "Property ABC";
		this.setGetLinks.available.follow(function(err, result) {
			result.findLink("create").follow(context.data, function(err, result) {
				context.propertyABCLink = result.findLink("self");
				var customLink = context.propertyABCLink.cloneAs("custom-ABC");
				result.repr.createLink(customLink, done);
			});
		});
	});

	describe("When I get the item", function() {

		before(function(done) {
			var context = this;
			this.propertyABCLink.follow(function(err, result) { context.getResult = result; done(); });
		});

		it("it should contain a move transition", function() {
			var link = this.getResult.findLink("move-to-underOffer");
			expect(link.rel).toEqual("move-to-underOffer");
		});

		describe("and when the move transition is followed", function() {

			before(function(done) {
				var context = this;
				this.getResult.findLink("move-to-underOffer").follow(function(err, result) { context.getMoveResult = result; done(); });
			});

			it("it should contain a link to execute the transition", function() {
				var link = this.getMoveResult.findLink("execute-move");
				expect(link.rel).toEqual("execute-move");
			});

			describe("and when the execute-move link is followed", function() {

				before(function(done) {
					var context = this;
					this.getMoveResult.findLink("execute-move").follow(
						this.getMoveResult.repr.data.command,
						function(err, result) {
							expect(err).toBeNull();
							context.executeMoveResult = result; done();
						}
					);
				});

				it("it should have the same data as the original", function() {
					expect(this.executeMoveResult.repr.data).toMatch(this.data);
				});

				it("it should have a set link to its new set", function() {
					var setLink = this.executeMoveResult.findLink("set");
					expect(setLink.path).toEqual(this.setGetLinks.underOffer.path);
				});

				it("it should still have the custom link added to the original", function() {
					expect(this.executeMoveResult.findLinks("custom-ABC").length).toEqual(1);
				});

				describe("and when the old set is retrieved", function() {

					before(function(done) {
						var context = this;
						this.setGetLinks.available.follow(function(err, result) {
							context.availableSetResult = result;
							done();
						});
					});

					it("it should no longer contain a link to the moved item", function() {
						var found = this.availableSetResult.findLink("item", this.propertyABCLink.path);
						expect(found.path).toBeFalsy();
					});

				});

			});

			describe("and when the item is modified before following the execute-move link", function() {

				before(function(done) {
					var context = this;
					var executeLink = this.getMoveResult.findLink("execute-move");
					var executeCommand = this.getMoveResult.repr.data.command;

					this.getResult.findLink("update").follow(this.getResult.repr.data + " (special offer)", function(err, result) {
						executeLink.follow(executeCommand, function(err, result) {
							context.executeStaleMoveResult = result;
							done();
						});
					});
				});

				it("it should respond with 409 CONFLICT", function() {
					expect(this.executeStaleMoveResult.status).toEqual(409);
				});

			});

		});

	});

});