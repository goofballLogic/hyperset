var utils = require("./utils/utils"),
	buster = require("buster")
	;

buster.spec.expose();

describe("Given NearState's versioned-publishing-workflow", function() {


	beforeAll(function() {
		this.start = new Date();
	});
	afterAll(function() {
		console.log(new Date() - this.start);
	});
	
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
					this.createResult.findLink("version").follow(function(err, result) {
						result.findLink("copy-to-published").follow(function(err, result) {
							result.findLink("execute-copy").follow(result.repr.data.command, function(err, result) {
								context.publishResult = result;
								done();
							});
						});
					});
				});

				it("the published set should now contain the published form", function(done) {
					var publishedFormPath = this.publishResult.findLink("self").path;
					this.setGetLinks.published.follow(function(err, result) {
						var publishedFormPathLinks = result.findLinks("item", publishedFormPath);
						expect(publishedFormPathLinks.length).toEqual(1, "No link found to the published form");
						if(publishedFormPathLinks.length > 0) {
							publishedFormPathLinks[0].follow(function(err, result) {
								expect(result.repr.data).toMatch({ name: "my first form" });
								done();
							});
						} else done();
					});
				});

				// 3. When a form is published, it contains a link back to the original version of the form from which it was copied.
				it("it should have a link back to the original version of the form", function() {
					expect(this.publishResult.findLink("original").path).toEqual(this.createResult.findLink("version").path);
				});
				
				// 3.a. A published form is immutable and can only be copied or deleted
				it("it should not have an update link", function() {
					expect(this.publishResult.findLinks("update").length).toEqual(0);
				});

				// 4. Any of the forms in the published set can be chosen to fill in, at which point a copy of the form is made and placed into the working set.

				describe("and I fill in the form", function() {

					before(function(done) {
						var context = this;
						this.publishResult.findLink("copy-to-working").follow(function(err, result) {
							result.findLink("execute-copy").follow(result.repr.data.command, function(err, result) {
								expect(err).toBeNull();
								var data = result.repr.data;
								data.items[0].value = "Jon Brown";
								data.items[1].value = 85;
								context.workingResult = result;
								result.findLink("add-version").follow(data, function(err, result) {
									data.items[1].value = 86;
									result.findLink("add-version").follow(data, function(err, result) {
										done();
									});
								});
							});
						});
					});
				
					it("the filled set should now contain the working form", function(done) {
						var filledFormPath = this.workingResult.findLink("self").path;
						this.setGetLinks.working.follow(function(err, result) {
							expect(result.findLinks("item", filledFormPath).length).toEqual(1);
							done();
						});
					});

					it("the filled form should have the data", function(done) {
						this.workingResult.findLink("self").follow(function(err, result) {
							expect(result.repr.data.items[0].value).toEqual("Jon Brown");
							expect(result.repr.data.items[1].value).toEqual(86);
							done();
						});
					});

					// "4.a. Forms in the working set can not be deleted, although they can be moved to the abandoned set."
					it("the filled form should have a move-to-abandoned link", function() {
						expect(this.workingResult.findLinks("move-to-abandoned").length).toEqual(1);
					});

					it("the filled form should not have a deleted link", function() {
						expect(this.workingResult.findLinks("delete").length).toEqual(0);
					});

					//	"4.b. Forms in the working set are also versioned",
					it("the current version of the filled form should have a previous link to the previous version of data", function(done) {
						this.workingResult.findLink("self").follow(function(err, result) {
							result.findLink("previous-version").follow(function(err, result) {
								expect(result.repr.data.items[1].value).toEqual(85);
								done();
							});
						});
					});

					//5. When a form is copied into the working set, it contains a link back to the published form from which it was copied,...
					it("should have a link to the blank form", function() {
						expect(this.workingResult.findLink("blank-form").path).toEqual(this.publishResult.findLink("self").path);
					});

					//5. ...as well as the links to the version of the source form.
					it("should have a link to the source form version", function() {
						expect(this.workingResult.findLink("source-form").path).toEqual(this.publishResult.findLink("original").path);
					});

					// 6. When a filled-in form is ready to submit, it is moved from the working set to the submitted set...

					describe("and I submit the form", function() {

						before(function(done) {
							var context = this;
							context.workingResult.findLink("move-to-submitted").follow(function(err, result) {
								result.findLink("execute-move").follow(result.repr.data.command, function(err, result) {
									if(err) throw new Error(err);
									context.submitResult = result;
									done();
								});
							});
						});

						it("the submitted set should now have the data", function(done) {
							var submittedForm = this.submitResult.findLink("self").path;
							this.setGetLinks.submitted.follow(function(err, result) {
								var submittedItemLinks = result.findLinks("item", submittedForm);
								expect(submittedItemLinks.length).toEqual(1);
								if(submittedItemLinks.length == 1) {
									submittedItemLinks[0].follow(function(err, result) {
										expect(result.repr.data).toMatch({ items : [ { value : "Jon Brown" } ], name: "my first form" });
										done();
									});
								} else done();
							});
						});
					
						// 6. ...The existing links back to source forms are retained.

						it("it should have a link back to the blank form", function() {
							expect(this.submitResult.findLink("blank-form").path).toEqual(this.publishResult.findLink("self").path);
						});

						// 7. A form in the submitted ... sets is immutable ...
						it("it should have no update link", function() {
							expect(this.submitResult.findLinks("update").length).toEqual(0);
						});

					});

					// 7. A form in the ... abandoned sets is immutable

					describe("and I abandon the form", function() {

						before(function(done) {
							var context = this;
							context.workingResult.findLink("move-to-abandoned").follow(function(err, result) {
								result.findLink("execute-move").follow(result.repr.data.command, function(err, result) {
									if(err) throw new Error(err);
									context.abandonResult = result;
									done();
								});
							});
						});

						it("it should have no update link", function() {
							expect(this.abandonResult.findLinks("update").length).toEqual(0);
						});

					});
		
				});
			});

		});


	});

});