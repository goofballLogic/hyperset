var utils = require("./utils/utils"),
	buster = require("buster")
	;

buster.spec.expose();

describe("Given copying config, repo, and created item", function() {

	before(function(done) {
		require("./utils/test-repo").flush();
		utils.GivenRepoAndConfig.call(this, "simple-copying");
		var context = this;
		this.data = "Property ABC";
		this.setGetLinks.forms.follow(function(err, result) {
			result.findLink("create").follow(context.data, function(err, result) {
				context.propertyABCLink = result.findLink("self");
				done();
			});
		});
	});

	describe("When I get the item", function() {

		before(function(done) {
			var context = this;
			this.propertyABCLink.follow(function(err, result) { context.getResult = result; done(); });
		});

		it("it should contain a copy transition", function() {
			expect(this.getResult.findLinks("copy-to-publishedForms").length).toEqual(1);
		});

		describe("and when the copy transition is followed", function() {

			before(function(done) {
				var context = this;
				this.getResult.findLink("copy-to-publishedForms").follow(function(err, result) { context.getCopyResult = result; done(); });
			});

			it("it should contain a link to execute the transition", function() {
				var link = this.getCopyResult.findLink("execute-copy");
				expect(link.rel).toEqual("execute-copy");
			});

			describe("and when the execute-copy link is followed", function() {

				before(function(done) {
					var context = this;
					this.getCopyResult.findLink("execute-copy").follow(
						this.getCopyResult.repr.data.command,
						function(err, result) { context.executeCopyResult = result; done(); }
					);
				});

				it("it should have the same data as the original", function() {
					expect(this.executeCopyResult.repr.data).toMatch(this.data);
				});

				it("it should have a set link to its new set", function() {
					var setLink = this.executeCopyResult.findLink("set");
					expect(setLink.path).toEqual(this.setGetLinks.publishedForms.path);
				});

				describe("and when the old set is retrieved", function() {

					before(function(done) {
						var context = this;
						this.setGetLinks.forms.follow(function(err, result) {
							context.formsSetResult = result;
							done();
						});
					});

					it("it should still have a link to the item which was copied", function() {
						expect(this.formsSetResult.findLinks("item", this.propertyABCLink.path).length).toEqual(1);
					});

				});

			});

			describe("and when the item is modified before following the execute-copy link", function() {

				before(function(done) {
					var context = this;
					var executeLink = this.getCopyResult.findLink("execute-copy");
					var executeCommand = this.getCopyResult.repr.data.command;

					this.getResult.findLink("update").follow(this.getResult.repr.data + " (special offer)", function(err, result) {
						executeLink.follow(executeCommand, function(err, result) {
							context.executeStaleCommandResult = result;
							done();
						});
					});
				});

				it("it should respond with 409 CONFLICT", function() {
					expect(this.executeStaleCommandResult.status).toEqual(409);
				});

			});

		});

	});

});