var utils = require("./utils/utils"),
	buster = require("buster")
	;

buster.spec.expose();

describe("Given NearState's versioned-publishing-workflow", function() {

	before(function() {
		require("./utils/test-repo").flush();
		utils.GivenRepoAndConfig.call(this, "x1-nearstate-versioned-publishing-workflow");
	});

	// can create forms which can be versioned
	describe("When I create a form", function() {

		before(function(done) {
			var context = this;
			this.sampleForm = { "name" : "my first form", items: [ { "type" : "text", "name" : "name" }, { "type" : "int", "name" : "age" } ] };
			this.setGetLinks.forms.follow(function(err, result) {
				context.setResult = result;
				result.findLink("create").follow(context.sampleForm, function(err, result) {
					context.createResult = result;
					done();
				});

			});

		});

		describe("and I update the form", function() {

			before(function(done) {
				var context = this;
				this.updatedSampleForm = JSON.parse(JSON.stringify(this.sampleForm));
				this.updatedSampleForm.items.push({ "type" : "text", "name" : "favouriteColour"});
				this.createResult.findLink("add-version").follow(this.updatedSampleForm, function(err, result) {
					context.addVersionResult = result;
					done();
				});

			});

			it("it should have a previous-version link", function() {
				expect(this.addVersionResult.findLink("previous-version").path).toBeTruthy();
			});

			it("it should have the updated data", function(done) {
				var context = this;
				this.addVersionResult.findLink("self").follow(function(err, result) {
					expect(result.repr.data).toEqual(context.updatedSampleForm);
					done();
				});
			});

			it("it should still have the previous version's data", function(done) {
				var context = this;
				this.addVersionResult.findLink("previous-version").follow(function(err, result) {
					expect(result.repr.data).toEqual(context.sampleForm);
					done();
				});
			});

			// 2. Forms can be published to a published set (creating a new copy).

			describe("and I publish the previous version of the form", function() {

				before(function(done) {
					var context = this;
					this.createResult.findLink("copy-to-published").follow(function(err, result) {
						result.findLink("create").follow(result.repr, function(err, result) {
							context.publishResult = result;
							done();
						});
					});
				});

				it("the published set should now contain the published form", function(done) {
					var publishedFormPath = this.publishResult.findLink("self").path;
					this.setGetLinks.published.follow(function(err, result) {
						expect(result.findLink("item", publishedFormPath).path).toBeTruthy("No link found to the published form");
						done();
					});
				});

				// 3. When a form is published, it contains a link back to the original version of the form from which it was copied.
				it("it should have a link back to the original version of the form", function() {
					expect(this.publishResult.findLink("original").path).toEqual(this.createResult.findLink("self").path);
				});
				
			});

		});


	});

});