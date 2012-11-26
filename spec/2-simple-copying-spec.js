var utils = require("./utils/utils"),
	buster = require("buster")
	;

buster.spec.expose();

describe("Given copying config and repo", function() {

	before(function() {
		require("./utils/test-repo").flush();
		utils.GivenRepoAndConfig.call(this, "simple-copying");
	});

	describe("When I create a form", function() {

		before(function(done) {
			var context = this;
			context.setGetLinks = {};
			for(var i = 0; i < this.sets.links.length; i++) {
				context.setGetLinks[this.sets.links[i].path] = this.sets.links[i];
			}
			this.setGetLinks["forms"].follow(function(err, result) {
				var createFormLink = result.repr.findLink("create");
				context.form = { "yo" : "momma" };
				createFormLink.follow(context.form, function(err, result) {
					context.createResult = result;
					done();
				});
			});
		});

		it("it should contain a link to the copying state", function() {
			var actual = this.createResult.repr.findLink("copy-to-publishedForms").path;
			var expected = this.createResult.repr.findLink("self").path;
			expect(actual).toEqual(expected);
		});

		describe("and when I follow the copy link", function() {

			before(function(done) {
				var context = this;
				this.createResult.repr.findLink("copy-to-publishedForms").follow(function(err, result) {
					context.copyingResult = result;
					done();
				});
			});

			it("it should contain a link to complete the copy", function() {
				var actual = this.copyingResult.repr.findLink("create").path;
				var expected = "publishedForms";
				expect(actual).toEqual(expected);
			});

			describe("and when I follow the create link", function() {

				before(function(done) {
					var context = this;
					this.copyingResult.repr.findLink("create").follow(this.copyingResult.repr, function(err, result) {
						context.createResult = result;
						done();
					});
				});

				it("it should return a CREATED result", function() {
					expect(this.createResult.status).toEqual(201);
				});

				it("it should return a link to the further copying state", function() {
					var actual = this.createResult.repr.findLink("copy-to-filledForms").path;
					var expected = this.createResult.repr.findLink("self").path;
					expect(actual).toEqual(expected);
				});

				describe("and when I follow the set link", function() {

					before(function(done) {
						var context = this;
						this.createResult.repr.findLink("set").follow(function(err, result) {
							context.setResult = result;
							done();
						});
					});

					it("it should return a set linking to the created item", function() {
						var createSelfLinkPath = this.createResult.repr.findLink("self").path;
						var itemLink = this.setResult.repr.findLink("item", createSelfLinkPath);
						expect(itemLink.path).toEqual(createSelfLinkPath);
					});

				});

				describe("and when I follow the link to the further copying state", function() {

					before(function(done) {
						var context = this;
						this.createResult.repr.findLink("copy-to-filledForms").follow(function(err, result) {
							context.nextCopyResult = result;
							done();
						});
					});

					describe("and when I query the filled-forms set", function() {

						before(function(done) {
							var context = this;
							this.setGetLinks["filledForms"].follow(function(err, result) {
								context.filledFormsResult = result;
								done();
							});
						});

						it("it should contain a link to the copied item", function() {
							var createdItemPath = this.nextCopyResult.repr.path;
							var linkToCopiedItem = this.filledFormsResult.repr.findLink("item", createdItemPath);
							expect(linkToCopiedItem.path).toEqual(createdItemPath);
						});

					});
				});
			});
		});
	});
});