var utils = require("./utils/utils"),
	buster = require("buster")
	;

buster.spec.expose();

describe("Given versioned config and repo", function() {

	before(function() {
		require("./utils/test-repo").flush();
		utils.GivenRepoAndConfig.call(this, "simple-versioned");
	});

	function buildMySetGetLinks() {
		var ret = {};
		for(var i = 0; i < this.sets.links.length; i++) ret[this.sets.links[i].path] = this.sets.links[i];
		return ret;
	}

	describe("When initialised", function() {
		// regression checks
		before(function(done) {
			this.setGetLinks = buildMySetGetLinks.call(this);
			var context = this;
			this.savedSetResult = this.setGetLinks["saved"].follow(function(err, result) {
				context.savedResult = result;
				done();
			});
		});

		it("all sets should still have a create link", function() {
			expect(this.savedResult.repr.findLink("create").path).toBeDefined();
		});

	});

	describe("When new item added to versioned set and self link is followed", function() {

		before(function(done) {
			this.setGetLinks = buildMySetGetLinks.call(this);
			this.item = { "place" : "bo" };
			var context = this;
			this.setGetLinks["saved"].follow(function(err, result) {
				result.repr.findLink("create").follow(context.item, function(err, result) {
					result.repr.findLink("self").follow(function(err, result) {
						context.v1result = result;
						done();
					});
				});
			});
		});

		it("it should not have an update link", function() {
			expect(this.v1result.findLink("update").rel).toEqual("nothing");
		});
		
		it("it should have an add-version link", function() {
			expect(this.v1result.repr.findLink("add-version").rel).toEqual("add-version");
		});

		describe("and when add-version is followed", function() {

			before(function(done) {
				var context = this;
				this.v2 = { "place" : "bum" };
				this.v1result.findLink("add-version").follow(this.v2, function(err, result) {
					result.findLink("self").follow(function(err, result) {
						context.v2result = result;
						done();
					});
				});
			});

			it("it should link to v1 as previous-version", function() {
				var prevLink = this.v2result.findLink("previous-version");
				expect(prevLink.path).toBeDefined();

				var v1Link = this.v1result.findLink("self");
				expect(prevLink.path).toEqual(v1Link.path);
			});

			describe("and when previous-version is followed, then next-version is followed", function() {

				before(function(done) {
					var context = this;

					this.v2result.findLink("previous-version").follow(function(err, result) {
						result.findLink("next-version").follow(function(err, result) {
							context.finalResult = result;
							done();
						});
					});
				
				});

				it("it should return v2", function() {
					expect(this.v2result.findLink("self").rel).not.toEqual("nothing");
					expect(this.finalResult.findLink("self").path).toBeDefined();
					expect(this.finalResult.findLink("self").path).toEqual(this.v2result.findLink("self").path);
				});
			});

			describe("and when add-version is followed again, v2 is deleted, and v3 && v1 are requeried", function() {

				before(function(done) {
					var context = this;
					// add v3
					this.v2result.findLink("add-version").follow({ "yo" : "momma" }, function(err, result) {
						context.v3result = result;
						// delete v2
						context.v2result.findLink("delete").follow(function(err, result) {
							// reload v3
							context.v3result.findLink("self").follow(function(err, result) {
								context.v3result2 = result;
								// reload v1
								context.v1result.findLink("self").follow(function(err, result) {
									context.v1result2 = result;
									done();
								});
							});
						});
					});
				});

				it("v3 should have previous-version link to v1", function() {
					var v3prevLink = this.v3result2.findLink("previous-version");
					var v1selfLink = this.v1result2.findLink("self");
					expect(v3prevLink.path).toEqual(v1selfLink.path);
				});

				it("v1 should have next-version link to v3", function() {
					var v1nextLink = this.v1result2.findLink("next-version");
					var v3selfLink = this.v3result2.findLink("self");
					expect(v1nextLink.path).toEqual(v3selfLink.path);
				});

			});

		});

	});

});