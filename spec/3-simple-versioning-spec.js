var utils = require("./utils/utils"),
	buster = require("buster")
	;

buster.spec.expose();


/*
	From a versioned-set one can:
		- get a versioned item - T
		- create a versioned item - T
	From a versioned-item one can:
		- see the data of the latest version - T
		- get the item's version item - T
		- get the previous-version item (if any) - T
		- delete the versioned-item (all versions) - T
		- add a version - T
		- get the versions - T
		- NOT update - T
	From the versions
		- get a version - T
		- get the latest version - T
		- NOT create a version - T
	From a versioned-item
		- see the data of the latest version - T
		- get the previous version (if any) - T
		- get the next version (if any) - T
		- delete this version - T
		- get the versions - T
		- NOT update - T
*/

describe("Given versioned config and repo", function() {

	before(function() {
		require("./utils/test-repo").flush();
		utils.GivenRepoAndConfig.call(this, "simple-versioned");
	});

	describe("When initialised", function() {
		// regression checks
		before(function(done) {
			var context = this;
			this.savedSetResult = this.setGetLinks["saved"].follow(function(err, result) {
				context.savedResult = result;
				done();
			});
		});

		it("all sets should still have a create link", function() {
			expect(this.savedResult.repr.findLink("create")).toBeDefined();
		});

	});

	describe("When new item added to versioned set and self link is followed", function() {

		before(function(done) {
			this.v1data = { "place" : "bo" };
			var context = this;
			this.setGetLinks["saved"].follow(function(err, result) {
				result.findLink("create").follow(context.v1data, function(err, result) {
					result.findLink("self").follow(function(err, result) {
						context.v1result = result;
						done();
					});
				});
			});
		});

		it("it's set should have an item link", function(done) {
			var expectedPath = this.v1result.repr.name;
			this.setGetLinks["saved"].follow(function(err, result) {
				expect(result.findLink("item").path).toEqual(expectedPath);
				done();
			});
		});

		it("it should contain the data of the item", function() {
			expect(this.v1result.repr.data).toMatch(this.v1data);
		});
		
		it("it should not have an update link", function() {
			expect(this.v1result.findLinks("update").length).toEqual(0);
		});
		
		it("it should have an add-version link", function() {
			expect(this.v1result.findLinks("add-version").length).toEqual(1);
		});

		it("it should have a delete link", function() {
			expect(this.v1result.findLinks("delete").length).toEqual(1);
		});

		it("it should have a versions link", function() {
			expect(this.v1result.findLinks("versions").length).toEqual(1);
		});

		it("it should have a version link", function() {
			expect(this.v1result.findLinks("version").length).toEqual(1);
		});

		it("it shouldn't have a previous-version link", function() {
			expect(this.v1result.findLinks("previous-version").length).toEqual(0);
		});

		describe("and the add-version link is followed", function() {

			before(function(done) {
				var context = this;
				this.v2data = { "place" : "peep" };
				this.v1result.findLink("add-version").follow(this.v2data, function(err, result) { context.v2result = result; done(); });
			});

			it("it should have returned 201 CREATED", function() {
				expect(this.v2result.status).toEqual(201);
			});

			it("its set link should link to the versioned set", function() {
				expect(this.v2result.findLink("set").path).toEqual(this.setGetLinks["saved"].path);
			});

			it("it should have a versions link to the versions set with two item-versions in it", function(done) {
				this.v2result.findLink("versions").follow(function(err, result) {
					expect(result.findLinks("item-version").length).toEqual(2);
					done();
				});
			});

			it("it should have a delete link", function() {
				expect(this.v2result.findLinks("delete").length).toEqual(1);
			});

			it("it should have an add-version link", function() {
				expect(this.v2result.findLinks("add-version").length).toEqual(1);
			});

			it("it should have a previous-version link to v1's version", function(done) {
				var expected = this.v1data;
				this.v2result.findLink("previous-version").follow(function(err, result) {
					expect(result.repr.data).toMatch(expected);
					done();
				});
			});

			it("v1 should have a next-version link to v2", function(done) {
				var expected = this.v2result.findLink("version").path;
				this.v1result.findLink("version").follow(function(err, result) {
					expect(result.findLink("next-version").path).toEqual(expected);
					done();
				});
			});

			describe("and the add-version link is followed again", function() {

				before(function(done) {
					var context = this;
					this.v3data = { "place" : "little" };
					this.v2result.findLink("add-version").follow(this.v3data, function(err, result) { context.v3result = result; done(); });
				});

				describe("and the previous version of the item is deleted", function() {

					before(function(done) {
						var context = this;
						this.v3result.findLink("previous-version").follow(function(err, result) {
							result.findLink("delete").follow(function(err, result) { done(); });
						});
					});

					it("v3 should now have a previous-version link to v1", function(done) {
						var expected = this.v1result.findLink("version").path;
						this.v3result.findLink("version").follow(function(err, result) {
							expect(result.findLink("previous-version").path).toEqual(expected);
							done();
						});
					});

					it("v1 should now have a next-version link to v3", function(done) {
						var expected = this.v3result.findLink("version").path;
						this.v1result.findLink("version").follow(function(err, result) {
							expect(result.findLink("next-version").path).toEqual(expected);
							done();
						});
					});

				});

			});

		});

		describe("and delete link is followed", function() {

			before(function(done) {
				var context = this;
				this.v1result.findLink("delete").follow(function(err, result) {
					context.deleteResult = result;
					done();
				});
			});

			it("it should have returned 200 OK", function() {
				expect(this.deleteResult.status).toEqual(200);
			});

			it("it's set should no longer have the link", function(done) {
				this.setGetLinks["saved"].follow(function(err, result) {
					expect(result.findLink("item").path).toBeFalsy();
					done();
				});
			});

			it("the versions set should no longer contain any items", function(done) {
				this.v1result.findLink("versions").follow(function(err, result) {
					expect(result.findLinks("item-version").length).toEqual(0);
					done();
				});
			});

		});

		describe("and the versions link is followed", function() {

			before(function(done) {
				var context = this;
				this.v1result.findLink("versions").follow(function(err, result) { context.versionsResult = result; done(); });
			});

			it("it should have one item-version", function() {
				expect(this.versionsResult.findLinks("item-version").length).toEqual(1);
			});

			it("it should have one latest version with the correct data", function(done) {
				var expected = this.v1data;
				expect(this.versionsResult.findLinks("latest-version").length).toEqual(1);
				this.versionsResult.findLink("latest-version").follow(function(err, result) {
					expect(result.repr.data).toMatch(expected);
					done();
				});
			});

			it("it should not have a create link", function() {
				expect(this.versionsResult.findLinks("create").length).toEqual(0);
			});
		});

		describe("and the version link is followed", function() {

			before(function(done) {
				var context = this;
				this.v1result.findLink("version").follow(function(err, result) { context.versionResult = result; done(); });
			});

			it("it should have the correct data", function() {
				expect(this.versionResult.repr.data).toMatch(this.v1data);
			});

			it("it should have a versions link to the item versions set", function() {
				expect(this.versionResult.findLink("versions").path).toEqual(this.v1result.findLink("versions").path);
			});

			it("it should not have an update link", function() {
				expect(this.versionResult.findLinks("update").length).toEqual(0);
			});
		});

		describe("and the add-version link is followed repeatedly 10 times", function() {

			before(function(done) {
				var context = this;
				var currentResult = this.v1result;
				var count = 0;
				utils.repeat(10, function(next) {
					count++;
					currentResult.findLink("add-version").follow(count, function(err, result) { currentResult = result; next(); });
				}, function() {
					context.lastResult = currentResult;
					done();
				});
			});

			it("if should have the versions in the correct order", function(done) {
				var currentResult = this.lastResult;
				var actual = [];
				utils.repeat(10, function(next) {
					actual.push(currentResult.repr.data);
					currentResult.repr.findLink("previous-version").follow(function(err, result) { currentResult = result; next(); });
				}, function() {
					expect(actual).toMatch([10,9,8,7,6,5,4,3,2,1]);
					done();
				});
			});
		});

	});

});